"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { getUserName, setUserName, getOrCreateSessionId, clearSession } from "@/lib/uuid";
import { CrisisLevel } from "@/lib/crisis";
import { detectEmotion, EtatEmotionnel, ExerciceType } from "@/lib/emotionDetector";
import ExerciceGuide from "@/components/ExerciceGuide";
import VoiceMode from "@/components/voice/VoiceMode";
import { getTheme, getLightTheme, ColorTheme } from "@/lib/colorThemes";
import { logMood } from "@/lib/moodLog";
import { sauvegarderSession, getLastSession } from "@/lib/journal";
import { sauvegarderPhrase, getPhrases } from "@/lib/phrases";
import { FeedbackPayload } from "@/lib/feedback";
import { TtsPlayer, Playback } from "@/lib/tts/player";
import { messagesToSummarize, recentWindow, SummaryState } from "@/lib/llm/history";
import YuraAvatar from "@/components/YuraAvatar";
import JournalModal from "@/components/JournalModal";
import FeedbackFin from "@/components/FeedbackFin";
import Onboarding from "@/components/Onboarding";

const STORAGE_KEY_MESSAGES = "yura_messages";
const STORAGE_KEY_EMOTION = "yura_emotion";
const STORAGE_KEY_VOICE = "yura_voice";
const STORAGE_KEY_SUMMARY = "yura_summary";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  // Message d'accueil « Bon retour » généré à l'ouverture (pas une vraie réponse de YURA)
  kind?: "return";
  // Réponse en cours d'écriture (jamais sauvegardée telle quelle)
  streaming?: boolean;
}

// Fin de flux envoyée par /api/chat
interface ReplyDone {
  text: string;
  emotion: EtatEmotionnel | null;
  exercice: ExerciceType | null;
  crisisLevel: CrisisLevel;
}

// Réponse qui a échoué : on garde de quoi réessayer (aucun message d'erreur n'est sauvegardé)
interface FailedReply {
  history: ChatMessage[];
  autoSpeak: boolean;
  clientEmotion: EtatEmotionnel;
}

// « Bon retour » resté sans réponse (les anciens historiques n'ont pas le marqueur kind)
function isReturnMessage(m: ChatMessage): boolean {
  return m.role === "assistant" && (m.kind === "return" || m.content.startsWith("Bon retour"));
}

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Mbolo, je suis YURA.\n\nIci, tu peux parler librement, sans jugement et sans avoir à te présenter. Je t'écoute.\n\nComment tu te sens aujourd'hui ?",
  timestamp: Date.now(),
};

const MOOD_OPTIONS: { emoji: string; label: string; etat: EtatEmotionnel }[] = [
  { emoji: "😌", label: "Bien", etat: "calme" },
  { emoji: "😰", label: "Anxieux", etat: "anxieux" },
  { emoji: "😢", label: "Triste", etat: "triste" },
  { emoji: "😤", label: "En colère", etat: "en_colere" },
  { emoji: "😊", label: "Joyeux", etat: "joy" },
];

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState<CrisisLevel>("none");
  const [userName, setUserNameState] = useState<string | null>(null);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState("");
  // Lecture auto désactivée par défaut : le téléphone ne doit jamais parler sans accord
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  // Message en cours de lecture (id = timestamp) et son état
  const [playback, setPlayback] = useState<Playback | null>(null);
  const isSpeaking = playback?.state === "playing";
  const [hasMicSupport, setHasMicSupport] = useState(false);
  const [etat, setEtat] = useState<EtatEmotionnel>("neutre");
  const [prevEtat, setPrevEtat] = useState<EtatEmotionnel | null>(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [crisisDismissed, setCrisisDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeExercice, setActiveExercice] = useState<ExerciceType | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [failedReply, setFailedReply] = useState<FailedReply | null>(null);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [savedTexts, setSavedTexts] = useState<Set<string>>(new Set());
  const [pulsingIdx, setPulsingIdx] = useState<number | null>(null);
  const [shareToast, setShareToast] = useState(false);
  // Clair (ivoire) par défaut, comme l'accueil ; le mode sombre reste au menu
  const [lightMode, setLightMode] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const etatDebutRef = useRef<EtatEmotionnel>("neutre");
  const sessionSavedRef = useRef(false);
  // Ref miroir pour beforeunload (évite les closures périmées)
  const liveRef = useRef({ messages: [] as typeof messages, etat: "neutre" as EtatEmotionnel });

  const theme: ColorTheme = lightMode ? getLightTheme(etat) : getTheme(etat);

  const exerciceUsedRef = useRef(false);
  // Résumé des échanges anciens (longues conversations) ; mis à jour en arrière-plan
  const summaryRef = useRef<SummaryState | null>(null);
  const summarizingRef = useRef(false);
  const playerRef = useRef<TtsPlayer | null>(null);

  // Garde le ref miroir synchronisé
  useEffect(() => { liveRef.current = { messages, etat }; }, [messages, etat]);

  // Hydratation depuis localStorage
  useEffect(() => {
    const onboarded = localStorage.getItem("yura_onboarded");
    if (!onboarded) {
      setShowOnboarding(true);
    }
    setSavedTexts(new Set(getPhrases().map((p) => p.texte)));
    const savedLightMode = localStorage.getItem("yura_light_mode");
    if (savedLightMode === "0") setLightMode(false);
    try {
      if (localStorage.getItem(STORAGE_KEY_VOICE) === "1") setVoiceEnabled(true);
    } catch {
      // stockage indisponible (navigation privée) : on reste sur OFF
    }

    getOrCreateSessionId();
    const savedName = getUserName();
    if (savedName) {
      setUserNameState(savedName);
    } else {
      setShowNamePrompt(true);
    }

    try {
      const savedSummary = localStorage.getItem(STORAGE_KEY_SUMMARY);
      if (savedSummary) summaryRef.current = JSON.parse(savedSummary) as SummaryState;
    } catch {
      summaryRef.current = null;
    }

    const savedEmotion = localStorage.getItem(STORAGE_KEY_EMOTION) as EtatEmotionnel | null;
    if (savedEmotion) setEtat(savedEmotion);

    const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (savedMessages) {
      try {
        const parsed: ChatMessage[] = JSON.parse(savedMessages);
        // Retirer les « Bon retour » restés sans réponse en fin d'historique : sinon chaque
        // ouverture du chat en ajoutait un de plus
        let restored = parsed;
        while (restored.length > 0 && isReturnMessage(restored[restored.length - 1])) {
          restored = restored.slice(0, -1);
        }
        // Rien dit la dernière fois : pas de « Bon retour », on reprend simplement l'accueil
        if (restored.length > 0 && !restored.some((m) => m.role === "user")) {
          setMessages(restored);
          setShowMoodPicker(true);
          setHydrated(true);
          return;
        }
        if (restored.length > 0) {
          const lastSession = getLastSession();
          const EMOTION_CONTEXT: Partial<Record<EtatEmotionnel, string>> = {
            anxieux: "quelque chose qui t'inquiétait",
            triste: "quelque chose de douloureux",
            en_colere: "quelque chose qui te touchait",
            crise: "une période difficile",
            joy: "un beau moment",
          };
          // Pas de rappel vague (« tu m'avais parlé de quelque chose ») si l'émotion n'est pas parlante
          const contexte = lastSession ? (EMOTION_CONTEXT[lastSession.etatFin] ?? null) : null;
          const qui = savedName ? `, ${savedName}` : "";
          const returnContent = contexte
            ? `Bon retour${qui}. La dernière fois, tu m'avais parlé de ${contexte}. Comment ça va depuis ?`
            : `Bon retour${qui}, je suis contente de te retrouver. Comment tu te sens aujourd'hui ?`;
          const returnMsg: ChatMessage = {
            role: "assistant",
            content: returnContent,
            timestamp: Date.now(),
            kind: "return",
          };
          setMessages([...restored, returnMsg]);
          setHydrated(true);
          return;
        }
      } catch {
        // ignore parse errors
      }
    }

    setMessages([WELCOME_MESSAGE]);
    setShowMoodPicker(true);
    setHydrated(true);
  }, []);

  // Sauvegarde des messages et de l'émotion
  useEffect(() => {
    if (!hydrated || messages.length === 0) return;
    // Une réponse en cours d'écriture n'est pas sauvegardée (elle le sera une fois terminée)
    const stable = messages.filter((m) => !m.streaming);
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(stable.slice(-40)));
    // Proposer le feedback après 5 messages utilisateur
    const userCount = messages.filter((m) => m.role === "user").length;
    if (userCount >= 5 && !feedbackDone && !showFeedback) {
      setShowFeedback(true);
    }
  }, [messages, hydrated, feedbackDone, showFeedback]);

  // Sauvegarde de session à la fermeture de page
  useEffect(() => {
    const handleUnload = () => {
      const { messages: msgs, etat: currentEtat } = liveRef.current;
      if (!sessionStartRef.current || sessionSavedRef.current) return;
      if (msgs.filter((m) => m.role === "user").length === 0) return;
      sauvegarderSession({
        nbMessages: msgs.length,
        etatDebut: etatDebutRef.current,
        etatFin: currentEtat,
        dureeMinutes: Math.max(1, Math.round((Date.now() - sessionStartRef.current!) / 60000)),
      });
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY_EMOTION, etat);
  }, [etat, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    setHasMicSupport(
      typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
  }, []);

  const updateEtat = useCallback((newEtat: EtatEmotionnel) => {
    setEtat((prev) => {
      if (prev !== newEtat) setPrevEtat(prev);
      return newEtat;
    });
    logMood(newEtat);
    if (newEtat === "crise") setCrisisDismissed(false);
  }, []);

  // Lecteur vocal (Gemini TTS, repli Web Speech) ; coupé si on quitte la page de chat
  useEffect(() => {
    const player = new TtsPlayer(setPlayback);
    playerRef.current = player;
    return () => player.dispose();
  }, []);

  const stopSpeaking = useCallback(() => {
    playerRef.current?.stop();
  }, []);

  // À appeler uniquement depuis un geste (clic, touche) : débloque l'audio sur iOS
  const unlockAudio = useCallback(() => {
    playerRef.current?.unlock();
  }, []);

  const speakText = useCallback((text: string, id: number) => {
    void playerRef.current?.play(id, text);
  }, []);

  const handleListen = useCallback((text: string, id: number) => {
    const player = playerRef.current;
    if (!player) return;
    if (playback?.id === id) {
      if (playback.state === "playing") player.pause();
      else if (playback.state === "paused") player.resume();
      else player.stop();
      return;
    }
    player.unlock();
    void player.play(id, text);
  }, [playback]);

  const toggleVoice = useCallback(() => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    try {
      localStorage.setItem(STORAGE_KEY_VOICE, next ? "1" : "0");
    } catch {
      // stockage indisponible : le choix vaut pour cette session seulement
    }
    if (next) unlockAudio();
    else stopSpeaking();
  }, [voiceEnabled, unlockAudio, stopSpeaking]);

  // Humeur choisie sur l'accueil (/chat?humeur=triste) : point de départ de la conversation
  useEffect(() => {
    if (!hydrated) return;
    const humeur = new URLSearchParams(window.location.search).get("humeur");
    const picked = MOOD_OPTIONS.find((o) => o.etat === humeur);
    if (!picked) return;
    updateEtat(picked.etat);
    setShowMoodPicker(false);
    window.history.replaceState(null, "", "/chat");
  }, [hydrated, updateEtat]);

  const handleRestart = useCallback(() => {
    if (!window.confirm("Effacer la conversation et recommencer ?")) return;
    // Sauvegarder la session courante avant de tout effacer
    if (sessionStartRef.current && !sessionSavedRef.current) {
      const { messages: msgs, etat: currentEtat } = liveRef.current;
      if (msgs.filter((m) => m.role === "user").length > 0) {
        sauvegarderSession({
          nbMessages: msgs.length,
          etatDebut: etatDebutRef.current,
          etatFin: currentEtat,
          dureeMinutes: Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 60000)),
        });
        sessionSavedRef.current = true;
      }
    }
    sessionStartRef.current = null;
    etatDebutRef.current = "neutre";
    sessionSavedRef.current = false;
    exerciceUsedRef.current = false;
    setActiveExercice(null);
    setShowFeedback(false);
    setFeedbackDone(false);
    stopSpeaking();
    clearSession();
    localStorage.removeItem(STORAGE_KEY_MESSAGES);
    localStorage.removeItem(STORAGE_KEY_EMOTION);
    localStorage.removeItem(STORAGE_KEY_SUMMARY);
    summaryRef.current = null;
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setEtat("neutre");
    setPrevEtat(null);
    setUserNameState(null);
    setShowNamePrompt(true);
    setShowMoodPicker(true);
    setCrisisDismissed(false);
    setCrisisLevel("none");
    setShowMenu(false);
  }, [stopSpeaking]);

  const handleShare = useCallback(async () => {
    setShowMenu(false);
    const lines = messages.map((m) => {
      const who = m.role === "user" ? "Moi" : "YURA";
      const time = formatTime(m.timestamp);
      return `[${time}] ${who} : ${m.content}`;
    });
    const text = `Résumé de session YURA du ${new Date().toLocaleDateString("fr-FR")}\n\n${lines.join("\n\n")}`;

    if (navigator.share) {
      await navigator.share({ title: "Ma session YURA", text }).catch(() => null);
    } else {
      await navigator.clipboard.writeText(text).catch(() => null);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    }
  }, [messages]);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleSetName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    setUserNameState(trimmed);
    setShowNamePrompt(false);
    const welcome: ChatMessage = {
      role: "assistant",
      content: `Mbolo ${trimmed}, je suis contente de te rencontrer.\n\nIci, tu peux parler librement, sans jugement. Je t'écoute.\n\nComment tu te sens aujourd'hui ?`,
      timestamp: Date.now(),
    };
    setMessages([welcome]);
    setShowMoodPicker(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleMoodPick = (picked: EtatEmotionnel) => {
    updateEtat(picked);
    setShowMoodPicker(false);
  };

  const handleSavePhrase = useCallback((texte: string, idx: number) => {
    if (savedTexts.has(texte)) return;
    sauvegarderPhrase(texte);
    setSavedTexts((prev) => new Set([...prev, texte]));
    setPulsingIdx(idx);
    setTimeout(() => setPulsingIdx(null), 700);
  }, [savedTexts]);

  // Résume en arrière-plan les messages sortis de la fenêtre des 20 derniers (par paquets de 6).
  // Un échec est sans conséquence : on réessaiera au prochain message.
  const updateSummary = useCallback(async (fullHistory: ChatMessage[]) => {
    if (summarizingRef.current) return;
    const pending = messagesToSummarize(fullHistory.filter((m) => !m.streaming), summaryRef.current);
    if (!pending) return;
    summarizingRef.current = true;
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previous: summaryRef.current?.text,
          messages: pending.map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!res.ok) return;
      const { summary } = (await res.json()) as { summary?: string };
      if (!summary) return;
      summaryRef.current = { text: summary, upTo: pending[pending.length - 1].timestamp };
      try {
        localStorage.setItem(STORAGE_KEY_SUMMARY, JSON.stringify(summaryRef.current));
      } catch {
        // stockage indisponible : le résumé reste en mémoire pour cette session
      }
    } catch {
      // réseau : on réessaiera au prochain message
    } finally {
      summarizingRef.current = false;
    }
  }, []);

  // Demande une réponse à YURA en streaming : le texte s'affiche au fil de l'eau.
  // En cas d'échec, la réponse partielle est retirée et « Réessayer » est proposé.
  const requestReply = useCallback(async (
    history: ChatMessage[],
    autoSpeak: boolean,
    clientEmotion: EtatEmotionnel
  ): Promise<{ id: number; content: string } | null> => {
    setIsLoading(true);
    setFailedReply(null);
    // Toujours postérieur au dernier message : l'identifiant ne doit jamais coïncider avec celui
    // du message de l'utilisateur (créé dans la même milliseconde), sinon le retirer en cas d'échec l'effacerait aussi
    const replyId = Math.max(Date.now(), (history[history.length - 1]?.timestamp ?? 0) + 1);
    let shown = "";
    let started = false;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Longues conversations : 20 derniers messages en entier + résumé des plus anciens
          messages: recentWindow(history).map(({ role, content }) => ({ role, content })),
          summary: summaryRef.current?.text,
          userName,
        }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done: ReplyDone | null = null;
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          const event = JSON.parse(line) as { type: string } & Partial<ReplyDone>;
          if (event.type === "delta" && event.text) {
            shown += event.text;
            const current = shown;
            if (!started) {
              started = true;
              setIsLoading(false);
              setMessages((prev) => [...prev, { role: "assistant", content: current, timestamp: replyId, streaming: true }]);
            } else {
              setMessages((prev) => prev.map((m) => (m.timestamp === replyId ? { ...m, content: current } : m)));
            }
          } else if (event.type === "done") {
            done = event as ReplyDone;
          } else if (event.type === "error") {
            throw new Error("stream");
          }
        }
      }
      if (!done) throw new Error("incomplete");
      const final = done;

      setMessages((prev) =>
        started
          ? prev.map((m) => (m.timestamp === replyId ? { role: "assistant", content: final.text, timestamp: replyId } : m))
          : [...prev, { role: "assistant", content: final.text, timestamp: replyId }]
      );

      const finalEmotion = final.emotion ?? clientEmotion;
      if (finalEmotion !== "neutre") updateEtat(finalEmotion);
      if (final.exercice && !exerciceUsedRef.current) {
        exerciceUsedRef.current = true;
        setActiveExercice(final.exercice);
      }
      if (autoSpeak && voiceEnabled) speakText(final.text, replyId);
      if (final.crisisLevel && final.crisisLevel !== "none") {
        setCrisisLevel(final.crisisLevel);
        updateEtat("crise");
      }
      void updateSummary([...history, { role: "assistant", content: final.text, timestamp: replyId }]);
      return { id: replyId, content: final.text };
    } catch {
      // Jamais de message d'erreur dans l'historique : on retire la réponse partielle et on propose de réessayer
      setMessages((prev) => prev.filter((m) => m.timestamp !== replyId));
      setFailedReply({ history, autoSpeak, clientEmotion });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userName, voiceEnabled, speakText, updateEtat, updateSummary]);

  // text : message dicté en mode vocal (sinon le champ de saisie).
  // autoSpeak : en mode vocal, c'est le mode vocal qui gère la lecture.
  // Renvoie la réponse de YURA (ou null en cas d'erreur).
  const sendMessage = useCallback(async (
    override?: string,
    autoSpeak = true
  ): Promise<{ id: number; content: string } | null> => {
    const text = (override ?? input).trim();
    if (!text || isLoading) return null;

    // Envoyer coupe la lecture ; ce geste sert aussi à débloquer l'audio (iOS)
    stopSpeaking();
    if (voiceEnabled) unlockAudio();

    // Démarre le chrono à la toute première réponse utilisateur
    if (sessionStartRef.current === null) {
      sessionStartRef.current = Date.now();
      etatDebutRef.current = liveRef.current.etat;
      sessionSavedRef.current = false;
    }

    setShowMoodPicker(false);
    const clientEmotion = detectEmotion(text);
    if (clientEmotion === "crise") updateEtat("crise");

    const userMessage: ChatMessage = { role: "user", content: text, timestamp: Date.now() };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");
    setCrisisLevel("none");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const reply = await requestReply(newMessages, autoSpeak, clientEmotion);
    // En mode vocal, ne pas faire surgir le clavier derrière l'écran vocal
    if (autoSpeak) setTimeout(() => inputRef.current?.focus(), 50);
    return reply;
  }, [input, isLoading, messages, voiceEnabled, stopSpeaking, unlockAudio, updateEtat, requestReply]);

  const retryReply = useCallback(() => {
    if (!failedReply || isLoading) return;
    void requestReply(failedReply.history, failedReply.autoSpeak, failedReply.clientEmotion);
  }, [failedReply, isLoading, requestReply]);

  // Ouvert par un clic : ce geste débloque l'audio (iOS) et l'analyse du son pour l'orbe
  const openVoiceMode = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    player.stop();
    player.unlock();
    player.enableAnalyser();
    setVoiceMode(true);
  }, []);

  const sendVoiceMessage = useCallback((text: string) => sendMessage(text, false), [sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showCrisisBanner =
    (etat === "crise" || crisisLevel !== "none") && !crisisDismissed;

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: theme.bgMain,
        transition: "background-color 2s ease",
      }}
    >
      {/* Bannière urgence — en haut, toujours accessible */}
      {showCrisisBanner && (
        <div
          style={{
            background: "#F5F0E8",
            borderBottom: "2px solid #DC2626",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            zIndex: 20,
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ color: "#1a1a1a", fontSize: 13, fontWeight: 600, margin: 0 }}>
              🤝 Tu n&apos;es pas seul(e). Si tu es en danger, appelle maintenant :
            </p>
            <a
              href="tel:1300"
              style={{
                color: "#DC2626",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 2,
              }}
            >
              📞 1300 · SAMU Gabon · 24h/24
            </a>
          </div>
          <button
            onClick={() => setCrisisDismissed(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "#6b6b6b",
              cursor: "pointer",
              fontSize: 18,
              padding: "4px 8px",
              lineHeight: 1,
              minWidth: 44,
              minHeight: 44,
            }}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div
        className="chat-header px-4 py-3 border-b"
        style={{
          background: theme.bgHeader,
          borderColor: `${theme.accent}30`,
          transition: "background-color 2s ease, border-color 2s ease",
        }}
      >
        <div className="chat-column flex items-center gap-3">
        <Link
          href="/"
          aria-label="Retour à l'accueil"
          style={{
            width: 44,
            height: 44,
            marginLeft: -10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            color: theme.textMuted,
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5m6-6-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <YuraAvatar size={36} animate light={lightMode} />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm" style={{ color: theme.textPrimary }}>
            YURA
          </h2>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            Écoute confidentielle · Sans compte
          </p>
        </div>

        {/* Indicateur émotion */}
        {prevEtat !== null && etat !== "neutre" && (
          <div
            className="chat-header-emotion flex items-center gap-1 px-2 py-1 rounded-full text-xs"
            style={{
              background: `${theme.accent}25`,
              color: theme.textSecondary,
              border: `1px solid ${theme.accent}40`,
              transition: "all 2s ease",
            }}
          >
            <span>{getTheme(etat).icon}</span>
            <span>{getTheme(etat).label}</span>
          </div>
        )}

        {/* Indicateur YURA parle */}
        {isSpeaking && (
          <div className="flex items-center gap-1">
            {[4, 7, 5].map((h, n) => (
              <div
                key={n}
                className="w-0.5 rounded-full animate-bounce"
                style={{
                  height: h,
                  background: theme.dotColor,
                  animationDelay: `${n * 0.15}s`,
                  transition: "background-color 2s ease",
                }}
              />
            ))}
          </div>
        )}

        {/* Bouton voix */}
        <button
          onClick={toggleVoice}
          title={voiceEnabled ? "Désactiver la lecture automatique" : "Activer la lecture automatique"}
          aria-label={voiceEnabled ? "Désactiver la lecture automatique" : "Activer la lecture automatique"}
          aria-pressed={voiceEnabled}
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: voiceEnabled ? `${theme.accent}40` : "rgba(255,255,255,0.05)",
            color: voiceEnabled ? theme.dotColor : theme.textMuted,
            border: "none",
            cursor: "pointer",
            transition: "all 0.3s ease",
            flexShrink: 0,
          }}
        >
          {voiceEnabled ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          )}
        </button>

        {/* Bouton menu */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            title="Options"
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: showMenu ? `${theme.accent}40` : "rgba(255,255,255,0.05)",
              color: theme.textMuted,
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              flexShrink: 0,
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            ⋯
          </button>

          {showMenu && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                background: theme.bgHeader,
                border: `1px solid ${theme.accent}40`,
                borderRadius: 16,
                padding: 8,
                minWidth: 200,
                zIndex: 30,
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              {[
                { icon: "📊", label: "Journal d'humeur", action: () => { setShowJournal(true); setShowMenu(false); } },
                { icon: "📤", label: "Partager la session", action: handleShare },
                {
                  icon: lightMode ? "🌙" : "☀️",
                  label: lightMode ? "Mode sombre" : "Mode clair",
                  action: () => {
                    const next = !lightMode;
                    setLightMode(next);
                    localStorage.setItem("yura_light_mode", next ? "1" : "0");
                    setShowMenu(false);
                  },
                },
                { icon: "↺", label: "Recommencer", action: handleRestart },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "10px 14px",
                    background: "transparent",
                    border: "none",
                    borderRadius: 10,
                    color: theme.textSecondary,
                    fontSize: 14,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = `${theme.accent}20`)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Toast copié */}
      {shareToast && (
        <div
          style={{
            position: "fixed",
            bottom: 100,
            left: "50%",
            transform: "translateX(-50%)",
            background: theme.accent,
            color: theme.onAccent,
            padding: "10px 20px",
            borderRadius: 100,
            fontSize: 13,
            fontWeight: 600,
            zIndex: 50,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          ✓ Conversation copiée
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4" style={{ scrollBehavior: "smooth" }}>
        <div className="chat-column">
          {/* Prompt prénom */}
          {showNamePrompt && (
            <div
              className="mb-4 p-4 rounded-2xl border"
              style={{
                background: `${theme.accent}15`,
                borderColor: `${theme.accent}30`,
              }}
            >
              <p className="text-sm mb-3" style={{ color: theme.textSecondary }}>
                Comment voudrais-tu que je t&apos;appelle ? (optionnel)
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSetName()}
                  placeholder="Ton prénom ou surnom…"
                  className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                  style={{
                    background: `${theme.accent}20`,
                    border: `1px solid ${theme.accent}40`,
                    color: theme.textPrimary,
                  }}
                />
                <button
                  onClick={handleSetName}
                  style={{
                    padding: "8px 16px",
                    background: theme.accent,
                    color: theme.onAccent,
                    border: "none",
                    borderRadius: 12,
                    fontSize: 14,
                    cursor: "pointer",
                    minHeight: 48,
                  }}
                >
                  OK
                </button>
                <button
                  onClick={() => setShowNamePrompt(false)}
                  style={{
                    padding: "8px 16px",
                    background: "rgba(255,255,255,0.08)",
                    color: theme.textMuted,
                    border: "none",
                    borderRadius: 12,
                    fontSize: 14,
                    cursor: "pointer",
                    minHeight: 48,
                  }}
                >
                  Passer
                </button>
              </div>
            </div>
          )}

          {/* Mood picker */}
          {showMoodPicker && (
            <div className="mb-4">
              <p className="text-xs mb-2" style={{ color: theme.textMuted }}>
                Comment tu te sens en ce moment ?
              </p>
              <div className="flex gap-2 flex-wrap">
                {MOOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.etat}
                    onClick={() => handleMoodPick(opt.etat)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px",
                      background: `${theme.accent}20`,
                      border: `1px solid ${theme.accent}35`,
                      borderRadius: 100,
                      color: theme.textSecondary,
                      fontSize: 13,
                      cursor: "pointer",
                      minHeight: 48,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              style={{
                animation: "slideUp 0.3s ease-out",
              }}
            >
              {msg.role === "assistant" && (
                <YuraAvatar size={28} animate={false} light={lightMode} />
              )}
              <div className="chat-bubble flex flex-col gap-1">
                <div
                  style={{
                    padding: "12px 16px",
                    fontSize: 15,
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    background:
                      msg.role === "assistant" ? theme.bubbleYura : theme.bubbleUser,
                    border:
                      msg.role === "assistant"
                        ? `1px solid ${theme.bubbleYuraBorder}`
                        : "none",
                    borderRadius:
                      msg.role === "assistant"
                        ? "4px 18px 18px 18px"
                        : "18px 4px 18px 18px",
                    color:
                      msg.role === "assistant"
                        ? theme.textPrimary
                        : theme.bubbleUserText,
                    transition: "background-color 2s ease, border-color 2s ease, color 2s ease",
                  }}
                >
                  {msg.content}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    paddingInline: 4,
                  }}
                >
                  <span style={{ fontSize: 11, color: theme.textMuted, transition: "color 2s ease" }}>
                    {formatTime(msg.timestamp)}
                  </span>
                  {msg.role === "assistant" && (
                    <ListenButton
                      playback={playback?.id === msg.timestamp ? playback : null}
                      onClick={() => handleListen(msg.content, msg.timestamp)}
                      theme={theme}
                    />
                  )}
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => handleSavePhrase(msg.content, i)}
                      title={savedTexts.has(msg.content) ? "Sauvegardé" : "Sauvegarder cette phrase"}
                      aria-label={savedTexts.has(msg.content) ? "Phrase sauvegardée" : "Sauvegarder cette phrase"}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: savedTexts.has(msg.content) ? "default" : "pointer",
                        fontSize: 13,
                        lineHeight: 1,
                        minWidth: 44,
                        minHeight: 44,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: savedTexts.has(msg.content) ? theme.accent : theme.textMuted,
                        opacity: savedTexts.has(msg.content) ? 1 : 0.6,
                        transition: "opacity 0.25s, color 0.25s",
                        animation: pulsingIdx === i ? "heart-pulse 0.65s ease-out" : "none",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"
                          fill={savedTexts.has(msg.content) ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start" style={{ animation: "slideUp 0.3s ease-out" }}>
              <YuraAvatar size={28} animate={false} light={lightMode} />
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: "4px 18px 18px 18px",
                  background: theme.bubbleYura,
                  border: `1px solid ${theme.bubbleYuraBorder}`,
                  transition: "background-color 2s ease",
                }}
              >
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map((n) => (
                    <div
                      key={n}
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        background: theme.dotColor,
                        animationDelay: `${n * 0.15}s`,
                        transition: "background-color 2s ease",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        </div>
      </div>

      {/* Exercice TCC */}
      {activeExercice && (
        <div className="chat-panel chat-column">
        <ExerciceGuide
          type={activeExercice}
          onDone={() => setActiveExercice(null)}
          currentTheme={theme}
        />
        </div>
      )}

      {/* Feedback de fin de session */}
      {showFeedback && !activeExercice && (() => {
        const sessionData: Omit<FeedbackPayload, "note" | "commentaire"> = {
          uuid: liveRef.current.messages[0]?.timestamp?.toString() ?? "unknown",
          etatDebut: etatDebutRef.current,
          etatFin: etat,
          nbMessages: messages.length,
          dureeMinutes: sessionStartRef.current
            ? Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 60000))
            : 0,
        };
        return (
          <div className="chat-panel chat-column">
          <FeedbackFin
            currentTheme={theme}
            sessionData={sessionData}
            onDone={() => { setShowFeedback(false); setFeedbackDone(true); }}
          />
          </div>
        );
      })()}

      {/* Échec de réponse : rien n'est sauvegardé, on propose de réessayer */}
      {failedReply && !isLoading && (
        <div className="chat-column" style={{ padding: "0 16px 8px" }}>
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "8px 8px 8px 16px",
              borderRadius: 16,
              background: `${theme.accent}12`,
              border: `1px solid ${theme.accent}30`,
              color: theme.textSecondary,
              fontSize: 14,
            }}
          >
            <span>YURA n&apos;a pas pu répondre.</span>
            <button
              onClick={retryReply}
              style={{
                minHeight: 44,
                padding: "0 18px",
                borderRadius: 12,
                border: "none",
                background: theme.accent,
                color: theme.onAccent,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div
        className="px-4 pb-safe pt-3 border-t"
        style={{
          background: theme.bgInput,
          borderColor: `${theme.accent}25`,
          transition: "background-color 2s ease, border-color 2s ease",
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        }}
      >
        <div
          className="chat-column flex gap-2 items-end rounded-2xl p-2"
          style={{
            background: `${theme.accent}15`,
            border: `1px solid ${theme.accent}35`,
            transition: "background-color 2s ease, border-color 2s ease",
          }}
        >
          {/* Bouton micro */}
          {hasMicSupport && (
            <button
              onClick={isListening ? stopListening : startListening}
              title={isListening ? "Arrêter" : "Parler à YURA"}
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isListening ? "#EF4444" : `${theme.accent}30`,
                color: isListening ? "#fff" : theme.textSecondary,
                border: isListening ? "2px solid #EF4444" : "none",
                cursor: "pointer",
                flexShrink: 0,
                animation: isListening ? "micPulse 1.2s ease-in-out infinite" : "none",
                transition: "background 0.3s ease",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </svg>
            </button>
          )}

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              if (playback) stopSpeaking();
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "🎤 En écoute…" : "Écris ce que tu ressens…"}
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none leading-relaxed"
            style={{
              color: theme.textPrimary,
              fontSize: 15,
              maxHeight: 120,
              padding: "10px 8px",
              caretColor: theme.dotColor,
            }}
          />

          {/* Champ vide : le bouton ouvre le mode vocal (comme ChatGPT) ; sinon il envoie */}
          {!input.trim() && hasMicSupport ? (
            <button
              onClick={openVoiceMode}
              disabled={isLoading}
              title="Parler avec YURA"
              aria-label="Ouvrir le mode vocal"
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: theme.accent,
                color: theme.onAccent,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.4 : 1,
                flexShrink: 0,
                transition: "all 0.2s ease",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="3" y="10" width="2.5" height="4" rx="1.25" />
                <rect x="7.5" y="6" width="2.5" height="12" rx="1.25" />
                <rect x="12" y="3" width="2.5" height="18" rx="1.25" />
                <rect x="16.5" y="7" width="2.5" height="10" rx="1.25" />
                <rect x="21" y="10.5" width="2" height="3" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              aria-label="Envoyer"
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: isLoading || !input.trim() ? `${theme.accent}30` : theme.accent,
                color: isLoading || !input.trim() ? theme.textPrimary : theme.onAccent,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
                opacity: isLoading || !input.trim() ? 0.4 : 1,
                flexShrink: 0,
                transition: "all 0.2s ease",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="currentColor" />
              </svg>
            </button>
          )}
        </div>

        <div className="chat-disclaimer text-xs text-center mt-2" style={{ color: theme.textMuted }}>
          Conversation privée · Aucune donnée nominative collectée
          <span style={{ margin: "0 8px", opacity: 0.4 }}>·</span>
          <a href="/about" className="tap-target" style={{ color: theme.textMuted, textDecoration: "none", opacity: 0.7 }}>À propos</a>
          <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>
          <a href="/teleconsultation" className="tap-target" style={{ color: theme.textMuted, textDecoration: "none", opacity: 0.7 }}>Téléconsultation</a>
          <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>
          <a href="/privacy" className="tap-target" style={{ color: theme.textMuted, textDecoration: "none", opacity: 0.7 }}>Confidentialité</a>
        </div>
      </div>

      {/* Animations globales */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes micPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          50%       { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
        textarea::placeholder { color: inherit; opacity: 0.35; }
        * { box-sizing: border-box; }
        @keyframes tts-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes heart-pulse {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.65); }
          70%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Mode vocal plein écran */}
      {voiceMode && playerRef.current && (
        <VoiceMode
          player={playerRef.current}
          playbackState={playback?.state ?? null}
          onSend={sendVoiceMessage}
          onClose={() => setVoiceMode(false)}
          showCrisis={showCrisisBanner}
        />
      )}

      {/* Onboarding */}
      {showOnboarding && (
        <Onboarding onDone={() => setShowOnboarding(false)} />
      )}

      {/* Journal de progression */}
      {showJournal && (
        <JournalModal onClose={() => setShowJournal(false)} currentTheme={theme} />
      )}

      {/* Fermer menu en cliquant ailleurs */}
      {showMenu && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 29 }}
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}

const ICON_PATHS = {
  play: "M8 5v14l11-7z",
  pause: "M6 5h4v14H6zM14 5h4v14h-4z",
  stop: "M6 6h12v12H6z",
};

function ListenButton({
  playback,
  onClick,
  theme,
}: {
  playback: Playback | null;
  onClick: () => void;
  theme: ColorTheme;
}) {
  const state = playback?.state ?? "idle";
  const { label, aria, icon } =
    state === "loading"
      ? { label: "Chargement…", aria: "Arrêter le chargement", icon: null }
      : state === "playing"
        ? playback?.pausable
          ? { label: "Pause", aria: "Mettre en pause", icon: ICON_PATHS.pause }
          : { label: "Arrêter", aria: "Arrêter la lecture", icon: ICON_PATHS.stop }
        : state === "paused"
          ? { label: "Reprendre", aria: "Reprendre la lecture", icon: ICON_PATHS.play }
          : { label: "Écouter", aria: "Écouter ce message", icon: ICON_PATHS.play };
  const active = state !== "idle";

  return (
    <button
      onClick={onClick}
      aria-label={aria}
      aria-busy={state === "loading"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        minWidth: 44,
        minHeight: 44,
        padding: "0 10px",
        background: active ? `${theme.accent}30` : "transparent",
        border: "none",
        borderRadius: 100,
        color: active ? theme.dotColor : theme.textMuted,
        fontSize: 12,
        cursor: "pointer",
        transition: "background 0.2s, color 0.2s",
      }}
    >
      {icon ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d={icon} />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" style={{ animation: "tts-spin 0.9s linear infinite" }}>
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" strokeLinecap="round" />
        </svg>
      )}
      {label}
    </button>
  );
}
