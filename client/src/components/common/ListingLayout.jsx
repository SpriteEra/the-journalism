import Link from "next/link";
import SideAds from "@/components/ads/SideAds";
import ArticleBreadCrumb from "@/components/article/ArticleBreadCrumb";
import JsonLd from "@/components/common/JsonLd";
import Pagination from "@/components/common/Pagination";
import StoryGrid from "@/components/common/StoryGrid";

/**
 * One layout for every list of stories (category, state, district, topic, search, latest …):
 * breadcrumb, heading, optional chips (sub-categories / districts), the stories, previous / next links and the sidebar ad.
 */
export default function ListingLayout({ title, eyebrow, description, breadcrumb = [], chips = [], items = [], page = 1, hasMore = false, basePath, empty = "इस समय कोई खबर उपलब्ध नहीं है।", jsonLd, children }) {
  return (
    <div className="page-container mt-8 grid max-w-6xl grid-cols-1 gap-4 lg:mt-12 lg:grid-cols-8">
      <JsonLd data={jsonLd} />
      <section className="lg:col-span-6">
        {breadcrumb.length > 0 && <ArticleBreadCrumb breadcrumb={breadcrumb} title={title} />}

        <header className="border-b-2 border-primary pb-3">
          {eyebrow && <p className="text-sm font-medium uppercase tracking-wide text-primary">{eyebrow}</p>}
          <h1 className="font-khand text-[32px] font-bold leading-tight lg:text-[44px]">{title}{page > 1 ? <span className="text-black/50"> — पेज {page}</span> : null}</h1>
          {description && page === 1 && <p className="mt-2 max-w-3xl text-lg leading-relaxed text-black/75">{description}</p>}
        </header>

        {chips.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {chips.map((c) => (
              <li key={c.href}><Link href={c.href} className="inline-block rounded-full border border-black/15 px-3.5 py-1 text-base hover:border-primary hover:text-primary">{c.label}</Link></li>
            ))}
          </ul>
        )}

        {children}

        {items.length > 0
          ? <StoryGrid items={items} className="mt-6" />
          : <p className="mt-10 rounded border border-dashed border-black/15 p-10 text-center text-lg text-black/60">{empty}</p>}

        {basePath && <Pagination basePath={basePath} page={page} hasMore={hasMore} />}
      </section>

      <aside className="relative min-h-50 pt-3 lg:col-span-2 lg:pt-9"><div className="sticky top-35"><SideAds /></div></aside>
    </div>
  );
}
