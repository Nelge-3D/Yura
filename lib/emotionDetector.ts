export type EtatEmotionnel =
  | "calme"
  | "anxieux"
  | "triste"
  | "en_colere"
  | "joy"
  | "crise"
  | "neutre";

interface EmotionRule {
  etat: EtatEmotionnel;
  weight: number;
  patterns: RegExp[];
}

const RULES: EmotionRule[] = [
  {
    etat: "crise",
    weight: 100,
    patterns: [
      /mourir|veux mourir|envie de mourir|plus vivre/i,
      /suicid|me tuer|tuer moi|me pendre|m.empoisonner/i,
      /en finir|mettre fin|plus envie d.être là|ne veux plus être là/i,
      /me faire du mal|m.automutil|overdose|adieu|testament/i,
      /plus la peine de vivre|ma vie ne vaut/i,
    ],
  },
  {
    etat: "triste",
    weight: 10,
    patterns: [
      /je pleure|j.ai pleuré|en larmes/i,
      /j.ai mal|ça fait mal|trop mal|vraiment mal/i,
      /seul(e)?|toute? seul(e)?|isolé(e)?|personne ne (me |m.)?comprend/i,
      /perdu(e)?|je me sens perdu|tout perdu/i,
      /fatigué(e)? de tout|plus la force|à bout de souffle/i,
      /triste|tristesse|déprimé(e)?|dépression|chagrin/i,
      /ma vie va mal|tout va mal|rien ne va/i,
      /abandonné(e)?|plus d.espoir|sans espoir|désespoir/i,
      /deuil|perdu quelqu.un|il est mort|elle est morte/i,
    ],
  },
  {
    etat: "anxieux",
    weight: 10,
    patterns: [
      /j.ai peur|trop peur|une peur/i,
      /angoisse|angoissé(e)?|angoisser/i,
      /stressé(e)?|trop de stress|sous pression|trop de pression/i,
      /inquiet|inquiète|inquiétude/i,
      /je n.arrive pas à dormir|insomnie|nuit blanche/i,
      /paniqu|crise d.angoisse|crise de panique/i,
      /ça m.oppresse|je suffoque|j.étouffe/i,
      /trop anxieux|trop anxieuse/i,
    ],
  },
  {
    etat: "en_colere",
    weight: 10,
    patterns: [
      /c.est injuste|injustice/i,
      /j.en ai marre|ras le bol|marre de tout/i,
      /énervé(e)?|en colère|trop énervé|je suis furieux|furieuse/i,
      /ils m.ont fait|on m.a fait|ils m.ont/i,
      /je supporte plus|je ne supporte plus|j.en peux plus/i,
      /c.est nul|c.est con|c.est la merde/i,
      /frustré(e)?|frustration/i,
      /pourquoi moi|c.est toujours moi|toujours sur moi/i,
    ],
  },
  {
    etat: "joy",
    weight: 8,
    patterns: [
      /ça va mieux|je vais mieux|beaucoup mieux/i,
      /merci|akiba|je te remercie/i,
      /je me sens bien|je vais bien|ça va bien/i,
      /j.ai espoir|j.espère|plein d.espoir/i,
      /bonne journée|belle journée|super journée/i,
      /heureux|heureuse|content(e)?|joyeux|joyeuse/i,
      /j.ai réussi|j.ai eu|bonne nouvelle/i,
      /sourire|je souris|ça me fait sourire/i,
    ],
  },
  {
    etat: "calme",
    weight: 3,
    patterns: [
      /je voulais juste|je voulais te dire/i,
      /aujourd.hui|ma journée|cette semaine/i,
      /j.ai pensé à|je réfléchis à|je me demande/i,
      /comment ça marche|tu peux m.expliquer|une question/i,
      /en fait|tu sais|tu vois/i,
    ],
  },
];

export function detectEmotion(text: string): EtatEmotionnel {
  const scores: Partial<Record<EtatEmotionnel, number>> = {};

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        scores[rule.etat] = (scores[rule.etat] ?? 0) + rule.weight;
      }
    }
  }

  if (Object.keys(scores).length === 0) return "neutre";

  const best = (Object.entries(scores) as [EtatEmotionnel, number][]).reduce(
    (a, b) => (b[1] > a[1] ? b : a)
  );

  return best[0];
}

export type ExerciceType =
  | "respiration_4-4-6"
  | "ancrage_5-4-3-2-1"
  | "defusion_cognitive";

const VALID_EXERCICES: ExerciceType[] = [
  "respiration_4-4-6",
  "ancrage_5-4-3-2-1",
  "defusion_cognitive",
];

// Extrait l'émotion et l'éventuel exercice des JSON cachés en fin de réponse
// Format attendu : {"exercice":"..."}\n{"emotion":"..."} (exercice optionnel)
export function extractEmotionFromYura(raw: string): {
  text: string;
  emotion: EtatEmotionnel | null;
  exercice: ExerciceType | null;
} {
  const VALID_EMOTIONS: EtatEmotionnel[] = [
    "calme", "anxieux", "triste", "en_colere", "joy", "crise", "neutre",
  ];

  // Extraire le bloc exercice (n'importe où après le texte)
  const exMatch = raw.match(/\{"exercice"\s*:\s*"([^"]+)"\}/);
  const exercice = exMatch && VALID_EXERCICES.includes(exMatch[1] as ExerciceType)
    ? (exMatch[1] as ExerciceType)
    : null;
  const withoutEx = exMatch
    ? raw.slice(0, exMatch.index) + raw.slice(exMatch.index! + exMatch[0].length)
    : raw;

  // Extraire l'émotion (toujours en fin de message)
  const emMatch = withoutEx.match(/\{"emotion"\s*:\s*"([^"]+)"\}\s*$/);
  const emotion = emMatch && VALID_EMOTIONS.includes(emMatch[1] as EtatEmotionnel)
    ? (emMatch[1] as EtatEmotionnel)
    : null;
  const text = emMatch
    ? withoutEx.slice(0, emMatch.index).trim()
    : withoutEx.trim();

  return { text, emotion, exercice };
}
