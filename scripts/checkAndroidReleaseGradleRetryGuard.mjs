import assert from 'assert';

import { getAndroidReleaseGradleRetryReason } from './androidReleaseGradleRetry.mjs';

const options = {
  attempt: 1,
  maxAttempts: 2,
  transientExitCodes: ['1073807364'],
};
const result = overrides => ({ status: 1, stdout: '', stderr: '', ...overrides });

assert.strictEqual(
  getAndroidReleaseGradleRetryReason({
    ...options,
    result: result({ status: 1073807364 }),
  }),
  'attempt 1 exited with known transient Windows native-build code 1073807364; retrying next attempt',
);
assert.strictEqual(
  getAndroidReleaseGradleRetryReason({
    ...options,
    result: result({
      stderr:
        'The source directory\nnode_modules/react-native-share/android/build/generated/source/codegen/jni\ndoes not contain a CMakeLists.txt file',
    }),
  }),
  'attempt 1 encountered missing generated React Native JNI/CMake input; retrying next attempt',
);
assert.strictEqual(
  getAndroidReleaseGradleRetryReason({
    ...options,
    result: result({
      stdout:
        "[CXX1409] expected buildFiles file 'node_modules/react-native-permissions/android/build/generated/source/codegen/jni/CMakeLists.txt' to exist",
    }),
  }),
  'attempt 1 encountered missing generated React Native JNI/CMake input; retrying next attempt',
);

for (const negative of [
  result({ status: 0 }),
  result({ stderr: 'CMake compilation failed for a real C++ syntax error' }),
  result({ stderr: 'generated/source/codegen/jni completed successfully' }),
  result({
    status: null,
    signal: 'SIGTERM',
    stderr: 'The source directory\ngenerated/source/codegen/jni\ndoes not contain a CMakeLists.txt file',
  }),
  result({
    status: null,
    stderr: 'The source directory\ngenerated/source/codegen/jni\ndoes not contain a CMakeLists.txt file',
  }),
  result({
    stderr:
      'generated/source/codegen/jni completed successfully\nA different native directory does not contain a CMakeLists.txt file',
  }),
  result({
    error: new Error('spawn failed'),
    stderr: 'generated/source/codegen/jni does not contain a CMakeLists.txt file',
  }),
]) {
  assert.strictEqual(getAndroidReleaseGradleRetryReason({ ...options, result: negative }), null);
}
assert.strictEqual(
  getAndroidReleaseGradleRetryReason({
    ...options,
    attempt: 2,
    result: result({
      stderr: 'The source directory\ngenerated/source/codegen/jni\ndoes not contain a CMakeLists.txt file',
    }),
  }),
  null,
);

console.log('Android release Gradle retry guard checks passed.');
