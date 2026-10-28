import Image from "next/image";
import sanitizeHtml from "sanitize-html";

/**
 * Renders the story body (EditorJS blocks written in the admin panel) with the site's typography.
 * All editor HTML is sanitised on the server, so nothing in a story can run a script.
 * `afterBlock` = { index, node } or an array of them: something (an ad, "read also") placed after that block.
 * Keep this a SERVER component (sanitize-html is heavy).
 */

/* ───────────── sanitising ───────────── */
const INLINE = {
  allowedTags: ["b", "strong", "i", "em", "u", "a", "mark", "code", "br", "sub", "sup", "s", "span"],
  allowedAttributes: { a: ["href", "target", "rel"], mark: ["class"], span: ["class"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: (tag, attribs) => ({ tagName: "a", attribs: { href: attribs.href || "#", target: "_blank", rel: "noopener noreferrer" } }),
  },
};

/** Hosts allowed for iframes (embed block + raw block) */
const IFRAME_HOSTS = [
  "www.youtube.com", "www.youtube-nocookie.com", "player.vimeo.com",
  "www.facebook.com", "platform.twitter.com", "twitframe.com", "www.instagram.com",
];

/** `raw` block: richer HTML (blockquote, img, tables, allowed iframes). Scripts, styles and event handlers are always removed. */
const RAW = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "img", "iframe", "figure", "figcaption", "span", "mark", "u", "s", "sub", "sup", "h1", "h2",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    iframe: ["src", "width", "height", "title", "allowfullscreen", "loading"],
    div: ["class"], span: ["class"], blockquote: ["class"], p: ["class"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedIframeHostnames: IFRAME_HOSTS,
  transformTags: {
    a: (tag, attribs) => ({ tagName: "a", attribs: { href: attribs.href || "#", target: "_blank", rel: "noopener noreferrer" } }),
  },
};

export const cleanHtml = (html = "") => sanitizeHtml(String(html), INLINE);
const cleanRaw = (html = "") => sanitizeHtml(String(html), RAW);
const plain = (html = "") => sanitizeHtml(String(html), { allowedTags: [], allowedAttributes: {} });
const safeUrl = (u = "") => (/^https?:\/\//i.test(String(u).trim()) ? String(u).trim() : null);

export const blocksOf = (content) => (Array.isArray(content) ? content[0]?.blocks : content?.blocks) || [];

/**
 * Index of the block to insert something after, near the middle of the story.
 * Picks the paragraph closest to the centre, so a list, table, embed or heading is never split.
 */
export const middleBlockIndex = (content) => {
  const blocks = blocksOf(content);
  if (!blocks.length) return -1;
  const mid = Math.floor(blocks.length / 2);
  for (let o = 0; o < blocks.length; o++) {
    for (const i of [mid - o, mid + o]) {
      if (i >= 0 && i < blocks.length - 1 && blocks[i]?.type === "paragraph") return i;
    }
  }
  return blocks.length - 1; // very short story: show after the last block
};

/** only well-known video / social embeds are shown as frames; anything else becomes a plain link */
const EMBED_HOSTS = /^https:\/\/(www\.)?(youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/|www\.facebook\.com\/plugins\/|platform\.twitter\.com\/|twitframe\.com\/|www\.instagram\.com\/)/i;

/* ───────────── Instagram ─────────────
 * Instagram's official embed code is a <blockquote> + <script>. The script can never run here
 * (we strip scripts, and scripts injected via innerHTML don't execute anyway), so instead we pull the
 * post permalink out of the pasted code and show Instagram's own iframe version of the post.
 */
const IG_POST = /instagram\.com\/(p|reels?|tv)\/([A-Za-z0-9_-]+)/i;

/** any text containing an Instagram post/reel link -> https://www.instagram.com/<type>/<id>/embed */
const igEmbedUrl = (text = "") => {
  const m = String(text).match(IG_POST);
  if (!m) return null;
  const type = m[1].toLowerCase() === "reels" ? "reel" : m[1].toLowerCase();
  return `https://www.instagram.com/${type}/${m[2]}/embed`;
};

/** permalink from pasted Instagram embed code: prefers data-instgrm-permalink, then any post href */
const igFromRaw = (html = "") => {
  const s = String(html);
  const looksLikeIg = /instagram-media|data-instgrm/i.test(s) || /^\s*https?:\/\/(www\.)?instagram\.com\/\S+\s*$/i.test(s);
  if (!looksLikeIg) return null;
  const permalink = s.match(/data-instgrm-permalink=["']([^"']+)["']/i)?.[1];
  return igEmbedUrl(permalink) || igEmbedUrl(s);
};

const InstagramFrame = ({ src, caption }) => (
  <div className="my-6 flex w-full flex-col items-center">
    <iframe
      src={src}
      title={caption || "Instagram post"}
      loading="lazy"
      scrolling="no"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      className="h-[700px] w-full max-w-[540px] rounded border border-gray-200 bg-white"
    />
    {caption && <p className="mt-2 text-center text-sm text-black/60">{caption}</p>}
  </div>
);

/* ───────────── styles (static class names so Tailwind keeps them) ───────────── */
const P = "text-lg lg:text-[22px] leading-7 lg:leading-[31px] mt-4 tracking-[0.02em]";
const H = { 2: "text-[26px] lg:text-[32px]", 3: "text-[22px] lg:text-[27px]", 4: "text-xl lg:text-[23px]", 5: "text-lg lg:text-xl", 6: "text-lg" };
const FIRST_ROW_IS_HEADER = true; // style the first table row as a header even if the editor's "With headings" is off
const ALIGN = { left: "text-left", center: "text-center", right: "text-right", justify: "text-justify" };

const Link = ({ href, className = "" }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={`break-all text-primary underline ${className}`}>{href}</a>
);

export default function EditorContent({ content, afterBlock }) {
  const blocks = blocksOf(content);

  return (
    <>
      {blocks.map((b, i) => {
        const d = b.data || {};
        const al = ALIGN[b.tunes?.alignmentTune?.alignment] || "";
        let node = null;

        switch (b.type) {
          case "header": {
            const level = Math.min(Math.max(Number(d.level) || 2, 2), 6); // h1 is reserved for the story title
            const Tag = `h${level}`;
            node = <Tag className={`mt-6 font-khand font-bold leading-snug ${H[level]} ${al}`} dangerouslySetInnerHTML={{ __html: cleanHtml(d.text) }} />;
            break;
          }

          case "paragraph":
            node = plain(d.text).trim() ? <p className={`${P} ${al}`} dangerouslySetInnerHTML={{ __html: cleanHtml(d.text) }} /> : null;
            break;

          case "list": {
            const Tag = d.style === "ordered" ? "ol" : "ul";
            node = (
              <Tag className={`mt-4 space-y-1.5 pl-6 text-lg lg:text-[22px] lg:leading-[31px] ${d.style === "ordered" ? "list-decimal" : "list-disc"}`}>
                {(d.items || []).map((it, k) => (
                  <li key={k} dangerouslySetInnerHTML={{ __html: cleanHtml(typeof it === "string" ? it : it?.content) }} />
                ))}
              </Tag>
            );
            break;
          }

          case "checklist":
            node = (
              <ul className="mt-4 space-y-1.5 text-lg lg:text-[22px]">
                {(d.items || []).map((it, k) => (
                  <li key={k} className="flex gap-2">
                    <span aria-hidden>{it.checked ? "☑" : "☐"}</span>
                    <span dangerouslySetInnerHTML={{ __html: cleanHtml(it.text) }} />
                  </li>
                ))}
              </ul>
            );
            break;

          case "quote": {
            const text = d.text ?? d.quote; // EditorJS uses `text`; `quote` kept for older stories
            node = plain(text).trim() ? (
              <blockquote className="relative my-8 overflow-hidden rounded-xl border border-black/5 bg-gradient-to-br from-gray-50 to-white px-5 pb-5 pt-12 shadow-sm sm:px-8 sm:pb-6 sm:pt-14">
                {/* accent bar */}
                <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-primary" />
                {/* opening quote mark */}
                <svg aria-hidden viewBox="0 0 24 24" className="absolute left-5 top-4 size-9 fill-primary sm:left-8 sm:size-11">
                  <path d="M9.6 4C5.4 5.7 3 9 3 13.4V20h7.2v-7.2H6.6c0-2.6 1.2-4.5 3.6-5.6L9.6 4zm10.2 0c-4.2 1.7-6.6 5-6.6 9.4V20h7.2v-7.2h-3.6c0-2.6 1.2-4.5 3.6-5.6L19.8 4z" />
                </svg>
                <p
                  className={`font-medium italic leading-8 text-gray-900 text-[21px] sm:text-2xl lg:text-[28px] lg:leading-[1.45] ${al}`}
                  dangerouslySetInnerHTML={{ __html: cleanHtml(text) }}
                />
                {plain(d.caption).trim() && (
                  <footer className="mt-4 flex items-center gap-3">
                    <span aria-hidden className="h-0.5 w-8 shrink-0 bg-primary" />
                    <cite className="text-sm font-semibold not-italic tracking-wide text-black/65 sm:text-base" dangerouslySetInnerHTML={{ __html: cleanHtml(d.caption) }} />
                  </footer>
                )}
              </blockquote>
            ) : null;
            break;
          }

          case "image":
          case "simpleImage": {
            const url = d.file?.url || d.url;
            const cap = plain(d.caption).trim();
            node = url ? (
              <figure className="my-5">
                <div className="relative aspect-video w-full overflow-hidden border border-gray-200 bg-gray-200">
                  <Image src={url} alt={cap} fill sizes="(max-width: 1024px) 100vw, 760px" className="object-contain" />
                </div>
                {cap && <figcaption className="rounded-b-md bg-[#f2f2f2] p-1 text-center text-[15px]">{cap}</figcaption>}
              </figure>
            ) : null;
            break;
          }

          case "delimiter":
            node = <p aria-hidden className="py-3 text-center text-3xl tracking-[0.6em] text-black/30">*****</p>;
            break;

          case "warning":
            node = (plain(d.title).trim() || plain(d.message).trim()) ? (
              <aside role="note" className="my-6 flex gap-3 overflow-hidden rounded-xl border border-amber-300/70 bg-gradient-to-r from-amber-50 via-amber-50 to-orange-50 p-4 shadow-sm sm:gap-4 sm:p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white shadow sm:size-12">
                  <svg aria-hidden viewBox="0 0 24 24" className="size-6 fill-none stroke-current sm:size-7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                    <path d="M12 9v4M12 17h.01" />
                  </svg>
                </span>
                <div className="min-w-0">
                  {plain(d.title).trim() && <p className="text-lg font-bold leading-snug text-amber-900 sm:text-xl">{plain(d.title)}</p>}
                  {plain(d.message).trim() && <p className="mt-1 text-base leading-relaxed text-amber-900/80 sm:text-lg">{plain(d.message)}</p>}
                </div>
              </aside>
            ) : null;
            break;

          case "table": {
            const rows = (d.content || []).filter((r) => Array.isArray(r) && r.length);
            if (!rows.length) { node = null; break; }
            const cols = Math.max(...rows.map((r) => r.length));
            // first row is always styled as the header; set FIRST_ROW_IS_HEADER = false to follow the editor's "With headings" toggle instead
            const hasHead = FIRST_ROW_IS_HEADER ? rows.length > 1 : !!d.withHeadings;
            const [head, body] = hasHead ? [rows[0], rows.slice(1)] : [null, rows];
            node = (
              <div className="my-6 overflow-hidden rounded-xl border border-black/10 shadow-sm">
                {/* wide tables scroll sideways inside the card on phones */}
                <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
                  <table className="w-full border-collapse text-[15px] sm:text-base lg:text-lg" style={{ minWidth: `${Math.min(cols * 130, 720)}px` }}>
                    {head && (
                      <thead>
                        <tr className="bg-primary text-white">
                          {head.map((cell, c) => (
                            <th key={c} scope="col" className="whitespace-nowrap px-3 py-3 text-left text-sm font-bold uppercase tracking-wide sm:px-4 sm:text-[15px]" dangerouslySetInnerHTML={{ __html: cleanHtml(cell) }} />
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {body.map((row, r) => (
                        <tr key={r} className="border-t border-black/10 odd:bg-white even:bg-gray-50 hover:bg-amber-50/60">
                          {Array.from({ length: cols }, (_, c) => (
                            <td key={c} className="px-3 py-2.5 align-top sm:px-4 sm:py-3" dangerouslySetInnerHTML={{ __html: cleanHtml(row[c] ?? "") }} />
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
            break;
          }

          case "embed": {
            const cap = plain(d.caption).trim();
            const src = safeUrl(d.embed);
            const source = safeUrl(d.source);

            // Instagram post/reel (embed or source URL) -> Instagram's iframe version
            const ig = igEmbedUrl(d.embed) || igEmbedUrl(d.source);
            if (ig) {
              node = <InstagramFrame src={ig} caption={cap} />;
              break;
            }

            node = src && EMBED_HOSTS.test(src) ? (
              <div className="my-6 w-full">
                <div className="mx-auto aspect-video w-full max-w-3xl overflow-hidden rounded bg-black">
                  <iframe
                    src={src}
                    title={plain(d.service) || cap || "Embedded media"}
                    loading="lazy"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="size-full"
                  />
                </div>
                {cap && <p className="mt-2 text-center text-sm text-black/60">{cap}</p>}
              </div>
            ) : source ? <p className={P}><Link href={source} /></p> : null;
            break;
          }

          case "linkTool": {
            const href = safeUrl(d.link);
            const ig = igEmbedUrl(href);
            node = ig ? <InstagramFrame src={ig} /> : href ? <p className={P}><Link href={href} /></p> : null;
            break;
          }

          case "raw": {
            // Pasted Instagram embed code (blockquote + script): render as iframe instead
            const ig = igFromRaw(d.html);
            if (ig) {
              node = <InstagramFrame src={ig} />;
              break;
            }

            const html = cleanRaw(d.html).trim();
            node = html ? <div className="my-6 flex w-full justify-center [&_iframe]:max-w-full [&_img]:h-auto [&_img]:max-w-full" dangerouslySetInnerHTML={{ __html: html }} /> : null;
            break;
          }

          default:
            node = plain(d.text).trim() ? <p className={`${P} ${al}`} dangerouslySetInnerHTML={{ __html: cleanHtml(d.text) }} /> : null;
        }

        return (
          <div key={i}>
            {node}
            {[].concat(afterBlock || []).filter((a) => a && a.index === i).map((a, k) => <div key={k}>{a.node}</div>)}
          </div>
        );
      })}
    </>
  );
}