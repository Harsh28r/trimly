import mongoose from "mongoose";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { app } from "./app.js";
import { env } from "./config.js";
import { seedDemoData } from "./demo-data.js";
import { sendDueReminders } from "./reminders.js";

let stopMemoryDatabase: (() => Promise<boolean>) | undefined;
let mongoUri = env.MONGODB_URI;

if (env.USE_MEMORY_DB) {
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const dbPath = resolve(process.cwd(), ".cache", `mongodb-data-${process.pid}`);
  await mkdir(dbPath, { recursive: true });
  const memoryDatabase = await MongoMemoryServer.create({ instance: { dbPath } });
  mongoUri = memoryDatabase.getUri("trimly");
  stopMemoryDatabase = () => memoryDatabase.stop();
}

await mongoose.connect(mongoUri);
if (env.USE_MEMORY_DB) {
  console.log("Using an in-memory MongoDB instance (data resets when the API stops)");
  console.log("Seeded Trimly", await seedDemoData());
}

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Trimly API listening on http://localhost:${env.PORT}`);
});
const reminderTimer = setInterval(() => void sendDueReminders(), 15 * 60 * 1000);
void sendDueReminders();

const shutdown = async () => {
  clearInterval(reminderTimer);
  server.close();
  await mongoose.disconnect();
  await stopMemoryDatabase?.();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
