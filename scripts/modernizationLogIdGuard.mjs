export const allowedLegacyDuplicateIds = new Set([
  'BEM-34.2',
  'BEM-34.3',
  'BEM-34.4',
  'BEM-36.12',
  'BEM-36.13',
  'BEM-36.14',
  'BEM-36.15',
  'BEM-36.16',
  'BEM-36.17',
  'BEM-36.18',
  'BEM-36.19',
  'BEM-36.20',
  'BEM-36.72',
  'BEM-36.83',
  'BEM-36.84',
  'BEM-36.85',
  'BEM-36.86',
  'BEM-36.87',
]);

export const getModernizationLogIdReport = (log, allowedDuplicates = allowedLegacyDuplicateIds) => {
  const headingPattern = /^### (BEM-\d+\.\d+) - (.+)$/gm;
  const seen = new Map();
  const legacyDuplicates = [];
  const unexpectedDuplicates = [];
  let match;

  while ((match = headingPattern.exec(log)) !== null) {
    const [, id, title] = match;
    const lineNumber = log.slice(0, match.index).split(/\r?\n/).length;
    const entry = { id, title, lineNumber };
    const previous = seen.get(id);

    if (!previous) {
      seen.set(id, entry);
      continue;
    }

    const duplicate = { previous, current: entry };

    if (allowedDuplicates.has(id)) {
      legacyDuplicates.push(duplicate);
    } else {
      unexpectedDuplicates.push(duplicate);
    }
  }

  return {
    uniqueCount: seen.size,
    legacyDuplicates,
    unexpectedDuplicates,
  };
};
