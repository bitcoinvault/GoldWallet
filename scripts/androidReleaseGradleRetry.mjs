const generatedCodegenJniPath = String.raw`generated[\\/]+source[\\/]+codegen[\\/]+jni`;
const missingGeneratedCmakePatterns = [
  new RegExp(
    `The source directory[\\s\\S]{0,2048}${generatedCodegenJniPath}[\\s\\S]{0,512}does not contain a CMakeLists\\.txt file`,
    'i',
  ),
  new RegExp(
    `expected buildFiles file[\\s\\S]{0,2048}${generatedCodegenJniPath}[\\/]+CMakeLists\\.txt[\\s\\S]{0,512}to exist`,
    'i',
  ),
];

export const getAndroidReleaseGradleRetryReason = ({ result, attempt, maxAttempts, transientExitCodes }) => {
  if (attempt >= maxAttempts || result.error || result.signal || result.status == null) return null;

  const status = String(result.status ?? 1);
  if (transientExitCodes.includes(status)) {
    return `attempt ${attempt} exited with known transient Windows native-build code ${status}; retrying next attempt`;
  }

  const output = `${result.stdout || ''}\n${result.stderr || ''}`;
  if (status !== '0' && missingGeneratedCmakePatterns.some(pattern => pattern.test(output))) {
    return `attempt ${attempt} encountered missing generated React Native JNI/CMake input; retrying next attempt`;
  }

  return null;
};
