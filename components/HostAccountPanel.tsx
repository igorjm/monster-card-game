"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/supabase/auth-client";
import { apiGet, apiPost } from "@/lib/client/identity";
import type { HostAccessSummary } from "@/lib/commercial/types";

type Profile = HostAccessSummary & { email?: string };

export function HostAccountPanel({ onReady }: { onReady: (ready: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const client = authClient();
    if (!client) return;
    let mounted = true;
    const sync = async () => {
      try {
        const next = await apiGet<Profile>("/api/account/profile");
        if (mounted) setProfile(next);
      } catch {
        if (mounted) setProfile(null);
      }
    };
    void sync();
    const { data } = client.auth.onAuthStateChange(() => void sync());
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => onReady(Boolean(profile?.adultHost)), [onReady, profile?.adultHost]);

  async function sendOtp() {
    const client = authClient();
    if (!client || !email.trim()) return;
    setBusy(true);
    setMessage(null);
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setMessage(error ? error.message : "Enviamos um link seguro para o seu e-mail.");
    setBusy(false);
  }

  async function confirmAdult() {
    setBusy(true);
    try {
      const next = await apiPost<Profile>("/api/account/profile", {
        ageBand: "adult",
        confirmsAdult: true,
      });
      setProfile(next);
      setMessage("Conta adulta confirmada para hospedar salas.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha na confirmação.");
    } finally {
      setBusy(false);
    }
  }

  if (profile?.adultHost) {
    return (
      <section className="rounded-md border border-swamp/60 bg-night/60 p-3 text-sm">
        <p className="text-swamp-bright">Anfitrião adulto confirmado</p>
        <p className="mt-1 text-parchment-dim">{profile.email}</p>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-ember/60 bg-night/60 p-3">
      <p className="font-title text-[0.58rem] text-ember">CONTA DO ANFITRIÃO</p>
      {profile ? (
        <>
          <p className="mt-2 text-sm text-parchment-dim">
            Confirme que você é adulto para criar salas, controlar mídia e comprar mundos.
          </p>
          <button type="button" className="btn-pixel mt-3 w-full rounded-md" disabled={busy} onClick={confirmAdult}>
            Confirmo que sou adulto
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-parchment-dim">Convidados não precisam de conta. Só o anfitrião entra por e-mail.</p>
          <input
            className="input-pixel mt-3 rounded-md"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="button" className="btn-pixel mt-3 w-full rounded-md" disabled={busy || !email.trim()} onClick={sendOtp}>
            Receber link de acesso
          </button>
        </>
      )}
      {message ? <p className="mt-2 text-center text-sm text-parchment-dim">{message}</p> : null}
    </section>
  );
}
