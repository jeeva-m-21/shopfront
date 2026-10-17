import fs from 'fs';
import { closePool } from '../src/db.js';
import { resetAdminPassword } from '../src/auth/admin-ops.js';
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
  let newPassword = parseArg('--password');

  if (!username) {
    console.error('Error: --username is required.');
    console.error('Usage: npm run reset-admin-password -- --username <username> [--password <newPassword>]');
    process.exit(1);
  }

  if (!newPassword) {
    newPassword = await promptHidden(`Enter new password for admin user '${username}': `);
    const confirmPassword = await promptHidden('Confirm new password: ');
    if (newPassword !== confirmPassword) {
      console.error('Error: Passwords do not match.');
      process.exit(1);
    }
  }

  try {
    await resetAdminPassword({
      username,
      newPassword,
    });
    console.log(`[reset-admin-password] Password for admin '${username}' reset successfully. All active sessions invalidated.`);
  } catch (error) {
    console.error('[reset-admin-password] Failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

void main();
