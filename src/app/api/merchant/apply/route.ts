import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '../../../../db.js';
import { resolveLocality } from '../../../../domain/localities.js';

const merchantApplySchema = z.object({
  business_name: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(80, 'Business name cannot exceed 80 characters'),
  category: z.enum(['repair_service', 'salon_wellness', 'food_beverage'], {
    errorMap: () => ({ message: 'Please select a valid business category' }),
  }),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description cannot exceed 500 characters'),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address cannot exceed 200 characters'),
  locality_name: z.string().min(1, 'Please select a Chennai locality'),
  phone: z
    .string()
    .regex(/^\+91\d{10}$/, 'Phone must be in +91XXXXXXXXXX format (10 digits after +91)'),
  whatsapp: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, 'WhatsApp number must be a valid Indian mobile (+91[6-9]XXXXXXXXX)'),
  owner_name: z
    .string()
    .min(2, 'Owner name must be at least 2 characters')
    .max(80, 'Owner name cannot exceed 80 characters'),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm ownership and consent to be listed' }),
  }),
});

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 45);
  return `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = merchantApplySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'invalid_input',
            message: parsed.error.errors[0]?.message || 'Invalid application data',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const {
      business_name,
      category,
      description,
      address,
      locality_name,
      phone,
      whatsapp,
      owner_name,
    } = parsed.data;

    // 1. Resolve locality and center point
    const localityResolution = resolveLocality(locality_name);
    if (!localityResolution.success) {
      return NextResponse.json(
        {
          error: {
            code: 'locality_not_found',
            message: `Locality '${locality_name}' is not one of the 32 supported Chennai localities.`,
          },
        },
        { status: 400 }
      );
    }

    const loc = localityResolution.locality;
    const localityId = loc.id;
    const lat = loc.lat;
    const lng = loc.lng;

    // 2. Check if a shop with this exact phone already exists
    const existingRes = await query<{ id: string; name: string }>(
      'SELECT id, name FROM shops WHERE phone = $1 OR whatsapp = $2 LIMIT 1',
      [phone, whatsapp]
    );

    if (existingRes.rows.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: 'already_registered',
            message: 'A business with this phone or WhatsApp number is already registered.',
          },
        },
        { status: 409 }
      );
    }

    // 3. Generate unique slug
    const slug = slugify(business_name);

    // 4. Insert shop in draft status
    const insertRes = await query<{ id: string }>(
      `INSERT INTO shops (
        slug,
        name,
        category,
        description,
        address,
        locality_id,
        location,
        phone,
        whatsapp,
        action_mode,
        is_sample_data,
        data_source_note,
        status,
        admin_locked,
        hours_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography,
        $9, $10, 'whatsapp', FALSE, $11, 'draft', FALSE, 'unknown'
      ) RETURNING id`,
      [
        slug,
        business_name,
        category,
        description,
        address,
        localityId,
        lng,
        lat,
        phone,
        whatsapp,
        `Self-serve application submitted by ${owner_name}`,
      ]
    );

    const newShopId = insertRes.rows[0]!.id;

    // 5. Record audit log
    await query(
      `INSERT INTO audit_log (
        actor_id,
        actor_username,
        action,
        entity_type,
        entity_id,
        before_data,
        after_data
      ) VALUES (
        NULL,
        'system',
        'merchant.apply',
        'shop',
        $1,
        NULL,
        $2::jsonb
      )`,
      [
        newShopId,
        JSON.stringify({
          business_name,
          owner_name,
          phone,
          locality: loc.name,
          slug,
        }),
      ]
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          shop_id: newShopId,
          slug,
          message:
            'Application received! The Shopfront onboarding team will verify your business and send your owner portal credentials via WhatsApp within 24 hours.',
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('[MerchantApply] API Error:', err);
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message: 'An unexpected error occurred while submitting your application.',
        },
      },
      { status: 500 }
    );
  }
}
