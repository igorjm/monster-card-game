/** Soft lobby / home ambience. Singleton so navigation does not restart the track. */

let audio: HTMLAudioElement | null = null;
let activeSrc = "";
let activeVolume = 0.18;
let unlocked = false;
let holders = 0;
let stopScheduled = false;
let fadeTimer: ReturnType<typeof setInterval> | null = null;
let gestureBound = false;
/** While > 0, lobby bed stays silent so voice chat isn’t drowned out. */
let voiceDucks = 0;

const AMBIENT_SOUND_KEY = "theme-game:ambient-sound";
const preferenceListeners = new Set<() => void>();
let ambientSoundOverride: boolean | null = null;

/** User preference for the home / lobby music. Defaults to on. */
export function isAmbientSoundOn(): boolean {
  if (typeof window === "undefined") return true;
  if (ambientSoundOverride !== null) return ambientSoundOverride;
  try {
    return localStorage.getItem(AMBIENT_SOUND_KEY) !== "0";
  } catch {
    return true;
  }
}

export function subscribeToAmbientSound(listener: () => void) {
  preferenceListeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== AMBIENT_SOUND_KEY) return;
    ambientSoundOverride = event.newValue !== "0";
    applyAmbientSoundPreference(ambientSoundOverride);
    listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    preferenceListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Apply a preference change immediately so a toggle click can unlock audio. */
export function setAmbientSoundOn(on: boolean) {
  ambientSoundOverride = on;
  try {
    localStorage.setItem(AMBIENT_SOUND_KEY, on ? "1" : "0");
  } catch {
    /* private mode */
  }
  applyAmbientSoundPreference(on);
  for (const listener of preferenceListeners) listener();
}

function getAudio(): HTMLAudioElement {
  if (!audio || audio.src !== new URL(activeSrc, window.location.href).href) {
    audio?.pause();
    audio = new Audio(activeSrc);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = activeVolume;
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
    if (holders > 0 && isAmbientSoundOn()) void playNow();
  };
  window.addEventListener("pointerdown", unlock, { once: true, passive: true });
  window.addEventListener("keydown", unlock, { once: true });
}

async function playNow() {
  const el = getAudio();
  clearFade();
  el.volume = voiceDucks > 0 ? 0 : activeVolume;
  try {
    await el.play();
    unlocked = true;
  } catch {
    bindGestureUnlock();
  }
}

function applyAmbientSoundPreference(on = isAmbientSoundOn()) {
  clearFade();
  if (!on) {
    audio?.pause();
    return;
  }
  if (holders > 0) void playNow();
}

/** Mute ambience while LiveKit voice is connected (lobby). */
export function duckAmbientForVoice() {
  voiceDucks += 1;
  if (audio) audio.volume = 0;
}

export function unduckAmbientForVoice() {
  voiceDucks = Math.max(0, voiceDucks - 1);
  if (voiceDucks === 0 && audio && holders > 0 && isAmbientSoundOn()) {
    audio.volume = activeVolume;
    if (audio.paused) void playNow();
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
      el.volume = activeVolume;
    }
  }, 40);
}

/** Keep ambience playing while at least one screen wants it (home / lobby). */
export function acquireAmbient(src: string, volume: number) {
  activeSrc = src;
  activeVolume = volume;
  holders += 1;
  stopScheduled = false;
  if (typeof window === "undefined") return;
  if (isAmbientSoundOn()) {
    void playNow();
    if (!unlocked) bindGestureUnlock();
  }
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
