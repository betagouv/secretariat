import { OctokitResponse } from '@octokit/types';
import {
  createGithubBranch,
  createGithubFile,
  getGithubFile,
  getGithubMasterSha,
  makeGithubPullRequest,
  PRInfo,
} from '@/lib/github';
import { createBranchName } from './createBranchName';
import {
  GithubAuthorChange,
  GithubAuthorFile,
  GithubImageFile,
  GithubBetagouvFile,
  GithubSponsorChange,
  GithubSponsorFile,
  GithubStartupChange,
  GithubStartupFile,
} from './githubEntryInterface';

async function createGithubCollectionEntry(
  name: string,
  path: string,
  changes: GithubAuthorChange | GithubStartupChange | GithubSponsorChange,
  mainContent?: string
): Promise<PRInfo> {
  const branch = createBranchName(name);
  console.log(`Début de la création de fiche pour ${name}...`);

  return await getGithubMasterSha()
    .then((response) => {
      const { sha } = response.data.object;
      console.log('SHA du master obtenu');
      return createGithubBranch(sha, branch);
    })
    .then((res) => {
      console.log(`Branche ${branch} créée`);
      const yaml = require('js-yaml');
      const doc = changes;
      const schema = yaml.DEFAULT_SCHEMA;
      schema.compiledTypeMap.scalar['tag:yaml.org,2002:timestamp'].represent =
        function (object) {
          return object.toISOString().split('T')[0];
        };
      let content =
        '---\n' +
        yaml.dump(doc, {
          schema: schema,
        }) +
        '---';
      if (mainContent) {
        content = content + '\n' + mainContent;
      }
      return createGithubFile(path, branch, content, res.data.sha);
    })
    .then(() => {
      console.log(`Fiche Github pour ${name} créer dans la branche ${branch}`);
      return makeGithubPullRequest(branch, `Création de ${name}`);
    })
    .then((response) => {
      console.log(`Pull request pour la création de la fiche ${name} ouverte`);
      if (response.status !== 201 && response.data.html_url) {
        throw new Error('Il y a eu une erreur merci de recommencer plus tard');
      }
      return response.data;
    })
    .catch((err) => {
      console.log(err);
      throw new Error(
        `Erreur Github lors de la mise à jour de la fiche de ${name}`
      );
    });
}

export async function createFileOnBranch(
  file: GithubBetagouvFile,
  branch,
  sha
) {
  const yaml = require('js-yaml');
  let content = file['content'] || '';
  if ('changes' in file) {
    const doc = file.changes;
    const schema = yaml.DEFAULT_SCHEMA;
    schema.compiledTypeMap.scalar['tag:yaml.org,2002:timestamp'].represent =
      function (object) {
        return object.toISOString().split('T')[0];
      };
    content =
      '---\n' +
      yaml.dump(doc, {
        schema: schema,
      }) +
      '---';
    if ('content' in file) {
      content = content + '\n' + file.content;
    }
  }
  return createGithubFile(file.path, branch, content, sha);
}

export async function updateFileOnBranch(
  file: GithubBetagouvFile,
  branch,
  sha
) {
  return getGithubFile(file.path, branch)
    .catch((e) => {
      console.log('File not found');
      return;
    })
    .then((res: OctokitResponse<any> | undefined) => {
      const yaml = require('js-yaml');
      let fileContent = file['content'] || '';
      const isTextFile = 'changes' in file;
      const fileAlreadyExists = res;
      const fileHasContent = 'content' in file && file.content;
      if (isTextFile) {
        let keyValueInfos = '';
        let mainContent = '';
        if (fileAlreadyExists) {
          const utf8Content = Buffer.from(res.data.content, 'base64').toString(
            'utf-8'
          );
          const splitDoc = utf8Content.split('---');
          keyValueInfos = splitDoc[1];
          mainContent = splitDoc[2];
        }
        if (fileHasContent) {
          mainContent = '\n' + file.content;
        }
        const keyValueInfosDict = yaml.load(keyValueInfos) || {};
        for (const key of Object.keys(file.changes)) {
          const value = file.changes[key];
          if (!value || (Array.isArray(value) && !value.length)) {
            delete keyValueInfosDict[key];
          } else {
            keyValueInfosDict[key] = file.changes[key];
          }
        }

        const schema = yaml.DEFAULT_SCHEMA;
        schema.compiledTypeMap.scalar['tag:yaml.org,2002:timestamp'].represent =
          function (object) {
            return object.toISOString().split('T')[0];
          };
        const formatedContent =
          '---\n' +
          yaml.dump(keyValueInfosDict, {
            schema: schema,
          }) +
          '---';
        fileContent = formatedContent + mainContent;
      }
      return createGithubFile(
        file.path,
        branch,
        fileContent,
        res ? res.data.sha : sha
      );
    });
}

export async function createMultipleFilesPR(
  prName: string,
  files: GithubBetagouvFile[]
) {
  const branch = createBranchName(prName);
  const {
    data: {
      object: { sha },
    },
  } = await getGithubMasterSha();
  console.log('SHA du master obtenu', sha);
  try {
    const resp = await createGithubBranch(sha, branch);
    console.log(`Branche ${branch} créée pour ${prName}`);
    for (const file of files) {
      await createFileOnBranch(file, branch, resp.data.object.sha);
    }
    const response = await makeGithubPullRequest(
      branch,
      `Création de ${prName}`
    );
    console.log(`Pull request pour la création de la fiche ${prName} ouverte`);
    if (response.status !== 201 && response.data.html_url) {
      throw new Error('Il y a eu une erreur merci de recommencer plus tard');
    }
    return response.data;
  } catch (err) {
    console.log(err);
    throw new Error(
      `Erreur Github lors de la mise à jour de la fiche de ${prName}`
    );
  }
}

export function makeGithubSponsorFile(
  name: string,
  changes: GithubSponsorChange
): GithubSponsorFile {
  return {
    path: `content/_organisations/${name}.md`,
    name: name,
    changes,
  };
}

export function makeGithubStartupFile(
  name: string,
  changes: GithubStartupChange,
  content: string
): GithubStartupFile {
  return {
    path: `content/_startups/${name}.md`,
    name,
    changes,
    content,
  };
}

export function makeImageFile(name: string, content: string): GithubImageFile {
  let mimeType = content.match(/[^:/]\w+(?=;|,)/)[0];
  return {
    name,
    path: `img/startups/${name}.${mimeType}`,
    content: content.split(',')[1],
  };
}

export function makeGithubAuthorFile(
  name: string,
  changes: GithubAuthorChange,
  content?: string
): GithubAuthorFile {
  return {
    path: `content/_authors/${name}.md`,
    name,
    changes,
    content,
  };
}

export async function createSponsorsGithubFile(
  sponsorName: string,
  changes: GithubSponsorChange
): Promise<PRInfo> {
  const path = `content/_organisations/${sponsorName}.md`;
  return createGithubCollectionEntry(sponsorName, path, changes);
}

export async function createAuthorGithubFile(
  username: string,
  changes: GithubAuthorChange
): Promise<PRInfo> {
  const path = `content/_authors/${username}.md`;
  return createGithubCollectionEntry(username, path, changes);
}

export async function createStartupGithubFile(
  startupname: string,
  changes: GithubStartupChange,
  content: string
): Promise<PRInfo> {
  const path = `content/_startups/${startupname}.md`;
  return createGithubCollectionEntry(startupname, path, changes, content);
}
