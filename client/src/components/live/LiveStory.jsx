import ArticleMedia from "@/components/article/ArticleMedia";
import EditorContent from "@/components/article/EditorContent";
import ShareActions from "@/components/article/ShareActions";
import { googleSourceUrl, abs } from "@/lib/site";
import { formatDate } from "@/utils/util";

/**
 * ONE live story: the main part only (badge, title, strap line, cover, body).
 * The timeline "updates" are not shown any more. Server component: used for the first story
 * (live/[slug]/page.jsx) and for every story that loads while the reader scrolls (lib/live-actions.jsx).
 */
export default function LiveStory({ live, first = false }) {
  const Title = first ? "h1" : "h2";
  const isLive = live.status === "live";
  const when = live.post_time || live.startTime;
  const media = live.image ? { type: "image", src: live.image, alt: live.imageAlt || live.title } : null;
  const href = `/live/${live.slug}`;

  return (
    <article className={first ? "" : "border-t-4 border-black/5 pt-6"} data-live-slug={live.slug}>
      <div className="mb-2 flex items-center gap-2">
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 rounded bg-primary px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
            <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden /> LIVE
          </span>
        ) : (
          <span className="rounded bg-black/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-black/70">समाप्त</span>
        )}
      </div>

      <Title className="font-khand text-[32px] font-bold leading-10.5 tracking-[0.01em] lg:text-[45px] lg:leading-13">{live.title}</Title>

      {live.caption && <p className="mt-3 text-lg leading-relaxed lg:mt-4 lg:text-[22px] lg:leading-7.5">{live.caption}</p>}

      <div className="mt-3 flex items-center gap-x-2 gap-y-3 lg:mt-5 lg:gap-x-5">
        {when && <time dateTime={new Date(when).toISOString()} className="whitespace-nowrap text-[13px] leading-normal text-black/75 lg:text-sm">{formatDate(when)}</time>}
        <ShareActions title={live.title} url={abs(href)} googleSourceHref={googleSourceUrl()} />
      </div>

      <ArticleMedia className="mt-4 lg:mt-5" media={media} priority={first} />
      <EditorContent content={live.content} />
    </article>
  );
}
