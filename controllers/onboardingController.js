const ejs = require('ejs');
const crypto = require('crypto');

const config = require('../config');
const utils = require('./utils');
const BetaGouv = require('../betagouv');

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
    const startups = await BetaGouv.startupsInfos();
    res.render('onboarding', {
      errors: req.flash('error'),
      messages: req.flash('message'),
      memberConfig: config.member,
      startups: startups,
      formData: {
        firstName: "",
        lastName: "",
        description: "",
        website: "",
        github: "",
        role: "",
        start: new Date().toISOString().split('T')[0], // current date in YYYY-MM-DD format
        end: "",
        status: "",
        startup: "",
        employer: ""
      }
    });
  } catch (err) {
    console.error(err);
    req.flash('error', `Erreur interne: impossible de récupérer la liste des startups sur ${config.domain}`);
    res.send(err);
  }
}
module.exports.postForm = async function (req, res) {
  try {
    var formValidationErrors = [];

    function requiredError(field) {
      formValidationErrors.push(`${field} : le champ n'est pas renseigné`);
    }

    function isValidDate(field, date) {
      if (date instanceof Date && !isNaN(date)) {
        return date;
      } else {
        formValidationErrors.push(`${field} : la date n'est pas valide`);
        return null;
      }
    }

    const firstName = req.body.firstName || requiredError('prénom');
    const lastName = req.body.lastName || requiredError('nom de famille');
    const description = req.body.description || null;
    const website = req.body.website || null;
    const github = req.body.github || null;
    const role = req.body.role || requiredError('role');
    const start = req.body.start || requiredError('début de la mission');
    const end = req.body.end || requiredError('fin de la mission');
    const status = req.body.status || requiredError('statut');
    const startup = req.body.startup || null;
    const employer = req.body.employer || null;

    // check start & end dates
    startDate = isValidDate('date de début', new Date(start));
    endDate = isValidDate('date de fin', new Date(end));
    if (startDate && endDate) {
      if (startDate < new Date(config.member.minStartDate)) {
        formValidationErrors.push(`date de début : la date doit être au moins ${config.member.minStartDate}`);
      }
      if (endDate < startDate) {
        formValidationErrors.push('date de fin : la date doit être supérieure à la date de début');
      }
    }

    if (formValidationErrors.length) {
      req.flash('error', formValidationErrors);
      throw new Error();
    }

    const name = `${firstName} ${lastName}`;
    const username = utils.createUsername(firstName, lastName);
    const content = await ejs.renderFile("./views/markdown/githubAuthor.ejs", {
      name,
      description,
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
    const startups = await BetaGouv.startupsInfos();
    res.render('onboarding', {
      errors: req.flash('error'),
      messages: req.flash('message'),
      memberConfig: config.member,
      startups: startups,
      formData: req.body
    });
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
