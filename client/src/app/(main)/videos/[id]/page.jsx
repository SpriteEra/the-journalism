import { notFound } from "next/navigation";
import SideAds from "@/components/ads/SideAds";
import ArticleBreadCrumb from "@/components/article/ArticleBreadCrumb";
import ArticleMedia from "@/components/article/ArticleMedia";
import ShareActions, { FollowOnGoogle } from "@/components/article/ShareActions";
import JsonLd from "@/components/common/JsonLd";
import SectionHeading from "@/components/common/SectionHeading";
import VideoCard from "@/components/common/VideoCard";
import { getVideo } from "@/lib/data";
import { abs, googleSourceUrl, siteName } from "@/lib/site";
import { formatDate } from "@/utils/util";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await getVideo(decodeURIComponent(id));
  if (!data) return { title: "वीडियो नहीं मिला", robots: { index: false } };
  const v = data.video;
  const description = v.description || v.title;
  return {
    title: v.title, description, alternates: { canonical: abs(v.href) },
    openGraph: { type: "video.other", url: abs(v.href), title: v.title, description, images: [{ url: v.image, alt: v.title }], locale: "hi_IN" },
    twitter: { card: "summary_large_image", title: v.title, description, images: [v.image] },
  };
}

export default async function VideoPage({ params }) {
  const { id } = await params;
  const data = await getVideo(decodeURIComponent(id));
  if (!data) notFound();
  const { video: v, more } = data;
  const ld = {
    "@context": "https://schema.org", "@type": "VideoObject", name: v.title, description: v.description || v.title, thumbnailUrl: [v.image],
    uploadDate: v.publishedAt, inLanguage: "hi", url: abs(v.href), embedUrl: `https://www.youtube.com/embed/${v.youtubeId}`,
    publisher: { "@type": "Organization", name: siteName() },
  };
  return (
    <div className="page-container mt-8 grid max-w-6xl grid-cols-1 gap-4 lg:mt-14 lg:grid-cols-8">
      <JsonLd data={ld} />
      <section className="lg:col-span-6">
        <ArticleBreadCrumb breadcrumb={[{ label: "होम", href: "/" }, { label: "वीडियो", href: "/videos" }]} title={v.title} />
        <article>
          <h1 className="font-khand text-[30px] font-bold leading-10 lg:text-[42px] lg:leading-12">{v.title}</h1>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4 text-sm text-black/75">
              {v.publishedAt && <time dateTime={v.publishedAt}>{formatDate(v.publishedAt)}</time>}
              {v.location && <span>{v.location}</span>}
            </div>
            <div className="flex items-center gap-3"><FollowOnGoogle href={googleSourceUrl()} className="lg:hidden" /><ShareActions title={v.title} googleSourceHref={googleSourceUrl()} /></div>
          </div>
          <ArticleMedia className="mt-4" media={{ type: "video", src: v.videoUrl, poster: v.image, alt: v.title }} />
          {v.description && <p className="mt-4 whitespace-pre-line text-lg leading-7 lg:text-[22px] lg:leading-[31px]">{v.description}</p>}
          {v.tags?.length > 0 && <ul className="mt-4 flex flex-wrap gap-2">{v.tags.map((t) => <li key={t} className="rounded-full border border-black/15 px-3 py-1 text-sm">{t}</li>)}</ul>}
        </article>
        {more.length > 0 && (
          <section className="mt-8" aria-label="और वीडियो">
            <SectionHeading headingTitle="और वीडियो" href="/videos" />
            <div className="mt-4 grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">{more.map((m) => <VideoCard key={m.id} item={m} layout="vertical" />)}</div>
          </section>
        )}
      </section>
      <aside className="relative min-h-50 pt-3 lg:col-span-2 lg:pt-9"><div className="sticky top-35"><SideAds /></div></aside>
    </div>
  );
}
