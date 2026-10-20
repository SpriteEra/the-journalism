import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CalendarDays, Image as ImageIcon, Plus, Trash2, User } from "lucide-react";
import httpClient from "../api/httpClient";
import { useFetchPanchang } from "../hooks/panchang";
import usePermission from "../hooks/usePermission";
import { errMsg } from "../lib/api";
import { formatDate } from "../utils/utils";
import AddPanchang from "../components/panchang/AddPanchang";
import Modal from "../components/ui/Modal";
import { Button, Card, EmptyState, ErrorState, PageHeader, SearchInput, Skeleton, useConfirm } from "../components/ui";

const validateImageFile = (file) => {
  if (!["image/jpeg", "image/jpg", "image/png", "image/gif"].includes(file.type)) { toast.error("Please upload only JPG, PNG or GIF images"); return false; }
  if (file.size > 5 * 1024 * 1024) { toast.error("Image size should be less than 5 MB"); return false; }
  return true;
};

/** Daily panchang pictures: header with the add button on top, search, then a grid of cards. */
export default function Panchang() {
  const confirm = useConfirm();
  const qc = useQueryClient();
  const { can } = usePermission();
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [adding, setAdding] = useState(false);
  const [preview, setPreview] = useState(null);
  const { data, isPending, isError, error, refetch } = useFetchPanchang({ page: 1, search: applied, limit: 60 });

  const remove = async (p) => {
    if (!(await confirm({ title: "Delete this panchang?", message: "The picture is removed from the website.", tone: "danger", confirmLabel: "Delete" }))) return;
    const t = toast.loading("Deleting…");
    try { await httpClient.delete(`delete-panchang/${p._id}`); toast.success("Panchang deleted", { id: t }); qc.invalidateQueries({ queryKey: ["panchang"] }); refetch(); }
    catch (e) { toast.error(errMsg(e, "Failed to delete"), { id: t }); }
  };

  return (
    <>
      <PageHeader title="Panchang" description="Daily panchang pictures shown on the website." actions={can("panchang.manage") && <Button leftIcon={Plus} onClick={() => setAdding(true)}>Add panchang</Button>} />
      <Card padded={false} className="mb-4">
        <form className="p-3 sm:p-4" onSubmit={(e) => { e.preventDefault(); setApplied(search); }}>
          <SearchInput value={search} onChange={(v) => { setSearch(v); if (!v && applied) setApplied(""); }} placeholder="Search panchang (Enter)" />
        </form>
      </Card>
      {isError ? <Card><ErrorState error={error} onRetry={refetch} /></Card> : isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="surface-card p-3"><Skeleton className="aspect-square w-full" /><Skeleton className="mt-3 h-4 w-1/2" /></div>)}</div>
      ) : !data?.length ? (
        <Card className="flex min-h-[max(20rem,calc(100dvh-24rem))] items-center"><EmptyState icon={CalendarDays} title="No panchang yet" description={applied ? "Try a different search." : "Add today's panchang picture."} /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((p) => (
            <Card key={p._id} padded={false} className="overflow-hidden">
              <button type="button" onClick={() => p.image && setPreview(p.image)} className="block aspect-square w-full bg-surface-3">
                {p.image ? <img src={p.image} alt="Panchang" loading="lazy" className="size-full object-cover transition-opacity hover:opacity-90" /> : <span className="grid size-full place-items-center text-fg-faint"><ImageIcon className="size-10" /></span>}
              </button>
              <div className="space-y-3 p-3.5">
                <div className="space-y-1 text-sm text-fg-subtle"><p className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" />{formatDate(p.createdAt)}</p><p className="flex items-center gap-1.5"><User className="size-4" />@{p.author?.username}</p></div>
                <Button size="sm" variant="danger" leftIcon={Trash2} className="w-full" onClick={() => remove(p)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add panchang picture" icon={CalendarDays} size="md"><AddPanchang setAddPanchang={setAdding} refetch={refetch} validateImageFile={validateImageFile} /></Modal>
      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} title="Panchang" size="xl">{preview && <img src={preview} alt="Panchang preview" className="mx-auto max-h-[75dvh] rounded-xl object-contain" />}</Modal>
    </>
  );
}
