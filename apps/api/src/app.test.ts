import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./app.js";

describe("API", () => {
  it("reports health without database access", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("rejects unauthenticated protected requests", async () => {
    const response = await request(app).get("/api/bookings");
    expect(response.status).toBe(401);
  });
});
