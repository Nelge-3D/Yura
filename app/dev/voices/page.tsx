import { notFound } from "next/navigation";
import VoiceTester from "./VoiceTester";

// Page temporaire pour choisir la voix de YURA à l'oreille. Inexistante en production.
export default function DevVoicesPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <VoiceTester currentVoice={process.env.GEMINI_TTS_VOICE ?? null} />;
}
