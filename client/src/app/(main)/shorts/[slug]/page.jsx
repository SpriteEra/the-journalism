import { notFound } from "next/navigation";
import ShortsViewer from "@/components/ShortsViewer";
import JsonLd from "@/components/common/JsonLd";
import { getShort } from "@/lib/data";
import { jsonLdList, toMetadata } from "@/lib/adapters";
import { abs } from "@/lib/site";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const data = await getShort(decodeURIComponent(slug));
    if (!data) return { title: "वीडियो नहीं मिला", robots: { index: false } };
    const s = data.short;
    return toMetadata(data.seo.meta, { canonical: abs(s.href), fallback: { title: s.title, description: s.description || s.title } });
}

export default async function ShortPage({ params }) {
    const { slug } = await params;
    const data = await getShort(decodeURIComponent(slug));
    if (!data) notFound();
    const { short, more, seo } = data;
    // the viewer scrolls through this short and the next ones; send only what it needs
    const items = [short, ...more.filter((m) => m.id !== short.id)].map(({ id, title, description, image, videoUrl, hlsUrl, youtubeId }) => ({ id, title, description, image, videoUrl, hlsUrl, youtubeId }));
    return (
        <>
            <JsonLd data={jsonLdList(seo.jsonLd)} />
            <ShortsViewer items={items} startId={short.id} />
        </>
    );
}
