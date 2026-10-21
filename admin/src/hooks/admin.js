import { REFERENCE_STALE } from "../lib/persistedQueries";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  console.log('hello')
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

// short videos
export const useShortVideos = (params) => useQuery({ queryKey: ["short-videos", params], queryFn: () => get("/short-videos", params), placeholderData: (p) => p });
export const useSyncStatus = (enabled) => useQuery({ queryKey: ["short-videos-sync"], queryFn: () => get("/short-videos/sync-status"), enabled, select: (d) => d.status });

// analytics (cached on the server: X-Cache HIT/STALE/MISS)
export const useAnalyticsDashboard = (range, enabled = true) =>
  useQuery({ queryKey: ["analytics-dashboard", range], queryFn: () => get("/analytics/dashboard", range), enabled, staleTime: 60_000, placeholderData: (p) => p });
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
