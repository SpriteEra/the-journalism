import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * A panel that is drawn on <body>, positioned next to its anchor, so it is never cut off by a popup, a scrolling card or a table.
 * Opens below the anchor (above when there is no room), keeps itself inside the viewport and follows scroll / resize.
 *   <Floating anchorRef={ref} open align="start|end" matchWidth>…</Floating>
 */
export default function Floating({ anchorRef, open, children, align = "start", matchWidth, className, panelRef, gap = 8, maxWidth = "calc(100vw - 16px)", ...props }) {
  const [pos, setPos] = useState(null);
  // fallback ref so the panel can always be measured, even when the caller passes no panelRef
  const ownRef = useRef(null);
  const ref = panelRef || ownRef;

  useLayoutEffect(() => {
    if (!open) { setPos(null); return undefined; }
    const place = () => {
      const a = anchorRef.current?.getBoundingClientRect();
      if (!a) return;
      const panel = ref.current;
      const h = panel?.offsetHeight || 0;
      const w = matchWidth ? a.width : (panel?.offsetWidth || 0);
      const below = window.innerHeight - a.bottom - gap;
      const above = a.top - gap;
      const up = h > below && above > below;
      let left = align === "end" ? a.right - w : a.left;
      left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
      setPos({
        left,
        top: up ? Math.max(8, a.top - h - gap) : a.bottom + gap,
        width: matchWidth ? a.width : undefined,
        maxHeight: Math.max(160, (up ? above : below) - 4),
      });
    };
    place();
    const raf = requestAnimationFrame(place); // second pass once the panel has its real size
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef, align, matchWidth, gap, ref]);

  if (!open) return null;
  return createPortal(
    <div
      ref={ref}
      className={className}
      style={{
        position: "fixed",
        zIndex: 90,
        maxWidth,                                   // was a hard-coded "calc(100vw - 16px)"
        left: pos?.left ?? -9999,
        top: pos?.top ?? -9999,
        width: pos?.width ?? "max-content",
        maxHeight: pos?.maxHeight,
        overflowY: "auto",
        visibility: pos ? "visible" : "hidden",
      }}
      {...props}
    >
      {children}
    </div>,
    document.body
  );
}