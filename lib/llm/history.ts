// Fenêtre de conversation pour les longues sessions : seuls les derniers messages partent en entier,
// les plus anciens sont remplacés par un résumé court (mis à jour tous les SUMMARY_EVERY messages).

export const RECENT_MESSAGES = 20; // ~10 échanges
export const SUMMARY_EVERY = 6;

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface SummaryState {
  text: string;
  // Horodatage du dernier message déjà inclus dans le résumé
  upTo: number;
}

// Messages envoyés en entier au modèle
export function recentWindow<T extends HistoryMessage>(messages: T[]): T[] {
  return messages.slice(-RECENT_MESSAGES);
}

// Messages sortis de la fenêtre et pas encore résumés ; null s'il n'y en a pas encore assez
export function messagesToSummarize<T extends HistoryMessage>(messages: T[], summary: SummaryState | null): T[] | null {
  const older = messages.slice(0, Math.max(0, messages.length - RECENT_MESSAGES));
  const pending = older.filter((m) => m.timestamp > (summary?.upTo ?? 0));
  return pending.length >= SUMMARY_EVERY ? pending : null;
}
