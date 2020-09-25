const config = require('../config');
const { request } = require('@octokit/request');
const ejs = require('ejs');

const requestWithAuth = request.defaults({
  headers: {
    authorization: `token ${config.githubToken}`,
  },
});

function removeAccents(str) {
    var map = {
      'a' : 'á|à|ã|â|À|Á|Ã|Â',
      'e' : 'é|è|ê|É|È|Ê',
      'i' : 'í|ì|î|Í|Ì|Î',
      'o' : 'ó|ò|ô|õ|Ó|Ò|Ô|Õ',
      'u' : 'ú|ù|û|ü|Ú|Ù|Û|Ü',
      'c' : 'ç|Ç',
      'n' : 'ñ|Ñ'
    };
    for (var pattern in map)
        str = str.replace(new RegExp(map[pattern], 'g'), pattern);
    return str;
}

function createUsername(firstName, lastName) {
  const firstNameSegment = removeAccents(firstName).replace(/( |'|\.)/gi, '-');
  const lastNameSegment = removeAccents(lastName).replace(/( |'|\.)/gi, '-');
  return `${firstNameSegment}.${lastNameSegment}`.toLowerCase();
}

function getMasterSha() {
  const url = `https://api.github.com/repos/${config.githubRepository}/git/ref/heads/master`;
  return requestWithAuth(url);
}

function createBranch(sha, branch) {
  const url = `https://api.github.com/repos/${config.githubFork}/git/refs`;
  const ref = `refs/heads/${branch}`;
  return requestWithAuth(`POST ${url}`, { sha, ref });
}

function createFile(path, branch, content) {
  const url = `https://api.github.com/repos/${config.githubFork}/contents/${path}`;
  const message = `Création de fichier ${path} sur la branche ${branch}`;
  content = Buffer.from(content, 'utf-8').toString('base64');

  return requestWithAuth(`PUT ${url}`, { message, content, branch });
}

function makePullRequest(branch, title) {
  const url = `https://api.github.com/repos/${config.githubRepository}/pulls`;
  const head = `${config.githubFork.split('/')[0]}:${branch}`;
  const base = 'master';

  return requestWithAuth(`POST ${url}`, { title, head, base });
}

async function createGithubAuthor(username, content) {
  const refRegex = /( |\.|\\|~|^|:|\?|\*|\[)/gm;
  const branch = `author${username.replace(refRegex, '-')}`;

  console.log(`Début de la création de fiche pour ${username}...`)

  await getMasterSha()
    .then(response => {
      const sha = response.data.object.sha;
      console.log(`SHA du master obtenu`);
      return createBranch(sha, branch);
    })
    .then(() => {
      console.log(`Branche ${branch} créée`);
      const path = `content/_authors/${username}.md`
      return createFile(path, branch, content)
      .catch(err => {
        if (err.status === 422)
          throw new Error(`Une fiche avec l\'utilisateur ${username} existe déjà`);
        throw err;
      });;
    })
    .then(() => {
      console.log(`Fiche Github pour ${username} créée dans la branche ${branch}`);
      return makePullRequest(branch, `Création de fiche pour ${username}`);
    })
    .then(() => {
      console.log(`Pull request pour la fiche de ${username} ouverte`);
    });
}

module.exports.getForm = async function (req, res) {
  try {
    res.render('onboarding', {
      errors: req.flash('error'),
      messages: req.flash('message'),
    });
  } catch (err) {
    console.error(err);
    res.send(err);
  }
}
module.exports.postForm = async function (req, res) {
  try {
    function throwValidationError(field) {
      throw new Error(`Le champ ${field} n'est pas renseigné`);
    }

    const firstName = req.body.firstName || throwValidationError('firstName');
    const lastName = req.body.lastName || throwValidationError('lastName');
    const website = req.body.website || null;
    const github = req.body.github || null;
    const role = req.body.role || throwValidationError('role');
    const start = req.body.start || throwValidationError('start');
    const end = req.body.end || throwValidationError('end');
    const status = req.body.status || throwValidationError('status');
    const startup = req.body.startup || null;
    const employer = req.body.employer || null;

    const name = `${firstName} ${lastName}`;
    const username = createUsername(firstName, lastName);
    const content = await ejs.renderFile("./views/githubAuthor.ejs", {
      name,
      website,
      github,
      role,
      start,
      end,
      status,
      startup,
      employer
    });
    await createGithubAuthor(username, content);
    res.redirect('/onboardingSuccess');

  } catch (err) {
    console.error(err);
    req.flash('error', err.message);
    return res.redirect('/onboarding');
  }
}
module.exports.getConfirmation = async function (req, res) {
  try {
    res.render('onboardingSuccess', {
      pullRequestsUrl: `https://github.com/${config.githubRepository}/pulls`,
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
}
