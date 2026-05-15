import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { detectCrisisLevel } from "@/lib/crisis";
import { YURA_SYSTEM_PROMPT } from "@/lib/yuraSystemPrompt";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

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

    // Construire l'historique pour Gemini (format user/model)
    // Gemini exige que l'historique commence par un message 'user' — on ignore les messages 'model' initiaux
    const rawHistory = messages
      .slice(0, -1)
      .map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    const firstUserIdx = rawHistory.findIndex((m: { role: string }) => m.role === "user");
    const history = firstUserIdx >= 0 ? rawHistory.slice(firstUserIdx) : [];

    const systemPrompt = userName
      ? `${YURA_SYSTEM_PROMPT}\n\nL'utilisateur s'appelle "${userName}". Utilise son prénom naturellement.`
      : YURA_SYSTEM_PROMPT;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.85,
      },
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastUserMessage.content);
    const text = result.response.text();

    return NextResponse.json({
      message: text,
      crisisLevel,
    });
  } catch (error) {
    console.error("YURA API error:", error);

    const message =
      error instanceof Error && error.message.includes("API_KEY")
        ? "Clé API invalide. Vérifie ta configuration."
        : "Je rencontre une petite difficulté technique. Tu peux réessayer ?";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
