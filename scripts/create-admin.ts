import fs from 'fs';
import { closePool } from '../src/db.js';
import { createAdminUser } from '../src/auth/admin-ops.js';
import { promptHidden } from './prompt-password.js';

if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
  try {
    process.loadEnvFile('.env');
  } catch {
    // Ignore error if already loaded
  }
}

function parseArg(flag: string): string | undefined {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;
    if (arg === flag && i + 1 < args.length) {
      return args[i + 1];
    }
    if (arg.startsWith(`${flag}=`)) {
      return arg.slice(flag.length + 1);
    }
  }
  return undefined;
}

async function main() {
  const username = parseArg('--username');
  const displayName = parseArg('--display-name') || (username ? `Admin (${username})` : 'Administrator');
  let password = parseArg('--password');

  if (!username) {
    console.error('Error: --username is required.');
    console.error('Usage: npm run create-admin -- --username <username> [--display-name <name>] [--password <password>]');
    process.exit(1);
  }

  if (!password) {
    password = await promptHidden(`Enter password for admin user '${username}': `);
    const confirmPassword = await promptHidden('Confirm password: ');
    if (password !== confirmPassword) {
      console.error('Error: Passwords do not match.');
      process.exit(1);
    }
  }

  try {
    const result = await createAdminUser({
      username,
      displayName,
      password,
    });
    console.log(`[create-admin] Admin '${result.username}' created successfully (id: ${result.id}).`);
  } catch (error) {
    console.error('[create-admin] Failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

void main();
