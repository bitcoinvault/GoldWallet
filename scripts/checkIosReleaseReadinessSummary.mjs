import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'ios-release-static-readiness-summary.txt');
const summary = readFileSync(summaryPath, 'utf8');
const errors = [];

const requireSnippet = snippet => {
  if (!summary.includes(snippet)) {
    errors.push(`Summary is missing "${snippet}"`);
  }
};

requireSnippet('iOS release static readiness audit');
requireSnippet('Ready for macOS archive validation: yes');
requireSnippet('React Native version: 0.85.3');
requireSnippet('React Native minimum iOS: 15.1');
requireSnippet('React Native minimum Xcode: 16.1');
requireSnippet('Podfile iOS platform: 15.1');
requireSnippet('Xcode deployment targets: 15.1');
requireSnippet('Guarded iOS schemes: 8');
requireSnippet('Errors: 0');
requireSnippet('Required action: run pod install and iOS archive/simulator validation on macOS before claiming iOS runtime delivery.');

if (errors.length > 0) {
  console.error('iOS release readiness summary artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('iOS release readiness summary artifact is valid.');
