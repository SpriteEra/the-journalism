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

import { getFeatured, getHomeSections, getLatest, getLiveList, getShorts, getVideos } from "@/lib/data";
import { siteDescription, siteName, abs } from "@/lib/site";


export const metadata = { title: { absolute: `${siteName()} — ${siteDescription()}` }, description: siteDescription(), alternates: { canonical: abs("/") } };

/** Your layout, top to bottom. Backend section 1 -> 'four', section 2 -> 'five', and so on. */
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
                headingTitle={headingLable} className="text-[15px]!"
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
    const [featured, sections, live, latest, videos, shorts] = await Promise.all([
        getFeatured(),
        getHomeSections(),
        getLiveList({ limit: 8 }),
        getLatest({ limit: 9 }),
        getVideos({ limit: 5 }),
        getShorts({ limit: 14 }),
    ]);
    const hero = featured || latest.items[0] || null;
    const blocks = buildBlocks(Array.isArray(sections) ? sections : []);
    console.log(featured)
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
            <section className='grid grid-cols-1 lg:grid-cols-8 gap-2 lg:page-container py-5'>
                <div className='order-3 lg:order-1 lg:col-span-2  lg:px-2'>
                    <LiveNews />
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

// const page = async () => {
//     const [featured, sections, live, latest, videos, shorts] = await Promise.all([
//         getFeatured(),
//         getHomeSections(),
//         getLiveList({ limit: 8 }),
//         getLatest({ limit: 9 }),
//         getVideos({ limit: 5 }),
//         getShorts({ limit: 14 }),
//     ]);

//     const hero = featured || latest.items[0] || null;
//     return (
//         <div>
//             <section className='grid grid-cols-1 lg:grid-cols-8 gap-2 lg:page-container py-5'>
//                 <div className='order-3 lg:order-1 lg:col-span-2  lg:px-2'>
//                     <LiveNews />
//                 </div>
//                 <HeroStory story={hero} />
//                 <div className='order-2 lg:order-3 lg:col-span-2 max-lg:page-container'>
//                     <VideoSection />
//                 </div>
//             </section>
//             <section className='min-h-screen'>

//                 <FourCardLayoutSection
//                     items={vicharItems}
//                     title={'विचार'}
//                     titleHref={'/vichar'}

//                 />

//                 <FiveCardLayoutSection
//                     title="ग्राउंड रिपोर्ट"
//                     titleHref="/ground-report"
//                     items={groundReportItems}      // plain array
//                     perColumn={2}             // optional, default 2
//                     bgClassName="bg-[#FF3D000D]"
//                 />

//                 <ShortVideoCarousel
//                     title="शॉर्ट वीडियो"
//                     titleHref="/shorts"
//                     items={shortVideoItems}
//                 />

//                 <FourCardLayoutSection
//                     items={vicharItems}
//                     title={'विश्लेषण'}
//                     titleHref={'/analysis'}

//                 />

//                 <FiveCardLayoutSection
//                     title="राजनीति"
//                     titleHref="/politics"
//                     items={groundReportItems}      // plain array
//                     perColumn={2}             // optional, default 2
//                     bgClassName="bg-[#E56C0F0D]"
//                 />

//                 <FourCardLayoutSection
//                     items={vicharItems}
//                     title={'देश-विदेश'}
//                     titleHref={'/analysis'}

//                 />

//                 <FiveCardLayoutSection
//                     title="धर्म-संस्कृति"
//                     titleHref="/politics"
//                     items={groundReportItems}      // plain array
//                     perColumn={2}             // optional, default 2
//                     bgClassName="bg-[#E56C0F0D]"
//                 />

//                 <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-20 page-container'>
//                     <ThreeCardLayoutSection
//                         title="इतिहास"
//                         titleHref="/itihas"
//                         items={itihasItems}
//                     />
//                     <ThreeCardLayoutSection
//                         title="इतिहास"
//                         titleHref="/itihas"
//                         items={itihasItems.slice(3)}
//                     />

//                 </div>

//                 <FourCardLayoutSection
//                     items={vicharItems}
//                     title={'देश-विदेश'}
//                     titleHref={'/analysis'}

//                 />
//             </section>
//         </div>
//     )
// }
export default page