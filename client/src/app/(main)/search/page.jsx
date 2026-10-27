import ListingLayout from "@/components/common/ListingLayout";
import { getPopularTopics, searchNews } from "@/lib/data";
import { topicPath } from "@/lib/adapters";

const LIMIT = 12;
const pageOf = (sp) => Math.max(parseInt(sp?.page, 10) || 1, 1);

// search result pages are never put in Google's index
export async function generateMetadata({ searchParams }) {
  const q = String((await searchParams)?.q || "").trim();
  return { title: q ? `“${q}” की खोज` : "खोज", robots: { index: false, follow: true } };
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
