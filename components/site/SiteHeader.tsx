import Link from "next/link";
import Icon from "./Icon";

// En-tête commun aux pages publiques (accueil, professionnels…)
export default function SiteHeader() {
  return (
    <header className="home-header">
      <Link href="/" className="tap-target" style={{ gap: 10, textDecoration: "none", color: "#174C3C" }}>
        <span style={{ width: 30, height: 30, borderRadius: "50%", background: "#174C3C", color: "#FAF8F3", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="leaf" size={16} />
        </span>
        <span style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, letterSpacing: "0.02em" }}>YURA</span>
      </Link>
      <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link href="/teleconsultation" className="tap-target home-nav-link">Professionnels</Link>
        <a href="tel:1300" className="tap-target home-urgent" aria-label="Urgence : appeler le 1300">
          <Icon name="phone" size={16} />
          <span className="home-urgent-label">Urgence&nbsp;:</span> 1300
        </a>
      </nav>
    </header>
  );
}
