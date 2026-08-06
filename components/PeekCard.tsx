"use client";

import { useState } from "react";
import type { Role } from "@/lib/game/types";
import { CardBack, RoleCard } from "./RoleCard";

/** The player's own card: face down by default; tap to show or hide. */
export function PeekCard({ role }: { role: Role }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <button
      type="button"
      className="touch-manipulation select-none active:scale-95"
      aria-pressed={revealed}
      aria-label={revealed ? "Esconder carta" : "Mostrar carta"}
      onClick={() => setRevealed((v) => !v)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {revealed ? <RoleCard role={role} size="md" flip /> : <CardBack size="md" />}
    </button>
  );
}
