// Lecteur vocal côté client : Gemini TTS via /api/tts, avec repli silencieux sur la Web Speech API.
// Un seul message est lu à la fois ; l'audio de chaque message est mis en cache par identifiant.

import { getOrCreateSessionId } from "@/lib/uuid";
import { cleanTextForSpeech } from "./cleanText";
import { pcmToWav } from "./wav";
import { isWebSpeechAvailable, speakWithWebSpeech } from "./webSpeech";

export type PlaybackState = "loading" | "playing" | "paused";

export interface Playback {
  id: number;
  state: PlaybackState;
  // La Web Speech API ne sait pas reprendre proprement : pause = arrêt
  pausable: boolean;
}

type Listener = (playback: Playback | null) => void;

const MAX_CACHED = 30;

export class TtsPlayer {
  private readonly listener: Listener;
  private audio: HTMLAudioElement | null = null;
  private cache = new Map<number, string>();
  private inflight = new Map<number, Promise<string | null>>();
  // Incrémenté à chaque lecture/arrêt : une réponse tardive d'une lecture abandonnée est ignorée
  private token = 0;
  private current: Playback | null = null;
  private stopWebSpeech: (() => void) | null = null;
  // Quota atteint ou TTS non configuré : inutile de réessayer pendant cette session
  private geminiOff = false;
  private audioUnlocked = false;
  private speechUnlocked = false;
  // Résout la promesse renvoyée par play() quand la lecture se termine ou est arrêtée
  private resolveDone: (() => void) | null = null;
  // Analyse du signal (mode vocal) : sert à animer l'orbe au rythme de la voix
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private samples: Uint8Array<ArrayBuffer> | null = null;

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

  // À appeler pendant un geste (clic, touche) : iOS Safari n'autorise ensuite
  // la lecture que sur un élément audio déjà « débloqué » par un geste.
  unlock(): void {
    if (typeof window === "undefined") return;
    if (!this.audioUnlocked) {
      this.audioUnlocked = true;
      const silence = pcmToWav(new Uint8Array(2400), 24_000); // 50 ms de silence
      const audio = this.ensureAudio();
      audio.src = URL.createObjectURL(new Blob([new Uint8Array(silence)], { type: "audio/wav" }));
      audio.play().catch(() => {});
    }
    if (!this.speechUnlocked && isWebSpeechAvailable()) {
      this.speechUnlocked = true;
      const silent = new SpeechSynthesisUtterance(" ");
      silent.volume = 0;
      window.speechSynthesis.speak(silent);
    }
  }

  // À appeler pendant un geste. Une fois activé, le son passe par Web Audio :
  // réservé au mode vocal pour ne pas exposer le chat texte aux suspensions d'AudioContext.
  enableAnalyser(): void {
    if (typeof window === "undefined") return;
    if (!this.audioCtx) {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      try {
        const ctx = new Ctx();
        const source = ctx.createMediaElementSource(this.ensureAudio());
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        this.audioCtx = ctx;
        this.analyser = analyser;
        this.samples = new Uint8Array(new ArrayBuffer(analyser.fftSize));
      } catch {
        return;
      }
    }
    this.audioCtx.resume().catch(() => {});
  }

  // Intensité de la voix entre 0 et 1, lue à chaque image par l'orbe
  level(): number {
    if (!this.current || this.current.state !== "playing") return 0;
    if (this.current.pausable && this.analyser && this.samples) {
      this.analyser.getByteTimeDomainData(this.samples);
      let sum = 0;
      for (const v of this.samples) sum += ((v - 128) / 128) ** 2;
      return Math.min(1, Math.sqrt(sum / this.samples.length) * 4);
    }
    // Voix du navigateur : pas d'accès au signal, on simule une pulsation de parole
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

    let url = this.cache.get(id) ?? null;
    if (!url && !this.geminiOff) {
      this.set({ id, state: "loading", pausable: false });
      url = await this.fetchAudio(id, clean);
      if (token !== this.token) return;
    }

    if (url) {
      const audio = this.ensureAudio();
      audio.src = url;
      audio.onended = () => this.finish(token);
      try {
        if (this.audioCtx && this.audioCtx.state !== "running") await this.audioCtx.resume();
        this.set({ id, state: "playing", pausable: true });
        await audio.play();
        return;
      } catch {
        if (token !== this.token) return;
        // Lecture refusée ou audio illisible : on passe à la voix du navigateur
      }
    }

    if (!isWebSpeechAvailable()) {
      this.finish(token);
      return;
    }
    this.set({ id, state: "playing", pausable: false });
    this.stopWebSpeech = speakWithWebSpeech(clean, () => this.finish(token));
  }

  pause(): void {
    if (!this.current || this.current.state !== "playing") return;
    if (!this.current.pausable) {
      this.stop();
      return;
    }
    this.audio?.pause();
    this.set({ ...this.current, state: "paused" });
  }

  resume(): void {
    if (!this.current || this.current.state !== "paused" || !this.audio) return;
    const token = this.token;
    this.set({ ...this.current, state: "playing" });
    this.audio.play().catch(() => this.finish(token));
  }

  stop(): void {
    this.token++;
    if (this.audio) {
      this.audio.onended = null;
      this.audio.pause();
    }
    this.stopWebSpeech?.();
    this.stopWebSpeech = null;
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
  }
}
