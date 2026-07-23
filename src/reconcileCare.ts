/**
 * Reconciles legacy Care category rows into the canonical 4 + plants structure.
 *
 * - Reassigns products from duplicate/mis-tagged legacy categories to the
 *   canonical slug (products are never deleted — only their `category` changes).
 * - Gives the surviving "purify-greens" category proper display config.
 * - Normalises display order of the canonical categories.
 * - Removes the now-empty / duplicate legacy category rows.
 *
 * Idempotent: a second run reassigns 0 products and deletes 0 categories.
 *   npm run care:reconcile
 */
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { Category } from "./models/Category.js";
import { Product } from "./models/Product.js";

// legacy slug -> canonical slug the products should live under
const MERGES: Record<string, string> = {
  "air-monitors": "aqi-monitors",
  "face-masks": "masks",
  "car-air-products": "air-purifiers",
};

// legacy category rows to delete after their products are reassigned
const REMOVE = [
  "air-monitors",
  "face-masks",
  "car-air-products",
  "airpurifier-accessories",
  "humidifiers-and-dehumidifiers",
  "smart-air-quality",
];

// canonical display order
const ORDER: Record<string, number> = {
  "air-purifiers": 1,
  "aqi-monitors": 2,
  masks: 3,
  "hepa-filters": 4,
  "purify-greens": 5,
};

async function run() {
  await connectDB();

  // 1. Reassign products from legacy categories to their canonical slug.
  for (const [from, to] of Object.entries(MERGES)) {
    const res = await Product.updateMany({ category: from }, { $set: { category: to } });
    console.log(`✔ Moved ${res.modifiedCount} products: ${from} → ${to}`);
  }

  // 2. Keep purify-greens as a real, distinct category with display config.
  const greens = await Category.updateOne(
    { slug: "purify-greens" },
    {
      $set: {
        icon: "🌿",
        active: true,
        order: ORDER["purify-greens"],
      },
      $setOnInsert: { name: "Purify Greens" },
    },
  );
  if (greens.matchedCount) console.log("✔ Updated purify-greens config");

  // 3. Normalise canonical order.
  for (const [slug, order] of Object.entries(ORDER)) {
    await Category.updateOne({ slug }, { $set: { order } });
  }
  console.log("✔ Normalised canonical category order");

  // 4. Remove redundant / empty legacy category rows.
  const remaining = await Product.distinct("category", { category: { $in: REMOVE } });
  if (remaining.length) {
    console.warn(`⚠ Not deleting — products still reference: ${remaining.join(", ")}`);
  } else {
    const del = await Category.deleteMany({ slug: { $in: REMOVE } });
    console.log(`✔ Removed ${del.deletedCount} legacy category rows`);
  }

  await mongoose.connection.close();
  console.log("Done.");
}

run().catch((err) => {
  console.error("Reconcile failed:", err);
  process.exit(1);
});
