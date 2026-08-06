"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { browserClient } from "@/lib/supabase/client";
import type { RoomView } from "@/lib/api/views";
import { apiGet, getPlayerToken } from "./identity";

const POLL_INTERVAL_MS = 4000;

export interface RoomConnection {
  view: RoomView | null;
  error: string | null;
  /** Difference serverNow - clientNow in ms, for timer sync. */
  clockOffsetMs: number;
  refresh: () => Promise<void>;
}

export function useRoomView(code: string): RoomConnection {
  const [view, setView] = useState<RoomView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  const fetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const token = getPlayerToken();
      const next = await apiGet<RoomView>(
        `/api/rooms/${code}/view?token=${encodeURIComponent(token)}`,
      );
      setClockOffsetMs(new Date(next.serverNow).getTime() - Date.now());
      setView(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      fetchingRef.current = false;
    }
  }, [code]);

  useEffect(() => {
    queueMicrotask(() => void refresh());

    const supabase = browserClient();
    const channel = supabase
      .channel(`room:${code.toUpperCase()}`)
      .on("broadcast", { event: "update" }, () => {
        void refresh();
      })
      .subscribe();

    const interval = setInterval(() => void refresh(), POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [code, refresh]);

  return { view, error, clockOffsetMs, refresh };
}
