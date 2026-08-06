"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

/**
 * Horizontal strip that scrolls by touch / click-drag (scrollbar hidden).
 * Locks to horizontal only after the gesture is clearly sideways so vertical
 * page scroll still works on iOS home-screen PWAs.
 */
export function CardStrip({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startScroll: number;
    axis: "x" | "y" | null;
  } | null>(null);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startScroll: ref.current?.scrollLeft ?? 0,
      axis: null,
    };
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    const state = drag.current;
    if (!el || !state || state.pointerId !== e.pointerId) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;

    if (state.axis === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      // Vertical intent → abandon drag so the page can scroll.
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.current = null;
        return;
      }
      state.axis = "x";
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    if (state.axis !== "x") return;
    e.preventDefault();
    el.scrollLeft = state.startScroll - dx;
  }

  function endDrag(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    const state = drag.current;
    if (!el || !state || state.pointerId !== e.pointerId) return;
    drag.current = null;
    try {
      if (el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }
    } catch {
      // already released
    }
  }

  return (
    <div
      ref={ref}
      className="scroll-cards w-full cursor-grab overflow-x-auto active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="flex w-max gap-2 pr-2">{children}</div>
    </div>
  );
}
