import { notFound, permanentRedirect } from "next/navigation";
import { getSection } from "@/lib/data";
import { categoryPath, statePath, subCategoryPath, toMetadata } from "@/lib/adapters";
import { abs } from "@/lib/site";
import CategoryList from "@/components/CategoryList";

const pageOf = (sp) => Math.max(parseInt(sp?.page, 10) || 1, 1);

async function resolve(slug, page) {
    const cat = await getSection("category", slug, { page });
    if (cat) return cat;
    return getSection("state", slug, { page });
}

export async function generateMetadata({ params, searchParams }) {
    const { category } = await params;
    const page = pageOf(await searchParams);
    const sec = await resolve(category, page);
    if (!sec) return { title: "पेज नहीं मिला", robots: { index: false } };
    const canonical = abs(categoryPath(category));          // page 2, 3 … point to the first page's address
    const meta = toMetadata(sec.seo.meta, { canonical, fallback: { title: sec.name, description: sec.description } });
    return page > 1 ? { ...meta, title: { absolute: `${sec.name} — पेज ${page}` }, robots: { index: false, follow: true } } : meta;
}

export default async function page({ params, searchParams }) {
    const { category } = await params;
    const page = pageOf(await searchParams);
    const sec = await resolve(category, page);
    if (!sec) notFound();
    if (sec.kind === "state") permanentRedirect(statePath(category)); // states live at /state/{slug}

    const { name, items, hasMore } = sec

    return (
        <CategoryList
            jsonld={sec.seo.jsonld}
            title={name}
            items={items}
            basePath={categoryPath(category)}
            page={page}
            hasMore={hasMore}
        />
    )
}
