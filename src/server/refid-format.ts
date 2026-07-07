/** Client-safe ref ID format check (no DB import). */
export function isValidRefIdFormat(refId: string): boolean {
  return /^VZG-\d{4}-\d{5}$/.test(refId);
}
