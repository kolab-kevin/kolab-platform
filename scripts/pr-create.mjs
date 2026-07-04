#!/usr/bin/env node
/**
 * Create a GitHub pull request for the current feature branch.
 *
 * Usage:
 *   pnpm pr:create
 */
import {
  assertFeatureBranch,
  assertGhReady,
  assertRemoteBranchExists,
  buildPullRequestBody,
  getExistingPullRequest,
  getLatestCommitSubject,
  printPrHelp,
  printPullRequestNextSteps,
  truncateTitle,
} from './lib/pr-utils.mjs';
import {
  assertGitRepository,
  DEFAULT_BASE_BRANCH,
  run,
  runCapture,
} from './lib/workflow-utils.mjs';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printPrHelp('pr:create', [
    'Usage: pnpm pr:create',
    '',
    'Behavior:',
    '  1. Require GitHub CLI (gh) installed and authenticated',
    '  2. Refuse to run on develop or main',
    '  3. git fetch origin',
    '  4. Create PR into develop from the current branch',
    '  5. Derive title from the latest commit message',
    '  6. If a PR already exists, print its URL',
    '',
    'Safety:',
    '  - Does not merge automatically',
    '  - Does not force-push or delete branches',
  ]);
  process.exit(0);
}

assertGitRepository();
assertGhReady();

const branch = assertFeatureBranch();

console.log(`\nCreating pull request for branch: ${branch}`);

run('git', ['fetch', 'origin'], { header: 'Fetch origin' });
assertRemoteBranchExists(branch);

const existing = getExistingPullRequest();

if (existing) {
  console.log(`\n✓ Pull request already exists for ${branch}:`);
  console.log(`  #${existing.number} ${existing.title}`);
  printPullRequestNextSteps(existing.url);
  process.exit(0);
}

const commitSubject = getLatestCommitSubject();

if (!commitSubject) {
  console.error('✗ Could not read the latest commit message for PR title.');
  process.exit(1);
}

const title = truncateTitle(commitSubject);
const body = buildPullRequestBody({
  headBranch: branch,
  baseBranch: DEFAULT_BASE_BRANCH,
  commitSubject,
});

run(
  'gh',
  [
    'pr',
    'create',
    '--base',
    DEFAULT_BASE_BRANCH,
    '--head',
    branch,
    '--title',
    title,
    '--body',
    body,
  ],
  { header: 'Create pull request' },
);

const url = runCapture('gh', ['pr', 'view', '--json', 'url']);

console.log('\n✓ Pull request created.');
printPullRequestNextSteps(url ? JSON.parse(url).url : null);
