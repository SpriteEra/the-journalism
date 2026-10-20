import Link from "next/link";

/**
 * "Topics:  a, b, c" row of red underlined links.
 *
 * Props
 *  - topics     array of { label, href }
 *  - label      text before the links (default "Topics:")
 *  - className  extra classes for the wrapper
 *
 * Renders nothing if there are no topics.
 */

const ArticleTopics = ({ topics = [], label = "Topics:", className = "" }) => {
    if (!topics || topics.length === 0) return null;

    return (
        <div className={`flex flex-wrap items-baseline font-medium gap-x-2 lg:gap-y-1 text-base lg:text-lg tracking-[0.02em] leading-[31px] ${className}`}>
            <span className="text-black ">{label}</span>

            <ul className="flex flex-wrap items-baseline gap-x-1">
                {topics.map((topic, i) => (
                    <li key={topic.href ?? i}>
                        <Link
                            href={topic.href ?? "#"}
                            className="text-primary  underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
                        >
                            {topic.label}
                        </Link>
                        {i < topics.length - 1 && <span className="text-primary">,</span>}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ArticleTopics;