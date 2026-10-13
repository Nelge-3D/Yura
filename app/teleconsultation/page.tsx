import type { Metadata } from "next";
import Link from "next/link";
import Icon, { IconName } from "@/components/site/Icon";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Professionnels — YURA",
  description:
    "Bientôt, YURA pourra te mettre en relation avec des psychologues, psychiatres et thérapeutes. En attendant, YURA t'écoute dès aujourd'hui.",
};

// Spécialités seulement : aucun professionnel n'est encore partenaire. Ne jamais afficher de nom
// ni de photo de praticien avant un partenariat réel et vérifié.
const SPECIALTIES = [
  { title: "Psychologue", desc: "Pour parler en profondeur de ce que tu vis et être accompagné·e dans la durée." },
  { title: "Psychiatre", desc: "Pour un avis médical, notamment si un traitement peut t'aider." },
  { title: "Thérapeute de couple et de famille", desc: "Pour les tensions, les séparations et les relations difficiles." },
  { title: "Sexologue", desc: "Pour les questions de vie intime, en toute discrétion." },
];

const STEPS: { icon: IconName; title: string; desc: string }[] = [
  { icon: "chat", title: "YURA t'écoute", desc: "Tu parles de ce que tu ressens. YURA t'aide à faire le point, à ton rythme." },
  { icon: "compass", title: "Elle te propose une aide adaptée", desc: "Si tu le souhaites, YURA t'oriente vers le type de professionnel qui correspond à ta situation." },
  { icon: "video", title: "Tu consultes", desc: "En vidéo depuis chez toi ou en présentiel, selon ce qui te convient." },
];

const COMMITMENTS: { icon: IconName; title: string; desc: string }[] = [
  { icon: "shield", title: "Confidentialité", desc: "Ton identité ne sera partagée qu'avec le professionnel que tu choisis de consulter." },
  { icon: "check", title: "Professionnels vérifiés", desc: "Aucun profil ne sera affiché avant un partenariat réel et vérifié." },
  { icon: "leaf", title: "Ancrés au Gabon", desc: "Des professionnels sensibles à la culture et aux réalités d'ici." },
];

export default function ProfessionnelsPage() {
  return (
    <main style={{ minHeight: "100dvh", background: "#FAF8F3", color: "#18221F", overflowX: "hidden" }}>
      <SiteHeader />

      {/* ══ HERO ══ */}
      <section className="home-section" style={{ paddingTop: 40 }}>
        <p className="pro-eyebrow">
          <span className="pro-dot" aria-hidden="true" />
          Bientôt sur YURA
        </p>
        <h1 className="pro-title">Parler à un professionnel.</h1>
        <p className="home-lead" style={{ fontSize: "clamp(1.05rem, 2.4vw, 1.2rem)", color: "#18221F", maxWidth: 600 }}>
          YURA t&apos;écoute dès aujourd&apos;hui. Bientôt, elle pourra aussi te mettre en relation avec des
          professionnels de santé mentale, en ligne ou en présentiel.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link href="/chat" className="home-cta pro-cta">
            En attendant, parler à YURA
            <Icon name="arrow" size={18} />
          </Link>
        </div>
      </section>

      {/* ══ SPÉCIALITÉS ══ */}
      <section className="home-section">
        <h2 className="home-h2">Les spécialités à venir</h2>
        <p className="home-lead">Nous construisons un réseau de professionnels partenaires. Ils apparaîtront ici dès qu&apos;ils seront disponibles.</p>
        <div className="pro-grid">
          {SPECIALTIES.map((s) => (
            <div key={s.title} className="home-card">
              <span className="home-icon"><Icon name="people" /></span>
              <h3 className="home-card-title">{s.title}</h3>
              <p className="home-card-text">{s.desc}</p>
              <span className="pro-soon">Bientôt disponible</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══ COMMENT ÇA MARCHERA ══ */}
      <section className="home-section">
        <h2 className="home-h2">Comment ça marchera</h2>
        <div className="home-grid-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="home-step">
              <span style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 40, color: "#D99A62", lineHeight: 1 }}>
                0{i + 1}
              </span>
              <h3 className="home-card-title" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
                <Icon name={s.icon} size={20} color="#477A68" />
                {s.title}
              </h3>
              <p className="home-card-text">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ ENGAGEMENTS ══ */}
      <section className="home-section">
        <h2 className="home-h2">Nos engagements</h2>
        <div className="home-grid-3" style={{ marginTop: 24 }}>
          {COMMITMENTS.map((c) => (
            <div key={c.title} className="home-card">
              <span className="home-icon"><Icon name={c.icon} /></span>
              <h3 className="home-card-title">{c.title}</h3>
              <p className="home-card-text">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ URGENCE ══ */}
      <section className="home-section">
        <div className="pro-urgent">
          <span className="home-icon" style={{ background: "#fff", color: "#C84E4E" }}><Icon name="phone" /></span>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h2 className="home-h2" style={{ margin: 0, fontSize: "clamp(1.4rem, 3vw, 1.8rem)" }}>Tu es en danger immédiat ?</h2>
            <p className="home-lead" style={{ margin: "6px 0 0" }}>
              N&apos;attends pas : appelle le 1300, disponible 24h/24, ou rends-toi aux urgences les plus proches.
            </p>
          </div>
          <a href="tel:1300" className="home-cta pro-cta-urgent">
            <Icon name="phone" size={18} />
            Appeler le 1300
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
