import { test } from "node:test";
import assert from "node:assert/strict";
import { isBargeIn, isLikelyEcho } from "./echo.ts";

const yura = "Fatigué de tout, ça ressemble à une fatigue qui va plus loin que le corps. Depuis quand tu te sens comme ça ?";

test("la voix de YURA captée par le micro est reconnue comme un écho", () => {
  assert.equal(isLikelyEcho("une fatigue qui va plus loin que le corps", yura), true);
  assert.equal(isBargeIn("depuis quand tu te sens comme ça", yura), false);
});

test("une vraie prise de parole interrompt YURA", () => {
  assert.equal(isBargeIn("attends attends j'ai pas fini", yura), true);
  assert.equal(isBargeIn("non c'est surtout mon travail", yura), true);
});

test("un seul mot ou un bruit ne suffit pas", () => {
  assert.equal(isBargeIn("euh", yura), false);
  assert.equal(isBargeIn("", yura), false);
});
