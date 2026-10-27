import ListingLayout from "@/components/common/ListingLayout";
import { getLatest } from "@/lib/data";
import { abs } from "@/lib/site";

const pageOf = (sp) => Math.max(parseInt(sp?.page, 10) || 1, 1);

export async function generateMetadata({ searchParams }) {
  const page = pageOf(await searchParams);
  return { title: page > 1 ? `ताज़ा खबरें — पेज ${page}` : "ताज़ा खबरें", description: "देश और दुनिया की ताज़ा खबरें।", alternates: { canonical: abs("/latest") }, ...(page > 1 ? { robots: { index: false, follow: true } } : {}) };
}

export default async function LatestPage({ searchParams }) {
  const page = pageOf(await searchParams);
  const { items, hasMore } = await getLatest({ page, limit: 12 });
  return <ListingLayout title="ताज़ा खबरें" description="सबसे नई खबरें, सबसे ऊपर।" breadcrumb={[{ label: "होम", href: "/" }]} items={items} page={page} hasMore={hasMore} basePath="/latest" />;
}
