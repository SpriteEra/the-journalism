import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "./Modal";

const Ctx = createContext(null);

/**
 * Promise based confirmation, one dialog for the whole app (mounted once in main.jsx).
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "Delete this story?", message: "It moves to the trash.", tone: "danger", confirmLabel: "Delete" })) …
 */
export function ConfirmProvider({ children }) {
  const [opts, setOpts] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((options = {}) => new Promise((resolve) => {
    resolver.current = resolve;
    setOpts(options);
  }), []);

  const close = (result) => { resolver.current?.(result); resolver.current = null; setOpts(null); };
  const value = useMemo(() => confirm, [confirm]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <ConfirmDialog open={Boolean(opts)} onClose={() => close(false)} onConfirm={() => close(true)}
        title={opts?.title} message={opts?.message} tone={opts?.tone} icon={opts?.icon} confirmLabel={opts?.confirmLabel} cancelLabel={opts?.cancelLabel} />
    </Ctx.Provider>
  );
}

export const useConfirm = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
};
