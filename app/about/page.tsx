import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "À propos — YURA",
  description: "Qui est YURA ? Notre vision d'une santé mentale accessible et ancrée dans la culture gabonaise.",
};

const TEAM = [
  { name: "Louis Ngabi", role: "Fondateur & CEO", bio: "Entrepreneur tech engagé pour l'accès aux soins en Afrique centrale." },
];

const VALUES = [
  { icon: "🌿", title: "Ancrage culturel", desc: "YURA intègre la culture gabonaise — langues, proverbes, réalités locales — pour créer un espace d'écoute qui vous ressemble." },
  { icon: "🔒", title: "Confidentialité totale", desc: "Aucune donnée nominative n'est collectée. Les conversations restent sur votre appareil. Vous restez anonyme." },
  { icon: "🤝", title: "Pont vers les pros", desc: "YURA n'est pas un substitut au suivi professionnel. Elle accompagne et oriente vers les psychologues et psychiatres partenaires." },
  { icon: "🌍", title: "Accessibilité", desc: "Gratuit, sans inscription, disponible sur tous les appareils. Pensé pour le Gabon et toute l'Afrique centrale." },
];

const BG = "#0D1F1A";
const TEXT = "#D8F3DC";
const MUTED = "#52796F";
const ACCENT = "#2D6A4F";
const DOT = "#52B788";

export default function AboutPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: BG,
        color: TEXT,
        fontFamily: "var(--font-jakarta, sans-serif)",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: `1px solid ${ACCENT}30`,
          background: "#0A1A14",
        }}
      >
        <Link href="/" style={{ color: DOT, fontWeight: 700, fontSize: 18, textDecoration: "none" }}>
          🌿 YURA
        </Link>
        <Link
          href="/chat"
          style={{
            background: ACCENT,
            color: TEXT,
            padding: "10px 20px",
            borderRadius: 12,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Commencer
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "80px 24px 60px" }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🌿</div>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, margin: "0 0 16px", lineHeight: 1.15 }}>
          La santé mentale,<br />enfin accessible au Gabon
        </h1>
        <p style={{ color: "#95C8A8", fontSize: 18, maxWidth: 540, margin: "0 auto", lineHeight: 1.7 }}>
          YURA est une intelligence artificielle d&apos;écoute émotionnelle, ancrée dans la culture gabonaise.
          Elle accompagne les personnes vers les professionnels de santé mentale, sans jugement et en toute confidentialité.
        </p>
      </section>

      {/* Stats */}
      <section
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 24,
          flexWrap: "wrap",
          padding: "0 24px 80px",
        }}
      >
        {[
          { n: "1 / 4", label: "Gabonais souffrent de troubles mentaux sans prise en charge" },
          { n: "< 10", label: "Psychiatres pour 2,3 millions d'habitants" },
          { n: "0 €", label: "Coût d'accès à YURA pour les utilisateurs" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: `${ACCENT}15`,
              border: `1px solid ${ACCENT}30`,
              borderRadius: 20,
              padding: "28px 32px",
              textAlign: "center",
              minWidth: 200,
              flex: "1 1 200px",
              maxWidth: 280,
            }}
          >
            <div style={{ fontSize: 40, fontWeight: 800, color: DOT, marginBottom: 8 }}>{s.n}</div>
            <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.5 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Valeurs */}
      <section style={{ padding: "0 24px 80px", maxWidth: 860, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 40, textAlign: "center" }}>
          Nos valeurs
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {VALUES.map((v) => (
            <div
              key={v.title}
              style={{
                background: `${ACCENT}10`,
                border: `1px solid ${ACCENT}25`,
                borderRadius: 20,
                padding: 28,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{v.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 10px" }}>{v.title}</h3>
              <p style={{ color: "#95C8A8", fontSize: 14, lineHeight: 1.65, margin: 0 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Équipe */}
      <section style={{ padding: "0 24px 80px", maxWidth: 860, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 40, textAlign: "center" }}>
          L&apos;équipe
        </h2>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 20 }}>
          {TEAM.map((m) => (
            <div
              key={m.name}
              style={{
                background: `${ACCENT}10`,
                border: `1px solid ${ACCENT}25`,
                borderRadius: 20,
                padding: 28,
                textAlign: "center",
                minWidth: 220,
                maxWidth: 300,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: `${ACCENT}40`,
                  margin: "0 auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                }}
              >
                🧑🏾
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>{m.name}</h3>
              <p style={{ color: DOT, fontSize: 12, margin: "0 0 12px", fontWeight: 600 }}>{m.role}</p>
              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{m.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          textAlign: "center",
          padding: "60px 24px 80px",
          borderTop: `1px solid ${ACCENT}20`,
        }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 16 }}>
          Prêt(e) à être écouté(e) ?
        </h2>
        <p style={{ color: MUTED, marginBottom: 32, fontSize: 15 }}>
          Aucune inscription. Entièrement gratuit. Confidentiel.
        </p>
        <Link
          href="/chat"
          style={{
            display: "inline-block",
            background: ACCENT,
            color: TEXT,
            padding: "16px 40px",
            borderRadius: 16,
            textDecoration: "none",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          Parler à YURA
        </Link>
        <div style={{ marginTop: 24, display: "flex", gap: 24, justifyContent: "center" }}>
          <Link href="/privacy" style={{ color: MUTED, fontSize: 13, textDecoration: "none" }}>Confidentialité</Link>
          <Link href="/teleconsultation" style={{ color: MUTED, fontSize: 13, textDecoration: "none" }}>Téléconsultation</Link>
        </div>
      </section>
    </main>
  );
}
