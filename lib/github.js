const fm = require('front-matter');
const axios = require('axios').default;

function getURL(objectID) {
  return `https://api.github.com/repos/betagouv/beta.gouv.fr/${objectID}`;
}

async function getJson(uri) {
  await axios({
    url: uri,
    auth: {
      user: process.env.GITHUB_CLIENT_ID,
      pass: process.env.GITHUB_CLIENT_SECRET,
    },
    headers: {
      'User-Agent': 'Secretariat beta.gouv.fr',
      Accept: 'application/vnd.github.v3+json',
    },
  }).then((x) => x.data);
}

async function getAuthorFileList(hash) {
  if (hash === '0000000000000000000000000000000000000000') {
    return {};
  }
  const before = await getJson(getURL(`commits/${hash}`));

  const beforeRootTree = await getJson(before.commit.tree.url);
  const contentObject = beforeRootTree.tree.find((element) => element.path === 'content');

  const beforeContentTree = await getJson(contentObject.url);
  const authorsObject = beforeContentTree.tree.find((element) => element.path === '_authors');

  const fileList = await getJson(authorsObject.url);

  return fileList.tree.reduce((map, fileInfo) => {
    map[fileInfo.path] = fileInfo;
    return map;
  }, {});
}

async function listChanges(input) {
  const beforeMap = await getAuthorFileList(input.before);
  const afterMap = await getAuthorFileList(input.after);

  const currentKeys = Object.keys(afterMap);
  return currentKeys.reduce((changes, key) => {
    if (beforeMap[key] && afterMap[key].sha !== beforeMap[key].sha) {
      changes.push({
        ...afterMap[key],
        before: beforeMap[key],
      });
    }
    return changes;
  }, []);
}

function getContent(payload) {
  const buff = Buffer.from(payload, 'base64');
  const str = buff.toString('utf-8');
  return fm(str);
}

function extractEndDates(item) {
  const periods = ['before', 'after'];
  return periods.reduce((result, p) => {
    const dates = item[p].attributes.missions.map((m) => m.end);
    dates.sort((a, b) => a - b);
    result[p] = dates[dates.length - 1];

    return result;
  }, {});
}
exports.extractEndDates = extractEndDates;

async function fetchDetails(input) {
  const changes = await listChanges(input);

  await Promise.all(changes.map(async (data) => {
    const beforeMetadata = await getJson(data.before.url);
    const afterMetadata = await getJson(data.url);
    return {
      data,
      before: getContent(beforeMetadata.content),
      after: getContent(afterMetadata.content),
    };
  }));
}

exports.fetchDetails = fetchDetails;

function isValidGithubUserName(value) {
  return !value || (!value.startsWith('http') && !value.startsWith('https') && !value.includes('/') && !value.includes('@'));
}
exports.isValidGithubUserName = isValidGithubUserName;
