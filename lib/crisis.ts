export type CrisisLevel = "none" | "moderate" | "critical";

const CRITICAL_KEYWORDS = [
  "suicide", "suicider", "me suicider", "me tuer", "tuer moi",
  "mourir", "veux mourir", "envie de mourir", "plus vivre",
  "en finir", "mettre fin", "ma vie ne vaut", "plus la peine de vivre",
  "me jeter", "me pendre", "m'empoisonner", "overdose",
  "adieu", "dernière fois", "testament",
];

const MODERATE_KEYWORDS = [
  "plus envie", "je souffre", "insupportable", "abandon",
  "plus d'espoir", "sans espoir", "désespoir", "seul au monde",
  "personne ne m'aime", "inutile", "nul à rien", "rien ne va",
  "tout s'effondre", "à bout", "craquer", "déprimé", "dépression",
  "anxiété", "panique", "angoisser", "pleurer tout le temps",
];

export function detectCrisisLevel(message: string): CrisisLevel {
  const lower = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const keyword of CRITICAL_KEYWORDS) {
    const normalized = keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (lower.includes(normalized)) return "critical";
  }

  for (const keyword of MODERATE_KEYWORDS) {
    const normalized = keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (lower.includes(normalized)) return "moderate";
  }

  return "none";
}

export const CRISIS_CONTACTS = {
  gabon: {
    name: "SAMU Gabon",
    phone: "1300",
    description: "Urgences médicales et psychiatriques · 24h/24",
  },
};