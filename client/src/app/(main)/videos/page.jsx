import SideAds from '@/components/ads/SideAds';
import SectionHeading from '@/components/common/SectionHeading'
import VideoCard from '@/components/common/VideoCard'
import LatestNews from '@/components/LatestNews'
import React from 'react'
const videoItems = [
    {
        id: 1,
        title: "शराब घोटाला केस में क्या-क्या हुआ? केजरीवाल के बरी होने से जस्टिस कांता के हटने तक की कहानी",
        image: "/demo/news1.png",
        href: "/videos/1",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    {
        id: 2,
        title: "सुप्रीम कोर्ट ने नोएडा डीएम मेधा रूपम को दी राहत, उनके ख़िलाफ़ की गई टिप्पणियों पर रोक",
        href: "/videos/2",
        videoUrl: "https://youtu.be/9bZkp7q19f0", // no image: YouTube thumbnail is used
    },
    {
        id: 3,
        title: "आप मुझ पर भरोसा नहीं करते, CWC की बैठक में राहुल गांधी ने कांग्रेस नेताओं से क्यों कहा ऐसा?",
        image: "/demo/news3.png", // used as the poster for the direct file
        href: "/videos/3",
        videoUrl: "/videos/cwc-report.mp4",
    },
    {
        id: 4,
        title: "यूपी में बड़ा प्रशासनिक फेरबदल, कई एडीएम समेत 20 अधिकारियों के तबादले",
        image: "/demo/news4.png",
        href: "/videos/4",
        videoUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    },
    {
        id: 5,
        title: "बिहार चुनाव से पहले गठबंधन में सीटों की खींचतान, जानिए किस दल की क्या है मांग",
        image: "/demo/news5.png",
        href: "/videos/5",
        videoUrl: "/videos/bihar-seats.mp4",
    },
    {
        id: 6,
        title: "जमीनी रिपोर्ट: बाढ़ के बाद गांवों में राहत शिविरों की हकीकत, लोग बोले- अब तक नहीं मिली मदद",
        href: "/videos/6",
        videoUrl: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
    },
    {
        id: 7,
        title: "संसद के शीतकालीन सत्र में हंगामे के आसार, विपक्ष ने सरकार को घेरने की बनाई रणनीति",
        image: "/demo/news2.png",
        href: "/videos/7",
        videoUrl: "/videos/parliament-session.mp4",
    },
    {
        id: 8,
        title: "12 वर्ष पहले गोरखनाथ पीठ के पीठाधीश्वर, फिर देश के सबसे बड़े सूबे के CM: जनता तक पहुँच और ज़मीनी पकड़",
        href: "/videos/8",
        videoUrl: "https://www.youtube.com/watch?v=OOUopqGt_Dk",
    },
];
const page = () => {
    const [first, ...rest] = videoItems;

    return (
        <main className='page-container grid grid-cols-1 lg:grid-cols-7 gap-4 mt-8 lg:mt-14'>
            <section className='lg:col-span-5'>
                <SectionHeading
                    headingTitle={'वीडियो'}
                    noLink
                    className='text-2xl lg:text-3xl!'
                />

                {/* big first video */}
                <VideoCard item={first} layout="vertical" featured priority />

                {/* grid of 2 */}
                {rest.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 lg:mt-8 lg:gap-x-4 lg:gap-y-8">
                        {rest.map((item) => (
                            <VideoCard key={item.id} item={item} layout="vertical" />
                        ))}
                    </div>
                )}
            </section>

            <section className='min-h-50 lg:col-span-2 pt-5 lg:pt-11 space-y-5 lg:space-y-3.5 relative'>
                <SideAds />
                <div className='sticky top-35'>
                    <LatestNews />
                </div>
            </section>
        </main>
    )
}

export default page