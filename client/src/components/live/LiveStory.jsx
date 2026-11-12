import ArticleMedia from "@/components/article/ArticleMedia";
import EditorContent from "@/components/article/EditorContent";
import ShareActions, { FollowOnGoogle } from "@/components/article/ShareActions";
import { googleSourceUrl, abs } from "@/lib/site";
import { formatDate } from "@/utils/util";
import Link from "next/link";
import LiveReadBeacon from "./LiveReadBeacon";
function NextStoryDivider({ label = "अगली खबर" }) {
  return (
    <div className="my-8 flex items-center gap-3 lg:my-6" role="separator" aria-label={label}>
      <span className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-black/40 to-black" aria-hidden />
      <span className="text-lg font-normal text-black lg:text-2xl">{label}</span>
      <span className="h-0.5 flex-1 bg-gradient-to-l from-transparent via-black/40 to-black" aria-hidden />
    </div>
  );
}
/**
 * ONE live story: the main part only (badge, title, strap line, cover, body).
 * The timeline "updates" are not shown any more. Server component: used for the first story
 * (live/[slug]/page.jsx) and for every story that loads while the reader scrolls (lib/live-actions.jsx).
 */
export default function LiveStory({ live, first = false }) {
  if (!live) return null;

  const { title, image, imageAlt, description, status, post_time, author } = live;
  const Title = first ? "h1" : "h2";
  const isLive = status === "live";
  const when = post_time || live.startTime;
  const media = image ? { type: "image", src: image, alt: imageAlt || title, caption: imageAlt } : null;
  const href = `/live/${live.slug}`;
  return (
    <>
      {!first && <NextStoryDivider />}
      <article className={first ? "" : "pt-4"} data-live-slug={live.slug} data-live-title={title}>
        <LiveReadBeacon slug={live.slug} first={first} />
        <div className="mb-2 flex items-center gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded bg-primary px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
              <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden /> LIVE
            </span>
          ) : (
            <span className="rounded bg-black/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-black/70">समाप्त</span>
          )}
        </div>

        <Title className="font-khand text-[32px] font-bold leading-10.5 tracking-[0.01em] lg:text-[45px] lg:leading-13">{title}</Title>

        {/* {description && <p className="mt-3 text-lg leading-relaxed lg:mt-4 lg:text-[22px] lg:leading-7.5">{description}</p>} */}

        <div className="mt-3 flex flex-col gap-4 lg:mt-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between">
            {author && (
              <div className="flex items-stretch gap-3">
                <span className="w-1 shrink-0 bg-primary" aria-hidden />
                <div>
                  <Link href={`/author/${author.username}`} className="text-xl font-bold leading-normal text-black hover:text-primary lg:text-[22px]">
                    {author.fullName}
                  </Link>
                  {author.designation && <p className="-mt-1 text-xs font-medium leading-normal text-black">{author.designation}</p>}
                </div>
              </div>
            )}
            <div className="lg:hidden">
              <FollowOnGoogle href={googleSourceUrl()} />
            </div>
          </div>
          <div className="flex items-center gap-x-2 gap-y-3 lg:gap-x-5">
            {when && <time dateTime={when} className="whitespace-nowrap text-[13px] leading-normal text-black/75 lg:text-sm">{formatDate(when)}</time>}
            <ShareActions title={title} googleSourceHref={googleSourceUrl()} />
          </div>
        </div>

        <ArticleMedia className="mt-4 lg:mt-5" media={media} priority={first} />
        {
          description &&
          <div className="mt-3 text-lg leading-relaxed lg:mt-4 lg:text-[22px] lg:leading-7.5 bg-[#fff1f0] p-2 lg:p-3 italic rounded-[5px]">
            <p>{description}</p>
          </div>
        }
        <EditorContent content={live.content} />


        <div className="flex items-center w-fit mt-5 lg:mt-6 gap-x-2 gap-y-3 lg:gap-x-5">
          <ShareActions title={live.title} url={abs(href)} googleSourceHref={googleSourceUrl()} />
        </div>
      </article>
    </>
  );
}
