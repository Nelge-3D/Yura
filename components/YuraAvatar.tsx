"use client";

interface YuraAvatarProps {
  size?: number;
  animate?: boolean;
}

export default function YuraAvatar({ size = 48, animate = true }: YuraAvatarProps) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-full flex-shrink-0 ${animate ? "animate-spin-slow" : ""}`}
      style={{
        width: size,
        height: size,
        background: "conic-gradient(from 0deg, #2d5a27, #7fb89a, #c9935a, #4a7c59, #2d5a27)",
      }}
    >
      <div
        className="flex items-center justify-center rounded-full bg-[#1a2e1a]"
        style={{ width: size * 0.78, height: size * 0.78 }}
      >
        <span
          className="font-serif text-[#7fb89a] font-medium leading-none"
          style={{ fontSize: size * 0.3 }}
        >
          Yu
        </span>
      </div>
    </div>
  );
}