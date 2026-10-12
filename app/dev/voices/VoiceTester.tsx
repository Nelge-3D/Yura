"use client";

import { useEffect, useRef, useState } from "react";
import { getOrCreateSessionId } from "@/lib/uuid";
import { YURA_VOICE_CANDIDATES, GeminiVoice } from "@/lib/tts/voices";

const DEFAULT_PHRASE =
  "Mbolo ! Je suis là, prends le temps qu'il te faut. Ce que tu ressens est important.";

type Status = "idle" | "loading" | "playing" | "error";

export default function VoiceTester({ currentVoice }: { currentVoice: string | null }) {
  const [phrase, setPhrase] = useState(DEFAULT_PHRASE);
  const [status, setStatus] = useState<Partial<Record<GeminiVoice, Status>>>({});
  const [errors, setErrors] = useState<Partial<Record<GeminiVoice, string>>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Cache voix + phrase → URL blob, pour réécouter sans régénérer
  const cacheRef = useRef(new Map<string, string>());

  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      audioRef.current?.pause();
      cache.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const stopAll = () => {
    audioRef.current?.pause();
    setStatus((s) => {
      const next = { ...s };
      for (const k of Object.keys(next) as GeminiVoice[]) if (next[k] === "playing") next[k] = "idle";
      return next;
    });
  };

  const play = async (voice: GeminiVoice) => {
    if (status[voice] === "playing") {
      stopAll();
      return;
    }
    stopAll();
    // Créé pendant le clic : iOS Safari autorise ensuite la lecture
    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;

    const key = `${voice}|${phrase}`;
    let url = cacheRef.current.get(key);
    if (!url) {
      setStatus((s) => ({ ...s, [voice]: "loading" }));
      setErrors((e) => ({ ...e, [voice]: undefined }));
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: phrase, uuid: getOrCreateSessionId(), voice }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(`HTTP ${res.status} ${body.error ?? ""}`.trim());
        }
        url = URL.createObjectURL(await res.blob());
        cacheRef.current.set(key, url);
      } catch (err) {
        setStatus((s) => ({ ...s, [voice]: "error" }));
        setErrors((e) => ({ ...e, [voice]: err instanceof Error ? err.message : "Erreur inconnue" }));
        return;
      }
    }

    audio.src = url;
    audio.onended = () => setStatus((s) => ({ ...s, [voice]: "idle" }));
    setStatus((s) => ({ ...s, [voice]: "playing" }));
    try {
      await audio.play();
    } catch (err) {
      setStatus((s) => ({ ...s, [voice]: "error" }));
      setErrors((e) => ({ ...e, [voice]: err instanceof Error ? err.message : "Lecture impossible" }));
    }
  };

  return (
    <main style={{ minHeight: "100dvh", background: "#0f1a14", color: "#e8efe9", padding: "24px 16px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Page de développement — absente en production</p>
        <h1 style={{ fontSize: 22, margin: "6px 0 4px" }}>Choisir la voix de YURA</h1>
        <p style={{ fontSize: 14, opacity: 0.75, margin: "0 0 16px" }}>
          Voix actuelle (GEMINI_TTS_VOICE) : <strong>{currentVoice ?? "non définie"}</strong>
        </p>

        <label htmlFor="phrase" style={{ fontSize: 13, opacity: 0.75 }}>Phrase de test</label>
        <textarea
          id="phrase"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          rows={3}
          style={{
            width: "100%", marginTop: 6, marginBottom: 20, padding: 12, borderRadius: 12, fontSize: 15,
            background: "rgba(255,255,255,0.06)", color: "inherit", border: "1px solid rgba(255,255,255,0.15)",
            resize: "vertical", boxSizing: "border-box",
          }}
        />

        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {YURA_VOICE_CANDIDATES.map(({ voice, description }) => {
            const st = status[voice] ?? "idle";
            return (
              <li
                key={voice}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14,
                  background: voice === currentVoice ? "rgba(122,184,140,0.18)" : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <button
                  onClick={() => play(voice)}
                  disabled={st === "loading" || !phrase.trim()}
                  aria-label={st === "playing" ? `Arrêter ${voice}` : `Écouter ${voice}`}
                  style={{
                    width: 48, height: 48, flexShrink: 0, borderRadius: "50%", border: "none", fontSize: 16,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: st === "playing" ? "#7ab88c" : "rgba(122,184,140,0.3)", color: "#0f1a14",
                    cursor: st === "loading" ? "wait" : "pointer",
                  }}
                >
                  {st === "loading" ? (
                    "…"
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d={st === "playing" ? "M6 6h12v12H6z" : "M8 5v14l11-7z"} />
                    </svg>
                  )}
                </button>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>
                    {voice} {voice === currentVoice && <span style={{ fontSize: 12, opacity: 0.7 }}>(actuelle)</span>}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>{description}</div>
                  {st === "error" && (
                    <div style={{ fontSize: 12, color: "#f19999", marginTop: 2 }}>{errors[voice]}</div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
