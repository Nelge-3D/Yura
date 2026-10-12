"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import PwaInstallButton from "@/components/PwaInstallButton";

// L'orbe (WebGL) ne s'affiche que côté navigateur
const VoiceOrb = dynamic(() => import("@/components/voice/VoiceOrb"), { ssr: false });

// ─── Identité visuelle (ivoire + vert forêt) ──────────────────────────────────

const C = {
  ivory: "#FAF8F3",
  green: "#174C3C",
  green2: "#477A68",
  mint: "#E9F2ED",
  text: "#18221F",
  muted: "#66736D",
  warm: "#D99A62",
  urgent: "#C84E4E",
  line: "rgba(23,76,60,0.12)",
};

const SERIF = "var(--font-serif), Georgia, serif";

// ─── Icônes au trait (remplacent les émojis) ─────────────────────────────────

const ICONS = {
  leaf: "M5 19c0-8 5-14 14-14 0 9-6 14-14 14Zm0 0 7-7",
  shield: "M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z",
  mic: "M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-6 8a6 6 0 0 0 12 0M12 17v4",
  chat: "M4 5h16v11H9l-5 4V5Z",
  heart: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 5-5 2 2-5 5-2Z",
  people: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 9a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6m2 9a6 6 0 0 0-3-5",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z",
  arrow: "M5 12h14m-5-5 5 5-5 5",
} as const;

function Icon({ name, size = 22, color = "currentColor" }: { name: keyof typeof ICONS; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={ICONS[name]} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Apparition douce au défilement ──────────────────────────────────────────

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="home-reveal"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        height: "100%",
      }}
    >
      {children}
    </div>
  );
}

// ─── Données ─────────────────────────────────────────────────────────────────

// Humeurs du chat (EtatEmotionnel) : le choix est transmis à /chat via ?humeur=
const MOODS = [
  { label: "Ça va", humeur: "calme" },
  { label: "Stressé·e", humeur: "anxieux" },
  { label: "Triste", humeur: "triste" },
  { label: "En colère", humeur: "en_colere" },
  { label: "Je ne sais pas", humeur: null },
] as const;

const TRUST = [
  { icon: "shield", title: "Sans compte", desc: "Aucune inscription, aucune identité demandée. Tu commences quand tu veux, tu arrêtes quand tu veux." },
  { icon: "mic", title: "Écris ou parle", desc: "À l'écrit, ou à voix haute avec le mode vocal. Jour et nuit, à ton rythme." },
  { icon: "leaf", title: "Pensé pour le Gabon", desc: "Des mots, des proverbes et des repères qui parlent de chez nous." },
] as const;

const SITUATIONS = [
  { feel: "Stress, anxiété", help: "Poser ce que tu ressens et respirer avec un exercice guidé.", humeur: "anxieux" },
  { feel: "Solitude", help: "Trouver un espace pour parler, à n'importe quelle heure.", humeur: "triste" },
  { feel: "Tristesse, deuil", help: "Être écouté·e sans jugement, sans devoir te justifier.", humeur: "triste" },
  { feel: "Relations, famille", help: "Prendre du recul sur ce qui se passe et y voir plus clair.", humeur: null },
  { feel: "Besoin d'aide humaine", help: "Être orienté·e vers l'aide adaptée, et vers les urgences si besoin.", humeur: null },
] as const;

const JOURNEY = [
  { num: "01", icon: "chat", title: "Parle", desc: "Dis ce qui te pèse, avec tes mots. YURA écoute et te pose les bonnes questions." },
  { num: "02", icon: "heart", title: "Comprends", desc: "Exercices de respiration et d'ancrage, journal d'humeur : des outils simples pour aller mieux." },
  { num: "03", icon: "compass", title: "Obtiens de l'aide", desc: "Quand c'est nécessaire, YURA t'oriente vers des personnes qui peuvent t'aider." },
] as const;

function chatHref(humeur: string | null) {
  return humeur ? `/chat?humeur=${humeur}` : "/chat";
}

// ─── Aperçu du chat (premier écran) ──────────────────────────────────────────

function ChatPreview() {
  return (
    <div className="home-preview" aria-label="Aperçu d'une conversation avec YURA">
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 14, borderBottom: `1px solid ${C.line}` }}>
        <div
          style={{
            width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
            background: `conic-gradient(from 0deg, ${C.green}, ${C.green2}, ${C.warm}, ${C.green})`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{ width: 26, height: 26, borderRadius: "50%", background: C.ivory, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 11, color: C.green }}>
            Yu
          </span>
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: C.text }}>YURA</p>
          <p style={{ margin: 0, fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green2 }} />
            Écoute confidentielle
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "18px 0" }}>
        <div className="home-bubble">Mbolo. Je suis là, prends le temps qu&apos;il te faut.</div>
        <div className="home-bubble">Comment te sens-tu aujourd&apos;hui ?</div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {MOODS.map((m) => (
          <Link key={m.label} href={chatHref(m.humeur)} className="home-chip">
            {m.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomeClient() {
  return (
    <main style={{ minHeight: "100dvh", background: C.ivory, color: C.text, overflowX: "hidden" }}>
      {/* ══ EN-TÊTE ══ */}
      <header className="home-header">
        <Link href="/" className="tap-target" style={{ gap: 10, textDecoration: "none", color: C.green }}>
          <span style={{ width: 30, height: 30, borderRadius: "50%", background: C.green, color: C.ivory, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="leaf" size={16} />
          </span>
          <span style={{ fontFamily: SERIF, fontSize: 22, letterSpacing: "0.02em" }}>YURA</span>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/teleconsultation" className="tap-target home-nav-link">Professionnels</Link>
          <a href="tel:1300" className="tap-target home-urgent" aria-label="Urgence : appeler le 1300">
            <Icon name="phone" size={16} />
            <span className="home-urgent-label">Urgence&nbsp;:</span> 1300
          </a>
        </nav>
      </header>

      {/* ══ HERO ══ */}
      <section className="home-hero">
        <div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(2.6rem, 7vw, 4.6rem)", lineHeight: 1.05, letterSpacing: "-0.02em", color: C.green, margin: 0 }}>
            Tu peux en parler.
          </h1>
          <p style={{ fontSize: "clamp(1.05rem, 2.4vw, 1.25rem)", lineHeight: 1.65, color: C.text, margin: "20px 0 0", maxWidth: 480 }}>
            YURA est là pour t&apos;écouter, sans jugement. Un espace pour poser ce que tu ressens,
            et être orienté·e vers un professionnel quand tu en as besoin.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, marginTop: 32 }}>
            <Link href="/chat" className="home-cta">
              Parler à YURA
              <Icon name="arrow" size={18} />
            </Link>
          </div>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 16 }}>Sans compte · Gratuit · 24h/24</p>

          <p className="home-badge">
            <Icon name="leaf" size={14} color={C.green2} />
            Assistant conversationnel conçu pour le contexte gabonais
          </p>
        </div>

        <ChatPreview />
      </section>

      {/* ══ CONFIANCE ══ */}
      <section className="home-section">
        <div className="home-grid-3">
          {TRUST.map((t, i) => (
            <Reveal key={t.title} delay={i * 80}>
              <div className="home-card">
                <span className="home-icon"><Icon name={t.icon} /></span>
                <h3 className="home-card-title">{t.title}</h3>
                <p className="home-card-text">{t.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ COMMENT YURA PEUT M'AIDER ══ */}
      <section className="home-section">
        <Reveal>
          <h2 className="home-h2">Comment YURA peut t&apos;aider ?</h2>
          <p className="home-lead">Choisis ce qui te ressemble le plus, la conversation commence là.</p>
        </Reveal>
        <ul className="home-situations">
          {SITUATIONS.map((s, i) => (
            <li key={s.feel}>
              <Reveal delay={i * 60}>
                <Link href={chatHref(s.humeur)} className="home-situation">
                  <span className="home-situation-feel">{s.feel}</span>
                  <span className="home-situation-help">{s.help}</span>
                  <span className="home-situation-arrow"><Icon name="arrow" size={18} /></span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* ══ PARCOURS ══ */}
      <section className="home-section">
        <Reveal>
          <h2 className="home-h2">Comment YURA t&apos;accompagne</h2>
        </Reveal>
        <div className="home-grid-3">
          {JOURNEY.map((j, i) => (
            <Reveal key={j.num} delay={i * 80}>
              <div className="home-step">
                <span style={{ fontFamily: SERIF, fontSize: 40, color: C.warm, lineHeight: 1 }}>{j.num}</span>
                <h3 className="home-card-title" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
                  <Icon name={j.icon} size={20} color={C.green2} />
                  {j.title}
                </h3>
                <p className="home-card-text">{j.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ MODE VOCAL ══ */}
      <section className="home-section">
        <div className="home-voice">
          <div className="home-voice-orb" aria-hidden="true">
            <VoiceOrb mode="listening" getLevel={() => 0} size={180} />
          </div>
          <div>
            <h2 className="home-h2" style={{ color: C.ivory, margin: 0 }}>Ou parle-lui, simplement.</h2>
            <p style={{ color: "rgba(250,248,243,0.75)", fontSize: 16, lineHeight: 1.7, margin: "12px 0 24px", maxWidth: 440 }}>
              Quand les mots sont difficiles à écrire, le mode vocal te permet de parler à voix haute.
              YURA t&apos;écoute et te répond.
            </p>
            <Link href="/chat" className="home-cta home-cta-light">
              <Icon name="mic" size={18} />
              Essayer le mode vocal
            </Link>
          </div>
        </div>
      </section>

      {/* ══ PROFESSIONNELS ══ */}
      <section className="home-section">
        <Reveal>
          <div className="home-pro">
            <span className="home-icon"><Icon name="people" /></span>
            <div style={{ flex: 1, minWidth: 240 }}>
              <h2 className="home-h2" style={{ margin: 0 }}>Besoin d&apos;un professionnel ?</h2>
              <p className="home-lead" style={{ margin: "8px 0 0" }}>
                Bientôt, YURA pourra te mettre en relation avec des psychologues, psychiatres et
                thérapeutes. En attendant, elle peut t&apos;aider à faire le point.
              </p>
            </div>
            <Link href="/teleconsultation" className="home-cta home-cta-outline">
              Découvrir
              <Icon name="arrow" size={18} />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ══ PIED DE PAGE ══ */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div>
            <p style={{ fontFamily: SERIF, fontSize: 24, color: C.ivory, margin: 0 }}>YURA</p>
            <p style={{ color: "rgba(250,248,243,0.6)", fontSize: 14, margin: "6px 0 16px" }}>
              Une écoute pour le Gabon.
            </p>
            <PwaInstallButton />
          </div>
          <nav className="home-footer-links" aria-label="Liens du pied de page">
            <Link href="/chat" className="tap-target">Parler à YURA</Link>
            <Link href="/teleconsultation" className="tap-target">Professionnels</Link>
            <Link href="/about" className="tap-target">À propos</Link>
            <Link href="/privacy" className="tap-target">Confidentialité</Link>
            <a href="tel:1300" className="tap-target">Urgence : 1300</a>
          </nav>
        </div>
        <p className="home-footer-note">
          YURA ne remplace pas un professionnel de santé. En cas de danger immédiat, appelle le 1300.
          <br />
          Projet présenté au Concours Art Numérique · Gabon 2026.
        </p>
      </footer>
    </main>
  );
}
