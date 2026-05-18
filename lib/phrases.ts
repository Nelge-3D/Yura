const STORAGE_KEY = "yura_phrases";

export interface PhraseYURA {
  id: string;
  texte: string;
  date: string;
}

export function sauvegarderPhrase(texte: string): PhraseYURA {
  if (typeof window === "undefined") return { id: "", texte, date: "" };
  const phrases = getPhrases();
  const entry: PhraseYURA = {
    id: Date.now().toString(),
    texte: texte.slice(0, 600),
    date: new Date().toISOString().split("T")[0],
  };
  phrases.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(phrases.slice(-50)));
  return entry;
}

export function getPhrases(): PhraseYURA[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function supprimerPhrase(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getPhrases().filter((p) => p.id !== id)));
}

export function effacerPhrases(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// Génère et partage une image canvas avec la phrase
export function partagerPhrase(
  texte: string,
  bgColor: string,
  textColor: string,
  accentColor: string
): void {
  const W = 800;
  const H = 440;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Fond
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  // Bande déco top
  ctx.fillStyle = accentColor;
  ctx.globalAlpha = 0.12;
  ctx.fillRect(0, 0, W, 6);
  ctx.globalAlpha = 1;

  // Logo YURA (cercle + "Yu")
  ctx.beginPath();
  ctx.arc(72, 72, 34, 0, Math.PI * 2);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.font = "bold 20px Georgia, serif";
  ctx.fillStyle = accentColor;
  ctx.fillText("Yu", 58, 80);

  // Titre YURA
  ctx.font = "bold 20px Georgia, serif";
  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.6;
  ctx.fillText("YURA", 118, 66);
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillText("Écoute émotionnelle · Gabon", 118, 88);
  ctx.globalAlpha = 1;

  // Séparateur
  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.12;
  ctx.fillRect(40, 118, W - 80, 1);
  ctx.globalAlpha = 1;

  // Guillemet décoratif
  ctx.font = "bold 72px Georgia, serif";
  ctx.fillStyle = accentColor;
  ctx.globalAlpha = 0.18;
  ctx.fillText("“", 38, 190);
  ctx.globalAlpha = 1;

  // Texte de la phrase (word-wrap)
  ctx.font = "italic 24px Georgia, serif";
  ctx.fillStyle = textColor;
  const maxW = 680;
  const lineH = 36;
  const words = texte.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  const startY = 155 + Math.max(0, (4 - lines.length) * lineH * 0.5);
  lines.slice(0, 6).forEach((line, i) => {
    ctx.fillText(line, 56, startY + i * lineH);
  });

  // Bande bas
  ctx.fillStyle = accentColor;
  ctx.globalAlpha = 0.1;
  ctx.fillRect(0, H - 48, W, 48);
  ctx.globalAlpha = 1;

  // Footer texte
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.38;
  ctx.fillText("Conversation privée · yura.ga", 40, H - 18);
  ctx.globalAlpha = 1;

  canvas.toBlob((blob) => {
    if (!blob) return;
    const file = new File([blob], "yura-phrase.png", { type: "image/png" });
    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: "YURA", text: texte }).catch(() => null);
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "yura-phrase.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });
}
