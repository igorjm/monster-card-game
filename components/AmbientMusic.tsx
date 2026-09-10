"use client";

import { useSyncExternalStore } from "react";
import { useAmbientMusic } from "@/lib/client/useAmbientMusic";
import {
  isAmbientSoundOn,
  setAmbientSoundOn,
  subscribeToAmbientSound,
} from "@/lib/client/ambientMusic";

/** Mount on screens where the match has not started yet. */
export function AmbientMusic({ active = true }: { active?: boolean }) {
  useAmbientMusic(active);
  const soundOn = useSyncExternalStore(
    subscribeToAmbientSound,
    isAmbientSoundOn,
    () => true,
  );

  if (!active) return null;

  return (
    <button
      type="button"
      aria-label={soundOn ? "Desligar música de fundo" : "Ligar música de fundo"}
      aria-pressed={soundOn}
      title={soundOn ? "Música de fundo ligada" : "Música de fundo desligada"}
      onClick={() => setAmbientSoundOn(!soundOn)}
      className={`btn-pixel btn-pixel--icon fixed right-[max(0.75rem,env(safe-area-inset-right))] bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 rounded-md ${
        soundOn ? "btn-pixel--ember" : "btn-pixel--ghost"
      }`}
    >
      <SoundIcon muted={!soundOn} />
    </button>
  );
}

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      {muted ? (
        <>
          <path d="m16 9 5 5" />
          <path d="m21 9-5 5" />
        </>
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18 6a8.5 8.5 0 0 1 0 12" />
        </>
      )}
    </svg>
  );
}
