import { Octokit } from "@octokit/rest";
import config from "@config";
import fm from "front-matter";
import axios from "axios";
import { request } from '@octokit/request';

export interface PRInfo {
  html_url: string,
  number: number
}

function getURL(objectID) {
  return `https://api.github.com/repos/betagouv/beta.gouv.fr/${objectID}`;
}

const requestWithAuth = request.defaults({
  headers: {
    authorization: `token ${config.githubToken}`,
  },
});

async function getJson(uri) {
  await axios({
    url: uri,
    auth: {
      username: process.env.GITHUB_CLIENT_ID,
      password: process.env.GITHUB_CLIENT_SECRET,
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
  const before: any = await getJson(getURL(`commits/${hash}`));

  const beforeRootTree: any = await getJson(before.commit.tree.url);
  const contentObject = beforeRootTree.tree.find((element) => element.path === 'content');

  const beforeContentTree: any = await getJson(contentObject.url);
  const authorsObject = beforeContentTree.tree.find((element) => element.path === '_authors');

  const fileList: any = await getJson(authorsObject.url);

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

export { extractEndDates }

async function fetchDetails(input) {
  const changes = await listChanges(input);

  await Promise.all(changes.map(async (data) => {
    const beforeMetadata: any = await getJson(data.before.url);
    const afterMetadata: any = await getJson(data.url);
    return {
      data,
      before: getContent(beforeMetadata.content),
      after: getContent(afterMetadata.content),
    };
  }));
}

export { fetchDetails }

/**
 * Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen.
 * @see https://github.com/shinnn/github-username-regex
 * @see https://github.com/join
 */
function isValidGithubUserName(value) {
  return !value || (/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(value));
}

export { isValidGithubUserName }

const createOctokitAuth = () => {
  if (!config.githubOrgAdminToken) {
    const errorMessage = 'Unable to launch github request without env var githubOrgAdminToken';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  return new Octokit({ auth: config.githubOrgAdminToken });
};

const getGithubMembersOfOrganization = (org, i) => {
  const octokit = createOctokitAuth();
  return octokit.request('GET /orgs/{org}/members', {
    org,
    per_page: 100,
    page: i,
  }).then((resp) => resp.data);
};

export { getGithubMembersOfOrganization }

const getPendingInvitations = (org, i) => {
  const octokit = createOctokitAuth();
  return octokit.request('GET /orgs/{org}/invitations', {
    org,
    per_page: 100,
    page: i,
  }).then((resp) => resp.data);
};

export async function getAllPendingInvitations(org, i = 0) {
  const githubUsers = await getPendingInvitations(org, i);
  if (!githubUsers.length) {
    return [];
  }
  const nextPageGithubUsers = await exports.getAllPendingInvitations(org, i + 1);
  return [...githubUsers, ...nextPageGithubUsers];
}

export async function getAllOrganizationMembers(org, i = 0) {
  const githubUsers = await getGithubMembersOfOrganization(org, i);
  if (!githubUsers.length) {
    return [];
  }
  const nextPageGithubUsers = await exports.getAllOrganizationMembers(org, i + 1);
  return [...githubUsers, ...nextPageGithubUsers];
}

export function inviteUserByUsernameToOrganization(username, org) {
  const octokit = createOctokitAuth();
  return octokit.request('PUT /orgs/{org}/memberships/{username}', {
    org,
    username,
  });
}

export function addUserToTeam(username, org, team_slug) {
  const octokit = createOctokitAuth();
  return octokit.request('PUT /orgs/{org}/teams/{team_slug}/memberships/{username}', {
    org,
    team_slug,
    username,
  });
}

export function removeUserByUsernameFromOrganization(username, org) {
  const octokit = createOctokitAuth();
  return octokit.request('DELETE /orgs/{org}/memberships/{username}', {
    org,
    username,
  });
}

export function getPullRequestFiles(owner: string, repo: string, pull_number: number) {
  const octokit = createOctokitAuth();
  return octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number,
  })
}

export function getPullRequests(owner: string, repo: string, state: 'all' | 'open' | 'closed') {
  const octokit = createOctokitAuth();
  return octokit.rest.pulls.list({
      owner,
      repo,
      state
  })
}

export function getGithubMasterSha() {
  const url = `https://api.github.com/repos/${config.githubRepository}/git/ref/heads/master`;
  return requestWithAuth(url);
}

export function createGithubBranch(sha, branch) {
  const url = `https://api.github.com/repos/${config.githubFork}/git/refs`;
  const ref = `refs/heads/${branch}`;
  return requestWithAuth(`POST ${url}`, { sha, ref });
}

export function deleteGithubBranch(branch) {
  const url = `https://api.github.com/repos/${config.githubFork}/git/refs/heads/${branch}`;
  return requestWithAuth(`DELETE ${url}`);
}

export function getLastCommitFromFile(path, branch) {
  const url = `https://api.github.com/repos/${config.githubRepository}/commits?path=${path}&page=1&per_page=1`
  return requestWithAuth(`GET ${url}`, { branch });
}

export function getGithubFile(path, branch) {
  const url = `https://api.github.com/repos/${config.githubRepository}/contents/${path}`;

  return requestWithAuth(`GET ${url}`, { branch });
}

export function createGithubFile(path, branch, content, sha = undefined) {
  const url = `https://api.github.com/repos/${config.githubFork}/contents/${path}`;
  const message = `${
    sha ? 'Mise à jour' : 'Création'
  } de fichier ${path} sur la branche ${branch}`;
  let base64EncodedContent = content
  let regex = new RegExp(/[^\s]+(.*?).(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF)$/);
  if (!regex.test(path)) {  
    base64EncodedContent = Buffer.from(content, 'utf-8').toString('base64');
  }

  return requestWithAuth(`PUT ${url}`, {
    branch,
    sha,
    message,
    content: base64EncodedContent,
  });
}

export function makeGithubPullRequest(branch, title) {
  const url = `https://api.github.com/repos/${config.githubRepository}/pulls`;
  const head = `${config.githubFork.split('/')[0]}:${branch}`;
  const base = 'master';

  return requestWithAuth(`POST ${url}`, {
    title,
    head,
    base,
    maintainer_can_modify: true,
  });
}

