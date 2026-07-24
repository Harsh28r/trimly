import { createHash, randomBytes } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { env } from "./config.js";
import { Session } from "./models.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: "customer" | "owner" | "barber" };
    }
  }
}

export async function createTokens(user: { _id: unknown; role: string }) {
  const accessToken = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user._id))
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
  const refreshToken = randomBytes(48).toString("base64url");
  await Session.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  return { accessToken, refreshToken };
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "Authentication required" });
    const { payload } = await jwtVerify(token, secret);
    req.auth = {
      userId: String(payload.sub),
      role: payload.role as "customer" | "owner" | "barber",
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export const allowRoles =
  (...roles: Array<"customer" | "owner" | "barber">) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ error: "You do not have permission for this action" });
    }
    next();
  };
