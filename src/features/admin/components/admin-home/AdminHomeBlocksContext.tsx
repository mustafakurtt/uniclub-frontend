import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type BlockState = "hidden" | "loading" | "visible";

interface AdminHomeBlocksContextValue {
  reportBlock: (id: string, state: BlockState) => void;
}

const AdminHomeBlocksContext = createContext<AdminHomeBlocksContextValue | null>(null);

export function AdminHomeBlocksProvider({ children }: { children: ReactNode }) {
  const [blocks, setBlocks] = useState<Record<string, BlockState>>({});

  const reportBlock = useCallback((id: string, state: BlockState) => {
    setBlocks((prev) => {
      if (prev[id] === state) return prev;
      return { ...prev, [id]: state };
    });
  }, []);

  const showWelcome = useMemo(() => {
    const values = Object.values(blocks);
    if (values.length === 0) return false;
    if (values.some((state) => state === "loading")) return false;
    return values.every((state) => state === "hidden");
  }, [blocks]);

  return (
    <AdminHomeBlocksContext.Provider value={{ reportBlock }}>
      {children}
      {showWelcome ? (
        <div className="card p-8 text-center">
          <h2 className="font-display text-lg font-bold text-slate-900">Hoş geldiniz</h2>
          <p className="mt-2 text-sm text-slate-500">
            Bugün sizden beklenen bir iş görünmüyor. Sol menüden çalışma alanlarına geçebilirsiniz.
          </p>
        </div>
      ) : null}
    </AdminHomeBlocksContext.Provider>
  );
}

export function useAdminHomeBlockVisibility(id: string, state: BlockState) {
  const ctx = useContext(AdminHomeBlocksContext);

  useEffect(() => {
    if (!ctx) return;
    ctx.reportBlock(id, state);
    return () => ctx.reportBlock(id, "hidden");
  }, [ctx, id, state]);
}
