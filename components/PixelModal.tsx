"use client";

import type { ReactNode } from "react";

/** Centered pixel-panel overlay used for PWA prompts. */
export function PixelModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-grave/75 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pixel-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="panel-pixel w-full max-w-sm rounded-lg p-5 shadow-[0_8px_0_0_rgba(0,0,0,0.55)] animate-[card-flip-in_0.35s_steps(5)_both]">
        <h2
          id="pixel-modal-title"
          className="font-title text-center text-[0.7rem] leading-relaxed text-ember"
        >
          {title}
        </h2>
        <div className="mt-4 flex flex-col gap-3 text-parchment">{children}</div>
      </div>
    </div>
  );
}
