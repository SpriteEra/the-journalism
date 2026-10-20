"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X, Flame, Clock, Trash2, TrendingUp, ArrowRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Config – edit here                                                 */
/* ------------------------------------------------------------------ */
const POPULAR = [
    "उत्तर प्रदेश",
    "राजनीति",
    "दिल्ली",
    "बिहार चुनाव",
    "सुप्रीम कोर्ट",
    "लोकसभा चुनाव",
    "महंगाई",
    "अयोध्या",
];

const SEARCH_API = "/api/search?q="; // query is appended, URL-encoded
const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;
const MAX_RESULTS = 8;

const STORAGE_KEY = "tj_recent_searches";
const MAX_RECENT = 6;

/* Map whatever your API returns to { id, title, href, image, ts }.
   Accepts an array, or an object with results / data / items / articles. */
const normalize = (json) => {
    const list = Array.isArray(json)
        ? json
        : json?.results ?? json?.data ?? json?.items ?? json?.articles ?? [];

    return list.slice(0, MAX_RESULTS).map((r, i) => {
        const date = r.publishedAt ?? r.published_at ?? r.date ?? r.created_at;
        const ts = date ? new Date(date).getTime() : null;
        return {
            id: r.id ?? r.slug ?? i,
            title: r.title ?? r.headline ?? "",
            href: r.href ?? r.url ?? (r.slug ? `/${r.slug}` : "#"),
            image: r.image ?? r.thumbnail ?? r.featured_image ?? null,
            ts: Number.isFinite(ts) ? ts : null,
        };
    });
};

/* ------------------------------------------------------------------ */
/*  Recent searches helpers (localStorage, safe on any failure)        */
/* ------------------------------------------------------------------ */
const readRecent = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeRecent = (list) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
        /* storage full / blocked – ignore */
    }
};

/**
 * Save an entry to "ताजा खोजें". Call it from anywhere, e.g. when an article opens:
 *   addRecentSearch({ title, href, image })
 */
export const addRecentSearch = ({ title, href, image }) => {
    if (!title || !href) return;
    const next = [
        { title, href, image: image || null, ts: Date.now() },
        ...readRecent().filter((r) => r.href !== href),
    ].slice(0, MAX_RECENT);
    writeRecent(next);
};

/* "2 घंटे पहले" */
const timeAgo = (ts) => {
    if (!ts) return "";
    const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return "अभी";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} मिनट पहले`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} घंटे पहले`;
    return `${Math.floor(h / 24)} दिन पहले`;
};

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */
const Thumb = ({ src }) => (
    <span className="relative flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-gray-100">
        {src ? (
            <Image src={src} alt="" fill sizes="56px" loading="lazy" className="object-cover" />
        ) : (
            <Search className="size-4 text-black/40" aria-hidden />
        )}
    </span>
);

const ItemRow = ({ item, onOpen }) => (
    <button
        type="button"
        onClick={() => onOpen(item)}
        className="group flex w-full items-center gap-3 text-left"
    >
        <Thumb src={item.image} />
        <span className="min-w-0 flex-1">
            <span className="line-clamp-2 font-khand text-base font-semibold leading-tight text-black transition-colors group-hover:text-primary sm:line-clamp-1">
                {item.title}
            </span>
            {item.ts && <span className="block text-xs text-black/50">{timeAgo(item.ts)}</span>}
        </span>
    </button>
);

const SkeletonRow = () => (
    <li className="flex items-center gap-3">
        <span className="h-10 w-14 shrink-0 animate-pulse rounded-sm bg-gray-200" />
        <span className="flex-1 space-y-1.5">
            <span className="block h-3.5 w-4/5 animate-pulse rounded bg-gray-200" />
            <span className="block h-3 w-1/4 animate-pulse rounded bg-gray-100" />
        </span>
    </li>
);

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const SearchModal = ({ onClose }) => {
    const router = useRouter();
    const inputRef = useRef(null);
    const cache = useRef(new Map());

    const [query, setQuery] = useState("");
    const [recent, setRecent] = useState([]);
    const [shown, setShown] = useState(false); // drives the open animation
    const [results, setResults] = useState([]);
    const [status, setStatus] = useState("idle"); // idle | loading | done | error

    const q = query.trim();
    const searching = q.length >= MIN_CHARS;

    // load recent + animate in + focus input
    useEffect(() => {
        setRecent(readRecent());
        const id = setTimeout(() => {
            setShown(true);
            inputRef.current?.focus();
        }, 20);
        return () => clearTimeout(id);
    }, []);

    // lock page scroll while open + Escape to close
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            document.removeEventListener("keydown", onKey);
        };
    }, [onClose]);

    // live search: debounced, cancellable, cached
    useEffect(() => {
        if (q.length < MIN_CHARS) {
            setResults([]);
            setStatus("idle");
            return;
        }

        setStatus("loading");
        const ctrl = new AbortController();

        const id = setTimeout(async () => {
            if (cache.current.has(q)) {
                setResults(cache.current.get(q));
                setStatus("done");
                return;
            }
            try {
                const res = await fetch(`${SEARCH_API}${encodeURIComponent(q)}`, {
                    signal: ctrl.signal,
                });
                if (!res.ok) throw new Error("bad response");
                const list = normalize(await res.json());
                cache.current.set(q, list);
                setResults(list);
                setStatus("done");
            } catch (err) {
                if (err.name !== "AbortError") setStatus("error");
            }
        }, DEBOUNCE_MS);

        return () => {
            clearTimeout(id);
            ctrl.abort();
        };
    }, [q]);

    const goSearch = (text) => {
        const value = text.trim();
        if (!value) return;
        addRecentSearch({ title: value, href: `/search?q=${encodeURIComponent(value)}` });
        onClose();
        router.push(`/search?q=${encodeURIComponent(value)}`);
    };

    const onSubmit = (e) => {
        e.preventDefault();
        goSearch(query);
    };

    const openItem = (item) => {
        addRecentSearch(item); // moves it to the top of recent
        onClose();
        router.push(item.href);
    };

    const clearAll = () => {
        writeRecent([]);
        setRecent([]);
    };

    const clearQuery = () => {
        setQuery("");
        inputRef.current?.focus();
    };

    return (
        <div
            className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto px-3 py-6 sm:py-16"
            role="dialog"
            aria-modal="true"
            aria-label="खबरें खोजें"
        >
            {/* backdrop */}
            <div
                onClick={onClose}
                className={`fixed inset-0 bg-black/60 transition-opacity duration-300 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"
                    }`}
            />

            {/* panel */}
            <div
                className={`relative w-full max-w-2xl rounded-lg bg-white p-4 shadow-2xl transition-all duration-300 motion-reduce:transition-none sm:p-6 ${shown ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
                    }`}
            >
                {/* header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-semibold leading-tight text-black sm:text-3xl">
                            खबरें खोजें
                        </h2>
                    </div>

                    <div className="flex items-start gap-3">
                        <p className="hidden pt-2 text-xs text-black/60 sm:block">
                            देश-दुनिया की हर खबर, एक जगह
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="बंद करें"
                            className="rounded p-1 text-black hover:text-primary"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                {/* search input */}
                <form
                    onSubmit={onSubmit}
                    role="search"
                    className="mt-5 flex items-center gap-2 rounded-full border border-black/15 bg-white p-0.5 pl-3 focus-within:border-primary"
                >
                    <Search className="size-5 shrink-0 text-black/70" aria-hidden />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="खबर, नेता, शहर या विषय खोजें..."
                        aria-label="खोजें"
                        autoComplete="off"
                        enterKeyHint="search"
                        className="min-w-0 flex-1 bg-transparent py-1 text-base text-black outline-none placeholder:text-black/45"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={clearQuery}
                            aria-label="मिटाएं"
                            className="shrink-0 rounded p-1 text-black/50 hover:text-primary"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                    <button
                        type="submit"
                        className="flex shrink-0 items-center gap-2 rounded-full bg-primary px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:px-5 sm:text-base"
                    >
                        <Search className="size-4" aria-hidden />
                        <span>खोजें</span>
                    </button>
                </form>

                {/* scrollable body: same height for results and the default view */}
                <div className="mt-5 h-[45vh] overflow-y-auto overscroll-contain pr-1 sm:max-h-[45vh]">
                    {searching ? (
                        /* ---------------- live results ---------------- */
                        <div aria-live="polite">
                            <h3 className="font-khand text-lg font-semibold text-black">
                                खोज परिणाम
                            </h3>

                            {status === "loading" && (
                                <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <SkeletonRow key={i} />
                                    ))}
                                </ul>
                            )}

                            {status === "error" && (
                                <p className="mt-3 text-sm text-black/60">
                                    कुछ गड़बड़ हुई। कृपया दोबारा कोशिश करें।
                                </p>
                            )}

                            {status === "done" && results.length === 0 && (
                                <p className="mt-3 text-sm text-black/60">
                                    “{q}” के लिए कोई परिणाम नहीं मिला। दूसरा शब्द आज़माएं।
                                </p>
                            )}

                            {status === "done" && results.length > 0 && (
                                <>
                                    <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                                        {results.map((item) => (
                                            <li key={item.id}>
                                                <ItemRow item={item} onOpen={openItem} />
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        type="button"
                                        onClick={() => goSearch(q)}
                                        className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-primary py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                                    >
                                        “{q}” के सभी परिणाम देखें
                                        <ArrowRight className="size-4" aria-hidden />
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* popular */}
                            <div>
                                <h3 className="flex items-center gap-2 font-khand text-lg font-semibold text-black">
                                    <Flame className="size-4.5 text-primary" aria-hidden />
                                    लोकप्रिय खोजें
                                </h3>

                                <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
                                    {POPULAR.map((tag) => (
                                        <li key={tag} className="shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => setQuery(tag)}
                                                className="flex items-center gap-1.5 rounded-full border border-black/15 bg-white px-3 py-1.5 text-[13px] text-black transition-colors hover:border-primary hover:text-primary"
                                            >
                                                <TrendingUp className="size-3.5 text-primary" aria-hidden />
                                                {tag}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* recent */}
                            {recent.length > 0 && (
                                <div className="mt-5 border-t border-black/10 pt-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="flex items-center gap-2 font-khand text-lg font-semibold text-black">
                                            <Clock className="size-4.5 text-primary" aria-hidden />
                                            ताजा खोजें
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={clearAll}
                                            className="flex items-center gap-1.5 text-xs text-black/70 hover:text-primary"
                                        >
                                            <Trash2 className="size-3.5" aria-hidden />
                                            सभी हटाएं
                                        </button>
                                    </div>

                                    <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                                        {recent.map((item) => (
                                            <li key={item.href}>
                                                <ItemRow item={item} onOpen={openItem} />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchModal;