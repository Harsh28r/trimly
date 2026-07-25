import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import argon2 from "argon2";
import { Booking, Salon, Service, Session, Staff, User } from "./models.js";

const weekHours = () =>
  Array.from({ length: 7 }, (_, day) => ({
    day,
    open: "09:00",
    close: "19:00",
    enabled: day !== 1,
  }));

export type ShopSeed = {
  ownerEmail: string;
  ownerName: string;
  name: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  images: string[];
  /** [lng, lat] — GeoJSON order */
  coordinates: [number, number];
  rating: number;
  reviewCount: number;
  services: Array<{
    name: string;
    description: string;
    durationMinutes: number;
    bufferMinutes: number;
    price: number;
  }>;
  staff: Array<{ name: string; title: string; avatar: string }>;
};

const shopsPath = resolve(dirname(fileURLToPath(import.meta.url)), "../data/shops.json");

export function loadShops(): ShopSeed[] {
  const raw = JSON.parse(readFileSync(shopsPath, "utf8")) as ShopSeed[];
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(`No shops in ${shopsPath}`);
  }
  for (const shop of raw) {
    if (!shop.ownerEmail || !shop.ownerName) {
      throw new Error(`Shop "${shop.name}" needs ownerEmail + ownerName`);
    }
  }
  return raw;
}

function slugEmail(shop: ShopSeed, index: number) {
  return shop.ownerEmail.trim().toLowerCase() || `owner${index + 1}@trimly.test`;
}

export async function seedDemoData({ reset = false } = {}) {
  if (!reset && (await User.exists({ email: "customer@trimly.test" }))) return;

  const shops = loadShops();

  await Promise.all([
    Booking.deleteMany({}),
    Staff.deleteMany({}),
    Service.deleteMany({}),
    Salon.deleteMany({}),
    Session.deleteMany({}),
    User.deleteMany({ email: /@trimly\.test$/ }),
  ]);

  const passwordHash = await argon2.hash("Password123!");
  const customer = await User.create({
    name: "Aarav Customer",
    email: "customer@trimly.test",
    passwordHash,
    role: "customer",
  });

  const owners: Array<{ shop: string; email: string }> = [];

  for (const [index, shop] of shops.entries()) {
    const owner = await User.create({
      name: shop.ownerName,
      email: slugEmail(shop, index),
      passwordHash,
      role: "owner",
    });

    const salon = await Salon.create({
      owner: owner._id,
      name: shop.name,
      description: shop.description,
      address: shop.address,
      city: shop.city,
      timezone: "Asia/Kolkata",
      phone: shop.phone,
      images: shop.images,
      location: { type: "Point", coordinates: shop.coordinates },
      rating: shop.rating,
      reviewCount: shop.reviewCount,
    });

    const services = await Service.create(
      shop.services.map((service) => ({ ...service, salon: salon._id })),
    );

    await Staff.create(
      shop.staff.map((person) => ({
        salon: salon._id,
        name: person.name,
        title: person.title,
        avatar: person.avatar,
        services: services.map((service) => service._id),
        workingHours: weekHours(),
      })),
    );

    owners.push({ shop: shop.name, email: owner.email });
  }

  return {
    customer: customer.email,
    password: "Password123!",
    shopsFile: shopsPath,
    owners,
  };
}
