"use client";

/* eslint-disable @next/next/no-img-element */
import type { Role } from "@/lib/game/types";
import { useTheme } from "@/components/theme/ThemeProvider";

const SIZES = {
  sm: { w: "w-20", h: "h-28", text: "text-[0.55rem]", badge: "w-5 h-5 text-[0.5rem]" },
  md: { w: "w-32", h: "h-44", text: "text-[0.65rem]", badge: "w-7 h-7 text-[0.65rem]" },
  lg: { w: "w-48", h: "h-64", text: "text-xs", badge: "w-9 h-9 text-sm" },
} as const;

export function RoleCard({
  role,
  size = "md",
  flip = false,
}: {
  role: Role;
  size?: keyof typeof SIZES;
  flip?: boolean;
}) {
  const { roles } = useTheme();
  const meta = roles[role];
  const s = SIZES[size];
  return (
    <div
      className={`${s.w} ${s.h} ${flip ? "card-flip-in" : ""} relative shrink-0 rounded-lg border-[3px] border-grave bg-card-frame p-1.5 shadow-[0_4px_0_0_rgba(0,0,0,0.55)]`}
    >
      <div className="relative h-[70%] w-full overflow-hidden rounded-md border-2 border-night-card bg-night">
        {meta.artSrc ? (
          <img
            src={meta.artSrc}
            alt={meta.artAlt}
            className="pixel-art h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div
            role="img"
            aria-label={meta.artAlt}
            className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_35%,var(--color-ember),var(--color-night)_68%)]"
          >
            <span className="font-title text-3xl text-parchment drop-shadow-[3px_3px_0_var(--color-grave)]">
              {meta.letter}
            </span>
          </div>
        )}
      </div>
      <div
        className={`font-title ${s.badge} absolute -left-1.5 -top-1.5 flex items-center justify-center rounded-full border-2 border-grave bg-ember text-grave`}
      >
        {meta.letter}
      </div>
      <div className={`font-title ${s.text} mt-1.5 truncate text-center uppercase text-parchment`}>
        {meta.name}
      </div>
      {size === "lg" && (
        <p className="mt-1 px-1 text-center text-sm leading-tight text-parchment-dim">
          {meta.description}
        </p>
      )}
    </div>
  );
}

export function CardBack({
  size = "md",
  label,
  selected = false,
  onClick,
}: {
  size?: keyof typeof SIZES;
  label?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const theme = useTheme();
  const s = SIZES[size];
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`${s.w} ${s.h} relative shrink-0 rounded-lg border-[3px] p-1.5 shadow-[0_4px_0_0_rgba(0,0,0,0.55)] transition-transform ${
        selected
          ? "border-ember bg-night-card scale-105 pulse-glow"
          : "border-grave bg-card-frame"
      } ${onClick ? "active:scale-95" : ""}`}
    >
      <div className="flex h-[70%] w-full items-center justify-center overflow-hidden rounded-md border-2 border-night-card bg-night">
        {theme.brand.cardBackSrc ? (
          <img
            src={theme.brand.cardBackSrc}
            alt="Carta virada"
            className="pixel-art h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div
            role="img"
            aria-label="Carta virada"
            className="flex h-full w-full items-center justify-center bg-[repeating-linear-gradient(45deg,var(--color-night),var(--color-night)_8px,var(--color-night-card)_8px,var(--color-night-card)_16px)]"
          >
            <span className="font-title text-xl text-ember">?</span>
          </div>
        )}
      </div>
      {label && (
        <div
          className={`font-title ${s.text} mt-1.5 truncate text-center uppercase ${
            selected ? "text-ember" : "text-parchment"
          }`}
        >
          {label}
        </div>
      )}
    </Tag>
  );
}
