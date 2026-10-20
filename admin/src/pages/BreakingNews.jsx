import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Clock, Pencil, Plus, Siren, Trash2, User } from "lucide-react";
import httpClient from "../api/httpClient";
import { useFetchBreakingNews } from "../hooks/news";
import usePermission from "../hooks/usePermission";
import { errMsg } from "../lib/api";
import { formatDate } from "../utils/utils";
import AddBreakingNews from "../components/breakingnews/AddBreakingNews";
import EditBreakingNewsHandler from "../components/breakingnews/EditBreakingNewsHandler";
import Modal from "../components/ui/Modal";
import { Button, Card, EmptyState, ErrorState, PageHeader, Pagination, SearchInput, Skeleton, useConfirm } from "../components/ui";

/** Breaking-news ticker items. Header with the create button on top, search, then one row per item. */
export default function BreakingNews() {
  const confirm = useConfirm();
  const qc = useQueryClient();
  const { can } = usePermission();
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const { data, isPending, isError, error, refetch } = useFetchBreakingNews({ page, search: applied, limit });

  const remove = async (n) => {
    if (!(await confirm({ title: "Delete this breaking news?", message: `“${n.title}” is removed from the ticker.`, tone: "danger", confirmLabel: "Delete" }))) return;
    const t = toast.loading("Deleting…");
    try { await httpClient.delete(`delete-breaking-news/${n._id}`); toast.success("Breaking news deleted", { id: t }); qc.invalidateQueries({ queryKey: ["breaking-news"] }); refetch(); }
    catch (e) { toast.error(errMsg(e, "Failed to delete"), { id: t }); }
  };

  return (
    <>
      <PageHeader title="Breaking news" description="Short headlines shown in the breaking-news ticker of the website."
        actions={can("breaking.manage") && <Button leftIcon={Plus} onClick={() => setAdding(true)}>Add breaking news</Button>} />
      <Card padded={false} className="mb-4">
        <form className="p-3 sm:p-4" onSubmit={(e) => { e.preventDefault(); setApplied(search); setPage(1); }}>
          <SearchInput value={search} onChange={(v) => { setSearch(v); if (!v && applied) { setApplied(""); setPage(1); } }} placeholder="Search breaking news (Enter)" />
        </form>
      </Card>
      {isError ? <Card><ErrorState error={error} onRetry={refetch} /></Card> : isPending ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="surface-card p-4"><Skeleton className="h-5 w-2/3" /><Skeleton className="mt-2 h-4 w-1/3" /></div>)}</div>
      ) : !data?.news?.length ? (
        <Card className="flex min-h-[max(20rem,calc(100dvh-24rem))] items-center"><EmptyState icon={Siren} title="No breaking news" description={applied ? "Try a different search." : "Add a headline to show it in the ticker."} /></Card>
      ) : (
        <div className="space-y-3">
          {data.news.map((n) => (
            <Card key={n._id} padded={false}>
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <span className="hidden size-11 shrink-0 place-items-center rounded-xl bg-danger-soft text-danger sm:grid"><Siren className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="hindi-font line-clamp-2 text-base font-semibold text-fg">{n.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-subtle"><span className="inline-flex items-center gap-1.5"><Clock className="size-4" />{formatDate(n.createdAt)}</span><span className="inline-flex items-center gap-1.5"><User className="size-4" />@{n.author?.username}</span></p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="soft" leftIcon={Pencil} onClick={() => setEditing(n)}>Edit</Button>
                  <Button size="sm" variant="danger" leftIcon={Trash2} onClick={() => remove(n)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {Boolean(data?.total) && <Card padded={false} className="mt-4"><Pagination page={page} total={data.total} limit={limit} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1); }} limits={[10, 20, 50]} /></Card>}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add breaking news" icon={Siren} size="md"><AddBreakingNews setAddBreakingNews={setAdding} refetch={refetch} /></Modal>
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit breaking news" icon={Pencil} size="md">{editing && <EditBreakingNewsHandler news={editing} setEditBreakingNews={(v) => !v && setEditing(null)} refetch={refetch} />}</Modal>
    </>
  );
}
