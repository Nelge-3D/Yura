import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { cleanTextForSpeech } from "@/lib/tts/cleanText";
import { DailyQuota } from "@/lib/tts/quota";
import { isGeminiVoice } from "@/lib/tts/voices";
import { parseAudioMime, pcmToWav } from "@/lib/tts/wav";

// Synthèse vocale Gemini (API Interactions).
// CONFIDENTIALITÉ : le texte n'est jamais journalisé, ni ici ni dans les messages d'erreur.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const MAX_CHARS = 1000;
const TIMEOUT_MS = 30_000;

// Consigne de style (en anglais : la doc Gemini recommande l'anglais pour les indications de jeu)
const STYLE =
  "Soft, warm, gentle and composed female voice. Calm, unhurried pace with natural pauses. " +
  "Speaks like a caring older sister who is listening closely: reassuring, never theatrical.";

const DAILY_CHARS_PER_USER = Number(process.env.TTS_DAILY_CHAR_LIMIT) || 15_000;
const perUser = new DailyQuota(DAILY_CHARS_PER_USER);
// Le UUID vient du client et peut être changé : on plafonne aussi par IP (plusieurs personnes peuvent partager une IP)
const perIp = new DailyQuota(DAILY_CHARS_PER_USER * 4);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface InteractionResponse {
  steps?: { type?: string; content?: { type?: string; data?: string; mime_type?: string }[] }[];
}

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

function ipKey(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  // Haché pour ne jamais garder d'IP en clair, même en mémoire
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_TTS_MODEL;
  const configuredVoice = process.env.GEMINI_TTS_VOICE;
  if (!apiKey || !model || !configuredVoice) return fail(503, "tts_not_configured");

  // Seule l'app YURA elle-même peut appeler cette route depuis un navigateur
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return fail(403, "forbidden_origin");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "invalid_json");
  }
  const { text, uuid, voice: voiceOverride } = (body ?? {}) as { text?: unknown; uuid?: unknown; voice?: unknown };
  if (typeof text !== "string" || typeof uuid !== "string" || !UUID_RE.test(uuid)) {
    return fail(400, "invalid_request");
  }
  // Choix de voix par le client : uniquement en développement (page /dev/voices)
  const voice =
    process.env.NODE_ENV === "development" && isGeminiVoice(voiceOverride) ? voiceOverride : configuredVoice;

  const clean = cleanTextForSpeech(text);
  if (!clean) return fail(400, "empty_text");
  if (clean.length > MAX_CHARS) return fail(413, "text_too_long");

  const ip = ipKey(req);
  if (!perUser.consume(uuid, clean.length)) return fail(429, "daily_quota_exceeded");
  if (!perIp.consume(ip, clean.length)) {
    perUser.refund(uuid, clean.length);
    return fail(429, "daily_quota_exceeded");
  }
  const refund = () => {
    perUser.refund(uuid, clean.length);
    perIp.refund(ip, clean.length);
  };

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model,
        // Par défaut l'API Interactions conserve les échanges (55 jours en payant) : on refuse
        store: false,
        input: [
          {
            type: "user_input",
            content: [
              {
                type: "text",
                text: clean,
                annotations: [{ type: "speech_metadata", style: STYLE }],
              },
            ],
          },
        ],
        // MP3 : ~3x plus léger que le WAV, important sur les forfaits mobiles
        response_format: { type: "audio", mime_type: "audio/mp3" },
        generation_config: { speech_config: [{ voice }] },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    refund();
    // Uniquement le type d'erreur, jamais le contenu
    console.error("TTS fetch failed:", err instanceof Error ? err.name : "unknown");
    return fail(502, "tts_unavailable");
  }

  if (!res.ok) {
    refund();
    console.error("TTS upstream error: HTTP", res.status);
    return fail(res.status === 429 ? 429 : 502, res.status === 429 ? "upstream_quota" : "tts_unavailable");
  }

  const json = (await res.json().catch(() => null)) as InteractionResponse | null;
  const audio = json?.steps
    ?.filter((s) => s.type === "model_output")
    .flatMap((s) => s.content ?? [])
    .filter((c) => c.type === "audio" && c.data)
    .at(-1);
  if (!audio?.data) {
    refund();
    console.error("TTS upstream error: no audio in response");
    return fail(502, "tts_unavailable");
  }

  const mime = parseAudioMime(audio.mime_type ?? "");
  let bytes: Uint8Array = Buffer.from(audio.data, "base64");
  let contentType: string;
  if (mime.type === "audio/mp3" || mime.type === "audio/mpeg") {
    contentType = "audio/mpeg";
  } else if (mime.type === "audio/wav") {
    contentType = "audio/wav";
  } else if (mime.type === "audio/l16" || mime.type === "audio/pcm") {
    // PCM brut sans en-tête : on ajoute l'en-tête WAV (24 kHz mono par défaut selon la doc)
    bytes = pcmToWav(bytes, mime.rate ?? 24_000, mime.channels ?? 1);
    contentType = "audio/wav";
  } else {
    refund();
    console.error("TTS upstream error: unexpected audio type", mime.type);
    return fail(502, "tts_unavailable");
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(bytes.length),
      // Contenu personnel : ni CDN ni cache navigateur partagé
      "Cache-Control": "private, no-store",
      "X-TTS-Remaining": String(perUser.remaining(uuid)),
    },
  });
}
