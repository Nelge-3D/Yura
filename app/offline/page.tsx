"use client";

export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0D1F1A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "conic-gradient(from 0deg, #2d5a27, #7fb89a, #c9935a, #4a7c59, #2d5a27)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            width: 62,
            height: 62,
            borderRadius: "50%",
            background: "#0D1F1A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "Georgia, serif",
              color: "#7fb89a",
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            Yu
          </span>
        </div>
      </div>

      <h1
        style={{
          fontFamily: "Georgia, serif",
          color: "#D8F3DC",
          fontSize: "clamp(1.5rem,5vw,2.2rem)",
          marginBottom: 16,
          fontWeight: 400,
        }}
      >
        Tu es hors ligne
      </h1>

      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 16, lineHeight: 1.75, maxWidth: 340, marginBottom: 36 }}>
        YURA n&apos;a pas accès à internet en ce moment. Reconnecte-toi pour continuer la conversation.
      </p>

      <button
        onClick={() => window.location.reload()}
        style={{
          background: "#2D6A4F",
          color: "#D8F3DC",
          border: "none",
          borderRadius: 14,
          padding: "14px 32px",
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Réessayer
      </button>

      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 24 }}>
        Tes conversations sont sauvegardées localement 🌿
      </p>
    </main>
  );
}
