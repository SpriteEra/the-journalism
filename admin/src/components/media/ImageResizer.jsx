import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { Minus, Plus, RotateCw, Move, RefreshCcw } from "lucide-react";
import { Alert } from "../ui";
import { OUTPUT_HEIGHT, OUTPUT_WIDTH } from "../../hooks/media";

/** Cuts `area` (pixels from react-easy-crop) out of `src` and returns a 1280 × 720 File. */
export const cropToFile = (src, area, rotation, original) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const rad = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad)); const cos = Math.abs(Math.cos(rad));
      const bw = img.width * cos + img.height * sin; const bh = img.width * sin + img.height * cos;
      const big = document.createElement("canvas"); big.width = bw; big.height = bh;
      const bctx = big.getContext("2d");
      bctx.translate(bw / 2, bh / 2); bctx.rotate(rad); bctx.drawImage(img, -img.width / 2, -img.height / 2);
      const out = document.createElement("canvas"); out.width = OUTPUT_WIDTH; out.height = OUTPUT_HEIGHT;
      const ctx = out.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      if (!/png|webp/.test(original.type)) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT); }
      ctx.drawImage(big, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      const type = original.type === "image/png" ? "image/png" : original.type === "image/webp" ? "image/webp" : "image/jpeg";
      const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
      out.toBlob(
        (b) => (b ? resolve(new File([b], `${original.name.replace(/\.[^.]+$/, "").replace(/-1280x720$/, "")}-1280x720.${ext}`, { type })) : reject(new Error("Could not resize the image"))),
        type, 0.92
      );
    };
    img.onerror = () => reject(new Error("Could not read the image"));
    img.src = src;
  });

/** Crop state lives in the page so the Save button can read it. */
export function useResizerState() {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState(null);
  const reset = useCallback(() => { setCrop({ x: 0, y: 0 }); setZoom(1); setRotation(0); }, []);
  const clear = useCallback(() => { reset(); setArea(null); }, [reset]);
  return { crop, setCrop, zoom, setZoom, rotation, setRotation, area, setArea, reset, clear };
}

/** Fixed 16:9 frame: drag the picture to move it, zoom, rotate. The result is always 1280 × 720. */
export default function ImageResizer({ src, state }) {
  const { crop, setCrop, zoom, setZoom, rotation, setRotation, area, setArea, reset } = state;
  const onComplete = useCallback((_, px) => setArea(px), [setArea]);
  const lowRes = area && area.width < OUTPUT_WIDTH * 0.8;
  const round = (n) => Math.round(n * 100) / 100;
  const ctl = "grid size-9 place-items-center rounded-full border border-line hover:bg-surface-2 focus-ring";

  return (
    <div className="space-y-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-ink ring-1 ring-line">
        <Cropper image={src} crop={crop} zoom={zoom} rotation={rotation} aspect={16 / 9} showGrid
          onCropChange={setCrop} onZoomChange={setZoom} onRotationChange={setRotation} onCropComplete={onComplete} />
        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-medium text-paper backdrop-blur">
          <Move className="size-3" aria-hidden /> Drag to move · scroll to zoom
        </span>
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-medium text-paper backdrop-blur">{OUTPUT_WIDTH} × {OUTPUT_HEIGHT}</span>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(1, round(z - 0.2)))} className={ctl}><Minus className="size-4" /></button>
        <input type="range" aria-label="Zoom" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="h-1.5 flex-1 accent-primary" />
        <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(4, round(z + 0.2)))} className={ctl}><Plus className="size-4" /></button>
        <button type="button" aria-label="Rotate 90°" title="Rotate 90°" onClick={() => setRotation((r) => (r + 90) % 360)} className={ctl}><RotateCw className="size-4" /></button>
        <button type="button" aria-label="Reset position" title="Reset position" onClick={reset} className={ctl}><RefreshCcw className="size-4" /></button>
      </div>

      {lowRes && <Alert tone="warning" title="Low resolution">The part you selected is smaller than 1280 × 720, so it may look soft. Zoom out a little or use a bigger image.</Alert>}
    </div>
  );
}
