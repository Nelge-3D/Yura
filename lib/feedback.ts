export interface FeedbackPayload {
  uuid: string;
  etatDebut: string;
  etatFin: string;
  nbMessages: number;
  dureeMinutes: number;
  note: 1 | 2 | 3;
  commentaire?: string;
}

export async function envoyerFeedback(feedback: FeedbackPayload): Promise<void> {
  if (!process.env.NEXT_PUBLIC_FEEDBACK_URL) return;

  try {
    await fetch(process.env.NEXT_PUBLIC_FEEDBACK_URL, {
      method: "POST",
      body: JSON.stringify({ ...feedback, version: "1.1.0" }),
    });
  } catch {
    // Silencieux — le feedback ne doit jamais bloquer l'UX
  }
}
