import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YURA — L'IA à l'écoute",
  description:
  "YURA est une IA conversationnelle d’écoute émotionnelle, nourrie de la culture gabonaise. Un pont entre toi et les professionnels de santé mentale.",
};

const steps = [
  {
    num: "01",
    title: "Contact sans friction",
    desc: "Pas d'inscription. Identifiant anonyme (UUID). YURA t'accueille chaleureusement.",
    quote: '"Mbolo ! Comment s\'est passée ta journée ?"',
    color: "border-[#7fb89a]/30 bg-[#7fb89a]/5",
    numColor: "text-[#7fb89a]",
  },
  {
    num: "02",
    title: "Écoute culturellement ancrée",
    desc: "TCC simplifiée + références gabonaises : contes, proverbes, symboles des ethnies.",
    quote: '"Les larmes font partie du chemin… elles permettent parfois de relâcher ce qui est trop lourd."',
    color: "border-[#c9935a]/30 bg-[#c9935a]/5",
    numColor: "text-[#c9935a]",
  },
  {
    num: "03",
    title: "Escalade intelligente",
    desc: "Détection discrète de la détresse → proposition progressive d’un accompagnement humain.",
    quote: '"Je veux te connecter avec quelqu\'un qui peut vraiment t\'aider."',
    color: "border-[#e8a84a]/30 bg-[#e8a84a]/5",
    numColor: "text-[#e8a84a]",
  },
  {
    num: "04",
    title: "Consultation professionnelle",
    desc: "Téléconsultation ou RDV en présentiel. Psychologues et professionnels qualifiés.",
    quote: "Une plateforme qui contribue à développer l’accès aux professionnels au Gabon.",
    color: "border-[#4a7c59]/30 bg-[#4a7c59]/5",
    numColor: "text-[#4a7c59]",
  },
];

const pillars = [
  { icon: "🌿", title: "Culturellement gabonaise", desc: "Contes, proverbes et traditions de toutes les ethnies du Gabon." },
  { icon: "🔒", title: "Anonymat total", desc: "UUID persistant. Zéro données nominatives au premier contact." },
  { icon: "🤝", title: "Passerelle humaine", desc: "YURA ne remplace pas le psychologue. Elle tient la main jusqu'à lui." },
  { icon: "📱", title: "Toujours disponible", desc: "App mobile + WhatsApp. Vocal et chat. 24h/24, 7j/7." },
  { icon: "🏥", title: "Renforce le public", desc: "Oriente vers les structures existantes. Ne les concurrence pas." },
  { icon: "🎓", title: "Crée des opportunités", desc: "La demande générée = formation de psychologues gabonais." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f5f0e8] text-[#1a2e1a]">
      {/* HERO */}
      <section className="relative bg-[#1a2e1a] overflow-hidden">
        {/* Kente pattern background */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="kente" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="24" height="24" fill="#7fb89a" opacity="0.5" />
                <rect x="24" y="24" width="24" height="24" fill="#7fb89a" opacity="0.5" />
                <rect x="12" y="12" width="24" height="24" fill="#c9935a" opacity="0.4" />
                <line x1="0" y1="0" x2="48" y2="48" stroke="white" strokeWidth="0.5" opacity="0.3" />
                <line x1="48" y1="0" x2="0" y2="48" stroke="white" strokeWidth="0.5" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#kente)" />
          </svg>
        </div>

        {/* Forest deco */}
        <div className="absolute right-0 bottom-0 w-64 opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="100" cy="195" rx="80" ry="10" fill="#7fb89a" />
            <polygon points="100,20 135,110 65,110" fill="#2d5a27" />
            <polygon points="100,45 145,140 55,140" fill="#4a7c59" />
            <polygon points="100,65 125,120 75,120" fill="#7fb89a" />
            <rect x="90" y="140" width="20" height="55" fill="#1a2e1a" />
            <polygon points="55,55 82,120 28,120" fill="#2d5a27" />
            <polygon points="145,60 168,130 122,130" fill="#2d5a27" />
          </svg>
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-20 lg:py-28">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#c9935a]/20 border border-[#c9935a]/40 rounded-full px-4 py-1.5 mb-8">
            <span className="text-[#e8a84a] text-xs font-medium tracking-widest uppercase">
              Concours Art Numérique · Gabon 2025 · 2e édition
            </span>
          </div>

          <div className="flex items-center gap-5 mb-8">
            {/* Logo */}
            <div
              className="w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{
                background: "conic-gradient(from 0deg, #2d5a27, #7fb89a, #c9935a, #4a7c59, #2d5a27)",
              }}
            >
              <div className="w-[62px] h-[62px] rounded-full bg-[#1a2e1a] flex items-center justify-center">
                <span className="font-serif text-[#7fb89a] text-2xl">Yu</span>
              </div>
            </div>
            <div>
              <h1 className="font-serif text-white text-5xl lg:text-7xl leading-none tracking-tight">
                YURA
              </h1>
              <p className="text-white/40 text-xs tracking-[0.15em] uppercase mt-1">
                Écouter · Comprendre
              </p>
            </div>
          </div>

          <p className="text-white/70 text-lg lg:text-xl leading-relaxed max-w-xl mb-4">
             YURA — L'IA à l'écoute
          </p>
          <p className="text-white/50 text-base leading-relaxed max-w-xl mb-10">
          Une intelligence artificielle d&apos;écoute émotionnelle, nourrie de
            la culture gabonaise. Un pont doux entre toi et les professionnels de santé mentale.
          </p>

          <div className="flex flex-wrap gap-3 mb-12">
            {["IA conversationnelle", "Santé mentale", "Culture gabonaise", "Anonymat total", "WhatsApp + App"].map((tag) => (
              <span
                key={tag}
                className="text-[#7fb89a] text-xs border border-[#7fb89a]/30 bg-[#7fb89a]/10 rounded-full px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 bg-[#4a7c59] hover:bg-[#5a8c69] text-white font-medium px-8 py-4 rounded-2xl text-sm transition-colors"
            >
              Parler à YURA
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="white" />
              </svg>
            </Link>
            <a
              href="#comment"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white/80 font-medium px-8 py-4 rounded-2xl text-sm transition-colors border border-white/20"
            >
              Comment ça marche →
            </a>
          </div>
        </div>
      </section>

      {/* URGENCE BANNER */}
      <div className="bg-[#2d5a27] py-3 px-6 text-center">
        <p className="text-white/80 text-sm">
          🚨 En cas d&apos;urgence, appelle le{" "}
          <a href="tel:1300" className="text-[#7fb89a] font-semibold underline">
            1300
          </a>{" "}
          (CHU Libreville) ·{" "}
          <a href="tel:+33972394050" className="text-[#7fb89a] font-semibold underline">
            
          </a>
        </p>
      </div>

      {/* STEPS */}
      <section id="comment" className="max-w-5xl mx-auto px-6 py-20">
        <p className="text-xs font-medium tracking-widest uppercase text-[#4a7c59] mb-3">
          Le parcours
        </p>
        <h2 className="font-serif text-3xl lg:text-4xl text-[#1a2e1a] mb-12 leading-tight">
          Un chemin progressif<br />
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {steps.map((step) => (
            <div
              key={step.num}
              className={`rounded-2xl border p-6 ${step.color}`}
            >
              <div className={`font-serif text-3xl font-light mb-3 ${step.numColor}`}>
                {step.num}
              </div>
              <h3 className="font-semibold text-[#1a2e1a] text-base mb-2">{step.title}</h3>
              <p className="text-[#4a5a4a] text-sm leading-relaxed mb-3">{step.desc}</p>
              <p className={`text-xs italic ${step.numColor} opacity-80`}>{step.quote}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PILLARS */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium tracking-widest uppercase text-[#4a7c59] mb-3">
            Fondements
          </p>
          <h2 className="font-serif text-3xl lg:text-4xl text-[#1a2e1a] mb-12">
            Ce qui rend YURA unique
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="p-6 rounded-2xl border border-[#1a2e1a]/10 hover:border-[#4a7c59]/30 hover:bg-[#f5f0e8] transition-colors"
              >
                <span className="text-3xl mb-4 block">{p.icon}</span>
                <h3 className="font-semibold text-[#1a2e1a] text-sm mb-2">{p.title}</h3>
                <p className="text-[#5a6b5a] text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-[#1a2e1a] py-20 text-center">
        <div className="max-w-xl mx-auto px-6">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{
              background: "conic-gradient(from 0deg, #2d5a27, #7fb89a, #c9935a, #4a7c59, #2d5a27)",
            }}
          >
            <div className="w-12 h-12 rounded-full bg-[#1a2e1a] flex items-center justify-center">
              <span className="font-serif text-[#7fb89a] text-lg">Yu</span>
            </div>
          </div>
          <h2 className="font-serif text-3xl text-white mb-4">
            Tu n&apos;es pas seul(e).
          </h2>
          <p className="text-white/50 text-base mb-8 leading-relaxed">
            YURA est disponible maintenant. Pas d&apos;inscription, pas de jugement.
            Juste une écoute sincère, dans ta langue, dans ta culture.
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 bg-[#4a7c59] hover:bg-[#5a8c69] text-white font-medium px-10 py-4 rounded-2xl text-sm transition-colors"
          >
            Commencer la conversation
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="white" />
            </svg>
          </Link>
          <p className="text-white/25 text-xs mt-6">
            Anonyme · Gratuit · Confidentiel
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0f1f0f] py-6 text-center">
        <p className="text-white/30 text-xs">
          YURA — Initiative pour la santé mentale au Gabon ·{" "}
          <span className="text-[#7fb89a]">Chambre des Métiers · SING</span>
        </p>
      </footer>
    </main>
  );
}