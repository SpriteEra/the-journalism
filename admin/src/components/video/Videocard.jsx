import { useId, useState } from "react";
import { Eye, Play } from "lucide-react";
import { fmtDuration } from "../../lib/api";
import { ChevronsDown } from "lucide-react";

const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

export function VideoThumb({ src, portrait = false, duration }) {
    return (
        <div className={`relative h-18 sm:h-20 shrink-0 overflow-hidden rounded bg-surface-3 ${portrait ? "w-20 sm:w-32" : "w-25"}`}>
            {src ? (
                portrait ? (
                    <>
                        <img src={src} alt="" aria-hidden loading="lazy" className="absolute inset-0 size-full scale-125 object-cover blur-md" />
                        <span className="absolute inset-0 bg-white/40" />
                        <img src={src} alt="" loading="lazy" className="absolute left-1/2 top-0 aspect-[9/16] h-full -translate-x-1/2 object-cover shadow-md" />
                    </>
                ) : (
                    <img src={src} alt="" loading="lazy" className="size-full object-cover" />
                )
            ) : (
                <Play className="absolute inset-0 m-auto size-5 text-fg-faint" />
            )}
            {duration > 0 && (
                <span className="absolute bottom-1 right-1 rounded bg-ink/75 px-1 text-[10px] font-medium text-paper">{fmtDuration(duration)}</span>
            )}
        </div>
    );
}

export default function VideoCard({ thumbnail, portrait, duration, title, titleClassName = "", date, views, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    const id = useId();
    const toggle = () => setOpen((o) => !o);

    return (
        <div className="relative overflow-hidden rounded-md border border-line bg-surface">
            <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-controls={id}
                className="flex w-full  gap-3 p-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
                <VideoThumb src={thumbnail} portrait={portrait} duration={duration} />
                <div className="min-w-0 flex-1 py-0.5">
                    <p className={`line-clamp-2 font-medium text-fg ${titleClassName}`}>{title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-fg-subtle">
                        {date && <span>{date}</span>}
                        {views != null && (
                            <span className="inline-flex items-center gap-1 tabular-nums">
                                <Eye className="size-3.5" aria-hidden /> {compact.format(views)}
                            </span>
                        )}
                    </p>
                    <button
                        type="button"
                        onClick={toggle}
                        aria-expanded={open}
                        aria-controls={id}
                        className="w-full pt-0.5 text-start text-[10px] italic text-red-500 transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 flex items-center gap-1"
                    >
                        {open ? "Hide details" : "View details"}
                        <ChevronsDown className={`size-3 transition-transform duration-200  ${open ? "rotate-180" : ""}`} aria-hidden />
                    </button>
                </div>
            </button>

            <div id={id} className={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden" inert={open ? undefined : ""}>
                    <div className="space-y-3 border-t border-line p-3">{children}</div>
                </div>
            </div>


        </div>
    );
}