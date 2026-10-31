import { notFound } from "next/navigation";
import SideAds from "@/components/ads/SideAds";
import ArticleBreadCrumb from "@/components/article/ArticleBreadCrumb";
import JsonLd from "@/components/common/JsonLd";
import LiveStory from "@/components/live/LiveStory";
import LiveFeed from "@/components/live/LiveFeed";
import { getLive } from "@/lib/data";
import { jsonLdList, toMetadata } from "@/lib/adapters";
import { abs } from "@/lib/site";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getLive(decodeURIComponent(slug));
  if (!data) return { title: "लाइव ख़बर नहीं मिली", robots: { index: false } };
  return toMetadata(data.seo.meta, { canonical: abs(`/live/${data.live.slug}`), fallback: { title: data.live.title, description: data.live.caption } });
}

/** Live news detail: the main story only (no updates). The next live stories load below it while the reader scrolls. */
export default async function LivePage({ params }) {
  const { slug } = await params;
  const data = await getLive(decodeURIComponent(slug));
  if (!data) notFound();
  const { live, seo } = data;

  const breadcrumb = [{ label: "होम", href: "/" }, { label: "लाइव न्यूज़", href: "/live" }];

  return (
    <div className="page-container mt-8 grid max-w-6xl grid-cols-1 gap-4 lg:mt-14 lg:grid-cols-8">
      <JsonLd data={jsonLdList(seo.jsonLd)} />

      <section className="lg:col-span-6">
        <ArticleBreadCrumb breadcrumb={breadcrumb} title={live.title} />
        <div className="border-black/5 lg:border lg:p-3">
          <LiveStory live={live} first />
          <LiveFeed afterSlug={live.slug} />
        </div>
      </section>

      <aside className="relative min-h-50 space-y-3.5 pt-3 lg:col-span-2 lg:pt-9">
        <div className="sticky top-35 space-y-6"><SideAds /></div>
      </aside>
    </div>
  );
}
