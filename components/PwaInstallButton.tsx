"use client";

import { useEffect, useState } from "react";

type Platform = "android" | "ios" | "desktop" | "installed" | null;

export default function PwaInstallButton() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Déjà installée en mode standalone
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);

    if (isIOS) {
      setPlatform("ios");
    } else if (isAndroid) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    // Capture le prompt Android/Chrome/Desktop
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> });
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (platform === "ios") {
      setShowIosHint((v) => !v);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  // App déjà installée ou plateforme inconnue sans prompt
  if (installed || platform === null) return null;
  if ((platform === "android" || platform === "desktop") && !deferredPrompt) return null;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={handleInstall}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 24px",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(127,184,154,0.45)",
          borderRadius: 16,
          color: "#D8F3DC",
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(127,184,154,0.15)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(127,184,154,0.7)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(127,184,154,0.45)";
        }}
      >
        {/* Icône téléchargement */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7fb89a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>
          {platform === "ios" ? "Installer sur iPhone" : "Installer l'application"}
        </span>
        {/* Badge "Gratuit" */}
        <span style={{
          background: "rgba(127,184,154,0.2)",
          border: "1px solid rgba(127,184,154,0.3)",
          borderRadius: 100,
          padding: "2px 8px",
          fontSize: 11,
          color: "#7fb89a",
          fontWeight: 500,
        }}>
          Gratuit
        </span>
      </button>

      {/* Tooltip iOS */}
      {showIosHint && platform === "ios" && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 12px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#1B4332",
          border: "1px solid rgba(127,184,154,0.35)",
          borderRadius: 14,
          padding: "14px 18px",
          width: 260,
          zIndex: 50,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          {/* Flèche */}
          <div style={{
            position: "absolute",
            bottom: -7,
            left: "50%",
            transform: "translateX(-50%) rotate(45deg)",
            width: 12,
            height: 12,
            background: "#1B4332",
            border: "1px solid rgba(127,184,154,0.35)",
            borderTop: "none",
            borderLeft: "none",
          }} />
          <p style={{ color: "#D8F3DC", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            Installer sur iPhone
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { num: "1", text: 'Appuie sur le bouton Partager', icon: "□↑" },
              { num: "2", text: '"Sur l\'écran d\'accueil"', icon: "＋" },
              { num: "3", text: 'Appuie sur "Ajouter"', icon: "✓" },
            ].map((step) => (
              <div key={step.num} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "rgba(127,184,154,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{ color: "#7fb89a", fontSize: 11, fontWeight: 700 }}>{step.num}</span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.4 }}>
                  {step.text}{" "}
                  <span style={{ color: "#7fb89a", fontWeight: 700 }}>{step.icon}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
