"use client";

import { useState } from "react";
import { Forward } from "lucide-react";
import Image from "next/image";

const GoogleG = ({ className = "size-4" }) => (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
        <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
);

export const FollowOnGoogle = ({
    href = process.env.NEXT_PUBLIC_GOOGLE_SOURCE_URL,
    label = "पर हमें चुनें",
    className = "",
}) => {
    if (!href) return null;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 rounded-full border border-black px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-black/5 lg:px-3.5 lg:text-sm ${className}`}
        >
            <GoogleG />
            <span>{label}</span>
        </a>
    );
};



const ShareActions = ({ title = "", googleSourceHref }) => {
    const [copied, setCopied] = useState(false);

    const getUrl = () => (typeof window !== "undefined" ? window.location.href : "");

    const handleShare = async () => {
        const url = getUrl();
        try {
            if (navigator.share) {
                await navigator.share({ title, url });
            } else {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
            }
        } catch {
            /* user cancelled the share sheet */
        }
    };

    const handleWhatsApp = () => {
        const text = encodeURIComponent(`${title} ${getUrl()}`);
        window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="flex items-center gap-2 lg:gap-3 justify-end w-full">
            <div className="max-lg:hidden">
                {
                    googleSourceHref &&
                    <FollowOnGoogle href={googleSourceHref} />
                }

            </div>

            <button
                type="button"
                onClick={handleWhatsApp}
                aria-label="WhatsApp पर शेयर करें"
                className="flex items-center justify-center transition-transform hover:scale-105"
            >
                <Image
                    className="object-contain"
                    width={32}
                    height={32}
                    alt="Follow On Whatsapp"
                    src={'/whatsapp.png'}
                />
            </button>

            <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 rounded-full border border-black px-3 lg:px-3.5 py-1.5 text-xs font-medium text-black transition-colors hover:bg-black/5 lg:text-sm"
            >
                <span>{copied ? "Copied!" : "Share"}</span>
                <Forward className="size-3.5" aria-hidden />
            </button>
        </div>
    );
};

export default ShareActions;