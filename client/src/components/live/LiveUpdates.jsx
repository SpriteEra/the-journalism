import EditorContent from "@/components/article/EditorContent";
import Img from "@/components/common/Img";
import { formatDate } from "@/utils/util";
import { Pin } from "lucide-react";

/**
 * The entries of a live blog's timeline (newest first, as the server sends them).
 * A SERVER component: it renders the first page of the live page and everything the Server Actions load later (older / new entries),
 * so every entry looks the same and the editor HTML is always sanitised on the server.
 */
export default function LiveUpdates({ updates = [] }) {
  return (
    <>
      {updates.map((u) => (
        <article key={u._id} id={`update-${u._id}`} className="relative border-l-2 border-primary/30 pb-8 pl-5 lg:pl-7">
          <span aria-hidden className="absolute top-1.5 -left-1.75 size-3 rounded-full bg-primary ring-4 ring-white" />

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <time dateTime={u.time} className="font-semibold text-primary">{formatDate(u.time)}</time>
            {u.pinned && (
              <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                <Pin className="size-3" aria-hidden /> पिन किया हुआ
              </span>
            )}
          </div>

          {u.title && <h2 className="mt-1 font-khand text-2xl leading-snug font-bold lg:text-[30px]">{u.title}</h2>}

          {u.image ? (
            <figure className="mt-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-sm bg-gray-200">
                <Img src={u.image} alt={u.title || u.caption || ""} fill sizes="(max-width: 1024px) 100vw, 700px" className="object-cover" />
              </div>
              {u.caption && <figcaption className="mt-1 text-sm text-black/60">{u.caption}</figcaption>}
            </figure>
          ) : (
            u.caption && <p className="mt-2 text-lg leading-relaxed lg:text-[22px] lg:leading-7.5">{u.caption}</p>
          )}

          <EditorContent content={u.content} />
        </article>
      ))}
    </>
  );
}
