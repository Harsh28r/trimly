import type { NextFunction, Request, Response } from "express";
import { Redis } from "ioredis";
import { ZodError, type ZodType } from "zod";
import { env } from "./config.js";
import { Notification, User } from "./models.js";

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});
redis.on("error", () => undefined);

export const validate =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };

export const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(handler(req, res, next)).catch(next);

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(422).json({ error: "Validation failed", issues: error.flatten() });
  }
  const err = error as { status?: number; message?: string; code?: number };
  if (err.code === 11000) return res.status(409).json({ error: "This record already exists" });
  res.status(err.status ?? 500).json({ error: err.message ?? "Internal server error" });
}

export async function withLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  const token = crypto.randomUUID();
  let locked = false;
  try {
    if (redis.status === "wait") await redis.connect();
    locked = (await redis.set(key, token, "EX", 8, "NX")) === "OK";
  } catch {
    // MongoDB overlap checks remain the fallback when Redis is unavailable locally.
    locked = true;
  }
  if (!locked) throw Object.assign(new Error("This slot is being booked"), { status: 409 });
  try {
    return await task();
  } finally {
    if (redis.status === "ready") {
      await redis.eval(
        "if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end",
        1,
        key,
        token,
      );
    }
  }
}

export async function notify(userId: unknown, title: string, body: string, data: object = {}) {
  await Notification.create({ user: userId, title, body, data });
  const user = (await User.findById(userId).select("expoPushToken").lean()) as {
    expoPushToken?: string;
  } | null;
  if (!user?.expoPushToken) return;
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${env.EXPO_ACCESS_TOKEN}` } : {}),
    },
    body: JSON.stringify({ to: user.expoPushToken, title, body, data, sound: "default" }),
  }).catch(() => undefined);
}
