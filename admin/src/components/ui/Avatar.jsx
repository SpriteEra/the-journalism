import { useState } from "react";
import { cn } from "../../lib/cn";

const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
const SIZES = { xs: "size-6 text-[10px]", sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg", xl: "size-20 text-2xl" };

export default function Avatar({ src, name, size = "md", className }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft font-semibold text-primary", SIZES[size], className)}>
      {src && !broken ? <img src={src} alt={name || ""} onError={() => setBroken(true)} className="size-full object-cover" /> : initials(name)}
    </span>
  );
}
