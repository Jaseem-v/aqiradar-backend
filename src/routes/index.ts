import { Router } from "express";
import authRoutes from "./auth.js";
import userRoutes from "./users.js";
import mediaRoutes from "./media.js";
import { resourceRouter } from "./resource.js";
import { Post } from "../models/Post.js";
import { Purifier } from "../models/Purifier.js";
import { City } from "../models/City.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Brand } from "../models/Brand.js";
import { Facet } from "../models/Facet.js";
import { Comparison } from "../models/Comparison.js";
import {
  postCreate,
  postUpdate,
  purifierCreate,
  purifierUpdate,
  cityCreate,
  cityUpdate,
  productCreate,
  productUpdate,
  categoryCreate,
  categoryUpdate,
  brandCreate,
  brandUpdate,
  facetCreate,
  facetUpdate,
  comparisonCreate,
  comparisonUpdate,
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

router.use(
  "/products",
  resourceRouter(Product, {
    createSchema: productCreate,
    updateSchema: productUpdate,
    searchFields: ["name", "category", "brand"],
    defaultSort: "-createdAt",
  })
);

router.use(
  "/categories",
  resourceRouter(Category, {
    createSchema: categoryCreate,
    updateSchema: categoryUpdate,
    searchFields: ["name", "slug"],
    defaultSort: "order",
  })
);

router.use(
  "/brands",
  resourceRouter(Brand, {
    createSchema: brandCreate,
    updateSchema: brandUpdate,
    searchFields: ["name", "slug"],
    defaultSort: "order",
  })
);

router.use(
  "/facets",
  resourceRouter(Facet, {
    createSchema: facetCreate,
    updateSchema: facetUpdate,
    searchFields: ["name", "slug", "category", "kind"],
    defaultSort: "order",
  })
);

router.use(
  "/comparisons",
  resourceRouter(Comparison, {
    createSchema: comparisonCreate,
    updateSchema: comparisonUpdate,
    searchFields: ["slug", "category", "a", "b"],
    defaultSort: "-createdAt",
  })
);

export default router;
