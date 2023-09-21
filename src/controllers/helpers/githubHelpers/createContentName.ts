import _ from 'lodash'

function hyphenateWhitespace(str) {
    return str.trim().replace(/\s+/g, '-');
}

function replaceSpecialCharacters(str) {
    return str.replace(/( |'|\.)/gi, ' ');
}
  
export function createUsername(firstName, lastName) {
    const prepareName = function (str) {
      let normalizedStr = replaceSpecialCharacters(str)
        .split(' ').map(x => _.deburr(x.toLowerCase()).replace(/[^a-z\-]/g, '')).filter(x => x) // remove empty value
      normalizedStr = normalizedStr.join('.')
        .split(' ')
        // .map((x) => _.deburr(x.toLowerCase()))
        .join(' ')
        .trim();
      return hyphenateWhitespace(normalizedStr);
    };
    return `${prepareName(firstName)}.${prepareName(lastName)}`.toLowerCase();
}
  
export function createStartupId(name) {
  const prepareName = function (str) {
    let normalizedStr = replaceSpecialCharacters(str)
      .split(' ').map(x => _.deburr(x.toLowerCase()).replace(/[^a-z\-]/g, '')).filter(x => x) // remove empty value
    normalizedStr = normalizedStr.join('.')
      .split(' ')
      .join(' ')
      .trim();
    return hyphenateWhitespace(normalizedStr);
  };
  return `${prepareName(name)}`.toLowerCase();
}