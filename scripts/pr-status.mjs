#!/usr/bin/env node
/**
 * Show pull request status and checks for the current branch.
 *
 * Usage:
 *   pnpm pr:status
 */
import { assertGhReady, printPrHelp, runPullRequestStatusChecks } from './lib/pr-utils.mjs';
import { assertGitRepository } from './lib/workflow-utils.mjs';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printPrHelp('pr:status', [
    'Usage: pnpm pr:status',
    '',
    'Behavior:',
    '  1. Require GitHub CLI (gh) installed and authenticated',
    '  2. gh pr status',
    '  3. gh pr checks',
    '  4. Exit non-zero if checks failed',
    '',
    'Safety:',
    '  - Does not merge automatically',
  ]);
  process.exit(0);
}

assertGitRepository();
assertGhReady();

console.log('\nChecking pull request status for the current branch...');

runPullRequestStatusChecks();

console.log('\n✓ PR checks completed.\n');
