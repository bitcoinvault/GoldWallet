import { allowedLegacyDuplicateIds, getModernizationLogIdReport } from './modernizationLogIdGuard.mjs';

const uniqueLog = `
### BEM-1.1 - First entry
### BEM-1.2 - Second entry
`;

const legacyDuplicateLog = `
### BEM-36.83 - Historical first entry
### BEM-36.83 - Historical second entry
`;

const unexpectedDuplicateLog = `
### BEM-99.1 - First entry
### BEM-99.1 - Second entry
`;

const assertAccepted = (label, log) => {
  const report = getModernizationLogIdReport(log);

  if (report.unexpectedDuplicates.length > 0) {
    console.error(`${label} should be accepted, but produced unexpected duplicates.`);
    report.unexpectedDuplicates.forEach(({ previous, current }) =>
      console.error(`- ${current.id}: ${previous.title} / ${current.title}`),
    );
    process.exit(1);
  }
};

const assertRejected = (label, log, expectedId) => {
  const report = getModernizationLogIdReport(log);

  if (!report.unexpectedDuplicates.some(({ current }) => current.id === expectedId)) {
    console.error(`${label} should reject duplicate ${expectedId}, but produced:`);
    report.unexpectedDuplicates.forEach(({ current }) => console.error(`- ${current.id}`));
    process.exit(1);
  }
};

if (!allowedLegacyDuplicateIds.has('BEM-36.83')) {
  console.error('Expected BEM-36.83 to remain in the legacy duplicate allow-list fixture.');
  process.exit(1);
}

assertAccepted('Unique modernization log IDs fixture', uniqueLog);
assertAccepted('Legacy duplicate modernization log IDs fixture', legacyDuplicateLog);
assertRejected('Unexpected duplicate modernization log IDs fixture', unexpectedDuplicateLog, 'BEM-99.1');

console.log('Modernization log ID guard checks are valid.');
