import Link from "next/link";
import PwaInstallButton from "@/components/PwaInstallButton";

// Pied de page commun aux pages publiques
export default function SiteFooter() {
  return (
    <footer className="home-footer">
      <div className="home-footer-inner">
        <div>
          <p style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 24, color: "#FAF8F3", margin: 0 }}>YURA</p>
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
  );
}
