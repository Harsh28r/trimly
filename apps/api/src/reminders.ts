import { Booking } from "./models.js";
import { notify } from "./lib.js";

export async function sendDueReminders() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const inTwentyFiveHours = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  const bookings = await Booking.find({
    status: "confirmed",
    startAt: { $gte: tomorrow, $lt: inTwentyFiveHours },
    reminderSentAt: { $exists: false },
  }).populate("salon", "name");
  for (const booking of bookings) {
    await notify(
      booking.customer,
      "Appointment tomorrow",
      `Your appointment at ${booking.salon.name} is in about 24 hours.`,
      { bookingId: String(booking._id) },
    );
    booking.reminderSentAt = now;
    await booking.save();
  }
}
