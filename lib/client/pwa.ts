/** PWA install + notification helpers (client-only). */

const INSTALL_DISMISS_KEY = "monstros:install-dismissed";
const NOTIF_DISMISS_KEY = "monstros:notif-dismissed";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const ios = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || ios;
}

export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.matchMedia("(max-width: 820px)").matches;
  const ua = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return (coarse && narrow) || ua;
}

export function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function wasInstallDismissed(): boolean {
  try {
    return localStorage.getItem(INSTALL_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissInstall(): void {
  try {
    localStorage.setItem(INSTALL_DISMISS_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function wasNotifDismissed(): boolean {
  try {
    return localStorage.getItem(NOTIF_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissNotifPrompt(): void {
  try {
    localStorage.setItem(NOTIF_DISMISS_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}
