import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";

/* Replace with real data (props or API) */
const DEFAULT_ITEMS = [
    {
        id: 1,
        title: "सीजेपी संस्थापक अभिजीत दिपके ने सीईसी ज्ञानेश कुमार के इस्तीफे की मांग की, क्या कहा",
        image: "/demo/news2.png",
        href: "/video/1",
    },
    {
        id: 2,
        title: "शराब घोटाला केस में क्या-क्या हुआ? केजरीवाल के बरी होने से जस्टिस कांता के हटने तक की कहानी",
        image: "/demo/news3.png",
        href: "/video/2",
    },
];

const VideoSection = ({
    title = "वीडियो",
    titleHref = "/video",
    items = DEFAULT_ITEMS,
    className = "",
}) => {
    return (
        <section
            aria-label={title}
            className={`w-full lg:max-w-75 rounded-sm lg:border border-gray-100 bg-white lg:p-2 max-lg:mt-7 shadow-[0_0px_4px_rgba(0,0,0,0.01)] ${className}`}
        >
            {/* Header */}
            <Link
                href={titleHref} className="group mb-2 inline-flex items-center gap-1 text-xl font-semibold text-black">
                वीडियो
                <ChevronRight className="size-5" />
            </Link>

            {/* Videos */}
            <ul className="space-y-5 max-lg:grid max-lg:grid-cols-2 max-lg:gap-2">
                {items.map((item) => (
                    <li key={item.id}>
                        <Link href={item.href} className="group block">
                            {/* 16:9 thumbnail with play button */}
                            <div className="relative aspect-video w-full overflow-hidden rounded-[5px] lg:rounded-[3px] bg-gray-200">
                                <Image
                                    src={item.image || "/banner.png"}
                                    alt={item.title}
                                    fill
                                    sizes="300px"
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <span
                                    aria-hidden
                                    className="absolute left-1/2 top-1/2 flex h-8 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-[#f01c1c] shadow-md transition-transform group-hover:scale-110"
                                >
                                    <Play className="size-4 fill-white text-white" />
                                </span>
                            </div>

                            <h3 className="mt-2 line-clamp-3 font-khand text-lg lg:text-xl font-semibold text-black transition-colors group-hover:text-primary tracking-[0.01em] leading-[25px]">
                                {item.title}
                            </h3>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default VideoSection;