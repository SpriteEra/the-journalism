import { Crown } from "lucide-react";
import { cn } from "../../lib/cn";

/** "Premium · Ora AI" mark for features that are part of the Spriteera premium package. */
export default function PremiumBadge({ children = "Premium", cached, className }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-linear-to-r from-gold-300 to-gold-500 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gold-ink shadow-sm", className)}>
      <Crown className="size-3" />{children}{cached && <span className="ml-1 rounded-full bg-black/10 px-1.5 normal-case tracking-normal">cached</span>}
    </span>
  );
}
