import { useState } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import httpClient from "../../api/httpClient";
import { errMsg } from "../../lib/api";
import { cn } from "../../lib/cn";
import { Badge } from "../../components/ui";

/** Banner ads only. Live = switched on AND not expired. The switch shows/hides the ad on the website. */
export default function AdLiveToggle({ ad, canManage = true, refetch, showBadge = true }) {
    const qc = useQueryClient();
    const [busy, setBusy] = useState(false);
    const on = ad.isActive !== false;
    const live = on && !ad.isExpired;

    const toggle = async () => {
        setBusy(true);
        try {
            const { data } = await httpClient.patch(`/ads/toggle/${ad._id}`);
            toast.success(data.message);
            qc.invalidateQueries({ queryKey: ["ads"] });
            refetch?.();
        } catch (e) {
            toast.error(errMsg(e, "Could not change the banner status"));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {showBadge && (
                <Badge tone={live ? "success" : "neutral"} size="sm">
                    {ad.isExpired ? "Expired" : live ? "Live on website" : "Hidden"}
                </Badge>
            )}

            {canManage && (
                <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={on ? "Hide banner from website" : "Show banner on website"}
                    title={on ? "Hide from website" : "Show on website"}
                    disabled={busy || ad.isExpired}
                    onClick={toggle}
                    className={cn(
                        "relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50",
                        on ? "bg-success" : "bg-surface-3"
                    )}
                >
                    <span
                        className={cn(
                            "absolute top-0.5 size-4 rounded-full bg-white shadow transition-all",
                            on ? "left-[18px]" : "left-0.5"
                        )}
                    />
                </button>
            )}
        </div>
    );
}