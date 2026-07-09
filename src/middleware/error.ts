import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { MulterError } from "multer";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Route not found" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof MulterError) {
    const msg =
      err.code === "LIMIT_FILE_SIZE" ? "File is too large" : err.message;
    return res.status(422).json({ error: msg });
  }
  if (err instanceof ZodError) {
    return res.status(422).json({ error: "Validation failed", details: err.flatten() });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(422).json({ error: err.message });
  }
  // Duplicate key (e.g. unique email/slug)
  if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
    const field = Object.keys((err as { keyValue?: Record<string, unknown> }).keyValue ?? {})[0];
    return res.status(409).json({ error: `Duplicate value for "${field ?? "field"}"` });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
