import { createContext, useContext, type ReactNode } from "react";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { useBootstrap, type Membership } from "./useBootstrap";

export type AppRole = "proprietaire" | "gestionnaire" | "representant";

interface WorkspaceContextValue {
  workspaceId: string | null;
  role: AppRole | null;
  currentRepId: string | null;
  currentManagerId: string | null;
  membership: Membership | null;
  loading: boolean;
  /** Dev helper: override role for testing */
  setDevRole: (role: AppRole, repId?: string | null, managerId?: string | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

import { useState, useMemo } from "react";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const { membership, loading } = useBootstrap(user?.id ?? null);

  // Dev override state
  const [devOverride, setDevOverride] = useState<{
    role: AppRole;
    repId: string | null;
    managerId: string | null;
  } | null>(null);

  const setDevRole = (role: AppRole, repId?: string | null, managerId?: string | null) => {
    setDevOverride({
      role,
      repId: repId ?? null,
      managerId: managerId ?? null,
    });
  };

  const value = useMemo<WorkspaceContextValue>(() => {
    if (devOverride) {
      return {
        workspaceId: membership?.workspace_id ?? "workspace_demo_1",
        role: devOverride.role,
        currentRepId: devOverride.repId,
        currentManagerId: devOverride.managerId,
        membership,
        loading,
        setDevRole,
      };
    }
    return {
      workspaceId: membership?.workspace_id ?? null,
      role: membership?.role ?? null,
      currentRepId: membership?.rep_id ?? null,
      currentManagerId: membership?.manager_id ?? null,
      membership,
      loading,
      setDevRole,
    };
  }, [membership, loading, devOverride]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspaceContext must be used within <WorkspaceProvider>");
  return ctx;
}
