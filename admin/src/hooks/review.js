import { useQuery } from "@tanstack/react-query";
import httpClient from "../api/httpClient";
import { cleanParams } from "../lib/api";

export const useReviewQueue = ({ type, status, page, limit, search }) => useQuery({
    queryKey: ["review-queue", { type, status, page, limit, search }],
    queryFn: async () => (await httpClient.get("/review-queue", { params: cleanParams({ type: type === "all" ? undefined : type, status, page, limit, search }) })).data,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
});

export const useReviewItem = (type, id) => useQuery({
    queryKey: ["review-item", type, id],
    queryFn: async () => (await httpClient.get(`/review/${type}/${id}`)).data,
    staleTime: 0,
});


/** number of items waiting for me; refreshed every minute */
export const useReviewCount = (enabled = true) =>
    useQuery({
        queryKey: ["review-queue", "count"],      // starts with "review-queue", so your existing invalidations refresh it too
        queryFn: () => httpClient.get("/review-queue/count").then((r) => r.data.total),
        enabled,
        refetchInterval: 60_000,
        refetchIntervalInBackground: false,       // pauses while the tab is hidden
        refetchOnWindowFocus: true,               // catches up as soon as the user returns
        staleTime: 30_000,
    });