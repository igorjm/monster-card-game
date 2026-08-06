"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

/**
 * Horizontal strip that scrolls by touch / click-drag (scrollbar hidden).
 */
export function CardStrip({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startScroll: number;
    moved: boolean;
  } | null>(null);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
    el.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    const state = drag.current;
    if (!el || !state || state.pointerId !== e.pointerId) return;
    const dx = e.clientX - state.startX;
    if (Math.abs(dx) > 4) state.moved = true;
    el.scrollLeft = state.startScroll - dx;
  }

  function endDrag(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    const state = drag.current;
    if (!el || !state || state.pointerId !== e.pointerId) return;
    drag.current = null;
    try {
      el.releasePointerCapture(e.pointerId);
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
