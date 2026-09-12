"use client";

import { useState } from "react";
import type { RoomView } from "@/lib/api/views";
import { apiPost, getPlayerToken } from "@/lib/client/identity";

export function SafetyReport({ view }: { view: RoomView }) {
  const [open, setOpen] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    try {
      await apiPost(`/api/rooms/${view.code}/report`, {
        token: getPlayerToken(),
        playerId: playerId || undefined,
        category: "conduta-na-sala",
        details,
      });
      setMessage("Relato recebido. Em risco imediato, procure um adulto de confiança ou o serviço de emergência local.");
      setDetails("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar.");
    }
  }

  return (
    <details className="panel-pixel mx-auto mb-5 w-full max-w-md rounded-lg p-3" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="cursor-pointer text-center text-sm text-parchment-dim">Segurança e denúncia</summary>
      <p className="mt-3 text-sm text-parchment-dim">Não gravamos nem transcrevemos a conversa. Você pode sair, desligar mídia e relatar uma conduta.</p>
      <select className="input-pixel mt-3 rounded-md" value={playerId} onChange={(event) => setPlayerId(event.target.value)}>
        <option value="">Relato geral da sala</option>
        {view.players.filter((player) => player.id !== view.you.id).map((player) => (
          <option key={player.id} value={player.id}>{player.nickname}</option>
        ))}
      </select>
      <textarea className="input-pixel mt-3 min-h-24 rounded-md" maxLength={1000} placeholder="Descreva o ocorrido sem incluir dados sensíveis." value={details} onChange={(event) => setDetails(event.target.value)} />
      <button type="button" className="btn-pixel btn-pixel--ghost mt-3 w-full rounded-md" onClick={submit}>Enviar relato</button>
      {message ? <p className="mt-2 text-sm text-parchment-dim">{message}</p> : null}
    </details>
  );
}
