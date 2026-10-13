import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanTextForSpeech } from "./cleanText.ts";

test("retire la balise émotion en fin de message", () => {
  assert.equal(
    cleanTextForSpeech('Je suis là avec toi.\n{"emotion":"triste"}'),
    "Je suis là avec toi."
  );
});

test("retire les balises exercice et émotion, même avec des espaces", () => {
  assert.equal(
    cleanTextForSpeech('Respirons ensemble.\n{ "exercice": "respiration_4-4-6" }\n{ "emotion" : "anxieux" }'),
    "Respirons ensemble."
  );
});

test("retire une balise entourée d'un bloc de code", () => {
  assert.equal(
    cleanTextForSpeech('Prends ton temps.\n```json\n{"emotion":"calme"}\n```'),
    "Prends ton temps."
  );
});

test("retire les émojis, y compris composés", () => {
  assert.equal(
    cleanTextForSpeech("Mbolo ! Je suis YURA 🌿 💛 👍🏾 ❤️ 👨‍👩‍👧"),
    "M'bolo! Je suis Yura."
  );
});

test("retire le markdown", () => {
  assert.equal(
    cleanTextForSpeech("## Titre\nC'est **vraiment** _important_ et `utile`."),
    "Titre. C'est vraiment important et utile."
  );
});

test("retire les puces de liste", () => {
  assert.equal(
    cleanTextForSpeech("Quelques idées :\n- marcher\n• respirer"),
    "Quelques idées: marcher. respirer."
  );
});

test("garde le texte d'un lien markdown et retire les URLs", () => {
  assert.equal(
    cleanTextForSpeech("Lis [cet article](https://exemple.ga/a) ou va sur www.yura.ga."),
    "Lis cet article ou va sur."
  );
  assert.equal(cleanTextForSpeech("Plus d'infos (https://who.int/fr)."), "Plus d'infos.");
});

test("simplifie guillemets, apostrophes et tirets", () => {
  assert.equal(
    cleanTextForSpeech("Tu as dit « je n’en peux plus » — c’est lourd…"),
    `Tu as dit "je n'en peux plus", c'est lourd...`
  );
});

test("lit le numéro d'urgence 1300 « treize cents »", () => {
  assert.equal(
    cleanTextForSpeech("📞 1300 — SAMU Gabon · 24h/24"),
    "treize cents, SAMU Gabon · 24h/24."
  );
  assert.equal(cleanTextForSpeech("Appelle le 1300."), "Appelle le treize cents.");
});

test("Mbolo est écrit M'bolo pour ne pas être lu « M. Bolo »", () => {
  assert.equal(cleanTextForSpeech("Mbolo ! Je suis là."), "M'bolo! Je suis là.");
  assert.equal(cleanTextForSpeech("Mbolo Louis, contente de te lire"), "M'bolo Louis, contente de te lire.");
  assert.equal(cleanTextForSpeech("on dit mbolo ici"), "on dit m'bolo ici.");
});

test("YURA est lu comme un prénom, pas épelé comme un sigle", () => {
  assert.equal(cleanTextForSpeech("Je suis YURA, je t'écoute."), "Je suis Yura, je t'écoute.");
  assert.equal(cleanTextForSpeech("Bon retour sur yura."), "Bon retour sur Yura.");
});

test("ne touche pas aux autres nombres contenant 1300", () => {
  assert.equal(cleanTextForSpeech("13000 FCFA, 21300 et 1300,5"), "13000 FCFA, 21300 et 1300,5.");
});

test("transforme les retours à la ligne en phrases", () => {
  assert.equal(
    cleanTextForSpeech("Je t'entends\n\nComment tu te sens ?"),
    "Je t'entends. Comment tu te sens?"
  );
});

test("renvoie une chaîne vide s'il n'y a rien à lire", () => {
  assert.equal(cleanTextForSpeech('🌿\n{"emotion":"neutre"}'), "");
});
