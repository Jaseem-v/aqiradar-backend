import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { signToken } from "../utils/token.js";
import { loginSchema } from "../validation/schemas.js";
import { User, type UserDoc } from "../models/User.js";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = (await User.findOne({ email: email.toLowerCase() }).select(
    "+passwordHash"
  )) as UserDoc | null;

  if (!user || !(await user.verifyPassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken({ sub: user.id, role: user.role, email: user.email });
  res.json({ token, user: user.toJSON() });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.sub);
  if (!user) throw new ApiError(404, "User not found");
  res.json(user);
});
