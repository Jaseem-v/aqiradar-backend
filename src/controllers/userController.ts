import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User, hashPassword } from "../models/User.js";
import { userCreate, userUpdate } from "../validation/schemas.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const search = (req.query.search as string)?.trim();
  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort("-createdAt").skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "Not found");
  res.json(user);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = userCreate.parse(req.body);
  const user = await User.create({
    name,
    email,
    role,
    passwordHash: await hashPassword(password),
  });
  res.status(201).json(user);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { password, ...rest } = userUpdate.parse(req.body);
  const patch: Record<string, unknown> = { ...rest };
  if (password) patch.passwordHash = await hashPassword(password);
  const user = await User.findByIdAndUpdate(req.params.id, patch, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new ApiError(404, "Not found");
  res.json(user);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  // Prevent an admin from deleting their own account while logged in.
  if (req.user!.sub === req.params.id) {
    throw new ApiError(400, "You cannot delete your own account");
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, "Not found");
  res.json({ ok: true });
});
