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
 * Mobile: offer one-tap install (Android) or guided Add to Home Screen (iOS).
 * Standalone PWA: offer enabling notifications.
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
    };
    window.addEventListener("beforeinstallprompt", onBip);

    const timer = window.setTimeout(() => {
      if (isStandalone()) {
        const perm = notificationPermission();
        if (
          perm === "default" &&
          !wasNotifDismissed() &&
          "Notification" in window
        ) {
          setKind("notifications");
        }
        return;
      }

      if (isMobileViewport() && !wasInstallDismissed()) {
        setKind("install");
      }
    }, 700);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBip);
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
        setStatus("Instalação cancelada. Você pode tentar de novo depois.");
      } else {
        setStatus(
          "Seu navegador não mostrou o instalador ainda. Use o menu → “Instalar app”.",
        );
      }
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
      <PixelModal title="INSTALAR APP" onClose={skipInstall}>
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
            ? "Jogue em tela cheia pela tela inicial — mais rápido e sem a barra do Safari."
            : "Instale o Monstros na tela inicial e jogue como um app, em tela cheia."}
        </p>
        {ios ? (
          <ol className="list-decimal space-y-2 pl-5 text-parchment-dim">
            <li>
              Toque em <span className="text-ember">Compartilhar</span> (ícone
              do quadrado com seta)
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
            {busy
              ? "Abrindo..."
              : deferred
                ? "Adicionar à tela inicial"
                : "Instalar app"}
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
