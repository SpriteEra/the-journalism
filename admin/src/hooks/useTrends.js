import httpClient from "../api/httpClient";
import { useQuery } from "@tanstack/react-query";
import { readOra, writeOra } from "../lib/oraCache";

/**
 * OraAI data — cached three times over so the upstream API is called as rarely as possible:
 *   1. server cache (6 h trends / 10 min RSS / 24 h keywords per article)
 *   2. browser cache (localStorage, same limits) — instant on reload
 *   3. react-query memory cache for the session
 */
const HOUR = 3600_000;
const LIMITS = { trends: 6 * HOUR, rss: 10 * 60_000, keywords: 24 * HOUR };

const useCachedQuery = (name, key, limit, fetcher, extra = {}) => {
  const hit = readOra(key, limit);
  return useQuery({
    queryKey: [name, ...(extra.keyParts || [])],
    queryFn: async () => { const data = await fetcher(); writeOra(key, data); return data; },
    initialData: hit?.data,
    initialDataUpdatedAt: hit?.at,
    staleTime: limit,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: extra.enabled ?? true,
  });
};

export const useFetchTopTrends = () =>
  useCachedQuery("top-trends", "trends", LIMITS.trends, async () => (await httpClient.get("/spriteera-service/top-100-trends")).data);

export const useFetchRss = () =>
  useCachedQuery("rss-feed", "rss", LIMITS.rss, async () => (await httpClient.get("/spriteera-service/rss")).data);

const hashKey = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

export const useFetchRelatedTags = ({ title, description, enabled }) =>
  useCachedQuery("related-tags", `kw:${hashKey(`${title}\n${description}`)}`, LIMITS.keywords,
    async () => (await httpClient.post("/spriteera-service/generate-tags", { title, content: description })).data,
    { keyParts: [title, description], enabled });
