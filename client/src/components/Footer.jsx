import Image from "next/image";
import Link from "next/link";

/**
 * Site footer (server component). Edit the arrays below to change links / socials.
 * Put your logo at /public/logo.png (or change LOGO).
 */

const SITE_NAME = "The Journalism";
const LOGO = "/logo.png";
const COMPANY = "T & J Media";

const SOCIALS = [
    {
        name: "Facebook",
        href: "https://www.facebook.com/",
        hover: "hover:bg-[#1877F2]",
        path: "M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z",
    },
    {
        name: "Instagram",
        href: "https://www.instagram.com/",
        hover: "hover:bg-gradient-to-tr hover:from-[#feda75] hover:via-[#d62976] hover:to-[#4f5bd5]",
        path: "M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 4 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.2-4.4-2.6-6.8-7-7C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.9 1.4 1.4 0 0 0 0-2.9z",
    },
    {
        name: "YouTube",
        href: "https://www.youtube.com/",
        hover: "hover:bg-[#FF0000]",
        path: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z",
    },
    {
        name: "X",
        href: "https://x.com/",
        hover: "hover:bg-white hover:text-black",
        path: "M18.2 2.3h3.3l-7.2 8.3 8.5 11.2h-6.7l-5.2-6.8-6 6.8H1.6l7.7-8.8L1.2 2.3H8l4.7 6.2 5.5-6.2zm-1.2 17.5h1.8L7 4.1H5.1l11.9 15.7z",
    },
];

const LINKS_PRIMARY = [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms-and-conditions" },
    { label: "Disclaimer Policy", href: "/disclaimer-policy" },
    { label: "Grievance Policy", href: "/grievance-policy" },
];

const LINKS_SECONDARY = [
    { label: "About Us", href: "/about-us" },
    { label: "Contact Us", href: "/contact-us" },
    { label: "Work with Us", href: "/work-with-us" },
    { label: "RSS", href: "/rss" },
];

const FooterLinks = ({ links }) => (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-3 text-center sm:flex sm:flex-wrap sm:justify-center sm:gap-x-0 sm:gap-y-2">
        {links.map((l, i) => (
            <li key={l.href} className="flex items-center justify-center">
                {i > 0 && <span aria-hidden className="mx-4 hidden h-3.5 w-px bg-white/25 sm:block" />}
                <Link
                    href={l.href}
                    className="text-[13px] text-white/75 transition-colors hover:text-white hover:underline hover:underline-offset-4 sm:text-sm"
                >
                    {l.label}
                </Link>
            </li>
        ))}
    </ul>
);

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="mt-12 bg-black text-white">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
                {/* brand + socials */}
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
                    <Link href="/" className="flex items-center gap-3 sm:gap-4 bg-white p-2 rounded-md" aria-label={`${SITE_NAME} home`}>
                        <Image
                            src={LOGO}
                            alt=""
                            width={300}
                            height={36}
                            className="h-8 w-fit object-contain sm:h-10"
                        />
                    </Link>

                    <div className="flex flex-col items-center gap-3 sm:items-end">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Connect With Us</p>
                        <ul className="flex items-center gap-3">
                            {SOCIALS.map((s) => (
                                <li key={s.name}>
                                    <a
                                        href={s.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={s.name}
                                        className={`flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition duration-200 hover:-translate-y-0.5 ${s.hover}`}
                                    >
                                        <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-current">
                                            <path d={s.path} />
                                        </svg>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* links */}
                <nav aria-label="Footer" className="mt-6 space-y-4 border-t border-white/15 pt-4">
                    <FooterLinks links={LINKS_PRIMARY} />
                    <FooterLinks links={LINKS_SECONDARY} />
                </nav>

                {/* copyright */}
                <p className="mt-5 border-t border-white/15 pt-4 text-center text-xs text-white/60 sm:text-[13px]">
                    Copyright © {year} {COMPANY}. All Rights Reserved.
                </p>
            </div>
        </footer>
    );
}