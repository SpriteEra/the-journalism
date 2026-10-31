import { notFound } from "next/navigation";
import ListingLayout from "@/components/common/ListingLayout";
import { getSection } from "@/lib/data";
import { jsonLdList, statePath, toCards, toMetadata } from "@/lib/adapters";
import { abs } from "@/lib/site";
import CategoryList from "@/components/CategoryList";

const pageOf = (sp) => Math.max(parseInt(sp?.page, 10) || 1, 1);

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const page = pageOf(await searchParams);
  const key = decodeURIComponent(slug);
  const sec = await getSection("state", key, { page });
  if (!sec) return { title: "पेज नहीं मिला", robots: { index: false } };
  const canonical = abs(statePath(sec.doc?.slug || key)); // page 2, 3 … point to the first page's address
  const meta = toMetadata(sec.seo.meta, { canonical, fallback: { title: sec.name, description: sec.description } });
  return page > 1 ? { ...meta, title: { absolute: `${sec.name} — पेज ${page}` }, robots: { index: false, follow: true } } : meta;
}

/** /state/{state-name}: the news of one state, with previous / next pages */
export default async function StatePage({ params, searchParams }) {
  const { slug } = await params;
  const page = pageOf(await searchParams);
  const key = decodeURIComponent(slug);
  const sec = await getSection("state", key, { page });
  if (!sec) notFound();

  return (
    <CategoryList
      jsonld={sec.seo.jsonld}
      title={sec.name}
      items={sec.items}
      basePath={statePath(sec.doc?.slug || key)}
      page={page}
      hasMore={sec.hasMore}
    />
  );
}
