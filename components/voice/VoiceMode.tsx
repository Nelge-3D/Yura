"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaybackState, TtsPlayer } from "@/lib/tts/player";
import VoiceOrb, { OrbMode } from "./VoiceOrb";

// Mode vocal plein écran : YURA écoute, répond à voix haute, puis réécoute, sans aucun clic.
// Les échanges sont ajoutés à la conversation texte comme d'habitude.

type Phase = "listening" | "thinking" | "speaking" | "paused";

// Après N écoutes sans parole, on se met en pause (évite le bip du micro en boucle sur Android)
const MAX_SILENT_ROUNDS = 2;

const CAPTIONS: Record<Phase, string> = {
  listening: "Je t'écoute…",
  thinking: "…",
  speaking: "",
  paused: "Touche le cercle pour parler",
};

interface Props {
  player: TtsPlayer;
  // État de la lecture en cours : « loading » pendant que Gemini génère l'audio
  playbackState: PlaybackState | null;
  // La réponse est lue phrase par phrase pendant qu'elle s'écrit ; spoken se résout à la fin de la lecture
  onSend: (text: string) => Promise<{ id: number; content: string; spoken: Promise<void> } | null>;
  onClose: () => void;
  showCrisis: boolean;
}

export default function VoiceMode({ player, playbackState, onSend, onClose, showCrisis }: Props) {
  const [phase, setPhaseState] = useState<Phase>("listening");
  const [transcript, setTranscript] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [orbSize, setOrbSize] = useState(260);

  const phaseRef = useRef<Phase>("listening");
  const activeRef = useRef(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silentRoundsRef = useRef(0);
  const onSendRef = useRef(onSend);
  const listenRef = useRef<() => void>(() => {});

  useEffect(() => {
    onSendRef.current = onSend;
  }, [onSend]);

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const stopRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      rec.onend = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.abort();
    }
  }, []);

  const respond = useCallback(
    async (text: string) => {
      setPhase("thinking");
      const reply = await onSendRef.current(text);
      if (!activeRef.current) return;
      if (!reply) {
        setNotice("Petit souci de connexion, je t'écoute à nouveau.");
        listenRef.current();
        return;
      }
      setPhase("speaking");
      setTranscript("");
      await reply.spoken;
      // Si l'utilisateur a mis en pause ou fermé pendant la lecture, on ne relance pas l'écoute
      if (activeRef.current && phaseRef.current === "speaking") listenRef.current();
    },
    [setPhase]
  );

  useEffect(() => {
    listenRef.current = () => {
      if (!activeRef.current) return;
      const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
      if (!SR) {
        setPhase("paused");
        setNotice("Ton navigateur ne permet pas la reconnaissance vocale.");
        return;
      }
      stopRecognition();
      const rec = new SR();
      rec.lang = "fr-FR";
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;

      let finalText = "";
      let fatal = false;
      rec.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        finalText = "";
        for (let i = 0; i < event.results.length; i++) {
          const r = event.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else interim += r[0].transcript;
        }
        setTranscript(`${finalText}${interim}`.trim());
      };
      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          fatal = true;
          setPhase("paused");
          setNotice("Le micro est bloqué. Autorise-le dans ton navigateur pour parler à YURA.");
        }
      };
      rec.onend = () => {
        recognitionRef.current = null;
        if (!activeRef.current || fatal || phaseRef.current !== "listening") return;
        const text = finalText.trim();
        if (text) {
          silentRoundsRef.current = 0;
          void respond(text);
        } else if (++silentRoundsRef.current >= MAX_SILENT_ROUNDS) {
          setPhase("paused");
        } else {
          listenRef.current();
        }
      };

      recognitionRef.current = rec;
      setPhase("listening");
      setTranscript("");
      try {
        rec.start();
      } catch {
        setPhase("paused");
      }
    };
  }, [respond, setPhase, stopRecognition]);

  // Démarrage et nettoyage
  useEffect(() => {
    activeRef.current = true;
    listenRef.current();
    // Place réservée au titre, au texte et au bouton fermer ; jamais moins de 120 px
    const resize = () =>
      setOrbSize(Math.round(Math.max(120, Math.min(window.innerWidth * 0.7, window.innerHeight - 240, 320))));
    resize();
    window.addEventListener("resize", resize);
    return () => {
      activeRef.current = false;
      window.removeEventListener("resize", resize);
      stopRecognition();
      player.stop();
    };
  }, [player, stopRecognition]);

  // Toucher le cercle : interrompre YURA, mettre l'écoute en pause ou la reprendre
  const handleOrbTap = () => {
    setNotice(null);
    const p = phaseRef.current;
    if (p === "speaking") {
      setPhase("listening");
      player.stop();
      listenRef.current();
    } else if (p === "listening") {
      stopRecognition();
      setPhase("paused");
    } else if (p === "paused") {
      silentRoundsRef.current = 0;
      listenRef.current();
    }
  };

  // Tant que l'audio se génère, l'orbe reste en mode « réflexion »
  // La voix démarre pendant que la réponse s'écrit : l'orbe parle dès que le son commence
  const orbMode: OrbMode =
    playbackState === "playing" && (phase === "speaking" || phase === "thinking")
      ? "speaking"
      : phase === "speaking" || phase === "thinking"
        ? "thinking"
        : phase === "listening"
          ? "listening"
          : "idle";
  const getLevel = useCallback(() => player.level(), [player]);

  const orbLabel =
    phase === "speaking"
      ? "Interrompre YURA"
      : phase === "listening"
        ? "Mettre l'écoute en pause"
        : phase === "paused"
          ? "Reprendre l'écoute"
          : "YURA réfléchit";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mode vocal avec YURA"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        background: "#000",
        color: "#D8F3DC",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "max(16px, env(safe-area-inset-top))",
        paddingBottom: "max(24px, env(safe-area-inset-bottom))",
      }}
    >
      {showCrisis && (
        <a
          href="tel:1300"
          style={{
            margin: "0 16px",
            padding: "12px 16px",
            borderRadius: 14,
            background: "#F5F0E8",
            color: "#DC2626",
            fontWeight: 700,
            fontSize: 15,
            textDecoration: "none",
            textAlign: "center",
            minHeight: 44,
          }}
        >
          📞 En danger ? Appelle le 1300 · SAMU Gabon · 24h/24
        </a>
      )}

      <p style={{ marginTop: 16, fontSize: 13, letterSpacing: 2, opacity: 0.6 }}>YURA</p>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>
        <button
          onClick={handleOrbTap}
          disabled={phase === "thinking"}
          aria-label={orbLabel}
          style={{ background: "none", border: "none", padding: 0, borderRadius: "50%", cursor: "pointer" }}
        >
          <VoiceOrb mode={orbMode} getLevel={getLevel} size={orbSize} />
        </button>

        <div aria-live="polite" style={{ minHeight: 72, maxWidth: 320, padding: "0 16px", textAlign: "center" }}>
          {transcript && phase !== "speaking" ? (
            <p style={{ fontSize: 17, lineHeight: 1.5, margin: 0 }}>{transcript}</p>
          ) : (
            <p style={{ fontSize: 15, margin: 0, opacity: 0.6 }}>{CAPTIONS[phase]}</p>
          )}
          {notice && <p style={{ fontSize: 13, marginTop: 8, color: "#95C8A8" }}>{notice}</p>}
        </div>
      </div>

      <button
        onClick={onClose}
        aria-label="Quitter le mode vocal"
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          background: "rgba(255,255,255,0.1)",
          color: "#D8F3DC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
    </div>
  );
}
