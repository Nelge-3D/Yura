"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getUserName, setUserName, getOrCreateSessionId } from "@/lib/uuid";
import { CrisisLevel } from "@/lib/crisis";
import YuraAvatar from "@/components/YuraAvatar";
import AlertBanner from "@/components/AlertBanner";
import AudioPlayer from "@/components/AudioPlayer";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Mbolo ! Je suis YURA 🌿\n\nJe suis là pour t'écouter, sans jugement et en toute confidentialité. Tu n'as pas besoin de t'inscrire.\n\nComment s'est passée ta journée ?",
};

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState<CrisisLevel>("none");
  const [userName, setUserNameState] = useState<string | null>(null);
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const [nameInput, setNameInput] = useState("");
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getOrCreateSessionId();
    const saved = getUserName();
    if (saved) {
      setUserNameState(saved);
      setShowNamePrompt(false);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSetName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    setUserNameState(trimmed);
    setShowNamePrompt(false);
    setMessages([
      {
        role: "assistant",
        content: `Mbolo ${trimmed} ! 🌿 Je suis heureuse de te rencontrer. Je suis YURA, ton espace d'écoute confidentiel.\n\nComment s'est passée ta journée ?`,
      },
    ]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setCrisisLevel("none");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          userName: userName,
        }),
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);

      if (data.audioUrl) {
        setCurrentAudioUrl(data.audioUrl);
        setIsAudioPlaying(true);
      }

      if (data.crisisLevel !== "none") {
        setCrisisLevel(data.crisisLevel);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Je suis désolée, une petite erreur s'est produite. Tu peux réessayer ?",
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, isLoading, messages, userName]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a2e1a]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#1a2e1a]/95 backdrop-blur-sm">
        <YuraAvatar size={40} animate />
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-semibold text-sm">YURA</h2>
          <p className="text-white/40 text-xs">Écoute confidentielle · Anonyme</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/40 text-xs">En ligne</span>
        </div>
      </div>

      {/* Indicateur de lecture audio */}
      {isAudioPlaying && (
        <div className="fixed bottom-20 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white/70 flex items-center gap-2 z-50">
          <div className="flex gap-0.5">
            <div className="w-1 h-2 bg-[#7fb89a] animate-[pulse_0.8s_ease-in-out_infinite]" />
            <div className="w-1 h-3 bg-[#7fb89a] animate-[pulse_0.8s_ease-in-out_0.2s_infinite]" />
            <div className="w-1 h-1.5 bg-[#7fb89a] animate-[pulse_0.8s_ease-in-out_0.4s_infinite]" />
          </div>
          <span>Yura parle...</span>
        </div>
      )}

      {/* Name prompt */}
      {showNamePrompt && (
        <div className="mx-4 mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white/70 text-sm mb-3">
            Comment voudrais-tu que je t'appelle ? (optionnel)
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetName()}
              placeholder="Ton prénom ou surnom…"
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#7fb89a]/60"
            />
            <button
              onClick={handleSetName}
              className="px-4 py-2 bg-[#4a7c59] hover:bg-[#5a8c69] text-white text-sm rounded-lg transition-colors"
            >
              OK
            </button>
            <button
              onClick={() => setShowNamePrompt(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white/60 text-sm rounded-lg transition-colors"
            >
              Passer
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <YuraAvatar size={28} animate={false} />
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "assistant"
                  ? "bg-white/10 text-white/90 border border-white/10 rounded-tl-sm"
                  : "bg-[#c9935a] text-[#1a1a1a] font-medium rounded-tr-sm"
              }`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <YuraAvatar size={28} animate={false} />
            <div className="bg-white/10 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map((n) => (
                  <div
                    key={n}
                    className="w-1.5 h-1.5 rounded-full bg-[#7fb89a] animate-bounce"
                    style={{ animationDelay: `${n * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Alert banner */}
      <AlertBanner level={crisisLevel} />

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-white/10">
        <div className="flex gap-2 items-end bg-white/10 border border-white/20 rounded-2xl p-2 focus-within:border-[#7fb89a]/50 transition-colors">
          <textarea
            ref={inputRef as unknown as React.RefObject<HTMLTextAreaElement>}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Écris ce que tu ressens…"
            rows={1}
            className="flex-1 bg-transparent text-white/90 placeholder:text-white/30 text-sm outline-none resize-none leading-relaxed px-2 py-1"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="w-9 h-9 rounded-xl bg-[#4a7c59] hover:bg-[#5a8c69] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="white" />
            </svg>
          </button>
        </div>
        <p className="text-white/25 text-xs text-center mt-2">
          Conversation privée · Aucune donnée nominative collectée
        </p>
      </div>

      {/* Audio Player */}
      <AudioPlayer 
        audioUrl={currentAudioUrl}
        onEnd={() => {
          setIsAudioPlaying(false);
          setCurrentAudioUrl(null);
        }}
      />
    </div>
  );
}