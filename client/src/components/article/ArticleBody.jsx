import ArticleBreadCrumb from "@/components/article/ArticleBreadCrumb";
import ArticleMedia from "@/components/article/ArticleMedia";
import ArticleTopics from "@/components/article/ArticleTopics";
import AuthorCard from "@/components/article/AuthorCard";
import EditorContent, { middleBlockIndex } from "@/components/article/EditorContent";
import ShareActions, { FollowOnGoogle } from "@/components/article/ShareActions";
import HorizontalScroller from "@/components/common/HorizontalScroller";
import JsonLd from "@/components/common/JsonLd";
import NewsCard from "@/components/common/NewsCard";
import SectionHeading from "@/components/common/SectionHeading";
import { categoryPath, jsonLdList, topicPath } from "@/lib/adapters";
import { googleSourceUrl } from "@/lib/site";
import { formatDate } from "@/utils/util";
import Link from "next/link";

/**
 * ONE story: breadcrumb, headline, byline, media, body, topics, author card.
 * A SERVER component on purpose (EditorContent sanitises the editor HTML with sanitize-html) — the first story of the page renders it
 * during the request, and the infinite scroll gets the next ones from a Server Action that returns this same component (see lib/actions.jsx).
 *
 *   data    = result of getArticle() / getOlderArticle()
 *   footer  = optional node shown under the story card (the first story uses it for "more from this section")
 */
export default function ArticleBody({ data, footer = null }) {
  const { article, seo } = data;

  const route = article.primaryRoute || {};
  const section = route.kind === "state"
    ? (article.state || []).find((s) => s.slug === route.slug)
    : (article.category || []).find((c) => c.slug === route.slug) || article.category?.[0];
  const sectionName = section?.name || section?.displayName || section?.state;

  const breadcrumb = [{ label: "होम", href: "/" }];
  if (sectionName) breadcrumb.push({ label: sectionName, href: categoryPath(route.slug || section?.slug) });

  const topics = (article.tags || []).map((t) => ({ label: t.title, href: topicPath(t.slug) }));
  const media = article.isVideo && article.video
    ? { type: "video", src: article.video, poster: article.banner, alt: article.title }
    : article.banner
      ? { type: "image", src: article.banner, alt: article.title, caption: article.imageRef ? `फोटो: ${article.imageRef}` : undefined }
      : null;
  const published = article.post_time || article.createdAt;

  const readAlso = (article.related || []).map((r) => ({ id: r.news_id, title: r.title, image: r.banner, href: r.path }));

  // "यह भी पढ़ें" goes in the middle of the story body (after the paragraph nearest the centre)
  const midIndex = middleBlockIndex(article.content);
  const readAlsoNode = readAlso.length > 0 ? (
    <section className="my-5 bg-[#BFF2EC] p-2" aria-label="यह भी पढ़ें">
      <SectionHeading className="text-black!" noLink headingTitle="यह भी पढ़ें" />
      <HorizontalScroller className="mt-1" label="यह भी पढ़ें">
        {readAlso.map((it, i) => <NewsCard className="text-black bg-white p-1" key={`${it.id}-${i}`} item={it} priority={i < 3} />)}
      </HorizontalScroller>
    </section>
  ) : null;

  const afterBlocks = [];
  if (readAlsoNode && midIndex >= 0) afterBlocks.push({ index: midIndex, node: readAlsoNode });
  // add your in-article ad here if you have one, e.g. afterBlocks.push({ index: Math.max(0, midIndex - 2), node: <Ad /> });

  return (
    <>
      <JsonLd data={jsonLdList(seo?.jsonLd)} />
      <ArticleBreadCrumb breadcrumb={breadcrumb} title={article.title} />

      <div className="border-black/5 lg:border lg:p-3">
        <article>
          <h1 className="font-khand text-[32px] font-bold leading-10.5 tracking-[0.01em] lg:text-[45px] lg:leading-13">{article.title}</h1>

          {article.description && <p className="mt-3 text-lg leading-relaxed lg:mt-4 lg:text-[22px] lg:leading-7.5">{article.description}</p>}

          <div className="mt-3 flex flex-col gap-4 lg:mt-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between">
              {article?.author && (
                <div className="flex items-stretch gap-3">
                  <span className="w-1 shrink-0 bg-primary" aria-hidden />
                  <div>
                    <Link href={article.author.profileUrl || "/"} className="text-xl font-bold leading-normal text-black hover:text-primary lg:text-[22px]">
                      {article.author.fullName}
                    </Link>
                    {article.author.designation && <p className="-mt-1 text-xs font-medium leading-normal text-black">{article.author.designation}</p>}
                  </div>
                </div>
              )}
              <div className="lg:hidden"><FollowOnGoogle href={googleSourceUrl()} /></div>
            </div>
            <div className="flex items-center gap-x-2 gap-y-3 lg:gap-x-5">
              {published && <time dateTime={published} className="whitespace-nowrap text-[13px] leading-normal text-black/75 lg:text-sm">{formatDate(published)}</time>}
              <ShareActions title={article.title} googleSourceHref={googleSourceUrl()} />
            </div>
          </div>

          <ArticleMedia className="mt-4 lg:mt-5" media={media} />
          <EditorContent content={article.content} afterBlock={afterBlocks} />
        </article>

        {topics.length > 0 && (
          <div className="mt-2.5 border-t border-gray-200 pt-2.5 lg:mt-4 lg:pt-4">
            <ArticleTopics topics={topics} />
          </div>
        )}

        <AuthorCard author={article?.author} className="mt-4" />
      </div>

      {footer}
    </>
  );
}
