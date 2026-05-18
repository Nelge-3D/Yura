import { EtatEmotionnel } from "./emotionDetector";
import { getOrCreateSessionId } from "./uuid";

const STORAGE_KEY = "yura_journal";

export interface EntreeJournal {
  date: string;
  uuid: string;
  nbMessages: number;
  etatDebut: EtatEmotionnel;
  etatFin: EtatEmotionnel;
  dureeMinutes: number;
  phraseYURA?: string;
}

export function sauvegarderSession(
  entree: Omit<EntreeJournal, "uuid" | "date">
): void {
  if (typeof window === "undefined") return;
  const journal = getJournal();
  journal.push({
    ...entree,
    date: new Date().toISOString().split("T")[0],
    uuid: getOrCreateSessionId(),
  });
  if (journal.length > 30) journal.shift();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journal));
}

export function getJournal(): EntreeJournal[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function getLastSession(): EntreeJournal | null {
  const journal = getJournal();
  return journal.length > 0 ? journal[journal.length - 1] : null;
}

export function effacerJournal(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
