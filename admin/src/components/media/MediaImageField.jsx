import { useState } from "react";
import { ImageIcon, Star, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../ui";
import MediaPicker from "./MediaPicker";
import { fetchDefaultMedia } from "../../hooks/media";
import { handleImageError } from "../../utils/imageError.js";

/**
 * The image box used by News and Live: preview + "Choose image" (media library / upload) + "Use default image".
 *
 *   <MediaImageField value={banner} onChange={(pick) => setBlog({ ...blog, banner: pick?.url || "", imageRef: pick?.caption || "" })} />
 *
 * onChange gets { _id, url, title, altText, caption, width, height, tags } or null when the image is removed.
 * "Use default image" takes the image an admin marked as default in the media library (Media library > edit > "Use as default image").
 * The caption / alt text can still be edited in the picker's side panel, and by you afterwards in the story's own caption field.
 */
export default function MediaImageField({ value, onChange, placeholder = "/news-banner.png", pickerTitle = "Select image", allowDefault = true, hint, className = "" }) {
    const [open, setOpen] = useState(false);
    const [loadingDefault, setLoadingDefault] = useState(false);

    const useDefault = async () => {
        setLoadingDefault(true);
        try {
            const m = await fetchDefaultMedia();
            if (!m) { toast.error("No default image is set yet. Choose one in Media library > Edit > “Use as default image”."); return; }
            onChange({ _id: m._id, url: m.url, title: m.title || "", altText: m.altText || "", caption: m.caption || "", width: m.width, height: m.height, tags: m.tags || [] });
        } catch { toast.error("Could not load the default image"); }
        finally { setLoadingDefault(false); }
    };

    return (
        <div className={className}>
            <button type="button" onClick={() => setOpen(true)} className="group relative block aspect-video w-full overflow-hidden rounded-lg border-2 border-dashed border-line-strong bg-surface-2 transition-colors hover:border-primary focus-ring sm:rounded-xl" aria-label={value ? "Change image" : "Choose image"}>
                <img src={value || placeholder} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" onError={handleImageError} />
                <span className="absolute inset-0 flex items-center justify-center bg-ink/0 transition-colors group-hover:bg-ink/10">
                    <span className="flex items-center gap-2 rounded-xl bg-surface/90 px-4 py-2 text-sm font-medium text-fg-muted opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"><ImageIcon className="size-4" />{value ? "Change image" : "Choose image"}</span>
                </span>
            </button>
            <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" leftIcon={ImageIcon} onClick={() => setOpen(true)}>{value ? "Change image" : "Choose image"}</Button>
                {allowDefault && <Button type="button" size="sm" variant="outline" leftIcon={Star} onClick={useDefault} loading={loadingDefault}>Use default image</Button>}
                {value && <Button type="button" size="sm" variant="ghost" leftIcon={X} onClick={() => onChange(null)}>Remove</Button>}
            </div>
            {hint && <p className="mt-2 text-xs text-fg-subtle max-sm:hidden">{hint}</p>}
            <MediaPicker open={open} onClose={() => setOpen(false)} onSelect={onChange} title={pickerTitle} />
        </div>
    );
}