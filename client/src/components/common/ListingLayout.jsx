import SideAds from "@/components/ads/SideAds";
import JsonLd from "@/components/common/JsonLd";
import Pagination from "@/components/common/Pagination";
import StoryGrid from "@/components/common/StoryGrid";

/**
 * One layout for every list of stories (category, state, district, topic, search, latest …):
 * breadcrumb, heading, optional chips (sub-categories / districts), the stories, previous / next links and the sidebar ad.
 */
export default function ListingLayout({ title, description, items = [], page = 1, hasMore = false, basePath, empty = "इस समय कोई खबर उपलब्ध नहीं है।", jsonLd, children }) {
  return (
    <div className="page-container grid grid-cols-1 lg:grid-cols-7 gap-4 mt-8 lg:mt-14">
      <JsonLd data={jsonLd} />
      <section className="lg:col-span-5">
        <header className="border-b-2 border-primary pb-3">
          <h1 className="font-khand text-[32px] font-bold leading-tight lg:text-[44px]">{title}{page > 1 ? <span className="text-black/50"> — पेज {page}</span> : null}</h1>
          {description && page === 1 && <p className="mt-2 max-w-3xl text-lg leading-relaxed text-black/75">{description}</p>}
        </header>
        {children}

        {items.length > 0
          ? <StoryGrid items={items} className="mt-6" />
          : <p className="mt-10 rounded border border-dashed border-black/15 p-10 text-center text-lg text-black/60">{empty}</p>}

        {basePath && <Pagination basePath={basePath} page={page} hasMore={hasMore} />}
      </section>

      <aside className="min-h-50  lg:col-span-2 pt-5 lg:pt-13 space-y-5 lg:space-y-3.5 relative">
        <div className="sticky top-35">
          <SideAds />
        </div>
      </aside>
    </div>
  );
}
