/**
 * Pure domain localities resolution per PRD Section 7.5, 7.8 and Architecture Section 4.2.
 * Zero database, network, or framework dependencies.
 */

export interface Locality {
  id: number;
  name: string;
  aliases: string[];
  lat: number;
  lng: number;
}

export type LocalityResolveResult =
  | { success: true; locality: Locality }
  | { success: false; error: 'locality_not_found'; suggestions: string[] };

export const CHENNAI_LOCALITIES: Locality[] = [
  { id: 1, name: 'Adyar', aliases: ['Adayar'], lat: 13.0012, lng: 80.2565 },
  { id: 2, name: 'Alwarpet', aliases: [], lat: 13.0335, lng: 80.2520 },
  { id: 3, name: 'Ambattur', aliases: [], lat: 13.1143, lng: 80.1548 },
  { id: 4, name: 'Anna Nagar', aliases: ['Annanagar'], lat: 13.0850, lng: 80.2101 },
  { id: 5, name: 'Ashok Nagar', aliases: ['Ashoknagar'], lat: 13.0373, lng: 80.2123 },
  { id: 6, name: 'Avadi', aliases: [], lat: 13.1147, lng: 80.1008 },
  { id: 7, name: 'Besant Nagar', aliases: ['Besantnagar'], lat: 12.9994, lng: 80.2708 },
  { id: 8, name: 'Chromepet', aliases: ['Chrompet'], lat: 12.9517, lng: 80.1462 },
  { id: 9, name: 'Egmore', aliases: [], lat: 13.0732, lng: 80.2609 },
  { id: 10, name: 'Guindy', aliases: [], lat: 13.0067, lng: 80.2025 },
  { id: 11, name: 'K.K. Nagar', aliases: ['KK Nagar', 'K. K. Nagar', 'Kalaignar Karunanidhi Nagar'], lat: 13.0410, lng: 80.1994 },
  { id: 12, name: 'Kilpauk', aliases: [], lat: 13.0827, lng: 80.2437 },
  { id: 13, name: 'Kodambakkam', aliases: [], lat: 13.0524, lng: 80.2255 },
  { id: 14, name: 'Mandaveli', aliases: [], lat: 13.0245, lng: 80.2610 },
  { id: 15, name: 'Medavakkam', aliases: [], lat: 12.9171, lng: 80.1923 },
  { id: 16, name: 'Mylapore', aliases: [], lat: 13.0368, lng: 80.2676 },
  { id: 17, name: 'Nungambakkam', aliases: [], lat: 13.0604, lng: 80.2405 },
  { id: 18, name: 'Pallavaram', aliases: [], lat: 12.9675, lng: 80.1491 },
  { id: 19, name: 'Perambur', aliases: [], lat: 13.1075, lng: 80.2434 },
  { id: 20, name: 'Perungudi', aliases: [], lat: 12.9654, lng: 80.2461 },
  { id: 21, name: 'Poonamallee', aliases: ['Poonamalle'], lat: 13.0474, lng: 80.0945 },
  { id: 22, name: 'Porur', aliases: [], lat: 13.0382, lng: 80.1565 },
  { id: 23, name: 'Royapettah', aliases: [], lat: 13.0538, lng: 80.2642 },
  { id: 24, name: 'Saidapet', aliases: [], lat: 13.0213, lng: 80.2231 },
  { id: 25, name: 'Sholinganallur', aliases: ['OMR', 'Old Mahabalipuram Road'], lat: 12.9010, lng: 80.2279 },
  { id: 26, name: 'T. Nagar', aliases: ['T Nagar', 'Thyagaraya Nagar', 'T.Nagar'], lat: 13.0418, lng: 80.2341 },
  { id: 27, name: 'Tambaram', aliases: [], lat: 12.9249, lng: 80.1278 },
  { id: 28, name: 'Teynampet', aliases: [], lat: 13.0405, lng: 80.2505 },
  { id: 29, name: 'Thiruvanmiyur', aliases: ['Tiruvanmiyur'], lat: 12.9830, lng: 80.2594 },
  { id: 30, name: 'Vadapalani', aliases: [], lat: 13.0500, lng: 80.2121 },
  { id: 31, name: 'Velachery', aliases: ['Velacheri'], lat: 12.9815, lng: 80.2180 },
  { id: 32, name: 'West Mambalam', aliases: ['Mambalam'], lat: 13.0362, lng: 80.2235 },
];

/**
 * Normalizes input string by lowercasing and stripping non-alphanumeric characters.
 */
export function normalizeLocalityString(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Computes 3-gram multiset similarity matching PostgreSQL pg_trgm padding:
 * Two leading spaces, one trailing space.
 */
function getTrigrams(str: string): Set<string> {
  const padded = `  ${str} `;
  const trigrams = new Set<string>();
  for (let i = 0; i <= padded.length - 3; i++) {
    trigrams.add(padded.slice(i, i + 3));
  }
  return trigrams;
}

export function computeTrigramSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;
  const triA = getTrigrams(a);
  const triB = getTrigrams(b);
  let intersection = 0;
  for (const t of triA) {
    if (triB.has(t)) {
      intersection++;
    }
  }
  const union = triA.size + triB.size - intersection;
  return union === 0 ? 0.0 : intersection / union;
}

/**
 * Resolves a locality name or alias to a canonical Chennai Locality.
 */
export function resolveLocality(
  input: string,
  localities: Locality[] = CHENNAI_LOCALITIES
): LocalityResolveResult {
  const normalized = normalizeLocalityString(input);
  if (!normalized) {
    return {
      success: false,
      error: 'locality_not_found',
      suggestions: localities.slice(0, 3).map((l) => l.name),
    };
  }

  // 1. Exact match on normalized canonical name or aliases
  for (const loc of localities) {
    if (normalizeLocalityString(loc.name) === normalized) {
      return { success: true, locality: loc };
    }
    for (const alias of loc.aliases) {
      if (normalizeLocalityString(alias) === normalized) {
        return { success: true, locality: loc };
      }
    }
  }

  // 2. Trigram similarity against names and aliases
  const scored = localities.map((loc) => {
    const candidates = [loc.name, ...loc.aliases].map(normalizeLocalityString);
    const maxScore = Math.max(...candidates.map((c) => computeTrigramSimilarity(c, normalized)));
    return { locality: loc, score: maxScore };
  });

  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  const secondBest = scored[1];

  if (best && best.score >= 0.6) {
    const separation = secondBest ? best.score - secondBest.score : 1.0;
    if (separation >= 0.1) {
      return { success: true, locality: best.locality };
    }
  }

  // Fallback: top 3 closest suggestions
  const suggestions = scored.slice(0, 3).map((s) => s.locality.name);
  return {
    success: false,
    error: 'locality_not_found',
    suggestions,
  };
}
