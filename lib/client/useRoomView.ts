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
  const roomCode = code.toUpperCase();
  const [snapshot, setSnapshot] = useState<{
    code: string;
    view: RoomView;
    clockOffsetMs: number;
  } | null>(null);
  const [failure, setFailure] = useState<{
    code: string;
    message: string;
  } | null>(null);
  const requestRef = useRef<{
    id: number;
    controller: AbortController;
  } | null>(null);
  const nextRequestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    requestRef.current?.controller.abort();
    const request = {
      id: ++nextRequestIdRef.current,
      controller: new AbortController(),
    };
    requestRef.current = request;

    try {
      const token = getPlayerToken();
      const next = await apiGet<RoomView>(
        `/api/rooms/${roomCode}/view?token=${encodeURIComponent(token)}`,
        { signal: request.controller.signal },
      );
      if (requestRef.current?.id !== request.id) return;

      setSnapshot({
        code: roomCode,
        view: next,
        clockOffsetMs: new Date(next.serverNow).getTime() - Date.now(),
      });
      setFailure(null);
    } catch (e) {
      if (request.controller.signal.aborted) return;
      if (requestRef.current?.id !== request.id) return;

      setFailure({
        code: roomCode,
        message: e instanceof Error ? e.message : "Erro inesperado.",
      });
    } finally {
      if (requestRef.current?.id === request.id) {
        requestRef.current = null;
      }
    }
  }, [roomCode]);

  useEffect(() => {
    queueMicrotask(() => void refresh());

    const supabase = browserClient();
    const channel = supabase
      .channel(`room:${roomCode}`)
      .on("broadcast", { event: "update" }, () => {
        void refresh();
      })
      .subscribe();

    const interval = setInterval(() => void refresh(), POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      requestRef.current?.controller.abort();
      requestRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [roomCode, refresh]);

  const currentSnapshot = snapshot?.code === roomCode ? snapshot : null;
  const error = failure?.code === roomCode ? failure.message : null;

  return {
    view: currentSnapshot?.view ?? null,
    error,
    clockOffsetMs: currentSnapshot?.clockOffsetMs ?? 0,
    refresh,
  };
}
