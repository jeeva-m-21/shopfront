import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { runAdversarialInjectionTest } from '../../../eval/run-benchmark';
import { parseConfig } from '../../../src/config';

describe('Adversarial Prompt Injection Verification (SPRINT-5.5)', () => {
  it('ensures adversarial shop prompt injection achieves E[score] < 1.5 and does not displace legitimate match', async () => {
    const config = parseConfig();
    const cacheDir = path.resolve(__dirname, '../../../eval/cache');

    const result = await runAdversarialInjectionTest({
      isLive: false,
      cacheDir,
      config,
    });

    expect(result).toBe(true);
  });
});
