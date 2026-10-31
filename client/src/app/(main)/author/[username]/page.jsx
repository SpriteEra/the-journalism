import { notFound } from "next/navigation";
import { Globe, MapPin } from "lucide-react";
import ArticleBreadCrumb from "@/components/article/ArticleBreadCrumb";
import JsonLd from "@/components/common/JsonLd";
import Img from "@/components/common/Img";
import Pagination from "@/components/common/Pagination";
import SectionHeading from "@/components/common/SectionHeading";
import StoryGrid from "@/components/common/StoryGrid";
import SideAds from "@/components/ads/SideAds";
import { getAuthor, getAuthorNews } from "@/lib/data";
import { authorPath, jsonLdList } from "@/lib/adapters";
import { abs, siteName } from "@/lib/site";

const SOCIAL = { website: "वेबसाइट", x: "X", facebook: "Facebook", instagram: "Instagram", youtube: "YouTube", linkedin: "LinkedIn" };
const PER_PAGE = 12;
const pageOf = (sp) => Math.max(parseInt(sp?.page, 10) || 1, 1);

// the server returns { title, description, image, url, jsonLd } for an author
export async function generateMetadata({ params, searchParams }) {
  const { username } = await params;
  const page = pageOf(await searchParams);
  const data = await getAuthor(decodeURIComponent(username));
  if (!data) return { title: "लेखक नहीं मिला", robots: { index: false } };
  const { seo, author } = data;
  const base = seo.title || `${author.name} | ${siteName()}`;
  const title = page > 1 ? `${author.name} — पेज ${page} | ${siteName()}` : base;
  const url = abs(authorPath(author.username)); // every page points to the author's main page
  return {
    title: { absolute: title }, description: seo.description, alternates: { canonical: url },
    ...(page > 1 ? { robots: { index: false, follow: true } } : {}), // page 2, 3 … are for readers; the first page is what gets indexed
    openGraph: { type: "profile", title, description: seo.description, url, ...(seo.image ? { images: [{ url: seo.image, alt: author.name }] } : {}) },
    twitter: { card: "summary", title, description: seo.description },
  };
}

export default async function AuthorPage({ params, searchParams }) {
  const { username } = await params;
  const page = pageOf(await searchParams);
  const name = decodeURIComponent(username);
  const [data, stories] = await Promise.all([getAuthor(name), getAuthorNews(name, { page, limit: PER_PAGE })]);
  if (!data) notFound();
  const { author: a, seo } = data;
  const links = Object.entries(a.social || {}).filter(([, v]) => v);
  return (
    <div className="page-container mt-8 grid grid-cols-1 gap-4 lg:mt-14 lg:grid-cols-8">
      <JsonLd data={jsonLdList(seo.jsonLd)} />
      <section className="lg:col-span-6">
        <ArticleBreadCrumb breadcrumb={[{ label: "होम", href: "/" }]} title={a.name} />
        <article className="flex flex-col gap-5 border border-black/5 p-5 sm:flex-row">
          <div className="relative size-32 shrink-0 overflow-hidden rounded-full bg-gray-200 lg:size-40">
            {a.photo && <Img src={a.photo} alt={a.name} fill priority sizes="160px" className="object-cover" />}
          </div>
          <div className="min-w-0">
            <h1 className="font-khand text-[32px] font-bold leading-tight lg:text-[42px]">{a.name}</h1>
            {a.designation && <p className="text-lg font-medium text-primary">{a.designation}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-black/65">
              {a.location && <span className="inline-flex items-center gap-1"><MapPin className="size-4" />{a.location}</span>}
              <span>{a.published} प्रकाशित खबरें</span>
            </div>
            <p className="mt-4 whitespace-pre-line text-lg leading-7 lg:text-[20px] lg:leading-8">{a.about}</p>
            {links.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {links.map(([k, url]) => <li key={k}><a href={url} target="_blank" rel="me noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-black/15 px-3 py-1 text-sm hover:border-primary hover:text-primary"><Globe className="size-3.5" />{SOCIAL[k] || k}</a></li>)}
              </ul>
            )}
          </div>
        </article>

        {/* stories published by this author */}
        <section className="mt-8" aria-label={`${a.name} की खबरें`}>
          <SectionHeading noLink headingTitle={`${a.name} की खबरें${page > 1 ? ` — पेज ${page}` : ""}`} />
          {stories.items.length > 0
            ? <StoryGrid items={stories.items} className="mt-3" />
            : <p className="mt-4 rounded border border-dashed border-black/15 p-10 text-center text-lg text-black/60">इस पेज पर कोई खबर उपलब्ध नहीं है।</p>}
          <Pagination basePath={authorPath(a.username)} page={page} hasMore={stories.hasMore} />
        </section>
      </section>
      <aside className="relative min-h-50 pt-3 lg:col-span-2 lg:pt-9">
        <div className="sticky top-35">
          <SideAds />
        </div>
      </aside>
    </div>
  );
}
