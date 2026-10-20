import SideAds from '@/components/ads/SideAds';
import ArticleCard from '@/components/common/ArticleCard';
import SectionHeading from '@/components/common/SectionHeading'
import LatestNews from '@/components/LatestNews';
import React from 'react'
const articleItems = [
    {
        id: 1,
        title: "क्या आंतरिक मतभेद को चुनावी हेरफेर का सबूत मानना सही है?",
        description:
            "दो चुनाव आयुक्तों की 14 आपत्तियों से चुनाव आयोग की कार्यप्रणाली पर सवाल उठे हैं, लेकिन हर आपत्ति को संवैधानिक विफलता मानने से पहले अंतिम निर्णय और ठोस सबूत जरूरी हैं।",
        image: "/demo/news1.png",
        href: "/articles/1",
        author: "जयन्ती मिश्रा",
    },
    {
        id: 2,
        title: "राम-कृष्ण-शिव भी हैं, लेकिन सबसे ऊपर स्वामीनारायण: समझिए- BAPS की शुरुआत से बड़ा बनने की पूरी कहानी",
        description:
            "BAPS को सिर्फ उसके संगमरमर के मंदिरों से मत देखिए। इसकी असली कहानी उन विचारों में छिपी है, जिन पर इसका पूरा ढांचा खड़ा है।",
        image: "/demo/news2.png",
        href: "/articles/2",
        author: "जयन्ती मिश्रा",
    },
    {
        id: 3,
        title: "शराब घोटाला केस में क्या-क्या हुआ? केजरीवाल के बरी होने से जस्टिस कांता के हटने तक की कहानी",
        description:
            "उत्तर प्रदेश की योगी सरकार ने गुरुवार की शाम बड़े पैमाने पर प्रशासनिक अफसरों का फेरबदल कर दिया। प्रदेश के 84 पीसीएस (PCS) अधिकारियों का एक साथ तबादला कर दिया गया है।",
        image: "/demo/news3.png",
        href: "/articles/3",
        author: "जयन्ती मिश्रा",
    },
    {
        id: 4,
        title: "क्या आंतरिक मतभेद को चुनावी हेरफेर का सबूत मानना सही है?",
        description:
            "दो चुनाव आयुक्तों की 14 आपत्तियों से चुनाव आयोग की कार्यप्रणाली पर सवाल उठे हैं, लेकिन हर आपत्ति को संवैधानिक विफलता मानने से पहले अंतिम निर्णय और ठोस सबूत जरूरी हैं।",
        image: "/demo/news4.png",
        href: "/articles/4",
        author: "जयन्ती मिश्रा",
    },
    {
        id: 5,
        title: "क्या आंतरिक मतभेद को चुनावी हेरफेर का सबूत मानना सही है?",
        description:
            "दो चुनाव आयुक्तों की 14 आपत्तियों से चुनाव आयोग की कार्यप्रणाली पर सवाल उठे हैं, लेकिन हर आपत्ति को संवैधानिक विफलता मानने से पहले अंतिम निर्णय और ठोस सबूत जरूरी हैं।",
        image: "/demo/news4.png",
        href: "/articles/4",
        author: "जयन्ती मिश्रा",
    },
    {
        id: 6,
        title: "क्या आंतरिक मतभेद को चुनावी हेरफेर का सबूत मानना सही है?",
        description:
            "दो चुनाव आयुक्तों की 14 आपत्तियों से चुनाव आयोग की कार्यप्रणाली पर सवाल उठे हैं, लेकिन हर आपत्ति को संवैधानिक विफलता मानने से पहले अंतिम निर्णय और ठोस सबूत जरूरी हैं।",
        image: "/demo/news4.png",
        href: "/articles/4",
        author: "जयन्ती मिश्रा",
    },
    {
        id: 7,
        title: "क्या आंतरिक मतभेद को चुनावी हेरफेर का सबूत मानना सही है?",
        description:
            "दो चुनाव आयुक्तों की 14 आपत्तियों से चुनाव आयोग की कार्यप्रणाली पर सवाल उठे हैं, लेकिन हर आपत्ति को संवैधानिक विफलता मानने से पहले अंतिम निर्णय और ठोस सबूत जरूरी हैं।",
        image: "/demo/news4.png",
        href: "/articles/4",
        author: "जयन्ती मिश्रा",
    },
];


const page = () => {
    return (
        <main className='page-container grid grid-cols-1 lg:grid-cols-7 gap-4 mt-8 lg:mt-14'>
            <section className=' lg:col-span-5'>
                <SectionHeading
                    headingTitle={'राजनीति'}
                    noLink
                    className='text-2xl lg:text-3xl!'
                />
                <div className="w-full">
                    {articleItems.map((item, i) => (
                        <ArticleCard key={item.id ?? i} item={item} priority={i === 0} />
                    ))}
                </div>
            </section>
            <section className='min-h-50  lg:col-span-2 pt-5 lg:pt-17 space-y-5 lg:space-y-3.5 relative'>
                <SideAds />
                <div className='sticky top-35'>
                    <LatestNews />
                </div>
            </section>
        </main>
    )
}

export default page