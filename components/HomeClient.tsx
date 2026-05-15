"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import PwaInstallButton from "@/components/PwaInstallButton";

// ─── Chat démo ───────────────────────────────────────────────────────────────

const DEMO_SEQUENCES = [
  [
    { role: "yura", text: "Mbolo ! Je suis YURA 🌿 Comment s'est passée ta journée ?" },
    { role: "user", text: "Je me sens vraiment seul en ce moment..." },
    { role: "yura", text: "Je t'entends. La solitude peut peser lourd. Tu veux me dire ce qui se passe ?" },
  ],
  [
    { role: "yura", text: "Mbolo ! Comment tu vas aujourd'hui ?" },
    { role: "user", text: "J'ai beaucoup de stress au travail..." },
    { role: "yura", text: "C'est épuisant de porter ça. Depuis combien de temps tu ressens cette pression ?" },
  ],
  [
    { role: "yura", text: "Je suis là pour t'écouter, sans jugement. 🌿" },
    { role: "user", text: "Ma famille ne me comprend pas..." },
    { role: "yura", text: "C'est douloureux de ne pas se sentir compris par ceux qu'on aime. Qu'est-ce qui s'est passé ?" },
  ],
];

function ChatDemo() {
  const [visibleMessages, setVisibleMessages] = useState<
    { role: string; text: string; displayed: string; done: boolean }[]
  >([]);
  const [seqIdx, setSeqIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const runSequence = useCallback((si: number) => {
    const seq = DEMO_SEQUENCES[si % DEMO_SEQUENCES.length];
    setVisibleMessages([]);

    let msgIndex = 0;

    const showNext = () => {
      if (msgIndex >= seq.length) {
        // Pause then next sequence
        timerRef.current = setTimeout(() => {
          setSeqIdx((p) => p + 1);
        }, 3000);
        return;
      }

      const msg = seq[msgIndex];
      const idx = msgIndex;
      msgIndex++;

      // Add message shell
      setVisibleMessages((prev) => [
        ...prev,
        { role: msg.role, text: msg.text, displayed: "", done: false },
      ]);

      // Typewriter
      let charIdx = 0;
      const speed = msg.role === "user" ? 30 : 22;

      const type = () => {
        charIdx++;
        setVisibleMessages((prev) =>
          prev.map((m, i) =>
            i === idx
              ? { ...m, displayed: msg.text.slice(0, charIdx), done: charIdx >= msg.text.length }
              : m
          )
        );
        if (charIdx < msg.text.length) {
          timerRef.current = setTimeout(type, speed);
        } else {
          timerRef.current = setTimeout(showNext, msg.role === "yura" ? 900 : 600);
        }
      };

      timerRef.current = setTimeout(type, msg.role === "yura" ? 400 : 700);
    };

    showNext();
  }, []);

  useEffect(() => {
    runSequence(seqIdx);
    return clearTimer;
  }, [seqIdx, runSequence]);

  return (
    <div
      style={{
        background: "rgba(13,31,26,0.85)",
        border: "1px solid rgba(45,106,79,0.4)",
        borderRadius: 20,
        padding: "20px 16px",
        backdropFilter: "blur(10px)",
        minHeight: 240,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxWidth: 380,
        width: "100%",
      }}
    >
      {/* Header chat */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "conic-gradient(from 0deg, #2d5a27, #7fb89a, #c9935a, #4a7c59, #2d5a27)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ width: 25, height: 25, borderRadius: "50%", background: "#0D1F1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "Georgia,serif", color: "#7fb89a", fontSize: 10, fontWeight: 600 }}>Yu</span>
          </div>
        </div>
        <div>
          <p style={{ color: "#D8F3DC", fontSize: 13, fontWeight: 600, margin: 0 }}>YURA</p>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#52B788", animation: "pulse 2s infinite" }} />
            <span style={{ color: "#52796F", fontSize: 11 }}>En ligne</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {visibleMessages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div
              style={{
                maxWidth: "82%",
                padding: "9px 13px",
                borderRadius: msg.role === "yura" ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                background: msg.role === "yura" ? "#1B4332" : "#40916C",
                border: msg.role === "yura" ? "1px solid #2D6A4F" : "none",
                color: "#D8F3DC",
                fontSize: 13,
                lineHeight: 1.5,
                animation: "fadeSlide 0.3s ease-out",
              }}
            >
              {msg.displayed}
              {!msg.done && <span style={{ opacity: 0.5, animation: "blink 0.8s step-end infinite" }}>▌</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Compteur animé ───────────────────────────────────────────────────────────

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1200;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            setCount(Math.floor(p * p * target));
            if (p < 1) requestAnimationFrame(tick);
            else setCount(target);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
}

// ─── Reveal au scroll ─────────────────────────────────────────────────────────

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
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Particules canvas ────────────────────────────────────────────────────────

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = (canvas.width = canvas.offsetWidth);
    let H = (canvas.height = canvas.offsetHeight);

    const onResize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", onResize);

    const pts = Array.from({ length: 45 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -Math.random() * 0.35 - 0.05,
      alpha: Math.random() * 0.35 + 0.06,
      color: Math.random() > 0.55 ? "#7fb89a" : "#c9935a",
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, "0");
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
    />
  );
}

// ─── Données ──────────────────────────────────────────────────────────────────

const steps = [
  { num: "01", title: "Contact sans friction", desc: "Pas d'inscription. Identifiant anonyme (UUID). YURA t'accueille chaleureusement.", quote: '"Mbolo ! Comment s\'est passée ta journée ?"', accent: "#7fb89a" },
  { num: "02", title: "Écoute culturellement ancrée", desc: "TCC simplifiée + références gabonaises : contes, proverbes, symboles des ethnies.", quote: '"Les larmes sont la pluie qui permet à la forêt du cœur de repousser."', accent: "#c9935a" },
  { num: "03", title: "Escalade intelligente", desc: "Détection discrète de la détresse → proposition progressive d'un accompagnement humain.", quote: '"Je veux te connecter avec quelqu\'un qui peut vraiment t\'aider."', accent: "#e8a84a" },
  { num: "04", title: "Consultation professionnelle", desc: "Téléconsultation ou RDV en présentiel. Psychologues et professionnels qualifiés.", quote: "Une plateforme au service de l'accès aux soins mentaux au Gabon.", accent: "#4a7c59" },
];

const pillars = [
  { icon: "🌿", title: "Culturellement gabonaise", desc: "Contes, proverbes et traditions de toutes les ethnies du Gabon." },
  { icon: "🔒", title: "Anonymat total", desc: "UUID persistant. Zéro données nominatives au premier contact." },
  { icon: "🤝", title: "Passerelle humaine", desc: "YURA ne remplace pas le psychologue. Elle tient la main jusqu'à lui." },
  { icon: "📱", title: "Toujours disponible", desc: "App mobile + WhatsApp. Vocal et chat. 24h/24, 7j/7." },
  { icon: "🏥", title: "Renforce le public", desc: "Oriente vers les structures existantes. Ne les concurrence pas." },
  { icon: "🎓", title: "Crée des opportunités", desc: "La demande générée = formation de psychologues gabonais." },
];

const stats = [
  { value: 1500, suffix: "", label: "conversations / jour", sublabel: "Free tier Gemini" },
  { value: 24, suffix: "h", label: "disponible", sublabel: "7 jours sur 7" },
  { value: 0, suffix: "", label: "inscription requise", sublabel: "Anonymat total" },
  { value: 5, suffix: "", label: "ethnies représentées", sublabel: "Culture inclusive" },
];

// ─── Page principale ──────────────────────────────────────────────────────────

export default function HomeClient() {
  return (
    <main style={{ minHeight: "100vh", background: "#f5f0e8", color: "#1a2e1a", overflowX: "hidden" }}>

      {/* ══ HERO ══ */}
      <section style={{ position: "relative", background: "#1a2e1a", overflow: "hidden", minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <Particles />

        {/* Kente pattern animé */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.07, zIndex: 0, animation: "kenteSlide 30s linear infinite" }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="kente" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="24" height="24" fill="#7fb89a" />
                <rect x="24" y="24" width="24" height="24" fill="#7fb89a" />
                <rect x="12" y="12" width="24" height="24" fill="#c9935a" opacity="0.8" />
                <line x1="0" y1="0" x2="48" y2="48" stroke="white" strokeWidth="0.5" opacity="0.6" />
                <line x1="48" y1="0" x2="0" y2="48" stroke="white" strokeWidth="0.5" opacity="0.4" />
              </pattern>
            </defs>
            <rect width="200%" height="200%" fill="url(#kente)" />
          </svg>
        </div>

        {/* Glow radial */}
        <div style={{ position: "absolute", top: "40%", left: "30%", width: 600, height: 600, background: "radial-gradient(circle, rgba(74,124,89,0.15) 0%, transparent 70%)", transform: "translate(-50%,-50%)", zIndex: 0, pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "80px 24px", width: "100%", display: "grid", gridTemplateColumns: "1fr", gap: 48, alignItems: "center" }}
          className="lg-grid-2col">

          {/* Colonne gauche */}
          <div style={{ animation: "heroFadeIn 0.9s ease-out" }}>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,147,90,0.18)", border: "1px solid rgba(201,147,90,0.4)", borderRadius: 100, padding: "6px 16px", marginBottom: 32 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#e8a84a", animation: "pulse 2s infinite" }} />
              <span style={{ color: "#e8a84a", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Concours Art Numérique · Gabon 2025
              </span>
            </div>

            {/* Logo + titre */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ position: "absolute", inset: -4, borderRadius: "50%", background: "conic-gradient(from 0deg, #2d5a27, #7fb89a, #c9935a, #4a7c59, #2d5a27)", animation: "spin-slow 8s linear infinite", opacity: 0.6 }} />
                <div style={{ position: "relative", width: 80, height: 80, borderRadius: "50%", background: "conic-gradient(from 0deg, #2d5a27, #7fb89a, #c9935a, #4a7c59, #2d5a27)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 62, height: 62, borderRadius: "50%", background: "#1a2e1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "Georgia,serif", color: "#7fb89a", fontSize: 24, fontWeight: 600 }}>Yu</span>
                  </div>
                </div>
              </div>
              <div>
                <h1 style={{ fontFamily: "Georgia,serif", color: "#fff", fontSize: "clamp(3rem,8vw,5.5rem)", lineHeight: 1, letterSpacing: "-0.03em", margin: 0 }}>
                  YURA
                </h1>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 4 }}>
                  Écouter · Comprendre
                </p>
              </div>
            </div>

            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "clamp(1rem,2.5vw,1.2rem)", lineHeight: 1.75, maxWidth: 500, marginBottom: 8 }}>
              L&apos;IA d&apos;écoute émotionnelle gabonaise.
            </p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, lineHeight: 1.8, maxWidth: 480, marginBottom: 32 }}>
              Un pont doux entre toi et les professionnels de santé mentale, ancré dans la culture gabonaise.
            </p>

            {/* Tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 36 }}>
              {["IA conversationnelle", "Santé mentale", "Culture gabonaise", "Anonymat total"].map((tag) => (
                <span key={tag} style={{ color: "#7fb89a", fontSize: 12, border: "1px solid rgba(127,184,154,0.3)", background: "rgba(127,184,154,0.08)", borderRadius: 100, padding: "4px 12px" }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link
                href="/chat"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#4a7c59", color: "#fff", textDecoration: "none", borderRadius: 16, padding: "14px 28px", fontSize: 15, fontWeight: 600, transition: "all 0.2s", boxShadow: "0 0 24px rgba(74,124,89,0.4)", animation: "ctaPulse 3s ease-in-out infinite" }}
              >
                Parler à YURA
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="white" /></svg>
              </Link>
              <a
                href="#comment"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)", textDecoration: "none", borderRadius: 16, padding: "14px 28px", fontSize: 15, fontWeight: 500, border: "1px solid rgba(255,255,255,0.15)", transition: "all 0.2s" }}
              >
                Comment ça marche →
              </a>
              <PwaInstallButton />
            </div>
          </div>

          {/* Colonne droite — Chat démo */}
          <div style={{ display: "flex", justifyContent: "center", animation: "heroFadeIn 0.9s ease-out 0.3s both" }}>
            <ChatDemo />
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, animation: "float 2s ease-in-out infinite" }}>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>Scroll</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M3 9l5 5 5-5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </section>

      {/* ══ URGENCE ══ */}
      <div style={{ background: "#2d5a27", padding: "12px 24px", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, margin: 0 }}>
          🚨 En cas d&apos;urgence, appelle le{" "}
          <a href="tel:1300" style={{ color: "#7fb89a", fontWeight: 700, textDecoration: "underline" }}>1300</a>
          {" "}(CHU Libreville) — disponible 24h/24
        </p>
      </div>

      {/* ══ STATS ══ */}
      <section style={{ background: "#1a2e1a", padding: "48px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 2 }}>
          {stats.map((s, i) => (
            <Reveal key={i} delay={i * 100}>
              <div style={{ textAlign: "center", padding: "24px 16px", borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                <div style={{ fontFamily: "Georgia,serif", fontSize: "clamp(2rem,5vw,3rem)", color: "#7fb89a", fontWeight: 300, lineHeight: 1 }}>
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <p style={{ color: "#fff", fontSize: 13, fontWeight: 600, marginTop: 6, marginBottom: 2 }}>{s.label}</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{s.sublabel}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ SHADER VISUEL ══ */}
      <section style={{ position: "relative", height: 420, overflow: "hidden" }}>
        <ShaderAnimation />
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(to bottom, rgba(26,46,26,0.55) 0%, transparent 30%, transparent 70%, rgba(245,240,232,0.6) 100%)",
          pointerEvents: "none",
        }}>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>
            Une présence 24h/24
          </p>
          <h2 style={{
            fontFamily: "Georgia,serif",
            fontSize: "clamp(2.2rem,6vw,4.5rem)",
            color: "#fff",
            fontWeight: 400,
            letterSpacing: "-0.03em",
            textAlign: "center",
            textShadow: "0 2px 32px rgba(0,0,0,0.6)",
            lineHeight: 1.1,
            padding: "0 24px",
          }}>
            Tu n&apos;es jamais seul(e).
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, marginTop: 16, textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>
            YURA écoute. Toujours.
          </p>
        </div>
      </section>

      {/* ══ STEPS ══ */}
      <section id="comment" style={{ maxWidth: 1100, margin: "0 auto", padding: "96px 24px" }}>
        <Reveal>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4a7c59", marginBottom: 12 }}>Le parcours</p>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.8rem,4vw,2.8rem)", color: "#1a2e1a", marginBottom: 56, lineHeight: 1.2 }}>
            Un chemin progressif
          </h2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {steps.map((step, i) => (
            <Reveal key={step.num} delay={i * 120}>
              <div
                style={{
                  borderRadius: 20,
                  border: `1px solid ${step.accent}30`,
                  background: `${step.accent}06`,
                  padding: 28,
                  transition: "all 0.3s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${step.accent}20`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${step.accent}50`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.borderColor = `${step.accent}30`;
                }}
              >
                <div style={{ fontFamily: "Georgia,serif", fontSize: 36, fontWeight: 300, color: step.accent, marginBottom: 14 }}>{step.num}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a2e1a", marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "#4a5a4a", lineHeight: 1.65, marginBottom: 14 }}>{step.desc}</p>
                <p style={{ fontSize: 12, fontStyle: "italic", color: step.accent, opacity: 0.85 }}>{step.quote}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ PILLARS ══ */}
      <section style={{ background: "#fff", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4a7c59", marginBottom: 12 }}>Fondements</p>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.8rem,4vw,2.8rem)", color: "#1a2e1a", marginBottom: 56 }}>
              Ce qui rend YURA unique
            </h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 80}>
                <div
                  style={{ padding: 24, borderRadius: 20, border: "1px solid rgba(26,46,26,0.1)", transition: "all 0.3s ease", cursor: "default" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,124,89,0.3)";
                    (e.currentTarget as HTMLElement).style.background = "#f5f0e8";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(26,46,26,0.1)";
                    (e.currentTarget as HTMLElement).style.background = "";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }}
                >
                  <span style={{ fontSize: 32, display: "block", marginBottom: 16 }}>{p.icon}</span>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a2e1a", marginBottom: 8 }}>{p.title}</h3>
                  <p style={{ fontSize: 14, color: "#5a6b5a", lineHeight: 1.65 }}>{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ══ */}
      <section style={{ background: "#1a2e1a", padding: "96px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", width: 500, height: 500, background: "radial-gradient(circle, rgba(74,124,89,0.2) 0%, transparent 70%)", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
        <Reveal>
          <div style={{ position: "relative", maxWidth: 560, margin: "0 auto" }}>
            <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto 24px" }}>
              <div style={{ position: "absolute", inset: -4, borderRadius: "50%", background: "conic-gradient(from 0deg, #2d5a27, #7fb89a, #c9935a, #4a7c59, #2d5a27)", animation: "spin-slow 8s linear infinite", opacity: 0.7 }} />
              <div style={{ position: "relative", width: 64, height: 64, borderRadius: "50%", background: "conic-gradient(from 0deg, #2d5a27, #7fb89a, #c9935a, #4a7c59, #2d5a27)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#1a2e1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "Georgia,serif", color: "#7fb89a", fontSize: 18, fontWeight: 600 }}>Yu</span>
                </div>
              </div>
            </div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.8rem,4vw,2.6rem)", color: "#fff", marginBottom: 16 }}>
              Tu n&apos;es pas seul(e).
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, lineHeight: 1.75, marginBottom: 36 }}>
              YURA est disponible maintenant. Pas d&apos;inscription, pas de jugement.
              Juste une écoute sincère, dans ta langue, dans ta culture.
            </p>
            <Link
              href="/chat"
              style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#4a7c59", color: "#fff", textDecoration: "none", borderRadius: 18, padding: "16px 36px", fontSize: 16, fontWeight: 600, boxShadow: "0 0 32px rgba(74,124,89,0.5)", animation: "ctaPulse 3s ease-in-out infinite", transition: "background 0.2s" }}
            >
              Commencer la conversation
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="white" /></svg>
            </Link>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 20 }}>
              Anonyme · Gratuit · Confidentiel
            </p>
          </div>
        </Reveal>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: "#0f1f0f", padding: "24px", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, margin: 0 }}>
          YURA — Initiative pour la santé mentale au Gabon ·{" "}
          <span style={{ color: "#7fb89a" }}>Chambre des Métiers · SING</span>
        </p>
      </footer>

      {/* ══ CSS global ══ */}
      <style>{`
        @keyframes heroFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; } 50% { opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(6px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ctaPulse {
          0%, 100% { box-shadow: 0 0 24px rgba(74,124,89,0.4); }
          50%       { box-shadow: 0 0 40px rgba(74,124,89,0.7); }
        }
        @keyframes kenteSlide {
          from { transform: translate(0, 0); }
          to   { transform: translate(48px, 48px); }
        }
        @media (min-width: 900px) {
          .lg-grid-2col { grid-template-columns: 1fr 1fr !important; }
        }
        a:hover { opacity: 0.88; }
      `}</style>
    </main>
  );
}
