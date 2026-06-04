import fs from 'fs';
import _ from 'lodash';
import path from 'path';

import en from '../loc/en.js';
import es from '../loc/es.js';
import id from '../loc/id_ID.js';
import jo from '../loc/jp_JP.js';
import ko from '../loc/ko_KR.js';
import pt from '../loc/pt_PT.js';
import tr from '../loc/tr_TR.js';
import vi from '../loc/vi_VN.js';
import zh from '../loc/zh_cn.js';

const REAL_PATH = fs.realpathSync(process.cwd());
const RESULT_PATH = path.resolve(REAL_PATH, 'scripts/missing-translations');

const customizer = (objValue, srcValue) => {
  if (typeof srcValue === 'string') {
    if (!objValue) {
      return `TRANSLATION NEEDED | ENG: ${srcValue}`;
    }
    return objValue;
  }
};

const createNewTranslationFileContent = (dict, language) => {
  let fileContent;

  fileContent += JSON.stringify(dict, null, 2) + '\n';
  fileContent = fileContent
    .replace(/"([^(")"]+)":/g, '$1:')
    .replace(/"(.+)"/g, "'$1'")
    .replace(/'\n/g, "',\n")
    .replace(/}\n/g, '},\n')
    .replace('undefined', `const ${language} = `);

  return fileContent.substr(0, fileContent.length - 2) + '\n';
};

const writeToNewTranslationFile = (file, name) => {
  if (!fs.existsSync(RESULT_PATH)) {
    fs.mkdirSync(RESULT_PATH);
  }
  const dict = _.mergeWith(file, en, customizer);
  fs.writeFile(`${RESULT_PATH}/${name}_to-improve.js`, createNewTranslationFileContent(dict, name), err => {
    if (err) throw err;

    console.log(`${name} was written`);
  });
};

writeToNewTranslationFile(es, 'es');
writeToNewTranslationFile(id, 'id');
writeToNewTranslationFile(jo, 'jo');
writeToNewTranslationFile(ko, 'ko');
writeToNewTranslationFile(pt, 'pt');
writeToNewTranslationFile(tr, 'tr');
writeToNewTranslationFile(vi, 'vi');
writeToNewTranslationFile(zh, 'zh');
