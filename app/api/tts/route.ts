import { NextRequest } from "next/server";
import { fail, interactionBody, INTERACTIONS_ENDPOINT, prepareTts, remainingChars, upstreamFailure } from "@/lib/tts/ttsRequest";
import { parseAudioMime, pcmToWav } from "@/lib/tts/wav";

// Synthèse vocale Gemini en une seule réponse (MP3). Utilisée quand le streaming n'est pas possible
// (pas d'AudioContext) et par la page /dev/voices.
// CONFIDENTIALITÉ : le texte n'est jamais journalisé, ni ici ni dans les messages d'erreur.

const TIMEOUT_MS = 30_000;

interface InteractionResponse {
  steps?: { type?: string; content?: { type?: string; data?: string; mime_type?: string }[] }[];
}

export async function POST(req: NextRequest) {
  const prepared = await prepareTts(req);
  if ("error" in prepared) return prepared.error;
  const { job } = prepared;

  let res: Response;
  try {
    res = await fetch(INTERACTIONS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": job.apiKey },
      // MP3 : ~3x plus léger que le WAV, important sur les forfaits mobiles
      body: interactionBody(job, { stream: false, mimeType: "audio/mp3" }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    job.refund();
    // Uniquement le type d'erreur, jamais le contenu
    console.error("TTS fetch failed:", err instanceof Error ? err.name : "unknown");
    return fail(502, "tts_unavailable");
  }

  if (!res.ok) {
    job.refund();
    return upstreamFailure(res.status);
  }

  const json = (await res.json().catch(() => null)) as InteractionResponse | null;
  const audio = json?.steps
    ?.filter((s) => s.type === "model_output")
    .flatMap((s) => s.content ?? [])
    .filter((c) => c.type === "audio" && c.data)
    .at(-1);
  if (!audio?.data) {
    job.refund();
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
    job.refund();
    console.error("TTS upstream error: unexpected audio type", mime.type);
    return fail(502, "tts_unavailable");
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(bytes.length),
      // Contenu personnel : ni CDN ni cache navigateur partagé
      "Cache-Control": "private, no-store",
      "X-TTS-Remaining": String(remainingChars(job.uuid)),
    },
  });
}
