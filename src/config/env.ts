import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 5000),
  mongoUri: required("MONGODB_URI"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  // Public base URL of this API — used to build absolute URLs for uploaded files.
  publicUrl: (process.env.PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 5000}`).replace(/\/$/, ""),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 5),
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3001")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  seed: {
    email: process.env.SEED_ADMIN_EMAIL ?? "admin@aqiradar.local",
    password: process.env.SEED_ADMIN_PASSWORD ?? "changeme123",
    name: process.env.SEED_ADMIN_NAME ?? "Administrator",
  },
  storage: {
    // "s3" | "local". Defaults to "s3" when a bucket is configured, else "local".
    driver: (process.env.STORAGE_DRIVER ?? (process.env.S3_BUCKET ? "s3" : "local")) as
      | "s3"
      | "local",
    s3: {
      bucket: process.env.S3_BUCKET ?? "",
      region: process.env.S3_REGION ?? "us-east-1",
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      // Optional: custom endpoint for S3-compatible stores (R2, MinIO, Spaces).
      endpoint: process.env.S3_ENDPOINT || undefined,
      // Optional: public base URL / CDN in front of the bucket. When set, file
      // URLs are `${publicUrl}/${key}`; otherwise a standard S3 URL is built.
      publicUrl: (process.env.S3_PUBLIC_URL ?? "").replace(/\/$/, ""),
      // Key prefix ("folder") inside the bucket.
      prefix: (process.env.S3_PREFIX ?? "media").replace(/^\/|\/$/g, ""),
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    },
  },
  // Source DB to backfill from (the existing Payload database). Defaults to the
  // same cluster with the db name swapped to "aqi".
  backfillSourceUri:
    process.env.BACKFILL_SOURCE_URI ??
    (process.env.MONGODB_URI ?? "").replace(/\/([^/?]+)(\?|$)/, "/aqi$2"),
};
