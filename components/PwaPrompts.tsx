"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useSyncExternalStore } from "react";
import { PixelModal } from "@/components/PixelModal";
import {
  type BeforeInstallPromptEvent,
  dismissInstall,
  dismissNotifPrompt,
  isIos,
  isMobileViewport,
  isStandalone,
  notificationPermission,
  wasInstallDismissed,
  wasNotifDismissed,
} from "@/lib/client/pwa";

type PromptKind = "install" | "notifications" | null;

function subscribeNoop() {
  return () => {};
}

/**
 * Mobile install + standalone notification prompts.
 *
 * Android/Chrome: one tap calls beforeinstallprompt → native “Add to Home screen”.
 * iOS Safari: Apple provides no install API — only Share → Add to Home Screen.
 */
export function PwaPrompts() {
  const ios = useSyncExternalStore(subscribeNoop, isIos, () => false);
  const [kind, setKind] = useState<PromptKind>(null);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      // Do not open the modal from here — decide() handles timing so we
      // never cover the join form while someone is typing.
    };
    const onInstalled = () => {
      dismissInstall();
      setDeferred(null);
      setKind(null);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);

    let showTimer: number | undefined;

    const decide = () => {
      if (isStandalone()) {
        const perm = notificationPermission();
        if (
          perm === "default" &&
          !wasNotifDismissed() &&
          "Notification" in window
        ) {
          // Don't block someone mid-join with the notifications sheet.
          const tag = document.activeElement?.tagName;
          if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") {
            showTimer = window.setTimeout(decide, 2500);
            return;
          }
          setKind("notifications");
        }
        return;
      }

      if (!isMobileViewport() || wasInstallDismissed()) return;

      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") {
        // User is typing nickname/code — wait until they're done.
        showTimer = window.setTimeout(decide, 2500);
        return;
      }

      // iOS: show guided modal (no install API).
      // Android: prefer waiting briefly for beforeinstallprompt so the CTA can
      // open the native installer in one tap.
      if (isIos()) {
        setKind("install");
        return;
      }

      showTimer = window.setTimeout(() => {
        const active = document.activeElement?.tagName;
        if (active === "INPUT" || active === "TEXTAREA") {
          showTimer = window.setTimeout(decide, 2500);
          return;
        }
        setKind("install");
      }, 2500);
    };

    // Give time to type nickname + room code before any overlay.
    const start = window.setTimeout(decide, 8000);

    return () => {
      window.clearTimeout(start);
      if (showTimer) window.clearTimeout(showTimer);
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function installApp() {
    setBusy(true);
    setStatus(null);
    try {
      if (deferred) {
        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        setDeferred(null);
        if (outcome === "accepted") {
          dismissInstall();
          setKind(null);
          return;
        }
        setStatus("Instalação cancelada. Toque de novo quando quiser.");
        return;
      }

      setStatus(
        "O instalador ainda não está pronto. No Chrome: menu ⋮ → “Instalar app” ou “Adicionar à tela inicial”.",
      );
    } finally {
      setBusy(false);
    }
  }

  function skipInstall() {
    dismissInstall();
    setKind(null);
  }

  async function enableNotifications() {
    setBusy(true);
    setStatus(null);
    try {
      const perm = await Notification.requestPermission();
      dismissNotifPrompt();
      if (perm === "granted") {
        const reg = await navigator.serviceWorker?.ready.catch(() => null);
        if (reg) {
          await reg.showNotification("Monstros", {
            body: "Notificações ligadas! Avisaremos quando fizer sentido na partida.",
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            tag: "monstros-welcome",
          });
        } else {
          new Notification("Monstros", {
            body: "Notificações ligadas!",
            icon: "/icons/icon-192.png",
          });
        }
        setKind(null);
      } else {
        setStatus(
          perm === "denied"
            ? "Permissão negada. Você pode ligar depois nas configurações do aparelho."
            : "Não foi possível ativar agora.",
        );
        if (perm === "denied") {
          window.setTimeout(() => setKind(null), 2200);
        }
      }
    } catch {
      setStatus("Seu aparelho não permite notificações neste modo.");
    } finally {
      setBusy(false);
    }
  }

  function skipNotif() {
    dismissNotifPrompt();
    setKind(null);
  }

  if (kind === "install") {
    return (
      <PixelModal title="TELA INICIAL" onClose={skipInstall}>
        <div className="flex justify-center">
          <img
            src="/art/logo.png"
            alt=""
            className="pixel-art w-24"
            draggable={false}
          />
        </div>
        <p className="text-center text-parchment-dim leading-snug">
          {ios
            ? "No iPhone a Apple não deixa apps adicionarem sozinhas. Use o Safari:"
            : "Um toque abre o instalador do Chrome e coloca o Monstros na tela inicial — como um app."}
        </p>
        {ios ? (
          <ol className="list-decimal space-y-2 pl-5 text-parchment-dim">
            <li>
              Toque em <span className="text-ember">Compartilhar</span> (quadrado
              com seta)
            </li>
            <li>
              Escolha{" "}
              <span className="text-parchment">Adicionar à Tela de Início</span>
            </li>
            <li>
              Confirme em <span className="text-parchment">Adicionar</span>
            </li>
          </ol>
        ) : null}
        {status && (
          <p className="text-center text-sm text-ember leading-snug">{status}</p>
        )}
        {!ios && (
          <button
            type="button"
            className="btn-pixel btn-pixel--ember w-full rounded-md"
            disabled={busy}
            onClick={installApp}
          >
            {busy ? "Abrindo instalador..." : "Adicionar à tela inicial"}
          </button>
        )}
        {ios && (
          <button
            type="button"
            className="btn-pixel btn-pixel--ember w-full rounded-md"
            onClick={() => {
              dismissInstall();
              setKind(null);
            }}
          >
            Já adicionei / Entendi
          </button>
        )}
        <button
          type="button"
          className="btn-pixel btn-pixel--ghost w-full rounded-md"
          onClick={skipInstall}
        >
          Agora não
        </button>
      </PixelModal>
    );
  }

  if (kind === "notifications") {
    return (
      <PixelModal title="NOTIFICAÇÕES" onClose={skipNotif}>
        <div className="flex justify-center">
          <img
            src="/art/logo.png"
            alt=""
            className="pixel-art w-24"
            draggable={false}
          />
        </div>
        <p className="text-center text-parchment-dim leading-snug">
          Ative avisos para não perder o início da noite, a votação ou quando a
          sala precisar de você.
        </p>
        {status && (
          <p className="text-center text-sm text-ember leading-snug">{status}</p>
        )}
        <button
          type="button"
          className="btn-pixel btn-pixel--ember w-full rounded-md"
          disabled={busy}
          onClick={enableNotifications}
        >
          {busy ? "Ativando..." : "Ativar notificações"}
        </button>
        <button
          type="button"
          className="btn-pixel btn-pixel--ghost w-full rounded-md"
          onClick={skipNotif}
        >
          Agora não
        </button>
      </PixelModal>
    );
  }

  return null;
}
