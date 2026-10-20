import httpClient from '../api/httpClient'
import { useQuery } from "@tanstack/react-query";



const fetchNewsReadsMonthly = async (month) => {
    const year = new Date().getFullYear();
    const { data } = await httpClient.get(`/new-view-analytics-monthly?month=${month}&year=${year}`);
    return data;
};
export const useFetchNewsReadsMonthly = (month) => {
    return useQuery({
        queryKey: ['news-reads-monthly', month],
        queryFn: () => fetchNewsReadsMonthly(month),
        keepPreviousData: true,
        staleTime: 1000 * 60 * 2,
    });
};


const fetchNewsReadsYearly = async (year) => {
    // const year = new Date().getFullYear();
    const { data } = await httpClient.get(`/news-view-analytics-yearly?year=${year}`);
    return data;
};
export const useFetchNewsReadsYearly = (year) => {
    return useQuery({
        queryKey: ['news-reads-yearly', year],
        queryFn: () => fetchNewsReadsYearly(year),
        keepPreviousData: true,
        staleTime: 1000 * 60 * 2,
    });
};


