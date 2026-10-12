import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

export const metadata: Metadata = {
  title: "YURA — Tu peux en parler",
  description:
    "Un espace confidentiel pour parler de ce que tu ressens, sans jugement et sans compte, et être orienté·e vers un professionnel quand tu en as besoin. Pensé pour le Gabon.",
};

export default function HomePage() {
  return <HomeClient />;
}
