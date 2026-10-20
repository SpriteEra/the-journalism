import httpClient from '../api/httpClient'
import { useMutation, useQuery } from "@tanstack/react-query";
const fetchReporters = async ({ queryKey }) => {
    const [_key, { page, limit, search, role }] = queryKey;


    const params = {
        page,
        limit,
        search,
        role
    };

    const { data } = await httpClient.get('/reporters', { params });
    return data;
};

export const useFetchReporters = ({ page, limit, role, search }) => {
    return useQuery({
        queryKey: ['reporter', { page, limit, role, search }],
        queryFn: fetchReporters,
        keepPreviousData: true,
        staleTime: 1000 * 60 * 2,
    });
};



const fetchTopTrendingNews = async ({ queryKey }) => {
    const { data } = await httpClient.get('/trending-news');
    return data;
};

export const useFetchTopTrendingNews = () => {
    return useQuery({
        queryKey: ['trending'],
        queryFn: fetchTopTrendingNews,
        keepPreviousData: true,
        staleTime: 1000 * 60 * 2,
    });
};


