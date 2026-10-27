// Filtre le flux de texte du modèle pour l'affichage en direct.
// Les balises cachées ({"emotion": ...}, {"exercice": ...}) ne doivent JAMAIS apparaître, même brièvement :
// tout ce qui suit la première accolade (ou un bloc de code) est retenu jusqu'à la fin du flux,
// puis le texte final est recalculé proprement à partir de la réponse complète.

import { extractEmotionFromYura, type EtatEmotionnel, type ExerciceType } from "../emotionDetector.ts";

// Les tirets longs (style « IA ») deviennent une virgule
export function softenDashes(text: string): string {
  return text.replace(/\s*[—―]\s*/g, ", ").replace(/,\s*,/g, ",");
}

export interface FinalReply {
  text: string;
  emotion: EtatEmotionnel | null;
  exercice: ExerciceType | null;
}

export class VisibleTextFilter {
  private raw = "";
  private emitted = "";

  // Ajoute un morceau du flux ; renvoie le nouveau texte affichable (peut être vide)
  push(chunk: string): string {
    this.raw += chunk;
    const holdFrom = this.raw.search(/[{`]/);
    let visible = holdFrom === -1 ? this.raw : this.raw.slice(0, holdFrom);
    // Les espaces de fin sont retenus : un tiret long qui arriverait juste après changerait le rendu
    visible = softenDashes(visible.replace(/\s+$/, ""));
    if (!visible.startsWith(this.emitted)) return ""; // cas rare : le texte final corrigera à la fin
    const delta = visible.slice(this.emitted.length);
    this.emitted = visible;
    return delta;
  }

  // Fin du flux : texte final propre, émotion et exercice
  end(): FinalReply {
    const { text, emotion, exercice } = extractEmotionFromYura(this.raw);
    return { text: softenDashes(text).trim(), emotion, exercice };
  }

  get rawText(): string {
    return this.raw;
  }
}
