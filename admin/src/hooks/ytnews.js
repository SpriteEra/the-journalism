import httpClient from '../api/httpClient'
import { useMutation, useQuery } from "@tanstack/react-query";
const fetchYtNews = async ({ queryKey }) => {
  const [_key, { page, limit, filters }] = queryKey;

  const { district, state, location, createdAt, search } = filters;
  const params = {
    page,
    limit,
    // draft,
    district,
    state,
    location,
    createdAt,
    search,
  };

  const { data } = await httpClient.get('/yt-news', { params });
  return data;
};

export const useFetchVideos = ({ page, limit, filters }) => {
  return useQuery({
    queryKey: ['yt-news', { page, limit, filters }],
    queryFn: fetchYtNews,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2,
  });
};
