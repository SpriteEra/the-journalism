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
const DEFAULT_STORY = {
    category: "राजनीति",
    categoryHref: "/rajniti",
    title: "शराब घोटाला केस में क्या-क्या हुआ? केजरीवाल के बरी होने से जस्टिस कांता के हटने तक की कहानी",
    description:
        "उत्तर प्रदेश की योगी सरकार ने गुरुवार की शाम बड़े पैमाने पर प्रशासनिक अफसरों का फेरबदल कर दिया। प्रदेश के 84 पीसीएस (PCS) अधिकारियों का एक साथ तबादला कर दिया गया है।",
    image: "/demo/news4.png",
    isVideo: true,
    href: "/news/1",
    author: { name: "जयन्ती मिश्रा", role: "होस्ट, द जर्नलिज्म" },
};

const itihasItems = [
    {
        id: 1,
        title: "72वें राष्ट्रीय फिल्म पुरस्कार घोषित: ‘आर्टिकल 370’ बेस्ट फिल्म, यामी गौतम बनी सर्वश्रेष्ठ अभिनेत्री; जानें- किस-किस ने जीता कौन सा अवॉर्ड",
        image: "/demo/news1.png",
        href: "/itihas/1",
        author: "Jayanti Mishra",
    },
    {
        id: 2,
        title: "राजपाल यादव को चेक बाउंस मामले में दिल्ली HC से राहत नहीं, सुनाई सभी 7 मामलों में जेल की सजा: जानिए- कोर्ट ने कितने...",
        image: "/demo/news2.png",
        href: "/itihas/2",
    },
    {
        id: 3,
        title: "‘सतलुज’ ने उतार दिया मुखौटा: दिलजीत दोसांझ की ‘ग्लोबल सुपरस्टार’ वाली छवि के पीछे छिपी राजनीति बेनकाब, पहले ही दी थी चेतावनी",
        image: "/demo/news3.png",
        href: "/itihas/3",
    },
    {
        id: 4,
        title: "सुप्रीम कोर्ट ने नोएडा डीएम मेधा रूपम को दी राहत, उनके ख़िलाफ़ की गई टिप्पणियों पर रोक",
        image: "/demo/news4.png",
        href: "/itihas/4",
    },
    {
        id: 5,
        title: "यूपी में बड़ा प्रशासनिक फेरबदल, कई एडीएम समेत 20 अधिकारियों के तबादले",
        image: "/demo/news5.png",
        href: "/itihas/5",
    },
];

const vicharItems = [
    {
        id: 1,
        title: "शराब घोटाला केस में क्या-क्या हुआ? केजरीवाल के बरी होने से जस्टिस कांता के हटने तक की...",
        image: "/demo/news1.png",
        href: "/vichar/1",
        isVideo: false,
    },
    {
        id: 2,
        title: "सुप्रीम कोर्ट ने नोएडा डीएम मेधा रूपम को दी राहत, उनके ख़िलाफ़ की गई टिप्पणियों पर रोक",
        image: "/demo/news2.png",
        href: "/vichar/2",
        isVideo: false,
    },
    {
        id: 3,
        title: "शराब घोटाला केस में क्या-क्या हुआ? केजरीवाल के बरी होने से जस्टिस कांता के हटने तक की...",
        image: "/demo/news3.png",
        href: "/vichar/3",
        isVideo: true,
    },
    {
        id: 4,
        title: "सुप्रीम कोर्ट ने नोएडा डीएम मेधा रूपम को दी राहत, उनके ख़िलाफ़ की गई टिप्पणियों पर रोक",
        image: "/demo/news4.png",
        href: "/vichar/4",
        isVideo: false,
    },

];

const groundReportItems = [
    {
        id: 1,
        title: "100 नाराज़ ≠ 100 वोट: भारतीय राजनीति में सिर्फ़ ‘नाराज़गी’ का फ़ैक्टर कभी निर्णायक क्यों नहीं रहा",
        description:
            "राजनीतिक दलों का भाग्य स्थायी भावनाओं से नहीं, बदलते हितों और बदलते गठबंधनों से तय होता है। असंतोष मौजूद होने के बावजूद वह अब तक पर्याप्त रूप से एकीकृत राजनीतिक ताक़त में नहीं बदल पाया है...",
        image: "/demo/news1.png",
        href: "/ground-report/1",
        isVideo: false,
    },
    {
        id: 2,
        title: "12 वर्ष पहले गोरखनाथ पीठ के पीठाधीश्वर, फिर देश के सबसे बड़े सूबे के CM: जनता तक पहुँच और ....",
        image: "/demo/news2.png",
        href: "/ground-report/2",
        isVideo: false,
    },
    {
        id: 3,
        title: "‘अखिलेश यादव को समझ आ गया होगा कि जनता किसके साथ है’, जयंत चौधरी की रैली में उमड़ी भीड़",
        image: "/demo/news3.png",
        href: "/ground-report/3",
        isVideo: true,
    },
    {
        id: 4,
        title: "मुस्लिमों को रिझाने में 2017 में औंधे मुँह गिरे थे अखिलेश, आरक्षण का वादा किया लेकिन घोषणापत्र ...",
        image: "/demo/news4.png",
        href: "/ground-report/4",
        isVideo: false,
    },
    {
        id: 5,
        title: "सुप्रीम कोर्ट ने नोएडा डीएम मेधा रूपम को दी राहत, उनके ख़िलाफ़ की गई टिप्पणियों पर रोक",
        image: "/demo/news5.png",
        href: "/ground-report/5",
        isVideo: true,
    },
];

const shortVideoItems = [
    { id: 1, title: "सपा सरकार में स्कूली बच्चों का हाल", image: "/demo/short1.png", href: "/shorts/1" },
    { id: 2, title: "बाबर के पैरोकारों से बोले CM योगी", image: "/demo/short2.png", href: "/shorts/2" },
    { id: 3, title: "IAS अधिकारी ने बेचा परीक्षा का पेपर?", image: "/demo/short3.png", href: "/shorts/3" },
    { id: 4, title: "अखिलेश राज का हाल, ड्रीम प्रोजेक्ट में भी फ्रॉड", image: "/demo/short1.png", href: "/shorts/4" },
    { id: 5, title: "सनातन है इसलिए सेकुलर है भारत", image: "/demo/short2.png", href: "/shorts/5" },
    { id: 6, title: "सपा सरकार में स्कूली बच्चों का हाल", image: "/demo/short3.png", href: "/shorts/6" },
    { id: 7, title: "बाबर के पैरोकारों से बोले CM योगी", image: "/demo/short2.png", href: "/shorts/7" },
    { id: 8, title: "IAS अधिकारी ने बेचा परीक्षा का पेपर?", image: "/demo/short3.png", href: "/shorts/3" },
];
const page = () => {
    const { category, categoryHref, title, description, image, isVideo, href, author } = DEFAULT_STORY;

    return (
        <div>
            <section className='grid grid-cols-1 lg:grid-cols-8 gap-2 lg:page-container py-5'>
                <div className='order-3 lg:order-1 lg:col-span-2  lg:px-2'>
                    <LiveNews />
                </div>
                <article className='order-1 lg:order-2 lg:col-span-4 px-0 sm:px-3 max-lg:page-container'>
                    <SectionHeading
                        headingRef={'/politics'}
                        headingTitle={'राजनीति'}
                        className='text-[15px]!'
                    />

                    {/* 16:9 media */}
                    <Link href={href} className="group block">
                        <div className="relative aspect-video w-full overflow-hidden rounded-[3px] bg-gray-200 max-h-[360px]">
                            <Image
                                src={image || "/banner.png"}
                                alt={title}
                                fill
                                priority
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
                    {author?.name && (
                        <div className="mt-3 border-l-[6px] border-primary pl-2.5">
                            <p className="text-lg font-bold leading-tight text-black">{author.name}</p>
                            {author.role && <p className="text-[10px] font-medium">{author.role}</p>}
                        </div>
                    )}
                </article>
                <div className='order-2 lg:order-3 lg:col-span-2 max-lg:page-container'>
                    <VideoSection />
                </div>
            </section>
            <section className='min-h-screen'>

                <FourCardLayoutSection
                    items={vicharItems}
                    title={'विचार'}
                    titleHref={'/vichar'}

                />

                <FiveCardLayoutSection
                    title="ग्राउंड रिपोर्ट"
                    titleHref="/ground-report"
                    items={groundReportItems}      // plain array
                    perColumn={2}             // optional, default 2
                    bgClassName="bg-[#FF3D000D]"
                />

                <ShortVideoCarousel
                    title="शॉर्ट वीडियो"
                    titleHref="/shorts"
                    items={shortVideoItems}
                />

                <FourCardLayoutSection
                    items={vicharItems}
                    title={'विश्लेषण'}
                    titleHref={'/analysis'}

                />

                <FiveCardLayoutSection
                    title="राजनीति"
                    titleHref="/politics"
                    items={groundReportItems}      // plain array
                    perColumn={2}             // optional, default 2
                    bgClassName="bg-[#E56C0F0D]"
                />

                <FourCardLayoutSection
                    items={vicharItems}
                    title={'देश-विदेश'}
                    titleHref={'/analysis'}

                />

                <FiveCardLayoutSection
                    title="धर्म-संस्कृति"
                    titleHref="/politics"
                    items={groundReportItems}      // plain array
                    perColumn={2}             // optional, default 2
                    bgClassName="bg-[#E56C0F0D]"
                />

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-20 page-container'>
                    <ThreeCardLayoutSection
                        title="इतिहास"
                        titleHref="/itihas"
                        items={itihasItems}
                    />
                    <ThreeCardLayoutSection
                        title="इतिहास"
                        titleHref="/itihas"
                        items={itihasItems.slice(3)}
                    />

                </div>

                <FourCardLayoutSection
                    items={vicharItems}
                    title={'देश-विदेश'}
                    titleHref={'/analysis'}

                />
            </section>
        </div>
    )
}

export default page