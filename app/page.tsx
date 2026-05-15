import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

export const metadata: Metadata = {
  title: "YURA — L'IA à l'écoute",
  description:
    "YURA est une IA conversationnelle d'écoute émotionnelle, nourrie de la culture gabonaise. Un pont entre toi et les professionnels de santé mentale.",
};

export default function HomePage() {
  return <HomeClient />;
}
