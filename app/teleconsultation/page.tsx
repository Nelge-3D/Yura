"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const SPECIALISTS = [
  { role: "Psychologue clinicienne", name: "Dr. Amina Obiang", eta: "Bientôt disponible", color: "#7fb89a" },
  { role: "Psychiatre", name: "Dr. Jean-Marc Nzamba", eta: "Bientôt disponible", color: "#c9935a" },
  { role: "Sexologue", name: "Dr. Laure Moussavou", eta: "Bientôt disponible", color: "#e8a84a" },
  { role: "Thérapeute de couple", name: "Dr. Paul Ondo", eta: "Bientôt disponible", color: "#4a7c59" },
];

const FEATURES = [
  {
    icon: "🎥",
    title: "Consultation vidéo sécurisée",
    desc: "Rencontrez votre thérapeute en face à face depuis chez vous, en toute confidentialité.",
  },
  {
    icon: "📅",
    title: "Prise de rendez-vous en ligne",
    desc: "Choisissez votre créneau selon vos disponibilités, 24h/24.",
  },
  {
    icon: "🔒",
    title: "Anonymat préservé",
    desc: "Vos données restent protégées. Votre identité n'est partagée qu'avec votre thérapeute.",
  },
  {
    icon: "🌿",
    title: "Approche culturelle",
    desc: "Des professionnels formés à intégrer la culture et les réalités gabonaises dans leur pratique.",
  },
];

export default function TeleconsultationPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeSpec, setActiveSpec] = useState(0);

  // Particle canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    // Organic floating particles (leaves / dots)
    const particles = Array.from({ length: 38 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 3 + 1,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      alpha: Math.random() * 0.4 + 0.08,
      color: Math.random() > 0.5 ? "#7fb89a" : "#c9935a",
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle =
          p.color +
          Math.floor(p.alpha * 255)
            .toString(16)
            .padStart(2, "0");
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Auto-rotate specialists
  useEffect(() => {
    const t = setInterval(() => setActiveSpec((p) => (p + 1) % SPECIALISTS.length), 2800);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0e1f0e",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        overflowX: "hidden",
        position: "relative",
        color: "#f5f0e8",
      }}
    >
      {/* Canvas background */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Radial glow center */}
      <div
        style={{
          position: "fixed",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(74,124,89,0.18) 0%, transparent 70%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* NAV */}
      <nav
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem 2rem",
          borderBottom: "1px solid rgba(127,184,154,0.15)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "conic-gradient(from 0deg, #2d5a27, #7fb89a, #c9935a, #2d5a27)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#0e1f0e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Georgia, serif",
                fontSize: 12,
                color: "#7fb89a",
                fontWeight: 600,
              }}
            >
              Yu
            </div>
          </div>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#fff", letterSpacing: "-0.01em" }}>
            YURA<span style={{ color: "#7fb89a", fontStyle: "italic" }}>tc</span>
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e8a84a", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, color: "#8aab8a", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Bientôt disponible
          </span>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          padding: "5rem 2rem 3rem",
          maxWidth: 780,
          margin: "0 auto",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(201,147,90,0.12)",
            border: "1px solid rgba(201,147,90,0.35)",
            borderRadius: 100,
            padding: "0.4rem 1.1rem",
            marginBottom: "2.5rem",
          }}
        >
          <span style={{ fontSize: 11, color: "#e8a84a", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
            Téléconsultation · Lancement imminent
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
            lineHeight: 1.0,
            color: "#fff",
            marginBottom: "0.5rem",
            letterSpacing: "-0.03em",
          }}
        >
          Un vrai
          <br />
          <em style={{ color: "#7fb89a", fontStyle: "italic" }}>thérapeute</em>
          <br />
          pour toi.
        </h1>

        <p
          style={{
            fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.75,
            maxWidth: 540,
            margin: "1.5rem auto 0",
          }}
        >
          YURA t'écoute, puis te connecte à des psychologues, psychiatres et
          sexologues certifiés. Consultation vidéo sécurisée, depuis chez toi.
        </p>

        {/* Countdown placeholder */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            margin: "3rem auto",
            flexWrap: "wrap",
          }}
        >
          {["Prochainement", "·", "Restez connecté"].map((t, i) => (
            <span
              key={i}
              style={{
                fontFamily: "Georgia, serif",
                fontSize: i === 1 ? 24 : 16,
                color: i === 1 ? "#4a7c59" : "#7fb89a",
                letterSpacing: "0.05em",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Email capture */}
        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              gap: "0.75rem",
              maxWidth: 460,
              margin: "0 auto",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ton email pour être notifié(e)..."
              required
              style={{
                flex: 1,
                minWidth: 220,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(127,184,154,0.3)",
                borderRadius: 12,
                padding: "0.85rem 1.1rem",
                fontSize: 14,
                color: "#fff",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              type="submit"
              style={{
                background: "#4a7c59",
                border: "none",
                borderRadius: 12,
                padding: "0.85rem 1.5rem",
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => ((e.target as HTMLElement).style.background = "#5a8c69")}
              onMouseOut={(e) => ((e.target as HTMLElement).style.background = "#4a7c59")}
            >
              Me notifier →
            </button>
          </form>
        ) : (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              background: "rgba(74,124,89,0.2)",
              border: "1px solid rgba(127,184,154,0.4)",
              borderRadius: 12,
              padding: "0.85rem 1.5rem",
              fontSize: 14,
              color: "#7fb89a",
              fontWeight: 500,
            }}
          >
            🌿 Parfait ! On te contacte dès l&apos;ouverture.
          </div>
        )}

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: "0.8rem" }}>
          Aucune donnée nominative stockée sans consentement.
        </p>
      </section>

      {/* SPECIALISTS CAROUSEL */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          padding: "2rem",
          maxWidth: 900,
          margin: "0 auto 3rem",
        }}
      >
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#4a7c59",
            marginBottom: "1.5rem",
            fontWeight: 600,
          }}
        >
          Futurs praticiens
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "1rem",
          }}
        >
          {SPECIALISTS.map((sp, i) => (
            <div
              key={i}
              onClick={() => setActiveSpec(i)}
              style={{
                background:
                  activeSpec === i
                    ? `rgba(${sp.color === "#7fb89a" ? "127,184,154" : sp.color === "#c9935a" ? "201,147,90" : sp.color === "#e8a84a" ? "232,168,74" : "74,124,89"},0.15)`
                    : "rgba(255,255,255,0.04)",
                border: `1px solid ${activeSpec === i ? sp.color + "60" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 16,
                padding: "1.25rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                transform: activeSpec === i ? "translateY(-3px)" : "none",
              }}
            >
              {/* Avatar placeholder */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: sp.color + "25",
                  border: `2px solid ${sp.color}50`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "0.85rem",
                  fontSize: 20,
                }}
              >
                🧑‍⚕️
              </div>
              <div style={{ fontSize: 10, color: sp.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem", fontWeight: 600 }}>
                {sp.role}
              </div>
              <div style={{ fontSize: 14, color: "#fff", fontWeight: 600, marginBottom: "0.4rem", fontFamily: "Georgia, serif" }}>
                {sp.name}
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  background: "rgba(232,168,74,0.1)",
                  border: "1px solid rgba(232,168,74,0.2)",
                  borderRadius: 100,
                  padding: "0.2rem 0.6rem",
                }}
              >
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#e8a84a" }} />
                <span style={{ fontSize: 10, color: "#e8a84a" }}>{sp.eta}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          padding: "2rem",
          maxWidth: 900,
          margin: "0 auto 4rem",
        }}
      >
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#4a7c59",
            marginBottom: "1rem",
            fontWeight: 600,
          }}
        >
          Ce que YURA tc apportera
        </p>
        <h2
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
            color: "#fff",
            textAlign: "center",
            marginBottom: "2.5rem",
            letterSpacing: "-0.02em",
          }}
        >
          La consultation qui s&apos;adapte à ta vie
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(127,184,154,0.12)",
                borderRadius: 16,
                padding: "1.5rem",
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: "0.85rem" }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* YURA BRIDGE */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 700,
          margin: "0 auto 5rem",
          padding: "2rem",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, rgba(45,90,39,0.4) 0%, rgba(26,46,26,0.6) 100%)",
            border: "1px solid rgba(127,184,154,0.2)",
            borderRadius: 24,
            padding: "2.5rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: "Georgia, serif", fontSize: 14, color: "#7fb89a", fontStyle: "italic", marginBottom: "1rem" }}>
            Comment ça marche
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginBottom: "1.5rem",
            }}
          >
            {[
              { label: "Tu parles à YURA", icon: "💬" },
              { label: "→" },
              { label: "YURA évalue", icon: "🌿" },
              { label: "→" },
              { label: "Consultation réelle", icon: "🎥" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: item.label === "→" ? 20 : 13,
                  color: item.label === "→" ? "#4a7c59" : "#fff",
                  fontWeight: item.label === "→" ? 300 : 600,
                  background: item.label !== "→" ? "rgba(255,255,255,0.06)" : "transparent",
                  borderRadius: item.label !== "→" ? 10 : 0,
                  padding: item.label !== "→" ? "0.5rem 0.85rem" : 0,
                }}
              >
                {item.icon && <span style={{ fontSize: 16 }}>{item.icon}</span>}
                {item.label !== "→" && item.label}
                {item.label === "→" && "→"}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
            YURA est le pont. Elle t&apos;écoute d&apos;abord anonymement, évalue ta situation,
            puis te connecte progressivement à un professionnel certifié pour une
            consultation vidéo confidentielle.
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          padding: "2rem 2rem 5rem",
          borderTop: "1px solid rgba(127,184,154,0.1)",
        }}
      >
        <p style={{ fontSize: 13, color: "#4a7c59", marginBottom: "1rem" }}>
          En attendant l&apos;ouverture
        </p>
        <Link
          href="/chat"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "#4a7c59",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 14,
            padding: "1rem 2rem",
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "inherit",
            transition: "background 0.2s",
          }}
        >
          🌿 Parler à YURA maintenant
        </Link>
        <p style={{ marginTop: "1.5rem", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
          Anonyme · Gratuit · Disponible maintenant
        </p>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        input::placeholder { color: rgba(255,255,255,0.25); }
        input:focus { border-color: rgba(127,184,154,0.6) !important; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </main>
  );
}