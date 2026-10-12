// Prépare un message de YURA pour la synthèse vocale :
// rien de ce qui n'est pas destiné à être entendu ne doit être lu.

// Balises cachées {"emotion": "..."} / {"exercice": "..."}, tolérantes aux espaces
const HIDDEN_TAG = /\{\s*"(?:emotion|exercice)"\s*:\s*"[^"]*"\s*\}/g;
const CODE_FENCE = /```[a-zA-Z]*/g;
const MARKDOWN_LINK = /\[([^\]]+)\]\([^)]*\)/g;
// La ponctuation finale et la parenthèse fermante ne font pas partie de l'URL
const URL = /\b(?:https?:\/\/|www\.)[^\s)\]]*[^\s)\].,!?;:]/gi;
const BULLET = /^[ \t]*[-•*+][ \t]+/gm;
const HEADING = /^[ \t]*#{1,6}[ \t]*/gm;

// Construits via RegExp : le target ES2017 de tsconfig refuse le flag u
// et les lookbehind dans les littéraux, alors que tous les navigateurs visés les gèrent.
const EMOJI = new RegExp(
  "[\\p{Extended_Pictographic}\\u{1F1E6}-\\u{1F1FF}\\u{1F3FB}-\\u{1F3FF}\\u200D\\uFE0E\\uFE0F\\u20E3]",
  "gu"
);
// 1300 isolé (pas 13000, ni 1300,5, ni 21300)
const EMERGENCY_NUMBER = new RegExp("(?<![\\d.,])1300(?!\\d|[.,]\\d)", "g");

export function cleanTextForSpeech(raw: string): string {
  let text = raw
    .replace(HIDDEN_TAG, " ")
    .replace(CODE_FENCE, " ")
    .replace(MARKDOWN_LINK, "$1")
    .replace(URL, " ")
    .replace(EMOJI, "")
    .replace(BULLET, "")
    .replace(HEADING, "")
    .replace(/[*`~#]+/g, "")
    .replace(/_+/g, " ");

  text = text
    // espaces insécables (U+00A0, U+202F) et fine (U+2009)
    .replace(/[   ]/g, " ")
    .replace(/«\s*/g, '"')
    .replace(/\s*»/g, '"')
    .replace(/[“”„‟]/g, '"')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/…/g, "...")
    .replace(/[ \t]*[—–―][ \t]*/g, ", ")
    .replace(/‑/g, "-")
    .replace(EMERGENCY_NUMBER, "treize cents");

  // Une ligne sans ponctuation finale devient une phrase (pause naturelle à l'oral)
  text = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => (/[.!?;:,"']$/.test(line) ? line : `${line}.`))
    .join(" ");

  return text
    .replace(/\(\s*\)/g, "")
    .replace(/"\s*"/g, "")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/,\s*([.!?])/g, "$1")
    .replace(/^[\s,.;:]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
