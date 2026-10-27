// Reconnaissance vocale (Web Speech API, fr-FR) avec envoi automatique après un silence.
// Le navigateur décide seul quand il arrête d'écouter (souvent bien après la fin de la phrase) :
// on mesure nous-mêmes le silence depuis le dernier mot reconnu.

export const SILENCE_MS = 1500;

export interface ListenOptions {
  // Texte déjà entendu (ex. début d'une interruption à la voix)
  initialText?: string;
  silenceMs?: number;
  // Texte reconnu jusqu'ici (provisoire compris), pour l'affichage en direct
  onText?: (text: string) => void;
  // Fin de la prise de parole : texte complet
  onDone: (text: string) => void;
  // Rien n'a été dit avant que le navigateur arrête d'écouter
  onSilence?: () => void;
  // Micro refusé ou indisponible
  onBlocked?: () => void;
}

export function isRecognitionAvailable(): boolean {
  return typeof window !== "undefined" && !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);
}

// Démarre l'écoute ; renvoie une fonction qui l'annule (sans appeler onDone)
export function listen(options: ListenOptions): () => void {
  const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!SR) {
    options.onBlocked?.();
    return () => {};
  }
  const rec = new SR();
  rec.lang = "fr-FR";
  rec.interimResults = true;
  rec.continuous = true;
  rec.maxAlternatives = 1;

  const prefix = options.initialText?.trim() ? `${options.initialText.trim()} ` : "";
  let text = prefix.trim();
  let finished = false;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;

  const finish = () => {
    if (finished) return;
    finished = true;
    if (silenceTimer) clearTimeout(silenceTimer);
    rec.onresult = null;
    rec.onend = null;
    rec.onerror = null;
    try {
      rec.stop();
    } catch {
      // déjà arrêtée
    }
    if (text.trim()) options.onDone(text.trim());
    else options.onSilence?.();
  };

  rec.onresult = (event: SpeechRecognitionEvent) => {
    let heard = "";
    for (let i = 0; i < event.results.length; i++) heard += event.results[i][0].transcript;
    text = `${prefix}${heard}`.replace(/\s+/g, " ").trim();
    options.onText?.(text);
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(finish, options.silenceMs ?? SILENCE_MS);
  };
  rec.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      finished = true;
      if (silenceTimer) clearTimeout(silenceTimer);
      options.onBlocked?.();
    }
  };
  // Le navigateur a arrêté d'écouter de lui-même
  rec.onend = () => finish();

  // Interruption commencée : si plus rien n'est dit, on envoie ce qui a déjà été entendu
  if (prefix) silenceTimer = setTimeout(finish, options.silenceMs ?? SILENCE_MS);

  try {
    rec.start();
  } catch {
    finished = true;
    options.onBlocked?.();
  }

  return () => {
    finished = true;
    if (silenceTimer) clearTimeout(silenceTimer);
    rec.onresult = null;
    rec.onend = null;
    rec.onerror = null;
    try {
      rec.abort();
    } catch {
      // déjà arrêtée
    }
  };
}
