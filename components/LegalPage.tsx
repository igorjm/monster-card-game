import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell } from "./AppShell";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <AppShell wide className="gap-5">
      <h1 className="font-title text-center text-lg text-ember">{title}</h1>
      <article className="panel-pixel space-y-4 rounded-lg p-5 leading-relaxed text-parchment-dim">{children}</article>
      <Link href="/" className="btn-pixel btn-pixel--ghost rounded-md text-center">Voltar</Link>
    </AppShell>
  );
}
