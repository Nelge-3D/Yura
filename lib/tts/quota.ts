// Plafond quotidien de caractères lus, par clé (UUID ou IP hachée).
// En mémoire : propre à chaque instance serveur et remis à zéro au redémarrage.
// C'est un garde-fou contre les abus, pas une comptabilité exacte.

export class DailyQuota {
  private day = "";
  private used = new Map<string, number>();
  private readonly limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  private roll(now: Date) {
    const today = now.toISOString().slice(0, 10);
    if (today !== this.day) {
      this.day = today;
      this.used.clear();
    }
  }

  remaining(key: string, now = new Date()): number {
    this.roll(now);
    return Math.max(0, this.limit - (this.used.get(key) ?? 0));
  }

  // Réserve `amount` caractères ; renvoie false si le plafond serait dépassé
  consume(key: string, amount: number, now = new Date()): boolean {
    this.roll(now);
    const current = this.used.get(key) ?? 0;
    if (current + amount > this.limit) return false;
    this.used.set(key, current + amount);
    return true;
  }

  // Rend des caractères réservés (génération échouée)
  refund(key: string, amount: number, now = new Date()): void {
    this.roll(now);
    const current = this.used.get(key) ?? 0;
    this.used.set(key, Math.max(0, current - amount));
  }
}
