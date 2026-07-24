import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import { env } from "./config.js";
import { errorHandler } from "./lib.js";
import { router } from "./routes.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",") }));
app.use(express.json({ limit: "1mb" }));
app.use(pinoHttp());
app.use(rateLimit({ windowMs: 60_000, limit: 200, standardHeaders: "draft-8" }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup({
    openapi: "3.1.0",
    info: { title: "Trimly API", version: "1.0.0" },
    servers: [{ url: "/api" }],
    paths: {
      "/auth/register": { post: { summary: "Create an account" } },
      "/auth/login": { post: { summary: "Sign in" } },
      "/salons": {
        get: { summary: "Discover salons" },
        post: { summary: "Create a salon" },
      },
      "/availability": { get: { summary: "Get available appointment slots" } },
      "/bookings": {
        get: { summary: "List bookings" },
        post: { summary: "Create a booking" },
      },
    },
  }),
);
app.use("/api", router);
app.use(errorHandler);
