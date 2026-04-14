"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type PortalViewContextType = {
  viewAsRole: string | null;
  setViewAsRole: (role: string | null) => void;
};

const PortalViewContext = createContext<PortalViewContextType>({
  viewAsRole: null,
  setViewAsRole: () => {},
});

export function PortalViewProvider({ children }: { children: ReactNode }) {
  const [viewAsRole, setViewAsRole] = useState<string | null>(null);
  return (
    <PortalViewContext.Provider value={{ viewAsRole, setViewAsRole }}>
      {children}
    </PortalViewContext.Provider>
  );
}

export function usePortalView() {
  return useContext(PortalViewContext);
}
