import fs from 'fs';

if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
  try {
    process.loadEnvFile('.env');
  } catch {
    // Ignore error
  }
}

// Ensure defaults for test runner
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5434/shopfront';
}
if (!process.env.APP_BASE_URL) {
  process.env.APP_BASE_URL = 'http://localhost:3000';
}
process.env.STAGE1_TIMEOUT_MS = '2000';
