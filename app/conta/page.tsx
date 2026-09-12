"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { authClient, authAccessToken } from "@/lib/supabase/auth-client";

export default function AccountPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function signOut() {
    await authClient()?.auth.signOut();
    router.replace("/");
  }

  async function deleteAccount() {
    if (!window.confirm("Excluir definitivamente a conta, suas salas e progressão? Compras podem continuar nos registros fiscais da plataforma.")) return;
    const token = await authAccessToken();
    const response = await fetch("/api/account/profile", { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) {
      const body = await response.json();
      setMessage(body.error ?? "Não foi possível excluir.");
      return;
    }
    await authClient()?.auth.signOut();
    router.replace("/");
  }

  return <AppShell className="items-center justify-center gap-4 text-center">
    <h1 className="font-title text-lg text-ember">CONTA</h1>
    <p className="text-parchment-dim">Gerencie a sessão ou solicite a exclusão dos dados da conta.</p>
    <button type="button" className="btn-pixel btn-pixel--ghost w-full rounded-md" onClick={signOut}>Sair da conta</button>
    <button type="button" className="btn-pixel w-full rounded-md" onClick={deleteAccount}>Excluir minha conta</button>
    {message ? <p className="text-blood-bright">{message}</p> : null}
  </AppShell>;
}
