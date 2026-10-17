import { query, withTransaction } from '../db.js';
import { logAudit } from '../audit.js';
import { getOwnerShop, type OwnerShopRecord } from './shop-ops.js';
import { validateIntervals, getIstParts, type ShopHourInterval } from '../domain/hours.js';

export class ClosureNotFoundError extends Error {
  readonly status = 404;
  constructor(message = 'Closure not found') {
    super(message);
    this.name = 'ClosureNotFoundError';
  }
}

export interface ShopClosureRecord {
  id: string;
  shop_id: string;
  closed_on: string; // YYYY-MM-DD
  reason: string | null;
}

export interface OwnerHoursAndClosuresData {
  shop: OwnerShopRecord;
  intervals: ShopHourInterval[];
  closures: ShopClosureRecord[];
}

export interface SaveOwnerWeeklyHoursParams {
  ownerId: string;
  intervals: ShopHourInterval[];
  actor: { id: string; username: string };
}

export interface AddOwnerClosureParams {
  ownerId: string;
  closed_on: string;
  reason?: string | null;
  actor: { id: string; username: string };
}

export interface RemoveOwnerClosureParams {
  ownerId: string;
  closureId: string;
  actor: { id: string; username: string };
}

function normalizeTime(timeStr: string): string {
  // If "09:00:00", return "09:00"
  return timeStr.slice(0, 5);
}

function formatDateString(dateVal: Date | string): string {
  if (typeof dateVal === 'string') {
    return dateVal.slice(0, 10);
  }
  const year = dateVal.getFullYear();
  const month = String(dateVal.getMonth() + 1).padStart(2, '0');
  const day = String(dateVal.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getOwnerHoursAndClosures(ownerId: string): Promise<OwnerHoursAndClosuresData> {
  const shop = await getOwnerShop(ownerId);

  // Fetch intervals
  const intervalsRes = await query<{
    id: string;
    shop_id: string;
    weekday: number;
    open_time: string;
    close_time: string;
  }>(
    `SELECT id, shop_id, weekday, open_time, close_time
     FROM shop_hours
     WHERE shop_id = $1
     ORDER BY weekday ASC, open_time ASC;`,
    [shop.id]
  );

  const intervals: ShopHourInterval[] = intervalsRes.rows.map((row) => ({
    weekday: Number(row.weekday),
    open_time: normalizeTime(row.open_time),
    close_time: normalizeTime(row.close_time),
  }));

  // Fetch upcoming closures (today or later)
  const closuresRes = await query<{
    id: string;
    shop_id: string;
    closed_on: string | Date;
    reason: string | null;
  }>(
    `SELECT id, shop_id, closed_on, reason
     FROM shop_closures
     WHERE shop_id = $1 AND closed_on >= CURRENT_DATE
     ORDER BY closed_on ASC;`,
    [shop.id]
  );

  const closures: ShopClosureRecord[] = closuresRes.rows.map((row) => ({
    id: row.id,
    shop_id: row.shop_id,
    closed_on: formatDateString(row.closed_on),
    reason: row.reason,
  }));

  return {
    shop,
    intervals,
    closures,
  };
}

export async function saveOwnerWeeklyHours(params: SaveOwnerWeeklyHoursParams): Promise<void> {
  const shop = await getOwnerShop(params.ownerId);

  // Normalize intervals
  const normalizedIntervals = params.intervals.map((i) => ({
    weekday: i.weekday,
    open_time: normalizeTime(i.open_time),
    close_time: normalizeTime(i.close_time),
  }));

  // Validate intervals
  const validation = validateIntervals(normalizedIntervals);
  if (!validation.valid) {
    throw new Error(validation.error ?? 'Invalid intervals');
  }

  await withTransaction(async (client) => {
    // Delete existing intervals
    await client.query(`DELETE FROM shop_hours WHERE shop_id = $1;`, [shop.id]);

    // Insert new intervals
    for (const interval of normalizedIntervals) {
      await client.query(
        `INSERT INTO shop_hours (shop_id, weekday, open_time, close_time)
         VALUES ($1, $2, $3, $4);`,
        [shop.id, interval.weekday, interval.open_time, interval.close_time]
      );
    }

    // Set hours_status to 'set'
    await client.query(
      `UPDATE shops SET hours_status = 'set', updated_at = now() WHERE id = $1;`,
      [shop.id]
    );
  });

  await logAudit({
    actorId: params.actor.id,
    actorUsername: params.actor.username,
    action: 'shop.hours_update',
    entityType: 'shop',
    entityId: shop.id,
    afterData: {
      hours_count: normalizedIntervals.length,
      hours_status: 'set',
    },
  });
}

export async function addOwnerClosure(params: AddOwnerClosureParams): Promise<ShopClosureRecord> {
  const shop = await getOwnerShop(params.ownerId);

  const closedOn = params.closed_on.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(closedOn)) {
    throw new Error(`Invalid closure date '${closedOn}'. Expected format YYYY-MM-DD.`);
  }

  const todayStr = getIstParts(new Date()).dateStr;
  if (closedOn < todayStr) {
    throw new Error('Closure date cannot be in the past.');
  }

  const reason = params.reason ? params.reason.trim() : null;
  if (reason && reason.length > 100) {
    throw new Error('Reason must be at most 100 characters.');
  }

  const result = await query<{
    id: string;
    shop_id: string;
    closed_on: string | Date;
    reason: string | null;
  }>(
    `INSERT INTO shop_closures (shop_id, closed_on, reason)
     VALUES ($1, $2, $3)
     ON CONFLICT (shop_id, closed_on)
     DO UPDATE SET reason = EXCLUDED.reason
     RETURNING id, shop_id, closed_on, reason;`,
    [shop.id, closedOn, reason]
  );

  const row = result.rows[0]!;
  const closure: ShopClosureRecord = {
    id: row.id,
    shop_id: row.shop_id,
    closed_on: formatDateString(row.closed_on),
    reason: row.reason,
  };

  await logAudit({
    actorId: params.actor.id,
    actorUsername: params.actor.username,
    action: 'shop.closure_add',
    entityType: 'shop_closure',
    entityId: closure.id,
    afterData: {
      closed_on: closure.closed_on,
      reason: closure.reason,
    },
  });

  return closure;
}

export async function removeOwnerClosure(params: RemoveOwnerClosureParams): Promise<void> {
  const shop = await getOwnerShop(params.ownerId);

  const existing = await query<{ id: string; closed_on: string | Date }>(
    `SELECT id, closed_on FROM shop_closures WHERE id = $1 AND shop_id = $2;`,
    [params.closureId, shop.id]
  );

  const row = existing.rows[0];
  if (!row) {
    throw new ClosureNotFoundError();
  }

  await query(`DELETE FROM shop_closures WHERE id = $1 AND shop_id = $2;`, [params.closureId, shop.id]);

  await logAudit({
    actorId: params.actor.id,
    actorUsername: params.actor.username,
    action: 'shop.closure_remove',
    entityType: 'shop_closure',
    entityId: row.id,
    beforeData: {
      closed_on: formatDateString(row.closed_on),
    },
  });
}
