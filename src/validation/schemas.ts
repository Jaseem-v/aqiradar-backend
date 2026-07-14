import { z } from "zod";

// ---- Purifier ----
export const purifierCreate = z.object({
  name: z.string().min(1),
  cadr: z.number().nonnegative(),
  price: z.number().nonnegative(),
  coverage: z.number().nonnegative(),
  filter: z.string().min(1),
  active: z.boolean().optional(),
});
export const purifierUpdate = purifierCreate.partial();

// ---- City ----
export const cityCreate = z.object({
  name: z.string().min(1),
  state: z.string().min(1),
  aqi: z.number().min(0).max(500),
  pm25: z.number().min(0).optional(),
  active: z.boolean().optional(),
  lastUpdated: z.coerce.date().optional(),
});
export const cityUpdate = cityCreate.partial();

// ---- Post ----
export const postCreate = z.object({
  title: z.string().min(1).max(120),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  body: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  author: z
    .object({ name: z.string().optional(), role: z.string().optional() })
    .optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published"]).optional(),
  publishedAt: z.coerce.date().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});
export const postUpdate = postCreate.partial();

// ---- Category ----
export const categoryCreate = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().optional(),
  description: z.string().max(300).optional(),
  image: z.string().url().optional().or(z.literal("")),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});
export const categoryUpdate = categoryCreate.partial();

// ---- Product ----
export const productCreate = z.object({
  name: z.string().min(1).max(160),
  slug: z.string().optional(),
  image: z.string().url().optional().or(z.literal("")),
  link: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  excerpt: z.string().max(240).optional(),
  price: z.number().nonnegative().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
});
export const productUpdate = productCreate.partial();

// ---- User ----
export const userCreate = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "editor"]).optional(),
});
export const userUpdate = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["admin", "editor"]).optional(),
});

// ---- Auth ----
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
