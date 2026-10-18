import { z } from 'zod';

if (!process.env.DATABASE_URL && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env');
  } catch {
    // Ignore if .env is not present in deployment environments
  }
}

const booleanPreprocessor = (val: unknown) => {
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    if (lower === 'true' || lower === '1') return true;
    if (lower === 'false' || lower === '0' || lower === '') return false;
  }
  return Boolean(val);
};

export const configSchema = z.object({
  // Required
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  APP_BASE_URL: z.string().url('APP_BASE_URL must be a valid URL'),

  // Runtime & Visibility
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SHOW_SAMPLE_DATA: z.preprocess(booleanPreprocessor, z.boolean()).default(false),

  // Stage 2 Reranker (Jev Decisions API)
  RERANK_ENABLED: z.preprocess(booleanPreprocessor, z.boolean()).default(false),
  JEV_API_BASE_URL: z.string().default('https://api.typesafe.ai/v1/decisions'),
  JEV_API_KEY: z.string().optional(),
  JEV_MODEL: z.string().default('jev-1.13-20260917'),

  // Budgets & Thresholds
  JEV_TIMEOUT_MS: z.coerce.number().int().positive().default(450),
  TOTAL_BUDGET_MS: z.coerce.number().int().positive().default(700),
  STAGE1_TIMEOUT_MS: z.coerce.number().int().positive().default(250),
  ITEM_MATCH_THRESHOLD: z.coerce.number().positive().default(0.15),
  CANDIDATE_POOL_SIZE: z.coerce.number().int().positive().default(200),
  CANDIDATE_COUNT: z.coerce.number().int().positive().default(10),

  // Rate Limiting & Operations
  PUBLIC_RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(60),
  TRUST_PROXY: z.preprocess(booleanPreprocessor, z.boolean()).default(false),
  LOG_RETENTION_DAYS: z.coerce.number().int().positive().default(90),
});

export type Config = z.infer<typeof configSchema>;

export function parseConfig(env: Record<string, unknown> = process.env): Config {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    throw new Error(`[Configuration Error] Invalid environment configuration:\n${errorDetails}`);
  }
  return result.data;
}

// Bounding box for Chennai service area per PRD Section 7.6
export const SERVICE_AREA = {
  MIN_LAT: 12.75,
  MAX_LAT: 13.30,
  MIN_LNG: 79.95,
  MAX_LNG: 80.40,
} as const;

/**
 * Checks whether coordinates fall inside the Chennai service area bounding box.
 */
export function isInServiceArea(lat: number, lng: number): boolean {
  return (
    lat >= SERVICE_AREA.MIN_LAT &&
    lat <= SERVICE_AREA.MAX_LAT &&
    lng >= SERVICE_AREA.MIN_LNG &&
    lng <= SERVICE_AREA.MAX_LNG
  );
}

// Lazy singleton config getter for runtime access
let cachedConfig: Config | null = null;
export function getConfig(): Config {
  if (!cachedConfig) {
    cachedConfig = parseConfig(process.env);
  }
  return cachedConfig;
}
