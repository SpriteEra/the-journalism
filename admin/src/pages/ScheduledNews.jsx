import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CalendarClock, Pencil, Plus, Send, Trash2, User } from "lucide-react";
import httpClient from "../api/httpClient";
import { useFetchScheduleNews } from "../hooks/news";
import usePermission from "../hooks/usePermission";
import { errMsg } from "../lib/api";
import { handleImageError } from "../utils/imageError";
import { buttonStyles } from "../components/ui/Button";
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, Pagination, Skeleton, useConfirm } from "../components/ui";

/** Stories waiting for their publish time. Same structure as News: header with the action on top, then the list. */
export default function ScheduledNews() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const { can } = usePermission();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data, isPending, isError, error, refetch } = useFetchScheduleNews({ page, limit });

  const done = () => { qc.invalidateQueries({ queryKey: ["schedule-news"] }); qc.invalidateQueries({ queryKey: ["news"] }); refetch(); };
  const act = async (label, fn, ok) => { const t = toast.loading(`${label}…`); try { await fn(); toast.success(ok, { id: t }); done(); } catch (e) { toast.error(errMsg(e, `${label} failed`), { id: t }); } };

  const publish = async (n) => { if (await confirm({ title: "Publish now?", message: `“${n.title}” goes live immediately instead of at its scheduled time.`, confirmLabel: "Publish now" })) act("Publishing", () => httpClient.put("publish-scheduled-news", { news_id: n.news_id }), "News published"); };
  const remove = async (n) => { if (await confirm({ title: "Delete this scheduled story?", message: `“${n.title}” will not be published. This cannot be undone.`, tone: "danger", confirmLabel: "Delete" })) act("Deleting", () => httpClient.delete(`/delete-scheduled-news/${n.news_id}`), "Scheduled news deleted"); };

  return (
    <>
      <PageHeader title="Scheduled news" description="Stories that will be published automatically at the time you set."
        actions={can("news.create") && <Link to="/dashboard/news/create" className={buttonStyles({})}><Plus className="size-4" />Write news</Link>} />
      {isError ? <Card><ErrorState error={error} onRetry={refetch} /></Card> : isPending ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="surface-card flex gap-4 p-4"><Skeleton className="h-20 w-36" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/3" /></div></div>)}</div>
      ) : !data?.news?.length ? (
        <Card className="flex min-h-[max(20rem,calc(100dvh-18rem))] items-center"><EmptyState icon={CalendarClock} title="Nothing is scheduled" description="Use “Schedule” on the publish step to queue a story for later." /></Card>
      ) : (
        <div className="space-y-3">
          {data.news.map((n) => (
            <Card key={n.news_id} padded={false} className="overflow-hidden">
              <div className="flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:p-4">
                <img src={`${n.banner}?q=70&w=360`} alt="" loading="lazy" onError={handleImageError} className="aspect-video w-full shrink-0 rounded-xl bg-surface-3 object-cover sm:h-24 sm:w-44" />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="hindi-font line-clamp-2 text-base font-semibold leading-snug text-fg">{n.title}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-fg-subtle">
                    <Badge tone="warning" dot><CalendarClock className="size-3" />{n.post_time?.date}, {n.post_time?.time}</Badge>
                    <span className="inline-flex items-center gap-1.5"><User className="size-4" />@{n.author?.username}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {can("news.update.any") || can("news.update.own") ? <Button size="sm" variant="soft" leftIcon={Pencil} onClick={() => navigate(`/dashboard/news/edit-news/${n.news_id}?type=schedule_news&mode=edit`)}>Edit</Button> : null}
                  {can("news.publish") && <Button size="sm" variant="outline" leftIcon={Send} onClick={() => publish(n)}>Publish now</Button>}
                  <Button size="sm" variant="danger" leftIcon={Trash2} onClick={() => remove(n)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {Boolean(data?.total) && <Card padded={false} className="mt-4"><Pagination page={page} total={data.total} limit={limit} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1); }} limits={[10, 20, 50]} /></Card>}
    </>
  );
}
