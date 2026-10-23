import toast from "react-hot-toast";

/** Native share sheet when available, otherwise copy the link. */
export async function shareLink({ title, url, text }) {
    try {
        if (navigator.share) await navigator.share({ title, text, url });
        else {
            await navigator.clipboard.writeText(url);
            toast.success("Link copied");
        }
    } catch (e) {
        if (e?.name !== "AbortError") toast.error("Could not share the link");
    }
}

/** Public site URL for a path, e.g. siteUrl("/shorts/my-slug") */
export const siteUrl = (path = "") =>
    `${(import.meta.env.VITE_SITE_URL || import.meta.env.VITE_CLIENT_URL || window.location.origin).replace(/\/$/, "")}${path}`;

/** Links that open each platform's share page */
export const sharePlatforms = (url, title = "") => {
    const u = encodeURIComponent(url);
    const t = encodeURIComponent(title);
    return [
        { key: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
        { key: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
        { key: "x", label: "X (Twitter)", href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
        { key: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}` },
        { key: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    ];
};

export async function copyLink(url) {
    try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
    } catch {
        toast.error("Could not copy the link");
    }
}