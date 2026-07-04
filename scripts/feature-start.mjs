#!/usr/bin/env node
/**
 * Start a feature branch from develop.
 *
 * Usage:
 *   pnpm feature:start live-timeline-replay
 *   pnpm feature:start feature/live-timeline-replay
 */
import {
  assertGitRepository,
  DEFAULT_BASE_BRANCH,
  localBranchExists,
  normalizeFeatureBranch,
  printHelp,
  run,
} from './lib/workflow-utils.mjs';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  printHelp('feature:start', [
    'Usage: pnpm feature:start <branch-name>',
    '',
    'Examples:',
    '  pnpm feature:start live-timeline-replay',
    '  pnpm feature:start feature/live-timeline-replay',
    '',
    'Behavior:',
    `  1. checkout ${DEFAULT_BASE_BRANCH}`,
    `  2. pull origin ${DEFAULT_BASE_BRANCH}`,
    '  3. create feature branch if missing, otherwise checkout existing branch',
    '  4. push -u origin <branch>',
  ]);
  process.exit(args.length === 0 ? 1 : 0);
}

const branch = normalizeFeatureBranch(args[0]);

if (!branch) {
  console.error('✗ Branch name is required.');
  process.exit(1);
}

assertGitRepository();

console.log(`\nStarting feature branch: ${branch}`);

run('git', ['checkout', DEFAULT_BASE_BRANCH], { header: `Checkout ${DEFAULT_BASE_BRANCH}` });
run('git', ['pull', 'origin', DEFAULT_BASE_BRANCH], {
  header: `Pull origin/${DEFAULT_BASE_BRANCH}`,
});

if (localBranchExists(branch)) {
  run('git', ['checkout', branch], { header: `Checkout existing branch ${branch}` });
} else {
  run('git', ['checkout', '-b', branch], { header: `Create branch ${branch}` });
}

run('git', ['push', '-u', 'origin', branch], { header: `Push ${branch} to origin` });

console.log('\n✓ Feature branch ready.');
console.log('\nNext steps:');
console.log(`  1. Implement your changes on ${branch}`);
console.log('  2. Run backend verification: pnpm verify:backend');
console.log('  3. Finish the feature: pnpm feature:finish "feat: your message"');
console.log('  4. Open the printed GitHub PR URL and request review');
