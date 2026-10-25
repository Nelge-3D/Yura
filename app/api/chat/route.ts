import { NextRequest, NextResponse } from "next/server";
import { ChatTurn, generate } from "@/lib/llm/gemini";
import { detectCrisisLevel } from "@/lib/crisis";
import { YURA_SYSTEM_PROMPT } from "@/lib/yuraSystemPrompt";
import knowledgeBase from "@/data/yura-knowledge.json";

const knowledgeContext = `
## BASE DE CONNAISSANCES YURA (prioritaire)
Tu dois consulter ces données en priorité avant de répondre.
Utilise les proverbes, métaphores et vocabulaire quand pertinent.
Ne les invente jamais — utilise uniquement ceux listés ici.

${JSON.stringify(knowledgeBase, null, 2)}
`;

export async function POST(req: NextRequest) {
  try {
    const { messages, userName } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Configuration manquante. Contacte l'administrateur." },
        { status: 500 }
      );
    }

    const lastUserMessage = messages.findLast(
      (m: { role: string }) => m.role === "user"
    );

    if (!lastUserMessage) {
      return NextResponse.json({ error: "Aucun message" }, { status: 400 });
    }

    const crisisLevel = detectCrisisLevel(lastUserMessage.content);

    // Historique au format user/model. Il doit commencer par un message « user » (on ignore les
    // messages d'accueil de YURA) et alterner les rôles : les messages consécutifs du même rôle sont fusionnés.
    const turns: ChatTurn[] = [];
    for (const m of messages as { role: string; content: string }[]) {
      const role = m.role === "assistant" ? "model" : "user";
      if (turns.length === 0 && role === "model") continue;
      const last = turns[turns.length - 1];
      if (last && last.role === role) last.text += `\n\n${m.content}`;
      else turns.push({ role, text: m.content });
    }

    const systemPrompt = userName
      ? `${YURA_SYSTEM_PROMPT}\n\nL'utilisateur s'appelle "${userName}". Utilise son prénom naturellement.\n\n${knowledgeContext}`
      : `${YURA_SYSTEM_PROMPT}\n\n${knowledgeContext}`;

    const { text, model } = await generate({ system: systemPrompt, turns });

    return NextResponse.json(
      { message: text, crisisLevel },
      // Modèle effectivement utilisé (Gemma ou secours), pour le diagnostic
      { headers: { "X-YURA-Model": model } }
    );
  } catch (error) {
    // Jamais le contenu des messages : seulement le type d'erreur
    console.error("YURA API error:", error instanceof Error ? error.message : "inconnue");

    return NextResponse.json(
      { error: "Je rencontre une petite difficulté technique. Tu peux réessayer ?" },
      { status: 500 }
    );
  }
}
