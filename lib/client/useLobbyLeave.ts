"use client";

import { useEffect, useRef } from "react";
import { leaveRoomKeepalive } from "@/lib/client/leaveRoom";
import type { Phase } from "@/lib/game/types";
import type { RoomView } from "@/lib/api/views";

/**
 * While in lobby, drop this seat when the tab closes or the room page unmounts
 * (SPA navigate away). Mid-game does nothing — seats stay for the match.
 * Defers unmount leave briefly so React Strict Mode remounts don't false-leave.
 */
export function useLobbyLeave(code: string, view: RoomView | null) {
  const phaseRef = useRef<Phase | undefined>(undefined);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    phaseRef.current = view?.phase;
  }, [view?.phase]);

  useEffect(() => {
    if (leaveTimerRef.current != null) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }

    function leaveIfLobby() {
      if (phaseRef.current === "lobby") {
        leaveRoomKeepalive(code);
      }
    }

    function onPageHide(e: PageTransitionEvent) {
      if (e.persisted) return;
      leaveIfLobby();
    }

    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      leaveTimerRef.current = setTimeout(() => {
        leaveTimerRef.current = null;
        leaveIfLobby();
      }, 400);
    };
  }, [code]);
}
