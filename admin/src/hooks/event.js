import httpClient from '../api/httpClient'
import { useMutation, useQuery } from "@tanstack/react-query";
const fetchEventCategory = async () => {

    const { data } = await httpClient.get('/event-category');
    return data;
};

export const useFetchEventCategory = () => {
    return useQuery({
        queryKey: ['event-category'],
        queryFn: fetchEventCategory,
        keepPreviousData: true,
        staleTime: 1000 * 60 * 2,
    });
};

const fetchActiveEvent = async () => {

    const { data } = await httpClient.get('/active-event');
    return data;
};

export const useFetchActiveEvent = () => {
    return useQuery({
        queryKey: ['active-event'],
        queryFn: fetchActiveEvent,
        keepPreviousData: true,
        staleTime: 1000 * 60 * 2,
    });
};



const fetchEventNewsByAdmin = async ({ queryKey }) => {
    const [_key, { page, limit, draft, filters, category_id }] = queryKey;

    const { type, createdAt, search, } = filters;

    const params = {
        page,
        limit,
        createdAt,
        type,
        search,
    };

    const { data } = await httpClient.get(`/event-news/${category_id}`, { params });
    return data;
};

export const useFetchEventNewsByAdmin = ({ page, limit, draft = false, filters, category_id }) => {
    return useQuery({
        queryKey: ['event-news-admin', { page, limit, draft, filters, category_id }],
        queryFn: fetchEventNewsByAdmin,
        keepPreviousData: true,
        staleTime: 1000 * 60 * 2,
    });
};

const fetchEventCategories = async () => {
    const { data } = await httpClient.get(`/event-category`,);
    return data;
};

export const useFetchEventCategories = () => {
    return useQuery({
        queryKey: ['event-category'],
        queryFn: fetchEventCategories,
        keepPreviousData: true,
        staleTime: 1000 * 60 * 2,
    });
};
