import State from "../model/state.model.js";
import Category from "../model/category.model.js";

export const attachPrimaryName = async (docs) => {
    const list = (Array.isArray(docs) ? docs : [docs]).filter((d) => d?.primaryRoute?.ref);
    if (!list.length) return docs;

    const idsOf = (kind) => [...new Set(list.filter((d) => d.primaryRoute.kind === kind).map((d) => String(d.primaryRoute.ref)))];
    const catIds = idsOf('category');
    const stateIds = idsOf('state');

    const [cats, states] = await Promise.all([
        catIds.length ? Category.find({ _id: { $in: catIds } }).select('name').lean() : [],
        stateIds.length ? State.find({ _id: { $in: stateIds } }).select('displayName state').lean() : [],
    ]);

    const names = new Map([
        ...cats.map((c) => [`category:${c._id}`, c.name]),
        ...states.map((s) => [`state:${s._id}`, s.displayName || s.state]),
    ]);

    for (const d of list) {
        const { kind, ref, slug } = d.primaryRoute;
        d.primaryRoute = { kind, slug, name: names.get(`${kind}:${ref}`) || slug };   // ref is dropped from the public response
    }
    return docs;
};