import { NextResponse } from "next/server";
import { searchNews } from "@/lib/data";

export async function GET(req) {
    const q = new URL(req.url).searchParams.get("q") || "";
    const { items } = await searchNews({ search: q, limit: 8 });
    return NextResponse.json(
        { results: items },
        { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
    );
}