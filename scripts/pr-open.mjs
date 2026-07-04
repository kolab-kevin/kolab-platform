#!/usr/bin/env node
/**
 * Open the current branch pull request in the browser.
 *
 * Usage:
 *   pnpm pr:open
 */
import { assertGhReady, printPrHelp } from './lib/pr-utils.mjs';
import { assertGitRepository, run } from './lib/workflow-utils.mjs';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printPrHelp('pr:open', [
    'Usage: pnpm pr:open',
    '',
    'Behavior:',
    '  1. Require GitHub CLI (gh) installed and authenticated',
    '  2. Open the current branch PR in the browser (gh pr view --web)',
    '',
    'Safety:',
    '  - Does not merge automatically',
  ]);
  process.exit(0);
}

assertGitRepository();
assertGhReady();

console.log('\nOpening pull request in browser...');

run('gh', ['pr', 'view', '--web'], { header: 'Open pull request' });

console.log('\n✓ Opened pull request in browser.\n');
