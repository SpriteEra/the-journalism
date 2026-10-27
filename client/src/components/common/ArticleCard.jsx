import { User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { UserRound } from "lucide-react";

const ArticleCard = ({ item, divider = true, priority = false, className = "" }) => {
    if (!item) return null;
    const { title, description, image, href = "#", author } = item;


    return (
        <article
            className={`w-full py-2.5 max-lg:pb-2 sm:py-3 first:pt-0 ${divider ? "border-b border-black/10" : ""} ${className}`}
        >
            <Link href={href} className="group flex items-start gap-2.5 lg:gap-3">
                <div className="relative aspect-square lg:aspect-video w-[30%] sm:w-[38%] max-w-83 shrink-0 overflow-hidden rounded-sm bg-gray-200 lg:w-[38%]">
                    <Image
                        src={image || "/banner.png"}
                        alt={title || ""}
                        fill
                        priority={priority}
                        sizes="(max-width: 1024px) 40vw, 320px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.04] rounded-sm"
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 lg:line-clamp-3 font-khand text-xl font-semibold leading-snug text-black transition-colors group-hover:text-primary lg:text-[30px] lg:leading-8.75 tracking-[0.01em] lg:pt-1">
                        {title}
                    </h3>

                    {description && (
                        <p className="mt-1 lg:mt-1.5 line-clamp-2 text-[13px] leading-normal text-[#646464] lg:mt-2 lg:text-lg">
                            {description}
                        </p>
                    )}

                    {author && (
                        <p className="mt-1 lg:mt-2 flex items-center gap-1.5 text-xs font-medium text-primary lg:mt-3 lg:text-lg">
                            <UserRound className="size-3.5 lg:size-5" aria-hidden />
                            <span>{author}</span>
                        </p>
                    )}
                </div>
            </Link>
        </article>
    );
};

export default ArticleCard;