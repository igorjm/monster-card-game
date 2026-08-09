"use client";

import { CardBack, RoleCard } from "@/components/RoleCard";
import type { Role } from "@/lib/game/types";

const SIZES = {
  sm: "w-20 h-28",
  md: "w-32 h-44",
} as const;

/** Empty fixed graveyard seat (left / middle / right). */
export function EmptyGraveSlot({
  size = "sm",
}: {
  size?: keyof typeof SIZES;
}) {
  return (
    <div
      className={`${SIZES[size]} shrink-0 rounded-lg border-[3px] border-dashed border-night-card bg-grave/40`}
      aria-label="Carta removida"
    />
  );
}

/**
 * Always three fixed seats. Missing cards leave a gap so the table
 * can see which position was taken.
 */
export function GraveyardRow({
  slots,
  size = "sm",
}: {
  /** Length 3: true = face-down card present. */
  slots: boolean[];
  size?: keyof typeof SIZES;
}) {
  const seats = [...slots];
  while (seats.length < 3) seats.push(false);
  return (
    <div className="flex justify-center gap-3">
      {seats.slice(0, 3).map((filled, i) =>
        filled ? (
          <CardBack key={i} size={size} />
        ) : (
          <EmptyGraveSlot key={i} size={size} />
        ),
      )}
    </div>
  );
}

/** Revealed graveyard with fixed empty gaps (results / wolf peek). */
export function RevealedGraveyardRow({
  slots,
  size = "sm",
}: {
  slots: (Role | null)[];
  size?: keyof typeof SIZES;
}) {
  const seats = [...slots];
  while (seats.length < 3) seats.push(null);
  return (
    <div className="flex justify-center gap-3">
      {seats.slice(0, 3).map((role, i) =>
        role ? (
          <RoleCard key={i} role={role} size={size} flip />
        ) : (
          <EmptyGraveSlot key={i} size={size} />
        ),
      )}
    </div>
  );
}
