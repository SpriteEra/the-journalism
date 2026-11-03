import { notFound } from "next/navigation";
import ListingLayout from "@/components/common/ListingLayout";
import { getSection } from "@/lib/data";
import { jsonLdList, statePath, toCards, toMetadata } from "@/lib/adapters";
import { abs, siteName } from "@/lib/site";
import CategoryList from "@/components/CategoryList";

const pageOf = (sp) => Math.max(parseInt(sp?.page, 10) || 1, 1);

const OG_FALLBACK = "/og-default.png";

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const page = pageOf(await searchParams);
  const key = decodeURIComponent(slug);
  const sec = await getSection("state", key, { page });
  if (!sec) return { title: "पेज नहीं मिला", robots: { index: false, follow: false } };

  const meta = sec.seo?.meta || {};
  const url = abs(statePath(sec.doc?.slug || key)); // page 2, 3 … point to the first page
  const image = meta.image || sec.image || OG_FALLBACK;

  const title =
    page > 1
      ? `${sec.name} की खबरें - पेज ${page}`
      : meta.title || `${sec.name} की ताज़ा खबरें: ${sec.name} न्यूज़ और लेटेस्ट अपडेट`;
  const description =
    page > 1
      ? `${sec.name} की ताज़ा खबरें, पेज ${page}। ${siteName()} पर पढ़ें ${sec.name} की हर बड़ी खबर।`
      : meta.description ||
      sec.description ||
      `${sec.name} की ताज़ा खबरें, राजनीति, अपराध, मौसम और हर बड़ी खबर ${siteName()} पर पढ़ें।`;

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
      images: [{ url: image, alt: sec.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName()}`,
      description,
      images: [image],
    },
  };
}

/** /state/{state-name}: the news of one state, with previous / next pages */
export default async function StatePage({ params, searchParams }) {
  const { slug } = await params;
  const page = pageOf(await searchParams);
  const key = decodeURIComponent(slug);
  const sec = await getSection("state", key, { page });
  if (!sec) notFound();
  const serverLd = sec.seo?.jsonld;
  const hasLd = Array.isArray(serverLd) ? serverLd.length > 0 : !!serverLd;
  const pageUrl = abs(statePath(sec.doc?.slug || key));

  const fallbackLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${sec.name} की ताज़ा खबरें`,
      url: pageUrl,
      inLanguage: "hi-IN",
      isPartOf: { "@type": "WebSite", name: siteName(), url: abs("/") },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "होम", item: abs("/") },
        { "@type": "ListItem", position: 2, name: "राज्य", item: abs("/state") },
        { "@type": "ListItem", position: 3, name: sec.name, item: pageUrl },
      ],
    },
  ];
  return (
    <CategoryList
      jsonld={hasLd ? serverLd : fallbackLd}
      title={sec.name}
      items={sec.items}
      basePath={statePath(sec.doc?.slug || key)}
      page={page}
      hasMore={sec.hasMore}
    />
  );
}
