import { describe, it, expect } from 'vitest';
import { parseConfig, SERVICE_AREA } from '@/config';

describe('Config & Environment Module', () => {
  const minimalValidEnv = {
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/shopfront',
    APP_BASE_URL: 'http://localhost:3000',
  };

  it('parses minimal valid configuration with sensible defaults', () => {
    const config = parseConfig(minimalValidEnv);

    expect(config.DATABASE_URL).toBe('postgresql://postgres:postgres@localhost:5432/shopfront');
    expect(config.APP_BASE_URL).toBe('http://localhost:3000');
    expect(config.NODE_ENV).toBe('development');
    expect(config.SHOW_SAMPLE_DATA).toBe(false);
    expect(config.RERANK_ENABLED).toBe(false);
    expect(config.JEV_TIMEOUT_MS).toBe(450);
    expect(config.TOTAL_BUDGET_MS).toBe(700);
    expect(config.STAGE1_TIMEOUT_MS).toBe(250);
    expect(config.ITEM_MATCH_THRESHOLD).toBe(0.15);
    expect(config.CANDIDATE_POOL_SIZE).toBe(200);
    expect(config.CANDIDATE_COUNT).toBe(10);
    expect(config.PUBLIC_RATE_LIMIT_PER_MIN).toBe(60);
    expect(config.TRUST_PROXY).toBe(false);
    expect(config.LOG_RETENTION_DAYS).toBe(90);
    expect(config.JEV_MODEL).toBe('jev-1.13-20260917');
  });

  it('correctly parses custom overrides for boolean and numeric values', () => {
    const config = parseConfig({
      ...minimalValidEnv,
      NODE_ENV: 'production',
      SHOW_SAMPLE_DATA: 'true',
      RERANK_ENABLED: 'true',
      JEV_API_KEY: 'test-key',
      JEV_TIMEOUT_MS: '400',
      TOTAL_BUDGET_MS: '650',
      PUBLIC_RATE_LIMIT_PER_MIN: '120',
      TRUST_PROXY: 'true',
    });

    expect(config.NODE_ENV).toBe('production');
    expect(config.SHOW_SAMPLE_DATA).toBe(true);
    expect(config.RERANK_ENABLED).toBe(true);
    expect(config.JEV_API_KEY).toBe('test-key');
    expect(config.JEV_TIMEOUT_MS).toBe(400);
    expect(config.TOTAL_BUDGET_MS).toBe(650);
    expect(config.PUBLIC_RATE_LIMIT_PER_MIN).toBe(120);
    expect(config.TRUST_PROXY).toBe(true);
  });

  it('fails with descriptive error when DATABASE_URL is missing', () => {
    expect(() => parseConfig({ APP_BASE_URL: 'http://localhost:3000' })).toThrow(/DATABASE_URL/);
  });

  it('fails with descriptive error when APP_BASE_URL is missing', () => {
    expect(() => parseConfig({ DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/shopfront' })).toThrow(/APP_BASE_URL/);
  });

  it('exports Chennai service area bounding box constants', () => {
    expect(SERVICE_AREA.MIN_LAT).toBe(12.75);
    expect(SERVICE_AREA.MAX_LAT).toBe(13.30);
    expect(SERVICE_AREA.MIN_LNG).toBe(79.95);
    expect(SERVICE_AREA.MAX_LNG).toBe(80.40);
  });
});
