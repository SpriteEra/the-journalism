import { apiGet } from "@/lib/api";

const TYPES = new Set(["news", "yt", "short", "live"]);

export async function POST(request, { params }) {
  const { id } = await params;
  const type = new URL(request.url).searchParams.get("type") || "news";
  if (!TYPES.has(type)) return new Response(null, { status: 404 });

  const h = request.headers;
  const forwarded = {
    "user-agent": h.get("user-agent") ?? "",
    "accept-language": h.get("accept-language") ?? "",
    "accept-encoding": h.get("accept-encoding") ?? "",
    "accept": h.get("accept") ?? "",
    "sec-fetch-site": h.get("sec-fetch-site") ?? "",
    "x-forwarded-for": h.get("x-forwarded-for") ?? "",
    "x-real-ip": h.get("x-real-ip") ?? "",
  };

  try {
    try {
      const data = await apiGet(`/news/increment-count/${type}/${encodeURIComponent(id)}`, { revalidate: 0, timeout: 4000, headers: forwarded });
    } catch (e) {
      console.error(`[ReadBeacon:${type}] ${id} FAILED:`, e?.status ?? "", e?.message ?? e);
    }
  } catch { /* never break the page because of counting */ }

  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}