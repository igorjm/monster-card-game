"use client";

/**
 * Night narration. Uses the real audio file at /audio/noite.mp3 when present;
 * otherwise falls back to pt-BR speech synthesis per timeline segment.
 */

let audioAvailable: boolean | null = null;

export async function checkNightAudio(): Promise<boolean> {
  if (audioAvailable !== null) return audioAvailable;
  try {
    const res = await fetch("/audio/noite.mp3", { method: "HEAD" });
    const type = res.headers.get("content-type") ?? "";
    audioAvailable = res.ok && type.includes("audio");
  } catch {
    audioAvailable = false;
  }
  return audioAvailable;
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

// Voices load asynchronously in some browsers.
if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    voice = null;
    pickVoice();
  };
}
