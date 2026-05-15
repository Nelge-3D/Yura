import { EtatEmotionnel } from "./emotionDetector";

export interface ColorTheme {
  id: EtatEmotionnel;
  label: string;
  icon: string;
  // Fonds
  bgMain: string;
  bgHeader: string;
  bgInput: string;
  // Bulles
  bubbleYura: string;
  bubbleYuraBorder: string;
  bubbleUser: string;
  bubbleUserText: string;
  // Texte
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Accents
  accent: string;
  accentHover: string;
  // Dots / indicateurs
  dotColor: string;
}

export const THEMES: Record<EtatEmotionnel, ColorTheme> = {
  neutre: {
    id: "neutre",
    label: "Neutre",
    icon: "🌿",
    bgMain: "#0D1F1A",
    bgHeader: "#0A1A14",
    bgInput: "#0A1A14",
    bubbleYura: "#1B4332",
    bubbleYuraBorder: "#2D6A4F",
    bubbleUser: "#40916C",
    bubbleUserText: "#D8F3DC",
    textPrimary: "#D8F3DC",
    textSecondary: "#95C8A8",
    textMuted: "#52796F",
    accent: "#2D6A4F",
    accentHover: "#40916C",
    dotColor: "#52B788",
  },
  calme: {
    id: "calme",
    label: "Calme",
    icon: "🌿",
    bgMain: "#0D1F1A",
    bgHeader: "#0A1A14",
    bgInput: "#0A1A14",
    bubbleYura: "#1B4332",
    bubbleYuraBorder: "#2D6A4F",
    bubbleUser: "#40916C",
    bubbleUserText: "#D8F3DC",
    textPrimary: "#D8F3DC",
    textSecondary: "#95C8A8",
    textMuted: "#52796F",
    accent: "#2D6A4F",
    accentHover: "#40916C",
    dotColor: "#52B788",
  },
  anxieux: {
    id: "anxieux",
    label: "Anxieux",
    icon: "🌊",
    bgMain: "#0D0F2B",
    bgHeader: "#080A20",
    bgInput: "#080A20",
    bubbleYura: "#1A2456",
    bubbleYuraBorder: "#3D5A80",
    bubbleUser: "#4A6FA5",
    bubbleUserText: "#E0E7FF",
    textPrimary: "#E0E7FF",
    textSecondary: "#A5B4FC",
    textMuted: "#4B5990",
    accent: "#3D5A80",
    accentHover: "#4A6FA5",
    dotColor: "#818CF8",
  },
  triste: {
    id: "triste",
    label: "Triste",
    icon: "🌧",
    bgMain: "#1A1025",
    bgHeader: "#120B1C",
    bgInput: "#120B1C",
    bubbleYura: "#2D1B5E",
    bubbleYuraBorder: "#7B5EA7",
    bubbleUser: "#8B5CF6",
    bubbleUserText: "#EDE9FE",
    textPrimary: "#EDE9FE",
    textSecondary: "#C4B5FD",
    textMuted: "#6D4FA3",
    accent: "#7B5EA7",
    accentHover: "#8B5CF6",
    dotColor: "#A78BFA",
  },
  en_colere: {
    id: "en_colere",
    label: "En colère",
    icon: "🔥",
    bgMain: "#1C1008",
    bgHeader: "#140B04",
    bgInput: "#140B04",
    bubbleYura: "#3D1A08",
    bubbleYuraBorder: "#C1440E",
    bubbleUser: "#C05621",
    bubbleUserText: "#FEF3C7",
    textPrimary: "#FEF3C7",
    textSecondary: "#FCD34D",
    textMuted: "#92400E",
    accent: "#C1440E",
    accentHover: "#D4521A",
    dotColor: "#F97316",
  },
  joy: {
    id: "joy",
    label: "Bien-être",
    icon: "☀️",
    bgMain: "#1A1500",
    bgHeader: "#120F00",
    bgInput: "#120F00",
    bubbleYura: "#3D2E00",
    bubbleYuraBorder: "#D4A017",
    bubbleUser: "#F59E0B",
    bubbleUserText: "#1A1500",
    textPrimary: "#FFFBEB",
    textSecondary: "#FDE68A",
    textMuted: "#92711A",
    accent: "#D4A017",
    accentHover: "#F59E0B",
    dotColor: "#FCD34D",
  },
  crise: {
    id: "crise",
    label: "Crise",
    icon: "🤝",
    bgMain: "#0A0A0A",
    bgHeader: "#050505",
    bgInput: "#050505",
    bubbleYura: "#1A1A1A",
    bubbleYuraBorder: "#F5F0E8",
    bubbleUser: "#2A2A2A",
    bubbleUserText: "#F5F0E8",
    textPrimary: "#F5F0E8",
    textSecondary: "#D4CFC7",
    textMuted: "#6B6660",
    accent: "#F5F0E8",
    accentHover: "#FFFFFF",
    dotColor: "#F5F0E8",
  },
};

export function getTheme(etat: EtatEmotionnel): ColorTheme {
  return THEMES[etat] ?? THEMES.neutre;
}
