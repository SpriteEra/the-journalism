import Image from "@/components/common/Img";
import { getAds } from "@/lib/data";

/** Square ads in the sidebar (up to 2). Renders nothing when there are none. */
const SideAds = async ({ max = 2 }) => {
    const { side } = await getAds();
    if (!side.length) return null;
    return (
        <div className="space-y-4">
            {side.slice(0, max).map((ad, i) => {
                const pic = (
                    <div className="relative aspect-square w-full max-w-lg overflow-hidden rounded-sm bg-[#f2f2f2]">
                        <Image src={ad.image} alt="विज्ञापन" fill sizes="(max-width: 1024px) 100vw, 320px" className="object-cover" />
                        <span className="absolute left-1 top-1 rounded bg-black/50 px-1 text-[10px] text-white">विज्ञापन</span>
                    </div>
                );
                return ad.href ? <a key={i} href={ad.href} target="_blank" rel="sponsored noopener noreferrer" className="block">{pic}</a> : <div key={i}>{pic}</div>;
            })}
        </div>
    );
};

export default SideAds;
