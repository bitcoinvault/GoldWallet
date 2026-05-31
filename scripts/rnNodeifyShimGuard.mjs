export const requiredRnNodeifyShims = [
  {
    file: 'node_modules/stream-browserify/index.js',
    marker: 'module.exports = global.StreamModule = Stream',
  },
  {
    file: 'node_modules/readable-stream/readable.js',
    marker: 'global.StreamModule || require',
  },
];

export const getRnNodeifyShimErrors = shimContents => {
  const contentMap = shimContents instanceof Map ? shimContents : new Map(Object.entries(shimContents));
  const errors = [];

  requiredRnNodeifyShims.forEach(({ file, marker }) => {
    const content = contentMap.get(file);

    if (content === undefined) {
      errors.push(`${file} is missing`);
      return;
    }

    if (!content.includes(marker)) {
      errors.push(`${file} is missing rn-nodeify marker: ${marker}`);
    }
  });

  return errors;
};

export const assertRnNodeifyShims = shimContents => {
  const errors = getRnNodeifyShimErrors(shimContents);

  if (errors.length > 0) {
    throw new Error(errors.map(error => `- ${error}`).join('\n'));
  }
};
