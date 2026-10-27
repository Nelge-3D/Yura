// Appel du modèle de conversation (Gemma 4 par défaut, Gemini Flash en secours) via l'API REST Gemini.
// Serveur uniquement. Le contenu des messages n'est jamais journalisé.

const API = "https://generativelanguage.googleapis.com/v1beta/models";

export const PRIMARY_MODEL = process.env.LLM_MODEL || "gemma-4-26b-a4b-it";
export const FALLBACK_MODEL = process.env.LLM_FALLBACK_MODEL || "gemini-2.5-flash";

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

export interface LlmRequest {
  system: string;
  turns: ChatTurn[]; // se termine par le message de l'utilisateur
}

// La « réflexion » rallonge énormément le délai (Gemma 4 : 14 s au lieu de 1,4 s) : on la coupe.
function thinkingConfig(model: string): Record<string, unknown> {
  if (model.startsWith("gemma-4")) return { thinkingConfig: { thinkingLevel: "minimal" } };
  if (model.startsWith("gemini-2.5")) return { thinkingConfig: { thinkingBudget: 0 } };
  return {};
}

export function requestBody(model: string, req: LlmRequest): string {
  return JSON.stringify({
    systemInstruction: { parts: [{ text: req.system }] },
    contents: req.turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    generationConfig: { temperature: 0.85, maxOutputTokens: 1024, ...thinkingConfig(model) },
  });
}

interface GenerateResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  usageMetadata?: { promptTokenCount?: number };
}

export class LlmError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`LLM HTTP ${status}`);
    this.status = status;
  }
}

// Texte de la réponse, sans les parties « réflexion »
export function extractText(data: GenerateResponse): string {
  return (data.candidates?.[0]?.content?.parts ?? [])
    .filter((p) => !p.thought && p.text)
    .map((p) => p.text)
    .join("");
}

async function generateOnce(model: string, req: LlmRequest, timeoutMs: number): Promise<string> {
  const res = await fetch(`${API}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
    body: requestBody(model, req),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new LlmError(res.status);
  const text = extractText((await res.json()) as GenerateResponse);
  if (!text.trim()) throw new LlmError(502);
  return text;
}

// Flux de texte (SSE). Les parties « réflexion » sont ignorées.
// onUsage reçoit le nombre de tokens d'entrée facturés (system + historique), pour le suivi des quotas.
export async function* streamText(
  model: string,
  req: LlmRequest,
  signal: AbortSignal,
  onUsage?: (promptTokens: number) => void
): AsyncGenerator<string> {
  const res = await fetch(`${API}/${model}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
    body: requestBody(model, req),
    signal,
  });
  if (!res.ok || !res.body) throw new LlmError(res.status);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    // Les événements sont séparés par une ligne vide (en CRLF chez Google)
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) >= 0) {
      const event = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const data = event.replace(/^data: ?/, "").trim();
      if (!data) continue;
      const parsed = JSON.parse(data) as GenerateResponse;
      if (parsed.usageMetadata?.promptTokenCount) onUsage?.(parsed.usageMetadata.promptTokenCount);
      const text = extractText(parsed);
      if (text) yield text;
    }
  }
}

// Essaie le modèle principal ; en cas de quota (429), d'erreur ou de lenteur, bascule sur le secours.
export async function generate(req: LlmRequest): Promise<{ text: string; model: string }> {
  try {
    return { text: await generateOnce(PRIMARY_MODEL, req, 20_000), model: PRIMARY_MODEL };
  } catch (err) {
    console.error(
      `LLM ${PRIMARY_MODEL} indisponible (${err instanceof LlmError ? err.status : err instanceof Error ? err.name : "?"}), bascule sur ${FALLBACK_MODEL}`
    );
    return { text: await generateOnce(FALLBACK_MODEL, req, 30_000), model: FALLBACK_MODEL };
  }
}
