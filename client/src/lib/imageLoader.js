/**
 * Image loader for next/image. The media server (img.spriteera.com …) resizes pictures itself when ?w= and ?q= are added,
 * so no extra image proxy / "remotePatterns" setup is needed. Local files and other hosts (YouTube thumbnails) are left untouched.
 */
const cdnHosts = () => String(process.env.NEXT_PUBLIC_IMAGE_CDN_HOSTS || "img.spriteera.com").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

export default function cdnLoader({ src, width, quality }) {
  if (!src || src.startsWith("/") || src.startsWith("data:") || src.startsWith("blob:")) return src;
  try {
    const url = new URL(src);
    if (cdnHosts().includes(url.hostname.toLowerCase())) {
      url.searchParams.set("w", String(width));
      url.searchParams.set("q", String(quality || 75));
      return url.toString();
    }
  } catch { /* not a valid URL: return as is */ }
  return src;
}
