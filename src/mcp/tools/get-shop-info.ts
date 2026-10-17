import { query } from '../../db.js';
import { getConfig } from '../../config.js';
import { evaluateOpenNow, formatTodayHours, formatWeeklyHours } from '../../domain/hours.js';
import type { ShopCategory } from '../../search/stage1.js';

export interface GetShopInfoInput {
  shop_slug: string;
}

export interface ShopClosure {
  date: string;
  reason: string | null;
}

export interface ShopContact {
  phone: string;
  whatsapp: string | null;
  booking_url: string | null;
  website_url: string | null;
  action_mode: 'whatsapp' | 'external_url' | 'phone_only';
  action_instructions: string | null;
}

export interface ShopInfoResult {
  slug: string;
  name: string;
  is_sample_data: boolean;
  data_source_note: string | null;
  category: ShopCategory;
  description: string;
  address: string;
  locality: string;
  lat: number;
  lng: number;
  hours_status: 'unknown' | 'set';
  open_now: boolean | null;
  today_hours: string | null;
  weekly_hours: Array<string[]> | null;
  upcoming_closures: ShopClosure[];
  menu_updated_at: string | null;
  contact: ShopContact;
}

interface RawShopRow {
  id: string;
  slug: string;
  name: string;
  category: ShopCategory;
  description: string;
  address: string;
  locality: string;
  lat: number;
  lng: number;
  hours_status: 'unknown' | 'set';
  phone: string;
  whatsapp: string | null;
  booking_url: string | null;
  website_url: string | null;
  action_mode: 'whatsapp' | 'external_url' | 'phone_only';
  action_instructions: string | null;
  is_sample_data: boolean;
  data_source_note: string | null;
  menu_updated_at: Date | string | null;
  hours_json: Array<{ weekday: number; open_time: string; close_time: string }> | null;
  closures_json: Array<{ closed_on: string; reason: string | null }> | null;
}

export async function executeGetShopInfo(
  input: GetShopInfoInput,
  now: Date = new Date()
): Promise<{ success: true; data: ShopInfoResult } | { success: false; error: { code: string; message: string } }> {
  const config = getConfig();

  const res = await query<RawShopRow>(
    `SELECT
       s.id,
       s.slug,
       s.name,
       s.category,
       s.description,
       s.address,
       l.name AS locality,
       ST_Y(s.location::geometry) AS lat,
       ST_X(s.location::geometry) AS lng,
       s.hours_status,
       s.phone,
       s.whatsapp,
       s.booking_url,
       s.website_url,
       s.action_mode,
       s.action_instructions,
       s.is_sample_data,
       s.data_source_note,
       (SELECT MAX(ci.updated_at) FROM catalog_items ci WHERE ci.shop_id = s.id AND ci.available = TRUE) AS menu_updated_at,
       COALESCE(
         (SELECT json_agg(json_build_object('weekday', sh.weekday, 'open_time', to_char(sh.open_time, 'HH24:MI'), 'close_time', to_char(sh.close_time, 'HH24:MI')))
          FROM shop_hours sh WHERE sh.shop_id = s.id),
         '[]'::json
       ) AS hours_json,
       COALESCE(
         (SELECT json_agg(json_build_object('closed_on', sc.closed_on::text, 'reason', sc.reason))
          FROM shop_closures sc WHERE sc.shop_id = s.id AND sc.closed_on >= CURRENT_DATE - 1),
         '[]'::json
       ) AS closures_json
     FROM shops s
     JOIN localities l ON l.id = s.locality_id
     WHERE s.slug = $1
       AND s.status = 'live'
       AND (s.is_sample_data = FALSE OR $2 = TRUE);`,
    [input.shop_slug, config.SHOW_SAMPLE_DATA]
  );

  const shop = res.rows[0];
  if (!shop) {
    return {
      success: false,
      error: { code: 'shop_not_found', message: 'Shop not found.' },
    };
  }

  // Next 30 days closures
  const closuresRes = await query<{ date: string; reason: string | null }>(
    `SELECT closed_on::text AS date, reason
     FROM shop_closures
     WHERE shop_id = $1 AND closed_on >= CURRENT_DATE AND closed_on <= CURRENT_DATE + 30
     ORDER BY closed_on ASC;`,
    [shop.id]
  );

  const hoursJson = Array.isArray(shop.hours_json) ? shop.hours_json : [];
  const closuresJson = Array.isArray(shop.closures_json) ? shop.closures_json : [];

  const openNow = evaluateOpenNow(shop.hours_status, hoursJson, closuresJson, now);
  const todayHours = formatTodayHours(shop.hours_status, hoursJson, closuresJson, now);
  const weeklyHours = formatWeeklyHours(shop.hours_status, hoursJson);

  return {
    success: true,
    data: {
      slug: shop.slug,
      name: shop.name,
      is_sample_data: shop.is_sample_data,
      data_source_note: shop.is_sample_data ? (shop.data_source_note ?? null) : null,
      category: shop.category,
      description: shop.description,
      address: shop.address,
      locality: shop.locality,
      lat: Number(shop.lat),
      lng: Number(shop.lng),
      hours_status: shop.hours_status,
      open_now: openNow,
      today_hours: todayHours,
      weekly_hours: weeklyHours,
      upcoming_closures: closuresRes.rows,
      menu_updated_at: shop.menu_updated_at ? new Date(shop.menu_updated_at).toISOString() : null,
      contact: {
        phone: shop.phone,
        whatsapp: shop.whatsapp ?? null,
        booking_url: shop.booking_url ?? null,
        website_url: shop.website_url ?? null,
        action_mode: shop.action_mode,
        action_instructions: shop.action_instructions ?? null,
      },
    },
  };
}
