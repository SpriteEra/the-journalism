import { cn } from "../../lib/cn";
import { Avatar, Card } from "../ui";

/**
 * Cover + avatar + identity, used by "My profile" and a reporter's profile.
 * Layout rule that fixes the old overlap: the cover is its own block; the body is `relative z-10` so the avatar that is pulled up over the
 * cover is painted ABOVE it, and the name / details always start below the cover.
 */
export default function ProfileHeader({ name, src, badges, subtitle, about, meta, actions, className, children }) {
  return (
    <Card padded={false} className={cn("overflow-hidden", className)}>
      <div className="relative h-28 overflow-hidden bg-linear-to-br from-surface-3 via-surface-2 to-surface sm:h-36">
        {actions && <div className="absolute top-2 right-2 z-100 flex flex-wrap items-center justify-end gap-2 pt-3 z-10">{actions}</div>}
        <span aria-hidden className="absolute -right-10 -top-16 size-64 rounded-full bg-accent/25 blur-3xl" />
        <span aria-hidden className="absolute -bottom-12 left-1/4 size-48 rounded-full bg-info/20 blur-3xl" />
        {children}
      </div>
      <div className="relative z-10 px-4 pb-5 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <Avatar name={name} src={src} size="xl" className="-mt-12 size-24 shrink-0 text-3xl ring-4 ring-surface sm:-mt-14 sm:size-28" />
        </div>
        <div className="mt-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="hindi-font truncate text-xl font-semibold text-fg sm:text-2xl">{name || "—"}</h2>
            {badges}
          </div>
          {subtitle && <p className="hindi-font mt-0.5 text-sm font-medium text-fg-muted">{subtitle}</p>}
          {about && <p className="hindi-font mt-2 max-w-3xl text-sm leading-relaxed text-fg-subtle">{about}</p>}
          {meta?.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-fg-subtle">{meta}</div>}
        </div>
      </div>
    </Card>
  );
}
