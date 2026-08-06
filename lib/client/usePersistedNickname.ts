"use client";

import { useState, useSyncExternalStore } from "react";
import { getSavedNickname } from "./identity";

/**
 * Nickname from localStorage that hydrates safely:
 * server snapshot is "" so SSR markup matches the first client paint.
 */
export function usePersistedNickname() {
  const stored = useSyncExternalStore(
    () => () => {},
    getSavedNickname,
    () => "",
  );
  const [draft, setDraft] = useState<string | null>(null);
  return {
    nickname: draft ?? stored,
    setNickname: (value: string) => setDraft(value),
  };
}
