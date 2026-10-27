import Image from "next/image";
import sanitizeHtml from "sanitize-html";

/**
 * Renders the story body (EditorJS blocks written in the admin panel) with the site's typography.
 * All editor HTML is sanitised on the server, so nothing in a story can run a script.
 * `afterBlock` = { index, node }: something (an ad) placed after that block.
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

/** only well-known video / social embeds are shown as frames; anything else becomes a plain link */
const EMBED_HOSTS = /^https:\/\/(www\.)?(youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/|www\.facebook\.com\/plugins\/|platform\.twitter\.com\/|twitframe\.com\/|www\.instagram\.com\/)/i;

/* ───────────── styles (static class names so Tailwind keeps them) ───────────── */
const P = "text-lg lg:text-[22px] leading-7 lg:leading-[31px] mt-4 tracking-[0.02em]";
const H = { 2: "text-[26px] lg:text-[32px]", 3: "text-[22px] lg:text-[27px]", 4: "text-xl lg:text-[23px]", 5: "text-lg lg:text-xl", 6: "text-lg" };
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
            node = (
              <blockquote className="my-6 border-l-[5px] border-primary bg-black/[0.03] py-3 pl-5 pr-4">
                <p className={`text-xl font-medium leading-8 lg:text-[26px] lg:leading-10 ${al}`} dangerouslySetInnerHTML={{ __html: cleanHtml(text) }} />
                {plain(d.caption) && <cite className="mt-1 block text-sm not-italic text-black/60" dangerouslySetInnerHTML={{ __html: cleanHtml(d.caption) }} />}
              </blockquote>
            );
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
            node = (
              <div className="my-5 rounded border border-amber-300 bg-amber-50 p-4">
                <b>{plain(d.title)}</b>
                <p className="mt-1">{plain(d.message)}</p>
              </div>
            );
            break;

          case "table":
            node = (
              <div className="my-5 overflow-x-auto">
                <table className="w-full border-collapse text-base lg:text-lg">
                  <tbody>
                    {(d.content || []).map((row, r) => (
                      <tr key={r} className="border-b border-black/10">
                        {row.map((cell, c) =>
                          r === 0 && d.withHeadings
                            ? <th key={c} className="bg-black/5 px-3 py-2 text-left font-semibold" dangerouslySetInnerHTML={{ __html: cleanHtml(cell) }} />
                            : <td key={c} className="px-3 py-2" dangerouslySetInnerHTML={{ __html: cleanHtml(cell) }} />
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            break;

          case "embed": {
            const cap = plain(d.caption).trim();
            const src = safeUrl(d.embed);
            const source = safeUrl(d.source);
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
            node = href ? <p className={P}><Link href={href} /></p> : null;
            break;
          }

          case "raw": {
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
            {afterBlock && afterBlock.index === i ? afterBlock.node : null}
          </div>
        );
      })}
    </>
  );
}