import { test } from "node:test";
import assert from "node:assert/strict";
import { takeSentences } from "./sentences.ts";

test("une phrase part dès qu'elle est complète, pas avant", () => {
  const cursor = { offset: 0 };
  assert.deepEqual(takeSentences("Ce stress pour tes examens", cursor), []);
  assert.deepEqual(takeSentences("Ce stress pour tes examens, c'est lourd à porter. Qu'est", cursor), [
    "Ce stress pour tes examens, c'est lourd à porter.",
  ]);
  assert.deepEqual(takeSentences("Ce stress pour tes examens, c'est lourd à porter. Qu'est-ce qui t'inquiète ?", cursor, true), [
    "Qu'est-ce qui t'inquiète ?",
  ]);
});

test("les phrases très courtes sont regroupées avec la suivante", () => {
  const cursor = { offset: 0 };
  const text = "Mbolo ! Ça me fait plaisir de te lire ce soir. Et toi ?";
  assert.deepEqual(takeSentences(text, cursor), ["Mbolo ! Ça me fait plaisir de te lire ce soir."]);
  assert.deepEqual(takeSentences(text, cursor, true), ["Et toi ?"]);
});

test("les retours à la ligne terminent une phrase ; rien n'est lu deux fois", () => {
  const cursor = { offset: 0 };
  const text = "Je suis là avec toi, prends ton temps\n\nOn peut respirer ensemble un moment. ";
  const all = [...takeSentences(text, cursor), ...takeSentences(text, cursor, true)];
  assert.deepEqual(all, ["Je suis là avec toi, prends ton temps", "On peut respirer ensemble un moment."]);
});

test("points de suspension et guillemets fermants", () => {
  const cursor = { offset: 0 };
  assert.deepEqual(takeSentences("Fatigué de tout… ça pèse vraiment très lourd. ", cursor), [
    "Fatigué de tout… ça pèse vraiment très lourd.",
  ]);
});
