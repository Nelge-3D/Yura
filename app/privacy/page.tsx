import type { Metadata } from "next";
import Icon, { IconName } from "@/components/site/Icon";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Confidentialité — YURA",
  description: "Politique de confidentialité de YURA : sans compte, aucune donnée nominative demandée, et ce qui est transmis à Google Gemini.",
};

// Chaque affirmation doit correspondre au code. À relire à chaque évolution technique.
const SECTIONS: { icon: IconName; title: string; content: string }[] = [
  {
    icon: "shield",
    title: "Ce que nous ne collectons pas",
    content: `YURA ne collecte aucune donnée nominative. Vous n'avez pas besoin de créer un compte, ni de donner votre nom réel, votre numéro de téléphone ou votre adresse e-mail pour utiliser le service.`,
  },
  {
    icon: "home",
    title: "Où sont stockées vos données ?",
    content: `L'historique de vos conversations et votre prénom (si vous choisissez d'en donner un) sont stockés uniquement sur votre appareil, dans le stockage local de votre navigateur. Pour générer une réponse, vos messages transitent par nos serveurs, mais ils n'y sont ni enregistrés ni journalisés.`,
  },
  {
    icon: "chat",
    title: "L'IA et vos messages",
    content: `Vos messages sont transmis à l'API Google Gemini pour générer les réponses de YURA. Ces échanges sont traités par Google conformément à ses conditions d'utilisation et à sa politique de confidentialité. Nous ne conservons pas d'historique de vos conversations sur nos serveurs.`,
  },
  {
    icon: "mic",
    title: "Lecture vocale et mode vocal",
    content: `La lecture vocale est désactivée par défaut : YURA ne parle jamais sans que vous l'ayez demandé, en activant la lecture automatique, en appuyant sur « Écouter » ou en ouvrant le mode vocal. Selon la configuration, la voix est générée par Google (Gemini) ou par votre navigateur. Avec Google, seul le texte de la réponse de YURA (et non vos propres messages) est envoyé, en demandant à Google de ne pas conserver la requête ; YURA ne conserve ni ce texte ni l'audio. Pour limiter les abus, un identifiant anonyme et une empreinte de votre adresse IP servent à compter les caractères lus dans la journée ; ce compteur n'est gardé qu'en mémoire et remis à zéro chaque jour. En mode vocal, la reconnaissance de votre voix est assurée par votre navigateur, qui peut passer par les serveurs de son éditeur (Google, Microsoft ou Apple).`,
  },
  {
    icon: "heart",
    title: "Votre avis (facultatif)",
    content: `En fin de conversation, YURA peut vous demander votre avis. Si vous répondez, votre note, votre commentaire éventuel, votre état émotionnel au début et à la fin, le nombre de messages et la durée de la session sont envoyés à un tableau privé de l'équipe YURA (Google Sheets). Ni le contenu de vos messages ni votre prénom ne sont envoyés.`,
  },
  {
    icon: "compass",
    title: "Mesure d'audience",
    content: `YURA utilise Vercel Web Analytics pour savoir combien de personnes consultent les pages. Cet outil n'utilise pas de cookie et ne permet pas de vous identifier. YURA n'utilise aucun cookie publicitaire ni pixel de suivi.`,
  },
  {
    icon: "phone",
    title: "Situation de crise",
    content: `Si une situation de crise est détectée (pensées suicidaires ou automutilation), YURA affiche le numéro d'urgence 1300. Aucune alerte n'est envoyée à des tiers.`,
  },
  {
    icon: "check",
    title: "Vos droits",
    content: `Nous ne détenons aucun fichier nominatif vous concernant. Pour effacer vos données locales, utilisez « Recommencer » dans le menu du chat, ou effacez les données de votre navigateur pour ce site.`,
  },
];

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100dvh", background: "#FAF8F3", color: "#18221F", overflowX: "hidden" }}>
      <SiteHeader />

      <section className="home-section" style={{ paddingTop: 40, maxWidth: 860 }}>
        <p className="pro-eyebrow" style={{ background: "#E9F2ED", color: "#477A68" }}>
          <Icon name="shield" size={14} />
          Mise à jour : octobre 2026
        </p>
        <h1 className="pro-title">Confidentialité</h1>
        <p className="home-lead" style={{ fontSize: "clamp(1.05rem, 2.4vw, 1.2rem)", color: "#18221F" }}>
          Sans compte, sans nom demandé. Voici, simplement, ce qui reste sur votre appareil et ce qui
          est transmis pour que YURA puisse vous répondre.
        </p>
      </section>

      <section className="home-section" style={{ paddingTop: 0, maxWidth: 860 }}>
        <div className="legal-list">
          {SECTIONS.map((s) => (
            <article key={s.title} className="legal-item">
              <span className="home-icon"><Icon name={s.icon} /></span>
              <div>
                <h2 className="home-card-title" style={{ marginTop: 6 }}>{s.title}</h2>
                <p className="home-card-text">{s.content}</p>
              </div>
            </article>
          ))}
          <article className="legal-item">
            <span className="home-icon"><Icon name="people" /></span>
            <div>
              <h2 className="home-card-title" style={{ marginTop: 6 }}>Contact</h2>
              <p className="home-card-text">
                Pour toute question relative à la confidentialité :{" "}
                <a href="mailto:contact@yura.app" style={{ color: "#174C3C", fontWeight: 600 }}>contact@yura.app</a>
              </p>
            </div>
          </article>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
