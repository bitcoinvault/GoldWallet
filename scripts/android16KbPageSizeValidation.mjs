import { spawnSync } from 'child_process';
import { existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

export const ANDROID_16_KB_PAGE_SIZE = 0x4000n;
export const ANDROID_16_KB_REQUIRED_ABIS = ['arm64-v8a', 'x86_64'];

const executableName = name => `${name}${process.platform === 'win32' ? '.exe' : ''}`;

export const parseGradleAndroidToolVersions = content => {
  const readQuotedValue = name =>
    content
      .match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']|${name}\\s+["']([^"']+)["']`))
      ?.slice(1)
      .find(Boolean) || '';

  return {
    buildToolsVersion: readQuotedValue('buildToolsVersion'),
    ndkVersion: readQuotedValue('ndkVersion'),
  };
};

export const parseAndroidLocalProperties = content => {
  const properties = {};

  content.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([^#!\s][^=]*)=(.*)$/);

    if (!match) return;
    properties[match[1].trim()] = match[2].trim().replace(/\\([\\:= ])/g, '$1');
  });

  return properties;
};

export const isSafeArchivePath = entry => {
  if (
    typeof entry !== 'string' ||
    entry.length === 0 ||
    entry !== entry.trim() ||
    /[\0-\x1f\\:]/.test(entry) ||
    entry.startsWith('/') ||
    entry.startsWith('-')
  ) {
    return false;
  }

  const parts = entry.split('/');

  return parts.every((part, index) => {
    if (part.length === 0) return index === parts.length - 1;
    if (part === '..' || part === '.' || /[. ]$/.test(part)) return false;
    return !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part);
  });
};

export const parseJarEntryList = output => {
  const entries = output
    .split(/\r?\n/)
    .map(entry => entry.trim())
    .filter(Boolean);
  const unsafe = entries.filter(entry => !isSafeArchivePath(entry));

  if (unsafe.length > 0) {
    throw new Error(`APK contains unsafe archive path: ${unsafe[0]}`);
  }

  const nativeLibraries = entries.filter(entry => entry.toLowerCase().endsWith('.so'));
  const duplicate = nativeLibraries.find((entry, index) => nativeLibraries.indexOf(entry) !== index);

  if (duplicate) throw new Error(`APK contains duplicate native library entry: ${duplicate}`);

  return { entries, nativeLibraries };
};

export const parseElfLoadSegments = output =>
  output
    .split(/\r?\n/)
    .filter(line => /^\s*LOAD\s+/.test(line))
    .map((line, index) => {
      const alignmentToken = line.trim().split(/\s+/).at(-1);
      let alignment;

      if (/^0x[0-9a-f]+$/i.test(alignmentToken)) alignment = BigInt(alignmentToken);
      else if (/^\d+$/.test(alignmentToken)) alignment = BigInt(alignmentToken);
      else if (/^2\*\*\d+$/.test(alignmentToken)) alignment = 2n ** BigInt(alignmentToken.slice(3));
      else throw new Error(`Unable to parse ELF LOAD alignment from: ${line.trim()}`);

      return {
        index,
        alignment,
        alignmentHex: `0x${alignment.toString(16)}`,
      };
    });

export const inspectElfLoadSegments = (library, output, minimumAlignment = ANDROID_16_KB_PAGE_SIZE) => {
  const segments = parseElfLoadSegments(output);

  if (segments.length === 0) throw new Error(`${library} has no ELF LOAD segments`);

  const belowMinimum = segments.find(segment => segment.alignment < minimumAlignment);

  if (belowMinimum) {
    throw new Error(
      `${library} LOAD segment ${belowMinimum.index} alignment ${belowMinimum.alignmentHex} is below 0x${minimumAlignment.toString(16)}`,
    );
  }

  return {
    library,
    segmentCount: segments.length,
    minimumAlignmentHex: `0x${segments
      .slice(1)
      .reduce((minimum, segment) => (segment.alignment < minimum ? segment.alignment : minimum), segments[0].alignment)
      .toString(16)}`,
    segments: segments.map(({ index, alignmentHex }) => ({ index, alignmentHex })),
  };
};

export const buildAndroid16KbPageSizeEvidence = ({
  apkPath,
  buildToolsVersion,
  ndkVersion,
  zipalignPath,
  llvmReadelfPath,
  jarPath,
  zipalignOutput = '',
  libraries,
  ignoredNativeLibraryCount = 0,
}) => {
  if (!Array.isArray(libraries) || libraries.length === 0) {
    throw new Error('APK contains no native .so libraries');
  }

  const segmentCount = libraries.reduce((total, library) => total + library.segmentCount, 0);

  if (segmentCount === 0) throw new Error('APK native libraries contain no ELF LOAD segments');

  return {
    status: 'passed',
    apkPath,
    pageSizeBytes: Number(ANDROID_16_KB_PAGE_SIZE),
    buildToolsVersion,
    ndkVersion,
    tools: { zipalign: zipalignPath, llvmReadelf: llvmReadelfPath, jar: jarPath },
    zipAlignment: {
      status: 'passed',
      arguments: ['-c', '-P', '16', '-v', '4', apkPath],
      output: zipalignOutput.trim(),
    },
    nativeLibraries: {
      status: 'passed',
      requiredAbis: ANDROID_16_KB_REQUIRED_ABIS,
      libraryCount: libraries.length,
      ignored32BitLibraryCount: ignoredNativeLibraryCount,
      segmentCount,
      libraries,
    },
  };
};

const unique = values => [...new Set(values.filter(Boolean).map(value => path.resolve(value)))];

export const getAndroidSdkCandidates = ({ root, env = process.env } = {}) => {
  let localSdk = '';
  const localPropertiesPath = root && path.join(root, 'android', 'local.properties');

  if (localPropertiesPath && existsSync(localPropertiesPath)) {
    localSdk = parseAndroidLocalProperties(readFileSync(localPropertiesPath, 'utf8'))['sdk.dir'] || '';
  }

  return unique([
    env.ANDROID_SDK_ROOT,
    env.ANDROID_HOME,
    localSdk,
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Android', 'Sdk'),
    env.HOME && path.join(env.HOME, 'Android', 'Sdk'),
  ]);
};

const requireExistingFile = (candidates, description) => {
  const match = candidates.find(candidate => candidate && existsSync(candidate));

  if (!match)
    throw new Error(`${description} not found. Checked: ${candidates.filter(Boolean).join(', ') || '<none>'}`);
  return path.resolve(match);
};

export const locateZipalign = ({ sdkRoots, buildToolsVersion }) => {
  if (!buildToolsVersion) throw new Error('Project buildToolsVersion is missing');
  return requireExistingFile(
    sdkRoots.map(sdkRoot => path.join(sdkRoot, 'build-tools', buildToolsVersion, executableName('zipalign'))),
    `zipalign for Android build-tools ${buildToolsVersion}`,
  );
};

const getNdkRoots = ({ sdkRoots, ndkVersion, env }) =>
  unique([
    env.ANDROID_NDK_HOME,
    env.ANDROID_NDK_ROOT,
    env.NDK_HOME,
    ...sdkRoots.map(sdkRoot => path.join(sdkRoot, 'ndk', ndkVersion)),
    ...sdkRoots.map(sdkRoot => path.join(sdkRoot, 'ndk-bundle')),
  ]);

export const locateLlvmReadelf = ({ sdkRoots, ndkVersion, env = process.env }) => {
  if (!ndkVersion) throw new Error('Project ndkVersion is missing');

  const candidates = [];

  getNdkRoots({ sdkRoots, ndkVersion, env }).forEach(ndkRoot => {
    const prebuiltRoot = path.join(ndkRoot, 'toolchains', 'llvm', 'prebuilt');

    if (!existsSync(prebuiltRoot)) return;
    readdirSync(prebuiltRoot, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .forEach(entry => candidates.push(path.join(prebuiltRoot, entry.name, 'bin', executableName('llvm-readelf'))));
  });

  return requireExistingFile(candidates, `llvm-readelf for Android NDK ${ndkVersion}`);
};

export const locateJar = ({ env = process.env } = {}) => {
  const pathDirectories = (env.PATH || env.Path || env.path || '')
    .split(path.delimiter)
    .map(directory => directory.replace(/^"|"$/g, ''))
    .filter(Boolean);
  const candidates = [
    env.JAVA_HOME && path.join(env.JAVA_HOME, 'bin', executableName('jar')),
    env.JDK_HOME && path.join(env.JDK_HOME, 'bin', executableName('jar')),
    ...pathDirectories.map(directory => path.join(directory, executableName('jar'))),
  ];

  return requireExistingFile(candidates, 'JDK jar executable from JAVA_HOME, JDK_HOME, or PATH');
};

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`;

  if (result.error || result.status !== 0) {
    throw new Error(
      `${options.label || command} failed: ${result.error?.message || `exit ${result.status}`}\n${output.trim()}`.trim(),
    );
  }
  return output;
};

const resolveExtractedLibraryPath = (temporaryDirectory, archiveEntry) => {
  const extractedPath = path.resolve(temporaryDirectory, ...archiveEntry.split('/'));
  const relative = path.relative(temporaryDirectory, extractedPath);

  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`APK library resolves outside the extraction directory: ${archiveEntry}`);
  }
  return extractedPath;
};

export const selectRequiredAbiLibraries = nativeLibraries => {
  const byAbi = Object.fromEntries(
    ANDROID_16_KB_REQUIRED_ABIS.map(abi => [
      abi,
      nativeLibraries.filter(library => library.startsWith(`lib/${abi}/`)),
    ]),
  );
  const missingAbis = ANDROID_16_KB_REQUIRED_ABIS.filter(abi => byAbi[abi].length === 0);

  if (missingAbis.length > 0) {
    throw new Error(`APK contains no native libraries for required 64-bit ABI(s): ${missingAbis.join(', ')}`);
  }
  return ANDROID_16_KB_REQUIRED_ABIS.flatMap(abi => byAbi[abi]);
};

export const validateAndroid16KbPageSize = ({ apkPath, root, env = process.env }) => {
  const absoluteRoot = path.resolve(root);
  const absoluteApkPath = path.resolve(apkPath);

  if (!existsSync(absoluteApkPath)) throw new Error(`APK not found: ${absoluteApkPath}`);

  const versions = parseGradleAndroidToolVersions(
    readFileSync(path.join(absoluteRoot, 'android', 'build.gradle'), 'utf8'),
  );

  if (!versions.buildToolsVersion || !versions.ndkVersion) {
    throw new Error('Unable to read buildToolsVersion and ndkVersion from android/build.gradle');
  }

  const sdkRoots = getAndroidSdkCandidates({ root: absoluteRoot, env });
  const zipalignPath = locateZipalign({ sdkRoots, buildToolsVersion: versions.buildToolsVersion });
  const llvmReadelfPath = locateLlvmReadelf({ sdkRoots, ndkVersion: versions.ndkVersion, env });
  const jarPath = locateJar({ env });
  const zipalignOutput = run(zipalignPath, ['-c', '-P', '16', '-v', '4', absoluteApkPath], {
    label: '16 KB zip alignment check',
  });
  const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'goldwallet-android-16kb-'));

  try {
    const { nativeLibraries } = parseJarEntryList(
      run(jarPath, ['tf', absoluteApkPath], { label: 'APK entry listing' }),
    );

    if (nativeLibraries.length === 0) throw new Error('APK contains no native .so libraries');
    const requiredAbiLibraries = selectRequiredAbiLibraries(nativeLibraries);

    const libraries = requiredAbiLibraries.map(library => {
      run(jarPath, ['xf', absoluteApkPath, library], {
        cwd: temporaryDirectory,
        label: `extract ${library}`,
      });
      const extractedPath = resolveExtractedLibraryPath(temporaryDirectory, library);

      if (!existsSync(extractedPath) || !lstatSync(extractedPath).isFile()) {
        throw new Error(`Extracted APK library is missing or is not a regular file: ${library}`);
      }
      return inspectElfLoadSegments(
        library,
        run(llvmReadelfPath, ['-lW', extractedPath], { label: `inspect ELF segments for ${library}` }),
      );
    });

    return buildAndroid16KbPageSizeEvidence({
      apkPath: absoluteApkPath,
      ...versions,
      zipalignPath,
      llvmReadelfPath,
      jarPath,
      zipalignOutput,
      libraries,
      ignoredNativeLibraryCount: nativeLibraries.length - requiredAbiLibraries.length,
    });
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
};

export const parseAndroid16KbPageSizeArguments = args => {
  const apkOption = args.find(argument => argument.startsWith('--apk='))?.slice('--apk='.length);
  const apkIndex = args.indexOf('--apk');
  const apkPath = apkOption || (apkIndex >= 0 ? args[apkIndex + 1] : args.find(argument => !argument.startsWith('--')));

  if (!apkPath || apkPath.startsWith('--'))
    throw new Error('Usage: node scripts/android16KbPageSizeValidation.mjs --apk <path>');
  return { apkPath };
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { apkPath } = parseAndroid16KbPageSizeArguments(process.argv.slice(2));

    console.log(JSON.stringify(validateAndroid16KbPageSize({ apkPath, root }), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
