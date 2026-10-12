import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Confidentialité — YURA",
  description: "Politique de confidentialité de YURA. Aucune donnée nominative collectée.",
};

const BG = "#0D1F1A";
const TEXT = "#D8F3DC";
const MUTED = "#52796F";
const ACCENT = "#2D6A4F";
const DOT = "#52B788";
const SEC = "#95C8A8";

const SECTIONS = [
  {
    title: "Ce que nous ne collectons pas",
    content: `YURA ne collecte aucune donnée nominative. Vous n'avez pas besoin de créer un compte, de donner votre nom réel, votre numéro de téléphone ou votre adresse e-mail pour utiliser le service.`,
  },
  {
    title: "Où sont stockées vos données ?",
    content: `Vos conversations et votre prénom (si vous choisissez d'en donner un) sont stockés uniquement sur votre appareil, dans le stockage local de votre navigateur (localStorage). Aucune conversation n'est envoyée à nos serveurs ou conservée de notre côté.`,
  },
  {
    title: "L'IA et vos messages",
    content: `Vos messages sont transmis à l'API Google Gemini pour générer les réponses de YURA. Ces échanges sont traités conformément à la politique de confidentialité de Google. Nous ne conservons pas d'historique de vos conversations côté serveur.`,
  },
  {
    title: "Lecture vocale",
    content: `La lecture vocale est désactivée par défaut : YURA ne parle jamais sans que vous l'ayez demandé, en activant la lecture automatique ou en appuyant sur « Écouter ». Lorsque vous l'utilisez, le texte de la réponse de YURA (et non vos propres messages) est envoyé à Google (Gemini) pour générer la voix, en demandant à Google de ne pas conserver la requête. YURA ne conserve ni ce texte ni l'audio sur ses serveurs et ne les enregistre dans aucun journal. L'audio est gardé uniquement dans la mémoire de votre navigateur pendant la conversation, puis effacé quand vous quittez la page. Pour limiter les abus, un identifiant anonyme et une empreinte de votre adresse IP servent à compter les caractères lus dans la journée ; ce compteur n'est conservé qu'en mémoire et remis à zéro chaque jour. Si la voix de Google est indisponible, YURA utilise la voix intégrée à votre navigateur ; selon le navigateur, celle-ci peut passer par les serveurs de son éditeur (Google, Microsoft ou Apple).`,
  },
  {
    title: "Cookies et trackers",
    content: `YURA n'utilise aucun cookie de tracking, aucun pixel publicitaire et aucun outil d'analyse comportementale. Le seul stockage local utilisé est celui décrit ci-dessus, nécessaire au fonctionnement de l'application.`,
  },
  {
    title: "Situation de crise",
    content: `En cas de détection d'une situation de crise (pensées suicidaires ou automutilation), YURA affiche des ressources d'urgence locales (CHU Libreville – 1300). Aucune alerte n'est envoyée à des tiers. Votre anonymat est préservé.`,
  },
  {
    title: "Vos droits",
    content: `Puisque nous ne collectons aucune donnée nominative, il n'existe pas de fichier vous concernant chez nous. Pour effacer toutes vos données locales, utilisez le bouton "Recommencer" dans l'application ou effacez les données de votre navigateur.`,
  },
  {
    title: "Contact",
    content: `Pour toute question relative à la confidentialité, vous pouvez nous contacter à l'adresse : contact@yura.app`,
  },
];

export default function PrivacyPage() {
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
        <Link href="/" className="tap-target" style={{ color: DOT, fontWeight: 700, fontSize: 18, textDecoration: "none" }}>
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

      {/* Header */}
      <section style={{ textAlign: "center", padding: "60px 24px 48px" }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🔒</div>
        <h1 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 700, margin: "0 0 12px" }}>
          Politique de confidentialité
        </h1>
        <p style={{ color: MUTED, fontSize: 14 }}>
          Dernière mise à jour : octobre 2026
        </p>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 20,
            padding: "10px 20px",
            background: `${ACCENT}20`,
            border: `1px solid ${ACCENT}40`,
            borderRadius: 100,
            color: SEC,
            fontSize: 14,
          }}
        >
          <span style={{ color: DOT }}>✓</span>
          Aucune donnée nominative collectée
        </div>
      </section>

      {/* Contenu */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {SECTIONS.map((s) => (
            <div
              key={s.title}
              style={{
                background: `${ACCENT}08`,
                border: `1px solid ${ACCENT}20`,
                borderRadius: 20,
                padding: "28px 32px",
              }}
            >
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px", color: DOT }}>
                {s.title}
              </h2>
              <p style={{ color: SEC, fontSize: 15, lineHeight: 1.75, margin: 0 }}>
                {s.content}
              </p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 48, display: "flex", gap: 24, justifyContent: "center" }}>
          <Link href="/about" className="tap-target" style={{ color: MUTED, fontSize: 14, textDecoration: "none" }}>À propos</Link>
          <Link href="/chat" className="tap-target" style={{ color: MUTED, fontSize: 14, textDecoration: "none" }}>Retour au chat</Link>
        </div>
      </section>
    </main>
  );
}
