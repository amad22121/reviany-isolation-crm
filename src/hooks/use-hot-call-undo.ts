import { useRef, useState, useCallback, useEffect } from "react";
import { HotCall } from "@/data/crm-data";

const UNDO_WINDOW_MS = 10000; // 10 seconds

export interface UndoSnapshot {
  actionLabel: string;
  recordId: string;
  previousHotCall: HotCall | null; // null = was a rebook (removed from list)
  previousAppointments?: any[]; // snapshot of appointments if rebook happened
  timestamp: number;
}

interface UseHotCallUndoReturn {
  undoAvailable: boolean;
  undoLabel: string;
  captureSnapshot: (label: string, recordId: string, hotCall: HotCall | null) => void;
  performUndo: () => UndoSnapshot | null;
  dismissUndo: () => void;
  remainingMs: number;
}

export function useHotCallUndo(): UseHotCallUndoReturn {
  const [snapshot, setSnapshot] = useState<UndoSnapshot | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const dismissUndo = useCallback(() => {
    clearTimers();
    setSnapshot(null);
    setRemainingMs(0);
  }, [clearTimers]);

  const captureSnapshot = useCallback((label: string, recordId: string, hotCall: HotCall | null) => {
    clearTimers();
    const snap: UndoSnapshot = {
      actionLabel: label,
      recordId,
      previousHotCall: hotCall ? { ...hotCall, tags: [...hotCall.tags], callHistory: [...hotCall.callHistory] } : null,
      timestamp: Date.now(),
    };
    setSnapshot(snap);
    setRemainingMs(UNDO_WINDOW_MS);

    intervalRef.current = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 100) return 0;
        return prev - 100;
      });
    }, 100);

    timerRef.current = setTimeout(() => {
      setSnapshot(null);
      setRemainingMs(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }, UNDO_WINDOW_MS);
  }, [clearTimers]);

  const performUndo = useCallback((): UndoSnapshot | null => {
    const snap = snapshot;
    dismissUndo();
    return snap;
  }, [snapshot, dismissUndo]);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    undoAvailable: !!snapshot && remainingMs > 0,
    undoLabel: snapshot?.actionLabel || "",
    captureSnapshot,
    performUndo,
    dismissUndo,
    remainingMs,
  };
}
