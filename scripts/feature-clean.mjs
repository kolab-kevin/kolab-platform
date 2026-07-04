#!/usr/bin/env node
/**
 * Clean up a merged feature branch locally and optionally on origin.
 *
 * Usage:
 *   pnpm feature:clean live-timeline-replay
 *   pnpm feature:clean feature/live-timeline-replay --delete-remote
 */
import {
  assertGitRepository,
  confirm,
  DEFAULT_BASE_BRANCH,
  getCurrentBranch,
  isBranchMergedInto,
  isRemoteBranchMergedInto,
  localBranchExists,
  normalizeFeatureBranch,
  printHelp,
  remoteBranchExists,
  run,
} from './lib/workflow-utils.mjs';

const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const flags = new Set(process.argv.slice(2).filter((arg) => arg.startsWith('--')));
const deleteRemoteFlag = flags.has('--delete-remote');

if (flags.has('--help') || flags.has('-h') || args.length === 0) {
  printHelp('feature:clean', [
    'Usage: pnpm feature:clean <branch-name> [--delete-remote]',
    '',
    'Examples:',
    '  pnpm feature:clean live-timeline-replay',
    '  pnpm feature:clean feature/live-timeline-replay --delete-remote',
    '',
    'Behavior:',
    `  1. checkout ${DEFAULT_BASE_BRANCH}`,
    `  2. pull origin ${DEFAULT_BASE_BRANCH}`,
    '  3. delete local branch only if merged into develop (safe delete, no force)',
    '  4. delete remote branch if merged, or with --delete-remote after confirmation',
  ]);
  process.exit(flags.has('--help') || flags.has('-h') ? 0 : 1);
}

const branch = normalizeFeatureBranch(args[0]);

if (!branch) {
  console.error('✗ Branch name is required.');
  process.exit(1);
}

if (branch === DEFAULT_BASE_BRANCH || branch === 'main') {
  console.error(`✗ Refusing to delete protected branch ${branch}.`);
  process.exit(1);
}

assertGitRepository();

const currentBranch = getCurrentBranch();

if (currentBranch === branch) {
  console.log(`Currently on ${branch}; switching to ${DEFAULT_BASE_BRANCH} first.`);
}

run('git', ['checkout', DEFAULT_BASE_BRANCH], { header: `Checkout ${DEFAULT_BASE_BRANCH}` });
run('git', ['pull', 'origin', DEFAULT_BASE_BRANCH], {
  header: `Pull origin/${DEFAULT_BASE_BRANCH}`,
});
run('git', ['fetch', 'origin', '--prune'], { header: 'Fetch origin' });

if (localBranchExists(branch)) {
  if (isBranchMergedInto(branch, DEFAULT_BASE_BRANCH)) {
    run('git', ['branch', '-d', branch], { header: `Delete merged local branch ${branch}` });
    console.log(`\n✓ Deleted local branch ${branch}.`);
  } else {
    console.log(`\nLocal branch ${branch} is not merged into ${DEFAULT_BASE_BRANCH}.`);
    console.log('Safe mode: local branch was not deleted.');
  }
} else {
  console.log(`\nLocal branch ${branch} does not exist.`);
}

if (remoteBranchExists(branch)) {
  const remoteMerged = isRemoteBranchMergedInto(branch, DEFAULT_BASE_BRANCH);
  let shouldDeleteRemote = remoteMerged;

  if (!remoteMerged && deleteRemoteFlag) {
    shouldDeleteRemote = await confirm(
      `Remote branch origin/${branch} is not merged into origin/${DEFAULT_BASE_BRANCH}. Delete anyway?`,
    );
  }

  if (shouldDeleteRemote) {
    run('git', ['push', 'origin', '--delete', branch], {
      header: `Delete remote branch origin/${branch}`,
    });
    console.log(`\n✓ Deleted remote branch origin/${branch}.`);
  } else if (!remoteMerged) {
    console.log(`\nRemote branch origin/${branch} is not merged.`);
    console.log('Remote branch was not deleted.');
    console.log('Use --delete-remote to request deletion after confirmation.');
  } else {
    console.log(
      `\nRemote branch origin/${branch} was already removed or not present after cleanup.`,
    );
  }
} else {
  console.log(`\nRemote branch origin/${branch} does not exist.`);
}

console.log('\nCleanup complete.\n');
