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
    // Product image (URL — uploaded via /api/media or an external link)
    image: { type: String, default: "" },
    // Outbound buy / affiliate / product link
    link: { type: String, default: "" },
    // Rich details (HTML from the admin editor)
    description: { type: String, default: "" },
    // Short one-line tagline shown in listings
    excerpt: { type: String, maxlength: 240 },
    // Price in INR (optional)
    price: { type: Number, min: 0 },
    category: { type: String, trim: true },
    brand: { type: String, trim: true },
    active: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
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
