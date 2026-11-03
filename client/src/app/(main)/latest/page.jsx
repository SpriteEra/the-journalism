import ListingLayout from "@/components/common/ListingLayout";
import { getLatest } from "@/lib/data";
import { abs, siteName } from "@/lib/site";

const pageOf = (sp) => Math.max(parseInt(sp?.page, 10) || 1, 1);


const OG_IMAGE = { url: "/og-default.png", width: 1200, height: 630, alt: siteName() };

export async function generateMetadata({ searchParams }) {
  const page = pageOf(await searchParams);

  const heading = "ताज़ा खबरें";
  const title = page > 1 ? `${heading} - पेज ${page}` : `${heading}: आज की ब्रेकिंग न्यूज़ और लेटेस्ट अपडेट`;
  const description =
    page > 1
      ? `देश और दुनिया की ताज़ा खबरें, पेज ${page}। ${siteName()} पर पढ़ें सबसे नई खबरें।`
      : `देश-दुनिया, राजनीति, खेल और मनोरंजन की ताज़ा खबरें और ब्रेकिंग न्यूज़ ${siteName()} पर पढ़ें, सबसे नई खबर सबसे ऊपर।`;
  const url = abs("/latest"); // every page points to the main listing

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
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName()}`,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
export default async function LatestPage({ searchParams }) {
  const page = pageOf(await searchParams);
  const { items, hasMore } = await getLatest({ page, limit: 12 });
  return <ListingLayout title="ताज़ा खबरें" description="सबसे नई खबरें, सबसे ऊपर।" breadcrumb={[{ label: "होम", href: "/" }]} items={items} page={page} hasMore={hasMore} basePath="/latest" />;
}
