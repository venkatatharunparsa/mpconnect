/** In-memory LRU dedupe for Telegram update_id (demo — stateless handler). */
const SEEN = new Map<number, number>();
const MAX = 500;
const PROMPTED_VERIFICATIONS = new Set<string>();

export function isDuplicateUpdate(updateId: number): boolean {
  if (SEEN.has(updateId)) return true;
  SEEN.set(updateId, Date.now());
  if (SEEN.size > MAX) {
    const oldest = SEEN.keys().next().value;
    if (oldest != null) SEEN.delete(oldest);
  }
  return false;
}

export function wasVerificationPrompted(chatId: number, verificationId: number): boolean {
  return PROMPTED_VERIFICATIONS.has(`${chatId}:${verificationId}`);
}

export function markVerificationPrompted(chatId: number, verificationId: number): void {
  PROMPTED_VERIFICATIONS.add(`${chatId}:${verificationId}`);
}

export function apiBase(): string {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function telegramCitizenKey(chatId: number): string {
  return `telegram:${chatId}`;
}

const SAFETY =
  "Safety notice: Officials carry ID. Never pay unofficial fees.\n\nSend your problem as text, voice, or photo — Telugu or English.";

export { SAFETY as TELEGRAM_SAFETY_NOTICE };
