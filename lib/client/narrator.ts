"use client";

import type { SubtitleCue } from "@/lib/game/timeline";

/**
 * Night narration. Prefer `public/audio/monster.m4a`; fall back to pt-BR TTS
 * per timeline segment if the file is missing.
 */

const audioAvailability = new Map<string, boolean>();

export async function checkNightAudio(src?: string): Promise<boolean> {
  if (!src) return false;
  const cached = audioAvailability.get(src);
  if (cached !== undefined) return cached;
  try {
    const res = await fetch(src, { method: "HEAD" });
    const type = res.headers.get("content-type") ?? "";
    const available =
      res.ok && (type.includes("audio") || type.includes("octet-stream") || type === "");
    audioAvailability.set(src, available);
    return available;
  } catch {
    audioAvailability.set(src, false);
    return false;
  }
}

let voice: SpeechSynthesisVoice | null = null;

let voiceLocale = "";

function pickVoice(locale: string): SpeechSynthesisVoice | null {
  if (voice && voiceLocale === locale) return voice;
  const voices = window.speechSynthesis?.getVoices() ?? [];
  voice =
    voices.find((v) => v.lang === locale) ??
    voices.find((v) => v.lang.startsWith(locale.split("-")[0])) ??
    null;
  voiceLocale = locale;
  return voice;
}

export function speak(text: string, locale = "pt-BR") {
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  const v = pickVoice(locale);
  if (v) utterance.voice = v;
  utterance.rate = 0.95;
  utterance.pitch = 0.8;
  synth.speak(utterance);
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}

/** Prefer the live subtitle cue; fall back to the segment narration. */
export function displayCaption(
  subtitle: SubtitleCue | undefined,
  fallback: string | undefined,
): string {
  return subtitle?.text ?? fallback ?? "...";
}

// Voices load asynchronously in some browsers.
if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    voice = null;
    voiceLocale = "";
  };
}
