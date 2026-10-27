import { notFound, permanentRedirect } from "next/navigation";
import ListingLayout from "@/components/common/ListingLayout";
import { getTopic } from "@/lib/data";
import { jsonLdList, toMetadata, topicPath } from "@/lib/adapters";
import { abs } from "@/lib/site";

const pageOf = (sp) => Math.max(parseInt(sp?.page, 10) || 1, 1);

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const page = pageOf(await searchParams);
  const data = await getTopic(decodeURIComponent(slug), { page });
  if (!data) return { title: "विषय नहीं मिला", robots: { index: false } };
  const meta = toMetadata(data.seo.meta, { canonical: abs(topicPath(data.canonicalSlug)), fallback: { title: data.tag.title, description: data.tag.description } });
  return page > 1 ? { ...meta, title: { absolute: `${data.tag.title} — पेज ${page}` }, robots: { index: false, follow: true } } : meta;
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
