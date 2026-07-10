import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const smokeHelper = readFileSync(path.join(root, 'scripts', 'androidSmokeDev.mjs'), 'utf8');

const fail = message => {
  console.error(`Android smoke UI dump timeout guard failed: ${message}`);
  process.exit(1);
};

const requireSnippet = snippet => {
  if (!smokeHelper.includes(snippet)) {
    fail(`scripts/androidSmokeDev.mjs is missing: ${snippet}`);
  }
};

requireSnippet('ANDROID_SMOKE_UI_DUMP_TIMEOUT_MS');
requireSnippet('const uiDumpTimeoutMs = Number(');
requireSnippet('Math.min(adbCommandTimeoutMs, 15000)');
requireSnippet('maxRetries = 1');
requireSnippet('maxRetries,');
requireSnippet('timeoutMs = adbCommandTimeoutMs');
requireSnippet('timeoutMs,');
requireSnippet('UI hierarchy dump ${label} failed: ${dumpError.message}');
requireSnippet('Compressed UI hierarchy dump ${label} failed: ${compressedDumpError.message}');
requireSnippet('Using UI dump timeout: ${uiDumpTimeoutMs}ms');
requireSnippet('`ANDROID_SMOKE_UI_DUMP_TIMEOUT_MS must be a positive integer.');

const dumpCommandMatches = [
  ...smokeHelper.matchAll(
    /\['shell', 'uiautomator', 'dump'(?:, '--compressed')?, '\/sdcard\/goldwallet-window\.xml'\][\s\S]*?maxRetries: 0,[\s\S]*?timeoutMs: uiDumpTimeoutMs/g,
  ),
];

if (dumpCommandMatches.length !== 2) {
  fail('both regular and compressed UIAutomator dump calls must pass maxRetries: 0 and timeoutMs: uiDumpTimeoutMs');
}

console.log('Android smoke UI dump timeout guard checks are valid.');
