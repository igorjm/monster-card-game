"use client";

import { useState } from "react";
import type { Role } from "@/lib/game/types";
import { CardBack, RoleCard } from "./RoleCard";

/** The player's own card: face down, revealed while pressed. */
export function PeekCard({ role }: { role: Role }) {
  const [peeking, setPeeking] = useState(false);
  return (
    <div
      className="touch-none select-none"
      onPointerDown={() => setPeeking(true)}
      onPointerUp={() => setPeeking(false)}
      onPointerLeave={() => setPeeking(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {peeking ? <RoleCard role={role} size="md" flip /> : <CardBack size="md" />}
    </div>
  );
}
