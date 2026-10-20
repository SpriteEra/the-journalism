import { notFound } from "next/navigation";
import ShortsViewer from "@/components/ShortsViewer";
import { getAllShorts, getShort, getYouTubeId, absUrl, posterOf, SITE_URL } from "@/lib/shorts";

export const revalidate = 300; // ISR: refresh every 5 minutes
export const dynamicParams = true; // new shorts render on first request

export async function generateStaticParams() {
    const all = await getAllShorts();
    return all.slice(0, 50).map((s) => ({ id: String(s.id) }));
}

export async function generateMetadata({ params }) {
    const { id } = await params; // on Next 14 use `params.id` directly
    const s = await getShort(id);
    if (!s) return { title: "वीडियो नहीं मिला", robots: { index: false } };

    const url = `/shorts/${s.id}`;
    const description = s.description || s.title;
    const image = absUrl(posterOf(s));

    return {
        title: s.title,
        description,
        alternates: { canonical: url },
        openGraph: {
            type: "video.other",
            url,
            title: s.title,
            description,
            images: [{ url: image, width: 720, height: 1280, alt: s.title }],
            locale: "hi_IN",
        },
        twitter: { card: "summary_large_image", title: s.title, description, images: [image] },
    };
}

const Page = async ({ params }) => {
    const { slug: id } = await params;
    const [item, all] = await Promise.all([getShort(id), getAllShorts()]);
    if (!item) notFound();

    const yt = getYouTubeId(item.videoUrl);
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: item.title,
        description: item.description || item.title,
        thumbnailUrl: [absUrl(posterOf(item))],
        uploadDate: item.publishedAt,
        inLanguage: "hi",
        url: `${SITE_URL}/shorts/${item.id}`,
        ...(yt
            ? { embedUrl: `https://www.youtube.com/embed/${yt}` }
            : { contentUrl: absUrl(item.videoUrl) }),
    };

    // only send what the client needs
    const slim = all.map(({ id, title, description, image, videoUrl }) => ({
        id, title, description, image: posterOf({ image, videoUrl }), videoUrl,
    }));

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
            />
            <ShortsViewer items={slim} startId={item.id} />
        </>
    );
};

export default Page;