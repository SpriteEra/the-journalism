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
import ReadBeacon from "@/components/article/ReadBeacon";

const OG_FALLBACK = "/og-default.png";

const clean = (s, n = 155) => {
  const t = (s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await getVideo(decodeURIComponent(id));
  if (!data) return { title: "वीडियो नहीं मिला", robots: { index: false, follow: false } };

  const v = data.video;
  const description = clean(v.description) || `${v.title}: ${siteName()} पर देखें यह वीडियो।`;
  const url = abs(v.href);
  const image = v.image || OG_FALLBACK;

  return {
    title: v.title, // the layout's template adds "| siteName"
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "video.other",
      siteName: siteName(),
      locale: "hi_IN",
      url,
      title: `${v.title} | ${siteName()}`,
      description,
      images: [{ url: image, alt: v.title }],
      ...(v.publishedAt ? { releaseDate: new Date(v.publishedAt).toISOString() } : {}),
      ...(v.tags?.length ? { tags: v.tags } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${v.title} | ${siteName()}`,
      description,
      images: [image],
    },
  };
}

export default async function VideoPage({ params }) {
  const { id } = await params;
  const data = await getVideo(decodeURIComponent(id));
  if (!data) notFound();
  const { video: v, more } = data;
  const ld = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.title,
    description: v.description || v.title,
    thumbnailUrl: [v.image ? abs(v.image) : abs("/og-default.png")],
    ...(v.publishedAt ? { uploadDate: new Date(v.publishedAt).toISOString() } : {}),
    ...(v.updatedAt ? { dateModified: new Date(v.updatedAt).toISOString() } : {}),
    ...(v.duration ? { duration: v.duration } : {}), // ISO 8601, e.g. "PT2M30S"
    ...(v.youtubeId ? { embedUrl: `https://www.youtube.com/embed/${v.youtubeId}` } : {}),
    ...(v.videoUrl ? { contentUrl: v.videoUrl } : {}),
    ...(v.tags?.length ? { keywords: v.tags.join(", ") } : {}),
    inLanguage: "hi-IN",
    url: abs(v.href),
    mainEntityOfPage: abs(v.href),
    publisher: {
      "@type": "NewsMediaOrganization",
      name: siteName(),
      logo: { "@type": "ImageObject", url: abs("/logo.png") },
    },
  };


  return (
    <div className="page-container mt-8 grid max-w-6xl grid-cols-1 gap-4 lg:mt-14 lg:grid-cols-8">
      <JsonLd data={[ld, {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "होम", item: abs("/") },
          { "@type": "ListItem", position: 2, name: "वीडियो", item: abs("/videos") },
          { "@type": "ListItem", position: 3, name: v.title, item: abs(v.href) },
        ],
      }]} />
      <ReadBeacon type={"yt"} id={v.sourceType ? v.slug : v.id} />
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
