#!/usr/bin/env node
/**
 * Production Readiness Gate
 *
 * Static checks always run. Truth E2E corridors run when TRUTH_RUN_E2E=1 and API/DB are up.
 *
 * Checklist:
 *  1-3  Truth E2E (customer, loyalty/referral, promotions) — opt-in
 *  3.5  Growth Engine V1.1 contract/actions truth E2E — opt-in
 *  4    VITE_USE_MOCK_API=false validated (static)
 *  5    No critical localStorage/auth mock fallback (static)
 *  6    Admin premium hidden in pilot (static)
 *  7    Payment sandbox label (static)
 *  8    Secrets/env documented (static + repo safety)
 *  9    Alembic single head (static)
 * 10    Docker smoke + promo pricing gate — when TRUTH_RUN_E2E=1
 */

import { spawn } from 'node:child_process';

const truthE2e = ['1', 'true', 'yes'].includes(
  (process.env.TRUTH_RUN_E2E || '').trim().toLowerCase()
);

const steps = [
  {
    id: 8,
    name: 'Repo safety / secrets scan',
    command: 'node',
    args: ['scripts/check_repo_safety.mjs'],
    always: true,
    optional: true,
  },
  {
    id: '4-9',
    name: 'Static production readiness',
    command: 'python',
    args: ['scripts/check_production_readiness_static.py'],
    always: true,
  },
  {
    id: 1,
    name: 'Customer corridor truth E2E',
    command: 'python',
    args: ['scripts/validate_customer_corridor_truth.py'],
    truth: true,
  },
  {
    id: 2,
    name: 'Loyalty / referral truth E2E',
    command: 'python',
    args: ['scripts/validate_loyalty_referral_truth.py'],
    truth: true,
  },
  {
    id: 3,
    name: 'Promotions truth E2E',
    command: 'python',
    args: ['scripts/validate_promotion_truth.py'],
    truth: true,
  },
  {
    id: '3.5',
    name: 'Growth Engine V1.1 truth E2E',
    command: 'python',
    args: ['scripts/validate_growth_engine_truth.py'],
    truth: true,
  },
  {
    id: 10,
    name: 'API smoke test',
    command: 'python',
    args: ['scripts/api_smoke_test.py'],
    truth: true,
  },
  {
    id: 'promo-ci',
    name: 'Promo pricing consumption gate',
    command: 'python',
    args: ['scripts/verify_promo_pricing_consumption.py'],
    truth: true,
  },
];

function runStep(step) {
  return new Promise((resolve) => {
    console.log(`\n=== [${step.id}] ${step.name} ===`);
    const child = spawn(step.command, step.args, {
      stdio: 'inherit',
      shell: false,
      env: {
        ...process.env,
        TRUTH_API_BASE_URL:
          process.env.TRUTH_API_BASE_URL || 'http://localhost:18000/api/v1',
        TRUTH_DATABASE_URL_SYNC:
          process.env.TRUTH_DATABASE_URL_SYNC ||
          'postgresql://laundry_user:laundry_pass@localhost:5434/laundry_express',
        API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:18000/api/v1',
        DATABASE_URL_SYNC:
          process.env.DATABASE_URL_SYNC ||
          'postgresql://laundry_user:laundry_pass@localhost:5434/laundry_express',
      },
    });

    child.on('exit', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

async function main() {
  console.log('Production Readiness Gate');
  console.log(`TRUTH_RUN_E2E=${truthE2e ? '1' : '0 (static only)'}`);

  const results = [];
  for (const step of steps) {
    if (step.truth && !truthE2e) {
      console.log(`\n=== [${step.id}] ${step.name} === SKIPPED (set TRUTH_RUN_E2E=1)`);
      continue;
    }
    const ok = await runStep(step);
    results.push({ step, ok });
    if (!ok && !step.optional) {
      console.error(`\nNO-GO: failed at [${step.id}] ${step.name}`);
      process.exit(1);
    }
    if (!ok && step.optional) {
      console.warn(`WARN: optional step failed [${step.id}] ${step.name}`);
    }
  }

  const ran = results.filter((r) => r.ok).length;
  console.log(`\nGO: ${ran}/${results.length} executed steps passed`);
  if (!truthE2e) {
    console.log('Tip: run full gate with TRUTH_RUN_E2E=1 after docker compose up');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
