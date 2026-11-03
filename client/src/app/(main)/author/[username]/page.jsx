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
const ICON_PATHS = {
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  instagram: (
    <>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </>
  ),
  youtube: (
    <>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </>
  ),
  linkedin: (
    <>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </>
  ),
};

function SocialIcon({ name, className = "size-4" }) {
  if (name === "x") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (!ICON_PATHS[name]) return <Globe className={className} aria-hidden="true" />; // website / unknown
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
const SOCIAL = { website: "वेबसाइट", x: "X", facebook: "Facebook", instagram: "Instagram", youtube: "YouTube", linkedin: "LinkedIn" };
const PER_PAGE = 12;
const pageOf = (sp) => Math.max(parseInt(sp?.page, 10) || 1, 1);

const OG_FALLBACK = "/og-default.png";

// collapse whitespace/newlines and trim to a snippet-friendly length
const clean = (s, n = 155) => {
  const t = (s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};

export async function generateMetadata({ params, searchParams }) {
  const { username } = await params;
  const page = pageOf(await searchParams);
  const data = await getAuthor(decodeURIComponent(username));
  if (!data) return { title: "लेखक नहीं मिला", robots: { index: false, follow: false } };

  const { seo, author } = data;
  const base = seo.title || `${author.name}${author.designation ? ` - ${author.designation}` : ""} | ${siteName()}`;
  const title = page > 1 ? `${author.name} - पेज ${page} | ${siteName()}` : base;
  const description =
    seo.description || clean(author.about) || `${author.name} की ताज़ा खबरें और लेख ${siteName()} पर पढ़ें।`;
  const url = abs(authorPath(author.username)); // every page points to the author's main page
  const image = seo.image || author.photo || OG_FALLBACK;
  const [firstName, ...rest] = (author.name || "").split(" ");

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    ...(page > 1 ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "profile",
      siteName: siteName(),
      locale: "hi_IN",
      title,
      description,
      url,
      firstName,
      ...(rest.length ? { lastName: rest.join(" ") } : {}),
      username: author.username,
      images: [{ url: image, alt: author.name }],
    },
    twitter: {
      card: image === OG_FALLBACK ? "summary_large_image" : "summary",
      title,
      description,
      images: [image],
    },
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
                {links.map(([k, url]) => (
                  <li key={k}>
                    <a
                      href={url}
                      target="_blank"
                      rel="me noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-black/15 px-3 py-1 text-sm hover:border-primary hover:text-primary"
                    >
                      <SocialIcon name={k} className="size-4" />
                      {SOCIAL[k] || k}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>

        {/* stories published by this author */}
        <section className="mt-8" aria-label={`${a.name} की खबरें`}>
          <SectionHeading noLink headingTitle={`${a.name} की खबरें${page > 1 ? ` -पेज ${page}` : ""}`} />
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
