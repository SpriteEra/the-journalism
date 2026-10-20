const ALLOWED = new Set(["B", "STRONG", "I", "EM", "U", "A", "MARK", "CODE", "BR", "SPAN", "SUB", "SUP", "S"]);
const SAFE_HREF = /^(https?:|mailto:|tel:|\/|#)/i;

/** Inline-HTML sanitizer for editor text (bold / italic / links / marker). Anything else is reduced to its text. */
export function sanitizeInline(html = "") {
  if (typeof DOMParser === "undefined") return String(html).replace(/<[^>]*>/g, "");
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 1) {
        if (!ALLOWED.has(child.tagName)) { child.replaceWith(...child.childNodes); return walk(node); }
        [...child.attributes].forEach((a) => {
          const keep = (child.tagName === "A" && a.name === "href" && SAFE_HREF.test(a.value.trim())) || (a.name === "class" && /^[\w\s-]+$/.test(a.value));
          if (!keep) child.removeAttribute(a.name);
        });
        if (child.tagName === "A") { child.setAttribute("target", "_blank"); child.setAttribute("rel", "noopener noreferrer"); }
        walk(child);
      } else if (child.nodeType !== 3) child.remove();
    });
  };
  walk(doc.body.firstChild);
  return doc.body.firstChild.innerHTML;
}

/** Plain text of an EditorJS document (used for AI keyword generation and read-time). */
export const editorBlocks = (content) => (Array.isArray(content) ? content[0]?.blocks : content?.blocks) || [];
export const editorPlainText = (content) =>
  editorBlocks(content).map((b) => (["paragraph", "header", "quote"].includes(b.type) ? String(b.data?.text || "").replace(/<[^>]*>/g, "").trim() : "")).filter(Boolean).join(" ");
export const readMinutes = (content) => Math.max(1, Math.round(editorPlainText(content).split(/\s+/).filter(Boolean).length / 180));
