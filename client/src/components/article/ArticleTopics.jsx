import Link from "next/link";

const ArticleTopics = ({ topics = [], label = "Topics:", className = "" }) => {
    if (!topics || topics.length === 0) return null;

    return (
        <div className={`flex flex-col items-baseline font-medium gap-x-2 lg:gap-y-1 text-base lg:text-lg tracking-[0.02em] leading-[31px] ${className}`}>
            <span className="text-black ">{label}</span>

            <ul className="flex flex-wrap gap-x-2.5 gap-y-3 lg:gap-x-3 lg:gap-y-4">
                {topics.map((topic, i) => (
                    <li key={topic.href ?? i}>
                        <Link
                            href={topic.href ?? "#"}
                            className={`block rounded-full border px-5 py-2 text-[15px] leading-normal transition-colors lg:px-4 lg:py-1.5 lg:text-base border-black/15 text-black/60 hover:border-primary hover:text-primary`}
                        >
                            {topic.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ArticleTopics;