import httpClient from '../api/httpClient'
import { useQuery } from "@tanstack/react-query";
import { cleanParams } from "../lib/api";
const fetchNews = async ({ queryKey }) => {
  const [_key, { page, limit, draft, need_approval, filters }] = queryKey;

  const { category, subCategory, district, state, location, createdAt, search, tag, from, to, author } = filters;

  const params = {
    page,
    limit,
    draft,
    category,
    subCategory,
    tag,
    district,
    state,
    location,
    createdAt,
    search,
    need_approval,
    from,
    to,
    author,
  };

  const { data } = await httpClient.get('/get-news', { params: cleanParams(params) });
  return data;
};

export const useFetchNews = ({ page, need_approval = false, limit, draft = false, filters }) => {
  return useQuery({
    queryKey: ['news', { page, limit, draft, filters, need_approval }],
    queryFn: fetchNews,
    placeholderData: (previous) => previous,
    staleTime: 1000 * 60 * 2,
  });
};
const fetchScheduleNews = async ({ queryKey }) => {
  const [_key, { page, limit, }] = queryKey;
  const params = {
    page,
    limit,
  };

  const { data } = await httpClient.get('/scheduled-news', { params });
  return data;
};

export const useFetchScheduleNews = ({ page, limit }) => {
  return useQuery({
    queryKey: ['schedule-news', { page, limit, }],
    queryFn: fetchScheduleNews,
    placeholderData: (previous) => previous,
    staleTime: 1000 * 60 * 2,
  });
};


const fetchBreakingNews = async ({ queryKey }) => {
  const [_key, { page, limit, search }] = queryKey;
  const params = {
    page,
    limit,
    search,
  };

  const { data } = await httpClient.get('/get-breaking-news', { params });
  return data;
};

export const useFetchBreakingNews = ({ page, limit, search }) => {
  return useQuery({
    queryKey: ['breaking-news', { page, limit, search }],
    queryFn: fetchBreakingNews,
    placeholderData: (previous) => previous,
    staleTime: 1000 * 60 * 2,
  });
};



const fetchEventNews = async ({ queryKey }) => {
  const [_key, { page, limit, filters }] = queryKey;

  const { type, createdAt, search } = filters;

  const params = {
    page,
    limit,
    createdAt,
    type,
    search,
  };

  const { data } = await httpClient.get('/get-event-news', { params });
  return data;
};

export const useFetchEventNews = ({ page, limit, draft = false, filters }) => {
  return useQuery({
    queryKey: ['event-news', { page, limit, draft, filters }],
    queryFn: fetchEventNews,
    placeholderData: (previous) => previous,
    staleTime: 1000 * 60 * 2,
  });
};


const fetchSingleEventNews = async (news_id) => {
  const { data } = await httpClient.get(`/get-single-event-news/${news_id}`);
  return data;
};

export const useFetchSingleEventNews = (news_id) => {
  return useQuery({
    queryKey: ['single-event-news', news_id],
    queryFn: () => fetchSingleEventNews(news_id),
    keepPreviousData: false,
    staleTime: 0,
  });
};


const fetchGalleryNews = async ({ queryKey }) => {
  const [_key, { page, limit, draft, filters }] = queryKey;

  const { news_section_type, district, state, location, createdAt, search } = filters;

  const params = {
    page,
    limit,
    draft,
    news_section_type,
    district,
    state,
    location,
    createdAt,
    search,
  };

  const { data } = await httpClient.get('/gallery-news', { params });
  return data;
};

export const useFetchGalleryNews = ({ page, limit, draft = false, filters }) => {
  return useQuery({
    queryKey: ['gallery-news', { page, limit, draft, filters }],
    queryFn: fetchGalleryNews,
    placeholderData: (previous) => previous,
    staleTime: 1000 * 60 * 2,
  });
};


/** People who wrote news — for the "Created by" filter (needs news.view.all). */
export const useNewsAuthors = (enabled = true) =>
  useQuery({
    queryKey: ['news-authors'],
    queryFn: async () => (await httpClient.get('/news-authors')).data.authors,
    enabled,
    staleTime: 1000 * 60 * 5,
  });

/** One story with its full body (preview from the list). */
export const fetchSingleNews = async (news_id) => (await httpClient.get('/get-single-news', { params: { news_id } })).data.news;

/** The story featured at the top of the site right now (null when none) — needs news.feature. */
export const useFeaturedCurrent = (enabled = true) =>
  useQuery({
    queryKey: ['featured-current'],
    queryFn: async () => (await httpClient.get('/featured-news')).data.current,
    enabled,
    staleTime: 15_000,
  });

/** Search published stories to link under another story (needs only the right to write news). */
export const useNewsLinkSearch = (q, exclude, enabled = true) =>
  useQuery({
    queryKey: ['news-link-search', q, exclude],
    queryFn: async () => (await httpClient.get('/news-link-search', { params: { q, exclude } })).data.news,
    enabled: enabled && q.trim().length >= 2,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
