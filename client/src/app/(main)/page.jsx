import FiveCardLayoutSection from '@/components/common/FiveCardLayoutSection';
import FourCardLayoutSection from '@/components/common/FourCardLayoutSection';
import SectionHeading from '@/components/common/SectionHeading';
import ThreeCardLayoutSection from '@/components/common/ThreeCardLayoutSection';
import LiveNews from '@/components/LiveNews'
import ShortVideoCarousel from '@/components/ShortVideoCarousel';
import VideoSection from '@/components/VideoSection'
import { Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react'

import { getFeatured, getHomeSections, getLiveList, getShorts, getVideos } from "@/lib/data";
import { siteDescription, siteName, abs } from "@/lib/site";
import JsonLd from '@/components/common/JsonLd';


const OG_IMAGE = { url: "/og-default.png", width: 1200, height: 630, alt: siteName() };

export const metadata = {
    title: { absolute: `${siteName()} | आज की ताज़ा खबरें, ब्रेकिंग न्यूज़ और लाइव अपडेट` },
    description: siteDescription(),
    alternates: { canonical: abs("/") },
    openGraph: {
        type: "website",
        url: abs("/"),
        siteName: siteName(),
        title: `${siteName()} - ${siteDescription()}`,
        description: siteDescription(),
        locale: "hi_IN",
        images: [OG_IMAGE],
    },
    twitter: {
        card: "summary_large_image",
        title: `${siteName()} - ${siteDescription()}`,
        description: siteDescription(),
        images: [OG_IMAGE.url],
    },
};
const PATTERN = ['four', 'five', 'four', 'five', 'four', 'five', 'three', 'three', 'four'];

const FIVE_BG = ['bg-[#FF3D000D]', 'bg-[#E56C0F0D]'];   // five-card sections alternate these

const SHORTS_AFTER = 2;                                   // shorts carousel goes after this many sections
const LIMIT = { four: 4, five: 5, three: 3 };

const buildBlocks = (sections) => {
    const blocks = [];
    let fives = 0;
    sections.slice(0, PATTERN.length).forEach((s, i) => {
        const layout = PATTERN[i];
        const col = { key: s.id, title: s.name, titleHref: s.href, items: (s.items || []).slice(0, LIMIT[layout]) };

        if (layout === 'three') {
            // two 'three' sections in a row sit side by side
            const last = blocks[blocks.length - 1];
            if (last?.layout === 'three-group' && last.cols.length < 2) last.cols.push(col);
            else blocks.push({ layout: 'three-group', key: `g-${s.id}`, cols: [col] });
        } else if (layout === 'five') {
            blocks.push({ ...col, layout, bg: FIVE_BG[fives++ % FIVE_BG.length] });
        } else {
            blocks.push({ ...col, layout });
        }
    });
    return blocks;
};

function HeroStory({ story }) {
    if (!story) return null;
    const {
        title,
        description,
        image,
        isVideo,
        href,
        author,
    } = story;

    const headingLable = story.primaryRoute?.name;
    return (
        <article className='order-1 lg:order-2 lg:col-span-4 px-0 sm:px-3 max-lg:page-container'>
            <SectionHeading
                noLink
                headingTitle={headingLable}
                className="text-[15px]!"
            />

            {/* 16:9 media */}
            <Link href={href} className="group block">
                <div className="relative aspect-video w-full overflow-hidden rounded-[3px] bg-gray-200 max-h-[360px]">
                    <Image
                        src={image || "/banner.png"}
                        alt={title}
                        fill
                        priority
                        unoptimized={process.env.NODE_ENV === 'development'}
                        sizes="(max-width: 768px) 100vw, 700px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    {isVideo && (
                        <span
                            aria-hidden
                            className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 ring-1 ring-white/70 backdrop-blur-[2px] transition-transform group-hover:scale-110 sm:size-14"
                        >
                            <Play className="ml-0.5 size-5 fill-white text-white sm:size-6" />
                        </span>
                    )}
                </div>

                <h2 className="mt-3 text-[27px] lg:text-[35px] font-semibold leading-8.75 lg:leading-10 transition-colors group-hover:text-primary font-khand tracking-[0.01em]">
                    {title}
                </h2>
            </Link>

            {description && (
                <p className="mt-2 line-clamp-2 text-lg lg:leading-6 text-[#646464]">{description}</p>
            )}

            {/* Author */}
            {author?.fullName && (
                <div className="mt-3 border-l-[6px] border-primary pl-2.5">
                    <p className="text-lg font-bold leading-tight text-black">{author.fullName}</p>
                    {author.designation && <p className="text-[10px] font-medium">{author.designation}</p>}
                </div>
            )}
        </article>
    );
}

const page = async () => {
    const [featured, sections, live, videos, shorts] = await Promise.all([
        getFeatured(),
        getHomeSections(),
        getLiveList({ limit: 8 }),
        getVideos({ limit: 2 }),
        getShorts({ limit: 14 }),
    ]);

    const hero = featured || null;
    const blocks = buildBlocks(Array.isArray(sections) ? sections : []);
    const listItems = [hero, ...blocks.flatMap((b) => (b.cols ? b.cols.flatMap((c) => c.items) : b.items || []))]
        .filter((s) => s?.href && s?.title)
        .slice(0, 20);

    const pageLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${siteName()} - ${siteDescription()}`,
        description: siteDescription(),
        url: abs("/"),
        inLanguage: "hi-IN",
        mainEntity: {
            "@type": "ItemList",
            itemListElement: listItems.map((s, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: abs(s.href),
                name: s.title,
            })),
        },
    };

    const renderBlock = (b) => {
        if (b.layout === 'four') return <FourCardLayoutSection key={b.key} items={b.items} title={b.title} titleHref={b.titleHref} />;
        if (b.layout === 'five') return <FiveCardLayoutSection key={b.key} items={b.items} title={b.title} titleHref={b.titleHref} perColumn={2} bgClassName={b.bg} />;
        return (
            <div key={b.key} className='grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-20 page-container'>
                {b.cols.map((c) => <ThreeCardLayoutSection key={c.key} title={c.title} titleHref={c.titleHref} items={c.items} />)}
            </div>
        );
    };

    const at = Math.min(SHORTS_AFTER, blocks.length);

    return (
        <div>
            <JsonLd data={pageLd} />
            <section className='grid grid-cols-1 lg:grid-cols-8 gap-2 lg:page-container py-5'>
                <div className='order-3 lg:order-1 lg:col-span-2  lg:px-2'>
                    <LiveNews items={live.items} />
                </div>
                <HeroStory story={hero} />
                <div className='order-2 lg:order-3 lg:col-span-2 max-lg:page-container'>
                    <VideoSection items={videos.items} />
                </div>
            </section>

            <section className='min-h-screen'>
                {blocks.slice(0, at).map(renderBlock)}
                <ShortVideoCarousel title="शॉर्ट वीडियो" titleHref="/shorts" items={shorts?.items} />
                {blocks.slice(at).map(renderBlock)}
            </section>
        </div>
    )
}
export default page