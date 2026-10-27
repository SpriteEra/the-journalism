import { notFound, permanentRedirect } from "next/navigation";
import ArticleView from "@/components/article/ArticleView";
import { getArticle } from "@/lib/data";
import { toMetadata } from "@/lib/adapters";
import { abs } from "@/lib/site";

/** the section part of the link is whatever the reader typed; the story is found by its slug alone */
const requestedPath = (category, slug) => `/${decodeURIComponent(category)}/news/${decodeURIComponent(slug)}`;

export async function generateMetadata({ params }) {
  const { category, slug } = await params;
  const data = await getArticle(decodeURIComponent(slug));
  if (!data) return { title: "समाचार नहीं मिला", robots: { index: false } };
  return toMetadata(data.seo.meta, { canonical: abs(data.canonicalPath || requestedPath(category, slug)), fallback: { title: data.article.title, description: data.article.description } });
}

export default async function ArticlePage({ params }) {
  const { category, slug } = await params;
  const data = await getArticle(decodeURIComponent(slug));
  if (!data) notFound();
  // wrong section in the link (or an old link): the story opens at its real address — a permanent redirect, so Google follows it
  if (data.canonicalPath && data.canonicalPath !== requestedPath(category, slug)) permanentRedirect(data.canonicalPath);
  return <ArticleView data={data} />;
}
