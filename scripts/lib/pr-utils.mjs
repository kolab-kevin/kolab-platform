#!/usr/bin/env node
/**
 * Shared helpers for GitHub pull request workflow scripts.
 */
import { spawnSync } from 'node:child_process';

import {
  DEFAULT_BASE_BRANCH,
  getCurrentBranch,
  printHelp,
  remoteBranchExists,
  run,
  runCapture,
} from './workflow-utils.mjs';

const GITHUB_CLI_URL = 'https://cli.github.com/';

export function printPrHelp(scriptName, lines) {
  printHelp(scriptName, lines);
}

export function assertGhInstalled() {
  const version = runCapture('gh', ['--version']);

  if (!version) {
    console.error('✗ GitHub CLI (gh) is not installed or not on PATH.');
    console.error(`  Install: ${GITHUB_CLI_URL}`);
    process.exit(1);
  }
}

export function assertGhAuthenticated() {
  assertGhInstalled();

  const status = spawnSync('gh', ['auth', 'status'], {
    stdio: 'pipe',
    shell: false,
    encoding: 'utf8',
  });

  if (status.status !== 0) {
    console.error('✗ GitHub CLI is not authenticated.');
    console.error('  Run: gh auth login');
    if (status.stderr?.trim()) {
      console.error(`\n${status.stderr.trim()}`);
    }
    process.exit(1);
  }
}

export function assertGhReady() {
  assertGhAuthenticated();
}

export function assertFeatureBranch(branch = getCurrentBranch()) {
  if (!branch) {
    console.error('✗ Could not determine the current git branch.');
    process.exit(1);
  }

  if (branch === DEFAULT_BASE_BRANCH || branch === 'main') {
    console.error(`✗ Refusing to run on ${branch}. Checkout a feature branch first.`);
    process.exit(1);
  }

  return branch;
}

export function assertRemoteBranchExists(branch) {
  if (!remoteBranchExists(branch)) {
    console.error(`✗ Branch ${branch} is not on origin.`);
    console.error(`  Push first: git push -u origin ${branch}`);
    process.exit(1);
  }
}

export function getLatestCommitSubject() {
  return runCapture('git', ['log', '-1', '--pretty=%s']);
}

export function truncateTitle(title, maxLength = 256) {
  const trimmed = title?.trim();

  if (!trimmed) {
    return 'Update';
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildPullRequestBody({ headBranch, baseBranch, commitSubject }) {
  return [
    '## Summary',
    '',
    `- Branch: \`${headBranch}\` → \`${baseBranch}\``,
    `- Latest commit: ${commitSubject || '(no commit message)'}`,
    '',
    '## Test plan',
    '',
    '- [ ] Backend verification (`pnpm verify:backend`)',
    '- [ ] PR checks pass (`pnpm pr:status`)',
    '',
    '## Notes',
    '',
    'Created with `pnpm pr:create`. Merge manually in GitHub after review.',
  ].join('\n');
}

export function getExistingPullRequest() {
  const json = runCapture('gh', ['pr', 'view', '--json', 'url,number,title']);

  if (!json) {
    return null;
  }

  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getPullRequestUrl() {
  const existing = getExistingPullRequest();
  return existing?.url ?? null;
}

export function printPullRequestNextSteps(url) {
  console.log('\nNext steps:');
  console.log('  1. Request review');
  console.log('  2. Monitor checks: pnpm pr:status');
  console.log('  3. Open in browser: pnpm pr:open');
  console.log('  4. Merge manually in GitHub after approval');

  if (url) {
    console.log(`\nPR URL:\n  ${url}`);
  }

  console.log('\nThese scripts do not merge automatically.\n');
}

export function runPullRequestStatusChecks() {
  run('gh', ['pr', 'status'], { header: 'Pull request status' });
  run('gh', ['pr', 'checks'], { header: 'PR checks' });
}
