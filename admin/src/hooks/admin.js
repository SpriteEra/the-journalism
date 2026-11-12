import { REFERENCE_STALE } from "../lib/persistedQueries";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import toast from "react-hot-toast";
import httpClient from "../api/httpClient";
import { cleanParams, errMsg } from "../lib/api";

/**
 * Data hooks for the admin screens (roles, tags, taxonomy, shorts, analytics, users).
 * Every list uses react-query keys: [name, params] so a mutation can `invalidate: ["tags"]`.
 */
const get = (url, params) => httpClient.get(url, { params: cleanParams(params) }).then((r) => r.data);

export const useApiMutation = (fn, { invalidate = [], success, onSuccess } = {}) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data, vars) => {
      invalidate.forEach((k) => qc.invalidateQueries({ queryKey: Array.isArray(k) ? k : [k] }));
      const msg = typeof success === "function" ? success(data, vars) : success ?? data?.message;
      if (msg) toast.success(msg);
      onSuccess?.(data, vars);
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

// roles & permissions
export const usePermissionCatalog = () => useQuery({ queryKey: ["permission-catalog"], queryFn: () => get("/permissions"), staleTime: 5 * 60_000 });
export const useRoles = () => useQuery({ queryKey: ["roles"], queryFn: () => get("/roles"), select: (d) => d.roles });

// users
export const useUsers = (params) => useQuery({ queryKey: ["users", params], queryFn: () => get("/reporters", params), placeholderData: (p) => p });
export const useUserDetail = (id) => useQuery({ queryKey: ["user", id], queryFn: () => get(`/reporters/${id}`), enabled: Boolean(id) });

// tags
export const useTags = (params) => useQuery({ queryKey: ["tags", params], queryFn: () => get("/tags", params), placeholderData: (p) => p });
export const useTagSuggest = (q) => useQuery({ queryKey: ["tag-suggest", q], queryFn: () => get("/tags/suggest", { q, limit: 8 }), select: (d) => d.tags, staleTime: 20_000, placeholderData: (p) => p });

// taxonomy
export const useCategories = () => useQuery({ queryKey: ["categories"], queryFn: () => get("/categories"), select: (d) => d.categories });
export const useStates = () => useQuery({ queryKey: ["states"], queryFn: () => get("/states"), select: (d) => d.states, staleTime: REFERENCE_STALE });
export const useDistricts = (state) => useQuery({ queryKey: ["districts", state || "all"], queryFn: () => get("/districts", { state }), select: (d) => d.districts, staleTime: REFERENCE_STALE });
export const useHomeSections = () => useQuery({ queryKey: ["home-sections"], queryFn: () => get("/home-sections") });


// short videos
export const useShortVideos = (params) => useQuery({ queryKey: ["short-videos", params], queryFn: () => get("/short-videos", params), placeholderData: (p) => p });
export const useSyncStatus = (enabled) => useQuery({ queryKey: ["short-videos-sync"], queryFn: () => get("/short-videos/sync-status"), enabled, select: (d) => d.status });

// analytics (cached on the server: X-Cache HIT/STALE/MISS)
// Today sends only today=true; every other filter sends its date range as before.
export const useAnalyticsDashboard = (range, enabled = true, { today = false } = {}) =>
  useQuery({
    queryKey: ["analytics", "dashboard", today ? "today" : range],
    queryFn: () => get("/analytics/dashboard", today ? { today: true } : range),
    enabled,
    staleTime: today ? 15_000 : 120_000,
    refetchInterval: today ? 30_000 : false,
    refetchIntervalInBackground: false,   // no polling in hidden tabs
    placeholderData: keepPreviousData,    // no flicker when switching filters
  });

export const useReporterPerformance = (id, range, enabled = true) =>
  useQuery({ queryKey: ["reporter-performance", id, range], queryFn: () => get(`/reporters/${id}/performance`, range), enabled, select: (d) => d.report, staleTime: 60_000 });

// activity logs (kept 10 days on the server)
export const useActivityLogs = (params, enabled = true) =>
  useQuery({ queryKey: ["activity-logs", params], queryFn: () => get("/logs", params), enabled, placeholderData: (p) => p, refetchInterval: 30_000 });
export const useActivityLogStats = (source, enabled = true) =>
  useQuery({ queryKey: ["activity-log-stats", source], queryFn: () => get("/logs/stats", { source }), enabled, staleTime: 30_000 });

// team performance: ranked reporters for a date range (reporter.performance.all)
export const useReportersLeaderboard = (range, sort = "views", enabled = true) =>
  useQuery({ queryKey: ["team-leaderboard", range, sort], queryFn: () => get("/reporters-performance", { ...range, sort, limit: 100 }), enabled, select: (d) => d.leaderboard, placeholderData: (p) => p, staleTime: 60_000 });


export const useTodayReads = (enabled = true) => useQuery({
  queryKey: ["analytics", "today-view"],
  queryFn: () => get("/analytics/today-view"),
  enabled,
  refetchInterval: 60_000, // the backend caches for 60s
  staleTime: 30_000,
});

// live analytics: hourly reads for Today / last 24 hours (server cache: 30 s fresh + 60 s stale)
const liveOptions = (name, params) => ({
  queryFn: () => get(`/analytics/live/${name}`, params),
  staleTime: 15_000,
  refetchInterval: 30_000,
  refetchIntervalInBackground: false,   // no polling in hidden tabs
  placeholderData: keepPreviousData,    // no flicker when you change page or filter
});
export const useLiveSummary = (params) => useQuery({ queryKey: ["analytics", "live", "summary", params], ...liveOptions("summary", params) });
export const useLiveContent = (params) => useQuery({ queryKey: ["analytics", "live", "content", params], ...liveOptions("content", params) });
export const useLiveBreakdown = (params) => useQuery({ queryKey: ["analytics", "live", "breakdown", params], ...liveOptions("breakdown", params) });