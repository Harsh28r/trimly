import mongoose from "mongoose";
import { env } from "./config.js";
import { seedDemoData } from "./demo-data.js";

await mongoose.connect(env.MONGODB_URI);
console.log("Seeded Trimly", await seedDemoData({ reset: true }));
await mongoose.disconnect();
