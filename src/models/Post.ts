import { Schema, model, type InferSchemaType } from "mongoose";

function formatSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const postSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    excerpt: { type: String, maxlength: 220 },
    // Rich text stored as HTML/markdown string for the standalone stack.
    body: { type: String, default: "" },
    coverImage: { type: String }, // URL
    author: {
      name: { type: String },
      role: { type: String },
    },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date, default: () => new Date() },
    seoTitle: { type: String, maxlength: 70 },
    seoDescription: { type: String, maxlength: 160 },
  },
  { timestamps: true }
);

// Auto-fill slug from title when left blank.
postSchema.pre("validate", function (next) {
  if (!this.slug && this.title) this.slug = formatSlug(this.title);
  else if (this.slug) this.slug = formatSlug(this.slug);
  next();
});

export type PostType = InferSchemaType<typeof postSchema>;
export const Post = model("Post", postSchema);
