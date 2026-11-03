import { notFound, permanentRedirect } from "next/navigation";
import ListingLayout from "@/components/common/ListingLayout";
import { getTopic } from "@/lib/data";
import { jsonLdList, toMetadata, topicPath } from "@/lib/adapters";
import { abs, siteName } from "@/lib/site";

const pageOf = (sp) => Math.max(parseInt(sp?.page, 10) || 1, 1);

const OG_FALLBACK = "/og-default.png";
const stripSite = (t = "") => {
  const s = siteName();
  const trimmed = t.trim();
  return trimmed.endsWith(s) ? trimmed.slice(0, -s.length).replace(/[\s|\-–—:]+$/, "").trim() : trimmed;
};
export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const page = pageOf(await searchParams);
  const data = await getTopic(decodeURIComponent(slug), { page });
  if (!data) return { title: "विषय नहीं मिला", robots: { index: false, follow: false } };

  const { tag } = data;
  const meta = data.seo?.meta || {};
  const url = abs(topicPath(data.canonicalSlug)); // page 2, 3 … point to the first page
  const image = meta.image || tag.image || OG_FALLBACK;

  const title =
    page > 1
      ? `${tag.title} - पेज ${page}`
      : stripSite(meta.title) || `${tag.title}: ताज़ा खबरें, ख़बर और लेटेस्ट अपडेट`;
  const description =
    page > 1
      ? `${tag.title} से जुड़ी ताज़ा खबरें, पेज ${page}। ${siteName()} पर पढ़ें हर बड़ी खबर।`
      : meta.description ||
      tag.description ||
      `${tag.title} से जुड़ी ताज़ा खबरें, वीडियो और लेटेस्ट अपडेट ${siteName()} पर पढ़ें।`;

  return {
    title, // the layout's template adds "| siteName"
    description,
    alternates: { canonical: url },
    ...(page > 1 ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      siteName: siteName(),
      locale: "hi_IN",
      title: `${title} | ${siteName()}`,
      description,
      url,
      images: [{ url: image, alt: tag.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName()}`,
      description,
      images: [image],
    },
  };
}

export default async function TopicPage({ params, searchParams }) {
  const { slug } = await params;
  const key = decodeURIComponent(slug);
  const page = pageOf(await searchParams);
  const data = await getTopic(key, { page });
  if (!data) notFound();
  // a topic that was merged into another one (or renamed) lives at one address only
  if (data.canonicalSlug && data.canonicalSlug !== key) permanentRedirect(topicPath(data.canonicalSlug));
  return (
    <ListingLayout
      title={data.tag.title} eyebrow="विषय" description={data.tag.description}
      breadcrumb={[{ label: "होम", href: "/" }]}
      items={data.items} page={page} hasMore={data.hasMore} basePath={topicPath(data.canonicalSlug)}
      jsonLd={jsonLdList(data.seo.jsonLd)}
    />
  );
}
