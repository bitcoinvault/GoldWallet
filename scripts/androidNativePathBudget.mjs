import { existsSync } from 'fs';
import path from 'path';

export const windowsNativePathLimit = 259;
export const nativeCodegenPathProbes = [
  'node_modules/@react-native-firebase/analytics/android/src/reactnative/java/io/invertase/firebase/analytics/generated/jni/react/renderer/components/RNFBAnalyticsTurboModules/RNFBAnalyticsTurboModulesJSI-generated.cpp',
  'node_modules/@react-native-firebase/app/android/src/reactnative/java/io/invertase/firebase/app/generated/jni/react/renderer/components/RNFBAppTurboModules/RNFBAppTurboModulesJSI-generated.cpp',
  'node_modules/@react-native-firebase/crashlytics/android/src/main/java/io/invertase/firebase/crashlytics/generated/jni/react/renderer/components/RNFBCrashlyticsTurboModules/RNFBCrashlyticsTurboModulesJSI-generated.cpp',
  'node_modules/@react-native-firebase/messaging/android/src/main/java/io/invertase/firebase/messaging/generated/jni/react/renderer/components/RNFBMessagingTurboModules/RNFBMessagingTurboModulesJSI-generated.cpp',
].map(candidate => path.win32.normalize(candidate));

export const getAndroidNativePathBudget = ({
  rootPath,
  platform = process.platform,
  candidateRelativePaths = nativeCodegenPathProbes,
  pathExists = existsSync,
  pathLimit = windowsNativePathLimit,
} = {}) => {
  if (platform !== 'win32') return { applies: false, ready: true, errors: [] };

  const normalizedRoot = path.win32.resolve(rootPath);
  const candidates = candidateRelativePaths.map(candidateRelativePath => {
    const normalizedRelativePath = path.win32.normalize(candidateRelativePath);
    const candidatePath = path.win32.join(normalizedRoot, normalizedRelativePath);
    return {
      candidatePath,
      candidateLength: candidatePath.length,
      candidateRelativePath: normalizedRelativePath,
      present: pathExists(candidatePath),
    };
  });
  const missingCandidates = candidates.filter(candidate => !candidate.present);
  const longestCandidate = candidates.reduce(
    (longest, candidate) => (!longest || candidate.candidateLength > longest.candidateLength ? candidate : longest),
    undefined,
  );
  const maximumRootLength = longestCandidate
    ? pathLimit - longestCandidate.candidateRelativePath.length - 1
    : undefined;
  const errors = [];

  if (missingCandidates.length > 0) {
    errors.push(
      `Native path probes are stale or dependencies are not installed: ${missingCandidates.map(candidate => candidate.candidateRelativePath).join(', ')}`,
    );
  }
  if (longestCandidate && longestCandidate.candidateLength > pathLimit) {
    errors.push(
      `GoldWallet Android New Architecture build path is too long on Windows (${longestCandidate.candidateLength} > ${pathLimit} characters).`,
      `Checkout root: ${normalizedRoot} (${normalizedRoot.length} characters; maximum ${maximumRootLength} for ${longestCandidate.candidateRelativePath}).`,
      'Move this worktree to a short root such as D:\\gw-978 or D:\\q978 before running Gradle.',
    );
  }

  return {
    applies: true,
    ready: errors.length === 0,
    errors,
    rootPath: normalizedRoot,
    rootLength: normalizedRoot.length,
    candidates,
    longestCandidate,
    pathLimit,
    maximumRootLength,
  };
};

export const getAndroidNativePathBudgetError = budget => budget.errors?.join('\n') || '';
