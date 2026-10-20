import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Clock, MapPin, Monitor, Share2, Smartphone, Tablet, Tag, User, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/cn";
import { fmtDate } from "../../lib/api";
import { readMinutes } from "../../lib/sanitizeHtml";
import { handleImageError } from "../../utils/imageError";
import Badge from "../ui/Badge";
import EditorContent from "./EditorContent";

const DEVICES = [["mobile", "Mobile", Smartphone, "max-w-[390px]"], ["tablet", "Tablet", Tablet, "max-w-[768px]"], ["desktop", "Desktop", Monitor, "max-w-5xl"]];

/**
 * Full-screen reader preview of a story: exactly the fields the reader sees (banner, title, summary, body, topics, keywords ...).
 * `news` = { title, banner, description, content, topics:[names], keywords:{hi,en}, categories:[names], places:[names], location,
 *            author, createdAt, imageRef, isVideo, video }
 */
export default function NewsPreview({ open, onClose, news }) {
  const { t } = useTranslation();
  const [device, setDevice] = useState("desktop");
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [open, onClose]);
  if (!open || !news) return null;

  const frame = DEVICES.find((d) => d[0] === device)[3];
  const kw = [...(news.keywords?.hi || []), ...(news.keywords?.en || [])];
  const isMobile = device === "mobile";

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-canvas animate-fade-in" role="dialog" aria-modal="true" aria-label={t("Full preview")}>
      <header className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-3 py-2.5 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">{t("Full preview")}</p>
          <p className="hidden truncate text-xs text-fg-subtle sm:block">{t("This is how the story will look to readers")}</p>
        </div>
        <div className="hidden items-center gap-1 rounded-full bg-surface-2 p-1 sm:flex" role="tablist" aria-label="Device">
          {DEVICES.map(([id, label, Icon]) => (
            <button key={id} type="button" role="tab" aria-selected={device === id} onClick={() => setDevice(id)}
              className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors", device === id ? "bg-primary text-primary-fg shadow-sm" : "text-fg-muted hover:text-fg")}>
              <Icon className="size-3.5" />{label}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} aria-label={t("Close")} className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-fg hover:bg-surface-3 focus-ring"><X className="size-5" /></button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-linear-to-b from-surface-2 to-canvas p-0 sm:p-6">
        <article className={cn("mx-auto w-full overflow-hidden bg-surface shadow-pop transition-[max-width] duration-300 sm:rounded-3xl sm:border sm:border-line", frame)}>
          {news.banner && (
            <figure>
              <div className="aspect-video w-full overflow-hidden bg-surface-3">
                <img src={news.banner} alt="" onError={handleImageError} className="size-full object-cover" />
              </div>
              {news.imageRef && <figcaption className="px-5 pt-2 text-right text-xs text-fg-subtle">{t("Image credit")}: {news.imageRef}</figcaption>}
            </figure>
          )}
          <div className={cn("space-y-5 p-5", !isMobile && "sm:p-10")}>
            <div className="flex flex-wrap gap-1.5">
              {(news.categories || []).map((c) => <Badge key={c} tone="accent">{c}</Badge>)}
              {(news.topics || []).map((c) => <Badge key={c} tone="primary">{c}</Badge>)}
            </div>
            <h1 className={cn("hindi-font font-bold leading-tight text-fg", isMobile ? "text-2xl" : "text-3xl sm:text-4xl")}>{news.title || "—"}</h1>
            {news.description && <p className="hindi-font border-l-4 border-primary/40 pl-4 text-lg leading-8 text-fg-muted">{news.description}</p>}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-line py-3 text-sm text-fg-subtle">
              <span className="inline-flex items-center gap-1.5"><User className="size-4" />{news.author || "—"}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" />{fmtDate(news.createdAt || new Date(), true)}</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="size-4" />{readMinutes(news.content)} min</span>
              {(news.location || news.places?.length > 0) && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{[news.location, ...(news.places || [])].filter(Boolean).join(", ")}</span>}
              <span className="ml-auto inline-flex items-center gap-1.5 text-primary"><Share2 className="size-4" />{t("Share")}</span>
            </div>

            {news.isVideo && news.video && (
              <div className="aspect-video overflow-hidden rounded-2xl bg-ink">
                <video src={news.video} controls className="size-full" />
              </div>
            )}

            <EditorContent content={news.content} />

            {kw.length > 0 && (
              <div className="space-y-2 border-t border-line pt-5">
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg"><Tag className="size-4" />{t("Keywords")}</p>
                <div className="flex flex-wrap gap-2">{kw.map((k) => <span key={k} className="rounded-full bg-surface-3 px-3 py-1 text-xs text-fg-muted">#{k}</span>)}</div>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>,
    document.body
  );
}
