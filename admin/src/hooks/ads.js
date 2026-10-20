import httpClient from '../api/httpClient'
import { useMutation, useQuery } from "@tanstack/react-query";
const fetchAds = async () => {

    const { data } = await httpClient.get('/get-admin-advertisement');
    return data;
};

export const useFetchAds = () => {
    return useQuery({
        queryKey: ['ads'],
        queryFn: fetchAds,
        keepPreviousData: true,
        staleTime: 1000 * 60 * 2,
    });
};

const fetchSingleAds = async (id) => {
    const { data } = await httpClient.get(`/get-advertisement/${id}`);
    return data;
};

export const useFetchSingleAds = (id) => {
    return useQuery({
        queryKey: ['ads', id],
        queryFn: () => fetchSingleAds(id),
        keepPreviousData: true,
        staleTime: 1000 * 60 * 2,
    });
};


// const fetchTitleAds = async (page, limit, search) => {

//     const { data } = await httpClient.get(`/get-admin-title-ads`);
//     return data;
// };

const fetchTitleAds = async ({ queryKey }) => {
    const [_key, { page, limit, search }] = queryKey;


    const params = {
        page,
        limit,
        search,
    };

    const { data } = await httpClient.get('/get-admin-title-ads', { params });
    return data;
};
export const useFetchTitleAds = ({ page, limit, search }) => {
    return useQuery({
        queryKey: ['title-ads', { page, limit, search }],
        queryFn: fetchTitleAds,
        keepPreviousData: true,
        staleTime: 1000 * 60 * 2,
    });
};
