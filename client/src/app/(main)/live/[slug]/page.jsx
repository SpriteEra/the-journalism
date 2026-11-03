import { notFound } from "next/navigation";
import SideAds from "@/components/ads/SideAds";
import ArticleBreadCrumb from "@/components/article/ArticleBreadCrumb";
import JsonLd from "@/components/common/JsonLd";
import LiveStory from "@/components/live/LiveStory";
import LiveFeed from "@/components/live/LiveFeed";
import { getLive } from "@/lib/data";
import { jsonLdList } from "@/lib/adapters";
import LatestNews from "@/components/LatestNews";
import { abs, siteName } from "@/lib/site";
const OG_FALLBACK = "/og-default.png";

const clean = (s, n = 155) => {
  const t = (s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getLive(decodeURIComponent(slug));
  if (!data) return { title: "लाइव ख़बर नहीं मिली", robots: { index: false, follow: false } };

  const { live, seo } = data;
  const meta = seo?.meta || {};
  const title = meta.title || live.title;
  const description = clean(meta.description || live.caption) || `${live.title}: ${siteName()} पर देखें लाइव अपडेट।`;
  const url = abs(`/live/${live.slug}`);
  const image = meta.image || live.image || OG_FALLBACK;

  return {
    title, // the layout's template adds "| siteName"
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      siteName: siteName(),
      locale: "hi_IN",
      title: `${title} | ${siteName()}`,
      description,
      url,
      images: [{ url: image, alt: live.title }],
      ...(live.publishedAt ? { publishedTime: new Date(live.publishedAt).toISOString() } : {}),
      ...(live.updatedAt ? { modifiedTime: new Date(live.updatedAt).toISOString() } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName()}`,
      description,
      images: [image],
    },
  };
}

/** Live news detail: the main story only (no updates). The next live stories load below it while the reader scrolls. */
export default async function LivePage({ params }) {
  const { slug } = await params;
  const data = await getLive(decodeURIComponent(slug));
  if (!data) notFound();
  const { live, seo } = data;

  const breadcrumb = [{ label: "होम", href: "/" }, { label: "लाइव न्यूज़", href: "/live" }];
  const serverLd = jsonLdList(seo?.jsonLd);
  const hasLd = Array.isArray(serverLd) ? serverLd.length > 0 : !!serverLd;

  const fallbackLd = {
    "@context": "https://schema.org",
    "@type": "LiveBlogPosting",
    headline: live.title,
    description: live.caption,
    url: abs(`/live/${live.slug}`),
    mainEntityOfPage: abs(`/live/${live.slug}`),
    inLanguage: "hi-IN",
    image: [live.image ? abs(live.image) : abs("/og-default.png")],
    ...(live.publishedAt ? { datePublished: new Date(live.publishedAt).toISOString(), coverageStartTime: new Date(live.publishedAt).toISOString() } : {}),
    dateModified: new Date(live.updatedAt || live.publishedAt || Date.now()).toISOString(),
    publisher: { "@type": "NewsMediaOrganization", name: siteName(), logo: { "@type": "ImageObject", url: abs("/logo.png") } },
  };
  return (
    <div className="page-container mt-8 grid max-w-6xl grid-cols-1 gap-4 lg:mt-14 lg:grid-cols-8">
      <JsonLd data={hasLd ? serverLd : fallbackLd} />

      <section className="lg:col-span-6">
        <ArticleBreadCrumb breadcrumb={breadcrumb} title={live.title} />
        <div className="border-black/5 lg:border lg:p-3">
          <LiveStory live={live} first />
          <LiveFeed afterSlug={live.slug} />
        </div>
      </section>

      <aside className="relative min-h-50 space-y-3.5 pt-3 lg:col-span-2 lg:pt-9">
        <div className="sticky top-3 space-y-6">
          <SideAds />

        </div>
        <div className="sticky top-70 space-y-6">
          <LatestNews />
        </div>
      </aside>
    </div>
  );
}
