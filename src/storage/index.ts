import path from "path";
import { env } from "../config/env.js";
import type { Storage, StorageDriver } from "./types.js";
import { localStorage } from "./local.js";
import { s3Storage, isS3Configured } from "./s3.js";

export { UPLOAD_DIR } from "./local.js";
export type { SavedFile, StorageDriver } from "./types.js";

/**
 * The active storage driver used for NEW uploads.
 * Resolves from env, falling back to local when S3 is requested but not
 * fully configured.
 */
function resolveActive(): Storage {
  if (env.storage.driver === "s3") {
    if (isS3Configured()) return s3Storage;
    console.warn(
      "⚠ STORAGE_DRIVER=s3 but S3 is not fully configured — falling back to local disk."
    );
    return localStorage;
  }
  return localStorage;
}

export const storage: Storage = resolveActive();

/** Look up a driver by name so we can delete a file with whatever stored it. */
export function driverFor(name: StorageDriver): Storage | null {
  if (name === "s3") return s3Storage;
  if (name === "local") return localStorage;
  return null; // "external" (e.g. imported Vercel Blob URLs) — nothing to delete
}

/** Build a collision-resistant, URL-safe filename from the original name. */
export function safeFilename(original: string): string {
  const ext = path.extname(original).toLowerCase().slice(0, 10);
  const base = path
    .basename(original, path.extname(original))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${base || "file"}-${unique}${ext}`;
}
