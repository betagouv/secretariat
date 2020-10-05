const config = require('../config');
const ejs = require('ejs');
const utils = require('./utils');
const crypto = require('crypto');

function createBranchName(username) {
  const refRegex = /( |\.|\\|~|^|:|\?|\*|\[)/gm;
  const randomSuffix = crypto.randomBytes(3).toString('hex')
  return `author${username.replace(refRegex, '-')}-${randomSuffix}`;
}

async function createNewcomerGithubFile(username, content) {
  const branch = createBranchName(username)
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
    const username = utils.createUsername(firstName, lastName);
    const content = await ejs.renderFile("./views/markdown/githubAuthor.ejs", {
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
    await createNewcomerGithubFile(username, content);
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
