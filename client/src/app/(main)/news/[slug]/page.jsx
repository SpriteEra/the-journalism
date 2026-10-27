import SideAds from '@/components/ads/SideAds'
import ArticleBreadCrumb from '@/components/article/ArticleBreadCrumb';
import ArticleMedia from '@/components/article/ArticleMedia';
import ArticleTopics from '@/components/article/ArticleTopics';
import AuthorCard from '@/components/article/AuthorCard';
import ShareActions, { FollowOnGoogle } from '@/components/article/ShareActions';
import { formatDate } from '@/utils/util';
import Link from 'next/link';
import React from 'react'
const article = {
    title: "आप मुझ पर भरोसा नहीं करते, CWC की बैठक में राहुल गांधी ने कांग्रेस नेताओं से क्यों कहा ऐसा? इनसाइड स्टोरी",
    subtitle:
        "कांग्रेस CWC की बैठक में मौजूद एक नेता ने ऑफ रिकॉर्ड बताया कि राहुल गांधी के निशाने पर कई नेता थे, जिनको वो इशारा करके यह बताना चाह रहे थे कि इस मुद्दे और खुलासे से अब आप लोग भी सहमत होइए.",
    image: "/demo/news1.png",
    imageAlt: "राहुल गांधी",
    author: {
        role: "होस्ट, द जर्नलिज़्म", name: "जयन्ती मिश्रा",
        bio: "मैं एक पत्रकार हूँ और मेरा उद्देश्य समाज से जुड़े महत्वपूर्ण मुद्दों, घटनाओं और जमीनी हकीकत को लोगों तक सही और स्पष्ट रूप में पहुँचाना है। मैं खबरों को केवल प्रस्तुत करने के बजाय उनके पीछे की कहानी को समझाने की कोशिश करता हूँ।",
        image: "/reporter.jpg",
        href: "/author/jayanti-mishra",
    },
    publishedAt: "2026-09-24T14:28:00+05:30",
    breadcrumb: [
        { label: "होम", href: "/" },
        { label: "देश", href: "/desh" },
    ],
    // image
    media: { type: "image", src: "/demo/news1.png", alt: "राहुल गांधी", caption: "फोटो: PTI" }

};

const topics = [
    { label: "राहुल गांधी", href: "/topic/rahul-gandhi" },
    { label: "कांग्रेस", href: "/topic/congress" },
    { label: "ECI विवाद", href: "/topic/eci-controversy" },
    { label: "ज्ञानेंद्र सिंह", href: "/topic/gyanendra-singh" },
    { label: "नरेंद्र मोदी", href: "/topic/narendra-modi" },
    { label: "SIR मुद्दा", href: "/topic/sir" },
    { label: "J.P. Nadda", href: "/topic/jp-nadda" },
];

const page = () => {
    if (!article) return null;
    const { title, subtitle, image, imageAlt, media, author, publishedAt } = article;

    return (
        <main className='page-container max-w-6xl grid grid-cols-1 lg:grid-cols-8 gap-4 mt-8 lg:mt-14'>

            <section className='lg:col-span-6'>
                <ArticleBreadCrumb
                    breadcrumb={article.breadcrumb}
                    title={article.title}
                />

                <div className='lg:border border-black/5 lg:p-3'>
                    <article>
                        <h1 className="font-khand text-[32px] tracking-[0.01em] font-bold leading-10.5 lg:leading-12.5 lg:text-[45px]">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-3 text-lg leading-relaxed lg:mt-4 lg:text-[22px] lg:leading-7.5">
                                {subtitle}
                            </p>
                        )}
                        {/* author + date + actions */}
                        <div className="mt-3 lg:mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className='flex justify-between items-center'>
                                {author && (
                                    <div className="flex items-stretch gap-3">
                                        <span className="w-1 shrink-0 bg-primary" aria-hidden />
                                        <div>
                                            <Link href={author.href} className="text-xl font-bold leading-normal text-black hover:text-primary lg:text-[22px]">
                                                {author.name}
                                            </Link>

                                            {author.role && <p className="text-xs font-medium leading-normal text-black -mt-1">{author.role}</p>}
                                        </div>
                                    </div>

                                )}
                                <div className='lg:hidden'>
                                    <FollowOnGoogle href={'https://www.google.com/preferences/source?q=yourdomain.com'} />
                                </div>
                            </div>

                            <div className="flex items-center gap-x-2 lg:gap-x-5 gap-y-3">
                                {publishedAt && (
                                    <time dateTime={publishedAt} className="text-[13px] text-black/75 leading-normal lg:text-sm whitespace-nowrap">
                                        {formatDate(publishedAt)}
                                    </time>
                                )}
                                <ShareActions title={title} googleSourceHref={'https://www.google.com/preferences/source?q=yourdomain.com'} />
                            </div>
                        </div>

                        {/* hero media (image or video) */}
                        <ArticleMedia
                            className="mt-4 lg:mt-5"
                            media={media ?? (image ? { type: "image", src: image, alt: imageAlt || title } : null)}
                        />

                        <p className='text-lg lg:text-[22px] leading-7 lg:leading-[31px] mt-4 tracking-[0.02em]'><strong>नई दिल्ली:</strong> सीईसी ज्ञानेश कुमार और SIR प्रक्रिया पर पार्टी के आगामी कार्यक्रम और रणनीति को लेकर दिल्ली में आज कांग्रेस सीडब्लूसी की बैठक हुई. इसमें सोनिया गांधी, मल्लिकार्जुन खरगे, राहुल गांधी, प्रियंका गांधी समेत कांग्रेस के तमाम वरिष्ठ नेता और सीएम शामिल हुए. कांग्रेस सूत्रों के अनुसार खरगे के भाषण के बाद राहुल गांधी ने SIR और चुनाव आयोग के ख़िलाफ अपनी बात को रखा. सूत्रों के मुताबिक राहुल गांधी ने अपनी पार्टी के नेताओं से कहा कि मैं पिछले दो साल से वोट चोरी की बात कर रहा हूं, लेकिन पहले हमारे लोग ही सहमत नहीं दिखे, लेकिन आज दो साल बाद अधिकतर लोग सहमत हैं.</p>
                        <p className='text-lg lg:text-[22px] leading-7 lg:leading-[31px] mt-4 tracking-[0.02em]'>राहुल गांधी ने बैठक में यह भी कहा कि आप लोग मुझ पर भरोसा नहीं करते, लेकिन पुरानी मुलाक़ात में प्रधानमंत्री ने मुझसे कहा था कि हमें आप ही हरा सकते हैं. दरअसल सीईसी ज्ञानेश कुमार के चयन को लेकर जब बैठक हुई थी, उस बैठक का हवाला देते हुए राहुल गांधी ने कहा कि प्रधानमंत्री ने उन्हें ऐसा कहा था. सूत्रों के मुताबिक आज की बैठक में राहुल गांधी ने ये भी कहा कि पार्टी में कई नेता केवल विश्लेषण में लगे रहते हैं. SIR के मुद्दे को पुरजोर तरीके से नहीं उठा रहे हैं. उन्होंने बैठक में नेताओं को आत्मविश्वास के साथ इस मुद्दे को उठाने का निर्देश दिया.</p>
                    </article>
                    <div className="mt-2.5 lg:mt-4 border-t border-gray-200 pt-2.5 lg:pt-4">
                        <ArticleTopics topics={topics} />
                    </div>

                    <AuthorCard author={author} className="mt-4" />
                </div>
            </section>

            <section className='min-h-50 lg:col-span-2 pt-3 lg:pt-9 space-y-3.5 relative'>
                <div className='sticky top-35'>
                    <SideAds />

                </div>
            </section>

        </main>
    )
}

export default page