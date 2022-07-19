import ejs from "ejs";
import crypto from "crypto";
import config from "../config";
import * as utils from "./utils";
import BetaGouv from "../betagouv";
import knex from "../db";
import { requiredError, isValidDomain, isValidDate, isValidUrl, shouldBeOnlyUsername, isValidEmail } from "./validator"
import { CommunicationEmailCode, DBUserDetail, DBUser, EmailStatusCode, genderOptions, statusOptions } from '../models/dbUser';
import { renderHtmlFromMd } from "../lib/mdtohtml";
import * as mattermost from '../lib/mattermost';
import { fetchCommuneDetails } from "../lib/searchCommune";
import { OnboardingPage } from '../views';

function createBranchName(username) {
  const refRegex = /( |\.|\\|~|^|:|\?|\*|\[)/gm;
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  return `author${username.replace(refRegex, '-')}-${randomSuffix}`;
}

interface IMessageInfo {
  prInfo,
  referent: string,
  username: string,
  isEmailBetaAsked: boolean,
  name: string
}

async function sendMessageToReferent({ prInfo, referent, username, isEmailBetaAsked, name }: IMessageInfo) {
  const dbReferent = await knex('users').where({ username: referent }).first();
  const prUrl = prInfo.data.html_url;
  const userUrl = `${config.protocol}://${config.host}/community/${username}`;
  const messageContent = await ejs.renderFile('./src/views/templates/emails/onboardingReferent.ejs', {
    referent: referent, prUrl, name, userUrl, isEmailBetaAsked
  });
  const email = dbReferent.communication_email === CommunicationEmailCode.SECONDARY && dbReferent.secondary_email ? dbReferent.secondary_email : dbReferent.primary_email
  await utils.sendMail(
    email,
    `${name} vient de créer sa fiche Github`,
    renderHtmlFromMd(messageContent)
  );
  try {
    const [mattermostUser] : mattermost.MattermostUser[] = await mattermost.searchUsers({
      term: referent
    })
    await BetaGouv.sendInfoToChat(
      messageContent,
      'secretariat',
      mattermostUser.username
    );
  } catch (e) {
    console.error('It was not able to send message to referent on mattermost', e)
  }
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
    const [dbUser, dbUserDetail] : [DBUser, DBUserDetail] = await Promise.all([
      (async () => {
        const rows = await knex('users').where({ username: req.auth.id });
        return rows.length === 1 ? rows[0] : null;
      })(),
      (async () => {
        const hash = utils.computeHash(req.auth.id)
        const rows = await knex('user_details').where({ hash });
        return rows.length === 1 ? rows[0] : {};
      })(),
    ]);
    const title = 'Mon compte';
    const formValidationErrors = {}
    const startups = await BetaGouv.startupsInfos();
    const startupOptions = startups.map(startup => {
      return {
        value: startup.id,
        label: startup.attributes.name
      }
    })
    res.send(
      OnboardingPage({
        title,
        formValidationErrors,
        currentUserId: req.auth.id,
        startups,
        genderOptions,
        statusOptions,
        startupOptions,
        activeTab: 'account',
        communeInfo: dbUser.workplace_insee_code ? await fetchCommuneDetails(dbUser.workplace_insee_code) : null,
        formData: {
          gender: dbUserDetail.gender,
          workplace_insee_code: dbUser.workplace_insee_code,
          tjm: dbUserDetail.tjm,
          legal_status: dbUser.legal_status,
          secondary_email: dbUser.secondary_email,
          osm_city: dbUser.osm_city,
        },
        errors: req.flash('error'),
        messages: req.flash('message'),
        request: req
      })
    )
  } catch (err) {
    console.error(err);
    req.flash('error', 'Impossible de récupérer vos informations.');
    return res.redirect('/');
  }
}


export async function postForm(req, res) {
  const formValidationErrors = {};
  const errorHandler = (field, message) => {
    formValidationErrors[field] = message
  }
  try {
    const firstName = req.body.firstName || requiredError('prénom', errorHandler);
    const lastName = req.body.lastName || requiredError('nom de famille', errorHandler);
    const description = req.body.description || null;
    const role = req.body.role || requiredError('role', errorHandler);
    const start = req.body.start || requiredError('début de la mission', errorHandler);
    const end = req.body.end || requiredError('fin de la mission', errorHandler);
    const status = req.body.status || requiredError('statut', errorHandler);
    const startup = req.body.startup || null;
    const employer = req.body.employer || null;
    const badge = req.body.badge || null;
    const referent = req.body.referent || requiredError('référent', errorHandler);
    const domaine = isValidDomain('domaine', req.body.domaine, errorHandler) ? req.body.domaine : null;
    const inputEmail = isValidEmail('email pro/perso', req.body.email, errorHandler) ? req.body.email : null;
    const isEmailBetaAsked = req.body.isEmailBetaAsked === 'true' || false;
    const hasPublicServiceEmail = await utils.isPublicServiceEmail(inputEmail);
    const gender = req.body.gender
    const workplace_insee_code = req.body.workplace_insee_code
    const tjm = req.body.tjm || null;
    const legal_status = req.body.legal_status

    if (legal_status && !statusOptions.map(statusOption => statusOption.key).includes(legal_status)) {
      errorHandler('legal_status', `Le statut legal n'a pas une valeur autorisé`)
    }
    if (gender && !genderOptions.map(genderOption => genderOption.key).includes(gender)) {
      errorHandler('gender', `Le genre n'a pas une valeur autorisé`)
    }
    if (workplace_insee_code && ! await fetchCommuneDetails(req.body.workplace_insee_code)) {
      errorHandler('workplace_insee_code', `La lieu de travail principal n'as pas été trouvé`)
    }
    if (!hasPublicServiceEmail && !isEmailBetaAsked) {
      errorHandler(
        'email public',
        '⚠ L‘email beta gouv est obligatoire si vous n‘avez pas déjà de compte email appartenant à une structure publique'
      );
    }
    const website = isValidUrl('Site personnel', req.body.website, errorHandler);
    const github = shouldBeOnlyUsername('Utilisateur Github', req.body.github, errorHandler);

    const startDate = isValidDate('date de début', new Date(start), errorHandler);
    const endDate = isValidDate('date de fin', new Date(end), errorHandler);
    if (startDate && endDate) {
      if (startDate < new Date(config.user.minStartDate)) {
        formValidationErrors['date de début'] = `La date doit être au moins ${config.user.minStartDate}`;
      }
      if (endDate < startDate) {
        formValidationErrors['date de fin'] = 'La date doit être supérieure à la date de début';
      }
    }

    const userExists = await knex('users')
      .where('primary_email', inputEmail)
      .orWhere('secondary_email', inputEmail)
      .first();

    if (userExists) {
      formValidationErrors['utilisateur existant'] =
        'Un compte utilisateur existe déjà avec cet email';
    }

    if (Object.keys(formValidationErrors).length) {
      req.flash('error', 'Un champs du formulaire est invalide ou manquant.');
      throw new Error();
    }

    const name = `${firstName} ${lastName}`;
    const username = utils.createUsername(firstName, lastName);
    const content = await ejs.renderFile('./src/views/templates/markdown/githubAuthor.ejs', {
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

    if (prInfo.status === 201 && prInfo.data.html_url) {
      await sendMessageToReferent({
        prInfo,
        referent,
        isEmailBetaAsked,
        username,
        name
      })
    }
    let primaryEmail, secondaryEmail;
    if (isEmailBetaAsked) {
      // primaryEmail sera l'email beta qui sera créé en asynchrone
      secondaryEmail = inputEmail;
    } else {
      primaryEmail = inputEmail;
    }
    await knex('users')
      .insert({
        username,
        primary_email: primaryEmail,
        tjm,
        gender,
        workplace_insee_code,
        legal_status,
        secondary_email: secondaryEmail,
        primary_email_status: isEmailBetaAsked ? EmailStatusCode.EMAIL_UNSET : EmailStatusCode.EMAIL_ACTIVE,
        primary_email_status_updated_at: new Date()
      })
      .onConflict('username')
      .merge();
    
    await knex('user_details')
      .insert({
        hash: utils.computeHash(username),
        tjm,
        gender,
      })
      .onConflict('hash')
      .merge();

    res.redirect(`/onboardingSuccess/${prInfo.data.number}?isEmailBetaAsked=${isEmailBetaAsked}`);
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
      statusOptions,
      genderOptions,
      communeInfo: req.body.workplace_insee_code ? await fetchCommuneDetails(req.body.workplace_insee_code) : null,
      domain: config.domain,
      users,
      formData: req.body,
      useSelectList: isMobileFirefox,
    });
  }
}

export async function getConfirmation(req, res) {
  try {
    const { prNumber } = req.params;
    const { isEmailBetaAsked } = req.query
    const prUrl = `https://github.com/${config.githubRepository}/pull/${prNumber}`;
    res.render('onboardingSuccess', { prUrl, isEmailBetaAsked });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
}
