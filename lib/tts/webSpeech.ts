// Voix de secours : Web Speech API du navigateur, réglée pour sonner le moins robotique possible.

const RATE = 0.95;
// Pas de pitch artificiel : il rend la voix plus robotique
const PITCH = 1.0;
const PAUSE_BETWEEN_SENTENCES_MS = 250;

type VoiceLike = Pick<SpeechSynthesisVoice, "name" | "lang">;

// YURA parle au féminin : à qualité égale, on préfère une voix féminine connue
const FEMALE_VOICE_NAMES = [
  "denise", "eloise", "vivienne", "brigitte", "celeste", "coralie", "jacqueline",
  "josephine", "yvette", "amelie", "audrey", "aurelie", "marie", "julie",
  "hortense", "sylvie", "ariane", "charline", "sylvia", "google français",
];

// Accents détachés par NFD (via RegExp : le flag u est refusé en littéral avec target ES2017)
const COMBINING_MARKS = new RegExp("\\p{M}", "gu");

function normalize(s: string): string {
  return s.normalize("NFD").replace(COMBINING_MARKS, "").toLowerCase();
}

function langOf(v: VoiceLike): string {
  // Android renvoie parfois « fr_FR »
  return v.lang.replace("_", "-").toLowerCase();
}

// 0 = meilleure voix ; Infinity = pas française
function tier(v: VoiceLike): number {
  const lang = langOf(v);
  if (!lang.startsWith("fr")) return Infinity;
  if (/natural|online/i.test(v.name)) return 0; // voix neuronales d'Edge
  if (/google fran/i.test(v.name)) return 1;
  if (lang === "fr-fr") return 2;
  return 3;
}

export function pickFrenchVoice<T extends VoiceLike>(voices: readonly T[]): T | null {
  let best: T | null = null;
  let bestScore = Infinity;
  for (const v of voices) {
    const t = tier(v);
    if (t === Infinity) continue;
    // Au sein d'un même niveau : fr-FR d'abord, puis voix féminine
    const name = normalize(v.name);
    const score =
      t * 4 +
      (langOf(v) === "fr-fr" ? 0 : 2) +
      (FEMALE_VOICE_NAMES.some((f) => name.includes(f)) ? 0 : 1);
    if (score < bestScore) {
      best = v;
      bestScore = score;
    }
  }
  return best;
}

export function splitSentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

let cachedVoice: SpeechSynthesisVoice | null | undefined;

function loadVoice(synth: SpeechSynthesis): Promise<SpeechSynthesisVoice | null> {
  if (cachedVoice !== undefined) return Promise.resolve(cachedVoice);
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      const voices = synth.getVoices();
      const voice = pickFrenchVoice(voices);
      // Ne mémoriser que si la liste est chargée (iOS la remplit en différé)
      if (voices.length > 0) cachedVoice = voice;
      resolve(voice);
    };
    if (synth.getVoices().length > 0) {
      finish();
      return;
    }
    synth.addEventListener("voiceschanged", finish, { once: true });
    // Certains navigateurs ne déclenchent jamais voiceschanged
    setTimeout(finish, 500);
  });
}

export function isWebSpeechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Lit le texte (déjà nettoyé) phrase par phrase. Renvoie une fonction d'arrêt.
// onEnd est appelé à la fin naturelle ou en cas d'erreur, pas après un arrêt manuel.
export function speakWithWebSpeech(text: string, onEnd: () => void): () => void {
  if (!isWebSpeechAvailable()) {
    onEnd();
    return () => {};
  }
  const synth = window.speechSynthesis;
  const sentences = splitSentences(text);
  let stopped = false;
  let pauseTimer: ReturnType<typeof setTimeout> | null = null;

  synth.cancel();

  const finish = () => {
    if (stopped) return;
    stopped = true;
    onEnd();
  };

  loadVoice(synth).then((voice) => {
    const speakAt = (i: number) => {
      if (stopped) return;
      if (i >= sentences.length) {
        finish();
        return;
      }
      const u = new SpeechSynthesisUtterance(sentences[i]);
      u.lang = voice?.lang ?? "fr-FR";
      if (voice) u.voice = voice;
      u.rate = RATE;
      u.pitch = PITCH;
      u.volume = 1;
      u.onend = () => {
        if (stopped) return;
        pauseTimer = setTimeout(() => speakAt(i + 1), PAUSE_BETWEEN_SENTENCES_MS);
      };
      u.onerror = finish;
      synth.speak(u);
    };
    speakAt(0);
  });

  return () => {
    stopped = true;
    if (pauseTimer) clearTimeout(pauseTimer);
    synth.cancel();
  };
}
