import { test } from "node:test";
import assert from "node:assert/strict";
import { createSseAudioParser } from "./sse.ts";
import { pcm16ToFloat32 } from "./wav.ts";

const ev = (type: string, json: object) => `event: ${type}\ndata: ${JSON.stringify(json)}\n\n`;

test("extrait l'audio des step.delta et détecte la fin", () => {
  const p = createSseAudioParser();
  const stream =
    ev("interaction.created", { event_type: "interaction.created" }) +
    ev("step.start", { event_type: "step.start", step: { type: "model_output" } }) +
    ev("step.delta", { event_type: "step.delta", delta: { type: "audio", data: "AAA=" } }) +
    ev("step.delta", { event_type: "step.delta", delta: { type: "audio", data: "BBB=" } }) +
    ev("step.stop", { event_type: "step.stop" }) +
    "data: [DONE]\n\n";
  assert.deepEqual(p.push(stream), { audio: ["AAA=", "BBB="], done: true, error: false });
});

test("gère des blocs coupés entre deux paquets réseau et les fins de ligne CRLF", () => {
  const p = createSseAudioParser();
  const block = ev("step.delta", { event_type: "step.delta", delta: { type: "audio", data: "CCC=" } }).replace(/\n/g, "\r\n");
  const cut = 17;
  assert.deepEqual(p.push(block.slice(0, cut)).audio, []);
  assert.deepEqual(p.push(block.slice(cut)).audio, ["CCC="]);
});

test("signale une erreur dans le flux", () => {
  const p = createSseAudioParser();
  assert.equal(p.push(ev("error", { event_type: "error", error: { code: 500 } })).error, true);
});

test("pcm16ToFloat32 convertit le PCM little-endian", () => {
  // 0, 16384 (0x4000), -32768 (0x8000), 32767 (0x7FFF)
  const pcm = new Uint8Array([0x00, 0x00, 0x00, 0x40, 0x00, 0x80, 0xff, 0x7f]);
  const out = pcm16ToFloat32(pcm);
  assert.deepEqual([...out].map((v) => Math.round(v * 1000) / 1000), [0, 0.5, -1, 1]);
  assert.equal(pcm16ToFloat32(new Uint8Array([1, 2, 3])).length, 1); // octet impair ignoré
});
