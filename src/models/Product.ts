import { Schema, model, type InferSchemaType } from "mongoose";

function formatSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, unique: true, index: true, trim: true },
    // Primary product image (URL — uploaded via /api/media or an external link)
    image: { type: String, default: "" },
    // Additional gallery images. The gallery thumbnail strip only shows when
    // there is more than one image (primary + these).
    images: { type: [String], default: [] },
    // Outbound buy / affiliate / product link (fallback if no offers set)
    link: { type: String, default: "" },
    // Retailer offers shown in the price rail, e.g. { retailer: "Amazon", url }.
    offers: {
      type: [{ retailer: { type: String }, url: { type: String } }],
      default: [],
    },
    // Rich details (HTML from the admin editor)
    description: { type: String, default: "" },
    // Short one-line tagline shown in listings
    excerpt: { type: String, maxlength: 240 },
    // Price in INR (optional)
    price: { type: Number, min: 0 },
    // MRP / list price — used to show the discount vs `price`.
    mrp: { type: Number, min: 0 },
    // Number of user reviews behind the rating.
    reviewCount: { type: Number, min: 0 },
    // Warranty summary shown in the price rail, e.g. "1 year".
    warranty: { type: String, default: "" },
    // Feature pills, e.g. "Smart App", "Auto Mode", "Night Mode".
    features: { type: [String], default: [] },
    // "Performance at a glance" bars — value out of 10.
    scores: {
      type: [{ label: { type: String }, value: { type: Number } }],
      default: [],
    },
    category: { type: String, trim: true }, // category slug
    brand: { type: String, trim: true }, // brand slug
    active: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },

    // ---- Rich product-page fields ----
    rating: { type: Number, min: 0, max: 5 },
    // Headline metrics — labels/units come from the category. Strings so they
    // generalise across categories ("130", "PM + CO₂", "Yes"…).
    metricPrimary: { type: String, default: "" },
    metricSecondary: { type: String, default: "" },
    // Numeric mirrors used for facet queries + sorting (optional).
    cadr: { type: Number, min: 0 },
    coverage: { type: Number, min: 0 },
    // Running-cost estimates (INR/year).
    electricityCost: { type: Number, min: 0 },
    filterCost: { type: Number, min: 0 },
    // Full specification table.
    specs: {
      type: [{ label: { type: String }, value: { type: String } }],
      default: [],
    },
    pros: { type: [String], default: [] },
    cons: { type: [String], default: [] },
    faq: {
      type: [{ q: { type: String }, a: { type: String } }],
      default: [],
    },
    // Facet tags (slugs) — which room / health / city / use-case pages list this product.
    rooms: { type: [String], default: [] },
    health: { type: [String], default: [] },
    cities: { type: [String], default: [] },
    useCases: { type: [String], default: [] },
    // For "filter" categories: product slugs / model keys this part fits.
    fits: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Auto-fill slug from name when left blank.
productSchema.pre("validate", function (next) {
  if (!this.slug && this.name) this.slug = formatSlug(this.name);
  else if (this.slug) this.slug = formatSlug(this.slug);
  next();
});

export type ProductType = InferSchemaType<typeof productSchema>;
export const Product = model("Product", productSchema);
