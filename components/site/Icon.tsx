// Icônes au trait de YURA (remplacent les émojis)
const ICONS = {
  leaf: "M5 19c0-8 5-14 14-14 0 9-6 14-14 14Zm0 0 7-7",
  shield: "M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z",
  mic: "M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-6 8a6 6 0 0 0 12 0M12 17v4",
  chat: "M4 5h16v11H9l-5 4V5Z",
  heart: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 5-5 2 2-5 5-2Z",
  people: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 9a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6m2 9a6 6 0 0 0-3-5",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  video: "M3 7h12v10H3V7Zm12 4 6-3v8l-6-3",
  check: "M5 12l5 5 9-10",
  home: "M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z",
} as const;

export type IconName = keyof typeof ICONS;

export default function Icon({ name, size = 22, color = "currentColor" }: { name: IconName; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={ICONS[name]} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
