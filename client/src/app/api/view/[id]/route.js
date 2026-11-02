import { apiGet } from "@/lib/api";

/**
 * POST /api/view/<news_id> — counts one read. The server counts a read each time its related-news endpoint is called,
 * so this is the single place that calls it (the browser calls this route once per visit, see ReadBeacon).
 */
export async function POST(request, { params }) {   // was _request
  const { id } = await params;

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
    await apiGet(`/news/increment-count/${id}`, { revalidate: 0, timeout: 4000, headers: forwarded });
  } catch { /* ... */ }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}