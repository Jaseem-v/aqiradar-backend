import { Router } from "express";
import authRoutes from "./auth.js";
import userRoutes from "./users.js";
import mediaRoutes from "./media.js";
import { resourceRouter } from "./resource.js";
import { Post } from "../models/Post.js";
import { Purifier } from "../models/Purifier.js";
import { City } from "../models/City.js";
import {
  postCreate,
  postUpdate,
  purifierCreate,
  purifierUpdate,
  cityCreate,
  cityUpdate,
} from "../validation/schemas.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/media", mediaRoutes);

router.use(
  "/posts",
  resourceRouter(Post, {
    createSchema: postCreate,
    updateSchema: postUpdate,
    searchFields: ["title", "slug", "excerpt"],
    defaultSort: "-publishedAt",
  })
);

router.use(
  "/purifiers",
  resourceRouter(Purifier, {
    createSchema: purifierCreate,
    updateSchema: purifierUpdate,
    searchFields: ["name", "filter"],
    defaultSort: "-createdAt",
  })
);

router.use(
  "/cities",
  resourceRouter(City, {
    createSchema: cityCreate,
    updateSchema: cityUpdate,
    searchFields: ["name", "state"],
    defaultSort: "name",
  })
);

export default router;
