#!/usr/bin/env node
/**
 * Shared helpers for developer workflow scripts.
 */
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';

function resolveCommand(command) {
  if (process.platform !== 'win32') {
    return command;
  }

  if (command === 'node') {
    return process.execPath;
  }

  return command;
}

function quoteForCmd(value) {
  if (!/[\s"&|<>^]/u.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

function shouldUseShell(command) {
  return process.platform === 'win32' && command === 'pnpm';
}

function buildSpawnArgs(command, args) {
  if (shouldUseShell(command)) {
    return {
      command: [command, ...args].map(quoteForCmd).join(' '),
      args: [],
      shell: true,
    };
  }

  return {
    command: resolveCommand(command),
    args,
    shell: false,
  };
}

export function run(command, args = [], options = {}) {
  const label = options.label ?? [command, ...args].join(' ');

  if (options.header) {
    console.log(`\n=== ${options.header} ===`);
  }

  const spawn = buildSpawnArgs(command, args);
  const result = spawnSync(spawn.command, spawn.args, {
    stdio: 'inherit',
    shell: spawn.shell,
    cwd: options.cwd ?? process.cwd(),
    env: { ...process.env, ...options.env },
  });

  if (result.error) {
    console.error(`\n✗ Failed to run ${label}: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`\n✗ Command failed (exit ${result.status}): ${label}`);
    process.exit(result.status ?? 1);
  }

  return result;
}

export function runCapture(command, args = []) {
  const spawn = buildSpawnArgs(command, args);
  const result = spawnSync(spawn.command, spawn.args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: spawn.shell,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    return null;
  }

  return (result.stdout ?? '').trim();
}

export function commandSucceeded(command, args = []) {
  const spawn = buildSpawnArgs(command, args);
  const result = spawnSync(spawn.command, spawn.args, {
    stdio: 'ignore',
    shell: spawn.shell,
  });

  return result.status === 0;
}

export function normalizeFeatureBranch(name) {
  const trimmed = name?.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('feature/')) {
    return trimmed;
  }

  return `feature/${trimmed}`;
}

export function localBranchExists(branch) {
  return commandSucceeded('git', ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`]);
}

export function remoteBranchExists(branch) {
  return commandSucceeded('git', [
    'show-ref',
    '--verify',
    '--quiet',
    `refs/remotes/origin/${branch}`,
  ]);
}

export function isBranchMergedInto(branch, baseBranch) {
  const merged = runCapture('git', ['branch', '--merged', baseBranch]);

  if (!merged) {
    return false;
  }

  return merged
    .split('\n')
    .map((line) => line.replace(/^\*?\s+/, '').trim())
    .includes(branch);
}

export function isRemoteBranchMergedInto(branch, baseBranch) {
  const merged = runCapture('git', ['branch', '-r', '--merged', `origin/${baseBranch}`]);

  if (!merged) {
    return false;
  }

  return merged
    .split('\n')
    .map((line) => line.trim())
    .includes(`origin/${branch}`);
}

export function getCurrentBranch() {
  return runCapture('git', ['branch', '--show-current']);
}

export function parseGithubRepo(remoteUrl) {
  if (!remoteUrl) {
    return null;
  }

  const sshMatch = remoteUrl.match(/git@github\.com:(.+?)\/(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  const httpsMatch = remoteUrl.match(/https:\/\/github\.com\/(.+?)\/(.+?)(?:\.git)?$/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  return null;
}

export function buildPullRequestUrl(baseBranch, headBranch) {
  const remote = runCapture('git', ['remote', 'get-url', 'origin']);
  const repo = parseGithubRepo(remote);

  if (!repo) {
    return null;
  }

  const encodedHead = encodeURIComponent(headBranch);
  return `https://github.com/${repo.owner}/${repo.repo}/compare/${baseBranch}...${encodedHead}?expand=1`;
}

export function printHelp(title, lines) {
  console.log(`\n${title}\n`);
  for (const line of lines) {
    console.log(line);
  }
  console.log('');
}

export async function confirm(question) {
  if (!process.stdin.isTTY) {
    return false;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => {
    rl.question(`${question} [y/N] `, resolve);
  });
  rl.close();

  return /^y(es)?$/i.test(answer.trim());
}

export function assertGitRepository() {
  if (!commandSucceeded('git', ['rev-parse', '--is-inside-work-tree'])) {
    console.error('✗ This command must be run inside a git repository.');
    process.exit(1);
  }
}

export const DEFAULT_BASE_BRANCH = 'develop';
