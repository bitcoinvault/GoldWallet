import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { getLineValue } from './androidSmokeSummaryGuard.mjs';
import { getAndroidReleaseNetworkBlockerSummaryErrors } from './androidReleaseNetworkBlockerSummaryGuard.mjs';

export const controlledElectrumReleaseBlocker = 'blocked-by-electrum-certificate-expired';

export const collectCodePushControlledReleaseBlocker = root => {
  const summaryPath = path.join(root, 'local-docs', 'android-release-network-blocker-summary.txt');

  if (!existsSync(summaryPath)) {
    return {
      present: false,
      valid: false,
      outcome: 'missing',
      errors: ['missing Android release network blocker summary'],
    };
  }

  const summary = readFileSync(summaryPath, 'utf8');
  const errors = getAndroidReleaseNetworkBlockerSummaryErrors(summary);
  const outcome = getLineValue(summary, 'Release blocker outcome') || 'missing';

  return {
    present: true,
    valid: errors.length === 0 && outcome === controlledElectrumReleaseBlocker,
    outcome,
    errors,
  };
};
