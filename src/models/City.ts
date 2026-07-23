import { Schema, model, type InferSchemaType } from "mongoose";

function formatSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const citySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, index: true, trim: true },
    state: { type: String, required: true, trim: true },
    // Current AQI (CPCB National AQI, 0–500)
    aqi: { type: Number, required: true, min: 0, max: 500 },
    // PM2.5 concentration (µg/m³); optional — estimated from AQI if omitted
    pm25: { type: Number, min: 0 },

    // ---- Landing-page content (drives /careproducts/<cat>/for-<city>) ----
    // Short lead shown under the title.
    intro: { type: String, default: "" },
    // Rich editorial body (HTML from the admin editor).
    content: { type: String, default: "" },
    image: { type: String, default: "" },
    seoTitle: { type: String, maxlength: 70, default: "" },
    seoDescription: { type: String, maxlength: 160, default: "" },

    active: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

citySchema.pre("validate", function (next) {
  if (!this.slug && this.name) this.slug = formatSlug(this.name);
  else if (this.slug) this.slug = formatSlug(this.slug);
  next();
});

citySchema.index({ name: 1, state: 1 }, { unique: true });

export type CityType = InferSchemaType<typeof citySchema>;
export const City = model("City", citySchema);
