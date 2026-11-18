import { useRef, useState } from "react";
import { ImagePlus, UploadCloud } from "lucide-react";
import { Button } from "../ui";
import { cn } from "../../lib/cn";
import { IMAGE_ACCEPT } from "../../hooks/media";

/** Drop area + "Select file". One image, any image type. onFiles receives a FileList. */
export function MediaDropzone({ onFiles, className }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setOver(false); onFiles(e.dataTransfer.files); }}
      className={cn("grid aspect-video w-full place-items-center rounded-xl border-2 border-dashed p-6 text-center transition-colors",
        over ? "border-primary bg-primary-soft" : "border-line-strong bg-surface-2/60", className)}
    >
      <div className="flex flex-col items-center gap-3">
        <span className={cn("grid size-14 place-items-center rounded-full transition-colors", over ? "bg-primary text-primary-fg" : "bg-surface-3 text-fg-subtle")}>
          {over ? <UploadCloud className="size-7" /> : <ImagePlus className="size-7" />}
        </span>
        <div>
          <p className={cn("text-base font-medium", over ? "text-primary" : "text-fg")}>{over ? "Drop to add" : "Drop an image here"}</p>
          <p className="text-xs text-fg-subtle">or</p>
        </div>
        <Button variant="outline" onClick={() => input.current?.click()}>Select file</Button>
        <input ref={input} type="file" accept={IMAGE_ACCEPT} className="sr-only" tabIndex={-1}
          onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
        <p className="max-w-sm text-xs text-fg-subtle">PNG, JPG, GIF, WebP, AVIF, SVG, BMP, ICO, TIFF, HEIC · up to 256 MB. You can resize it to 1280 × 720 next.</p>
      </div>
    </div>
  );
}
