"use client";

import { useEffect, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  Track,
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
} from "livekit-client";
import { apiPost, getPlayerToken } from "@/lib/client/identity";
import type { RoomView } from "@/lib/api/views";

type VoiceStatus = "idle" | "connecting" | "connected" | "error" | "unavailable";

/**
 * LiveKit audio room for the discussion phase.
 * Joins muted; player taps to unmute. Tears down on unmount / phase leave.
 */
export function DiscussionVoice({
  view,
  paused,
}: {
  view: RoomView;
  paused: boolean;
}) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [micOn, setMicOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speakers, setSpeakers] = useState<string[]>([]);
  const roomRef = useRef<Room | null>(null);
  const audioEls = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    roomRef.current = room;

    function attachTrack(
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) {
      if (track.kind !== Track.Kind.Audio) return;
      const key = `${participant.identity}:${publication.trackSid}`;
      let el = audioEls.current.get(key);
      if (!el) {
        el = track.attach() as HTMLAudioElement;
        el.autoplay = true;
        el.setAttribute("playsinline", "true");
        document.body.appendChild(el);
        audioEls.current.set(key, el);
      }
    }

    function detachTrack(
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) {
      const key = `${participant.identity}:${publication.trackSid}`;
      const el = audioEls.current.get(key);
      if (el) {
        track.detach(el);
        el.remove();
        audioEls.current.delete(key);
      }
    }

    function refreshSpeakers() {
      const names: string[] = [];
      for (const p of room.remoteParticipants.values()) {
        for (const pub of p.audioTrackPublications.values()) {
          if (pub.isSubscribed && !pub.isMuted && pub.track) {
            names.push(p.name || p.identity);
          }
        }
      }
      setSpeakers(names);
    }

    room
      .on(RoomEvent.TrackSubscribed, attachTrack)
      .on(RoomEvent.TrackUnsubscribed, detachTrack)
      .on(RoomEvent.TrackMuted, refreshSpeakers)
      .on(RoomEvent.TrackUnmuted, refreshSpeakers)
      .on(RoomEvent.ParticipantDisconnected, refreshSpeakers)
      .on(RoomEvent.Disconnected, () => {
        if (!cancelled) setStatus("idle");
      });

    async function connect() {
      setStatus("connecting");
      setError(null);
      try {
        const creds = await apiPost<{ url: string; token: string }>(
          `/api/rooms/${view.code}/voice`,
          { token: getPlayerToken() },
        );
        if (cancelled) return;
        await room.connect(creds.url, creds.token);
        // Join muted — user must opt in to speak.
        await room.localParticipant.setMicrophoneEnabled(false);
        if (cancelled) return;
        setMicOn(false);
        setStatus("connected");
        refreshSpeakers();
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erro ao conectar a voz.";
        if (msg.includes("não configurada") || msg.includes("503")) {
          setStatus("unavailable");
        } else {
          setStatus("error");
          setError(msg);
        }
      }
    }

    void connect();

    const els = audioEls.current;
    return () => {
      cancelled = true;
      for (const el of els.values()) {
        el.remove();
      }
      els.clear();
      void room.disconnect();
      roomRef.current = null;
    };
  }, [view.code]);

  // Host pause → force mute for everyone locally (and stop publishing).
  useEffect(() => {
    const room = roomRef.current;
    if (!room || status !== "connected") return;
    if (paused && micOn) {
      void room.localParticipant.setMicrophoneEnabled(false).then(() => {
        setMicOn(false);
      });
    }
  }, [paused, micOn, status]);

  async function toggleMic() {
    const room = roomRef.current;
    if (!room || status !== "connected" || paused) return;
    const next = !micOn;
    try {
      await room.localParticipant.setMicrophoneEnabled(next);
      setMicOn(next);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível acessar o microfone.",
      );
    }
  }

  if (status === "unavailable") {
    return (
      <section className="panel-pixel rounded-lg p-4 text-center text-parchment-dim">
        Voz em grupo ainda não está ligada neste servidor.
      </section>
    );
  }

  return (
    <section className="panel-pixel flex flex-col gap-3 rounded-lg p-4">
      <h2 className="font-title text-center text-xs text-ember">VOZ DA VILA</h2>
      <p className="text-center text-sm text-parchment-dim leading-snug">
        {status === "connecting"
          ? "Entrando na sala de voz..."
          : status === "connected"
            ? "Toque para falar. Os outros jogadores (celular ou PC) escutam juntos."
            : "Preparando voz..."}
      </p>

      <button
        type="button"
        className={`btn-pixel w-full rounded-md ${
          micOn ? "btn-pixel--ember" : "btn-pixel--ghost"
        }`}
        disabled={status !== "connected" || paused}
        onClick={toggleMic}
      >
        {status === "connecting"
          ? "Conectando..."
          : paused
            ? "Pausado"
            : micOn
              ? "Microfone ligado — toque para mutar"
              : "Falar (ligar microfone)"}
      </button>

      {speakers.length > 0 && (
        <p className="text-center text-sm text-parchment">
          Falando: {speakers.join(", ")}
        </p>
      )}
      {error && (
        <p className="shake text-center text-sm text-blood-bright">{error}</p>
      )}
    </section>
  );
}
