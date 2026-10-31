import Link from "next/link";
import SideAds from "@/components/ads/SideAds";
import ArticleBreadCrumb from "@/components/article/ArticleBreadCrumb";
import Img from "@/components/common/Img";
import Pagination from "@/components/common/Pagination";
import { getLiveList } from "@/lib/data";
import { abs } from "@/lib/site";
import { formatDate } from "@/utils/util";

const pageOf = (sp) => Math.max(parseInt(sp?.page, 10) || 1, 1);

export async function generateMetadata({ searchParams }) {
  const page = pageOf(await searchParams);
  return {
    title: page > 1 ? `लाइव न्यूज़ — पेज ${page}` : "लाइव न्यूज़",
    description: "चल रही और हाल ही में खत्म हुई लाइव कवरेज।",
    alternates: { canonical: abs("/live") },
    ...(page > 1 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function LiveListPage({ searchParams }) {
  const page = pageOf(await searchParams);
  const { items, hasMore } = await getLiveList({ page, limit: 12 });

  return (
    <div className="page-container mt-8 grid max-w-6xl grid-cols-1 gap-4 lg:mt-12 lg:grid-cols-8">
      <section className="lg:col-span-6">

        <header className="border-b-2 border-primary pb-3">
          <h1 className="font-khand text-[32px] leading-tight font-bold lg:text-[44px] flex items-center gap-2 lg:gap-4">  <span className="relative flex size-4 lg:size-6 items-center justify-center rounded-full border border-primary">
            <span className="absolute size-full animate-ping rounded-full bg-primary/40 motion-reduce:hidden" />
            <span className="relative size-2 sm:size-3.5 rounded-full bg-primary" />
          </span> लाइव न्यूज़  {page > 1 ? <span className="text-black/50"> — पेज {page}</span> : null}</h1>
        </header>

        {items.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it, i) => (
              <article key={it.id}>
                <Link href={it.href} className="group block">
                  <div className="relative aspect-video w-full overflow-hidden rounded-[3px] bg-gray-200">
                    <Img src={it.image} alt={it.title} fill priority={i < 3} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 300px" className="object-cover transition-transform duration-300 group-hover:scale-105" />

                  </div>
                  <h2 className="mt-2 line-clamp-3 font-khand text-lg leading-6.25 font-semibold tracking-[0.01em] transition-colors group-hover:text-primary lg:text-[22px] lg:leading-normal">{it.title}</h2>
                </Link>
                <p className="mt-1 text-sm text-black/60">
                  {it.updatesCount > 0 ? `${it.updatesCount} अपडेट` : "अपडेट जल्द"}
                  {it.publishedAt ? ` · ${formatDate(it.publishedAt)}` : ""}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-10 rounded border border-dashed border-black/15 p-10 text-center text-lg text-black/60">इस समय कोई लाइव कवरेज उपलब्ध नहीं है।</p>
        )}

        <Pagination basePath="/live" page={page} hasMore={hasMore} />
      </section>

      <aside className="relative min-h-50 pt-3 lg:col-span-2 lg:pt-9"><div className="sticky top-35"><SideAds /></div></aside>
    </div>
  );
}
