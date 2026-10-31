import NewsCard from "./NewsCard";
import SectionHeading from "./SectionHeading";

/**
 * Four stories in a row.
 *  - bgClassName   optional background of the whole strip, same as FiveCardLayoutSection (e.g. "bg-[#FF3D000D]").
 *                  Not passed -> the section looks exactly as before.
 */
const FourCardLayoutSection = ({
    title,
    titleHref,
    items = [],
    className = "",
    bgClassName = "",
}) => {

    if (!items.length) return null;

    const content = (
        <>
            {title && (
                <SectionHeading
                    headingRef={titleHref}
                    headingTitle={title}
                />
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-4 lg:gap-5">
                {items.map((item, i) => (
                    <NewsCard item={item} key={i} />
                ))}
            </div>
        </>
    );

    // no background: unchanged
    if (!bgClassName) {
        return (
            <section aria-label={title} className={`w-full my-3 lg:my-5 ${className} page-container`}>
                {content}
            </section>
        );
    }

    // with a background: full-width strip, the content sits inside the page container (like FiveCardLayoutSection)
    return (
        <section aria-label={title} className={`w-full py-6 lg:py-10 my-3 lg:my-5 ${bgClassName} ${className}`}>
            <div className="page-container">{content}</div>
        </section>
    );
};

export default FourCardLayoutSection;
