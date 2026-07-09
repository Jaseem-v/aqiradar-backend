import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { storage, driverFor, safeFilename } from "../storage/index.js";
import { Media } from "../models/Media.js";
import type { StorageDriver } from "../storage/types.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const search = (req.query.search as string)?.trim();
  const filter: Record<string, unknown> = {};
  if (search) filter.originalName = { $regex: search, $options: "i" };
  const [items, total] = await Promise.all([
    Media.find(filter).sort("-createdAt").skip((page - 1) * limit).limit(limit),
    Media.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(422, "No file uploaded (field name must be 'file')");
  const { originalname, mimetype, size, buffer } = req.file;

  const filename = safeFilename(originalname);
  const saved = await storage.save(buffer, filename, mimetype);

  const doc = await Media.create({
    filename,
    originalName: originalname,
    url: saved.url,
    key: saved.key,
    driver: saved.driver,
    mimetype,
    size,
    alt: (req.body?.alt as string) ?? "",
  });
  res.status(201).json(doc);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const doc = await Media.findByIdAndDelete(req.params.id);
  if (!doc) throw new ApiError(404, "Not found");
  // Delete the underlying file using whichever driver stored it.
  const drv = driverFor(doc.driver as StorageDriver);
  if (drv) await drv.remove(doc.key || doc.filename);
  res.json({ ok: true });
});
