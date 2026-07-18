import assert from 'assert';

import {
  ANDROID_16_KB_PAGE_SIZE,
  ANDROID_16_KB_REQUIRED_ABIS,
  buildAndroid16KbPageSizeEvidence,
  inspectElfLoadSegments,
  isSafeArchivePath,
  parseAndroid16KbPageSizeArguments,
  parseAndroidLocalProperties,
  parseElfLoadSegments,
  parseGradleAndroidToolVersions,
  parseJarEntryList,
  selectRequiredAbiLibraries,
} from './android16KbPageSizeValidation.mjs';

assert.strictEqual(ANDROID_16_KB_PAGE_SIZE, 0x4000n);
assert.deepStrictEqual(ANDROID_16_KB_REQUIRED_ABIS, ['arm64-v8a', 'x86_64']);
assert.deepStrictEqual(
  parseGradleAndroidToolVersions(`ext {
    buildToolsVersion = "36.0.0"
    ndkVersion = '27.1.12297006'
  }`),
  { buildToolsVersion: '36.0.0', ndkVersion: '27.1.12297006' },
);
assert.deepStrictEqual(parseAndroidLocalProperties('sdk.dir=C\\:\\Android\\ Sdk\n'), { 'sdk.dir': 'C:\\Android Sdk' });
assert.deepStrictEqual(parseAndroid16KbPageSizeArguments(['--apk', 'release.apk']), { apkPath: 'release.apk' });
assert.deepStrictEqual(parseAndroid16KbPageSizeArguments(['--apk=release.apk']), { apkPath: 'release.apk' });
assert.throws(() => parseAndroid16KbPageSizeArguments([]), /Usage:/);

assert.strictEqual(isSafeArchivePath('lib/arm64-v8a/libreactnative.so'), true);
[
  '../escape.so',
  'lib/../../escape.so',
  '/absolute/lib.so',
  'C:/escape.so',
  'lib\\escape.so',
  'lib/./escape.so',
  'lib//escape.so',
  'lib/CON.so',
  '-C/escape.so',
].forEach(entry => assert.strictEqual(isSafeArchivePath(entry), false, `${entry} must be unsafe`));
assert.throws(
  () => parseJarEntryList('AndroidManifest.xml\nlib/arm64-v8a/libsafe.so\n../escape.so\n'),
  /unsafe archive path: \.\.\/escape\.so/,
);
assert.deepStrictEqual(parseJarEntryList('AndroidManifest.xml\nlib/arm64-v8a/libsafe.so\n').nativeLibraries, [
  'lib/arm64-v8a/libsafe.so',
]);
assert.deepStrictEqual(
  selectRequiredAbiLibraries(['lib/arm64-v8a/libsafe.so', 'lib/x86_64/libsafe.so', 'lib/armeabi-v7a/libignored.so']),
  ['lib/arm64-v8a/libsafe.so', 'lib/x86_64/libsafe.so'],
);
assert.throws(
  () => selectRequiredAbiLibraries(['lib/arm64-v8a/libsafe.so']),
  /required 64-bit ABI\(s\): x86_64/,
);
assert.throws(
  () => selectRequiredAbiLibraries(['lib/x86_64/libsafe.so']),
  /required 64-bit ABI\(s\): arm64-v8a/,
);

const validReadelf = `
Elf file type is DYN (Shared object file)
Program Headers:
  Type           Offset   VirtAddr           PhysAddr           FileSiz  MemSiz   Flg Align
  LOAD           0x000000 0x0000000000000000 0x0000000000000000 0x01234 0x01234 R E 0x4000
  LOAD           0x004000 0x0000000000004000 0x0000000000004000 0x00200 0x00300 RW  2**15
`;

assert.deepStrictEqual(
  parseElfLoadSegments(validReadelf).map(segment => segment.alignmentHex),
  ['0x4000', '0x8000'],
);
assert.throws(
  () => inspectElfLoadSegments('lib/arm64-v8a/libbad.so', '  LOAD 0x0 0x0 0x0 0x100 0x100 R E 0x1000'),
  /alignment 0x1000 is below 0x4000/,
);
assert.throws(() => inspectElfLoadSegments('lib/arm64-v8a/not-elf.so', 'no program headers'), /no ELF LOAD segments/);

const libraryEvidence = inspectElfLoadSegments('lib/arm64-v8a/libsafe.so', validReadelf);
const evidence = buildAndroid16KbPageSizeEvidence({
  apkPath: 'release.apk',
  buildToolsVersion: '36.0.0',
  ndkVersion: '27.1.12297006',
  zipalignPath: 'zipalign',
  llvmReadelfPath: 'llvm-readelf',
  jarPath: 'jar',
  zipalignOutput: 'Verification successful',
  libraries: [libraryEvidence],
  ignoredNativeLibraryCount: 3,
});

assert.strictEqual(evidence.status, 'passed');
assert.deepStrictEqual(evidence.zipAlignment.arguments, ['-c', '-P', '16', '-v', '4', 'release.apk']);
assert.strictEqual(evidence.nativeLibraries.libraryCount, 1);
assert.deepStrictEqual(evidence.nativeLibraries.requiredAbis, ['arm64-v8a', 'x86_64']);
assert.strictEqual(evidence.nativeLibraries.ignored32BitLibraryCount, 3);
assert.strictEqual(evidence.nativeLibraries.segmentCount, 2);
assert.strictEqual(evidence.nativeLibraries.libraries[0].minimumAlignmentHex, '0x4000');
assert.throws(
  () => buildAndroid16KbPageSizeEvidence({ apkPath: 'empty.apk', libraries: [] }),
  /no native \.so libraries/,
);

console.log('Android 16 KB page-size validation guard checks passed.');
