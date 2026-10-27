import { NextRequest, NextResponse } from "next/server";
import { ChatTurn, FALLBACK_MODEL, LlmError, PRIMARY_MODEL, streamText } from "@/lib/llm/gemini";
import { VisibleTextFilter } from "@/lib/llm/visibleText";
import { detectCrisisLevel } from "@/lib/crisis";
import { YURA_SYSTEM_PROMPT } from "@/lib/yuraSystemPrompt";

// Réponse en streaming (NDJSON, une ligne JSON par événement) :
//   {"type":"delta","text":"…"}  texte affichable, déjà filtré (aucune balise cachée)
//   {"type":"done","text":"…","emotion":…,"exercice":…,"crisisLevel":…,"model":…}  texte final propre
//   {"type":"error"}  l'interface propose « Réessayer » (aucun message d'erreur n'est sauvegardé)

// Délai maximal avant le premier mot : au-delà, on bascule sur le modèle de secours
const FIRST_TOKEN_TIMEOUT_MS = 12_000;
const TOTAL_TIMEOUT_MS = 60_000;

export async function POST(req: NextRequest) {
  // summary : résumé des échanges anciens (seuls les ~20 derniers messages sont envoyés en entier)
  const { messages, userName, summary } = (await req.json()) as {
    messages: { role: string; content: string }[];
    userName?: string | null;
    summary?: string;
  };

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "Configuration manquante." }, { status: 500 });
  }

  const lastUserMessage = messages.findLast((m) => m.role === "user");
  if (!lastUserMessage) {
    return NextResponse.json({ error: "Aucun message" }, { status: 400 });
  }

  const crisisLevel = detectCrisisLevel(lastUserMessage.content);

  // Historique au format user/model. Il doit commencer par un message « user » (on ignore les
  // messages d'accueil de YURA) et alterner les rôles : les messages consécutifs du même rôle sont fusionnés.
  const turns: ChatTurn[] = [];
  for (const m of messages) {
    const role = m.role === "assistant" ? "model" : "user";
    if (turns.length === 0 && role === "model") continue;
    const last = turns[turns.length - 1];
    if (last && last.role === role) last.text += `\n\n${m.content}`;
    else turns.push({ role, text: m.content });
  }

  let system = YURA_SYSTEM_PROMPT;
  if (userName) system += `\n\nL'utilisateur s'appelle "${userName}". Utilise son prénom naturellement.`;
  if (summary?.trim()) {
    system += `\n\n## Ce dont tu te souviens du début de cette conversation\n${summary.trim().slice(0, 1500)}\nTu te souviens réellement de ces éléments (prénom, situation, ce qui a été dit) : si la personne te les demande, réponds en t'appuyant dessus. N'évoque jamais l'existence d'un résumé.`;
  }
  const llmRequest = { system, turns };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      let filter = new VisibleTextFilter();
      let sentAnything = false;
      let promptTokens: number | null = null;

      // Lit le flux d'un modèle. Échoue (pour basculer) si aucun mot n'arrive à temps.
      const run = async (model: string) => {
        const abort = new AbortController();
        const onClientAbort = () => abort.abort();
        req.signal.addEventListener("abort", onClientAbort);
        const firstTimer = setTimeout(() => abort.abort(), FIRST_TOKEN_TIMEOUT_MS);
        const totalTimer = setTimeout(() => abort.abort(), TOTAL_TIMEOUT_MS);
        try {
          for await (const chunk of streamText(model, llmRequest, abort.signal, (n) => (promptTokens = n))) {
            clearTimeout(firstTimer);
            const delta = filter.push(chunk);
            if (delta) {
              sentAnything = true;
              send({ type: "delta", text: delta });
            }
          }
        } finally {
          clearTimeout(firstTimer);
          clearTimeout(totalTimer);
          req.signal.removeEventListener("abort", onClientAbort);
        }
      };

      let model = PRIMARY_MODEL;
      try {
        try {
          await run(PRIMARY_MODEL);
          // Réponse vide (seulement de la « réflexion » ou une balise) : on tente aussi le secours
          if (!sentAnything && !filter.end().text) throw new LlmError(204);
        } catch (err) {
          // Bascule seulement si rien n'a encore été affiché (sinon le texte serait mélangé)
          if (sentAnything || req.signal.aborted) throw err;
          console.error(
            `LLM ${PRIMARY_MODEL} indisponible (${err instanceof LlmError ? err.status : err instanceof Error ? err.name : "?"}), bascule sur ${FALLBACK_MODEL}`
          );
          model = FALLBACK_MODEL;
          filter = new VisibleTextFilter();
          await run(FALLBACK_MODEL);
        }

        const final = filter.end();
        if (!final.text) throw new LlmError(502);
        send({ type: "done", text: final.text, emotion: final.emotion, exercice: final.exercice, crisisLevel, model, promptTokens });
      } catch (err) {
        // Jamais le contenu des messages : seulement le type d'erreur
        console.error("YURA API error:", err instanceof Error ? err.message : "inconnue");
        if (!req.signal.aborted) send({ type: "error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
