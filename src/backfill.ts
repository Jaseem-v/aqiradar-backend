/**
 * Backfill existing content from the Payload database (`aqi`) into the new
 * standalone database (`aqi_admin`).
 *
 * Migrates:
 *   - media  (metadata + existing URLs, marked driver "external")
 *   - posts  (lexical body → HTML, cover/embedded images resolved to URLs)
 *
 * Idempotent: media upsert by filename, posts upsert by slug. Safe to re-run.
 * Read-only against the source DB.
 */
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { Post } from "./models/Post.js";
import { Media } from "./models/Media.js";
import { lexicalToHtml } from "./utils/lexicalToHtml.js";

// Optional base URL to turn relative Payload media paths (/api/media/file/x.jpg)
// into absolute URLs. Set FRONTEND_URL in .env if you want them to resolve.
const MEDIA_BASE = (process.env.FRONTEND_URL ?? "").replace(/\/$/, "");

function absoluteUrl(url: string | undefined): string {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  return MEDIA_BASE ? `${MEDIA_BASE}${url.startsWith("/") ? "" : "/"}${url}` : url;
}

type SourceMedia = {
  _id: mongoose.Types.ObjectId;
  filename?: string;
  url?: string;
  mimeType?: string;
  filesize?: number;
  alt?: string;
  sizes?: Record<string, { url?: string } | undefined>;
};

/**
 * The live Payload site serves media inconsistently — some original URLs 404
 * (e.g. spaced filenames) while a resized variant works, and vice-versa. When
 * FRONTEND_URL is set we probe each candidate and keep the first that returns
 * 200, so backfilled image URLs actually resolve.
 */
async function pickWorkingUrl(candidates: string[]): Promise<string> {
  const abs = candidates.filter(Boolean).map(absoluteUrl);
  if (!MEDIA_BASE) return abs[0] ?? ""; // no base to probe against — keep as-is
  for (const url of abs) {
    if (!/^https?:\/\//.test(url)) continue;
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok) return url;
    } catch {
      /* try next */
    }
  }
  return abs[0] ?? ""; // nothing resolved — keep the best guess
}

type SourcePost = {
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: mongoose.Types.ObjectId | null;
  author?: { name?: string; role?: string };
  publishedAt?: Date;
  body?: unknown;
  seoTitle?: string;
  seoDescription?: string;
};

async function backfill() {
  // Target DB (aqi_admin) via the default mongoose connection.
  await connectDB();

  // Source DB (Payload `aqi`) via a separate connection — read only.
  const source = await mongoose
    .createConnection(env.backfillSourceUri)
    .asPromise();
  console.log(`✔ Source DB connected → "${source.name}"`);

  const srcMedia = source.collection<SourceMedia>("media");
  const srcPosts = source.collection<SourcePost>("posts");

  // --- Media ---
  const mediaDocs = await srcMedia.find({}).toArray();
  const idToUrl = new Map<string, { url: string; alt?: string }>();
  let mediaUpserts = 0;

  for (const m of mediaDocs) {
    const filename = m.filename ?? `media-${m._id.toString()}`;
    // Prefer a larger variant first, then the original, then smaller variants.
    const candidates = [
      m.sizes?.cover?.url,
      m.sizes?.og?.url,
      m.url,
      m.sizes?.card?.url,
    ].filter((u): u is string => Boolean(u));
    const url = await pickWorkingUrl(candidates);
    const resolved = MEDIA_BASE && !url ? "(none resolved)" : url;
    idToUrl.set(m._id.toString(), { url, alt: m.alt });

    await Media.updateOne(
      { filename },
      {
        $set: {
          filename,
          originalName: filename,
          url,
          key: "",
          driver: "external",
          mimetype: m.mimeType ?? "image/*",
          size: m.filesize ?? 0,
          alt: m.alt ?? "",
        },
      },
      { upsert: true }
    );
    mediaUpserts++;
    console.log(`  • ${filename} → ${resolved}`);
  }
  console.log(`✔ Backfilled ${mediaUpserts} media record(s)`);

  // --- Posts ---
  const postDocs = await srcPosts.find({}).toArray();
  let postUpserts = 0;

  for (const p of postDocs) {
    const html = lexicalToHtml(p.body, (value) => {
      // upload node value can be an id (string/ObjectId) or a populated doc.
      if (!value) return null;
      if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
        const v = value as { _id: unknown; url?: string; alt?: string };
        return { url: absoluteUrl(v.url) || idToUrl.get(String(v._id))?.url || "", alt: v.alt };
      }
      return idToUrl.get(String(value)) ?? null;
    });

    const coverImage = p.coverImage
      ? idToUrl.get(p.coverImage.toString())?.url ?? ""
      : "";

    await Post.updateOne(
      { slug: p.slug },
      {
        $set: {
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt ?? "",
          body: html,
          coverImage,
          author: { name: p.author?.name, role: p.author?.role },
          tags: [],
          status: "published",
          publishedAt: p.publishedAt ?? new Date(),
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
        },
      },
      { upsert: true }
    );
    postUpserts++;
    console.log(`  • ${p.slug} (${html.length} chars of HTML${coverImage ? ", cover ✓" : ""})`);
  }
  console.log(`✔ Backfilled ${postUpserts} post(s)`);

  await source.close();
  await mongoose.connection.close();
  console.log("Done.");
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
