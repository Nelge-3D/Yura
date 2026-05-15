import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Plus_Jakarta_Sans } from "next/font/google";
import SwRegister from "@/components/SwRegister";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600"],
});

const serif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "YURA — L'IA à l'écoute",
  description:
    "IA conversationnelle à but thérapeutique, nourrie de la culture gabonaise. Un pont entre toi et les professionnels de santé mentale.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "YURA",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#2D6A4F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${serif.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/yura-icon.svg" />
      </head>
      <body className="font-sans antialiased">
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
