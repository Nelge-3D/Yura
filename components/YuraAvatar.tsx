"use client";

interface YuraAvatarProps {
  size?: number;
  animate?: boolean;
  // Variante pour fond clair (ivoire)
  light?: boolean;
}

export default function YuraAvatar({ size = 48, animate = true, light = false }: YuraAvatarProps) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-full flex-shrink-0 ${animate ? "animate-spin-slow" : ""}`}
      style={{
        width: size,
        height: size,
        background: light
          ? "conic-gradient(from 0deg, #174C3C, #477A68, #D99A62, #174C3C)"
          : "conic-gradient(from 0deg, #2d5a27, #7fb89a, #c9935a, #4a7c59, #2d5a27)",
      }}
    >
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: size * 0.78, height: size * 0.78, background: light ? "#FAF8F3" : "#1a2e1a" }}
      >
        <span
          className="font-serif font-medium leading-none"
          style={{ fontSize: size * 0.3, color: light ? "#174C3C" : "#7fb89a" }}
        >
          Yu
        </span>
      </div>
    </div>
  );
}