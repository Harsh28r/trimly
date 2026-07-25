import { z } from "zod";

export const roleSchema = z.enum(["customer", "owner", "barber"]);
export type Role = z.infer<typeof roleSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
  role: roleSchema.default("customer"),
});

export const loginSchema = registerSchema.pick({ email: true, password: true });

export const salonSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().max(1000).default(""),
  address: z.string().trim().min(5).max(240),
  city: z.string().trim().min(2).max(80),
  timezone: z.string().default("Asia/Kolkata"),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s()-]/g, ""))
    .pipe(z.string().min(7).max(20)),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  images: z.array(z.string().url()).max(8).default([]),
});

export const serviceSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(400).default(""),
  durationMinutes: z.number().int().min(10).max(480),
  bufferMinutes: z.number().int().min(0).max(60).default(0),
  price: z.number().min(0),
});

export const bookingSchema = z.object({
  salonId: z.string().min(1),
  staffId: z.string().min(1),
  serviceId: z.string().min(1),
  startAt: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(800).default(""),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SalonInput = z.infer<typeof salonSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
