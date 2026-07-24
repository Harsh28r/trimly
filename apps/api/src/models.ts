import mongoose, { type InferSchemaType, type Model } from "mongoose";

const { Schema, model, models } = mongoose;

const baseOptions = { timestamps: true, versionKey: false } as const;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["customer", "owner", "barber"], default: "customer" },
    avatar: String,
    expoPushToken: String,
  },
  baseOptions,
);

const salonSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    timezone: { type: String, default: "Asia/Kolkata" },
    phone: { type: String, required: true },
    images: [String],
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  baseOptions,
);
salonSchema.index({ location: "2dsphere" });
salonSchema.index({ name: "text", description: "text", city: "text" });

const serviceSchema = new Schema(
  {
    salon: { type: Schema.Types.ObjectId, ref: "Salon", required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    durationMinutes: { type: Number, required: true },
    bufferMinutes: { type: Number, default: 0 },
    price: { type: Number, required: true },
    active: { type: Boolean, default: true },
  },
  baseOptions,
);

const hoursSchema = new Schema(
  {
    day: { type: Number, min: 0, max: 6, required: true },
    open: { type: String, default: "09:00" },
    close: { type: String, default: "18:00" },
    enabled: { type: Boolean, default: true },
  },
  { _id: false },
);

const staffSchema = new Schema(
  {
    salon: { type: Schema.Types.ObjectId, ref: "Salon", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    title: { type: String, default: "Stylist" },
    avatar: String,
    services: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    workingHours: { type: [hoursSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  baseOptions,
);

const timeOffSchema = new Schema(
  {
    staff: { type: Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    reason: String,
  },
  baseOptions,
);

const bookingSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    salon: { type: Schema.Types.ObjectId, ref: "Salon", required: true, index: true },
    staff: { type: Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    service: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "no-show"],
      default: "pending",
      index: true,
    },
    price: { type: Number, required: true },
    notes: String,
    cancellationReason: String,
    reminderSentAt: Date,
  },
  baseOptions,
);
bookingSchema.index(
  { staff: 1, startAt: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "confirmed"] } } },
);

const favoriteSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    salon: { type: Schema.Types.ObjectId, ref: "Salon", required: true },
  },
  baseOptions,
);
favoriteSchema.index({ user: 1, salon: 1 }, { unique: true });

const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    salon: { type: Schema.Types.ObjectId, ref: "Salon", required: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },
  },
  baseOptions,
);
reviewSchema.index({ user: 1, booking: 1 }, { unique: true });

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: Schema.Types.Mixed,
    readAt: Date,
  },
  baseOptions,
);

const sessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  baseOptions,
);

export const User = (models.User ?? model("User", userSchema)) as Model<any>;
export const Salon = (models.Salon ?? model("Salon", salonSchema)) as Model<any>;
export const Service = (models.Service ?? model("Service", serviceSchema)) as Model<any>;
export const Staff = (models.Staff ?? model("Staff", staffSchema)) as Model<any>;
export const TimeOff = (models.TimeOff ?? model("TimeOff", timeOffSchema)) as Model<any>;
export const Booking = (models.Booking ?? model("Booking", bookingSchema)) as Model<any>;
export const Favorite = (models.Favorite ?? model("Favorite", favoriteSchema)) as Model<any>;
export const Review = (models.Review ?? model("Review", reviewSchema)) as Model<any>;
export const Notification = (models.Notification ?? model("Notification", notificationSchema)) as Model<any>;
export const Session = (models.Session ?? model("Session", sessionSchema)) as Model<any>;

export type BookingDocument = InferSchemaType<typeof bookingSchema>;
