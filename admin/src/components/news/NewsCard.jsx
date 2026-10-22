import { Link } from "react-router-dom";
import { Clock, Eye, Languages, MapPin, MoreVertical, Pencil, ScanEye, Share2, Trash2, History, Link2, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/cn";
import { fmtDate } from "../../lib/api";
import { handleImageError } from "../../utils/imageError";
import { Avatar, Badge, Button, IconButton, Menu, MenuItem, MenuSeparator } from "../ui";

export const statusOf = (n, draft) => (draft ? { tone: "neutral", label: "Draft" } : n.need_approval ? { tone: "warning", label: "Needs approval" } : n.isPublished === false ? { tone: "neutral", label: "Unpublished" } : { tone: "success", label: "Published" });

function ShareMenu({ item }) {
  const { t } = useTranslation();
  const url = `${import.meta.env.VITE_CLIENT_URL || ""}/news/${item.news_id}`;
  const kw = [...(item.keywords?.en || []), ...(item.keywords?.hi || [])].slice(0, 3).map((k) => `#${k.replace(/\s+/g, "")}`).join(" ");
  return (
    <Menu trigger={<IconButton label={t("Share")} size="icon-sm"><Share2 className="size-4" /></IconButton>} width="w-48">
      <MenuItem icon={MessageCircle} as="a" href={`https://wa.me/?text=${encodeURIComponent(`*${item.title}*\n${url}\n${kw}`)}`} target="_blank" rel="noreferrer">WhatsApp</MenuItem>
      <MenuItem icon={Link2} onClick={() => navigator.clipboard?.writeText(url).then(() => toast.success("Link copied"))}>Copy link</MenuItem>
    </Menu>
  );
}

/**
 * One story.
 *  layout="list": a compact row. The picture is flush with the card edges and as tall as the card, and the actions sit in the
 *                 right-hand column — so the card is only as tall as its text (about the height of the picture), with no footer row.
 *  layout="grid": a card with a big banner. Actions never hide behind hover (touch friendly).
 */
export default function NewsCard({ item: n, layout = "grid", draft, needApproval, canEdit, canDelete, onEdit, onPreview, onHistory, onDelete }) {
  const { t } = useTranslation();
  const st = statusOf(n, draft);
  const authorName = n.author?.fullName || n.author?.username;
  const kwCount = (n.keywords?.hi?.length || 0) + (n.keywords?.en?.length || 0);
  const grid = layout === "grid";
  const editLabel = needApproval ? t("Review") : t("Edit");

  const badges = (
    <div className="flex flex-wrap gap-1.5">
      {(n.category || []).slice(0, 2).map((c) => <Badge key={c.slug} tone="accent" size="sm">{c.name}</Badge>)}
      {(n.tags || []).slice(0, 2).map((x) => <Badge key={x.slug} tone="primary" size="sm">{x.title}</Badge>)}
      {/* {[...(n.state || []), ...(n.district || [])].slice(0, 1).map((p) => <Badge key={p.slug} tone="info" size="sm"><MapPin className="size-3" />{p.displayName || p.state || p.district}</Badge>)} */}
      {/* {kwCount > 0 && <Badge size="sm" tone="outline" title="Keywords"><Languages className="size-3" />{kwCount}</Badge>} */}
    </div>
  );

  const meta = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-fg-subtle">
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <Avatar name={authorName} src={n.author?.profile} size="xs" />
        <span className="truncate font-medium text-fg-muted">{authorName}</span>
        {n.approved_by && <span className="text-fg-faint">· {t("approved")}</span>}
      </span>
      <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{fmtDate(n.createdAt, true)}</span>
      {!draft && <span className="inline-flex items-center gap-1" title="Reads"><Eye className="size-3.5" />{(n.activity?.total_reads || 0).toLocaleString("en-IN")}</span>}
    </div>
  );

  const menu = (n.update_stack || canDelete) && (
    <Menu trigger={<IconButton label="More" size="icon-sm"><MoreVertical className="size-4" /></IconButton>} width="w-44">
      {n.update_stack && <MenuItem icon={History} onClick={onHistory}>{t("History")}</MenuItem>}
      {canDelete && <><MenuSeparator /><MenuItem icon={Trash2} tone="danger" onClick={onDelete}>{t("Delete")}</MenuItem></>}
    </Menu>
  );

  const title = <Link to={`/dashboard/news/${n.news_id}`} className="hindi-font line-clamp-2 text-lg font-semibold lg:leading-snug text-fg hover:text-primary lg:text-lg max-sm:pt-0.5">{n.title}</Link>;
  const statusBadge = <Badge tone={st.tone} dot size="sm" className="absolute left-2.5 top-2.5 shadow-sm ring-1 ring-black/5">{t(st.label)}</Badge>;

  // ───────────── list: compact row ─────────────
  // ───────────── list: compact row ─────────────
  if (!grid) {
    return (
      <article className="surface-card group flex flex-col gap-3 overflow-hidden p-1 sm:p-2 transition-shadow hover:shadow-pop sm:flex-row h-fit">
        {/* small padding around the picture; it is stretched to the card's height, so the card is never taller than its content */}
        <Link to={`/dashboard/news/${n.news_id}`} aria-label={n.title} className="relative block aspect-video w-full shrink-0 overflow-hidden rounded-md bg-surface-3 sm:aspect-auto object-top sm:w-52 sm:self-stretch">
          <img src={`${n.banner}?q=75&w=480`} alt="" loading="lazy" onError={handleImageError} className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
          {statusBadge}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-2 px-1 py-1.5 sm:py-2">
          {title}
          {badges}
          {meta}
        </div>

        {/* tools: one column on the right from sm up (icon buttons, tooltips on hover), a row at the bottom on phones */}
        <div className="flex items-center gap-1.5 border-t border-line px-1 pt-2 sm:flex-col sm:justify-center sm:gap-1 sm:border-l sm:border-t-0 sm:px-2 sm:pt-0">
          {menu}
          {canEdit && (
            <>
              <Button size="sm" variant={needApproval ? "primary" : "soft"} leftIcon={Pencil} onClick={onEdit} className="flex-1 sm:hidden">{editLabel}</Button>
              <IconButton
                label={editLabel}
                title={editLabel}
                size="icon-sm"
                variant={needApproval ? "primary" : "soft"} onClick={onEdit} className="hidden sm:inline-grid"
              >
                <Pencil className="size-4" />
              </IconButton>
            </>
          )}
          {!draft && <ShareMenu item={n} />}
          <IconButton
            label={t("Preview")}
            title={t("Preview")}
            size="icon-sm"
            onClick={onPreview}
          >
            <ScanEye className="size-4" />
          </IconButton>
        </div>
      </article>
    );
  }

  // ───────────── grid: banner card ─────────────
  return (
    <article className="surface-card group flex flex-col overflow-hidden transition-shadow hover:shadow-pop h-fit">
      <Link to={`/dashboard/news/${n.news_id}`} className="relative block aspect-video w-full shrink-0 overflow-hidden bg-surface-3">
        <img src={`${n.banner}?q=75&w=480`} alt="" loading="lazy" onError={handleImageError} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {statusBadge}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:gap-2 p-2 sm:p-4">
        {title}
        {/* {badges} */}
        <div className="mt-auto sm:pt-1">{meta}</div>
        <div className="mt-1 sm:mt-2 flex items-center gap-1 sm:gap-1.5 border-t border-line pt-1.5 sm:pt-3">
          {canEdit && <Button className="max-sm:rounded" size="sm" variant={needApproval ? "primary" : "soft"} leftIcon={Pencil} onClick={onEdit}>{editLabel}</Button>}
          <span className="ml-auto flex items-center">
            {!draft && <ShareMenu item={n} />}
            {menu}
          </span>
          <Button size="sm" variant="ghost" leftIcon={ScanEye} onClick={onPreview}>{t("Preview")}</Button>
        </div>
      </div>
    </article>
  );
}