import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Facebook, Forward, Link2, Monitor, Share2, Smartphone, Tablet, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/cn";
import { fmtDate } from "../../lib/api";
import { handleImageError } from "../../utils/imageError";
import EditorContent from "./EditorContent";

/*
 * Fonts: add this ONCE to your global CSS (index.css), before `@import "tailwindcss"`:
 *
 *   @import url('https://fonts.googleapis.com/css2?family=Khand:wght@300;400;500;600;700&family=Mukta:wght@200;300;400;500;600;700;800&display=swap');
 *   @import "tailwindcss";
 *   @theme {
 *     --font-khand: "Khand", sans-serif;
 *     --font-mukta: "Mukta", sans-serif;
 *   }
 *
 * Then `font-mukta` (default text) and `font-khand` (headings) work as classes below.
 */

// [id, label, icon, frame width]
const DEVICES = [
  ["mobile", "Mobile", Smartphone, "max-w-[390px]"],
  ["tablet", "Tablet", Tablet, "max-w-[768px]"],
  ["desktop", "Desktop", Monitor, "max-w-6xl"], // same as frontend `page-container max-w-6xl`
];

/** True when the real browser window is >= Tailwind `lg` (the frontend switches layout at this width). */
function useIsLg() {
  const query = "(min-width: 1024px)";
  const [match, setMatch] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = (e) => setMatch(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return match;
}

/**
 * Full-screen reader preview of a story. Mirrors the public article page of the frontend:
 * breadcrumb -> title -> subtitle -> author/date/share -> hero media -> body -> topics -> author card, with the ad column on desktop.
 *
 * `news` = { title, banner, description, content, topics:[names], keywords:{hi,en}, categories:[names], places:[names], location,
 *            author (string | {name, role, bio, image}), authorRole, authorBio, authorImage,
 *            createdAt, imageRef, isVideo, video }
 */
export default function NewsPreview({ open, onClose, news }) {
  const { t } = useTranslation();
  const [device, setDevice] = useState("desktop");
  const isLgScreen = useIsLg();

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
  // The frontend uses `lg:` breakpoints. Inside the preview frame we pick the layout by device instead of by window width.
  const lg = device === "desktop" && isLgScreen;
  const sm = device !== "mobile"; // the frontend's `sm:` (640px+) applies to tablet and desktop frames, not the 390px mobile frame
  const author = typeof news.author === "string" ? { name: news.author } : news.author || {};
  const authorName = author.name;
  const authorRole = author.role || news.authorRole;
  const authorBio = author.bio || news.authorBio;
  const authorImage = author.image || news.authorImage;

  const kw = [...(news.keywords?.hi || []), ...(news.keywords?.en || [])];
  const topics = news.topics || [];
  const category = (news.categories || [])[0];
  const places = [news.location, ...(news.places || [])].filter(Boolean).join(", ");
  const publishedAt = news.createdAt || new Date();

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

      <div className="min-h-0 flex-1 overflow-y-auto bg-surface-2 p-0 sm:p-6">
        {/* The reader site is always light, so the page itself ignores the admin theme. Mukta is the default font here. */}
        <div className={cn("mx-auto w-full bg-white font-mukta text-black transition-[max-width] duration-300 sm:rounded-2xl sm:shadow-pop", frame)}>
          <main className={cn("grid grid-cols-1 gap-4 px-4 pb-10 pt-6", lg && "grid-cols-8 pt-10")}>
            <section className={cn(lg && "col-span-6")}>
              {/* breadcrumb */}
              <nav aria-label="Breadcrumb" className={cn("mb-3 flex items-center overflow-hidden text-sm lg:text15 leading-normal overflow-x-auto no-scrollbar", lg && "text-sm")}>
                <span className="flex shrink-0 items-center">{t("Home")}</span>
                {category && (<><span aria-hidden className="mx-2">/</span><span className="shrink-0">{category}</span></>)}
                <span aria-hidden className="mx-2">/</span>
                <span className="truncate text-black">{news.title || "—"}</span>
              </nav>

              <div className={cn(lg && "border border-black/5 p-3")}>
                <article>
                  {/* heading: Khand */}
                  <h1 className={cn("font-khand font-bold tracking-[0.01em]", lg ? "text-[45px] leading-12.5" : "text-[32px] leading-[2.625rem]")}>
                    {news.title || "—"}
                  </h1>
                  {news.description && (
                    <p className={cn("mt-3 leading-relaxed", lg ? "mt-4 text-lg leading-7.5" : "text-lg")}>{news.description}</p>
                  )}

                  {/* author + date + actions */}
                  <div className={cn("mt-3 flex flex-col gap-4", lg && "mt-5 flex-row items-center justify-between")}>
                    <div className="flex items-center justify-between">
                      {authorName && (
                        <div className="flex items-stretch gap-3">
                          <span className="w-1 shrink-0 bg-red-500" aria-hidden />
                          <div>
                            <p className={cn("font-bold leading-normal text-black", lg ? "text-[22px]" : "text-xl")}>{authorName}</p>
                            {authorRole && <p className="-mt-1 text-xs font-medium leading-normal text-black">{authorRole}</p>}
                          </div>
                        </div>
                      )}
                      {!lg && <FollowOnGoogle label={t("Follow on Google")} />}
                    </div>

                    <div className={cn("flex items-center gap-x-2 gap-y-3", lg && "gap-x-5")}>
                      <time dateTime={new Date(publishedAt).toISOString()} className={cn("whitespace-nowrap text-[13px] leading-normal text-black/75", lg && "text-sm")}>
                        {fmtDate(publishedAt, true)}
                      </time>
                      <ShareRow />
                    </div>
                  </div>
                  {/* {places && <p className="mt-2 text-xs text-black/60">{places}</p>} */}

                  {/* hero media (video or image) */}
                  {(news.banner || (news.isVideo && news.video)) && (
                    <figure className={cn("mt-4", lg && "mt-5")}>
                      {news.isVideo && news.video ? (
                        <div className="aspect-video w-full overflow-hidden bg-black">
                          <video src={news.video} poster={news.banner || undefined} controls className="size-full" />
                        </div>
                      ) : (
                        <div className="aspect-video w-full overflow-hidden bg-black/5">
                          <img src={news.banner} alt={news.title || ""} onError={handleImageError} className="size-full object-cover" />
                        </div>
                      )}
                      {news.imageRef && <figcaption className="mt-1.5 text-xs text-black/60">{t("Photo")}: {news.imageRef}</figcaption>}
                    </figure>
                  )}

                  {/* body: Mukta text, Khand for any headings inside the story, frontend paragraph sizing */}
                  <div className={cn(
                    "mt-4 text-lg leading-7 tracking-[0.02em]",
                    "[&_p]:mt-4 [&_p]:font-mukta [&_p]:text-lg [&_p]:leading-7 [&_p]:tracking-[0.02em] [&_li]:font-mukta",
                    "[&_h1]:font-khand [&_h2]:font-khand [&_h3]:font-khand [&_h4]:font-khand",
                    lg && "text-[22px] leading-[31px] [&_p]:text-[22px] [&_p]:leading-[31px]"
                  )}>
                    <EditorContent content={news.content} />
                  </div>
                </article>

                {(topics.length > 0 || kw.length > 0) && (
                  <div className={cn("mt-2.5 border-t border-gray-200 pt-2.5", lg && "mt-4 pt-4")}>
                    {topics.length > 0 && (
                      <div className={cn("flex flex-wrap items-baseline gap-x-2 text-base font-medium leading-[31px] tracking-[0.02em]", lg && "gap-y-1 text-lg")}>
                        <span className="text-black">{t("Topics")}:</span>
                        <ul className="flex flex-wrap items-baseline gap-x-1">
                          {topics.map((topic, i) => (
                            <li key={topic}>
                              <span className="cursor-pointer text-red-500 underline decoration-red-500/40 underline-offset-4 transition-colors hover:decoration-red-500">
                                {topic}
                              </span>
                              {i < topics.length - 1 && <span className="text-red-500">,</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* {kw.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-black/55">
                        {kw.map((k) => <span key={k}>#{k}</span>)}
                      </div>
                    )} */}
                  </div>
                )}

                {authorName && (
                  <section
                    aria-label={t("About the author")}
                    className={cn(
                      "mt-4 flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 px-2 shadow-[0px_0px_2px_0px_#0000001A]",
                      sm && "items-center gap-5",
                      lg && "gap-4 p-5 px-3 shadow-[0px_0px_4px_0px_#0000001A]",
                      lg && "gap-5" // sm:gap-5 comes later in your CSS than lg:gap-4, so it wins
                    )}
                  >
                    <div className={cn("relative size-21 shrink-0 overflow-hidden rounded-full bg-gray-200", lg && "size-36")}>
                      {authorImage ? (
                        <img src={authorImage} alt={authorName} onError={handleImageError} className="size-full object-cover object-top" />
                      ) : (
                        <span className="grid size-full place-items-center text-3xl font-bold text-black/40">{authorName.slice(0, 1)}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={cn("text-xs", lg && "text-[15px]")}>{t("About the author")}</p>
                      <span className={cn("block text-2xl font-bold leading-normal text-black transition-colors hover:text-primary", lg && "text-3xl")}>
                        {authorName}
                      </span>
                      {authorBio && (
                        <p className={cn("line-clamp-2 text-sm leading-snug text-black/65", lg && "mt-1 text-lg leading-6")}>
                          {authorBio}
                        </p>
                      )}
                    </div>
                  </section>
                )}
              </div>
            </section>

            {/* ad column, desktop only (the frontend renders <SideAds /> here) */}
            {lg && (
              <section className="relative col-span-2 min-h-50 space-y-3.5 pt-9">
                <div className="sticky top-4">
                  <div className="grid h-[250px] place-items-center border border-dashed border-black/20 bg-black/[0.03] text-xs text-black/40">
                    {t("Ad space")}
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Static stand-ins for the frontend's ShareActions / FollowOnGoogle (they are Next.js components and can't be imported here). */
const GoogleG = ({ className = "size-4" }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden>
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
  </svg>
);

export const FollowOnGoogle = () => {

  return (
    <p
      className={`flex items-center gap-2 rounded-full border border-black px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-black/5 lg:px-3.5 lg:text-sm`}
    >
      <GoogleG />
      <span>पर हमें चुनें</span>
    </p>
  );
};

const ShareRow = () => {

  return (
    <div className="flex items-center gap-2 lg:gap-3 justify-end w-full">
      <div className="max-lg:hidden">
        <FollowOnGoogle />

      </div>

      <button
        type="button"
        aria-label="WhatsApp पर शेयर करें"
        className="flex items-center justify-center transition-transform hover:scale-105"
      >
        <img
          className="object-contain"
          width={32}
          height={32}
          alt="Follow On Whatsapp"
          src={'/whatsapp.png'}
        />
      </button>

      <button
        type="button"
        className="flex items-center gap-1.5 rounded-full border border-black px-3 lg:px-3.5 py-1.5 text-xs font-medium text-black transition-colors hover:bg-black/5 lg:text-sm"
      >
        <span>{"Share"}</span>
        <Forward className="size-3.5" aria-hidden />
      </button>
    </div>
  );
};
