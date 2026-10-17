/**
 * Pure domain action-links and enquiry message generator per PRD Section 11.5 and Architecture Section 4.5.
 * Zero database, network, or framework dependencies.
 */

export type ActionMode = 'whatsapp' | 'external_url' | 'phone_only';
export type ShopCategory = 'repair_service' | 'salon_wellness' | 'food_beverage';

export interface ActionLinkShop {
  name: string;
  category: ShopCategory;
  phone: string;
  whatsapp?: string | null;
  booking_url?: string | null;
  action_mode: ActionMode;
}

export interface ActionLinkItem {
  name: string;
  price_display: string;
}

export interface ActionLinkInput {
  shop: ActionLinkShop;
  item?: ActionLinkItem | null;
  preferred_time?: string | null;
  customer_note?: string | null;
}

export interface ActionLinkResult {
  action_mode: ActionMode;
  url: string;
  message: string;
  disclaimer: string;
}

const STATIC_DISCLAIMER =
  'Opens direct enquiry with the business; not an automatic confirmed booking.';

function sanitizeField(raw: string | undefined | null, maxLen: number): string {
  if (!raw) return '';
  return raw
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

/**
 * Builds standard customer enquiry message and URL for WhatsApp, external URL, or phone call.
 */
export function generateActionLink(input: ActionLinkInput): ActionLinkResult {
  const { shop, item } = input;
  const preferredTime = sanitizeField(input.preferred_time, 80);
  const customerNote = sanitizeField(input.customer_note, 160);

  // 1. Base message template selection
  let baseMessage: string;
  if (!item) {
    baseMessage = `Hi ${shop.name}, I found you on Shopfront and would like to enquire about your services.`;
  } else {
    const itemSummary = `"${item.name}" (${item.price_display})`;
    switch (shop.category) {
      case 'repair_service':
        baseMessage = `Hi ${shop.name}, I'm enquiring about ${itemSummary} for repair/estimate.`;
        break;
      case 'salon_wellness':
        baseMessage = `Hi ${shop.name}, I'd like to check appointment availability for ${itemSummary}.`;
        break;
      case 'food_beverage':
        baseMessage = `Hi ${shop.name}, I'd like to enquire about ordering ${itemSummary}.`;
        break;
    }
  }

  // 2. Suffixes in exact order: Preferred time -> Note -> (via Shopfront)
  let fullMessage = baseMessage;
  if (preferredTime) {
    fullMessage += ` Preferred time: ${preferredTime}.`;
  }
  if (customerNote) {
    fullMessage += ` Note: ${customerNote}`;
  }
  fullMessage += ' (via Shopfront)';

  // 3. Action URL construction
  let url = '';
  switch (shop.action_mode) {
    case 'whatsapp': {
      const cleanPhone = (shop.whatsapp || shop.phone)
        .replace(/\+/g, '')
        .replace(/[^0-9]/g, '');
      url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullMessage)}`;
      break;
    }
    case 'external_url': {
      url = shop.booking_url || '';
      break;
    }
    case 'phone_only': {
      url = `tel:${shop.phone}`;
      break;
    }
  }

  return {
    action_mode: shop.action_mode,
    url,
    message: fullMessage,
    disclaimer: STATIC_DISCLAIMER,
  };
}
