import Image from "next/image";
import { getAds } from "@/lib/data";

const HeroAds = async () => {
    const { banner } = await getAds();
    const ad = banner[0];
    if (!ad) return null;

    const img = (
        <Image
            src={ad.image}
            alt="Advertisement"
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-contain"
            priority
            unoptimized
        />
    );

    return (
        <div className="bg-[#f2f2f2] pb-2">
            <div className="page-container">
                <p className="pt-1 pb-1 text-center text-xs text-black/50">विज्ञापन</p>
                <div className="relative mx-auto h-28 w-full sm:h-32">
                    {ad.href ? (
                        <a
                            href={ad.href}
                            target="_blank"
                            rel="sponsored noopener noreferrer"
                            className="absolute inset-0 block"
                            aria-label="Advertisement"
                        >
                            {img}
                        </a>
                    ) : (
                        img
                    )}
                </div>
            </div>
        </div>
    );
};

export default HeroAds;