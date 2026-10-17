import { query } from '../../db.js';
import { getConfig } from '../../config.js';
import {
  generateActionLink,
  type ActionMode,
  type ShopCategory,
} from '../../domain/action-links.js';
import { formatPriceDisplay, type PriceType } from '../../domain/pricing.js';

export interface GetActionLinkInput {
  shop_slug: string;
  item_id?: string;
  preferred_time?: string;
  customer_note?: string;
}

export interface GetActionLinkResult {
  shop_slug: string;
  action_mode: ActionMode;
  action_url: string;
  phone: string;
  suggested_message: string;
  item_summary: string | null;
  action_instructions: string | null;
  disclaimer: string;
}

export async function executeGetActionLink(
  input: GetActionLinkInput
): Promise<{ success: true; data: GetActionLinkResult } | { success: false; error: { code: string; message: string } }> {
  const config = getConfig();

  // 1. Resolve visible shop
  const shopRes = await query<{
    id: string;
    slug: string;
    name: string;
    category: ShopCategory;
    phone: string;
    whatsapp: string | null;
    booking_url: string | null;
    action_mode: ActionMode;
    action_instructions: string | null;
  }>(
    `SELECT
       s.id,
       s.slug,
       s.name,
       s.category,
       s.phone,
       s.whatsapp,
       s.booking_url,
       s.action_mode,
       s.action_instructions
     FROM shops s
     WHERE s.slug = $1
       AND s.status = 'live'
       AND (s.is_sample_data = FALSE OR $2 = TRUE);`,
    [input.shop_slug, config.SHOW_SAMPLE_DATA]
  );

  const shop = shopRes.rows[0];
  if (!shop) {
    return {
      success: false,
      error: { code: 'shop_not_found', message: 'Shop not found.' },
    };
  }

  // 2. Resolve item if item_id provided
  let actionItem: { name: string; price_display: string } | null = null;
  let itemSummary: string | null = null;

  if (input.item_id) {
    const itemRes = await query<{
      name: string;
      price_type: PriceType;
      price_inr: number | null;
      price_max_inr: number | null;
    }>(
      `SELECT name, price_type, price_inr, price_max_inr
       FROM catalog_items
       WHERE id = $1 AND shop_id = $2 AND available = TRUE;`,
      [input.item_id, shop.id]
    );

    const item = itemRes.rows[0];
    if (!item) {
      return {
        success: false,
        error: { code: 'item_not_found', message: 'Item not found or unavailable for this shop.' },
      };
    }

    const priceDisplay = formatPriceDisplay(item.price_type, item.price_inr, item.price_max_inr);
    actionItem = {
      name: item.name,
      price_display: priceDisplay,
    };
    itemSummary = `"${item.name}" (${priceDisplay})`;
  }

  // 3. Generate action link using pure domain function
  const linkResult = generateActionLink({
    shop: {
      name: shop.name,
      category: shop.category,
      phone: shop.phone,
      whatsapp: shop.whatsapp,
      booking_url: shop.booking_url,
      action_mode: shop.action_mode,
    },
    item: actionItem,
    preferred_time: input.preferred_time,
    customer_note: input.customer_note,
  });

  return {
    success: true,
    data: {
      shop_slug: shop.slug,
      action_mode: linkResult.action_mode,
      action_url: linkResult.url,
      phone: shop.phone,
      suggested_message: linkResult.message,
      item_summary: itemSummary,
      action_instructions: shop.action_instructions ?? null,
      disclaimer: linkResult.disclaimer,
    },
  };
}
