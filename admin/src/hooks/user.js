import httpClient from '../api/httpClient'
import { useQuery } from "@tanstack/react-query";
const fetchProfile = async () => {

    const { data } = await httpClient.get('/profile');
    return data;
};

export const useFetchProfile = () => {
    return useQuery({
        queryKey: ['profile'],
        queryFn: fetchProfile,
        keepPreviousData: true,
        staleTime: 1000 * 60 * 2,
    });
};
const fetchNotification = async () => {
    const { data } = await httpClient.get('/notification-preferences');
    return data;
};

export const useFetchNotification = () => {
    return useQuery({
        queryKey: ['notification-preference'],
        queryFn: fetchNotification,
        keepPreviousData: true,
        staleTime: 1000 * 60 * 2,
    });
};
