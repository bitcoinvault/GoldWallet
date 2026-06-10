export const getNodeRuntimeVersionErrors = ({ actualVersion, expectedVersion }) => {
  const actual = (actualVersion || '').replace(/^v/, '').trim();
  const expected = (expectedVersion || '').replace(/^v/, '').trim();
  const errors = [];

  if (!expected) {
    errors.push('Expected Node version is missing; check .nvmrc');
  }

  if (!actual) {
    errors.push('Current Node version is missing');
  }

  if (actual && expected && actual !== expected) {
    errors.push(`Current Node v${actual} does not match .nvmrc v${expected}`);
  }

  return errors;
};
