import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { getAllShorts, posterOf } from "@/lib/shorts";

export const revalidate = 300;

export const metadata = {
    title: "शॉर्ट वीडियो",
    description: "देश-दुनिया की ताज़ा खबरें, छोटे वीडियो में।",
    alternates: { canonical: "/shorts" },
};

const Page = async () => {
    const all = await getAllShorts();

    return (
        <main className="page-container mt-8 lg:mt-14">
            <h1 className="mb-5 font-khand text-3xl font-semibold text-black">शॉर्ट वीडियो</h1>

            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {all.map((s, i) => (
                    <li key={s.id}>
                        <Link href={`/shorts/${s.id}`} className="group block">
                            <div className="relative aspect-[9/16] w-full overflow-hidden bg-gray-200">
                                <Image
                                    src={posterOf(s)}
                                    alt={s.title}
                                    fill
                                    priority={i < 6}
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 170px"
                                    className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                                />
                                <span aria-hidden className="absolute left-1/2 top-1/2 flex h-6 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-[#FF3D00] lg:h-7 lg:w-10">
                                    <Play className="size-3 fill-white text-white lg:size-4" />
                                </span>
                            </div>
                            <h2 className="mt-2 line-clamp-2 font-khand text-lg font-semibold leading-snug text-black group-hover:text-primary">
                                {s.title}
                            </h2>
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    );
};

export default Page;