"use client";

import {
  NIGHT_AUDIO_SRC,
  type SubtitleCue,
} from "@/lib/game/timeline";

/**
 * Night narration. Prefer `public/audio/monster.m4a`; fall back to pt-BR TTS
 * per timeline segment if the file is missing.
 */

let audioAvailable: boolean | null = null;

export async function checkNightAudio(): Promise<boolean> {
  if (audioAvailable !== null) return audioAvailable;
  try {
    const res = await fetch(NIGHT_AUDIO_SRC, { method: "HEAD" });
    const type = res.headers.get("content-type") ?? "";
    audioAvailable =
      res.ok && (type.includes("audio") || type.includes("octet-stream") || type === "");
  } catch {
    audioAvailable = false;
  }
  return audioAvailable;
}

export function nightAudioSrc(): string {
  return NIGHT_AUDIO_SRC;
}

let voice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (voice) return voice;
  const voices = window.speechSynthesis?.getVoices() ?? [];
  voice =
    voices.find((v) => v.lang === "pt-BR") ??
    voices.find((v) => v.lang.startsWith("pt")) ??
    null;
  return voice;
}

export function speak(text: string) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  const v = pickVoice();
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
    pickVoice();
  };
}
