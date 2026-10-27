// Lecteur vocal côté client. Par ordre de préférence :
//   1. audio déjà en cache pour ce message (relecture instantanée)
//   2. Gemini TTS en streaming (/api/tts/stream) joué au fil de l'eau via Web Audio : premier son en ~1 s
//   3. Gemini TTS en un bloc (/api/tts) si Web Audio n'est pas disponible
//   4. voix du navigateur (Web Speech API) si Gemini échoue ou si le quota est atteint
// Un seul message est lu à la fois ; l'audio de chaque message est mis en cache par identifiant.

import { getOrCreateSessionId } from "@/lib/uuid";
import { cleanTextForSpeech } from "./cleanText";
import { pcm16ToFloat32, pcmToWav } from "./wav";
import { isWebSpeechAvailable, speakWithWebSpeech } from "./webSpeech";
import { takeSentences } from "./sentences";

export type PlaybackState = "loading" | "playing" | "paused";

export interface Playback {
  id: number;
  state: PlaybackState;
  // La Web Speech API ne sait pas reprendre proprement : pause = arrêt
  pausable: boolean;
}

type Listener = (playback: Playback | null) => void;
type Engine = "element" | "stream" | "speech";

const MAX_CACHED = 30;

// Fournisseur de voix : "webspeech" (défaut : voix du navigateur, instantanée et gratuite),
// "auto" (Gemini TTS si configuré, sinon navigateur) ou "gemini". En niveau gratuit, Gemini TTS
// est limité à 3 requêtes/min et ~10/jour : inutilisable pour une conversation entière.
export type TtsProvider = "webspeech" | "auto" | "gemini";
export const TTS_PROVIDER: TtsProvider =
  (process.env.NEXT_PUBLIC_TTS_PROVIDER as TtsProvider | undefined) ?? "webspeech";

// Lecture au fil de l'eau d'une réponse en cours d'écriture
export interface SpeechStream {
  // Texte affiché jusqu'ici : les phrases complètes partent à la lecture
  push(visibleText: string): void;
  // Fin du flux : le reste est lu
  end(finalText: string): void;
  // Se résout quand tout a été dit (ou que la lecture est arrêtée)
  done: Promise<void>;
}
const SAMPLE_RATE = 24_000;
// Avance prise avant le premier morceau : absorbe les irrégularités du réseau mobile
const STREAM_LEAD_S = 0.25;

export class TtsPlayer {
  private readonly listener: Listener;
  private audio: HTMLAudioElement | null = null;
  private cache = new Map<number, string>();
  private inflight = new Map<number, Promise<string | null>>();
  // Incrémenté à chaque lecture/arrêt : une réponse tardive d'une lecture abandonnée est ignorée
  private token = 0;
  private current: Playback | null = null;
  private engine: Engine | null = null;
  private stopWebSpeech: (() => void) | null = null;
  // Quota atteint ou TTS non configuré : inutile de réessayer pendant cette session
  private geminiOff = TTS_PROVIDER === "webspeech";
  private audioUnlocked = false;
  private speechUnlocked = false;
  // Résout la promesse renvoyée par play() quand la lecture se termine ou est arrêtée
  private resolveDone: (() => void) | null = null;
  // Web Audio : lecture en streaming et analyse du signal (orbe du mode vocal)
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private samples: Uint8Array<ArrayBuffer> | null = null;
  private elementConnected = false;
  private streamAbort: AbortController | null = null;
  private streamSources = new Set<AudioBufferSourceNode>();
  private ctxPausedByUs = false;

  constructor(listener: Listener) {
    this.listener = listener;
  }

  private set(playback: Playback | null) {
    this.current = playback;
    this.listener(playback);
  }

  private ensureAudio(): HTMLAudioElement {
    if (!this.audio) this.audio = new Audio();
    return this.audio;
  }

  private ensureContext(): AudioContext | null {
    if (this.audioCtx) return this.audioCtx;
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    try {
      const ctx = new Ctx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.connect(ctx.destination);
      this.audioCtx = ctx;
      this.analyser = analyser;
      this.samples = new Uint8Array(new ArrayBuffer(analyser.fftSize));
      return ctx;
    } catch {
      return null;
    }
  }

  // À appeler pendant un geste (clic, touche) : iOS Safari n'autorise ensuite la lecture
  // que sur un élément audio / un AudioContext déjà « débloqué » par un geste.
  unlock(): void {
    if (typeof window === "undefined") return;
    // iOS : sans cela, Web Audio est coupé par le bouton silencieux du téléphone
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = "playback";

    if (!this.audioUnlocked) {
      this.audioUnlocked = true;
      const silence = pcmToWav(new Uint8Array(2400), SAMPLE_RATE); // 50 ms de silence
      const audio = this.ensureAudio();
      audio.src = URL.createObjectURL(new Blob([new Uint8Array(silence)], { type: "audio/wav" }));
      audio.play().catch(() => {});
    }
    const ctx = this.ensureContext();
    if (ctx && !this.ctxPausedByUs) ctx.resume().catch(() => {});
    if (!this.speechUnlocked && isWebSpeechAvailable()) {
      this.speechUnlocked = true;
      const silent = new SpeechSynthesisUtterance(" ");
      silent.volume = 0;
      window.speechSynthesis.speak(silent);
    }
  }

  // Mode vocal (pendant un geste) : fait aussi passer les relectures en cache par l'analyseur.
  // Réservé au mode vocal pour ne pas exposer le chat texte aux suspensions d'AudioContext.
  enableAnalyser(): void {
    if (typeof window === "undefined") return;
    const ctx = this.ensureContext();
    if (!ctx || !this.analyser) return;
    if (!this.elementConnected) {
      try {
        ctx.createMediaElementSource(this.ensureAudio()).connect(this.analyser);
        this.elementConnected = true;
      } catch {
        // déjà connecté ou non supporté : l'orbe utilisera la pulsation simulée
      }
    }
    ctx.resume().catch(() => {});
  }

  // Intensité de la voix entre 0 et 1, lue à chaque image par l'orbe
  level(): number {
    if (!this.current || this.current.state !== "playing") return 0;
    const measurable = this.engine === "stream" || (this.engine === "element" && this.elementConnected);
    if (measurable && this.analyser && this.samples) {
      this.analyser.getByteTimeDomainData(this.samples);
      let sum = 0;
      for (const v of this.samples) sum += ((v - 128) / 128) ** 2;
      return Math.min(1, Math.sqrt(sum / this.samples.length) * 4);
    }
    // Pas d'accès au signal : on simule une pulsation de parole
    const t = performance.now() / 1000;
    return 0.3 + 0.3 * Math.abs(Math.sin(t * 5.3) * Math.sin(t * 2.1 + 1));
  }

  private async fetchAudio(id: number, text: string): Promise<string | null> {
    const cached = this.cache.get(id);
    if (cached) return cached;
    const pending = this.inflight.get(id);
    if (pending) return pending;

    const request = (async () => {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, uuid: getOrCreateSessionId() }),
        });
        if (!res.ok) {
          if (res.status === 429 || res.status === 503) this.geminiOff = true;
          return null;
        }
        const url = URL.createObjectURL(await res.blob());
        this.remember(id, url);
        return url;
      } catch {
        return null;
      } finally {
        this.inflight.delete(id);
      }
    })();
    this.inflight.set(id, request);
    return request;
  }

  private remember(id: number, url: string) {
    this.cache.set(id, url);
    for (const [oldId, oldUrl] of this.cache) {
      if (this.cache.size <= MAX_CACHED) break;
      if (oldId === this.current?.id) continue;
      URL.revokeObjectURL(oldUrl);
      this.cache.delete(oldId);
    }
  }

  // Lance la lecture ; la promesse se résout à la fin de la lecture (naturelle, erreur ou arrêt).
  play(id: number, text: string): Promise<void> {
    this.stop();
    const token = this.token;
    return new Promise<void>((resolve) => {
      this.resolveDone = resolve;
      void this.start(token, id, text);
    });
  }

  private finish(token: number) {
    if (token !== this.token) return;
    this.engine = null;
    this.set(null);
    this.resolveDone?.();
    this.resolveDone = null;
  }

  private async start(token: number, id: number, text: string): Promise<void> {
    const clean = cleanTextForSpeech(text);
    if (!clean) {
      this.finish(token);
      return;
    }

    const cached = this.cache.get(id);
    if (cached) {
      if (await this.playElement(token, id, cached)) return;
      if (token !== this.token) return;
    } else if (!this.geminiOff) {
      this.set({ id, state: "loading", pausable: false });
      const ctx = await this.runningContext();
      if (token !== this.token) return;
      if (ctx) {
        const result = await this.playStream(token, id, clean, ctx);
        if (result !== "fallback") return;
      } else {
        const url = await this.fetchAudio(id, clean);
        if (token !== this.token) return;
        if (url && (await this.playElement(token, id, url))) return;
        if (token !== this.token) return;
      }
    }

    // Repli : voix du navigateur
    if (!isWebSpeechAvailable()) {
      this.finish(token);
      return;
    }
    this.engine = "speech";
    this.set({ id, state: "playing", pausable: false });
    this.stopWebSpeech = speakWithWebSpeech(clean, () => this.finish(token));
  }

  // AudioContext prêt à jouer, ou null (pas de Web Audio, ou bloqué faute de geste)
  private async runningContext(): Promise<AudioContext | null> {
    const ctx = this.audioCtx;
    if (!ctx) return null;
    if (ctx.state !== "running") {
      // resume() peut rester en attente indéfiniment hors geste sur iOS : on n'attend pas plus de 300 ms
      await Promise.race([ctx.resume().catch(() => {}), new Promise((r) => setTimeout(r, 300))]);
    }
    return ctx.state === "running" ? ctx : null;
  }

  private async playElement(token: number, id: number, url: string): Promise<boolean> {
    const audio = this.ensureAudio();
    audio.src = url;
    audio.onended = () => this.finish(token);
    try {
      if (this.elementConnected && this.audioCtx && this.audioCtx.state !== "running") await this.audioCtx.resume();
      this.engine = "element";
      this.set({ id, state: "playing", pausable: true });
      await audio.play();
      return true;
    } catch {
      // Lecture refusée ou audio illisible
      return false;
    }
  }

  // Joue l'audio au fil de sa génération, puis le met en cache pour les relectures
  private async playStream(
    token: number,
    id: number,
    text: string,
    ctx: AudioContext
  ): Promise<"played" | "fallback" | "stale"> {
    const abort = new AbortController();
    this.streamAbort = abort;

    let res: Response;
    try {
      res = await fetch("/api/tts/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, uuid: getOrCreateSessionId() }),
        signal: abort.signal,
      });
    } catch {
      return token === this.token ? "fallback" : "stale";
    }
    if (token !== this.token) return "stale";
    if (!res.ok || !res.body) {
      if (res.status === 429 || res.status === 503) this.geminiOff = true;
      return "fallback";
    }

    const reader = res.body.getReader();
    const received: Uint8Array[] = [];
    let leftover: Uint8Array | null = null;
    let nextTime = 0;
    let lastSource: AudioBufferSourceNode | null = null;

    for (;;) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await reader.read();
      } catch {
        break; // flux interrompu : on joue ce qui a été reçu
      }
      if (token !== this.token) {
        reader.cancel().catch(() => {});
        return "stale";
      }
      if (chunk.done) break;

      // Un échantillon fait 2 octets : on garde l'octet orphelin pour le paquet suivant
      let bytes: Uint8Array = chunk.value;
      if (leftover) {
        const merged = new Uint8Array(leftover.length + bytes.length);
        merged.set(leftover);
        merged.set(bytes, leftover.length);
        bytes = merged;
        leftover = null;
      }
      if (bytes.length % 2 === 1) {
        leftover = bytes.slice(-1);
        bytes = bytes.slice(0, -1);
      }
      if (bytes.length === 0) continue;
      received.push(bytes);

      const floats = pcm16ToFloat32(bytes);
      const buffer = ctx.createBuffer(1, floats.length, SAMPLE_RATE);
      buffer.copyToChannel(floats, 0);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.analyser ?? ctx.destination);

      if (!lastSource) {
        nextTime = ctx.currentTime + STREAM_LEAD_S;
        this.engine = "stream";
        this.set({ id, state: "playing", pausable: true });
      } else if (nextTime < ctx.currentTime) {
        // Le réseau a pris du retard : on reprend juste après l'instant présent
        nextTime = ctx.currentTime + 0.05;
      }
      source.start(nextTime);
      nextTime += buffer.duration;
      this.streamSources.add(source);
      source.onended = () => this.streamSources.delete(source);
      lastSource = source;
    }

    if (!lastSource) return "fallback"; // aucun son reçu

    // Mise en cache (WAV) pour réécouter sans régénérer
    const total = received.reduce((n, b) => n + b.length, 0);
    const pcm = new Uint8Array(total);
    let offset = 0;
    for (const b of received) {
      pcm.set(b, offset);
      offset += b.length;
    }
    this.remember(id, URL.createObjectURL(new Blob([new Uint8Array(pcmToWav(pcm, SAMPLE_RATE))], { type: "audio/wav" })));

    const last = lastSource;
    last.onended = () => {
      this.streamSources.delete(last);
      this.finish(token);
    };
    return "played";
  }

  // Lecture phrase par phrase pendant que la réponse s'écrit : premier son dès la première phrase.
  streamSpeech(id: number): SpeechStream {
    this.stop();
    const token = this.token;
    const cursor = { offset: 0 };
    const queue: string[] = [];
    let ended = false;
    let running = false;
    const done = new Promise<void>((resolve) => {
      this.resolveDone = resolve;
    });
    this.set({ id, state: "loading", pausable: false });

    const enqueue = (sentences: string[]) => {
      for (const sentence of sentences) {
        const clean = cleanTextForSpeech(sentence);
        if (clean) queue.push(clean);
      }
    };

    const pump = async () => {
      if (running) return;
      running = true;
      try {
        while (token === this.token) {
          const sentence = queue.shift();
          if (sentence === undefined) {
            if (ended) this.finish(token);
            break;
          }
          await this.speakSentence(token, id, sentence);
        }
      } finally {
        running = false;
      }
    };

    return {
      push: (visibleText) => {
        if (token !== this.token) return;
        enqueue(takeSentences(visibleText, cursor));
        void pump();
      },
      end: (finalText) => {
        if (token !== this.token) return;
        ended = true;
        enqueue(takeSentences(finalText, cursor, true));
        void pump();
      },
      done,
    };
  }

  // Une phrase : Gemini TTS si disponible, sinon voix du navigateur
  private async speakSentence(token: number, id: number, text: string): Promise<void> {
    if (!this.geminiOff) {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, uuid: getOrCreateSessionId() }),
        });
        if (token !== this.token) return;
        if (res.ok) {
          const url = URL.createObjectURL(await res.blob());
          const played = await this.playUrlUntilEnd(token, id, url);
          URL.revokeObjectURL(url);
          if (played || token !== this.token) return;
        } else if (res.status === 429 || res.status === 503) {
          this.geminiOff = true;
        }
      } catch {
        // réseau : on passe à la voix du navigateur pour cette phrase
      }
    }
    if (token !== this.token || !isWebSpeechAvailable()) return;
    await new Promise<void>((resolve) => {
      this.engine = "speech";
      this.set({ id, state: "playing", pausable: false });
      this.stopWebSpeech = speakWithWebSpeech(text, resolve);
    });
  }

  private playUrlUntilEnd(token: number, id: number, url: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const audio = this.ensureAudio();
      audio.src = url;
      audio.onended = () => resolve(true);
      audio.onerror = () => resolve(false);
      this.engine = "element";
      this.set({ id, state: "playing", pausable: false });
      audio.play().catch(() => resolve(false));
      if (token !== this.token) resolve(false);
    });
  }

  pause(): void {
    if (!this.current || this.current.state !== "playing") return;
    if (!this.current.pausable) {
      this.stop();
      return;
    }
    if (this.engine === "stream" && this.audioCtx) {
      this.ctxPausedByUs = true;
      this.audioCtx.suspend().catch(() => {});
    } else {
      this.audio?.pause();
    }
    this.set({ ...this.current, state: "paused" });
  }

  resume(): void {
    if (!this.current || this.current.state !== "paused") return;
    const token = this.token;
    this.set({ ...this.current, state: "playing" });
    if (this.engine === "stream" && this.audioCtx) {
      this.ctxPausedByUs = false;
      this.audioCtx.resume().catch(() => this.finish(token));
    } else {
      this.audio?.play().catch(() => this.finish(token));
    }
  }

  stop(): void {
    this.token++;
    if (this.audio) {
      this.audio.onended = null;
      this.audio.pause();
    }
    this.streamAbort?.abort();
    this.streamAbort = null;
    for (const source of this.streamSources) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // déjà terminé
      }
    }
    this.streamSources.clear();
    // Une pause en streaming suspend tout le contexte : on le relance pour la prochaine lecture
    if (this.ctxPausedByUs && this.audioCtx) {
      this.ctxPausedByUs = false;
      this.audioCtx.resume().catch(() => {});
    }
    this.stopWebSpeech?.();
    this.stopWebSpeech = null;
    this.engine = null;
    if (this.current) this.set(null);
    this.resolveDone?.();
    this.resolveDone = null;
  }

  dispose(): void {
    this.stop();
    this.cache.forEach((url) => URL.revokeObjectURL(url));
    this.cache.clear();
    this.audioCtx?.close().catch(() => {});
    this.audioCtx = null;
    this.analyser = null;
    this.elementConnected = false;
  }
}
