import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import EditorJS from "@editorjs/editorjs";
// @ts-ignore
import Undo from "editorjs-undo";
import { Undo2, Redo2 } from "lucide-react";
import { tools } from "../../utils/EditorTools.jsx";

/** News stores its body as [ {time, blocks, version} ]; accept that, the bare object, or nothing. */
export const toEditorData = (content) => {
  const d = Array.isArray(content) ? content[0] : content;
  return d && Array.isArray(d.blocks) ? d : { blocks: [] };
};

/**
 * Editor.js body for a live story – same blocks / tools / shortcuts as the news editor,
 * but self-contained (it does NOT use the news editor's localStorage draft).
 *
 *   const ref = useRef();
 *   <LiveEditor ref={ref} initialData={live?.content} onChange={() => setDirty(true)} />
 *   const data = await ref.current.save();   // { blocks: [...] }
 *   ref.current.undo(); ref.current.redo();
 *
 * Pass showToolbar={false} if the parent renders its own undo/redo buttons.
 */
const LiveEditor = forwardRef(function LiveEditor(
  {
    initialData,
    onChange,
    placeholder = "Write the story behind this live coverage…",
    showToolbar = true,
  },
  ref
) {
  const holder = useRef(null);
  const editor = useRef(null);
  const undoRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useImperativeHandle(
    ref,
    () => ({
      save: () => (editor.current ? editor.current.save() : Promise.resolve({ blocks: [] })),
      undo: () => undoRef.current?.undo(),
      redo: () => undoRef.current?.redo(),
    }),
    []
  );

  useEffect(() => {
    const el = holder.current;
    if (!el) return undefined;
    const data = toEditorData(initialData);

    // Ctrl/Cmd + Shift + Z  → redo
    const onKeyDownRedo = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undoRef.current?.redo();
      }
    };

    // Ctrl/Cmd + A → select the whole editor, not just one block
    const onSelectAll = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        if (!el.contains(document.activeElement)) return;
        e.preventDefault();
        e.stopPropagation();
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    };

    // Multi-line paste into a checklist block → one item per line
    const onPaste = (e) => {
      const ed = editor.current;
      if (!ed) return;
      const text = e.clipboardData?.getData("text/plain") || "";
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.replace(/^\s*(?:[-*•]|\[[ xX]?\])\s*/, "").trim()) // strip "- ", "* ", "[ ] "
        .filter(Boolean);
      if (lines.length < 2) return; // single line: normal paste

      const index = ed.blocks.getCurrentBlockIndex();
      const current = ed.blocks.getBlockByIndex(index);
      if (current?.name !== "checklist") return;

      // must run synchronously, before any await
      e.preventDefault();
      e.stopPropagation();

      current.save().then((saved) => {
        const existing = (saved?.data?.items || []).filter((i) => i.text?.trim());
        const added = lines.map((t) => ({ text: t, checked: false }));
        ed.blocks.insert(
          "checklist",
          { items: [...existing, ...added] },
          undefined,
          index,
          true, // focus
          true // replace the current block
        );
        onChangeRef.current?.();
      });
    };

    const ed = new EditorJS({
      holder: el,
      data,
      tools,
      placeholder,
      onChange: () => onChangeRef.current?.(),
      onReady: () => {
        try {
          const undo = new Undo({
            editor: ed,
            config: { debounceTimer: 200, shortcuts: { undo: "CMD+Z", redo: "CMD+Y" } },
          });
          if (data?.blocks?.length) undo.initialize(data);
          undoRef.current = undo;
        } catch {
          /* undo is optional */
        }
      },
    });
    editor.current = ed;

    el.addEventListener("keydown", onKeyDownRedo);
    el.addEventListener("keydown", onSelectAll, true); // capture: before Editor.js's own handler
    el.addEventListener("paste", onPaste, true); // capture: before Editor.js's own handler

    return () => {
      el.removeEventListener("keydown", onKeyDownRedo);
      el.removeEventListener("keydown", onSelectAll, true);
      el.removeEventListener("paste", onPaste, true);
      editor.current = null;
      undoRef.current = null;
      // destroy only after it finished starting (React may mount / unmount quickly in dev)
      ed.isReady?.then(() => ed.destroy()).catch(() => {});
    };
    // the editor is created once; initialData is only the starting content
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {showToolbar && (
        <div className="mb-2 flex items-center justify-end gap-1">
          <button
            type="button"
            title="Undo (Ctrl+Z)"
            onClick={() => undoRef.current?.undo()}
            className="rounded p-1.5 text-fg-muted hover:bg-surface-2"
          >
            <Undo2 size={18} />
          </button>
          <button
            type="button"
            title="Redo (Ctrl+Y)"
            onClick={() => undoRef.current?.redo()}
            className="rounded p-1.5 text-fg-muted hover:bg-surface-2"
          >
            <Redo2 size={18} />
          </button>
        </div>
      )}
      <div
        ref={holder}
        className="font-anekdevanagari min-h-[400px] rounded-xl border border-line bg-surface-2/30 p-2 text-fg transition-all focus-within:border-transparent focus-within:ring-2 focus-within:ring-primary sm:p-6"
      />
    </div>
  );
});

export default LiveEditor;