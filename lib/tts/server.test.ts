import { test } from "node:test";
import assert from "node:assert/strict";
import { pcmToWav, parseAudioMime } from "./wav.ts";
import { DailyQuota } from "./quota.ts";

test("pcmToWav ajoute un en-tête RIFF valide", () => {
  const pcm = new Uint8Array([1, 2, 3, 4]);
  const wav = pcmToWav(pcm, 24000);
  const view = new DataView(wav.buffer);
  const ascii = (o: number, n: number) => String.fromCharCode(...wav.slice(o, o + n));
  assert.equal(wav.length, 48);
  assert.equal(ascii(0, 4), "RIFF");
  assert.equal(view.getUint32(4, true), 40);
  assert.equal(ascii(8, 8), "WAVEfmt ");
  assert.equal(view.getUint16(22, true), 1); // mono
  assert.equal(view.getUint32(24, true), 24000);
  assert.equal(view.getUint32(28, true), 48000); // octets/s
  assert.equal(view.getUint16(34, true), 16);
  assert.equal(ascii(36, 4), "data");
  assert.equal(view.getUint32(40, true), 4);
  assert.deepEqual([...wav.slice(44)], [1, 2, 3, 4]);
});

test("parseAudioMime lit le type et les paramètres", () => {
  assert.deepEqual(parseAudioMime("audio/L16; rate=24000; channels=1"), { type: "audio/l16", rate: 24000, channels: 1 });
  assert.deepEqual(parseAudioMime("audio/wav"), { type: "audio/wav", rate: null, channels: null });
});

test("DailyQuota plafonne, rembourse et se remet à zéro chaque jour", () => {
  const q = new DailyQuota(1000);
  const day1 = new Date("2026-10-12T10:00:00Z");
  assert.equal(q.consume("a", 600, day1), true);
  assert.equal(q.consume("a", 500, day1), false);
  assert.equal(q.consume("b", 500, day1), true); // clés indépendantes
  q.refund("a", 600, day1);
  assert.equal(q.remaining("a", day1), 1000);
  assert.equal(q.consume("a", 1000, day1), true);
  assert.equal(q.remaining("a", day1), 0);
  assert.equal(q.remaining("a", new Date("2026-10-13T00:00:01Z")), 1000);
});
