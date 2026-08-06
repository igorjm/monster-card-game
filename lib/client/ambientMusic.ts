/** Soft lobby / home ambience. Singleton so navigation does not restart the track. */

export const AMBIENT_SRC = "/audio/background.mp3";
/** Quiet environment bed — not competing with night narration later. */
export const AMBIENT_VOLUME = 0.18;

let audio: HTMLAudioElement | null = null;
let unlocked = false;
let holders = 0;
let stopScheduled = false;
let fadeTimer: ReturnType<typeof setInterval> | null = null;
let gestureBound = false;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(AMBIENT_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = AMBIENT_VOLUME;
  }
  return audio;
}

function clearFade() {
  if (fadeTimer) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }
}

function bindGestureUnlock() {
  if (gestureBound || typeof window === "undefined") return;
  gestureBound = true;
  const unlock = () => {
    unlocked = true;
    if (holders > 0) void playNow();
  };
  window.addEventListener("pointerdown", unlock, { once: true, passive: true });
  window.addEventListener("keydown", unlock, { once: true });
}

async function playNow() {
  const el = getAudio();
  clearFade();
  el.volume = AMBIENT_VOLUME;
  try {
    await el.play();
    unlocked = true;
  } catch {
    bindGestureUnlock();
  }
}

function fadeOutAndStop() {
  const el = audio;
  if (!el) return;
  clearFade();
  if (el.paused) {
    el.currentTime = 0;
    return;
  }
  const start = el.volume;
  const steps = 8;
  let i = 0;
  fadeTimer = setInterval(() => {
    i += 1;
    el.volume = Math.max(0, start * (1 - i / steps));
    if (i >= steps) {
      clearFade();
      el.pause();
      el.currentTime = 0;
      el.volume = AMBIENT_VOLUME;
    }
  }, 40);
}

/** Keep ambience playing while at least one screen wants it (home / lobby). */
export function acquireAmbient() {
  holders += 1;
  stopScheduled = false;
  if (typeof window === "undefined") return;
  void playNow();
  if (!unlocked) bindGestureUnlock();
}

export function releaseAmbient() {
  holders = Math.max(0, holders - 1);
  if (holders > 0 || typeof window === "undefined") return;
  // Defer stop so home → lobby can re-acquire in the same tick without a gap.
  stopScheduled = true;
  queueMicrotask(() => {
    if (stopScheduled && holders === 0) {
      stopScheduled = false;
      fadeOutAndStop();
    }
  });
}
