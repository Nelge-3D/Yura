// Ajoute un en-tête WAV (RIFF) à du PCM 16 bits little-endian brut,
// pour que le navigateur puisse le lire directement.
export function pcmToWav(pcm: Uint8Array, sampleRate: number, channels = 1, bitsPerSample = 16): Uint8Array {
  const blockAlign = (channels * bitsPerSample) / 8;
  const out = new Uint8Array(44 + pcm.length);
  const view = new DataView(out.buffer);
  const ascii = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) out[offset + i] = s.charCodeAt(i);
  };

  ascii(0, "RIFF");
  view.setUint32(4, 36 + pcm.length, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true); // taille du bloc fmt
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  ascii(36, "data");
  view.setUint32(40, pcm.length, true);
  out.set(pcm, 44);
  return out;
}

// « audio/l16; rate=24000; channels=1 » → { type: "audio/l16", rate: 24000, channels: 1 }
export function parseAudioMime(mime: string): { type: string; rate: number | null; channels: number | null } {
  const [type, ...params] = mime.split(";").map((p) => p.trim());
  const get = (key: string) => {
    const p = params.find((x) => x.toLowerCase().startsWith(`${key}=`));
    const n = p ? Number(p.split("=")[1]) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  return { type: type.toLowerCase(), rate: get("rate"), channels: get("channels") };
}
