import SideAds from "@/components/ads/SideAds";
import Pagination from "@/components/common/Pagination";
import SectionHeading from "@/components/common/SectionHeading";
import VideoCard from "@/components/common/VideoCard";
import LatestNews from "@/components/LatestNews";
import { getLatest, getVideos } from "@/lib/data";
import { abs } from "@/lib/site";

const LIMIT = 12;
const pageOf = (sp) => Math.max(parseInt(sp?.page, 10) || 1, 1);

export async function generateMetadata({ searchParams }) {
    const page = pageOf(await searchParams);
    return { title: page > 1 ? `वीडियो — पेज ${page}` : "वीडियो", description: "ताज़ा खबरों के वीडियो।", alternates: { canonical: abs("/videos") }, ...(page > 1 ? { robots: { index: false, follow: true } } : {}) };
}

export default async function VideosPage({ searchParams }) {
    const page = pageOf(await searchParams);
    const [{ items, total }, latest] = await Promise.all([getVideos({ page, limit: LIMIT }), getLatest({ limit: 6 })]);
    const [first, ...rest] = items;
    return (
        <div className="page-container mt-8 grid grid-cols-1 gap-4 lg:mt-14 lg:grid-cols-7">
            <section className="lg:col-span-5">
                <SectionHeading headingTitle="वीडियो" noLink className="text-2xl lg:text-3xl!" />
                {first ? (
                    <>
                        <VideoCard item={first} layout="vertical" featured priority />
                        {rest.length > 0 && (
                            <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:mt-8 lg:grid-cols-3 lg:gap-x-4 lg:gap-y-8">
                                {rest.map((item) => <VideoCard key={item.id} item={item} layout="vertical" />)}
                            </div>
                        )}
                        <Pagination basePath="/videos" page={page} hasMore={page * LIMIT < total} />
                    </>
                ) : <p className="mt-10 rounded border border-dashed border-black/15 p-10 text-center text-lg text-black/60">अभी कोई वीडियो उपलब्ध नहीं है।</p>}
            </section>
            <aside className="relative min-h-50 space-y-5 pt-5 lg:col-span-2 lg:space-y-3.5 lg:pt-11">
                <SideAds />
                <div className="sticky top-35"><LatestNews items={latest.items} /></div>
            </aside>
        </div>
    );
}
