const config = require('../config');
const ejs = require('ejs');
const utils = require('./utils');

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

async function createGithubAuthor(username, content) {
  const refRegex = /( |\.|\\|~|^|:|\?|\*|\[)/gm;
  const branch = `author${username.replace(refRegex, '-')}`;

  console.log(`Début de la création de fiche pour ${username}...`)

  await utils.getGithubMasterSha()
    .then(response => {
      const sha = response.data.object.sha;
      console.log(`SHA du master obtenu`);
      return utils.createGithubBranch(sha, branch);
    })
    .then(() => {
      console.log(`Branche ${branch} créée`);
      const path = `content/_authors/${username}.md`
      return utils.createGithubFile(path, branch, content)
      .catch(err => {
        if (err.status === 422)
          throw new Error(`Une fiche avec l\'utilisateur ${username} existe déjà`);
        throw err;
      });;
    })
    .then(() => {
      console.log(`Fiche Github pour ${username} créée dans la branche ${branch}`);
      return utils.makeGithubPullRequest(branch, `Création de fiche pour ${username}`);
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

    const firstName = req.body.firstName || throwValidationError('prénom');
    const lastName = req.body.lastName || throwValidationError('nom de famille');
    const website = req.body.website || null;
    const github = req.body.github || null;
    const role = req.body.role || throwValidationError('role');
    const start = req.body.start || throwValidationError('début de la mission');
    const end = req.body.end || throwValidationError('fin de la mission');
    const status = req.body.status || throwValidationError('statut');
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
