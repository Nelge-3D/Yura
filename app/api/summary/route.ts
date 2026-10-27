import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/llm/gemini";

// Met à jour le résumé court des échanges anciens d'une conversation (appelé en arrière-plan).
// Le contenu n'est jamais journalisé ni conservé côté serveur.

const SYSTEM = `Tu mets à jour le résumé d'une conversation entre une personne et YURA, une compagne d'écoute.
Écris un résumé factuel et bref (6 lignes maximum, 120 mots maximum), en français, à la 3e personne :
- prénom de la personne s'il a été donné ;
- sujets abordés et situation (travail, famille, études, santé…) ;
- émotions exprimées et leur évolution ;
- éléments importants à ne pas oublier (personnes, événements, ce qui l'aide ou lui fait du mal) ;
- tout signe de crise ou de danger mentionné, et si le 1300 a été proposé.
Pas d'interprétation, pas de diagnostic, pas de conseils. Réponds uniquement par le résumé, sans titre.`;

export async function POST(req: NextRequest) {
  try {
    const { previous, messages } = (await req.json()) as {
      previous?: string;
      messages?: { role: string; content: string }[];
    };
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const transcript = messages
      .slice(-40)
      .map((m) => `${m.role === "user" ? "Personne" : "YURA"} : ${String(m.content).slice(0, 1200)}`)
      .join("\n");
    const prompt = `${previous?.trim() ? `Résumé actuel :\n${previous.trim()}\n\n` : ""}Nouveaux échanges à intégrer :\n${transcript}\n\nRésumé mis à jour :`;

    const { text } = await generate({ system: SYSTEM, turns: [{ role: "user", text: prompt }] });
    return NextResponse.json({ summary: text.trim().slice(0, 1500) }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("YURA summary error:", err instanceof Error ? err.message : "inconnue");
    return NextResponse.json({ error: "summary_unavailable" }, { status: 502 });
  }
}
