const ejs = require('ejs');
const crypto = require('crypto');

const config = require('../config');
const utils = require('./utils');
const BetaGouv = require('../betagouv');

function createBranchName(username) {
  const refRegex = /( |\.|\\|~|^|:|\?|\*|\[)/gm;
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  return `author${username.replace(refRegex, '-')}-${randomSuffix}`;
}

async function createNewcomerGithubFile(username, content, referent) {
  const branch = createBranchName(username);
  console.log(`Début de la création de fiche pour ${username}...`);

  const prInfo = await utils.getGithubMasterSha()
    .then((response) => {
      const { sha } = response.data.object;
      console.log('SHA du master obtenu');
      return utils.createGithubBranch(sha, branch);
    })
    .then(() => {
      console.log(`Branche ${branch} créée`);
      const path = `content/_authors/${username}.md`;
      return utils.createGithubFile(path, branch, content)
        .catch((err) => {
          if (err.status === 422) throw new Error(`Une fiche avec l'utilisateur ${username} existe déjà`);
          throw err;
        });
    })
    .then(() => {
      console.log(`Fiche Github pour ${username} créée dans la branche ${branch}`);
      return utils.makeGithubPullRequest(branch, `Création de fiche pour ${username}. Référent : ${referent || 'pas renseigné'}.`);
    })
    .then((response) => {
      console.log(`Pull request pour la fiche de ${username} ouverte`);
      return response;
    })
    .catch((err) => {
      throw new Error(`Erreur Github lors de la création de la fiche de ${username}`);
    });
  return prInfo;
}

module.exports.getForm = async function (req, res) {
  try {
    const startups = await BetaGouv.startupsInfos();
    const users = await BetaGouv.usersInfos();
    const userAgent = Object.prototype.hasOwnProperty.call(req.headers, 'user-agent') ? req.headers['user-agent'] : null;
    const isMobileFirefox = userAgent && /Android.+Firefox\//.test(userAgent);
    const title = 'Créer ma fiche';
    return res.render('onboarding', {
      title,
      errors: req.flash('error'),
      messages: req.flash('message'),
      memberConfig: config.member,
      users,
      startups,
      formData: {
        firstName: '',
        lastName: '',
        description: '',
        website: '',
        github: '',
        role: '',
        start: new Date().toISOString().split('T')[0], // current date in YYYY-MM-DD format
        end: '',
        status: '',
        startup: '',
        employer: '',
        badge: '',
      },
      useSelectList: isMobileFirefox,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', `Impossible de récupérer la liste des startups sur ${config.domain}`);
    return res.redirect('/');
  }
};

module.exports.postForm = async function (req, res) {
  try {
    const formValidationErrors = [];

    function requiredError(field) {
      formValidationErrors.push(`${field} : le champ n'est pas renseigné`);
    }

    function isValidDate(field, date) {
      if (date instanceof Date && !Number.isNaN(date.getTime())) {
        return date;
      }
      formValidationErrors.push(`${field} : la date n'est pas valide`);
      return null;
    }

    function isValidUrl(field, url) {
      if (!url || url.indexOf('http') === 0) {
        return url;
      }
      formValidationErrors.push(`${field} : l'URL ne commence pas avec http ou https`);
      return null;
    }

    function shouldBeOnlyUsername(field, value) {
      if (!value || (!value.startsWith('http') && !value.startsWith('https') && !value.includes('/'))) {
        return value;
      }
      formValidationErrors.push(`${field} : la valeur doit être le nom d'utilisateur seul et ne doit pas être l'URL de l'utilisateur`);
      return null;
    }

    const firstName = req.body.firstName || requiredError('prénom');
    const lastName = req.body.lastName || requiredError('nom de famille');
    const description = req.body.description || null;
    const role = req.body.role || requiredError('role');
    const start = req.body.start || requiredError('début de la mission');
    const end = req.body.end || requiredError('fin de la mission');
    const status = req.body.status || requiredError('statut');
    const startup = req.body.startup || null;
    const employer = req.body.employer || null;
    const badge = req.body.badge || null;
    const referent = req.body.referent || null;

    const website = isValidUrl('Site personnel', req.body.website);
    const github = shouldBeOnlyUsername('Utilisateur Github', req.body.github);

    const startDate = isValidDate('date de début', new Date(start));
    const endDate = isValidDate('date de fin', new Date(end));
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
    const content = await ejs.renderFile('./views/markdown/githubAuthor.ejs', {
      name,
      description,
      website,
      github,
      role,
      start,
      end,
      status,
      startup,
      employer,
      badge,
    });
    const prInfo = await createNewcomerGithubFile(username, content, referent);

    if (referent && prInfo.status === 201 && prInfo.data.html_url) {
      const referentEmailInfos = await BetaGouv.emailInfos(referent);
      if (referentEmailInfos && referentEmailInfos.email) {
        const prUrl = prInfo.data.html_url;
        const memberUrl = `${config.protocol}://${config.host}/community/${username}}`;
        const html = await ejs.renderFile('./views/emails/onboardingReferent.ejs', {
          referent, prUrl, name, memberUrl,
        });
        await utils.sendMail(referentEmailInfos.email, `${name} vient de créer sa fiche Github`, html);
      }
    }
    res.redirect(`/onboardingSuccess/${prInfo.data.number}`);
  } catch (err) {
    req.flash('error', err.message);
    const startups = await BetaGouv.startupsInfos();
    const users = await BetaGouv.usersInfos();
    const userAgent = Object.prototype.hasOwnProperty.call(req.headers, 'user-agent') ? req.headers['user-agent'] : null;
    const isMobileFirefox = userAgent && /Android.+Firefox\//.test(userAgent);
    res.render('onboarding', {
      errors: req.flash('error'),
      messages: req.flash('message'),
      memberConfig: config.member,
      startups,
      users,
      formData: req.body,
      useSelectList: isMobileFirefox,
    });
  }
};
module.exports.getConfirmation = async function (req, res) {
  try {
    const { prNumber } = req.params;
    const prUrl = `https://github.com/${config.githubRepository}/pull/${prNumber}`;
    res.render('onboardingSuccess', { prUrl });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};
