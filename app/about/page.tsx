import type { Metadata } from "next";
import Link from "next/link";
import Icon, { IconName } from "@/components/site/Icon";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "À propos — YURA",
  description: "Qui est YURA ? Notre vision d'une écoute accessible à tous, ancrée dans la culture gabonaise.",
};

const VALUES: { icon: IconName; title: string; desc: string }[] = [
  { icon: "leaf", title: "Ancrage culturel", desc: "YURA intègre la culture gabonaise (proverbes, repères, réalités locales) pour créer un espace d'écoute qui vous ressemble." },
  { icon: "shield", title: "Sans compte", desc: "Aucune inscription ni donnée nominative demandée. L'historique reste sur votre appareil ; les messages sont transmis à Google Gemini pour générer les réponses, sans être conservés par YURA." },
  { icon: "compass", title: "Un pont vers les professionnels", desc: "YURA ne remplace pas un suivi professionnel. Elle écoute, aide à faire le point et oriente vers des professionnels de santé mentale quand c'est nécessaire." },
  { icon: "heart", title: "Accessibilité", desc: "Gratuit, sans inscription, sur téléphone comme sur ordinateur, à l'écrit ou à voix haute. Pensé pour le Gabon et l'Afrique centrale." },
];

// Chiffres retirés tant qu'ils ne sont pas sourcés : ne publier que des données citant leur source
const TEAM = [
  { initials: "LN", name: "Louis Ngabi", role: "Fondateur & CEO", bio: "Entrepreneur tech engagé pour l'accès aux soins en Afrique centrale." },
];

export default function AboutPage() {
  return (
    <main style={{ minHeight: "100dvh", background: "#FAF8F3", color: "#18221F", overflowX: "hidden" }}>
      <SiteHeader />

      {/* ══ HERO ══ */}
      <section className="home-section" style={{ paddingTop: 40 }}>
        <p className="pro-eyebrow" style={{ background: "#E9F2ED", color: "#477A68" }}>À propos</p>
        <h1 className="pro-title">Une écoute accessible à tous, au Gabon.</h1>
        <p className="home-lead" style={{ fontSize: "clamp(1.05rem, 2.4vw, 1.2rem)", color: "#18221F", maxWidth: 640 }}>
          Beaucoup de personnes traversent des moments difficiles sans personne à qui en parler.
          YURA leur offre un espace pour poser ce qu&apos;elles ressentent, sans jugement, à toute heure,
          et les oriente vers des professionnels de santé mentale quand c&apos;est nécessaire.
        </p>
      </section>

      {/* ══ POURQUOI ══ */}
      <section className="home-section">
        <div className="home-pro" style={{ alignItems: "flex-start" }}>
          <span className="home-icon"><Icon name="chat" /></span>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2 className="home-h2" style={{ margin: 0 }}>Pourquoi YURA ?</h2>
            <p className="home-lead" style={{ margin: "8px 0 0", maxWidth: 720 }}>
              Parler de sa santé mentale reste difficile : par peur du regard des autres, faute de
              professionnels à proximité, ou simplement parce qu&apos;on ne sait pas par où commencer.
              YURA est une première porte, gratuite et discrète, ouverte jour et nuit.
            </p>
          </div>
        </div>
      </section>

      {/* ══ VALEURS ══ */}
      <section className="home-section">
        <h2 className="home-h2">Nos valeurs</h2>
        <div className="pro-grid about-values" style={{ marginTop: 24 }}>
          {VALUES.map((v) => (
            <div key={v.title} className="home-card">
              <span className="home-icon"><Icon name={v.icon} /></span>
              <h3 className="home-card-title">{v.title}</h3>
              <p className="home-card-text">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ ÉQUIPE ══ */}
      <section className="home-section">
        <h2 className="home-h2">L&apos;équipe</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 24 }}>
          {TEAM.map((m) => (
            <div key={m.name} className="home-card" style={{ display: "flex", gap: 16, alignItems: "flex-start", maxWidth: 440 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 56, height: 56, borderRadius: "50%", background: "#174C3C", color: "#FAF8F3", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-serif), Georgia, serif", fontSize: 20,
                }}
              >
                {m.initials}
              </span>
              <div>
                <h3 className="home-card-title" style={{ margin: "4px 0 2px" }}>{m.name}</h3>
                <p style={{ color: "#477A68", fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>{m.role}</p>
                <p className="home-card-text">{m.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ APPEL ══ */}
      <section className="home-section">
        <div className="home-voice" style={{ justifyContent: "space-between" }}>
          <div>
            <h2 className="home-h2" style={{ color: "#FAF8F3", margin: 0 }}>Prêt·e à en parler ?</h2>
            <p style={{ color: "rgba(250,248,243,0.75)", fontSize: 16, margin: "10px 0 0" }}>
              Sans compte · Gratuit · 24h/24
            </p>
          </div>
          <Link href="/chat" className="home-cta home-cta-light">
            Parler à YURA
            <Icon name="arrow" size={18} />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
