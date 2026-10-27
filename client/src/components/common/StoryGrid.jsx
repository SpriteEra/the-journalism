import NewsCard from "./NewsCard";

/** A grid of story cards for listing pages (category, topic, search …). */
export default function StoryGrid({ items = [], className = "" }) {
  if (!items.length) return null;
  return (
    <div className={`grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {items.map((it, i) => <NewsCard key={`${it.id}-${i}`} item={it} priority={i < 3} />)}
    </div>
  );
}
