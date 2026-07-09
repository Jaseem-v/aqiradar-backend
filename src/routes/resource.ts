import { Router } from "express";
import type { Model } from "mongoose";
import type { ZodSchema } from "zod";
import { crudController } from "../utils/crudController.js";
import { requireAuth } from "../middleware/auth.js";

type Opts = {
  createSchema: ZodSchema;
  updateSchema: ZodSchema;
  searchFields?: string[];
  defaultSort?: string;
};

/**
 * A resource router with public reads and authenticated writes.
 * GET /            → list
 * GET /:id         → getOne
 * POST /           → create   (auth)
 * PATCH /:id       → update   (auth)
 * DELETE /:id      → remove   (auth)
 */
export function resourceRouter<T>(model: Model<T>, opts: Opts): Router {
  const c = crudController(model, opts);
  const router = Router();
  router.get("/", c.list);
  router.get("/:id", c.getOne);
  router.post("/", requireAuth, c.create);
  router.patch("/:id", requireAuth, c.update);
  router.delete("/:id", requireAuth, c.remove);
  return router;
}
