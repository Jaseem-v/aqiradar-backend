import { Schema, model, type InferSchemaType } from "mongoose";

const purifierSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    // Clean Air Delivery Rate (m³/h)
    cadr: { type: Number, required: true, min: 0 },
    // Price in INR
    price: { type: Number, required: true, min: 0 },
    // Recommended room coverage (sq ft)
    coverage: { type: Number, required: true, min: 0 },
    // Filter grade, e.g. "H13"
    filter: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type PurifierType = InferSchemaType<typeof purifierSchema>;
export const Purifier = model("Purifier", purifierSchema);
