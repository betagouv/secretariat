import ejs from "ejs";
import crypto from "crypto";
import fetch from "node-fetch";
import config from "../config";
import * as utils from "./utils";
import BetaGouv from "../betagouv";
import knex from "../db";
import { isValidGithubUserName } from "../lib/github";


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
      return utils.createGithubFile(path, branch, content);
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
      utils.deleteGithubBranch(branch);
      console.log(`Branche ${branch} supprimée`);
      if (err.status === 422) {
        throw new Error(`Une fiche pour ${username} existe déjà`);
      } else {
        throw new Error(`Erreur Github lors de la création de la fiche de ${username}`);
      }
    });
  return prInfo;
}

export async function getForm(req, res) {
  try {
    const startups = await BetaGouv.startupsInfos();
    const users = await BetaGouv.usersInfos();
    const userAgent = Object.prototype.hasOwnProperty.call(req.headers, 'user-agent') ? req.headers['user-agent'] : null;
    const isMobileFirefox = userAgent && /Android.+Firefox\//.test(userAgent);
    const title = 'Créer ma fiche';
    return res.render('onboarding', {
      domain: config.domain,
      title,
      errors: req.flash('error'),
      formValidationErrors: {},
      messages: req.flash('message'),
      userConfig: config.user,
      users,
      startups,
      formData: {
        firstName: '',
        lastName: '',
        description: '',
        website: '',
        github: '',
        role: '',
        domaine: '',
        start: new Date().toISOString().split('T')[0], // current date in YYYY-MM-DD format
        end: '',
        status: '',
        startup: '',
        employer: '',
        badge: '',
        email: '',
        emailBeta: '',
      },
      useSelectList: isMobileFirefox,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', `Impossible de récupérer la liste des startups sur ${config.domain}`);
    return res.redirect('/');
  }
}

export async function postForm(req, res) {
  const formValidationErrors = {};
  try {
    const requiredError = function (field) {
      formValidationErrors[field] = 'Le champ n‘est pas renseigné';
    }

    const isValidDate = function (field, date) {
      if (date instanceof Date && !Number.isNaN(date.getTime())) {
        return date;
      }
      formValidationErrors[field] = 'La date n‘est pas valide';
      return null;
    }

    const isValidUrl = function (field, url) {
      if (!url || url.indexOf('http') === 0) {
        return url;
      }
      formValidationErrors[field] = 'L‘URL ne commence pas avec http ou https';
      return null;
    }

    const shouldBeOnlyUsername = function (field, value) {
      if (isValidGithubUserName(value)) {
        return value;
      }
      formValidationErrors[field] = 'La valeur doit être le nom du membre seul et ne doit pas être l‘URL du membre ni commencer avec "@"';
      return null;
    }

    const isValidEmail = function (field, email) {
      if (!email) {
        requiredError(field);
        return null;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        return email;
      }
      formValidationErrors[field] = 'L‘adresse email n‘est pas valide';
      return null;
    }

    const isValidDomain = function (field, domain) {
      if (!domain) {
        requiredError(field);
        return null;
      }
      if (['Animation',
        'Coaching',
        'Déploiement',
        'Design',
        'Développement',
        'Intraprenariat',
        'Produit',
        'Autre'].includes(domain)) {
        return domain;
      }
      formValidationErrors[field] = 'Le domaine n‘est pas valide';
      return null;
    }
    const isPublicServiceEmail = async function (field, email, emailBetaAsked) {
      const response = await fetch("https://matrix.agent.tchap.gouv.fr/_matrix/identity/api/v1/info?medium=email&address=" + String(email).toLowerCase())
			const data = await response.json();
        if (data.hs === "agent.externe.tchap.gouv.fr" && !emailBetaAsked) {
          formValidationErrors[field] = '⚠ L‘email beta gouv est obligatoire si vous n‘avez pas déjà de compte email appartenant à une structure publique'
          return null;
        } else {
          return email
        }
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
    const referent = req.body.referent || requiredError('référent');
    const domaine = isValidDomain('domaine', req.body.domaine);
    const email = isValidEmail('email pro/perso', req.body.email);
    const emailBetaAsked = req.body.emailBeta;
    const publicServiceEmail = await isPublicServiceEmail('email public', email, emailBetaAsked);

    const website = isValidUrl('Site personnel', req.body.website);
    const github = shouldBeOnlyUsername('Utilisateur Github', req.body.github);

    const startDate = isValidDate('date de début', new Date(start));
    const endDate = isValidDate('date de fin', new Date(end));
    if (startDate && endDate) {
      if (startDate < new Date(config.user.minStartDate)) {
        formValidationErrors['date de début'] = `La date doit être au moins ${config.user.minStartDate}`;
      }
      if (endDate < startDate) {
        formValidationErrors['date de fin'] = 'La date doit être supérieure à la date de début';
      }
    }

    if (Object.keys(formValidationErrors).length) {
      req.flash('error', 'Un champs du formulaire est invalide ou manquant.');
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
      domaine,
    });
    const prInfo = await createNewcomerGithubFile(username, content, referent);

    if (referent && prInfo.status === 201 && prInfo.data.html_url) {
      const referentEmailInfos = await BetaGouv.emailInfos(referent);
      if (referentEmailInfos && referentEmailInfos.email) {
        const prUrl = prInfo.data.html_url;
        const userUrl = `${config.protocol}://${config.host}/community/${username}`;
        const html = await ejs.renderFile('./views/emails/onboardingReferent.ejs', {
          referent, prUrl, name, userUrl, emailBetaAsked
        });
        await utils.sendMail(referentEmailInfos.email, `${name} vient de créer sa fiche Github`, html);
      }
    }
    // WIP  Null pour savoir si une adresse mail est necessaire pour plus loin dans le code,
    // Si il y a une adresse publique, c'est qu'il n'y a pas besoin de creer le mail
    const primaryEmail = emailBetaAsked ? null : publicServiceEmail;
    const secondaryEmail = emailBetaAsked ? email : null

    await knex('users')
      .insert({
        username,
        primary_email: primaryEmail,
        secondary_email: secondaryEmail
      })
      .onConflict('username')
      .merge();

    const prUrl = `https://github.com/${config.githubRepository}/pull/${prInfo.data.number}`;
    res.render(`onboardingSuccess`, { prUrl , emailBetaAsked })

  } catch (err) {
    if (err.message) {
      req.flash('error', err.message);
    }
    const startups = await BetaGouv.startupsInfos();
    const users = await BetaGouv.usersInfos();
    const userAgent = Object.prototype.hasOwnProperty.call(req.headers, 'user-agent') ? req.headers['user-agent'] : null;
    const isMobileFirefox = userAgent && /Android.+Firefox\//.test(userAgent);
    res.render('onboarding', {
      errors: req.flash('error'),
      formValidationErrors,
      messages: req.flash('message'),
      userConfig: config.user,
      startups,
      domain: config.domain,
      users,
      formData: req.body,
      useSelectList: isMobileFirefox,
    });
  }
}
