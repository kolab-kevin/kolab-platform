#!/usr/bin/env node
/**
 * Run local backend verification steps before opening a PR.
 */
import { run } from './lib/workflow-utils.mjs';

const steps = [
  {
    header: 'Prisma validate',
    command: 'pnpm',
    args: [
      '--filter',
      '@kolab/database',
      'exec',
      'prisma',
      'validate',
      '--schema',
      'prisma/schema.prisma',
    ],
  },
  {
    header: 'Prisma generate',
    command: 'pnpm',
    args: [
      '--filter',
      '@kolab/database',
      'exec',
      'prisma',
      'generate',
      '--schema',
      'prisma/schema.prisma',
    ],
  },
  {
    header: 'Build @kolab/types',
    command: 'pnpm',
    args: ['--filter', '@kolab/types', 'build'],
  },
  {
    header: 'Test @kolab/auth',
    command: 'pnpm',
    args: ['--filter', '@kolab/auth', 'test'],
  },
  {
    header: 'Test @kolab/storage',
    command: 'pnpm',
    args: ['--filter', '@kolab/storage', 'test'],
  },
  {
    header: 'Typecheck @kolab/api',
    command: 'pnpm',
    args: ['--filter', '@kolab/api', 'typecheck'],
  },
  {
    header: 'Test @kolab/api',
    command: 'pnpm',
    args: ['--filter', '@kolab/api', 'test'],
  },
  {
    header: 'Lint @kolab/api',
    command: 'pnpm',
    args: ['--filter', '@kolab/api', 'lint'],
  },
  {
    header: 'Markdownlint docs',
    command: 'pnpm',
    args: ['lint:md:docs'],
  },
];

console.log('\nRunning backend verification...\n');

for (const step of steps) {
  run(step.command, step.args, { header: step.header });
}

console.log('\n✓ Backend verification passed.\n');
