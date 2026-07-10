import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import mongoose from "mongoose";
import { User, hashPassword } from "./models/User.js";
import { Purifier } from "./models/Purifier.js";
import { City } from "./models/City.js";
import { Category } from "./models/Category.js";
import purifiers from "./data/purifiers.json" with { type: "json" };
import cities from "./data/cities.json" with { type: "json" };

async function seed() {
  await connectDB();

  // --- Admin user (idempotent) ---
  const existing = await User.findOne({ email: env.seed.email.toLowerCase() });
  if (existing) {
    console.log(`• Admin user already exists: ${env.seed.email}`);
  } else {
    await User.create({
      name: env.seed.name,
      email: env.seed.email,
      role: "admin",
      passwordHash: await hashPassword(env.seed.password),
    });
    console.log(`✔ Created admin user: ${env.seed.email} / ${env.seed.password}`);
  }

  // --- Purifiers ---
  const purifierCount = await Purifier.countDocuments();
  if (purifierCount === 0) {
    await Purifier.insertMany(purifiers);
    console.log(`✔ Seeded ${purifiers.length} purifiers`);
  } else {
    console.log(`• Purifiers already present (${purifierCount}), skipping`);
  }

  // --- Cities ---
  const cityCount = await City.countDocuments();
  if (cityCount === 0) {
    await City.insertMany(
      cities.map((c: Record<string, unknown>) => ({ ...c, lastUpdated: new Date() }))
    );
    console.log(`✔ Seeded ${cities.length} cities`);
  } else {
    console.log(`• Cities already present (${cityCount}), skipping`);
  }

  // --- Categories ---
  const categoryCount = await Category.countDocuments();
  if (categoryCount === 0) {
    await Category.insertMany([
      { name: "Air Purifiers", slug: "air-purifiers", order: 1, description: "HEPA and carbon purifiers for every room size." },
      { name: "Air Monitors", slug: "air-monitors", order: 2, description: "Real-time PM2.5, CO₂ and AQI monitors." },
      { name: "Face Masks", slug: "face-masks", order: 3, description: "N95 and pollution masks for outdoor protection." },
      { name: "Purify Greens", slug: "purify-greens", order: 4, description: "Air-purifying indoor plants." },
    ]);
    console.log("✔ Seeded 4 categories");
  } else {
    console.log(`• Categories already present (${categoryCount}), skipping`);
  }

  await mongoose.connection.close();
  console.log("Done.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
