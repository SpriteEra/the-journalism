import NewsCard from "./NewsCard";
import SectionHeading from "./SectionHeading";

const FourCardLayoutSection = ({
    title,
    titleHref,
    items = [],
    className = "",
}) => {

    if (!items.length) return null;

    return (
        <section aria-label={title} className={`w-full my-3 lg:my-5 ${className} page-container`}>
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
        </section>
    );
};

export default FourCardLayoutSection;