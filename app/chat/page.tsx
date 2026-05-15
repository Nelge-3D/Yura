import ChatWindow from "@/components/ChatWindow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YURA — Conversation",
  description: "Ton espace d'écoute confidentiel",
};

export default function ChatPage() {
  return (
    <main className="h-screen-mobile flex flex-col" style={{ background: "#0D1F1A" }}>
      <ChatWindow />
    </main>
  );
}