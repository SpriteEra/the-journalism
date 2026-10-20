import { useEffect, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CalendarPlus, GripVertical, Link2, Mail, Megaphone, Pencil, RefreshCw, Save, Trash2, User } from "lucide-react";
import httpClient from "../../api/httpClient";
import { errMsg } from "../../lib/api";
import { formatDate } from "../../utils/utils";
import { cn } from "../../lib/cn";
import AdsUploader from "./AdsUploader";
import Modal from "../../components/ui/Modal";
import { Badge, Button, Card, EmptyState, useConfirm } from "../../components/ui";

const DAY = 86400000;

/** Days left + how much of the ad's lifetime has been used (0–100). */
function lifetime(ad) {
  const start = new Date(ad.createdAt).getTime();
  const end = new Date(ad.expireDate).getTime();
  const now = Date.now();
  const daysLeft = Math.ceil((end - now) / DAY);
  const used = end > start ? Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100)) : 100;
  return { daysLeft, used };
}

/** Small label + value pair used in the details grid. */
function Meta({ icon: Icon, label, children }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-fg">{children}</dd>
    </div>
  );
}

/** One advertisement: picture, status, dates, who made it, and its actions (Edit · Extend / Renew · Delete). Dragging the handle re-orders. */
function AdRow({ ad, adType, index, onEdit, onExtend, onRenew, onDelete }) {
  const controls = useDragControls();
  const { daysLeft, used } = lifetime(ad);
  const expired = ad.isExpired || daysLeft <= 0;
  const soon = !expired && daysLeft <= 7;

  const timeLabel = expired
    ? "Expired"
    : daysLeft === 1
      ? "1 day left"
      : `${daysLeft} days left`;

  return (
    <Reorder.Item
      value={ad._id}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.015, boxShadow: "0 16px 40px rgba(0,0,0,.2)" }}
      className="list-none"
    >
      <Card padded={false} className="group overflow-hidden transition-shadow hover:shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-stretch">
          {/* Drag rail with position number */}
          <button
            type="button"
            aria-label="Drag to re-order"
            onPointerDown={(e) => controls.start(e)}
            className="hidden w-12 shrink-0 cursor-grab touch-none flex-col items-center justify-center gap-2 border-r border-line bg-surface-2/60 text-fg-faint transition-colors hover:bg-surface-2 hover:text-fg active:cursor-grabbing sm:flex"
          >
            <GripVertical className="size-4" />
            <span className="grid size-6 place-items-center rounded-full bg-surface text-[11px] font-semibold text-fg-muted ring-1 ring-line">
              {index + 1}
            </span>
          </button>

          <div className="flex min-w-0 flex-1 flex-col gap-4 p-3 sm:flex-row sm:items-center sm:gap-5 sm:p-4">
            {/* Banner */}
            <div
              className={cn(
                "relative shrink-0 overflow-hidden rounded-xl bg-surface-3 ring-1 ring-inset ring-black/5",
                adType === 2 ? "size-32" : "aspect-[1093/297] w-full sm:w-72"
              )}
            >
              <img
                src={ad.banner?.url}
                alt="Advertisement"
                className={cn("pointer-events-none size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]", expired && "opacity-60 grayscale")}
              />
              <Badge tone={expired ? "danger" : "success"} dot size="sm" className="absolute left-2 top-2 shadow-sm">
                {expired ? "Expired" : "Active"}
              </Badge>
              <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur sm:hidden">
                #{index + 1}
              </span>
            </div>

            {/* Details */}
            <div className="min-w-0 flex-1 space-y-3">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-3">
                <Meta icon={CalendarPlus} label="Created">{formatDate(ad.createdAt)}</Meta>
                <Meta icon={CalendarClock} label="Expires">{formatDate(ad.expireDate)}</Meta>
                <Meta icon={User} label="Created by">@{ad.author?.username}</Meta>
              </dl>

              {/* Lifetime bar */}
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className={cn("font-medium", expired ? "text-danger" : soon ? "text-amber-600" : "text-fg-muted")}>{timeLabel}</span>
                  <span className="text-fg-subtle">{Math.round(used)}% of run time used</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className={cn("h-full rounded-full transition-all", expired ? "bg-danger" : soon ? "bg-amber-500" : "bg-success")}
                    style={{ width: `${used}%` }}
                  />
                </div>
              </div>

              {(ad.link || ad.email) && (
                <div className="flex flex-wrap gap-2">
                  {ad.link && (
                    <a
                      href={ad.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-info ring-1 ring-line transition-colors hover:bg-surface-3"
                    >
                      <Link2 className="size-3.5 shrink-0" />
                      <span className="truncate">{ad.link}</span>
                    </a>
                  )}
                  {ad.email && (
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-fg-muted ring-1 ring-line">
                      <Mail className="size-3.5 shrink-0 text-fg-subtle" />
                      <span className="truncate">{ad.email}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 border-t border-line pt-3 sm:w-auto sm:flex-col sm:items-stretch sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
              <Button size="sm" variant="soft" leftIcon={Pencil} onClick={onEdit}>Edit</Button>
              <Button size="sm" variant="outline" leftIcon={RefreshCw} onClick={expired ? onRenew : onExtend}>
                {expired ? "Renew" : "Extend 30 days"}
              </Button>
              <Button size="sm" variant="danger" leftIcon={Trash2} onClick={onDelete}>Delete</Button>
            </div>
          </div>
        </div>
      </Card>
    </Reorder.Item>
  );
}

const AdsList = ({ ads = [], setAds, refetch, adType = 2, onAdd }) => {
  const confirm = useConfirm();
  const qc = useQueryClient();
  const [ids, setIds] = useState([]);
  const [map, setMap] = useState({});
  const [changed, setChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => { setIds(ads.map((a) => a._id)); setMap(Object.fromEntries(ads.map((a) => [a._id, a]))); setChanged(false); }, [ads]);

  const run = async (label, fn, done) => {
    const t = toast.loading(`${label}…`);
    try { await fn(); toast.success(done, { id: t }); qc.invalidateQueries({ queryKey: ["ads"] }); refetch?.(); }
    catch (e) { toast.error(errMsg(e, `${label} failed`), { id: t }); }
  };

  const del = async (ad) => {
    if (!(await confirm({ title: "Delete this advertisement?", message: "It stops showing on the website right away. This cannot be undone.", tone: "danger", confirmLabel: "Delete" }))) return;
    await run("Deleting", async () => { await httpClient.delete(`/delete-ads/${ad._id}`); setAds?.((cur) => cur.filter((x) => x._id !== ad._id)); }, "Advertisement deleted");
  };
  const extend = async (ad) => { if (await confirm({ title: "Extend by 30 days?", message: "The advertisement stays live for 30 more days.", confirmLabel: "Extend" })) await run("Extending", () => httpClient.put(`extend-main-expiry/${ad._id}`), "Advertisement extended"); };
  const renew = async (ad) => { if (await confirm({ title: "Renew this advertisement?", message: "It goes live again for a new period.", confirmLabel: "Renew" })) await run("Renewing", () => httpClient.put(`renew-main-expiry/${ad._id}`), "Advertisement renewed"); };

  const saveOrder = async () => {
    setSaving(true);
    try { await httpClient.post("/ads/update-order", { orderedAds: ids.map((id) => map[id]) }); toast.success("Order saved"); setChanged(false); qc.invalidateQueries({ queryKey: ["ads"] }); }
    catch (e) { toast.error(errMsg(e, "Could not save the order")); } finally { setSaving(false); }
  };

  if (!ads.length) return <Card className="flex min-h-[max(20rem,calc(100dvh-20rem))] items-center"><EmptyState icon={Megaphone} title="No advertisements yet" description="Create one and see exactly where it will appear on the website." action={onAdd && <Button onClick={onAdd}>Create advertisement</Button>} /></Card>;

  return (
    <>
      <Reorder.Group axis="y" values={ids} onReorder={(n) => { setIds(n); setAds?.(n.map((id) => map[id])); setChanged(true); }} className="space-y-3">
        {ids.map((id, i) => map[id] && <AdRow key={id} ad={map[id]} adType={adType} index={i} onEdit={() => setEditing(map[id])} onExtend={() => extend(map[id])} onRenew={() => renew(map[id])} onDelete={() => del(map[id])} />)}
      </Reorder.Group>
      {changed && (
        <div className="sticky bottom-3 z-10 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3 shadow-pop">
          <p className="text-sm text-fg-muted">Order changed — the first ad is shown first.</p>
          <Button leftIcon={Save} loading={saving} onClick={saveOrder}>Save order</Button>
        </div>
      )}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Update advertisement" size="xl">
        {editing && <AdsUploader ad={editing} addType={adType} refetch={refetch} onClose={() => setEditing(null)} />}
      </Modal>
    </>
  );
};

export default AdsList;