// Découpe un texte qui arrive en flux en phrases prêtes à être lues, dès qu'elles sont complètes.
// Une phrase est complète quand elle se termine par . ! ? … (ou un retour à la ligne) suivi d'un espace.
// Les phrases très courtes (« Mbolo ! ») sont regroupées avec la suivante pour une diction moins hachée.

const MIN_CHUNK = 24;

export interface SentenceCursor {
  // Position dans le texte jusqu'où les phrases ont déjà été extraites
  offset: number;
}

// Renvoie les nouvelles phrases complètes depuis cursor.offset (et avance le curseur).
// final = true à la fin du flux : le reste du texte est rendu même sans ponctuation finale.
export function takeSentences(text: string, cursor: SentenceCursor, final = false): string[] {
  const rest = text.slice(cursor.offset);
  const out: string[] = [];
  let consumed = 0;
  let pending = "";

  const re = /[^.!?…\n]*(?:[.!?…]+["»)\]]*(?=\s)|\n+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rest)) !== null) {
    if (m[0].length === 0) {
      re.lastIndex++;
      continue;
    }
    pending += m[0];
    consumed = re.lastIndex;
    if (pending.trim().length >= MIN_CHUNK) {
      out.push(pending.trim());
      pending = "";
    }
  }
  // Une phrase courte en attente reste dans le flux (elle partira avec la suivante)
  if (pending) consumed -= pending.length;

  if (final) {
    const tail = rest.slice(consumed).trim();
    if (tail) out.push(tail);
    consumed = rest.length;
  }
  cursor.offset += consumed;
  return out.filter((s) => /[\p{L}\p{N}]/u.test(s));
}
