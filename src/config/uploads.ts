import multer from "multer";
import { env } from "./env.js";
import { ApiError } from "../utils/ApiError.js";

// Buffer files in memory, then hand the buffer to the active storage driver
// (local disk or S3). This keeps the upload path driver-agnostic.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new ApiError(422, "Only image files are allowed"));
  },
});
