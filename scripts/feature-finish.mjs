#!/usr/bin/env node
/**
 * Finish a feature branch: verify, commit, push, print PR URL.
 *
 * Usage:
 *   pnpm feature:finish "feat: add live timeline replay API"
 */
import { spawnSync } from 'node:child_process';

import {
  assertGitRepository,
  buildPullRequestUrl,
  DEFAULT_BASE_BRANCH,
  getCurrentBranch,
  printHelp,
  run,
  runCapture,
} from './lib/workflow-utils.mjs';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  printHelp('feature:finish', [
    'Usage: pnpm feature:finish "<commit message>"',
    '',
    'Example:',
    '  pnpm feature:finish "feat: add live timeline replay API"',
    '',
    'Behavior:',
    '  1. git status',
    '  2. pnpm verify:backend',
    '  3. git add .',
    '  4. git commit -m "<commit message>"',
    '  5. git push',
    '  6. print GitHub PR URL (does not merge automatically)',
  ]);
  process.exit(args.length === 0 ? 1 : 0);
}

const commitMessage = args.join(' ').trim();

if (!commitMessage) {
  console.error('✗ Commit message is required.');
  process.exit(1);
}

assertGitRepository();

const branch = getCurrentBranch();

if (!branch) {
  console.error('✗ Could not determine the current git branch.');
  process.exit(1);
}

if (branch === DEFAULT_BASE_BRANCH || branch === 'main') {
  console.error(`✗ Refusing to finish directly on ${branch}. Checkout a feature branch first.`);
  process.exit(1);
}

console.log(`\nFinishing feature branch: ${branch}`);

run('git', ['status'], { header: 'Git status' });

const pendingChanges = runCapture('git', ['status', '--porcelain']);
if (!pendingChanges) {
  console.log('\nNo local changes detected. Verification will still run before commit.');
}

run('pnpm', ['verify:backend'], { header: 'Backend verification' });

if (pendingChanges) {
  run('git', ['add', '.'], { header: 'Stage changes' });
  run('git', ['commit', '-m', commitMessage], { header: 'Create commit' });
} else {
  const commitResult = spawnSync('git', ['rev-parse', '--verify', 'HEAD'], {
    stdio: 'ignore',
    shell: false,
  });

  if (commitResult.status !== 0) {
    console.error('✗ No changes to commit and no existing commits on this branch.');
    process.exit(1);
  }

  console.log('\nNo new changes to commit. Continuing with push.');
}

run('git', ['push'], { header: 'Push branch' });

const prUrl = buildPullRequestUrl(DEFAULT_BASE_BRANCH, branch);

console.log('\n✓ Feature branch pushed.');
console.log('\nNext steps:');
console.log('  1. Open a pull request for review');
console.log('  2. Wait for CI to pass');
console.log('  3. Merge manually after approval');

if (prUrl) {
  console.log(`\nSuggested PR URL:\n  ${prUrl}`);
} else {
  console.log('\nCould not derive GitHub PR URL from origin remote.');
  console.log(`Create a PR from ${branch} into ${DEFAULT_BASE_BRANCH} in GitHub.`);
}

console.log('\nThis script does not merge automatically.\n');
