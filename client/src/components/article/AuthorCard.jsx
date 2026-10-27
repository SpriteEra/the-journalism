import Link from "next/link";
import Image from "next/image";

/**
 * "About the author" card: round avatar, small label, name, short bio.
 *
 * Props
 *  - author {
 *      name, bio?, image?, href?   (href makes the name a link)
 *    }
 *  - label      small text above the name (default "लेखक के बारे में")
 *  - className  extra classes for the card
 *
 * Mobile: avatar on top of the text. From sm up: avatar left, text right.
 */

const AuthorCard = ({ author, label = "लेखक के बारे में", className = "" }) => {
    if (!author || !author.fullName) return null;
    const { fullName, about, profile, profileUrl } = author;


    return (
        <section
            aria-label={label}
            className={`flex items-start gap-3 lg:gap-4 rounded-xl border border-gray-200 bg-white p-3 lg:p-4 px-2 lg:px-3 shadow-[0px_0px_2px_0px_#0000001A] lg:shadow-[0px_0px_4px_0px_#0000001A]  sm:items-center sm:gap-5 lg:p-5 ${className}`}
        >
            <div className="relative size-21 lg:size-25 shrink-0 overflow-hidden rounded-full bg-gray-200 lg:size-36">
                <Image
                    src={profile || "/banner.png"}
                    alt={fullName}
                    fill
                    sizes="(max-width: 1024px) 96px, 144px"
                    className="object-cover object-top"
                />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-xs lg:text-[15px]">{label}</p>


                <Link href={profileUrl || '/'} className={`text-2xl font-bold leading-normal text-black lg:text-3xl block transition-colors hover:text-primary`}>
                    {fullName}
                </Link>

                {about && (
                    <p className="lg:mt-1 line-clamp-2 text-sm leading-snug text-black/65 lg:text-lg lg:leading-6.25">
                        {about}
                    </p>
                )}
            </div>
        </section>
    );
};

export default AuthorCard;