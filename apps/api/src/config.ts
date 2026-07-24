import "dotenv/config";
import { z } from "zod";

export const env = z
  .object({
    PORT: z.coerce.number().default(4000),
    USE_MEMORY_DB: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
    MONGODB_URI: z.string().default("mongodb://localhost:27017/trimly"),
    REDIS_URL: z.string().default("redis://localhost:6379"),
    JWT_SECRET: z.string().min(32).default("development-secret-change-me-123456789"),
    EXPO_ACCESS_TOKEN: z.string().optional(),
    CORS_ORIGIN: z.string().default("*"),
  })
  .parse(process.env);
