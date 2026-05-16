"use client";

import { useEffect, useState } from "react";
import { getLast7Days } from "@/lib/moodLog";
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
  anxieux: "Anxieux",
  triste: "Triste",
  en_colere: "En colère",
  joy: "Bien-être",
  crise: "Crise",
};

export default function MoodJournal({ onClose, currentTheme }: Props) {
  const [days, setDays] = useState<{ date: string; label: string; emotion: EtatEmotionnel | null }[]>([]);

  useEffect(() => {
    setDays(getLast7Days());
  }, []);

  const hasData = days.some((d) => d.emotion !== null);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: currentTheme.bgHeader,
          border: `1px solid ${currentTheme.accent}40`,
          borderRadius: 24,
          padding: 28,
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ color: currentTheme.textPrimary, fontSize: 18, fontWeight: 700, margin: 0 }}>
              Journal d&apos;humeur
            </h2>
            <p style={{ color: currentTheme.textMuted, fontSize: 12, margin: "4px 0 0" }}>
              Tes 7 derniers jours
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: `${currentTheme.accent}20`,
              border: "none",
              borderRadius: 12,
              width: 36,
              height: 36,
              color: currentTheme.textMuted,
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {!hasData ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
            <p style={{ color: currentTheme.textMuted, fontSize: 14 }}>
              Continue à parler avec YURA pour voir ton journal prendre vie.
            </p>
          </div>
        ) : (
          <>
            {/* Barres */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                height: 120,
                marginBottom: 8,
              }}
            >
              {days.map((day) => {
                const theme = day.emotion ? getTheme(day.emotion) : null;
                const isToday = day.date === new Date().toISOString().split("T")[0];
                return (
                  <div
                    key={day.date}
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}
                    title={day.emotion ? EMOTION_LABEL[day.emotion] : "Pas de données"}
                  >
                    <div
                      style={{
                        width: "100%",
                        borderRadius: "6px 6px 0 0",
                        height: day.emotion ? "80%" : "8%",
                        background: theme ? `${theme.dotColor}` : `${currentTheme.accent}20`,
                        opacity: day.emotion ? 1 : 0.3,
                        transition: "height 0.5s ease",
                        position: "relative",
                      }}
                    >
                      {day.emotion && (
                        <div style={{ position: "absolute", top: -24, left: "50%", transform: "translateX(-50%)", fontSize: 14 }}>
                          {theme?.icon}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: 2,
                        background: isToday ? currentTheme.dotColor : `${currentTheme.accent}30`,
                        marginTop: 2,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Labels jours */}
            <div style={{ display: "flex", gap: 8 }}>
              {days.map((day) => {
                const isToday = day.date === new Date().toISOString().split("T")[0];
                return (
                  <div
                    key={day.date}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      fontSize: 11,
                      color: isToday ? currentTheme.dotColor : currentTheme.textMuted,
                      fontWeight: isToday ? 700 : 400,
                    }}
                  >
                    {isToday ? "Auj." : day.label}
                  </div>
                );
              })}
            </div>

            {/* Légende */}
            <div
              style={{
                marginTop: 24,
                padding: "12px 16px",
                background: `${currentTheme.accent}10`,
                borderRadius: 12,
                border: `1px solid ${currentTheme.accent}20`,
              }}
            >
              <p style={{ color: currentTheme.textMuted, fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                Ton journal se remplit automatiquement au fil de vos conversations. Chaque barre représente ton état émotionnel dominant du jour.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
