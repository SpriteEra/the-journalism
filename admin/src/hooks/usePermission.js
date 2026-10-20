import { useMemo } from "react";
import { useSelector } from "react-redux";
import { can, canAny, isSuper } from "../lib/permissions";

/** const { can, canAny, isSuper, user } = usePermission();  if (can("news.publish")) … */
export default function usePermission() {
  const user = useSelector((s) => s.user.user);
  return useMemo(
    () => ({ user, isSuper: isSuper(user), can: (k) => can(user, k), canAny: (ks) => canAny(user, ks) }),
    [user]
  );
}
