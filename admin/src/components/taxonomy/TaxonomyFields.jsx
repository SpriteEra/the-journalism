import { toIstInput } from "../../lib/time";
import { useMemo } from "react";
import { useCategories, useDistricts, useStates, useTagSuggest } from "../../hooks/admin";
import { useState } from "react";
import usePermission from "../../hooks/usePermission";
import { ChipInput, Field, MultiSelect } from "../ui";

export const emptyTaxonomy = { category: [], subCategory: [], state: [], district: [] };

/** news / video object (populated or ids) -> { category:[id], … } for the form */
export const taxonomyFrom = (doc = {}) => {
  const ids = (list) => (list || []).map((x) => (typeof x === "object" ? x._id : x));
  return { category: ids(doc.category), subCategory: ids(doc.subCategory), state: ids(doc.state), district: ids(doc.district) };
};
/** tags from a populated doc -> [{id,title}] */
export const tagsFrom = (doc = {}) => (doc.tags || []).map((t) => (typeof t === "object" ? { id: t._id, title: t.title } : { id: t, title: String(t) }));

/** Appends category / subCategory / state / district / tags to a FormData the way the API expects (arrays as JSON). */
export const appendTaxonomy = (fd, tax, tags = []) => {
  ["category", "subCategory", "state", "district"].forEach((k) => fd.append(k, JSON.stringify(tax[k] || [])));
  fd.append("tags", JSON.stringify(tags.map((t) => t.id || t.title)));
};

/**
 * Category (>=1 for publishing) + sub-category + state + district pickers, wired to each other:
 *   removing a category removes its sub-categories, removing a state removes its districts.
 */
export function TaxonomyFields({ value, onChange, categoryRequired = false, errors = {} }) {
  const cats = useCategories(); const states = useStates(); const districts = useDistricts();
  const v = { ...emptyTaxonomy, ...value };

  const tops = useMemo(() => (cats.data || []).filter((c) => !c.parent && c.isActive !== false), [cats.data]);
  const subs = useMemo(() => (cats.data || []).filter((c) => c.parent && c.isActive !== false), [cats.data]);
  const subOptions = subs.filter((s) => v.category.includes(String(s.parent)));
  const stateOptions = (states.data || []).filter((s) => s.isActive !== false);
  const districtOptions = (districts.data || []).filter((d) => d.isActive !== false && (!v.state.length || v.state.includes(String(d.state?._id || d.state))));

  const setCategory = (category) => onChange({ ...v, category, subCategory: v.subCategory.filter((id) => category.includes(String(subs.find((s) => s._id === id)?.parent))) });
  const setState = (state) => onChange({ ...v, state, district: v.district.filter((id) => { const d = (districts.data || []).find((x) => x._id === id); return !state.length || state.includes(String(d?.state?._id || d?.state)); }) });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Categories" required={categoryRequired} error={errors.category} hint="Category or state — at least one" info="The sections of the website the story appears in (Politics, Sports …). One of them can be the primary section used in the story link.">
        <MultiSelect options={tops.map((c) => ({ value: c._id, label: c.name }))} value={v.category} onChange={setCategory} placeholder="Choose categories" max={10} />
      </Field>
      <Field label="Sub-categories" hint={v.category.length ? "Optional" : "Choose a category first"}>
        <MultiSelect options={subOptions.map((c) => ({ value: c._id, label: c.name }))} value={v.subCategory} onChange={(subCategory) => onChange({ ...v, subCategory })} disabled={!v.category.length} placeholder="Choose sub-categories" emptyText="This category has no sub-categories" max={30} />
      </Field>
      <Field label="States" hint="Category or state — at least one" info="Use for local news. A story can also use a state as the first part of its link.">
        <MultiSelect options={stateOptions.map((s) => ({ value: s._id, label: s.displayName || s.state }))} value={v.state} onChange={setState} placeholder="Choose states" max={10} />
      </Field>
      <Field label="Districts" hint={v.state.length ? "From the chosen states" : "Optional – choose a state to narrow the list"}>
        <MultiSelect options={districtOptions.map((d) => ({ value: d._id, label: d.displayName || d.district }))} value={v.district} onChange={(district) => onChange({ ...v, district })} placeholder="Choose districts" max={50} />
      </Field>
    </div>
  );
}

/** Tag chips with live suggestions. Users with tag.create may type a new tag, others can only pick existing ones. */
export function TagPicker({ value, onChange, max = 20, label = "Topic", required, error }) {
  const [q, setQ] = useState("");
  const { can } = usePermission();
  const { data = [] } = useTagSuggest(q);
  return (
    <Field label={label} required={required} error={error} hint={can("tag.create") ? "The main subject of the story. Press Enter to add — a new topic is created automatically." : "Pick the subject from the list. You can't create new topics."}>
      <ChipInput value={value} onChange={onChange} suggestions={data} onQuery={setQ} canCreate={can("tag.create")} max={max} placeholder="Search or add a topic" />
    </Field>
  );
}

const OID = /^[a-f0-9]{24}$/i;
/**
 * News (API shape, or an old autosaved copy in localStorage) -> editor state.
 *  category / subCategory / state / district  -> arrays of ids   (old string values are dropped)
 *  tags                                       -> array of titles (the API resolves titles to Tag documents)
 */
export const normalizeBlog = (news = {}) => {
  const ids = (list) => (Array.isArray(list) ? list : []).map((x) => (x && typeof x === "object" ? x._id : x)).filter((x) => typeof x === "string" && OID.test(x));
  const { news_section_type, ...rest } = news;
  return {
    ...rest,
    category: ids(news.category), subCategory: ids(news.subCategory), state: ids(news.state), district: ids(news.district),
    tags: (Array.isArray(news.tags) ? news.tags : []).map((t) => (t && typeof t === "object" ? t.title : t)).filter(Boolean),
    slug: news.slug || "",
    related: (Array.isArray(news.relatedNews) ? news.relatedNews : []).filter((r) => r && r.news_id).map((r) => ({ news_id: r.news_id, title: r.title, banner: r.banner })),
    primaryRoute: news.primaryRoute?.ref ? { kind: news.primaryRoute.kind, id: String(news.primaryRoute.ref) } : undefined,
    feature: news.feature || (news.featured?.isFeatured && new Date(news.featured.until) > new Date() ? { enabled: true, until: toIstInput(news.featured.until) } : { enabled: false, until: "" }),
    keywords: { hi: Array.isArray(news.keywords?.hi) ? news.keywords.hi : [], en: Array.isArray(news.keywords?.en) ? news.keywords.en : [] },
  };
};
