import { Router } from "express";
import argon2 from "argon2";
import { fromZonedTime } from "date-fns-tz";
import { z } from "zod";
import {
  bookingSchema,
  loginSchema,
  registerSchema,
  reviewSchema,
  salonSchema,
  serviceSchema,
} from "@trimly/contracts";
import { allowRoles, createTokens, hashToken, requireAuth } from "./auth.js";
import { asyncHandler, notify, redis, validate, withLock } from "./lib.js";
import {
  Booking,
  Favorite,
  Notification,
  Review,
  Salon,
  Service,
  Session,
  Staff,
  TimeOff,
  User,
} from "./models.js";
import { buildSlots, type Interval } from "./scheduling.js";

export const router = Router();
const id = z.string().regex(/^[a-f\d]{24}$/i);

router.post(
  "/auth/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const exists = await User.exists({ email: req.body.email });
    if (exists) return res.status(409).json({ error: "Email is already registered" });
    const user = await User.create({
      ...req.body,
      passwordHash: await argon2.hash(req.body.password),
      password: undefined,
    });
    const tokens = await createTokens(user);
    res.status(201).json({ user: publicUser(user), ...tokens });
  }),
);

router.post(
  "/auth/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email }).select("+passwordHash");
    if (!user || !(await argon2.verify(user.passwordHash, req.body.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const tokens = await createTokens(user);
    res.json({ user: publicUser(user), ...tokens });
  }),
);

router.post(
  "/auth/refresh",
  asyncHandler(async (req, res) => {
    const refreshToken = z.string().min(20).parse(req.body.refreshToken);
    const session = await Session.findOneAndDelete({
      tokenHash: hashToken(refreshToken),
      expiresAt: { $gt: new Date() },
    });
    if (!session) return res.status(401).json({ error: "Invalid refresh token" });
    const user = await User.findById(session.user);
    if (!user) return res.status(401).json({ error: "User no longer exists" });
    res.json(await createTokens(user));
  }),
);

router.use(requireAuth);

router.get(
  "/me",
  asyncHandler(async (req, res) => {
    res.json(await User.findById(req.auth!.userId).select("-passwordHash"));
  }),
);

router.patch(
  "/me/push-token",
  asyncHandler(async (req, res) => {
    const expoPushToken = z.string().max(200).nullable().parse(req.body.expoPushToken);
    await User.findByIdAndUpdate(req.auth!.userId, { expoPushToken });
    res.status(204).send();
  }),
);

router.get(
  "/salons",
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        q: z.string().optional(),
        city: z.string().optional(),
        lat: z.coerce.number().optional(),
        lng: z.coerce.number().optional(),
        radiusKm: z.coerce.number().min(1).max(100).default(25),
      })
      .parse(req.query);
    const filter: Record<string, unknown> = { active: true };
    if (query.q) filter.$text = { $search: query.q };
    if (query.city) filter.city = new RegExp(query.city, "i");
    if (query.lat != null && query.lng != null) {
      filter.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [query.lng, query.lat] },
          $maxDistance: query.radiusKm * 1000,
        },
      };
    }
    res.json(await Salon.find(filter).sort({ rating: -1 }).limit(50).lean());
  }),
);

router.get(
  "/salons/:salonId",
  asyncHandler(async (req, res) => {
    const salonId = id.parse(req.params.salonId);
    const [salon, services, staff, reviews] = await Promise.all([
      Salon.findById(salonId).lean(),
      Service.find({ salon: salonId, active: true }).lean(),
      Staff.find({ salon: salonId, active: true }).lean(),
      Review.find({ salon: salonId }).populate("user", "name avatar").sort({ createdAt: -1 }).limit(20),
    ]);
    if (!salon) return res.status(404).json({ error: "Salon not found" });
    res.json({ salon, services, staff, reviews });
  }),
);

router.post(
  "/salons",
  allowRoles("owner"),
  validate(salonSchema),
  asyncHandler(async (req, res) => {
    const { latitude, longitude, ...data } = req.body;
    const salon = await Salon.create({
      ...data,
      owner: req.auth!.userId,
      location: { type: "Point", coordinates: [longitude, latitude] },
    });
    res.status(201).json(salon);
  }),
);

router.patch(
  "/salons/:salonId",
  allowRoles("owner"),
  asyncHandler(async (req, res) => {
    const salonId = id.parse(req.params.salonId);
    const parsed = salonSchema.partial().parse(req.body);
    const { latitude, longitude, ...data } = parsed;
    const update: Record<string, unknown> = data;
    if (latitude != null && longitude != null) {
      update.location = { type: "Point", coordinates: [longitude, latitude] };
    }
    const salon = await Salon.findOneAndUpdate(
      { _id: salonId, owner: req.auth!.userId },
      update,
      { new: true },
    );
    if (!salon) return res.status(404).json({ error: "Salon not found" });
    res.json(salon);
  }),
);

router.get(
  "/owner/salons",
  allowRoles("owner", "barber"),
  asyncHandler(async (req, res) => {
    res.json(await Salon.find({ owner: req.auth!.userId }).lean());
  }),
);

router.post(
  "/salons/:salonId/services",
  allowRoles("owner"),
  validate(serviceSchema),
  asyncHandler(async (req, res) => {
    const salon = await ownedSalon(req.params.salonId, req.auth!.userId);
    res.status(201).json(await Service.create({ ...req.body, salon: salon._id }));
  }),
);

router.patch(
  "/services/:serviceId",
  allowRoles("owner"),
  asyncHandler(async (req, res) => {
    const service = await Service.findById(id.parse(req.params.serviceId));
    if (!service) return res.status(404).json({ error: "Service not found" });
    await ownedSalon(String(service.salon), req.auth!.userId);
    Object.assign(service, serviceSchema.partial().parse(req.body));
    await service.save();
    res.json(service);
  }),
);

const staffInput = z.object({
  name: z.string().min(2).max(80),
  title: z.string().max(80).default("Stylist"),
  avatar: z.string().url().optional(),
  services: z.array(id).default([]),
  workingHours: z
    .array(
      z.object({
        day: z.number().int().min(0).max(6),
        open: z.string().regex(/^\d\d:\d\d$/),
        close: z.string().regex(/^\d\d:\d\d$/),
        enabled: z.boolean().default(true),
      }),
    )
    .default([]),
});

router.post(
  "/salons/:salonId/staff",
  allowRoles("owner"),
  validate(staffInput),
  asyncHandler(async (req, res) => {
    const salon = await ownedSalon(req.params.salonId, req.auth!.userId);
    res.status(201).json(await Staff.create({ ...req.body, salon: salon._id }));
  }),
);

router.patch(
  "/staff/:staffId",
  allowRoles("owner", "barber"),
  asyncHandler(async (req, res) => {
    const staff = await Staff.findById(id.parse(req.params.staffId));
    if (!staff) return res.status(404).json({ error: "Staff member not found" });
    await ownedSalon(String(staff.salon), req.auth!.userId);
    Object.assign(staff, staffInput.partial().parse(req.body));
    await staff.save();
    res.json(staff);
  }),
);

router.post(
  "/staff/:staffId/time-off",
  allowRoles("owner", "barber"),
  asyncHandler(async (req, res) => {
    const staff = await Staff.findById(id.parse(req.params.staffId));
    if (!staff) return res.status(404).json({ error: "Staff member not found" });
    await ownedSalon(String(staff.salon), req.auth!.userId);
    const input = z
      .object({ startAt: z.coerce.date(), endAt: z.coerce.date(), reason: z.string().max(200).optional() })
      .refine((value) => value.endAt > value.startAt, "End must be after start")
      .parse(req.body);
    res.status(201).json(await TimeOff.create({ ...input, staff: staff._id }));
  }),
);

router.get(
  "/availability",
  asyncHandler(async (req, res) => {
    const query = z
      .object({ staffId: id, serviceId: id, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
      .parse(req.query);
    const cacheKey = `availability:${query.staffId}:${query.serviceId}:${query.date}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch {}
    const slots = await getAvailability(query.staffId, query.serviceId, query.date);
    try {
      await redis.set(cacheKey, JSON.stringify(slots), "EX", 30);
    } catch {}
    res.json(slots);
  }),
);

router.post(
  "/bookings",
  allowRoles("customer"),
  validate(bookingSchema),
  asyncHandler(async (req, res) => {
    const startAt = new Date(req.body.startAt);
    const result = await withLock(
      `booking:${req.body.staffId}:${startAt.toISOString()}`,
      async () => {
        const [staff, service, salon] = await Promise.all([
          Staff.findOne({ _id: req.body.staffId, salon: req.body.salonId, active: true }),
          Service.findOne({ _id: req.body.serviceId, salon: req.body.salonId, active: true }),
          Salon.findOne({ _id: req.body.salonId, active: true }),
        ]);
        if (!staff || !service || !salon) {
          throw Object.assign(new Error("Invalid salon, staff, or service"), { status: 404 });
        }
        if (!staff.services.some((value: unknown) => String(value) === String(service._id))) {
          throw Object.assign(new Error("This staff member does not offer that service"), { status: 422 });
        }
        const endAt = new Date(startAt.getTime() + (service.durationMinutes + service.bufferMinutes) * 60_000);
        const overlap = await Booking.exists({
          staff: staff._id,
          status: { $in: ["pending", "confirmed"] },
          startAt: { $lt: endAt },
          endAt: { $gt: startAt },
        });
        const available = (await getAvailability(String(staff._id), String(service._id), startAt.toISOString().slice(0, 10)))
          .some((slot) => slot.startAt === startAt.toISOString());
        if (overlap || !available) {
          throw Object.assign(new Error("That time is no longer available"), { status: 409 });
        }
        return Booking.create({
          ...req.body,
          customer: req.auth!.userId,
          startAt,
          endAt,
          staff: staff._id,
          service: service._id,
          salon: salon._id,
          price: service.price,
        });
      },
    );
    await notify(req.auth!.userId, "Booking requested", "Your appointment request was sent.", {
      bookingId: String(result._id),
    });
    try {
      await redis.del(
        `availability:${req.body.staffId}:${req.body.serviceId}:${startAt.toISOString().slice(0, 10)}`,
      );
    } catch {}
    res.status(201).json(result);
  }),
);

router.get(
  "/bookings",
  asyncHandler(async (req, res) => {
    const filter =
      req.auth!.role === "customer"
        ? { customer: req.auth!.userId }
        : { salon: { $in: await Salon.find({ owner: req.auth!.userId }).distinct("_id") } };
    res.json(
      await Booking.find(filter)
        .populate("salon", "name address images")
        .populate("staff", "name avatar")
        .populate("service", "name durationMinutes")
        .sort({ startAt: -1 }),
    );
  }),
);

router.patch(
  "/bookings/:bookingId/status",
  asyncHandler(async (req, res) => {
    const status = z.enum(["confirmed", "completed", "cancelled", "no-show"]).parse(req.body.status);
    const booking = await Booking.findById(id.parse(req.params.bookingId));
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (req.auth!.role === "customer") {
      if (String(booking.customer) !== req.auth!.userId || status !== "cancelled") {
        return res.status(403).json({ error: "Customers can only cancel their own booking" });
      }
    } else {
      await ownedSalon(String(booking.salon), req.auth!.userId);
    }
    booking.status = status;
    booking.cancellationReason = req.body.reason;
    await booking.save();
    await notify(booking.customer, `Booking ${status}`, `Your appointment is now ${status}.`, {
      bookingId: String(booking._id),
    });
    res.json(booking);
  }),
);

router.put(
  "/favorites/:salonId",
  allowRoles("customer"),
  asyncHandler(async (req, res) => {
    const favorite = await Favorite.findOneAndUpdate(
      { user: req.auth!.userId, salon: id.parse(req.params.salonId) },
      { $setOnInsert: { user: req.auth!.userId, salon: req.params.salonId } },
      { upsert: true, new: true },
    );
    res.status(201).json(favorite);
  }),
);

router.delete(
  "/favorites/:salonId",
  allowRoles("customer"),
  asyncHandler(async (req, res) => {
    await Favorite.deleteOne({ user: req.auth!.userId, salon: id.parse(req.params.salonId) });
    res.status(204).send();
  }),
);

router.get(
  "/favorites",
  allowRoles("customer"),
  asyncHandler(async (req, res) => {
    res.json(await Favorite.find({ user: req.auth!.userId }).populate("salon"));
  }),
);

router.post(
  "/bookings/:bookingId/review",
  allowRoles("customer"),
  validate(reviewSchema),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findOne({
      _id: id.parse(req.params.bookingId),
      customer: req.auth!.userId,
      status: "completed",
    });
    if (!booking) return res.status(422).json({ error: "Only completed bookings can be reviewed" });
    const review = await Review.create({
      ...req.body,
      user: req.auth!.userId,
      salon: booking.salon,
      booking: booking._id,
    });
    const stats = await Review.aggregate([
      { $match: { salon: booking.salon } },
      { $group: { _id: "$salon", rating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
    ]);
    if (stats[0]) await Salon.findByIdAndUpdate(booking.salon, stats[0]);
    res.status(201).json(review);
  }),
);

router.get(
  "/notifications",
  asyncHandler(async (req, res) => {
    res.json(await Notification.find({ user: req.auth!.userId }).sort({ createdAt: -1 }).limit(100));
  }),
);

router.patch(
  "/notifications/:notificationId/read",
  asyncHandler(async (req, res) => {
    await Notification.updateOne(
      { _id: id.parse(req.params.notificationId), user: req.auth!.userId },
      { readAt: new Date() },
    );
    res.status(204).send();
  }),
);

async function ownedSalon(salonId: unknown, userId: string) {
  const salon = await Salon.findOne({ _id: id.parse(salonId), owner: userId });
  if (!salon) throw Object.assign(new Error("Salon not found or not owned by you"), { status: 404 });
  return salon;
}

function publicUser(user: { toObject(): Record<string, unknown> }) {
  const value = user.toObject();
  delete value.passwordHash;
  return value;
}

export async function getAvailability(staffId: string, serviceId: string, date: string) {
  const [staffResult, serviceResult] = await Promise.all([
    Staff.findById(staffId).lean(),
    Service.findById(serviceId).lean(),
  ]);
  const staff = staffResult as {
    salon: unknown;
    services: unknown[];
    workingHours: Array<{ day: number; open: string; close: string; enabled: boolean }>;
  } | null;
  const service = serviceResult as {
    durationMinutes: number;
    bufferMinutes: number;
  } | null;
  if (!staff || !service || !staff.services.some((value: unknown) => String(value) === serviceId)) return [];
  const salon = (await Salon.findById(staff.salon).select("timezone").lean()) as {
    timezone: string;
  } | null;
  if (!salon) return [];
  const dayStart = new Date(`${date}T12:00:00.000Z`);
  const hours = staff.workingHours.find((value: { day: number }) => value.day === dayStart.getUTCDay());
  if (!hours?.enabled) return [];
  const open = fromZonedTime(`${date} ${hours.open}`, salon.timezone);
  const close = fromZonedTime(`${date} ${hours.close}`, salon.timezone);
  const busy = (await Booking.find({
    staff: staffId,
    status: { $in: ["pending", "confirmed"] },
    startAt: { $lt: close },
    endAt: { $gt: open },
  }).select("startAt endAt").lean()) as unknown as Interval[];
  const off = (await TimeOff.find({
    staff: staffId,
    startAt: { $lt: close },
    endAt: { $gt: open },
  }).select("startAt endAt").lean()) as unknown as Interval[];
  return buildSlots(
    open,
    close,
    service.durationMinutes + service.bufferMinutes,
    [...busy, ...off],
  );
}
