export const toPreview = (full) => {
    const nm = (list, pick) => (list || []).map(pick).filter(Boolean);
    const a = full.author || {};
    return {
        title: full.title, banner: full.banner, description: full.description, content: full.content, imageRef: full.imageRef, isVideo: full.isVideo, video: full.video,
        location: full.location, keywords: full.keywords, createdAt: full.post_time || full.createdAt,
        author: { name: a.fullName || a.username, role: a.designation, bio: a.about, image: a.profile },
        categories: nm([...(full.category || []), ...(full.subCategory || [])], (c) => c.name), topics: nm(full.tags, (x) => x.title),
        places: nm([...(full.state || []), ...(full.district || [])], (p) => p.displayName || p.state || p.district),
    };
};