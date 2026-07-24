import { Schema, model, type InferSchemaType } from "mongoose";

function formatSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const brandSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, unique: true, index: true, trim: true },
    logo: { type: String, default: "" },
    // Brand history / description (HTML from the admin editor)
    description: { type: String, default: "" },
    // Short one-line tagline for listings
    excerpt: { type: String, maxlength: 240 },
    pros: { type: [String], default: [] },
    cons: { type: [String], default: [] },
    // "Brand highlights" cards on the brand page, e.g. { title: "Innovation", text: "…" }.
    highlights: {
      type: [{ title: { type: String }, text: { type: String } }],
      default: [],
    },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

brandSchema.pre("validate", function (next) {
  if (!this.slug && this.name) this.slug = formatSlug(this.name);
  else if (this.slug) this.slug = formatSlug(this.slug);
  next();
});

export type BrandType = InferSchemaType<typeof brandSchema>;
export const Brand = model("Brand", brandSchema);
