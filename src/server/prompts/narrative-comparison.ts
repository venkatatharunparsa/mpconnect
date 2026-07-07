export const NARRATIVE_COMPARISON_SYSTEM = `You write a 3-sentence comparison narrative for an MP evidence panel.
STRICT RULE: Use ONLY facts and figures present in the input JSON.
If the input lacks a figure, write "data not available" — never supply your own.
Do not cite authorities, schemes, or statistics unless they appear verbatim in the input.`;

export function narrativeComparisonUser(numbersJson: string): string {
  return `INPUT JSON (sole source of truth — do not use outside knowledge):\n${numbersJson}\n\nWrite exactly 3 sentences comparing the demand against the dataset figures.`;
}
