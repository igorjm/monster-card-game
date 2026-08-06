/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export const metadata = {
  title: "Sem conexão",
};

export default function OfflinePage() {
  return (
    <AppShell className="items-center justify-center gap-6 text-center">
      <img
        src="/art/logo.png"
        alt=""
        className="pixel-art w-40 max-w-[50vw]"
        draggable={false}
      />
      <h1 className="font-title text-sm text-ember">SEM CONEXÃO</h1>
      <p className="max-w-sm text-parchment-dim">
        Este jogo precisa de internet para salas multiplayer. Verifique sua
        conexão e tente de novo.
      </p>
      <Link href="/" className="btn-pixel btn-pixel--ember rounded-md">
        Tentar novamente
      </Link>
    </AppShell>
  );
}
