import { describe, it, expect, vi } from 'vitest';
import { logger } from '@/logger';

describe('Structured JSON Logger (src/logger.ts)', () => {
  it('outputs structured JSON with level, time, route, and message', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    logger.info({ route: '/api/health', duration: 15 }, 'Health check passed');

    expect(logSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(logSpy.mock.calls[0]?.[0] as string);
    expect(parsed.level).toBe('info');
    expect(parsed.route).toBe('/api/health');
    expect(parsed.duration).toBe(15);
    expect(parsed.message).toBe('Health check passed');
    expect(parsed.time).toBeDefined();

    logSpy.mockRestore();
  });

  it('redacts sensitive keys like password, token, authorization, and secret', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    logger.info({
      route: '/login',
      username: 'admin',
      password: 'supersecretpassword',
      session_token: 'raw-token-abc',
      authorization: 'Bearer 12345',
      nested: {
        api_key: 'secret-key',
        safe_data: 'visible',
      },
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(logSpy.mock.calls[0]?.[0] as string);
    expect(parsed.username).toBe('admin');
    expect(parsed.password).toBe('[REDACTED]');
    expect(parsed.session_token).toBe('[REDACTED]');
    expect(parsed.authorization).toBe('[REDACTED]');
    expect(parsed.nested.api_key).toBe('[REDACTED]');
    expect(parsed.nested.safe_data).toBe('visible');

    logSpy.mockRestore();
  });

  it('routes error level to console.error and warn level to console.warn', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logger.error({ error_code: 'db_fail' }, 'DB connection down');
    expect(errorSpy).toHaveBeenCalledTimes(1);

    logger.warn({ error_code: 'slow_query' }, 'Query took > 500ms');
    expect(warnSpy).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
