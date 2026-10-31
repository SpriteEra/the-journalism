import FiveCardLayoutSection from "@/components/common/FiveCardLayoutSection";
import FourCardLayoutSection from "@/components/common/FourCardLayoutSection";
import { getLatest, getStates } from "@/lib/data";
import { abs } from "@/lib/site";

export const metadata = {
  title: "राज्य",
  description: "सभी राज्यों की ताज़ा खबरें एक जगह: अपना राज्य चुनें और वहां की हर बड़ी खबर पढ़ें।",
  alternates: { canonical: abs("/state") },
};

// same look as the home page: a 5-card section, then a 4-card section, then 5, 4 …  (one section per state)
const FIVE_BG = ["bg-[#FF3D000D]", "bg-[#E56C0F0D]"]; // the 5-card sections alternate these, like on the home page
const PER_STATE = 5;                                  // stories fetched per state (the 4-card sections show the first 4)

/** /state — the news of every state, state by state. The heading of each section opens that state's own page (/state/{slug}). */
export default async function StatesPage() {
  const states = await getStates();

  // each state's latest stories; states with no story yet are left out
  const withNews = (
    await Promise.all(states.map(async (s) => ({ ...s, items: (await getLatest({ state: s.slug, limit: PER_STATE })).items })))
  ).filter((s) => s.items.length > 0);

  let fives = 0;
  return (
    <section className="min-h-screen">
      <h1 className="sr-only">राज्य</h1>

      {withNews.length === 0 && (
        <p className="page-container mt-10 rounded border border-dashed border-black/15 p-10 text-center text-lg text-black/60">इस समय किसी राज्य की खबर उपलब्ध नहीं है।</p>
      )}

      {withNews.map((s, i) =>
        i % 2 === 0 ? (
          <FiveCardLayoutSection key={s.id} title={s.name} titleHref={`/state/${s.slug}`} items={s.items.slice(0, 5)} perColumn={2} className="mt-0!" bgClassName={'trnasparent'} />
        ) : (
          <FourCardLayoutSection key={s.id} title={s.name} titleHref={`/state/${s.slug}`} items={s.items.slice(0, 4)} bgClassName={`${FIVE_BG[fives++ % FIVE_BG.length]}`} />
        )
      )}
    </section>
  );
}