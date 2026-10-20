import { editorBlocks, sanitizeInline } from "../../lib/sanitizeHtml";

const Html = ({ html, className, as: Tag = "p" }) => <Tag className={className} dangerouslySetInnerHTML={{ __html: sanitizeInline(html) }} />;

const HEADER = { 1: "text-3xl", 2: "text-2xl", 3: "text-xl", 4: "text-lg", 5: "text-base", 6: "text-base" };

/** Renders EditorJS blocks the way readers see them (sanitised, no editor code). */
export default function EditorContent({ content, className = "" }) {
  const blocks = editorBlocks(content);
  if (!blocks.length) return null;
  return (
    <div className={`hindi-font space-y-4 text-[1.0625rem] leading-8 text-fg ${className}`}>
      {blocks.map((b, i) => {
        const d = b.data || {};
        switch (b.type) {
          case "header": return <Html key={i} as={`h${Math.min(Math.max(d.level || 2, 2), 6)}`} html={d.text} className={`mt-6 font-bold leading-snug ${HEADER[d.level] || "text-2xl"}`} />;
          case "paragraph": return d.text ? <Html key={i} html={d.text} className="[&_a]:text-primary [&_a]:underline [&_mark]:rounded [&_mark]:bg-warning-soft [&_mark]:px-0.5" /> : null;
          case "list": return (
            <ul key={i} className={`space-y-1 pl-6 ${d.style === "ordered" ? "list-decimal" : "list-disc"}`}>
              {(d.items || []).map((it, k) => <li key={k} dangerouslySetInnerHTML={{ __html: sanitizeInline(typeof it === "string" ? it : it?.content || "") }} />)}
            </ul>
          );
          case "checklist": return <ul key={i} className="space-y-1">{(d.items || []).map((it, k) => <li key={k} className="flex gap-2"><input type="checkbox" checked={Boolean(it.checked)} readOnly className="mt-2 size-4 accent-primary" /><span dangerouslySetInnerHTML={{ __html: sanitizeInline(it.text || "") }} /></li>)}</ul>;
          case "quote": return (
            <blockquote key={i} className="rounded-r-xl border-l-4 border-accent bg-accent-soft/50 py-3 pl-5 pr-4">
              <Html html={d.text} className="text-xl font-medium leading-9" />
              {d.caption && <Html as="cite" html={d.caption} className="mt-1 block text-sm not-italic text-fg-subtle" />}
            </blockquote>
          );
          case "image": case "simpleImage": {
            const url = d.file?.url || d.url;
            return url ? <figure key={i}><img src={url} alt={d.caption || ""} loading="lazy" className="w-full rounded-xl object-contain" />{d.caption && <figcaption className="mt-1.5 text-center text-sm italic text-fg-subtle">{d.caption}</figcaption>}</figure> : null;
          }
          case "delimiter": return <p key={i} className="py-2 text-center text-2xl tracking-[0.6em] text-fg-faint" aria-hidden>***</p>;
          case "warning": return <div key={i} className="rounded-xl border border-warning/40 bg-warning-soft p-4"><b>{d.title}</b><p className="text-fg-muted">{d.message}</p></div>;
          case "table": return (
            <div key={i} className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm"><tbody>{(d.content || []).map((row, r) => <tr key={r} className="border-b border-line last:border-0">{row.map((cell, c) => (r === 0 && d.withHeadings ? <th key={c} className="bg-surface-2 px-3 py-2 text-left font-semibold" dangerouslySetInnerHTML={{ __html: sanitizeInline(cell) }} /> : <td key={c} className="px-3 py-2" dangerouslySetInnerHTML={{ __html: sanitizeInline(cell) }} />))}</tr>)}</tbody></table>
            </div>
          );
          case "embed": return d.embed ? <div key={i} className="aspect-video overflow-hidden rounded-xl bg-surface-3"><iframe src={d.embed} title={d.caption || "Embedded media"} className="size-full" allowFullScreen loading="lazy" /></div> : null;
          case "linkTool": return d.link ? <a key={i} href={d.link} target="_blank" rel="noopener noreferrer" className="block break-all font-medium text-primary underline">{d.link}</a> : null;
          default: return d.text ? <Html key={i} html={d.text} /> : null;
        }
      })}
    </div>
  );
}
