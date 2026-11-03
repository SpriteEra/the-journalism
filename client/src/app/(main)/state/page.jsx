import FiveCardLayoutSection from "@/components/common/FiveCardLayoutSection";
import FourCardLayoutSection from "@/components/common/FourCardLayoutSection";
import JsonLd from "@/components/common/JsonLd";
import StateChips from "@/components/StateChips";
import { getStateSections, getStates } from "@/lib/data";
import { abs, siteName } from "@/lib/site";

const OG_IMAGE = { url: "/og-default.png", width: 1200, height: 630, alt: siteName() };

const TITLE = "राज्य की खबरें: सभी राज्यों की ताज़ा खबरें और अपडेट";
const DESCRIPTION =
  "उत्तर प्रदेश, बिहार, राजस्थान, मध्य प्रदेश समेत देश के सभी राज्यों की ताज़ा खबरें एक जगह। अपना राज्य चुनें और वहां की राजनीति, अपराध, मौसम और हर बड़ी खबर पढ़ें।";

export const metadata = {
  title: TITLE, // the layout's template adds "| siteName"
  description: DESCRIPTION,
  alternates: { canonical: abs("/state") },
  openGraph: {
    type: "website",
    siteName: siteName(),
    locale: "hi_IN",
    title: `${TITLE} | ${siteName()}`,
    description: DESCRIPTION,
    url: abs("/state"),
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | ${siteName()}`,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

const FIVE_BG = ["bg-[#FF3D000D]", "bg-[#E56C0F0D]"]; // the 4-card sections alternate these, like on the home page

/** /state -the news of every state, state by state. The heading of each section opens that state's own page (/state/{slug}). */
export default async function StatesPage() {
  const { states, sections } = await getStateSections();

  const pageLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: TITLE,
      description: DESCRIPTION,
      url: abs("/state"),
      inLanguage: "hi-IN",
      isPartOf: { "@type": "WebSite", name: siteName(), url: abs("/") },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: sections
          .filter((s) => s?.href && s?.name)
          .map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.name,
            url: abs(s.href),
          })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "होम", item: abs("/") },
        { "@type": "ListItem", position: 2, name: "राज्य", item: abs("/state") },
      ],
    },
  ];

  let fives = 0;
  return (
    <section className="min-h-screen">
      <JsonLd data={pageLd} />
      <h1 className="sr-only">राज्यों की ताज़ा खबरें</h1>
      <StateChips states={states} />
      {sections.length === 0 && (
        <p className="page-container mt-10 rounded border border-dashed border-black/15 p-10 text-center text-lg text-black/60">इस समय किसी राज्य की खबर उपलब्ध नहीं है।</p>
      )}

      {sections.map((s, i) =>
        i % 2 === 0 ? (
          <FiveCardLayoutSection key={s.id} title={s.name} titleHref={s.href} items={s.items.slice(0, 5)} perColumn={2} className="mt-0!" bgClassName="bg-transparent" />
        ) : (
          <FourCardLayoutSection key={s.id} title={s.name} titleHref={s.href} items={s.items.slice(0, 4)} bgClassName={FIVE_BG[fives++ % FIVE_BG.length]} />
        )
      )}
    </section>
  );
}