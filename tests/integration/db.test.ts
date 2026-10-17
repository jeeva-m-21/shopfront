import { describe, it, expect, afterAll } from 'vitest';
import { query, withTransaction, withStatementTimeout, closePool } from '@/db';

describe('Database Pool & Transaction Utilities (Integration)', () => {
  afterAll(async () => {
    await closePool();
  });

  it('executes simple parameterized queries', async () => {
    const res = await query<{ val: number }>('SELECT $1::int AS val;', [42]);
    expect(res.rows[0]?.val).toBe(42);
  });

  it('commits transactions on success', async () => {
    const testUsername = `user_${Date.now()}`;
    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO users (username, display_name, role, password_hash)
         VALUES ($1, $2, 'admin', 'dummy_hash');`,
        [testUsername, 'Test User']
      );
    });

    const check = await query('SELECT username FROM users WHERE username = $1;', [testUsername]);
    expect(check.rows.length).toBe(1);

    // Clean up
    await query('DELETE FROM users WHERE username = $1;', [testUsername]);
  });

  it('rolls back transactions on error', async () => {
    const testUsername = `user_fail_${Date.now()}`;

    await expect(
      withTransaction(async (client) => {
        await client.query(
          `INSERT INTO users (username, display_name, role, password_hash)
           VALUES ($1, $2, 'admin', 'dummy_hash');`,
          [testUsername, 'Test Fail User']
        );
        throw new Error('Simulated transaction failure');
      })
    ).rejects.toThrow('Simulated transaction failure');

    const check = await query('SELECT username FROM users WHERE username = $1;', [testUsername]);
    expect(check.rows.length).toBe(0);
  });

  it('enforces statement timeout via withStatementTimeout', async () => {
    // 100ms timeout on pg_sleep(0.4)
    await expect(
      withStatementTimeout(100, async (client) => {
        await client.query('SELECT pg_sleep(0.4);');
      })
    ).rejects.toThrow(/statement timeout|canceling statement/i);
  });
});
