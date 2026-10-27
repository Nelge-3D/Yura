import { test } from "node:test";
import assert from "node:assert/strict";
import { messagesToSummarize, recentWindow, RECENT_MESSAGES, type HistoryMessage } from "./history.ts";

const conv = (n: number): HistoryMessage[] =>
  Array.from({ length: n }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `m${i}`, timestamp: i + 1 }));

test("seuls les 20 derniers messages partent en entier", () => {
  assert.equal(recentWindow(conv(60)).length, RECENT_MESSAGES);
  assert.equal(recentWindow(conv(60))[0].content, "m40");
  assert.equal(recentWindow(conv(8)).length, 8);
});

test("pas de résumé tant que moins de 6 messages sont sortis de la fenêtre", () => {
  assert.equal(messagesToSummarize(conv(20), null), null);
  assert.equal(messagesToSummarize(conv(25), null), null);
  assert.deepEqual(messagesToSummarize(conv(26), null)?.map((m) => m.content), ["m0", "m1", "m2", "m3", "m4", "m5"]);
});

test("le résumé est mis à jour par paquets de 6, sans reprendre ce qui est déjà résumé", () => {
  const summary = { text: "…", upTo: 6 }; // m0..m5 déjà résumés
  assert.equal(messagesToSummarize(conv(30), summary), null); // m6..m9 : 4 seulement
  assert.deepEqual(messagesToSummarize(conv(32), summary)?.map((m) => m.content), ["m6", "m7", "m8", "m9", "m10", "m11"]);
});
