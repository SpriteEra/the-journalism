import Image from "@/components/common/Img";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getLatest } from "@/lib/data";

const LatestNews = async ({
    title = "लेटेस्ट न्यूज़",
    titleHref = "/latest",
    items,                // optional: pass your own list to skip the fetch
    limit = 6,
    className = "",
}) => {
    const list = items ?? (await getLatest({ limit })).items;
    if (!list.length) return null;

    return (
        <section
            aria-label={title}
            className={`w-full max-w-lg rounded-sm lg:border border-gray-100 bg-white lg:p-3 lg:shadow-[0_0px_4px_rgba(0,0,0,0.05)] ${className}`}
        >
            {/* Header */}
            <Link href={titleHref} className="group mb-2 inline-flex items-center gap-1 text-xl font-semibold text-black">
                {title}
                <ChevronRight className="size-5" />
            </Link>

            {/* List */}
            <ul className="divide-y divide-black/5">
                {list.map((item) => (
                    <li key={item.id} className="first:pt-0 py-2.5 lg:py-3 first:pb-3 last:pb-2">
                        <Link href={item.href} className="group flex items-center gap-3">
                            <div className="relative h-[68px] lg:h-[58px] w-22 lg:w-20 shrink-0 overflow-hidden rounded-xs bg-gray-200">
                                <Image
                                    src={item.image || "/banner.png"}
                                    alt={item.title}
                                    fill
                                    sizes="72px"
                                    className="object-cover"
                                />
                            </div>
                            <h3 className="line-clamp-2 font-khand text-lg lg:text-xl font-medium lg:leading-6 text-black transition-colors group-hover:text-primary tracking-[0.01em]">
                                {item.title}
                            </h3>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default LatestNews;