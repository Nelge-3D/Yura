// lib/audioResponses.ts

export type AudioCategory = 
  | "greetings"
  | "sad"
  | "alone"
  | "work"
  | "family"
  | "anxiety"
  | "moderate"
  | "critical"
  | "default";

// Mapping des catégories vers les fichiers audio
const AUDIO_MAP: Record<AudioCategory, string[]> = {
  greetings: ["greetings_1.mp3", "greetings_2.mp3"],
  sad: ["sad_1.mp3", "sad_2.mp3"],
  alone: ["alone_1.mp3"],
  work: ["work_1.mp3"],
  family: ["family_1.mp3"],
  anxiety: ["anxiety_1.mp3"],
  moderate: ["moderate_1.mp3", "moderate_2.mp3"],
  critical: ["critical_1.mp3"],
  default: ["default_1.mp3", "default_2.mp3", "default_3.mp3", "default_4.mp3", "default_5.mp3"],
};

// Les textes associés (pour affichage dans le chat)
export const RESPONSE_TEXTS: Record<AudioCategory, string[]> = {
  greetings: [
    "Mbolo ! Je suis contente que tu sois là. Comment s'est passée ta journée aujourd'hui ?",  // INDEX 0 → greetings_1.mp3
    "Mbolo ! Je t'écoute complètement. Qu'est-ce qui t'amène à me parler aujourd'hui ?",      // INDEX 1 → greetings_2.mp3
  ],
  sad: [
    "Je t'entends. Être triste, c'est humain et courageux d'en parler. Chez les Fang, on dit que les larmes sont la pluie qui permet à la forêt du cœur de repousser. Qu'est-ce qui s'est passé ?",  // INDEX 0 → sad_1.mp3
    "Ta tristesse mérite d'être entendue. Je suis là, prends ton temps. Est-ce que c'est quelque chose qui dure depuis longtemps ?",  // INDEX 1 → sad_2.mp3
  ],
  alone: [
    "La solitude peut peser très lourd. Mais sache que tu n'es pas seul(e) ici, maintenant. Chez les Myénè, on dit qu'un seul arbre ne fait pas une forêt — nous avons besoin les uns des autres. Y a-t-il quelqu'un dans ta vie à qui tu as pu parler ?",
  ],
  work: [
    "Le travail et les pressions du quotidien peuvent vraiment épuiser. Est-ce que c'est quelque chose qui pèse sur toi depuis longtemps, ou c'est récent ?",
  ],
  family: [
    "La famille, c'est souvent là où les émotions sont les plus intenses. Tu veux me dire ce qui se passe avec eux ? Je t'écoute sans jugement.",
  ],
  anxiety: [
    "L'anxiété peut être épuisante — comme si ton esprit ne s'arrêtait jamais. Une chose qui peut aider : nomme 5 choses que tu vois autour de toi en ce moment. Ça ancre dans le présent. Tu veux essayer ?",
  ],
  moderate: [
    "Je sens que tu traverses quelque chose de difficile en ce moment. Chez les Obamba, on dit que même la forêt plie sous la tempête, mais ses racines tiennent. Tu veux me dire ce qui se passe vraiment ?",  // moderate_1.mp3
    "Ce que tu ressens est valide. Parfois le poids devient trop lourd à porter seul. Je suis là, sans jugement. Qu'est-ce qui t'a amené à te sentir comme ça ?",  // moderate_2.mp3
  ],
  critical: [
    "Je te comprends, et ce que tu ressens est très important. Tu n'es pas seul(e). Je voudrais te connecter avec quelqu'un qui peut vraiment t'aider maintenant. Peux-tu appeler le 1300 (CHU Libreville) ? Je reste là avec toi.",
  ],
  default: [
    "Je t'écoute vraiment. Continue, dis-moi en plus sur ce que tu ressens...",
    "Chez les Obamba, la parole est sacrée — ce que tu partages ici a de la valeur. Qu'est-ce que tu voudrais que je comprenne de ta situation ?",
    "Merci de me faire confiance avec ça. Comment est-ce que tu te sens physiquement en ce moment — ton corps, ton sommeil, ton énergie ?",
    "Je suis là, sans jugement et sans pression. Est-ce qu'il y a quelque chose de précis que tu voudrais explorer ensemble aujourd'hui ?",
    "Ce que tu vis mérite attention. Depuis combien de temps tu ressens ça ?",
  ],
};

// FONCTION EXISTANTE - Gardée pour compatibilité
export function detectAudioCategory(message: string): AudioCategory {
  const lower = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (lower.match(/bonjour|salut|mbolo|hello|coucou|bonsoir/))
    return "greetings";
  if (lower.match(/trist|pleur|mal|chagrin|pein|souffr/))
    return "sad";
  if (lower.match(/seul|seule|isol|personne|abandonn/))
    return "alone";
  if (lower.match(/travail|boulot|patron|chef|licenci|emploi/))
    return "work";
  if (lower.match(/famille|parent|mere|pere|frere|soeur|enfant|mari|femme/))
    return "family";
  if (lower.match(/anxieu|angoiss|paniqu|stress|inquiet/))
    return "anxiety";
  
  return "default";
}

// FONCTION EXISTANTE - Gardée pour compatibilité
export function getRandomResponse(category: AudioCategory): { text: string; audioUrl: string } {
  const texts = RESPONSE_TEXTS[category];
  const audios = AUDIO_MAP[category];
  
  const randomIndex = Math.floor(Math.random() * texts.length);
  
  return {
    text: texts[randomIndex],
    audioUrl: `/audio/yura/${audios[randomIndex]}`,
  };
}

// FONCTION SPÉCIFIQUE POUR GREETINGS
// "salut" → greetings_1.mp3 avec le texte "Mbolo ! Je suis contente..."
// "bonjour" → greetings_2.mp3 avec le texte "Mbolo ! Je t'écoute complètement..."
export function getGreetingsResponse(message: string): { text: string; audioUrl: string } {
  const lower = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // "salut" → INDEX 0 (greetings_1.mp3)
  if (lower.match(/^salut\b|\bsalut\b/)) {
    return {
      text: RESPONSE_TEXTS.greetings[0],  // "Mbolo ! Je suis contente..."
      audioUrl: "/audio/yura/greetings_1.mp3"
    };
  }
  // "bonjour" → INDEX 1 (greetings_2.mp3)
  else if (lower.match(/^bonjour\b|\bbonjour\b/)) {
    return {
      text: RESPONSE_TEXTS.greetings[1],  // "Mbolo ! Je t'écoute complètement..."
      audioUrl: "/audio/yura/greetings_2.mp3"
    };
  }
  // Autres salutations (mbolo, hello, coucou, bonsoir) → aléatoire mais cohérent
  else {
    return getRandomResponse("greetings");
  }
}

// FONCTION SPÉCIFIQUE POUR SAD
// Tristesse modérée → sad_1.mp3 avec le texte "Je t'entends. Être triste..."
// Tristesse intense → sad_2.mp3 avec le texte "Ta tristesse mérite d'être entendue..."
export function getSadResponse(message: string): { text: string; audioUrl: string } {
  const lower = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Tristesse intense → INDEX 1 (sad_2.mp3)
  if (lower.match(/triste|pleure|chagrin|désespoir|déprime|déprimé|mal-être|suicide|mort|profond|vraiment mal/)) {
    return {
      text: RESPONSE_TEXTS.sad[1],  // "Ta tristesse mérite d'être entendue..."
      audioUrl: "/audio/yura/sad_2.mp3"
    };
  }
  // Tristesse modérée → INDEX 0 (sad_1.mp3)
  else if (lower.match(/pein|souffr|mal|pas bien|ça va pas|tristesse|triste/)) {
    return {
      text: RESPONSE_TEXTS.sad[0],  // "Je t'entends. Être triste..."
      audioUrl: "/audio/yura/sad_1.mp3"
    };
  }
  
  // Par défaut
  return getRandomResponse("sad");
}

// FONCTION PRINCIPALE INTELLIGENTE - À utiliser dans votre code
export function getSmartResponse(message: string): { text: string; audioUrl: string } {
  const lower = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Vérifier les salutations avec mots-clés spécifiques
  if (lower.match(/bonjour|salut|mbolo|hello|coucou|bonsoir/)) {
    return getGreetingsResponse(message);
  }
  
  // Vérifier la tristesse
  if (lower.match(/trist|pleur|mal|chagrin|pein|souffr/)) {
    return getSadResponse(message);
  }
  
  // Autres catégories
  if (lower.match(/seul|seule|isol|personne|abandonn/))
    return getRandomResponse("alone");
  if (lower.match(/travail|boulot|patron|chef|licenci|emploi/))
    return getRandomResponse("work");
  if (lower.match(/famille|parent|mere|pere|frere|soeur|enfant|mari|femme/))
    return getRandomResponse("family");
  if (lower.match(/anxieu|angoiss|paniqu|stress|inquiet/))
    return getRandomResponse("anxiety");
  
  return getRandomResponse("default");
}