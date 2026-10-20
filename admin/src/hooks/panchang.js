import httpClient from '../api/httpClient'
import { useMutation, useQuery } from "@tanstack/react-query";

const fetchPanchang = async () => {
    const { data } = await httpClient.get('/panchang');
    return data;
};

export const useFetchPanchang = () => {
    return useQuery({
        queryKey: ['panchang'],
        queryFn: fetchPanchang,
        keepPreviousData: true,
        staleTime: 1000 * 60 * 2,
    });
};