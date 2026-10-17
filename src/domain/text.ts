/**
 * Pure domain text processing utilities per PRD Section 7.7 and Architecture Section 4.1.
 * Zero database, network, or framework dependencies.
 */

/**
 * Strips ASCII control characters, replaces newlines/tabs with spaces,
 * collapses whitespace runs, trims, and truncates to maxLen.
 */
export function cleanInputText(raw: string, maxLen: number): string {
  if (!raw) return '';
  const stripped = raw
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.slice(0, maxLen);
}

/**
 * Lowercases, strips control characters, strips whole-phrase matches of "near me",
 * collapses whitespace, and trims.
 */
export function normalizeSearchQuery(raw?: string): string {
  if (!raw) return '';
  const cleaned = raw
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\bnear\s+me\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return cleaned;
}
