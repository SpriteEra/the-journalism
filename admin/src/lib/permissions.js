/**
 * Permission helpers. The backend sends `user.permissions` (array of keys) and `user.isSuper` with /me.
 * Old sessions / older backends only know `role`, so `role === "admin"` is treated as super admin.
 */
export const isSuper = (user) => Boolean(user && (user.isSuper || user.role === "admin"));

const matches = (granted, needed) => granted === "*" || granted === needed || (granted.endsWith(".*") && needed.startsWith(granted.slice(0, -1)));

/** can(user, "news.publish") / can(user, ["a","b"]) = ALL of them */
export const can = (user, keys) => {
  if (!user) return false;
  if (isSuper(user)) return true;
  const list = Array.isArray(keys) ? keys : [keys];
  const have = user.permissions || [];
  return list.every((k) => have.some((g) => matches(g, k)));
};

/** at least ONE of the keys */
export const canAny = (user, keys = []) => {
  if (!user) return false;
  if (isSuper(user)) return true;
  return keys.some((k) => can(user, k));
};
