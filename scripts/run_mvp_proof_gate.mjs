#!/usr/bin/env node

import { spawn } from 'node:child_process';

const steps = [
  {
    name: 'Role drift',
    command: 'python',
    args: ['scripts/detect_legacy_role_drift.py'],
  },
  {
    name: 'Seeded credentials',
    command: 'python',
    args: ['scripts/verify_seeded_credentials.py'],
  },
  {
    name: 'Role access matrix',
    command: 'python',
    args: ['scripts/verify_role_access_matrix.py'],
  },
  {
    name: 'Commissions flow',
    command: 'python',
    args: ['scripts/verify_commissions_flow.py'],
  },
  {
    name: 'Disputes flow',
    command: 'python',
    args: ['scripts/verify_disputes_flow.py'],
  },
  {
    name: 'Refunds flow',
    command: 'python',
    args: ['scripts/verify_refunds_flow.py'],
  },
  {
    name: 'Logistics flow',
    command: 'python',
    args: ['scripts/verify_logistics_flow.py'],
  },
  {
    name: 'Marketplace flow',
    command: 'python',
    args: ['scripts/verify_marketplace_flow.py'],
  },
  {
    name: 'API smoke',
    command: 'python',
    args: ['scripts/api_smoke_test.py'],
  },
  {
    name: 'API contract validation',
    command: 'node',
    args: ['scripts/validate-e2e.js'],
  },
  {
    name: 'Browser UI flow',
    command: 'node',
    args: ['scripts/browser_ui_flow_check.mjs'],
  },
];

function runStep(step) {
  return new Promise((resolve) => {
    console.log(`\n=== ${step.name} ===`);
    const child = spawn(step.command, step.args, {
      stdio: 'inherit',
      shell: false,
    });

    child.on('exit', (code) => {
      resolve(code === 0);
    });

    child.on('error', () => {
      resolve(false);
    });
  });
}

async function main() {
  let allPassed = true;

  for (const step of steps) {
    const passed = await runStep(step);
    if (!passed) {
      allPassed = false;
      console.error(`\nFAIL ${step.name}`);
      break;
    }
  }

  if (!allPassed) {
    process.exit(1);
  }

  console.log('\nMVP proof gate passed.');
}

await main();
