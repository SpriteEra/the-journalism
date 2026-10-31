import { useQuery } from "@tanstack/react-query";
import httpClient from "../api/httpClient";
import { cleanParams } from "../lib/api";

/**
 * Live news data hooks.  Every key starts with "live-news", so a mutation can simply `invalidate: ["live-news"]`.
 *
 * NOTE (future): timeline updates (POST/PUT/DELETE /live/:slug/updates) exist on the server but are NOT used by the
 * panel yet. When that feature is built, add its hooks here.
 */
const get = (url, params) => httpClient.get(url, { params: cleanParams(params) }).then((r) => r.data);

export const useLiveNewsList = (params) =>
  useQuery({ queryKey: ["live-news", "list", params], queryFn: () => get("/live", params), placeholderData: (p) => p });

export const useLiveNewsItem = (slug) =>
  useQuery({ queryKey: ["live-news", "item", slug], queryFn: () => get(`/live/${slug}`), enabled: Boolean(slug), select: (d) => d.live, refetchOnMount: "always" });
