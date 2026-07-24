export type Interval = { startAt: Date | string; endAt: Date | string };

export function overlaps(start: Date | number, end: Date | number, intervals: Interval[]) {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  return intervals.some(
    (interval) =>
      new Date(interval.startAt).getTime() < endMs &&
      new Date(interval.endAt).getTime() > startMs,
  );
}

export function buildSlots(
  open: Date,
  close: Date,
  durationMinutes: number,
  blocked: Interval[],
  now = new Date(),
) {
  const duration = durationMinutes * 60_000;
  const slots: Array<{ startAt: string; endAt: string }> = [];
  for (let time = open.getTime(); time + duration <= close.getTime(); time += 30 * 60_000) {
    const end = time + duration;
    if (time > now.getTime() && !overlaps(time, end, blocked)) {
      slots.push({ startAt: new Date(time).toISOString(), endAt: new Date(end).toISOString() });
    }
  }
  return slots;
}
