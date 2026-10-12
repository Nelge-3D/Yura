import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { cleanTextForSpeech } from "./cleanText";
import { DailyQuota } from "./quota";
import { isGeminiVoice } from "./voices";

// Préparation commune aux routes /api/tts et /api/tts/stream (serveur uniquement).
// CONFIDENTIALITÉ : le texte n'est jamais journalisé, ni ici ni dans les messages d'erreur.

export const INTERACTIONS_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const MAX_CHARS = 1000;

// Consigne de style (en anglais : la doc Gemini recommande l'anglais pour les indications de jeu)
const STYLE =
  "Soft, warm, gentle and composed female voice. Calm, unhurried pace with natural pauses. " +
  "Speaks like a caring older sister who is listening closely: reassuring, never theatrical.";

const DAILY_CHARS_PER_USER = Number(process.env.TTS_DAILY_CHAR_LIMIT) || 15_000;

// Partagés entre les deux routes (globalThis : une seule instance même si le module est dupliqué)
const quotas = ((globalThis as { __yuraTtsQuotas?: { perUser: DailyQuota; perIp: DailyQuota } }).__yuraTtsQuotas ??= {
  perUser: new DailyQuota(DAILY_CHARS_PER_USER),
  // Le UUID vient du client et peut être changé : on plafonne aussi par IP (plusieurs personnes peuvent partager une IP)
  perIp: new DailyQuota(DAILY_CHARS_PER_USER * 4),
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface TtsJob {
  apiKey: string;
  model: string;
  voice: string;
  text: string;
  uuid: string;
  // Rend les caractères réservés si la génération échoue
  refund: () => void;
}

export function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

function ipKey(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  // Haché pour ne jamais garder d'IP en clair, même en mémoire
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

// Valide la requête et réserve le quota ; renvoie soit une réponse d'erreur, soit le travail à faire
export async function prepareTts(req: NextRequest): Promise<{ error: Response } | { job: TtsJob }> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_TTS_MODEL;
  const configuredVoice = process.env.GEMINI_TTS_VOICE;
  if (!apiKey || !model || !configuredVoice) return { error: fail(503, "tts_not_configured") };

  // Seule l'app YURA elle-même peut appeler ces routes depuis un navigateur
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return { error: fail(403, "forbidden_origin") };

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: fail(400, "invalid_json") };
  }
  const { text, uuid, voice: voiceOverride } = (body ?? {}) as { text?: unknown; uuid?: unknown; voice?: unknown };
  if (typeof text !== "string" || typeof uuid !== "string" || !UUID_RE.test(uuid)) {
    return { error: fail(400, "invalid_request") };
  }
  // Choix de voix par le client : uniquement en développement (page /dev/voices)
  const voice =
    process.env.NODE_ENV === "development" && isGeminiVoice(voiceOverride) ? voiceOverride : configuredVoice;

  const clean = cleanTextForSpeech(text);
  if (!clean) return { error: fail(400, "empty_text") };
  if (clean.length > MAX_CHARS) return { error: fail(413, "text_too_long") };

  const ip = ipKey(req);
  if (!quotas.perUser.consume(uuid, clean.length)) return { error: fail(429, "daily_quota_exceeded") };
  if (!quotas.perIp.consume(ip, clean.length)) {
    quotas.perUser.refund(uuid, clean.length);
    return { error: fail(429, "daily_quota_exceeded") };
  }
  const refund = () => {
    quotas.perUser.refund(uuid, clean.length);
    quotas.perIp.refund(ip, clean.length);
  };

  return { job: { apiKey, model, voice, text: clean, uuid, refund } };
}

export function remainingChars(uuid: string): number {
  return quotas.perUser.remaining(uuid);
}

// Corps de requête Interactions ; store: false car l'API conserve les échanges par défaut (55 jours en payant)
export function interactionBody(
  job: TtsJob,
  format: { stream: boolean; mimeType: "audio/mp3" | "audio/l16" }
): string {
  return JSON.stringify({
    model: job.model,
    store: false,
    stream: format.stream,
    input: [
      {
        type: "user_input",
        content: [{ type: "text", text: job.text, annotations: [{ type: "speech_metadata", style: STYLE }] }],
      },
    ],
    response_format: { type: "audio", mime_type: format.mimeType, ...(format.mimeType === "audio/l16" ? { sample_rate: 24_000 } : {}) },
    generation_config: { speech_config: [{ voice: job.voice }] },
  });
}

export function upstreamFailure(status: number): Response {
  console.error("TTS upstream error: HTTP", status);
  return fail(status === 429 ? 429 : 502, status === 429 ? "upstream_quota" : "tts_unavailable");
}
