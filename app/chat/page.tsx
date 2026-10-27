import ChatWindow from "@/components/ChatWindow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conversation avec YURA",
  description: "Ton espace d'écoute confidentiel",
};

export default function ChatPage() {
  return (
    <main className="h-screen-mobile flex flex-col" style={{ background: "#FAF8F3" }}>
      <ChatWindow />
    </main>
  );
}