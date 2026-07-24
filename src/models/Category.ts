import { Schema, model, type InferSchemaType } from "mongoose";

function formatSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, unique: true, index: true, trim: true },
    description: { type: String, maxlength: 300 },
    image: { type: String, default: "" },
    // Emoji / short icon shown on the hub + facet tiles.
    icon: { type: String, default: "" },
    // Short label shown under the name on the "browse by category" cards.
    tagline: { type: String, default: "" },
    // "product" = normal reviewable product; "filter" = replacement part
    // (compatibility-driven — facets become brand/model instead of budget/city).
    kind: { type: String, enum: ["product", "filter"], default: "product" },
    // Headline metric labels/units used across all cards in this category.
    // e.g. CADR (m³/h) + Coverage (sq ft); or Filtration (%) + Reusable.
    metricPrimaryLabel: { type: String, default: "" },
    metricPrimaryUnit: { type: String, default: "" },
    metricSecondaryLabel: { type: String, default: "" },
    metricSecondaryUnit: { type: String, default: "" },
    // Which facet dimensions this category exposes. Drives generateStaticParams
    // on the frontend — a facet not listed here simply never generates a page.
    facets: {
      type: [String],
      enum: ["budget", "rooms", "health", "cities", "use-case", "brands", "models"],
      default: [],
    },
    // Display order (lower first)
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.pre("validate", function (next) {
  if (!this.slug && this.name) this.slug = formatSlug(this.name);
  else if (this.slug) this.slug = formatSlug(this.slug);
  next();
});

export type CategoryType = InferSchemaType<typeof categorySchema>;
export const Category = model("Category", categorySchema);
