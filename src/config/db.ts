import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  const { name, host } = mongoose.connection;
  console.log(`✔ MongoDB connected → db "${name}" @ ${host}`);
}
