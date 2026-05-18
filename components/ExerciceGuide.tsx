"use client";

import { useState, useEffect } from "react";
import { ColorTheme } from "@/lib/colorThemes";
import { ExerciceType } from "@/lib/emotionDetector";

interface Props {
  type: ExerciceType;
  onDone: () => void;
  currentTheme: ColorTheme;
}

// ─── Respiration 4-4-6 ────────────────────────────────────────────────────────

const BREATH_SCHEDULE = [
  { time: 0,     label: "Inspire...",        cycle: 1 },
  { time: 4000,  label: "Retiens...",        cycle: 1 },
  { time: 8000,  label: "Expire doucement...", cycle: 1 },
  { time: 14000, label: "Inspire...",        cycle: 2 },
  { time: 18000, label: "Retiens...",        cycle: 2 },
  { time: 22000, label: "Expire doucement...", cycle: 2 },
  { time: 28000, label: "Inspire...",        cycle: 3 },
  { time: 32000, label: "Retiens...",        cycle: 3 },
  { time: 36000, label: "Expire doucement...", cycle: 3 },
];

function Respiration({ onDone, theme }: { onDone: () => void; theme: ColorTheme }) {
  const [label, setLabel] = useState("Inspire...");
  const [cycle, setCycle] = useState(1);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timers = BREATH_SCHEDULE.map(({ time, label: l, cycle: c }) =>
      setTimeout(() => { setLabel(l); setCycle(c); }, time)
    );
    const doneTimer = setTimeout(() => setDone(true), 42000);
    return () => { timers.forEach(clearTimeout); clearTimeout(doneTimer); };
  }, []);

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "12px 0" }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🌿</div>
        <p style={{ color: theme.textPrimary, fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          Bien. Tu peux souffler.
        </p>
        <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: 16 }}>
          Comment tu te sens maintenant ?
        </p>
        <button
          onClick={onDone}
          style={{ padding: "10px 28px", background: theme.accent, color: theme.textPrimary, border: "none", borderRadius: 12, fontSize: 14, cursor: "pointer" }}
        >
          Continuer
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "4px 0" }}>
      <p style={{ color: theme.textMuted, fontSize: 12 }}>Cycle {cycle} / 3</p>
      <svg viewBox="0 0 160 160" width="148" height="148" aria-hidden="true">
        {/* Piste externe */}
        <circle cx="80" cy="80" r="72" fill="none" stroke={`${theme.accent}22`} strokeWidth="1.5" />
        {/* Groupe animé */}
        <g style={{ transformOrigin: "80px 80px", animation: "yura-breathe 14s ease-in-out 3 both" }}>
          <circle cx="80" cy="80" r="60" fill={`${theme.accent}20`} />
          <circle cx="80" cy="80" r="48" fill={`${theme.accent}38`} />
          <circle cx="80" cy="80" r="34" fill={theme.dotColor} opacity="0.82" />
        </g>
      </svg>
      <p style={{ color: theme.textPrimary, fontSize: 17, fontWeight: 600, letterSpacing: "0.01em" }}>
        {label}
      </p>
      <style>{`
        @keyframes yura-breathe {
          0%       { transform: scale(0.38); }
          28.571%  { transform: scale(1); }
          57.143%  { transform: scale(1); }
          100%     { transform: scale(0.38); }
        }
      `}</style>
    </div>
  );
}

// ─── Ancrage 5-4-3-2-1 ───────────────────────────────────────────────────────

const ANCHOR_STEPS = [
  { count: 5, prompt: "Dis-moi 5 choses que tu vois autour de toi.", icon: "👁️" },
  { count: 4, prompt: "Dis-moi 4 choses que tu peux toucher.", icon: "✋" },
  { count: 3, prompt: "Dis-moi 3 sons que tu entends en ce moment.", icon: "👂" },
  { count: 2, prompt: "Dis-moi 2 odeurs que tu perçois.", icon: "👃" },
  { count: 1, prompt: "Dis-moi 1 chose que tu goûtes ou ressens dans ta bouche.", icon: "👄" },
];

function Ancrage({ onDone, theme }: { onDone: () => void; theme: ColorTheme }) {
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");
  const [validated, setValidated] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const handleValidate = () => {
    if (!text.trim()) return;
    setValidated(true);
    setTimeout(() => {
      if (step < ANCHOR_STEPS.length - 1) {
        setStep((s) => s + 1);
        setText("");
        setValidated(false);
      } else {
        setAllDone(true);
      }
    }, 700);
  };

  if (allDone) {
    return (
      <div style={{ textAlign: "center", padding: "12px 0" }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🌿</div>
        <p style={{ color: theme.textPrimary, fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          Tu es ici. Tu es en sécurité.
        </p>
        <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: 16 }}>
          Tu viens de ramener ton esprit au présent.
        </p>
        <button
          onClick={onDone}
          style={{ padding: "10px 28px", background: theme.accent, color: theme.textPrimary, border: "none", borderRadius: 12, fontSize: 14, cursor: "pointer" }}
        >
          Continuer
        </button>
      </div>
    );
  }

  const current = ANCHOR_STEPS[step];

  return (
    <div>
      {/* Progression */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 14 }}>
        {ANCHOR_STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: i <= step ? theme.dotColor : `${theme.accent}28`,
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 26 }}>{current.icon}</span>
        <p style={{ color: theme.textPrimary, fontSize: 14, lineHeight: 1.55, marginTop: 8 }}>
          {current.prompt}
        </p>
      </div>
      {!validated ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleValidate(); } }}
            placeholder="Écris ta réponse…"
            rows={2}
            style={{
              width: "100%",
              background: `${theme.accent}14`,
              border: `1px solid ${theme.accent}35`,
              borderRadius: 12,
              padding: "10px 12px",
              color: theme.textPrimary,
              fontSize: 14,
              resize: "none",
              outline: "none",
              marginBottom: 10,
            }}
          />
          <button
            onClick={handleValidate}
            disabled={!text.trim()}
            style={{
              width: "100%",
              padding: "11px",
              background: text.trim() ? theme.accent : `${theme.accent}28`,
              color: theme.textPrimary,
              border: "none",
              borderRadius: 12,
              fontSize: 14,
              cursor: text.trim() ? "pointer" : "not-allowed",
              opacity: text.trim() ? 1 : 0.5,
              transition: "all 0.2s",
            }}
          >
            Valider →
          </button>
        </>
      ) : (
        <p style={{ color: theme.dotColor, fontSize: 14, textAlign: "center", padding: "10px 0" }}>
          ✓ Bien noté.
        </p>
      )}
    </div>
  );
}

// ─── Défusion cognitive ───────────────────────────────────────────────────────

function Defusion({ onDone, theme }: { onDone: () => void; theme: ColorTheme }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [thought, setThought] = useState("");

  const btnStyle = (active: boolean) => ({
    width: "100%",
    padding: "11px",
    background: active ? theme.accent : `${theme.accent}28`,
    color: theme.textPrimary,
    border: "none",
    borderRadius: 12,
    fontSize: 14,
    cursor: active ? "pointer" : "not-allowed",
    opacity: active ? 1 : 0.5,
    transition: "all 0.2s",
  });

  if (step === 0) {
    return (
      <div>
        <p style={{ color: theme.textPrimary, fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
          Écris une pensée qui t'envahit en ce moment.
        </p>
        <textarea
          value={thought}
          onChange={(e) => setThought(e.target.value)}
          placeholder="La pensée qui revient…"
          rows={2}
          style={{
            width: "100%",
            background: `${theme.accent}14`,
            border: `1px solid ${theme.accent}35`,
            borderRadius: 12,
            padding: "10px 12px",
            color: theme.textPrimary,
            fontSize: 14,
            resize: "none",
            outline: "none",
            marginBottom: 10,
          }}
        />
        <button onClick={() => { if (thought.trim()) setStep(1); }} disabled={!thought.trim()} style={btnStyle(!!thought.trim())}>
          Continuer →
        </button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div style={{ textAlign: "center" }}>
        <p style={{ color: theme.textMuted, fontSize: 12, marginBottom: 10 }}>
          Maintenant, lis cette phrase à voix haute :
        </p>
        <div style={{ background: `${theme.accent}14`, border: `1px solid ${theme.accent}30`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
          <p style={{ color: theme.textPrimary, fontSize: 15, fontStyle: "italic", lineHeight: 1.65, margin: 0 }}>
            &ldquo;J&apos;ai la pensée que… <strong>{thought.trim()}</strong>&rdquo;
          </p>
        </div>
        <p style={{ color: theme.textMuted, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
          Remarques-tu la différence ? Tu n&apos;es pas cette pensée — tu l&apos;observes.
        </p>
        <button onClick={() => setStep(2)} style={{ padding: "10px 28px", background: theme.accent, color: theme.textPrimary, border: "none", borderRadius: 12, fontSize: 14, cursor: "pointer" }}>
          Je vois →
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>🌿</div>
      <p style={{ color: theme.textPrimary, fontSize: 14, lineHeight: 1.75, marginBottom: 16 }}>
        Tu n&apos;ES pas cette pensée. Tu l&apos;observes passer,
        comme un oiseau dans les arbres de la forêt.
        La forêt reste — les oiseaux passent.
      </p>
      <button
        onClick={onDone}
        style={{ padding: "10px 28px", background: theme.accent, color: theme.textPrimary, border: "none", borderRadius: 12, fontSize: 14, cursor: "pointer" }}
      >
        Continuer
      </button>
    </div>
  );
}

// ─── Wrapper ──────────────────────────────────────────────────────────────────

const TITLES: Record<ExerciceType, string> = {
  "respiration_4-4-6": "Respiration 4-4-6",
  "ancrage_5-4-3-2-1": "Ancrage 5-4-3-2-1",
  "defusion_cognitive": "Défusion cognitive",
};

export default function ExerciceGuide({ type, onDone, currentTheme }: Props) {
  return (
    <div
      style={{
        margin: "0 16px 8px",
        background: currentTheme.bgHeader,
        border: `1px solid ${currentTheme.accent}40`,
        borderRadius: 20,
        padding: "16px",
        boxShadow: `0 4px 24px ${currentTheme.accent}18`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <p style={{ color: currentTheme.textMuted, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
          Exercice · {TITLES[type]}
        </p>
        <button
          onClick={onDone}
          title="Passer"
          style={{ background: "transparent", border: "none", color: currentTheme.textMuted, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "2px 6px" }}
        >
          ×
        </button>
      </div>
      {type === "respiration_4-4-6" && <Respiration onDone={onDone} theme={currentTheme} />}
      {type === "ancrage_5-4-3-2-1" && <Ancrage onDone={onDone} theme={currentTheme} />}
      {type === "defusion_cognitive" && <Defusion onDone={onDone} theme={currentTheme} />}
    </div>
  );
}
