import { Router } from "express";
import * as ctrl from "../controllers/mediaController.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../config/uploads.js";

const router = Router();

router.get("/", ctrl.list); // public read (frontend can list media)
router.post("/", requireAuth, upload.single("file"), ctrl.create);
router.delete("/:id", requireAuth, ctrl.remove);

export default router;
