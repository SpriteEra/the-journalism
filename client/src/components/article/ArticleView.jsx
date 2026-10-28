import SideAds from "@/components/ads/SideAds";
import ArticleBreadCrumb from "@/components/article/ArticleBreadCrumb";
import ArticleMedia from "@/components/article/ArticleMedia";
import ArticleTopics from "@/components/article/ArticleTopics";
import EditorContent, { middleBlockIndex } from "@/components/article/EditorContent";
import ReadBeacon from "@/components/article/ReadBeacon";
import ShareActions, { FollowOnGoogle } from "@/components/article/ShareActions";
import JsonLd from "@/components/common/JsonLd";
import StoryGrid from "@/components/common/StoryGrid";
import SectionHeading from "@/components/common/SectionHeading";
import LatestNews from "@/components/LatestNews";
import { getLatest } from "@/lib/data";
import { categoryPath, topicPath, jsonLdList } from "@/lib/adapters";
import { googleSourceUrl } from "@/lib/site";
import { formatDate } from "@/utils/util";
import Link from "next/link";
import AuthorCard from "./AuthorCard";
import NewsCard from "../common/NewsCard";
import HorizontalScroller from "@/components/common/HorizontalScroller";

/** The story page body. `data` = result of getArticle(). Used by the story route and by the old /news/<id> route. */
export default async function ArticleView({ data }) {
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

  // more stories of the same section (never the story itself)
  const more = await getLatest({ limit: 9, ...(route.kind === "state" ? { state: route.slug } : { category: route.slug }) });
  const moreItems = (more?.items || []).filter((i) => i.id !== article.news_id);
  const sidebar = moreItems.slice(0, 6);
  const below = moreItems.slice(6, 9);

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
    <div className="page-container mt-8 grid max-w-6xl grid-cols-1 gap-4 lg:mt-14 lg:grid-cols-8">
      <JsonLd data={jsonLdList(seo.jsonLd)} />
      <ReadBeacon id={article.news_id} />

      <section className="lg:col-span-6">
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

        {below.length > 0 && (
          <section className="mt-8" aria-label={`${sectionName || "और"} की ख़बरें`}>
            <SectionHeading title={sectionName ? `${sectionName} की और ख़बरें` : "और ख़बरें"} href={route.slug ? categoryPath(route.slug) : undefined} />
            <StoryGrid items={below} className="mt-4" />
          </section>
        )}
      </section>

      <aside className="relative min-h-50 space-y-3.5 pt-3 lg:col-span-2 lg:pt-9">
        <div className="sticky top-35 space-y-6">
          <SideAds />
          <LatestNews title="ताज़ा खबरें" titleHref={route.slug ? categoryPath(route.slug) : "/latest"} items={sidebar} />
        </div>
      </aside>
    </div>
  );
}