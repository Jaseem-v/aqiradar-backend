import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env.js";
import apiRoutes from "./routes/index.js";
import { UPLOAD_DIR } from "./storage/index.js";
import { notFound, errorHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow non-browser tools (no Origin) and any whitelisted origin.
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ ok: true, service: "aqi-backend" }));

  // Serve uploaded images with permissive CORS so the admin/frontend can render them.
  app.use(
    "/uploads",
    express.static(UPLOAD_DIR, {
      setHeaders: (res) => res.setHeader("Access-Control-Allow-Origin", "*"),
    })
  );

  app.use("/api", apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
