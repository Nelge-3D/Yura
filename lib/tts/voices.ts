// Voix préconstruites Gemini TTS (doc « Speech generation », consultée le 2026-10-12).
export const GEMINI_VOICES = [
  "Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus", "Aoede", "Callirrhoe", "Autonoe",
  "Enceladus", "Iapetus", "Umbriel", "Algieba", "Despina", "Erinome", "Algenib", "Rasalgethi",
  "Laomedeia", "Achernar", "Alnilam", "Schedar", "Gacrux", "Pulcherrima", "Achird",
  "Zubenelgenubi", "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat",
] as const;

export type GeminiVoice = (typeof GEMINI_VOICES)[number];

export function isGeminiVoice(v: unknown): v is GeminiVoice {
  return typeof v === "string" && (GEMINI_VOICES as readonly string[]).includes(v);
}

// Candidates pour YURA : voix féminines au caractère doux (description officielle entre parenthèses)
export const YURA_VOICE_CANDIDATES: { voice: GeminiVoice; description: string }[] = [
  { voice: "Sulafat", description: "Chaleureuse (Warm)" },
  { voice: "Vindemiatrix", description: "Douce, bienveillante (Gentle)" },
  { voice: "Achernar", description: "Feutrée (Soft)" },
  { voice: "Despina", description: "Fluide (Smooth)" },
  { voice: "Aoede", description: "Légère, aérée (Breezy)" },
];
