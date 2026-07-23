import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * A curated head-to-head comparison between two products. The page itself is
 * generated from the two products' specs; this model exists so editors can
 * decide which comparisons get their own indexed URL + sitemap entry, and add
 * an editorial verdict.
 *
 * Slug is derived as `${a}-vs-${b}` and drives /careproducts/compare/:slug.
 */
const comparisonSchema = new Schema(
  {
    category: { type: String, required: true, trim: true, index: true },
    // Product slugs.
    a: { type: String, required: true, trim: true },
    b: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true, trim: true },
    // Optional editorial verdict (HTML).
    verdict: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

comparisonSchema.pre("validate", function (next) {
  if (!this.slug && this.a && this.b) this.slug = `${this.a}-vs-${this.b}`;
  next();
});

export type ComparisonType = InferSchemaType<typeof comparisonSchema>;
export const Comparison = model("Comparison", comparisonSchema);
