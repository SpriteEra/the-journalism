import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "../ui";
import RowActions from "./RowActions";

/** Mobile card for an event row. `actions` and `share` are passed straight to RowActions. */
export default function EventCard({ event, status, actions, share, onClick }) {
    return (
        <div
            onClick={onClick}
            className="flex gap-3 rounded-xl border border-line bg-surface p-3 shadow-sm active:bg-surface-2"
        >
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-3">
                {event.banner && <img src={event.banner} alt="" loading="lazy" className="size-full object-cover" />}
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5">
                <div className="flex items-start justify-between gap-2">
                    <p className="hindi-font line-clamp-2 text-sm font-semibold text-fg">{event.title}</p>
                    <div className="-mr-1 -mt-1 shrink-0">
                        <RowActions row={event} actions={actions} share={share} />
                    </div>
                </div>

                <div className="space-y-0.5 text-xs text-fg-subtle">
                    {event.startDate && (
                        <p className="flex items-center gap-1.5"><CalendarDays className="size-3.5 shrink-0" />{new Date(event.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                    )}
                    {event.location && <p className="flex items-center gap-1.5 truncate"><MapPin className="size-3.5 shrink-0" /><span className="truncate">{event.location}</span></p>}
                </div>

                {status && <div><Badge size="sm" tone={status.tone}>{status.label}</Badge></div>}
            </div>
        </div>
    );
}