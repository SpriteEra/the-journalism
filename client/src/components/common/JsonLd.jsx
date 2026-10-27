/** Renders schema.org JSON-LD blocks (from the server) as <script type="application/ld+json">. `<` is escaped so content can never close the tag. */
export default function JsonLd({ data }) {
  const list = (Array.isArray(data) ? data : data ? [data] : []).filter(Boolean);
  return list.map((block, i) => (
    <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block).replace(/</g, "\\u003c") }} />
  ));
}
