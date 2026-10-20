import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { Minus, Plus, RotateCw } from "lucide-react";
import Button from "./Button";
import Modal from "./Modal";

/** Crops `area` (pixels, from react-easy-crop) out of an image and returns a JPEG Blob, `size` px square. */
export const cropToBlob = (src, area, rotation = 0, size = 640) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => {
    const rad = (rotation * Math.PI) / 180;
    // draw the (rotated) source on a canvas big enough to hold it, then cut the crop out of it
    const sin = Math.abs(Math.sin(rad)); const cos = Math.abs(Math.cos(rad));
    const bw = img.width * cos + img.height * sin; const bh = img.width * sin + img.height * cos;
    const big = document.createElement("canvas"); big.width = bw; big.height = bh;
    const bctx = big.getContext("2d");
    bctx.translate(bw / 2, bh / 2); bctx.rotate(rad); bctx.drawImage(img, -img.width / 2, -img.height / 2);
    const out = document.createElement("canvas"); out.width = size; out.height = size;
    out.getContext("2d").drawImage(big, area.x, area.y, area.width, area.height, 0, 0, size, size);
    out.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not crop the image"))), "image/jpeg", 0.9);
  };
  img.onerror = () => reject(new Error("Could not read the image"));
  img.src = src;
});

/**
 * Square profile-photo cropper (round guide, zoom + rotate). onDone(blob, previewUrl) with a 640 × 640 JPEG.
 *   <ImageCropper src={objectUrl} open onClose onDone />
 */
export default function ImageCropper({ src, open, onClose, onDone, title = "Crop profile photo" }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState(null);
  const [busy, setBusy] = useState(false);
  const onComplete = useCallback((_, px) => setArea(px), []);

  const done = async () => {
    if (!area) return;
    setBusy(true);
    try { const blob = await cropToBlob(src, area, rotation); onDone(blob, URL.createObjectURL(blob)); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} description="Drag to position, scroll or use the slider to zoom." size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={done} loading={busy} disabled={!area}>Use this photo</Button></>}>
      <div className="relative h-72 overflow-hidden rounded-2xl bg-ink sm:h-80">
        <Cropper image={src} crop={crop} zoom={zoom} rotation={rotation} aspect={1} cropShape="round" showGrid={false}
          onCropChange={setCrop} onZoomChange={setZoom} onRotationChange={setRotation} onCropComplete={onComplete} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(2)))} className="grid size-9 place-items-center rounded-full border border-line hover:bg-surface-2"><Minus className="size-4" /></button>
        <input type="range" aria-label="Zoom" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="h-1.5 flex-1" />
        <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(2)))} className="grid size-9 place-items-center rounded-full border border-line hover:bg-surface-2"><Plus className="size-4" /></button>
        <button type="button" aria-label="Rotate" onClick={() => setRotation((r) => (r + 90) % 360)} className="grid size-9 place-items-center rounded-full border border-line hover:bg-surface-2"><RotateCw className="size-4" /></button>
      </div>
    </Modal>
  );
}
