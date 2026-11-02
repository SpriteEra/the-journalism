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
import { getRelatedNews } from "@/lib/data";
import { categoryPath, topicPath, jsonLdList } from "@/lib/adapters";
import { googleSourceUrl } from "@/lib/site";
import { formatDate } from "@/utils/util";
import Link from "next/link";
import AuthorCard from "./AuthorCard";
import NewsCard from "../common/NewsCard";
import HorizontalScroller from "@/components/common/HorizontalScroller";

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
  const [relatedAll] = await Promise.all([
    getRelatedNews(article.news_id),
  ]);


  const readAlso = (article.related || []).map((r) => ({ id: r.news_id, title: r.title, image: r.banner, href: r.path }));

  const readAlsoIds = new Set(readAlso.map((r) => r.id));
  const related = relatedAll.filter((r) => !readAlsoIds.has(r.id));

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
                      <Link href={`/author/${article.author.username}`} className="text-xl font-bold leading-normal text-black hover:text-primary lg:text-[22px]">
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

        {related.length > 0 && (
          <section className="mt-8" aria-label="संबंधित ख़बरें">
            <SectionHeading noLink headingTitle="संबंधित ख़बरें" />
            <StoryGrid items={related} className="mt-4" />
          </section>
        )}
      </section>
      <aside className="relative min-h-50 space-y-3.5 pt-3 lg:col-span-2 lg:pt-9">
        <div className="sticky top-3 space-y-6">
          <SideAds />
        </div>
        <div className="sticky top-70 space-y-6">
          <LatestNews title="इन्हे भी पढ़े" />
        </div>
      </aside>
    </div>
  );
}