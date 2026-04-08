import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "yura_session_id";
const NAME_KEY = "yura_user_name";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr-placeholder";
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const newId = uuidv4();
  localStorage.setItem(STORAGE_KEY, newId);
  return newId;
}

export function getUserName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NAME_KEY);
}

export function setUserName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NAME_KEY, name);
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(NAME_KEY);
}