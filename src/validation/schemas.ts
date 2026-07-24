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
  slug: z.string().optional(),
  state: z.string().min(1),
  aqi: z.number().min(0).max(500),
  pm25: z.number().min(0).optional(),
  intro: z.string().optional(),
  content: z.string().optional(),
  image: z.string().url().optional().or(z.literal("")),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  recommendedCadr: z.string().optional(),
  bestTimeToBuy: z.string().optional(),
  pollutants: z.string().optional(),
  healthImpact: z.string().optional(),
  whoAtRisk: z.string().optional(),
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

const FACET_KINDS = ["budget", "rooms", "health", "cities", "use-case", "brands", "models"] as const;

// ---- Category ----
export const categoryCreate = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().optional(),
  description: z.string().max(300).optional(),
  image: z.string().url().optional().or(z.literal("")),
  icon: z.string().optional(),
  tagline: z.string().optional(),
  kind: z.enum(["product", "filter"]).optional(),
  metricPrimaryLabel: z.string().optional(),
  metricPrimaryUnit: z.string().optional(),
  metricSecondaryLabel: z.string().optional(),
  metricSecondaryUnit: z.string().optional(),
  facets: z.array(z.enum(FACET_KINDS)).optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});
export const categoryUpdate = categoryCreate.partial();

// ---- Product ----
const specRow = z.object({ label: z.string(), value: z.string() });
const faqRow = z.object({ q: z.string(), a: z.string() });

export const productCreate = z.object({
  name: z.string().min(1).max(160),
  slug: z.string().optional(),
  image: z.string().url().optional().or(z.literal("")),
  images: z.array(z.string()).optional(),
  link: z.string().url().optional().or(z.literal("")),
  offers: z.array(z.object({ retailer: z.string(), url: z.string() })).optional(),
  description: z.string().optional(),
  excerpt: z.string().max(240).optional(),
  price: z.number().nonnegative().optional(),
  mrp: z.number().nonnegative().optional(),
  reviewCount: z.number().nonnegative().optional(),
  warranty: z.string().optional(),
  features: z.array(z.string()).optional(),
  scores: z.array(z.object({ label: z.string(), value: z.coerce.number() })).optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
  metricPrimary: z.string().optional(),
  metricSecondary: z.string().optional(),
  cadr: z.number().nonnegative().optional(),
  coverage: z.number().nonnegative().optional(),
  electricityCost: z.number().nonnegative().optional(),
  filterCost: z.number().nonnegative().optional(),
  specs: z.array(specRow).optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  faq: z.array(faqRow).optional(),
  rooms: z.array(z.string()).optional(),
  health: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  useCases: z.array(z.string()).optional(),
  fits: z.array(z.string()).optional(),
});
export const productUpdate = productCreate.partial();

// ---- Brand ----
export const brandCreate = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().optional(),
  logo: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  excerpt: z.string().max(240).optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  highlights: z.array(z.object({ title: z.string(), text: z.string() })).optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});
export const brandUpdate = brandCreate.partial();

// ---- Facet ----
export const facetCreate = z.object({
  kind: z.enum(["budget", "rooms", "health", "use-case", "models", "brands"]),
  category: z.string().min(1),
  slug: z.string().optional(),
  name: z.string().min(1),
  heading: z.string().optional(),
  intro: z.string().optional(),
  content: z.string().optional(),
  image: z.string().url().optional().or(z.literal("")),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  criteria: z.record(z.string(), z.unknown()).optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});
export const facetUpdate = facetCreate.partial();

// ---- Comparison ----
export const comparisonCreate = z.object({
  category: z.string().min(1),
  a: z.string().min(1),
  b: z.string().min(1),
  slug: z.string().optional(),
  verdict: z.string().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
});
export const comparisonUpdate = comparisonCreate.partial();

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
