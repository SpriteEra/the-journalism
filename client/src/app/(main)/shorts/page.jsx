import Link from "next/link";
import Pagination from "@/components/common/Pagination";
import { Play } from "lucide-react";
import { getShorts } from "@/lib/data";
import { abs } from "@/lib/site";
import Image from "next/image";

const LIMIT = 24;
const pageOf = (sp) => Math.max(parseInt(sp?.page, 10) || 1, 1);

export async function generateMetadata({ searchParams }) {
    const page = pageOf(await searchParams);
    return { title: page > 1 ? `शॉर्ट वीडियो — पेज ${page}` : "शॉर्ट वीडियो", description: "देश-दुनिया की ताज़ा खबरें, छोटे वीडियो में।", alternates: { canonical: abs("/shorts") }, ...(page > 1 ? { robots: { index: false, follow: true } } : {}) };
}

export default async function ShortsPage({ searchParams }) {
    const page = pageOf(await searchParams);
    const { items, hasMore } = await getShorts({ page, limit: LIMIT });
    return (
        <div className="page-container mt-8 lg:mt-14">
            <h1 className="mb-5 font-khand text-3xl font-semibold text-black">शॉर्ट वीडियो</h1>
            {items.length === 0 ? (
                <p className="rounded border border-dashed border-black/15 p-10 text-center text-lg text-black/60">अभी कोई शॉर्ट वीडियो उपलब्ध नहीं है।</p>
            ) : (
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {items.map((s, i) => (
                        <li key={s.id}>
                            <Link href={s.href} className="group block">
                                <div className="relative aspect-[9/16] w-full overflow-hidden bg-gray-200">
                                    <Image src={s.image} alt={s.title} fill priority={i < 6} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 170px" className="object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
                                    <span aria-hidden className="absolute left-1/2 top-1/2 flex h-6 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-[#FF3D00] lg:h-7 lg:w-10"><Play className="size-3 fill-white text-white lg:size-4" /></span>
                                </div>
                                <h2 className="mt-2 line-clamp-2 font-khand text-lg font-semibold leading-snug text-black group-hover:text-primary">{s.title}</h2>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
            <Pagination basePath="/shorts" page={page} hasMore={hasMore} />
        </div>
    );
}
