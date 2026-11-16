import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const parts = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        month: "short",
        day: "2-digit",
        year: "numeric",
    }).formatToParts(d);
    const get = (t) => parts.find((p) => p.type === t)?.value;
    return `${get("hour")}:${get("minute")} IST, ${get("month")} ${get("day")}, ${get("year")}`;
};


export const cn = (...inputs) => twMerge(clsx(inputs));

export const feature_heading_css = "line-clamp-3 font-khand text-[25px] font-semibold leading-8 tracking-[0.01em] text-black transition-colors group-hover:text-primary lg:text-[30px] lg:leading-10"

export const normal_card_heading_css = "mt-2 line-clamp-3 font-khand text-lg lg:text-xl font-semibold leading-6 text-black transition-colors group-hover:text-primary tracking-[0.01em] lg:leading-normal "