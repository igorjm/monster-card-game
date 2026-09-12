"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RoomView } from "@/lib/api/views";
import { mayShowPostMatchPromotion } from "@/lib/commercial/ad-policy";
import { trackFunnel } from "@/lib/client/analytics";

const STORAGE_KEY = "mesa-oculta:post-match-promotions";

type PromotionLog = { day: string; matchKeys: string[]; count: number };

export function PostMatchPromotion({ view }: { view: RoomView }) {
  const [visible, setVisible] = useState(false);
  const matchKey = view.game?.nightStartedAt ?? "";

  useEffect(() => {
    if (!matchKey) return;
    const day = new Date().toISOString().slice(0, 10);
    let log: PromotionLog = { day, matchKeys: [], count: 0 };
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as PromotionLog | null;
      if (stored?.day === day) log = stored;
    } catch {
      // A corrupt local cap record resets to the safer current-day default.
    }
    const allowed = mayShowPostMatchPromotion({
      isAdultHost: view.access.adultHost,
      isHost: view.you.isHost,
      isResults: view.phase === "resultado",
      premiumTheme: view.access.premiumTheme,
      adsSuppressed: view.access.adsSuppressed,
      priorMatchKeys: log.matchKeys,
      matchKey,
      impressionsToday: log.count,
    });
    if (!allowed) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ day, count: log.count + 1, matchKeys: [...log.matchKeys, matchKey] }));
    trackFunnel("offer_viewed", { placement: "post_match_internal" });
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [matchKey, view.access.adultHost, view.access.adsSuppressed, view.access.premiumTheme, view.phase, view.you.isHost]);

  if (!visible) return null;
  return (
    <aside className="panel-pixel rounded-lg border-ember p-4 text-center" aria-label="Novidades da Mesa Oculta">
      <p className="font-title text-xs text-ember">PRÓXIMOS MUNDOS</p>
      <p className="mt-2 text-parchment">Comédia em um estúdio caótico e sabotagem em uma estação espacial — histórias próprias, sem franquias licenciadas.</p>
      <Link href="/loja" className="btn-pixel btn-pixel--ghost mt-3 inline-block rounded-md">Ver catálogo</Link>
    </aside>
  );
}
