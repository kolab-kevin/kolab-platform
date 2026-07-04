#!/usr/bin/env node
/**
 * Print repository statistics useful during feature development.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runCapture } from './lib/workflow-utils.mjs';

const repoRoot = runCapture('git', ['rev-parse', '--show-toplevel']) ?? process.cwd();

function walkFiles(startDir, predicate) {
  const results = [];

  function walk(currentDir) {
    let entries;

    try {
      entries = readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
        continue;
      }

      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (predicate(fullPath)) {
        results.push(fullPath);
      }
    }
  }

  walk(startDir);
  return results;
}

function countLines(files) {
  let total = 0;

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      total += content.split(/\r?\n/u).length;
    } catch {
      // ignore unreadable files
    }
  }

  return total;
}

function countMatches(filePath, pattern) {
  try {
    const content = readFileSync(filePath, 'utf8');
    return [...content.matchAll(pattern)].length;
  } catch {
    return 0;
  }
}

function countApiModules() {
  const apiSrc = join(repoRoot, 'apps', 'api', 'src');

  try {
    return readdirSync(apiSrc, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(apiSrc, entry.name))
      .filter((dirPath) => {
        try {
          return readdirSync(dirPath).some((name) => name.endsWith('.module.ts'));
        } catch {
          return false;
        }
      }).length;
  } catch {
    return 0;
  }
}

function countMigrations() {
  const migrationsDir = join(repoRoot, 'packages', 'database', 'prisma', 'migrations');

  try {
    return readdirSync(migrationsDir, { withFileTypes: true }).filter((entry) =>
      entry.isDirectory(),
    ).length;
  } catch {
    return 0;
  }
}

const trackedFiles = (runCapture('git', ['ls-files']) ?? '')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const docsFiles = walkFiles(join(repoRoot, 'docs'), (filePath) => filePath.endsWith('.md'));
const markdownFiles = walkFiles(repoRoot, (filePath) => filePath.endsWith('.md'));
const codeFiles = walkFiles(repoRoot, (filePath) =>
  /\.(ts|tsx|js|jsx|mjs|cjs|prisma|sql)$/u.test(filePath),
);
const testFiles = walkFiles(repoRoot, (filePath) =>
  /\.(spec|test)\.(ts|tsx|js|jsx)$/u.test(filePath),
);

const schemaPath = join(repoRoot, 'packages', 'database', 'prisma', 'schema.prisma');

console.log('\nKOLAB project stats\n');
console.log(`Repository: ${repoRoot}`);
console.log(`Tracked files: ${trackedFiles.length}`);
console.log(`Docs markdown files: ${docsFiles.length}`);
console.log(`All markdown files: ${markdownFiles.length}`);
console.log(`Markdown lines (docs/): ${countLines(docsFiles).toLocaleString()}`);
console.log(`Code/schema lines: ${countLines(codeFiles).toLocaleString()}`);
console.log(`Prisma models: ${countMatches(schemaPath, /^model\s+/gm)}`);
console.log(`Prisma enums: ${countMatches(schemaPath, /^enum\s+/gm)}`);
console.log(`Prisma migrations: ${countMigrations()}`);
console.log(`API modules: ${countApiModules()}`);
console.log(`Test files: ${testFiles.length}`);
console.log('');
