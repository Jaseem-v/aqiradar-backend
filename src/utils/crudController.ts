import type { Model } from "mongoose";
import type { ZodSchema } from "zod";
import type { Request, Response } from "express";
import { asyncHandler } from "./asyncHandler.js";
import { ApiError } from "./ApiError.js";

type CrudOptions = {
  createSchema: ZodSchema;
  updateSchema: ZodSchema;
  // Fields that can be used with ?search= (regex, case-insensitive)
  searchFields?: string[];
  // Default sort, e.g. "-createdAt"
  defaultSort?: string;
};

/** Builds list/get/create/update/remove handlers for a Mongoose model. */
export function crudController<T>(model: Model<T>, opts: CrudOptions) {
  const { createSchema, updateSchema, searchFields = [], defaultSort = "-createdAt" } = opts;

  const list = asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const search = (req.query.search as string)?.trim();

    const filter: Record<string, unknown> = {};
    if (search && searchFields.length) {
      filter.$or = searchFields.map((f) => ({ [f]: { $regex: search, $options: "i" } }));
    }

    const sort = (req.query.sort as string) || defaultSort;
    const [items, total] = await Promise.all([
      model
        .find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      model.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  });

  const getOne = asyncHandler(async (req: Request, res: Response) => {
    const doc = await model.findById(req.params.id);
    if (!doc) throw new ApiError(404, "Not found");
    res.json(doc);
  });

  const create = asyncHandler(async (req: Request, res: Response) => {
    const data = createSchema.parse(req.body);
    const doc = await model.create(data as Partial<T>);
    res.status(201).json(doc);
  });

  const update = asyncHandler(async (req: Request, res: Response) => {
    const data = updateSchema.parse(req.body);
    const doc = await model.findByIdAndUpdate(req.params.id, data as Partial<T>, {
      new: true,
      runValidators: true,
    });
    if (!doc) throw new ApiError(404, "Not found");
    res.json(doc);
  });

  const remove = asyncHandler(async (req: Request, res: Response) => {
    const doc = await model.findByIdAndDelete(req.params.id);
    if (!doc) throw new ApiError(404, "Not found");
    res.json({ ok: true });
  });

  return { list, getOne, create, update, remove };
}
