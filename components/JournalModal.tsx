"use client";

import { useEffect, useState } from "react";
import { getJournal, effacerJournal, EntreeJournal } from "@/lib/journal";
import { getLast7Days } from "@/lib/moodLog";
import { getPhrases, supprimerPhrase, effacerPhrases, partagerPhrase, PhraseYURA } from "@/lib/phrases";
import { getTheme } from "@/lib/colorThemes";
import { EtatEmotionnel } from "@/lib/emotionDetector";
import { ColorTheme } from "@/lib/colorThemes";

interface Props {
  onClose: () => void;
  currentTheme: ColorTheme;
}

const EMOTION_LABEL: Record<EtatEmotionnel, string> = {
  neutre: "Neutre",
  calme: "Calme",
  anxieux: "Anxieux·se",
  triste: "Triste",
  en_colere: "En colère",
  joy: "Bien-être",
  crise: "Crise",
};

// Score pour positionner sur le graphique (0 = bas, 100 = haut)
const EMOTION_SCORE: Record<EtatEmotionnel, number> = {
  crise: 5,
  en_colere: 22,
  triste: 35,
  anxieux: 48,
  neutre: 60,
  calme: 78,
  joy: 95,
};

function formatDate(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function JournalModal({ onClose, currentTheme }: Props) {
  const [sessions, setSessions] = useState<EntreeJournal[]>([]);
  const [days, setDays] = useState<{ date: string; label: string; emotion: EtatEmotionnel | null }[]>([]);
  const [phrases, setPhrases] = useState<PhraseYURA[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setSessions([...getJournal()].reverse().slice(0, 10));
    setDays(getLast7Days());
    setPhrases([...getPhrases()].reverse().slice(0, 20));
  }, []);

  const handleClear = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    effacerJournal();
    effacerPhrases();
    setSessions([]);
    setPhrases([]);
    setConfirmClear(false);
  };

  const handleDeletePhrase = (id: string) => {
    supprimerPhrase(id);
    setPhrases((prev) => prev.filter((p) => p.id !== id));
  };

  const hasSessions = sessions.length > 0;
  const hasChart = days.some((d) => d.emotion !== null);

  // SVG line chart
  const CHART_W = 320;
  const CHART_H = 72;
  const PAD = 12;
  const innerW = CHART_W - PAD * 2;
  const innerH = CHART_H - PAD * 2;

  const chartPoints = days
    .map((day, i) => {
      if (!day.emotion) return null;
      const x = PAD + (i / 6) * innerW;
      const y = PAD + innerH - (EMOTION_SCORE[day.emotion] / 100) * innerH;
      return { x, y, emotion: day.emotion };
    });

  const validPoints = chartPoints.filter(Boolean) as { x: number; y: number; emotion: EtatEmotionnel }[];
  const pathD = validPoints.length > 1
    ? validPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")
    : null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: currentTheme.bgHeader, border: `1px solid ${currentTheme.accent}40`, borderRadius: 24, padding: 24, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ color: currentTheme.textPrimary, fontSize: 17, fontWeight: 700, margin: 0 }}>
              📔 Journal de progression
            </h2>
            <p style={{ color: currentTheme.textMuted, fontSize: 12, margin: "3px 0 0" }}>
              Tes données restent sur ton appareil
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: `${currentTheme.accent}20`, border: "none", borderRadius: 12, width: 36, height: 36, color: currentTheme.textMuted, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ×
          </button>
        </div>

        {/* Graphique 7 jours */}
        {hasChart && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: currentTheme.textMuted, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
              7 derniers jours
            </p>
            <div style={{ background: `${currentTheme.accent}12`, borderRadius: 16, padding: "12px 8px 8px", border: `1px solid ${currentTheme.accent}20` }}>
              <svg width="100%" viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ overflow: "visible" }}>
                {/* Ligne de grille mi-hauteur */}
                <line x1={PAD} y1={CHART_H / 2} x2={CHART_W - PAD} y2={CHART_H / 2} stroke={`${currentTheme.accent}20`} strokeWidth="1" strokeDasharray="4,4" />
                {/* Courbe */}
                {pathD && (
                  <path d={pathD} fill="none" stroke={currentTheme.dotColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                )}
                {/* Points */}
                {chartPoints.map((pt, i) => {
                  const day = days[i];
                  const x = PAD + (i / 6) * innerW;
                  const isToday = day.date === new Date().toISOString().split("T")[0];
                  if (!pt) {
                    return (
                      <circle key={i} cx={x} cy={CHART_H / 2} r={3} fill={`${currentTheme.accent}30`} />
                    );
                  }
                  const theme = getTheme(pt.emotion);
                  return (
                    <g key={i}>
                      <circle cx={pt.x} cy={pt.y} r={isToday ? 6 : 4} fill={theme.dotColor} opacity="0.9" />
                      {isToday && <circle cx={pt.x} cy={pt.y} r={9} fill="none" stroke={theme.dotColor} strokeWidth="1.5" opacity="0.4" />}
                    </g>
                  );
                })}
              </svg>
              {/* Labels jours */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
                {days.map((day) => {
                  const isToday = day.date === new Date().toISOString().split("T")[0];
                  return (
                    <span key={day.date} style={{ fontSize: 10, color: isToday ? currentTheme.dotColor : currentTheme.textMuted, fontWeight: isToday ? 700 : 400 }}>
                      {isToday ? "Auj." : day.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Sessions passées */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: currentTheme.textMuted, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
            Sessions récentes
          </p>
          {!hasSessions ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🌱</div>
              <p style={{ color: currentTheme.textMuted, fontSize: 13 }}>
                Tes sessions apparaîtront ici au fil du temps.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sessions.map((s, i) => {
                const debutTheme = getTheme(s.etatDebut);
                const finTheme = getTheme(s.etatFin);
                return (
                  <div
                    key={i}
                    style={{ background: `${currentTheme.accent}10`, border: `1px solid ${currentTheme.accent}20`, borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ color: currentTheme.textPrimary, fontSize: 13, fontWeight: 600, margin: 0 }}>
                        {formatDate(s.date)}
                      </p>
                      <p style={{ color: currentTheme.textMuted, fontSize: 11, margin: "2px 0 0" }}>
                        {s.nbMessages} messages · {s.dureeMinutes} min
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span title={EMOTION_LABEL[s.etatDebut]} style={{ fontSize: 16 }}>{debutTheme.icon}</span>
                      <span style={{ color: currentTheme.textMuted, fontSize: 11 }}>→</span>
                      <span title={EMOTION_LABEL[s.etatFin]} style={{ fontSize: 16 }}>{finTheme.icon}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Phrases sauvegardées */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: currentTheme.textMuted, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
            Phrases qui m&apos;ont aidé(e)
          </p>
          {phrases.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <p style={{ color: currentTheme.textMuted, fontSize: 13 }}>
                Appuie sur 🤍 sous une réponse de YURA pour la garder ici.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {phrases.map((p) => (
                <div
                  key={p.id}
                  style={{ background: `${currentTheme.accent}10`, border: `1px solid ${currentTheme.accent}20`, borderRadius: 14, padding: "12px 14px" }}
                >
                  <p style={{ color: currentTheme.textPrimary, fontSize: 13, lineHeight: 1.6, margin: "0 0 10px", fontStyle: "italic" }}>
                    &ldquo;{p.texte}&rdquo;
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: currentTheme.textMuted, fontSize: 11 }}>{formatDate(p.date)}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => partagerPhrase(p.texte, currentTheme.bgMain, currentTheme.textPrimary, currentTheme.dotColor)}
                        style={{ background: `${currentTheme.accent}20`, border: "none", borderRadius: 8, padding: "5px 10px", color: currentTheme.textSecondary, fontSize: 12, cursor: "pointer" }}
                      >
                        Partager
                      </button>
                      <button
                        onClick={() => handleDeletePhrase(p.id)}
                        style={{ background: "transparent", border: "none", color: currentTheme.textMuted, fontSize: 16, cursor: "pointer", padding: "2px 6px", lineHeight: 1 }}
                        title="Supprimer"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bouton effacer */}
        {hasSessions && (
          <button
            onClick={handleClear}
            style={{ width: "100%", padding: "10px", background: confirmClear ? "#DC262620" : "transparent", border: `1px solid ${confirmClear ? "#DC2626" : currentTheme.accent + "40"}`, borderRadius: 12, color: confirmClear ? "#DC2626" : currentTheme.textMuted, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}
          >
            {confirmClear ? "⚠️ Confirmer la suppression" : "Effacer mon journal"}
          </button>
        )}
        {confirmClear && (
          <button
            onClick={() => setConfirmClear(false)}
            style={{ width: "100%", marginTop: 8, padding: "10px", background: "transparent", border: "none", color: currentTheme.textMuted, fontSize: 13, cursor: "pointer" }}
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
