import { Schema, model, type InferSchemaType } from "mongoose";

const mediaSchema = new Schema(
  {
    // Stored filename (unique, generated)
    filename: { type: String, required: true },
    // Original uploaded filename
    originalName: { type: String, required: true },
    // Absolute URL to fetch the file
    url: { type: String, required: true },
    // Storage key/path used to delete the file from its backend
    key: { type: String, default: "" },
    // Which backend holds the bytes: local disk, S3, or external (imported URL)
    driver: {
      type: String,
      enum: ["local", "s3", "external"],
      default: "local",
    },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    alt: { type: String, default: "" },
  },
  { timestamps: true }
);

export type MediaType = InferSchemaType<typeof mediaSchema>;
export const Media = model("Media", mediaSchema);
