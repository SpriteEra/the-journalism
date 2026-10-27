import { notFound, permanentRedirect } from "next/navigation";
import { getSection } from "@/lib/data";
import { subCategoryPath, toMetadata } from "@/lib/adapters";
import { abs } from "@/lib/site";
import CategoryList from "@/components/CategoryList";

const pageOf = (sp) => Math.max(parseInt(sp?.page, 10) || 1, 1);

export async function generateMetadata({ params, searchParams }) {
  const { category, sub } = await params;
  const page = pageOf(await searchParams);
  const sec = await getSection("category", sub, { page });
  if (!sec) return { title: "पेज नहीं मिला", robots: { index: false } };
  const canonical = abs(subCategoryPath(sec.parent?.slug || category, sub));
  const meta = toMetadata(sec.seo.meta, { canonical, fallback: { title: sec.name, description: sec.description } });
  return page > 1 ? { ...meta, title: { absolute: `${sec.name} — पेज ${page}` }, robots: { index: false, follow: true } } : meta;
}

export default async function page({ params, searchParams }) {
  const { category, sub } = await params;
  const page = pageOf(await searchParams);
  const sec = await getSection("category", sub, { page });
  if (!sec) notFound();
  const parentSlug = sec.parent?.slug || category;
  if (sec.parent && sec.parent.slug !== category) {
    permanentRedirect(subCategoryPath(sec.parent.slug, sub));
  }
  const { name, items, hasMore } = sec
  return (
    <CategoryList
      jsonld={sec.seo.jsonld}
      title={name}
      items={items}
      basePath={subCategoryPath(parentSlug, sub)}
      page={page}
      hasMore={hasMore}
    />
  )
}
