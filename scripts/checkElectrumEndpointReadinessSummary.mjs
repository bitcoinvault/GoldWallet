import { getElectrumEndpointReadinessSummaryErrors, readElectrumEndpointReadinessSummary, summaryPath } from './electrumEndpointReadinessSummaryGuard.mjs';

const summary = readElectrumEndpointReadinessSummary();

if (!summary) {
  console.error(`Electrum endpoint readiness summary is missing at ${summaryPath}`);
  process.exit(1);
}

const errors = getElectrumEndpointReadinessSummaryErrors(summary);

if (errors.length > 0) {
  console.error('Electrum endpoint readiness summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Electrum endpoint readiness summary artifact is valid.');
