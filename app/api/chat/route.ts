// api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { detectCrisisLevel } from "@/lib/crisis";
import { getSmartResponse, getRandomResponse } from "@/lib/audioResponses"; // ← Importer getSmartResponse

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const lastUserMessage = messages.findLast(
      (m: { role: string }) => m.role === "user"
    );

    if (!lastUserMessage) {
      return NextResponse.json({ error: "Aucun message" }, { status: 400 });
    }

    const crisisLevel = detectCrisisLevel(lastUserMessage.content);
    
    let response: { text: string; audioUrl: string };
    
    if (crisisLevel === "critical") {
      response = getRandomResponse("critical");
    } else if (crisisLevel === "moderate") {
      response = getRandomResponse("moderate");
    } else {
      // ✅ Utiliser getSmartResponse au lieu de detectAudioCategory + getRandomResponse
      response = getSmartResponse(lastUserMessage.content);
    }

    // Simule un délai naturel
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));

    return NextResponse.json({ 
      message: response.text,
      audioUrl: response.audioUrl,
      crisisLevel 
    });
  } catch (error) {
    console.error("YURA error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}