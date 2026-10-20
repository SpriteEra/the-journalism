import httpClient from '../api/httpClient'
import { useMutation, useQuery } from "@tanstack/react-query";
const fetchTrash = async ({ queryKey }) => {
    const [_key, { page, limit }] = queryKey;


    const params = {
        page,
        limit,
    };

    const { data } = await httpClient.get('/trash', { params });
    return data;
};

export const useFetchTrash = ({ page, limit, }) => {
    return useQuery({
        queryKey: ['trash', { page, limit }],
        queryFn: fetchTrash,
        keepPreviousData: true,
        staleTime: 1000 * 60 * 2,
    });
};
