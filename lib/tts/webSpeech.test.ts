import { test } from "node:test";
import assert from "node:assert/strict";
import { pickFrenchVoice, splitSentences } from "./webSpeech.ts";

const v = (name: string, lang: string) => ({ name, lang });

test("préfère une voix Natural/Online d'Edge, féminine et fr-FR", () => {
  const voices = [
    v("Google français", "fr-FR"),
    v("Microsoft Henri Online (Natural) - French (France)", "fr-FR"),
    v("Microsoft Denise Online (Natural) - French (France)", "fr-FR"),
    v("Microsoft Sylvie Online (Natural) - French (Canada)", "fr-CA"),
    v("Microsoft Zira", "en-US"),
  ];
  assert.equal(pickFrenchVoice(voices)?.name, "Microsoft Denise Online (Natural) - French (France)");
});

test("puis Google français", () => {
  const voices = [v("Thomas", "fr-FR"), v("Google français", "fr-FR"), v("Samantha", "en-US")];
  assert.equal(pickFrenchVoice(voices)?.name, "Google français");
});

test("puis n'importe quelle voix fr-FR (y compris fr_FR d'Android)", () => {
  const voices = [v("Amélie", "fr-CA"), v("French France", "fr_FR")];
  assert.equal(pickFrenchVoice(voices)?.name, "French France");
});

test("puis n'importe quelle voix fr-*", () => {
  const voices = [v("Samantha", "en-US"), v("Amélie", "fr-CA")];
  assert.equal(pickFrenchVoice(voices)?.name, "Amélie");
});

test("aucune voix française : null", () => {
  assert.equal(pickFrenchVoice([v("Samantha", "en-US")]), null);
  assert.equal(pickFrenchVoice([]), null);
});

test("découpe en phrases", () => {
  assert.deepEqual(
    splitSentences("Mbolo! Je suis là. Ce que tu ressens est important... Tu veux en parler?"),
    ["Mbolo!", "Je suis là.", "Ce que tu ressens est important...", "Tu veux en parler?"]
  );
});

test("garde la fin sans ponctuation et les guillemets fermants", () => {
  assert.deepEqual(splitSentences(`Tu as dit "c'est trop." Je comprends`), [
    `Tu as dit "c'est trop."`,
    "Je comprends",
  ]);
  assert.deepEqual(splitSentences(""), []);
});
