import argon2 from "argon2";
import { Booking, Salon, Service, Staff, User } from "./models.js";

export async function seedDemoData({ reset = false } = {}) {
  if (!reset && (await User.exists({ email: "owner@trimly.test" }))) return;

  await Promise.all([
    Booking.deleteMany({}),
    Staff.deleteMany({}),
    Service.deleteMany({}),
    Salon.deleteMany({}),
    User.deleteMany({ email: /@trimly\.test$/ }),
  ]);

  const passwordHash = await argon2.hash("Password123!");
  const [customer, owner] = await User.create([
    { name: "Aarav Customer", email: "customer@trimly.test", passwordHash, role: "customer" },
    { name: "Maya Owner", email: "owner@trimly.test", passwordHash, role: "owner" },
  ]);

  const salon = await Salon.create({
    owner: owner._id,
    name: "The Yellow Chair",
    description: "Sharp cuts, warm service, zero waiting.",
    address: "12 Indiranagar Main Road",
    city: "Bengaluru",
    timezone: "Asia/Kolkata",
    phone: "+91 98765 43210",
    images: [
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200",
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200",
    ],
    location: { type: "Point", coordinates: [77.6408, 12.9784] },
    rating: 4.9,
    reviewCount: 128,
  });

  const services = await Service.create([
    {
      salon: salon._id,
      name: "Signature Haircut",
      description: "Consultation, wash, cut and finish",
      durationMinutes: 45,
      bufferMinutes: 15,
      price: 699,
    },
    {
      salon: salon._id,
      name: "Beard Sculpt",
      description: "Shape, hot towel and conditioning",
      durationMinutes: 30,
      bufferMinutes: 0,
      price: 399,
    },
  ]);

  await Staff.create({
    salon: salon._id,
    name: "Kabir",
    title: "Senior Stylist",
    services: services.map((service: { _id: unknown }) => service._id),
    avatar: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400",
    workingHours: Array.from({ length: 7 }, (_, day) => ({
      day,
      open: "09:00",
      close: "19:00",
      enabled: day !== 1,
    })),
  });

  return { customer: customer.email, owner: owner.email, password: "Password123!" };
}
