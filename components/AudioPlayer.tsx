"use client";

import { useEffect, useRef } from "react";

interface AudioPlayerProps {
  audioUrl: string | null;
  onPlay?: () => void;
  onEnd?: () => void;
}

export default function AudioPlayer({ audioUrl, onPlay, onEnd }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const handlersRef = useRef<{ play: () => void; end: () => void } | null>(null);

  useEffect(() => {
    if (!audioUrl) return;

    // Nettoyer l'ancien audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      if (handlersRef.current) {
        audioRef.current.removeEventListener("play", handlersRef.current.play);
        audioRef.current.removeEventListener("ended", handlersRef.current.end);
      }
      audioRef.current = null;
      handlersRef.current = null;
    }

    // Créer les handlers stables
    const handlePlay = () => onPlay?.();
    const handleEnd = () => onEnd?.();
    
    handlersRef.current = { play: handlePlay, end: handleEnd };

    // Créer et configurer le nouvel audio
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("ended", handleEnd);
    
    audio.play().catch((err) => {
      console.error("Erreur lecture audio:", err);
      handleEnd(); // Nettoyer en cas d'erreur
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        if (handlersRef.current) {
          audioRef.current.removeEventListener("play", handlersRef.current.play);
          audioRef.current.removeEventListener("ended", handlersRef.current.end);
        }
        audioRef.current = null;
        handlersRef.current = null;
      }
    };
  }, [audioUrl, onPlay, onEnd]);

  return null;
}