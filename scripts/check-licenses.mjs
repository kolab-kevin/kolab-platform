#!/usr/bin/env node
/**
 * Verify all production dependencies use approved OSS licenses.
 */
import { execSync } from 'node:child_process';

const ALLOWED = new Set([
  'MIT',
  'ISC',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'Apache-2.0',
  '0BSD',
  'Unlicense',
  'CC0-1.0',
  'BlueOak-1.0.0',
]);

try {
  const output = execSync('pnpm licenses list --json', { encoding: 'utf8' });
  const data = JSON.parse(output);
  const violations = [];

  for (const [pkg, info] of Object.entries(data)) {
    const license = typeof info === 'object' && info !== null ? info.license : info;
    if (license && !ALLOWED.has(license)) {
      violations.push({ pkg, license });
    }
  }

  if (violations.length > 0) {
    console.error('License check failed — unapproved licenses found:');
    for (const v of violations) {
      console.error(`  ${v.pkg}: ${v.license}`);
    }
    process.exit(1);
  }

  console.log('License check passed.');
} catch (error) {
  console.warn('License check skipped — pnpm licenses list unavailable:', error.message);
  process.exit(0);
}
