import { Schema, model, type InferSchemaType } from "mongoose";

function formatSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * A facet is a curated landing-page dimension for a category — e.g. a room
 * ("bedroom"), a health need ("asthma"), a budget band ("under-10000") or a
 * use-case ("cycling"). Cities are handled by their own `City` model.
 *
 * A facet page is a *query over products* + unique editorial copy, not a stored
 * product list. `criteria` holds the query (maxPrice for budget bands, minCadr,
 * tag match, etc.); the frontend applies it.
 */
const facetSchema = new Schema(
  {
    // Dimension this facet belongs to.
    kind: {
      type: String,
      required: true,
      enum: ["budget", "rooms", "health", "use-case", "models", "brands"],
      index: true,
    },
    // Category slug this facet applies to (e.g. "air-purifiers"), or "all".
    category: { type: String, required: true, trim: true, index: true, default: "all" },
    slug: { type: String, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    // Optional H1 override (defaults to a generated "Best <cat> for <name>").
    heading: { type: String, default: "" },
    // Unique intro copy shown at the top of the facet page (keeps it off thin-content).
    intro: { type: String, default: "" },
    // Rich editorial body (HTML from the admin editor) rendered below the picks.
    content: { type: String, default: "" },
    image: { type: String, default: "" },
    seoTitle: { type: String, maxlength: 70, default: "" },
    seoDescription: { type: String, maxlength: 160, default: "" },
    // Query criteria applied to products, e.g. { maxPrice: 10000, minCadr: 200 }.
    criteria: { type: Schema.Types.Mixed, default: {} },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

facetSchema.pre("validate", function (next) {
  if (!this.slug && this.name) this.slug = formatSlug(this.name);
  else if (this.slug) this.slug = formatSlug(this.slug);
  next();
});

// A (kind, category, slug) triple is unique.
facetSchema.index({ kind: 1, category: 1, slug: 1 }, { unique: true });

export type FacetType = InferSchemaType<typeof facetSchema>;
export const Facet = model("Facet", facetSchema);
