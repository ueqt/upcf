import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * htmlencode str
 * @param {string} str 
 * @returns {string} html encoded str
 */
const translate = (str) => {
  if (!str) {
    return '';
  }
  return str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * capitalize str
 * @param {string} str 
 * @returns {string} capitalized str
 */
const capitalize = (str) => {
  let name = str;
  name = name[0].toUpperCase() + name.substring(1);
  while (name.includes('_')) {
    let foundIndex = name.indexOf('_');
    name = name.substring(0, foundIndex) + name.substring(foundIndex + 1, foundIndex + 2).toUpperCase() + name.substring(foundIndex + 2);
  }
  // 数字后面的第一个字母要大写
  for (let i = name.length - 1; i > 0; i--) {
    if (!isNaN(+name[i - 1])) {
      // 前面一个是数字
      name = name.substring(0, i) + name[i].toUpperCase() + name.substring(i + 1);
    }
  }
  return name;
}

/**
 * get enum key from enum object
 * @param {*} o Enum thing
 * @returns {string} key
 */
const getEnumKey = (o) => {
  let key = o.Label.UserLocalizedLabel.Label.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, ''); // 字母，数字，中文
  if (48 <= key.charCodeAt(0) && key.charCodeAt(0) <= 57) {
    key = 'Enum' + key;
  }
  if (o.State === 1) {
    key += '1';
  }
  return key;
};

/**
 * 添加到jsonOutput
 * @param {*} jsonOutput 
 * @param {'includes' | 'excludes' | 'tbds' | 'notsupports'} type 
 * @param {*} v 
 */
const addJsonOutput = (jsonOutput, type, v) => {
  jsonOutput[type].push(`${v.LogicalName} // ${v.DisplayName?.UserLocalizedLabel?.Label || ''}`);
};

/**
 * 遍历目录
 * @param {string} currentDirPath 
 * @param {*} callback 
 * @returns {boolean}
 */
const walkSync = (currentDirPath, callback) => {
  const dirs = readdirSync(currentDirPath, { withFileTypes: true });
  for(let i=0;i<dirs.length;i++) {
    const dirent = dirs[i];
    console.log(dirent.name);
    var filePath = join(currentDirPath, dirent.name);
    if (dirent.isFile()) {
      const result = callback(filePath, dirent);
      if(result) {
        return true;
      }
    } else if (dirent.isDirectory()) {
      const result = walkSync(filePath, callback);
      if(result) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 查找是否使用过
 * @param {string} searchPath 搜索目录
 * @param {string} searchString 搜索字符串
 * @param {string[]} ignorePath 忽略的目录
 * @returns {boolean} 是否使用到 
 */
const findUsed = (searchPath, searchString, ignorePath) => {
  return walkSync(searchPath, (/** @type {string} */filePath, dirent) => {
    for(let i=0;i<ignorePath.length;i++) {
      if(filePath.startsWith(ignorePath[i])) {
        return false;
      }
    }
    return readFileSync(filePath, { encoding: 'utf8' }).includes(searchString);
  });
}

export { translate, capitalize, getEnumKey, addJsonOutput, findUsed };
