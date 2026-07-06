#!/usr/bin/env node
/**
 * Next.js appends a routes triple-slash reference to next-env.d.ts on dev/build.
 * tsconfig already includes generated route types, so the extra reference is redundant.
 * Root lint-staged ESLint flags that line; strip it after Next.js regenerates the file.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetPath = path.join(__dirname, '..', 'next-env.d.ts');

const ROUTES_REFERENCE =
  /^\/\/\/ <reference path="\.\/(\.next\/dev\/types\/routes\.d\.ts|\.next\/types\/routes\.d\.ts)" \/>$/;

const source = readFileSync(targetPath, 'utf8');
const cleaned = source
  .split(/\r?\n/)
  .filter((line) => !ROUTES_REFERENCE.test(line))
  .join('\n');

if (cleaned !== source) {
  writeFileSync(targetPath, cleaned.endsWith('\n') ? cleaned : `${cleaned}\n`, 'utf8');
}
