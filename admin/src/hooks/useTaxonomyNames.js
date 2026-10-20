import { useMemo } from "react";
import { useCategories, useDistricts, useStates } from "./admin";

/** id -> readable name for categories / states / districts (lists are cached by react-query). */
export default function useTaxonomyNames() {
  const cats = useCategories(); const states = useStates(); const districts = useDistricts();
  return useMemo(() => {
    const map = new Map();
    (cats.data || []).forEach((c) => map.set(c._id, c.name));
    (states.data || []).forEach((s) => map.set(s._id, s.displayName || s.state));
    (districts.data || []).forEach((d) => map.set(d._id, d.displayName || d.district));
    return (x) => (x && typeof x === "object" ? x.name || x.displayName || x.title || x.state || x.district : map.get(x));
  }, [cats.data, states.data, districts.data]);
}
