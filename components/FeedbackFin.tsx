"use client";

import { useState } from "react";
import { envoyerFeedback, FeedbackPayload } from "@/lib/feedback";
import { ColorTheme } from "@/lib/colorThemes";

interface Props {
  onDone: () => void;
  currentTheme: ColorTheme;
  sessionData: Omit<FeedbackPayload, "note" | "commentaire">;
}

const NOTES = [
  { note: 1 as const, emoji: "👍", label: "Oui, ça m'a aidé(e)" },
  { note: 2 as const, emoji: "😐", label: "Bien mais…" },
  { note: 3 as const, emoji: "👎", label: "Pas vraiment" },
];

export default function FeedbackFin({ onDone, currentTheme, sessionData }: Props) {
  const [note, setNote] = useState<1 | 2 | 3 | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!note || sending) return;
    setSending(true);
    await envoyerFeedback({ ...sessionData, note, commentaire: commentaire.trim() || undefined });
    setSent(true);
    setTimeout(onDone, 2200);
  };

  if (sent) {
    return (
      <div
        style={{
          margin: "0 16px 8px",
          background: currentTheme.bgHeader,
          border: `1px solid ${currentTheme.accent}40`,
          borderRadius: 20,
          padding: "20px 16px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>🌿</div>
        <p style={{ color: currentTheme.textPrimary, fontSize: 14, fontWeight: 600, margin: 0 }}>
          Merci pour ton retour.
        </p>
        <p style={{ color: currentTheme.textMuted, fontSize: 13, marginTop: 4 }}>
          Il nous aide à améliorer YURA.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        margin: "0 16px 8px",
        background: currentTheme.bgHeader,
        border: `1px solid ${currentTheme.accent}40`,
        borderRadius: 20,
        padding: "16px",
        boxShadow: `0 4px 24px ${currentTheme.accent}14`,
      }}
    >
      {/* En-tête */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <p style={{ color: currentTheme.textPrimary, fontSize: 14, fontWeight: 600, margin: 0 }}>
          Cette conversation t&apos;a-t-elle aidé(e) ?
        </p>
        <button
          onClick={onDone}
          style={{ background: "transparent", border: "none", color: currentTheme.textMuted, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "2px 6px" }}
          title="Passer"
        >
          ×
        </button>
      </div>

      {/* Boutons note */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {NOTES.map(({ note: n, emoji, label }) => (
          <button
            key={n}
            onClick={() => setNote(n)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "10px 6px",
              background: note === n ? `${currentTheme.accent}35` : `${currentTheme.accent}12`,
              border: `1.5px solid ${note === n ? currentTheme.dotColor : currentTheme.accent + "30"}`,
              borderRadius: 14,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: 22 }}>{emoji}</span>
            <span style={{ color: currentTheme.textMuted, fontSize: 10, textAlign: "center", lineHeight: 1.3 }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Commentaire optionnel */}
      {note !== null && (
        <textarea
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          placeholder={note === 1 ? "Ce qui t'a le plus aidé(e)…" : "Ce qui manquait…"}
          rows={2}
          style={{
            width: "100%",
            background: `${currentTheme.accent}12`,
            border: `1px solid ${currentTheme.accent}30`,
            borderRadius: 12,
            padding: "9px 12px",
            color: currentTheme.textPrimary,
            fontSize: 13,
            resize: "none",
            outline: "none",
            marginBottom: 10,
          }}
        />
      )}

      {/* Bouton envoyer */}
      <button
        onClick={handleSend}
        disabled={!note || sending}
        style={{
          width: "100%",
          padding: "11px",
          background: note && !sending ? currentTheme.accent : `${currentTheme.accent}28`,
          color: currentTheme.textPrimary,
          border: "none",
          borderRadius: 12,
          fontSize: 14,
          cursor: note && !sending ? "pointer" : "not-allowed",
          opacity: note && !sending ? 1 : 0.5,
          transition: "all 0.2s",
          marginBottom: 8,
        }}
      >
        {sending ? "Envoi…" : "Envoyer anonymement"}
      </button>

      <p style={{ color: currentTheme.textMuted, fontSize: 11, textAlign: "center", margin: 0 }}>
        Aucune donnée personnelle collectée
      </p>
    </div>
  );
}
