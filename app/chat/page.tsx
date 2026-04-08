import ChatWindow from "@/components/ChatWindow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YURA — Conversation",
  description: "Ton espace d'écoute confidentiel",
};

export default function ChatPage() {
  return (
    <main className="h-screen flex flex-col bg-[#1a2e1a]">
      <ChatWindow />
    </main>
  );
}