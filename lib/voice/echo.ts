// Quand YURA parle dans le haut-parleur, le micro l'entend aussi. Pour l'interruption à la voix,
// on ignore ce qui ressemble à ses propres paroles (écho) et on ne réagit qu'à une vraie prise de parole.

function words(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("\\p{M}", "gu"), "") // accents détachés par NFD
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

// true si ce qui est entendu ressemble surtout à ce que YURA est en train de dire
export function isLikelyEcho(heard: string, spoken: string): boolean {
  const heardWords = words(heard);
  if (heardWords.length === 0) return true;
  const spokenWords = new Set(words(spoken));
  const shared = heardWords.filter((w) => spokenWords.has(w)).length;
  return shared / heardWords.length >= 0.6;
}

// Assez de mots, et pas un écho : la personne veut prendre la parole
export function isBargeIn(heard: string, spoken: string): boolean {
  return words(heard).length >= 2 && !isLikelyEcho(heard, spoken);
}
