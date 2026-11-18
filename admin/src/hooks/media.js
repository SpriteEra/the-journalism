import { keepPreviousData, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import httpClient from "../api/httpClient";
import { cleanParams } from "../lib/api";
import { useApiMutation } from "./admin";

/**
 * Media library data hooks. All URLs live here, the screens never call the API directly.
 *   GET    /media?page&limit&search&type&tag        -> { media: [item], total }   (search also looks in the tags)
 *   GET    /media/tags?q                            -> { tags: [{ tag, count }] }  most used first, for suggestions
 *   GET    /media/:id                               -> { media: item }
 *   POST   /media      multipart: file, title, altText, caption, description, tags, width, height   -> { media: item }
 *   PUT    /media/:id  multipart: same, replaces the file                                      -> { media: item }
 *   PATCH  /media/:id  json: title, altText, caption, description, tags (no new file)                -> { media: item }
 *   PUT    /media/:id/archive                       -> retire (hidden in the picker, cannot be chosen for new stories)
 *   DELETE /media/:id/archive                       -> allow again
 *   (list filter: archived = all (default) | exclude | only)
 *   GET    /media/default                           -> { media: item | null }      the default image
 *   PUT    /media/:id/default                       -> makes it THE default (needs media.default)
 *   DELETE /media/default                           -> no default any more (needs media.default)
 *   DELETE /media/:id
 * item = { _id, title, altText, caption, description, tags: [string], url, fileName, mimeType, size, width, height, createdAt, uploadedBy }
 */

/** Every image type the browser can show. `image/*` covers png, jpg, gif, webp, avif, svg, bmp, ico, tiff, heic … */
export const IMAGE_ACCEPT = "image/*,.heic,.heif,.avif,.svg,.ico,.tif,.tiff";
export const MAX_FILE_SIZE = 256 * 1024 * 1024; // 256 MB

/** The one size used for Live and News. */
export const OUTPUT_WIDTH = 1280;
export const OUTPUT_HEIGHT = 720;
export const TARGET_RATIO = 16 / 9;
export const isWide = (w, h) => Boolean(w && h) && Math.abs(w / h - TARGET_RATIO) < 0.02;

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico|tiff?|heic|heif|jfif|apng)$/i;
export const isImageFile = (f) => f?.type?.startsWith("image/") || IMAGE_EXT.test(f?.name || "");

/** Returns the first valid image (type + 256 MB limit) or null, and tells the user what was wrong. */
export function pickImage(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return null;
  if (files.length > 1) toast("Add one image at a time – using the first one.", { icon: "ℹ️" });
  const f = files[0];
  if (!isImageFile(f)) { toast.error("Only image files can be uploaded"); return null; }
  if (f.size > MAX_FILE_SIZE) { toast.error("The image is larger than 256 MB"); return null; }
  return f;
}

export const titleOf = (name = "") => name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();

/** Natural size of an image file (SVG / unsupported formats resolve to nulls). */
export const readSize = (file) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { resolve({ width: null, height: null }); URL.revokeObjectURL(url); };
    img.src = url;
  });

export const useMedia = (params) =>
  useQuery({
    queryKey: ["media", params],
    queryFn: () => httpClient.get("/media", { params: cleanParams(params) }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

/** Tags already used in the library (most used first) - suggestions while typing a tag. */
export const useMediaTags = (q = "") =>
  useQuery({
    queryKey: ["media-tags", q],
    queryFn: () => httpClient.get("/media/tags", { params: cleanParams({ q }) }).then((r) => r.data.tags),
    staleTime: 60_000,
  });

/** Retire an image: it stays on the stories that use it, but nobody can pick it for a new story. Restore = allowed again. */
export const useArchiveMedia = (opts) =>
  useApiMutation((id) => httpClient.put(`/media/${id}/archive`).then((r) => r.data), { invalidate: ["media", "media-item"], success: "Image retired", ...opts });
export const useRestoreMedia = (opts) =>
  useApiMutation((id) => httpClient.delete(`/media/${id}/archive`).then((r) => r.data), { invalidate: ["media", "media-item"], success: "Image can be used again", ...opts });

/** The image an admin marked as default (null when none). Used by "Use default image". */
export const fetchDefaultMedia = () => httpClient.get("/media/default").then((r) => r.data.media);
export const useSetDefaultMedia = (opts) =>
  useApiMutation((id) => httpClient.put(`/media/${id}/default`).then((r) => r.data), { invalidate: ["media", "media-item"], success: "Default image set", ...opts });
export const useClearDefaultMedia = (opts) =>
  useApiMutation(() => httpClient.delete("/media/default").then((r) => r.data), { invalidate: ["media", "media-item"], success: "Default image removed", ...opts });

export const MAX_TAGS = 20;
export const MAX_TAG_LENGTH = 40;

export const useMediaItem = (id) =>
  useQuery({
    queryKey: ["media-item", id],
    queryFn: () => httpClient.get(`/media/${id}`).then((r) => r.data),
    select: (d) => d.media,
    enabled: Boolean(id),
  });

/** Create (no id) or update (id). `file` is optional when updating. */
export const useSaveMedia = (opts) =>
  useApiMutation(
    ({ id, file, width, height, ...fields }) => {
      if (id && !file) return httpClient.patch(`/media/${id}`, fields).then((r) => r.data);
      const fd = new FormData();
      fd.append("file", file);
      Object.entries(fields).forEach(([k, v]) => fd.append(k, Array.isArray(v) ? JSON.stringify(v) : v ?? ""));   // tags go as a JSON array
      if (width && height) { fd.append("width", width); fd.append("height", height); }
      return (id ? httpClient.put(`/media/${id}`, fd) : httpClient.post("/media", fd)).then((r) => r.data);
    },
    { invalidate: ["media", "media-item", "media-tags"], success: (_, v) => (v.id ? "Image saved" : "Image added"), ...opts }
  );

export const useDeleteMedia = (opts) =>
  useApiMutation((id) => httpClient.delete(`/media/${id}`).then((r) => r.data), { invalidate: ["media", "media-item", "media-tags"], success: "Image deleted", ...opts });