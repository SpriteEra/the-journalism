import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import EditorJS from "@editorjs/editorjs";
// @ts-ignore
import Undo from "editorjs-undo";
import { tools } from "../../utils/EditorTools.jsx";

/** News stores its body as [ {time, blocks, version} ]; accept that, the bare object, or nothing. */
export const toEditorData = (content) => {
  const d = Array.isArray(content) ? content[0] : content;
  return d && Array.isArray(d.blocks) ? d : { blocks: [] };
};

/**
 * Editor.js body for a live story – same blocks / tools as the news editor, but self-contained
 * (it does NOT use the news editor's localStorage draft, so the two never overwrite each other).
 *
 *   const ref = useRef();   <LiveEditor ref={ref} initialData={live?.content} onChange={() => setDirty(true)} />
 *   const data = await ref.current.save();   // { blocks: [...] }
 */
const LiveEditor = forwardRef(function LiveEditor({ initialData, onChange, placeholder = "Write the story behind this live coverage…" }, ref) {
  const holder = useRef(null);
  const editor = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useImperativeHandle(ref, () => ({ save: () => (editor.current ? editor.current.save() : Promise.resolve({ blocks: [] })) }), []);

  useEffect(() => {
    const ed = new EditorJS({
      holder: holder.current,
      data: toEditorData(initialData),
      tools,
      placeholder,
      onChange: () => onChangeRef.current?.(),
      onReady: () => { try { new Undo({ editor: ed, config: { debounceTimer: 200 } }).initialize(toEditorData(initialData)); } catch { /* undo is optional */ } },
    });
    editor.current = ed;
    return () => {
      editor.current = null;
      // destroy only after it finished starting (React may mount / unmount quickly in dev)
      ed.isReady?.then(() => ed.destroy()).catch(() => { });
    };
    // the editor is created once; initialData is only the starting content
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={holder} className="font-anekdevanagari min-h-[320px] rounded-xl border border-line bg-surface-2/30 p-2 text-fg transition-all focus-within:border-transparent focus-within:ring-2 focus-within:ring-primary sm:p-6" />;
});

export default LiveEditor;
