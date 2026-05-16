"use client";

import { useState } from "react";

const SLIDES = [
  {
    icon: "🌿",
    title: "Mbolo, je suis YURA",
    body: "Une intelligence artificielle d'écoute émotionnelle, ancrée dans la culture gabonaise. Je suis là pour t'accompagner, sans jugement et en toute confidentialité.",
    sub: "Aucune inscription requise",
  },
  {
    icon: "💬",
    title: "Comment ça marche ?",
    body: "Tu parles, j'écoute. Je m'adapte à ce que tu ressens en temps réel et je t'accompagne doucement vers des professionnels quand c'est nécessaire.",
    sub: "Voix disponible · Micro optionnel",
  },
  {
    icon: "🔒",
    title: "Ta vie privée, protégée",
    body: "Tes conversations restent sur ton appareil. Aucune donnée nominative n'est collectée. Tu es libre d'arrêter à tout moment.",
    sub: "Confidentiel · Anonyme · Gratuit",
  },
];

const ACCENT = "#2D6A4F";
const DOT = "#52B788";
const BG = "#0D1F1A";
const TEXT = "#D8F3DC";
const MUTED = "#52796F";

interface Props {
  onDone: () => void;
}

export default function Onboarding({ onDone }: Props) {
  const [slide, setSlide] = useState(0);
  const isLast = slide === SLIDES.length - 1;
  const s = SLIDES[slide];

  const next = () => {
    if (isLast) {
      if (typeof window !== "undefined") {
        localStorage.setItem("yura_onboarded", "1");
      }
      onDone();
    } else {
      setSlide((p) => p + 1);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: BG,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      {/* Dots indicateurs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 48 }}>
        {SLIDES.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === slide ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === slide ? DOT : `${ACCENT}50`,
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      {/* Contenu slide */}
      <div
        key={slide}
        style={{
          textAlign: "center",
          maxWidth: 340,
          animation: "fadeSlide 0.35s ease-out",
        }}
      >
        <div style={{ fontSize: 72, marginBottom: 28, lineHeight: 1 }}>{s.icon}</div>
        <h1
          style={{
            color: TEXT,
            fontSize: 26,
            fontWeight: 700,
            margin: "0 0 16px",
            lineHeight: 1.2,
          }}
        >
          {s.title}
        </h1>
        <p
          style={{
            color: "#95C8A8",
            fontSize: 16,
            lineHeight: 1.7,
            margin: "0 0 20px",
          }}
        >
          {s.body}
        </p>
        <span
          style={{
            display: "inline-block",
            padding: "6px 14px",
            background: `${ACCENT}30`,
            border: `1px solid ${ACCENT}50`,
            borderRadius: 100,
            color: MUTED,
            fontSize: 12,
          }}
        >
          {s.sub}
        </span>
      </div>

      {/* Boutons */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 32,
          right: 32,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          alignItems: "center",
        }}
      >
        <button
          onClick={next}
          style={{
            width: "100%",
            maxWidth: 340,
            padding: "16px 0",
            background: ACCENT,
            color: TEXT,
            border: "none",
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
        >
          {isLast ? "Commencer" : "Suivant"}
        </button>

        {!isLast && (
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.setItem("yura_onboarded", "1");
              }
              onDone();
            }}
            style={{
              background: "transparent",
              border: "none",
              color: MUTED,
              fontSize: 14,
              cursor: "pointer",
              padding: "8px 0",
            }}
          >
            Passer
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
