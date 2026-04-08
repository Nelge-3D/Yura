"use client";

import { CRISIS_CONTACTS, CrisisLevel } from "@/lib/crisis";

interface AlertBannerProps {
  level: CrisisLevel;
}

export default function AlertBanner({ level }: AlertBannerProps) {
  if (level === "none") return null;

  const isCritical = level === "critical";

  return (
    <div
      className={`mx-4 mb-3 rounded-xl p-4 border text-sm transition-all ${
        isCritical
          ? "bg-red-50 border-red-200 text-red-900"
          : "bg-amber-50 border-amber-200 text-amber-900"
      }`}
    >
      {isCritical ? (
        <div className="space-y-2">
          <p className="font-semibold">
            🤝 Je suis là avec toi. Tu n'es pas seul(e).
          </p>
          <p className="text-xs leading-relaxed">
            Ce que tu vis est sérieux et mérite une aide professionnelle.
            Voici des personnes qui peuvent t'aider maintenant :
          </p>
          <div className="space-y-1 mt-2">
            <a
              href={`tel:${CRISIS_CONTACTS.gabon.phone}`}
              className="flex items-center gap-2 text-xs font-medium text-red-800 hover:underline"
            >
              📞 {CRISIS_CONTACTS.gabon.name} — {CRISIS_CONTACTS.gabon.phone}
            </a>
            
          </div>
        </div>
      ) : (
        <p>
          💛 Je remarque que tu traverses une période difficile. YURA est là pour
          écouter, et quand tu le sentiras, nous pourrions aussi parler à quelqu'un
          de qualifié ensemble.
        </p>
      )}
    </div>
  );
}