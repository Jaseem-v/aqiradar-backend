import { Schema, model, type InferSchemaType } from "mongoose";

const citySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    state: { type: String, required: true, trim: true },
    // Current AQI (CPCB National AQI, 0–500)
    aqi: { type: Number, required: true, min: 0, max: 500 },
    // PM2.5 concentration (µg/m³); optional — estimated from AQI if omitted
    pm25: { type: Number, min: 0 },
    active: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

citySchema.index({ name: 1, state: 1 }, { unique: true });

export type CityType = InferSchemaType<typeof citySchema>;
export const City = model("City", citySchema);
