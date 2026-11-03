import Link from "next/link";
import SideAds from "@/components/ads/SideAds";
import Img from "@/components/common/Img";
import Pagination from "@/components/common/Pagination";
import { getLiveList } from "@/lib/data";
import { formatDate } from "@/utils/util";
import { abs, siteName } from "@/lib/site";

const pageOf = (sp) => Math.max(parseInt(sp?.page, 10) || 1, 1);


const OG_IMAGE = { url: "/og-default.png", width: 1200, height: 630, alt: siteName() };

export async function generateMetadata({ searchParams }) {
  const page = pageOf(await searchParams);

  const heading = "लाइव न्यूज़";
  const title = page > 1 ? `${heading} - पेज ${page}` : `${heading}: लाइव कवरेज, लाइव अपडेट और ताज़ा हलचल`;
  const description =
    page > 1
      ? `${siteName()} पर चल रही और हाल ही में खत्म हुई लाइव कवरेज, पेज ${page}।`
      : `${siteName()} पर देखें देश-दुनिया की बड़ी घटनाओं की लाइव कवरेज, लाइव अपडेट और ताज़ा हलचल, हर पल की खबर एक जगह।`;
  const url = abs("/live"); // every page points to the main listing

  return {
    title, // the layout's template adds "| siteName"
    description,
    alternates: { canonical: url },
    ...(page > 1 ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      siteName: siteName(),
      locale: "hi_IN",
      title: `${title} | ${siteName()}`,
      description,
      url,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName()}`,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

export default async function LiveListPage({ searchParams }) {
  const page = pageOf(await searchParams);
  const { items, hasMore } = await getLiveList({ page, limit: 12 });

  return (
    <div className="page-container grid grid-cols-1 lg:grid-cols-7 gap-4 mt-8 lg:mt-14">
      <section className="lg:col-span-5">

        <header className="border-b-2 border-primary pb-3">
          <h1 className="font-khand text-[32px] leading-tight font-bold lg:text-[44px] flex items-center gap-2 lg:gap-4">  <span className="relative flex size-4 lg:size-6 items-center justify-center rounded-full border border-primary">
            <span className="absolute size-full animate-ping rounded-full bg-primary/40 motion-reduce:hidden" />
            <span className="relative size-2 sm:size-3.5 rounded-full bg-primary" />
          </span> लाइव न्यूज़  {page > 1 ? <span className="text-black/50"> -पेज {page}</span> : null}</h1>
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
                  {it.publishedAt ? `${formatDate(it.publishedAt)}` : ""}
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
