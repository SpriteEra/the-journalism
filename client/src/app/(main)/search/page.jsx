import ListingLayout from "@/components/common/ListingLayout";
import { getPopularTopics, searchNews } from "@/lib/data";
import { topicPath } from "@/lib/adapters";
import { abs, siteName } from "@/lib/site";

const LIMIT = 12;
const pageOf = (sp) => Math.max(parseInt(sp?.page, 10) || 1, 1);


const OG_IMAGE = { url: "/og-default.png", width: 1200, height: 630, alt: siteName() };

// search result pages are never put in Google's index
export async function generateMetadata({ searchParams }) {
  const q = String((await searchParams)?.q || "").trim().slice(0, 80);

  const title = q ? `“${q}” की खोज` : "खोज";
  const description = q
    ? `${siteName()} पर “${q}” से जुड़ी ताज़ा खबरें और परिणाम।`
    : `${siteName()} पर खबर, जगह या विषय लिखकर खोजें।`;
  const url = abs("/search"); // never self-reference the ?q= URL, so no query variants get picked up

  return {
    title, // the layout's template adds "| siteName"
    description,
    alternates: { canonical: url },
    robots: { index: false, follow: true },
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

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const q = String(sp?.q || "").trim().slice(0, 80);
  const page = pageOf(sp);
  const [{ items, total }, popular] = await Promise.all([searchNews({ search: q, page, limit: LIMIT }), q.length < 2 ? getPopularTopics({ limit: 10 }) : Promise.resolve([])]);
  return (
    <ListingLayout
      title={q ? `“${q}” की खोज` : "खोज"} description={q.length >= 2 ? `${total} परिणाम` : "खबर, जगह या विषय लिखकर खोजें।"}
      breadcrumb={[{ label: "होम", href: "/" }]}
      chips={popular.map((t) => ({ label: t.label, href: topicPath(t.slug) }))}
      items={items} page={page} hasMore={page * LIMIT < total} basePath={`/search?q=${encodeURIComponent(q)}`}
      empty={q.length >= 2 ? "कोई परिणाम नहीं मिला। दूसरे शब्द से खोजकर देखें।" : "ऊपर खोज बॉक्स में कुछ लिखें।"}
    />
  );
}
