import { NextResponse } from "next/server";
import { getNextShorts } from "@/lib/data";

export async function GET(req) {
    const sp = req.nextUrl.searchParams;
    const slug = sp.get("slug");
    if (!slug) return NextResponse.json({ items: [], hasMore: false });
    const exclude = (sp.get("exclude") || "").split(",").filter(Boolean).slice(-150);
    const { items, hasMore } = await getNextShorts(slug, { exclude, limit: 5 });
    return NextResponse.json({
        items: items.map(({ id, title, description, image, videoUrl, hlsUrl, youtubeId }) => ({ id, title, description, image, videoUrl, hlsUrl, youtubeId })),
        hasMore,
    });
}