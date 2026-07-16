import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  getAndroidAppBundleSummaryErrors,
  getAndroidAppBundleVariantConfig,
  parseAndroidAppBundleVariant,
} from './androidAppBundleValidation.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

try {
  const variant = parseAndroidAppBundleVariant(process.argv.slice(2));
  const config = getAndroidAppBundleVariantConfig(root, variant);

  if (!existsSync(config.summaryPath)) {
    throw new Error(`Android App Bundle summary not found: ${config.summaryPath}`);
  }

  const errors = getAndroidAppBundleSummaryErrors(readFileSync(config.summaryPath, 'utf8'), config);
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  console.log(`Android App Bundle ${config.displayName} summary is valid.`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
