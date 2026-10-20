import { cache } from "react";

export const getLatestNews = cache(async () => {
    const res = await fetch(
        `${process.env.SERVER_API_URL}/news/latest`,
        {
            next: { revalidate: 60 },
        }
    );

    if (!res.ok) {
        throw new Error("Failed to fetch latest news");
    }

    return res.json();
});