/**
 * Pure domain pricing calculation and Indian rupee formatting per PRD Section 7.4.
 * Zero database, network, or framework dependencies.
 */

export type PriceType = 'fixed' | 'starting_from' | 'range' | 'on_request';

export interface PriceItem {
  price_type: PriceType;
  price_inr?: number | null;
  price_max_inr?: number | null;
}

const inrFormatter = new Intl.NumberFormat('en-IN');

/**
 * Formats an integer amount with Indian digit grouping (e.g. 1,00,000).
 */
export function formatInrAmount(amount: number): string {
  return inrFormatter.format(amount);
}

/**
 * Produces standard price display string across all platforms:
 * - fixed -> ₹8,500
 * - starting_from -> From ₹499
 * - range -> ₹8,500 – ₹14,500 (with en-dash)
 * - on_request -> Price on request
 */
export function formatPriceDisplay(
  priceType: PriceType,
  priceInr?: number | null,
  priceMaxInr?: number | null
): string {
  switch (priceType) {
    case 'fixed':
      return `₹${formatInrAmount(priceInr ?? 0)}`;
    case 'starting_from':
      return `From ₹${formatInrAmount(priceInr ?? 0)}`;
    case 'range':
      return `₹${formatInrAmount(priceInr ?? 0)} – ₹${formatInrAmount(priceMaxInr ?? priceInr ?? 0)}`;
    case 'on_request':
      return 'Price on request';
  }
}

/**
 * Computes [min, max] over matching items having numeric prices.
 * Returns null if no items have numeric prices.
 */
export function computePriceRange(items: PriceItem[]): [number, number] | null {
  const numericItems = items.filter(
    (item) => item.price_type !== 'on_request' && item.price_inr != null
  );

  if (numericItems.length === 0) {
    return null;
  }

  let min = Infinity;
  let max = -Infinity;

  for (const item of numericItems) {
    const pMin = item.price_inr!;
    const pMax = item.price_max_inr ?? pMin;
    if (pMin < min) min = pMin;
    if (pMax > max) max = pMax;
  }

  if (min === Infinity || max === -Infinity) {
    return null;
  }

  return [min, max];
}

/**
 * Checks whether an item satisfies a max price ceiling.
 * Rule: on_request items never satisfy a price ceiling (PRD Section 7.4).
 */
export function satisfiesPriceCeiling(
  item: PriceItem,
  maxPriceInr: number
): boolean {
  if (item.price_type === 'on_request' || item.price_inr == null) {
    return false;
  }
  return item.price_inr <= maxPriceInr;
}
