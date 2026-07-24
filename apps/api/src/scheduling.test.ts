import { describe, expect, it } from "vitest";
import { buildSlots, overlaps } from "./scheduling.js";

describe("appointment scheduling", () => {
  it("detects partial and containing overlaps but allows touching intervals", () => {
    const busy = [{ startAt: "2030-01-01T10:00:00.000Z", endAt: "2030-01-01T11:00:00.000Z" }];
    expect(overlaps(new Date("2030-01-01T09:30:00Z"), new Date("2030-01-01T10:30:00Z"), busy)).toBe(true);
    expect(overlaps(new Date("2030-01-01T09:00:00Z"), new Date("2030-01-01T12:00:00Z"), busy)).toBe(true);
    expect(overlaps(new Date("2030-01-01T11:00:00Z"), new Date("2030-01-01T11:30:00Z"), busy)).toBe(false);
  });

  it("builds 30-minute-start slots and removes conflicting times", () => {
    const slots = buildSlots(
      new Date("2030-01-01T09:00:00Z"),
      new Date("2030-01-01T12:00:00Z"),
      60,
      [{ startAt: "2030-01-01T10:00:00Z", endAt: "2030-01-01T10:30:00Z" }],
      new Date("2029-12-31T00:00:00Z"),
    );
    expect(slots.map((slot) => slot.startAt)).toEqual([
      "2030-01-01T09:00:00.000Z",
      "2030-01-01T10:30:00.000Z",
      "2030-01-01T11:00:00.000Z",
    ]);
  });
});
