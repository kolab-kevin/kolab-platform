#!/usr/bin/env node
/**
 * Detect circular dependencies in TypeScript source files.
 * Uses madge — fast, zero-config for monorepos.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const roots = ['apps/api/src', 'packages/auth/src', 'packages/config/src', 'packages/types/src'];

let failed = false;

for (const root of roots) {
  if (!existsSync(root)) continue;
  try {
    execSync(`npx madge --circular --extensions ts,tsx "${root}"`, { stdio: 'inherit' });
    console.log(`✓ No cycles in ${root}`);
  } catch {
    console.error(`✗ Circular dependencies found in ${root}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('Cycle check passed.');
