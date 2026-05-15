import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YURA — L'IA à l'écoute",
    short_name: "YURA",
    description:
      "IA d'écoute émotionnelle gabonaise. Un pont doux entre toi et les professionnels de santé mentale.",
    start_url: "/chat",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0D1F1A",
    theme_color: "#2D6A4F",
    categories: ["health", "lifestyle"],
    lang: "fr",
    icons: [
      {
        src: "/icons/yura-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/yura-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [],
  };
}
