import State from "../model/state.model.js";
import Category from "../model/category.model.js";

export const attachPrimaryName = async (docs) => {
    const list = (Array.isArray(docs) ? docs : [docs]).filter((d) => d?.primaryRoute?.ref);
    if (!list.length) return docs;

    const idsOf = (...kinds) => [...new Set(list.filter((d) => kinds.includes(d.primaryRoute.kind)).map((d) => String(d.primaryRoute.ref)))];
    const catIds = idsOf('category', 'subCategory');      // both live in the Category collection
    const stateIds = idsOf('state');

    const [cats, states] = await Promise.all([
        catIds.length ? Category.find({ _id: { $in: catIds } }).select('name').lean() : [],
        stateIds.length ? State.find({ _id: { $in: stateIds } }).select('displayName state').lean() : [],
    ]);

    const catName = new Map(cats.map((c) => [String(c._id), c.name]));
    const stateName = new Map(states.map((s) => [String(s._id), s.displayName || s.state]));

    for (const d of list) {
        const { kind, ref, slug } = d.primaryRoute;
        const name = (kind === 'state' ? stateName : catName).get(String(ref));
        d.primaryRoute = { kind, slug, name: name || slug };
    }
    return docs;
};