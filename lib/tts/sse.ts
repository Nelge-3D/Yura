// Lecture du flux SSE de l'API Interactions (stream: true).
// Format observé : blocs « event: <type>\ndata: <json> » séparés par une ligne vide,
// audio dans les événements step.delta (delta.type === "audio", base64 dans delta.data),
// fin du flux signalée par « data: [DONE] ».

interface StreamEvent {
  event_type?: string;
  delta?: { type?: string; data?: string };
  error?: unknown;
}

export interface SseAudioParser {
  // Ajoute du texte reçu ; renvoie les morceaux audio (base64) complets trouvés
  push(text: string): { audio: string[]; done: boolean; error: boolean };
}

export function createSseAudioParser(): SseAudioParser {
  let buffer = "";
  return {
    push(text) {
      buffer += text.replace(/\r\n/g, "\n");
      const audio: string[] = [];
      let done = false;
      let error = false;
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) >= 0) {
        const block = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const data = block
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("");
        if (!data) continue;
        if (data === "[DONE]") {
          done = true;
          continue;
        }
        let event: StreamEvent;
        try {
          event = JSON.parse(data) as StreamEvent;
        } catch {
          continue;
        }
        if (event.error || event.event_type === "error") error = true;
        if (event.event_type === "step.delta" && event.delta?.type === "audio" && event.delta.data) {
          audio.push(event.delta.data);
        }
      }
      return { audio, done, error };
    },
  };
}
