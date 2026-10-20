import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/* Replace with real data (props or API) */
const DEFAULT_ITEMS = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    title: "यूपी में बड़ा प्रशासनिक फेरबदल, कई एडीएम समेत 20 अधिकारियों के तबादले",
    image: "/demo/news1.png",
    href: `/live/${i + 1}`,
}));

const LiveNews = ({
    title = "लाइव न्यूज़",
    titleHref = "/live",
    moreHref = "/live",
    items = DEFAULT_ITEMS,
    className = "",
}) => {
    return (
        <section
            aria-label={title}
            className={`w-full max-w-100 rounded-sm bg-[#FBC8170D] shadow-[0_0px_4px_rgba(0,0,0,0.01)] max-lg:px-2 max-lg:py-4 p-3 ${className}`}
        >
            {/* Header */}
            <Link href={titleHref} className="group mb-2 inline-flex items-center gap-1 text-xl font-semibold text-black">
                लाइव न्यूज़
                <ChevronRight className="size-5" />
            </Link>

            {/* List */}
            <ul className="lg:divide-y divide-black/5 max-lg:grid max-lg:grid-cols-2 max-lg:gap-x-2">
                {items.map((item) => (
                    <li key={item.id} className="lg:first:pt-0 py-1.5 sm:py-3 lg:first:pb-3 lg:last:pb-2">
                        <Link href={item.href} className="group flex items-center gap-2 lg:gap-3 max-lg:flex-col">
                            <div className="relative aspect-video w-full lg:h-15 lg:w-20 shrink-0 overflow-hidden rounded bg-gray-200">
                                <Image
                                    src={item.image || "/banner.png"}
                                    alt={item.title}
                                    fill
                                    sizes="72px"
                                    className="object-cover"
                                />
                            </div>
                            <h3 className="line-clamp-2 font-khand text-lg leading-6 lg:text-xl font-semibold lg:leading-6.5 text-black transition-colors group-hover:text-primary tracking-[0.01em]">
                                {item.title}
                            </h3>
                        </Link>
                    </li>
                ))}
            </ul>

            {/* Footer */}
            <div className="mt-1 text-right">
                <Link href={moreHref} className="text-sm lg:text-[15px] font-semibold text-primary hover:underline">
                    और पढ़ें ...
                </Link>
            </div>
        </section>
    );
};

export default LiveNews;