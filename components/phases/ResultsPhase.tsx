"use client";

import { useState } from "react";
import { apiPost, getPlayerToken } from "@/lib/client/identity";
import { ROLES, TEAMS } from "@/lib/game/roles";
import type { RoomView } from "@/lib/api/views";
import { RoleCard } from "@/components/RoleCard";
import { AppShell } from "@/components/AppShell";
import { NightInfo } from "./NightPhase";

export function ResultsPhase({
  view,
  refresh,
}: {
  view: RoomView;
  refresh: () => Promise<void>;
}) {
  const result = view.game!.result!;
  const [busy, setBusy] = useState(false);

  const nameOf = (id: string) =>
    view.players.find((p) => p.id === id)?.nickname ?? "???";

  const yourFinal = result.finalRoles[view.you.id];
  const youWon =
    yourFinal !== "zumbi" && ROLES[yourFinal].team === result.winners;
  const team = TEAMS[result.winners];

  const voteTally: Record<string, number> = {};
  for (const target of Object.values(result.votes)) {
    voteTally[target] = (voteTally[target] ?? 0) + 1;
  }

  async function playAgain() {
    setBusy(true);
    try {
      await apiPost(`/api/rooms/${view.code}/restart`, {
        token: getPlayerToken(),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell wide flushTop className="gap-5">
      <header className="text-center">
        <h1
          className={`font-title text-lg ${youWon ? "text-swamp-bright" : "text-blood-bright"}`}
        >
          {youWon ? "VITÓRIA!" : "DERROTA..."}
        </h1>
        <p className="font-title mt-2 text-sm text-ember">
          {team.name.toUpperCase()} VENCERAM
        </p>
        <p className="mt-1 text-parchment-dim">{team.goal}</p>
      </header>

      {result.hunterHidden && (
        <section className="panel-pixel flex flex-col items-center gap-2 rounded-lg p-4">
          <p className="font-title text-xs text-ember">CARTA DO CAÇADOR</p>
          <RoleCard role={result.hunterHidden} size="md" flip />
          <p className="text-parchment">{ROLES[result.hunterHidden].name}</p>
        </section>
      )}

      <NightInfo view={view} />

      <section className="panel-pixel rounded-lg p-4">
        <h2 className="font-title mb-3 text-xs text-blood-bright">
          {result.deadIds.length > 1 ? "OS MORTOS" : "O MORTO"}
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {result.deadIds.map((id) => (
            <div key={id} className="flex flex-col items-center gap-1">
              <RoleCard role={result.finalRoles[id]} size="md" flip />
              <p className="text-parchment">☠ {nameOf(id)}</p>
              <p className="text-sm text-parchment-dim">
                {voteTally[id]} voto{voteTally[id] > 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-pixel rounded-lg p-4">
        <h2 className="font-title mb-3 text-xs text-parchment">
          TODAS AS CARTAS
        </h2>
        <ul className="flex flex-col gap-2">
          {view.players.map((p) => {
            const original = result.originalRoles[p.id];
            const final = result.finalRoles[p.id];
            const changed = original !== final;
            return (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-md border-2 border-night-card bg-grave px-3 py-2"
              >
                <span className="truncate">
                  {result.deadIds.includes(p.id) ? "☠ " : ""}
                  {p.nickname}
                  {p.id === view.you.id ? " (você)" : ""}
                </span>
                <span className="shrink-0 text-right">
                  {changed && (
                    <span className="text-parchment-dim line-through">
                      {ROLES[original].name}
                    </span>
                  )}{" "}
                  <span className="text-ember">{ROLES[final].name}</span>
                  <span className="block text-sm text-parchment-dim">
                    {result.votes[p.id]
                      ? `votou em ${nameOf(result.votes[p.id])}`
                      : "—"}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mb-2 mt-4 text-parchment-dim">Centro no fim da noite:</p>
        <div className="flex justify-center gap-3">
          {result.center.length === 0 ? (
            <p className="text-parchment-dim">Vazio</p>
          ) : (
            result.center.map((role, i) => (
              <RoleCard key={i} role={role} size="sm" flip />
            ))
          )}
        </div>
      </section>

      {view.you.isHost ? (
        <button
          className="btn-pixel w-full rounded-md"
          disabled={busy}
          onClick={playAgain}
        >
          {busy ? "..." : "Jogar novamente"}
        </button>
      ) : (
        <p className="text-center text-parchment-dim">
          Aguardando o anfitrião começar outra partida...
        </p>
      )}
    </AppShell>
  );
}
