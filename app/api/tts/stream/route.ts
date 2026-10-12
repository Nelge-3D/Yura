import { NextRequest } from "next/server";
import { createSseAudioParser } from "@/lib/tts/sse";
import { fail, interactionBody, INTERACTIONS_ENDPOINT, prepareTts, remainingChars, upstreamFailure } from "@/lib/tts/ttsRequest";

// Synthèse vocale Gemini en streaming : l'audio est relayé au navigateur au fil de la génération
// (PCM 16 bits, 24 kHz, mono, sans en-tête). Premier son en ~1 s au lieu d'attendre tout le fichier.
// CONFIDENTIALITÉ : le texte n'est jamais journalisé, ni ici ni dans les messages d'erreur.

const TIMEOUT_MS = 60_000;

export async function POST(req: NextRequest) {
  const prepared = await prepareTts(req);
  if ("error" in prepared) return prepared.error;
  const { job } = prepared;

  let upstream: Response;
  try {
    upstream = await fetch(INTERACTIONS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": job.apiKey },
      body: interactionBody(job, { stream: true, mimeType: "audio/l16" }),
      // Si l'utilisateur interrompt la lecture, on arrête aussi la génération chez Google
      signal: AbortSignal.any([req.signal, AbortSignal.timeout(TIMEOUT_MS)]),
    });
  } catch (err) {
    job.refund();
    console.error("TTS stream fetch failed:", err instanceof Error ? err.name : "unknown");
    return fail(502, "tts_unavailable");
  }

  if (!upstream.ok || !upstream.body) {
    job.refund();
    return upstreamFailure(upstream.status);
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const parser = createSseAudioParser();

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        // Lire jusqu'à avoir de l'audio à transmettre (ou la fin du flux)
        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          const { audio, done: finished, error } = parser.push(decoder.decode(value, { stream: true }));
          if (error) console.error("TTS stream error event from upstream");
          for (const chunk of audio) controller.enqueue(new Uint8Array(Buffer.from(chunk, "base64")));
          if (finished || error) {
            controller.close();
            await reader.cancel().catch(() => {});
            return;
          }
          if (audio.length > 0) return;
        }
      } catch (err) {
        console.error("TTS stream interrupted:", err instanceof Error ? err.name : "unknown");
        controller.close();
      }
    },
    cancel() {
      void reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "audio/l16; rate=24000; channels=1",
      // Contenu personnel : ni CDN ni cache ; pas de mise en tampon par un proxy
      "Cache-Control": "private, no-store, no-transform",
      "X-Accel-Buffering": "no",
      "X-TTS-Remaining": String(remainingChars(job.uuid)),
    },
  });
}
