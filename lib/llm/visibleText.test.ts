import { test } from "node:test";
import assert from "node:assert/strict";
import { VisibleTextFilter, softenDashes } from "./visibleText.ts";

// Simule un flux découpé en morceaux arbitraires et vérifie qu'aucune balise n'est jamais affichée
function stream(chunks: string[]) {
  const f = new VisibleTextFilter();
  let shown = "";
  const snapshots: string[] = [];
  for (const c of chunks) {
    shown += f.push(c);
    snapshots.push(shown);
  }
  return { shown, snapshots, final: f.end() };
}

test("la balise émotion n'apparaît jamais, même coupée entre deux morceaux", () => {
  const { snapshots, final } = stream(["Je suis là avec toi", ". Prends ton temps.\n", '{"emo', 'tion":"tri', 'ste"}']);
  for (const s of snapshots) assert.ok(!s.includes("{") && !s.includes("emotion"), s);
  assert.equal(final.text, "Je suis là avec toi. Prends ton temps.");
  assert.equal(final.emotion, "triste");
});

test("exercice + émotion : extraits à la fin, jamais affichés", () => {
  const { shown, final } = stream(["Respirons ensemble.", '\n{"exercice": "respiration_4-4-6"}', '\n{"emotion":"anxieux"}']);
  assert.equal(shown, "Respirons ensemble.");
  assert.equal(final.exercice, "respiration_4-4-6");
  assert.equal(final.emotion, "anxieux");
});

test("balises avec espaces et bloc de code : retirées du texte final", () => {
  const { final } = stream(["Tu n'es pas seul.\n```json\n", '{ "emotion" : "triste" }\n```']);
  assert.equal(final.text, "Tu n'es pas seul.");
  assert.equal(final.emotion, "triste");
});

test("bloc de code json retenu", () => {
  const { snapshots } = stream(["D'accord.\n`", '``json\n{"emotion":"calme"}\n```']);
  for (const s of snapshots) assert.ok(!s.includes("`") && !s.includes("{"), s);
});

test("le texte s'affiche progressivement", () => {
  const { snapshots } = stream(["Mbolo ! ", "Ça me fait ", "plaisir de te lire."]);
  assert.deepEqual(snapshots, ["Mbolo !", "Mbolo ! Ça me fait", "Mbolo ! Ça me fait plaisir de te lire."]);
});

test("les tirets longs deviennent des virgules, y compris à cheval sur deux morceaux", () => {
  const { shown, final } = stream(["Je suis là ", "— tu peux ", "souffler.", '\n{"emotion":"calme"}']);
  assert.equal(shown, "Je suis là, tu peux souffler.");
  assert.equal(final.text, "Je suis là, tu peux souffler.");
  assert.equal(softenDashes("un proche, un voisin — à qui parler"), "un proche, un voisin, à qui parler");
});
