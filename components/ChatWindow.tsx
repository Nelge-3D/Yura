"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getUserName, setUserName, getOrCreateSessionId, clearSession } from "@/lib/uuid";
import { CrisisLevel } from "@/lib/crisis";
import { detectEmotion, extractEmotionFromYura, EtatEmotionnel } from "@/lib/emotionDetector";
import { getTheme, getLightTheme, ColorTheme } from "@/lib/colorThemes";
import { logMood } from "@/lib/moodLog";
import YuraAvatar from "@/components/YuraAvatar";
import MoodJournal from "@/components/MoodJournal";
import Onboarding from "@/components/Onboarding";

const STORAGE_KEY_MESSAGES = "yura_messages";
const STORAGE_KEY_EMOTION = "yura_emotion";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Mbolo ! Je suis YURA 🌿\n\nJe suis là pour t'écouter, sans jugement et en toute confidentialité. Tu n'as pas besoin de t'inscrire.\n\nComment s'est passée ta journée ?",
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
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasMicSupport, setHasMicSupport] = useState(false);
  const [etat, setEtat] = useState<EtatEmotionnel>("neutre");
  const [prevEtat, setPrevEtat] = useState<EtatEmotionnel | null>(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [crisisDismissed, setCrisisDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [lightMode, setLightMode] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const theme: ColorTheme = lightMode ? getLightTheme(etat) : getTheme(etat);

  // Hydratation depuis localStorage
  useEffect(() => {
    const onboarded = localStorage.getItem("yura_onboarded");
    if (!onboarded) {
      setShowOnboarding(true);
    }
    const savedLightMode = localStorage.getItem("yura_light_mode");
    if (savedLightMode === "1") setLightMode(true);

    getOrCreateSessionId();
    const savedName = getUserName();
    if (savedName) {
      setUserNameState(savedName);
    } else {
      setShowNamePrompt(true);
    }

    const savedEmotion = localStorage.getItem(STORAGE_KEY_EMOTION) as EtatEmotionnel | null;
    if (savedEmotion) setEtat(savedEmotion);

    const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (savedMessages) {
      try {
        const parsed: ChatMessage[] = JSON.parse(savedMessages);
        if (parsed.length > 0) {
          const returnMsg: ChatMessage = {
            role: "assistant",
            content: savedName
              ? `Bon retour, ${savedName} 🌿 Je suis contente de te retrouver. Comment tu vas aujourd'hui ?`
              : "Bon retour 🌿 Je suis contente de te retrouver. Comment tu vas aujourd'hui ?",
            timestamp: Date.now(),
          };
          setMessages([...parsed, returnMsg]);
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
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages.slice(-40)));
  }, [messages, hydrated]);

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

  const handleRestart = useCallback(() => {
    if (!window.confirm("Effacer la conversation et recommencer ?")) return;
    window.speechSynthesis?.cancel();
    clearSession();
    localStorage.removeItem(STORAGE_KEY_MESSAGES);
    localStorage.removeItem(STORAGE_KEY_EMOTION);
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
  }, []);

  const handleShare = useCallback(async () => {
    setShowMenu(false);
    const lines = messages.map((m) => {
      const who = m.role === "user" ? "Moi" : "YURA";
      const time = formatTime(m.timestamp);
      return `[${time}] ${who} : ${m.content}`;
    });
    const text = `Résumé de session YURA — ${new Date().toLocaleDateString("fr-FR")}\n\n${lines.join("\n\n")}`;

    if (navigator.share) {
      await navigator.share({ title: "Ma session YURA", text }).catch(() => null);
    } else {
      await navigator.clipboard.writeText(text).catch(() => null);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    }
  }, [messages]);

  const speakText = useCallback(
    (text: string) => {
      if (!voiceEnabled || typeof window === "undefined") return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const clean = text.replace(/[🌿🤝💛📞🎤😌😰😢😤😊]/g, "").replace(/\n+/g, " ").trim();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = "fr-FR";
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      const assignVoiceAndSpeak = () => {
        const voices = synth.getVoices();
        const frVoice = voices.find((v) => v.lang.startsWith("fr")) ?? null;
        if (frVoice) utterance.voice = frVoice;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        synth.speak(utterance);
      };

      // iOS Safari charge les voix de façon asynchrone
      if (synth.getVoices().length > 0) {
        assignVoiceAndSpeak();
      } else {
        synth.addEventListener("voiceschanged", assignVoiceAndSpeak, { once: true });
        // Fallback si voiceschanged ne se déclenche pas (certains navigateurs)
        setTimeout(assignVoiceAndSpeak, 200);
      }
    },
    [voiceEnabled]
  );

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
      content: `Mbolo ${trimmed} ! 🌿 Je suis heureuse de te rencontrer. Je suis YURA, ton espace d'écoute confidentiel.\n\nComment s'est passée ta journée ?`,
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

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setShowMoodPicker(false);
    const clientEmotion = detectEmotion(text);
    if (clientEmotion === "crise") updateEtat("crise");

    const userMessage: ChatMessage = { role: "user", content: text, timestamp: Date.now() };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setCrisisLevel("none");
    if (inputRef.current) inputRef.current.style.height = "auto";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, userName }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const { text: cleanText, emotion: yuraEmotion } = extractEmotionFromYura(data.message);

      const finalEmotion = yuraEmotion ?? clientEmotion;
      if (finalEmotion !== "neutre") updateEtat(finalEmotion);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: cleanText, timestamp: Date.now() },
      ]);

      speakText(cleanText);

      if (data.crisisLevel !== "none") {
        setCrisisLevel(data.crisisLevel);
        updateEtat("crise");
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Je suis désolée, une petite erreur s'est produite. Tu peux réessayer ?";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: msg, timestamp: Date.now() },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, isLoading, messages, userName, speakText, updateEtat]);

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
              📞 1300 — SAMU Gabon · 24h/24
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
            }}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{
          background: theme.bgHeader,
          borderColor: `${theme.accent}30`,
          transition: "background-color 2s ease, border-color 2s ease",
        }}
      >
        <YuraAvatar size={40} animate />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm" style={{ color: theme.textPrimary }}>
            YURA
          </h2>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            Écoute confidentielle · Anonyme
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
          onClick={() => {
            setVoiceEnabled((v) => !v);
            if (isSpeaking) window.speechSynthesis?.cancel();
          }}
          title={voiceEnabled ? "Désactiver la voix" : "Activer la voix"}
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

      {/* Toast copié */}
      {shareToast && (
        <div
          style={{
            position: "fixed",
            bottom: 100,
            left: "50%",
            transform: "translateX(-50%)",
            background: theme.accent,
            color: theme.textPrimary,
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

      {/* Prompt prénom */}
      {showNamePrompt && (
        <div
          className="mx-4 mt-4 p-4 rounded-2xl border"
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
                color: theme.textPrimary,
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
        <div className="mx-4 mt-4">
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollBehavior: "smooth" }}>
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
                <YuraAvatar size={28} animate={false} />
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
                <span
                  style={{
                    fontSize: 11,
                    color: theme.textMuted,
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    paddingInline: 4,
                    transition: "color 2s ease",
                  }}
                >
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start" style={{ animation: "slideUp 0.3s ease-out" }}>
              <YuraAvatar size={28} animate={false} />
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
          className="flex gap-2 items-end rounded-2xl p-2"
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

          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: isLoading || !input.trim() ? `${theme.accent}30` : theme.accent,
              color: theme.textPrimary,
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
        </div>

        <div className="chat-disclaimer text-xs text-center mt-2" style={{ color: theme.textMuted }}>
          Conversation privée · Aucune donnée nominative collectée
          <span style={{ margin: "0 8px", opacity: 0.4 }}>·</span>
          <a href="/about" style={{ color: theme.textMuted, textDecoration: "none", opacity: 0.7 }}>À propos</a>
          <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>
          <a href="/teleconsultation" style={{ color: theme.textMuted, textDecoration: "none", opacity: 0.7 }}>Téléconsultation</a>
          <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>
          <a href="/privacy" style={{ color: theme.textMuted, textDecoration: "none", opacity: 0.7 }}>Confidentialité</a>
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
      `}</style>

      {/* Onboarding */}
      {showOnboarding && (
        <Onboarding onDone={() => setShowOnboarding(false)} />
      )}

      {/* Journal d'humeur */}
      {showJournal && (
        <MoodJournal onClose={() => setShowJournal(false)} currentTheme={theme} />
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
