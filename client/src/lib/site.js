/** Site-wide constants. Everything comes from env so the same build works for any domain. */
const trim = (s = "") => String(s).replace(/\/+$/, "");

export const siteUrl = () => trim(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
export const siteName = () => process.env.NEXT_PUBLIC_SITE_NAME || "The Journalism";
export const siteDescription = () => process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Latest news from India and the world";

/** absolute URL of a path on this site: abs("/desh/news/x") -> https://site.com/desh/news/x */
export const abs = (path = "/") => `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;

export const googleSourceUrl = () => process.env.NEXT_PUBLIC_GOOGLE_SOURCE_URL || `https://www.google.com/preferences/source?q=${siteUrl().replace(/^https?:\/\//, "")}`;

export const socials = () => [
  ["facebook", process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK],
  ["x", process.env.NEXT_PUBLIC_SOCIAL_X],
  ["instagram", process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM],
  ["youtube", process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE],
].filter(([, url]) => Boolean(url)).map(([name, url]) => ({ name, url }));

const num = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= 0 ? n : d; };
/** cache lifetimes in seconds */
export const TTL = {
  home: () => num(process.env.REVALIDATE_HOME, 60),
  article: () => num(process.env.REVALIDATE_ARTICLE, 60),
  list: () => num(process.env.REVALIDATE_LIST, 60),
  menu: () => num(process.env.REVALIDATE_MENU, 300),
};
