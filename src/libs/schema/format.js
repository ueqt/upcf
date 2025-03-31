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

export { translate, capitalize, getEnumKey };
