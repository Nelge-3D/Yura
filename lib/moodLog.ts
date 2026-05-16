import { EtatEmotionnel } from "./emotionDetector";

const STORAGE_KEY = "yura_mood_log";

export interface MoodEntry {
  date: string; // YYYY-MM-DD
  emotion: EtatEmotionnel;
  timestamp: number;
}

export function logMood(emotion: EtatEmotionnel): void {
  if (typeof window === "undefined" || emotion === "neutre") return;
  const existing = getMoodLog();
  const today = new Date().toISOString().split("T")[0];
  const filtered = existing.filter((e) => e.date !== today);
  filtered.push({ date: today, emotion, timestamp: Date.now() });
  const sorted = filtered.sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
}

export function getMoodLog(): MoodEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function getLast7Days(): { date: string; label: string; emotion: EtatEmotionnel | null }[] {
  const log = getMoodLog();
  const logMap = Object.fromEntries(log.map((e) => [e.date, e.emotion]));
  const days: { date: string; label: string; emotion: EtatEmotionnel | null }[] = [];
  const LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    days.push({ date: key, label: LABELS[d.getDay()], emotion: logMap[key] ?? null });
  }
  return days;
}
