/**
 * Minimal Lexical (Payload rich text) → HTML serializer.
 * Covers the node types present in the existing content: root, heading,
 * paragraph, text (with format bitmask), linebreak, list, listitem, link,
 * quote, and upload (embedded media resolved to <img>).
 */

type LexNode = {
  type?: string;
  tag?: string;
  text?: string;
  format?: number | string;
  children?: LexNode[];
  listType?: string;
  url?: string;
  fields?: { url?: string; newTab?: boolean };
  value?: unknown; // upload relation (id or populated doc)
  relationTo?: string;
};

// Lexical text-format bitmask
const BOLD = 1;
const ITALIC = 2;
const STRIKE = 4;
const UNDERLINE = 8;
const CODE = 16;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderText(node: LexNode): string {
  let out = escapeHtml(node.text ?? "");
  const fmt = typeof node.format === "number" ? node.format : 0;
  if (fmt & CODE) out = `<code>${out}</code>`;
  if (fmt & BOLD) out = `<strong>${out}</strong>`;
  if (fmt & ITALIC) out = `<em>${out}</em>`;
  if (fmt & UNDERLINE) out = `<u>${out}</u>`;
  if (fmt & STRIKE) out = `<s>${out}</s>`;
  return out;
}

type Ctx = { resolveUpload: (value: unknown) => { url: string; alt?: string } | null };

function renderChildren(children: LexNode[] | undefined, ctx: Ctx): string {
  return (children ?? []).map((c) => renderNode(c, ctx)).join("");
}

function renderNode(node: LexNode, ctx: Ctx): string {
  switch (node.type) {
    case "text":
      return renderText(node);
    case "linebreak":
      return "<br />";
    case "paragraph": {
      const inner = renderChildren(node.children, ctx);
      return inner ? `<p>${inner}</p>` : "";
    }
    case "heading": {
      const tag = /^h[1-6]$/.test(node.tag ?? "") ? node.tag : "h2";
      return `<${tag}>${renderChildren(node.children, ctx)}</${tag}>`;
    }
    case "quote":
      return `<blockquote>${renderChildren(node.children, ctx)}</blockquote>`;
    case "list": {
      const tag = node.listType === "number" ? "ol" : "ul";
      return `<${tag}>${renderChildren(node.children, ctx)}</${tag}>`;
    }
    case "listitem":
      return `<li>${renderChildren(node.children, ctx)}</li>`;
    case "link": {
      const href = node.fields?.url ?? node.url ?? "#";
      const target = node.fields?.newTab ? ' target="_blank" rel="noopener"' : "";
      return `<a href="${escapeHtml(href)}"${target}>${renderChildren(node.children, ctx)}</a>`;
    }
    case "upload": {
      const resolved = ctx.resolveUpload(node.value);
      if (!resolved?.url) return "";
      const alt = escapeHtml(resolved.alt ?? "");
      return `<figure><img src="${escapeHtml(resolved.url)}" alt="${alt}" /></figure>`;
    }
    default:
      // Unknown node — try to render its children so we don't lose text.
      return renderChildren(node.children, ctx);
  }
}

export function lexicalToHtml(
  body: unknown,
  resolveUpload: Ctx["resolveUpload"] = () => null
): string {
  const root = (body as { root?: LexNode })?.root;
  if (!root?.children) return "";
  return renderChildren(root.children, { resolveUpload }).trim();
}
