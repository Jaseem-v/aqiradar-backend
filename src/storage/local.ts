import path from "path";
import fs from "fs";
import fsp from "fs/promises";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";
import type { Storage, SavedFile } from "./types.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
// backend/uploads
export const UPLOAD_DIR = path.resolve(dirname, "../../uploads");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const localStorage: Storage = {
  driver: "local",
  async save(buffer, filename): Promise<SavedFile> {
    await fsp.writeFile(path.join(UPLOAD_DIR, filename), buffer);
    return {
      key: filename,
      url: `${env.publicUrl}/uploads/${filename}`,
      driver: "local",
    };
  },
  async remove(key): Promise<void> {
    await fsp.unlink(path.join(UPLOAD_DIR, key)).catch(() => {});
  },
};
