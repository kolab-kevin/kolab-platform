#!/usr/bin/env node
/**
 * Check PR status and report when ready for manual merge.
 *
 * Usage:
 *   pnpm pr:ready
 */
import { assertGhReady, printPrHelp, runPullRequestStatusChecks } from './lib/pr-utils.mjs';
import { assertGitRepository } from './lib/workflow-utils.mjs';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printPrHelp('pr:ready', [
    'Usage: pnpm pr:ready',
    '',
    'Behavior:',
    '  1. Run the same checks as pnpm pr:status',
    '  2. If all checks pass, print "Ready to merge manually in GitHub."',
    '',
    'Safety:',
    '  - Does not merge automatically',
  ]);
  process.exit(0);
}

assertGitRepository();
assertGhReady();

console.log('\nChecking whether the pull request is ready to merge...');

runPullRequestStatusChecks();

console.log('\n✓ Ready to merge manually in GitHub.');
console.log('  Open the PR: pnpm pr:open');
console.log('\nThis script does not merge automatically.\n');
