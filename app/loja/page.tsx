"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PRODUCT_CATALOG } from "@/lib/commercial/catalog";
import { apiGet, apiPost } from "@/lib/client/identity";
import type { ProductId } from "@/lib/commercial/types";
import { trackFunnel } from "@/lib/client/analytics";

const order: ProductId[] = ["remove-ads", "pack-studio-caos", "pack-orbita-sabotagem", "founders-bundle"];

export default function StorePage() {
  const [busy, setBusy] = useState<ProductId | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [owned, setOwned] = useState<ProductId[]>([]);
  const commerceEnabled = process.env.NEXT_PUBLIC_COMMERCIAL_RELEASE_ENABLED === "1";

  useEffect(() => {
    void apiGet<{ entitledProducts: ProductId[] }>("/api/account/profile")
      .then((profile) => setOwned(profile.entitledProducts))
      .catch(() => setOwned([]));
  }, []);

  async function checkout(productId: ProductId) {
    setBusy(productId);
    setMessage(null);
    try {
      trackFunnel("purchase_started", { productId });
      const result = await apiPost<{ checkoutUrl: string }>("/api/commerce/checkout", { productId });
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Compra indisponível.");
      setBusy(null);
    }
  }

  return (
    <AppShell wide className="gap-5">
      <header className="text-center">
        <p className="font-title text-xs text-ember">CATÁLOGO</p>
        <h1 className="font-title mt-2 text-lg text-parchment">Mesa Oculta</h1>
        <p className="mt-2 text-parchment-dim">O anfitrião compra uma vez; todas as pessoas da sala jogam sem pagar.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {order.map((id) => {
          const product = PRODUCT_CATALOG[id];
          const restored = owned.includes(id);
          return (
            <article key={id} className="panel-pixel rounded-lg p-4">
              <h2 className="font-title text-xs text-ember">{product.name}</h2>
              <p className="mt-2 text-xl text-parchment">R$ {(product.priceCents / 100).toFixed(2).replace(".", ",")}</p>
              <p className="mt-2 text-sm text-parchment-dim">
                {restored ? "Compra restaurada nesta conta." : product.availableForSale && commerceEnabled ? "Compra permanente da conta anfitriã." : "Em preparação — venda bloqueada até revisão jurídica e editorial."}
              </p>
              <button type="button" className="btn-pixel mt-3 w-full rounded-md" disabled={restored || busy !== null || !product.availableForSale || !commerceEnabled} onClick={() => checkout(id)}>
                {restored ? "Já pertence a você" : product.availableForSale && commerceEnabled ? (busy === id ? "Abrindo…" : "Comprar com Pix ou cartão") : "Em breve"}
              </button>
            </article>
          );
        })}
      </div>
      {message ? <p className="text-center text-blood-bright">{message}</p> : null}
      <p className="text-center text-sm text-parchment-dim">Sem assinatura, moedas, caixas aleatórias ou vantagens na partida.</p>
      <Link href="/" className="btn-pixel btn-pixel--ghost rounded-md text-center">Voltar</Link>
    </AppShell>
  );
}
