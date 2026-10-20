import usePermission from "../../hooks/usePermission";

/** <Can perm="news.publish">…</Can>   <Can any={["a","b"]} fallback={<p>No access</p>}>…</Can> */
export default function Can({ perm, any, fallback = null, children }) {
  const p = usePermission();
  const ok = perm ? p.can(perm) : any ? p.canAny(any) : true;
  return ok ? children : fallback;
}
