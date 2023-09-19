import ejs from "ejs";
import crypto from "crypto";
import { Schema } from 'express-validator'

import config from "@config";
import * as utils from "@controllers/utils";
import BetaGouv from "@/betagouv";
import knex from "@/db";
import { requiredError, isValidDomain, isValidDate, isValidUrl, shouldBeOnlyUsername, isValidEmail } from "@controllers/validator"
import { CommunicationEmailCode, EmailStatusCode, MemberType, genderOptions, statusOptions } from '@/models/dbUser/dbUser';
import { fetchCommuneDetails } from "@/lib/searchCommune";
import { OnboardingPage } from '@/views';
import { DOMAINE_OPTIONS } from "@/models/member";
import { getGithubMasterSha, createGithubBranch, createGithubFile, makeGithubPullRequest, deleteGithubBranch, PRInfo } from "@/lib/github";
import { createUsername } from "../helpers/githubHelpers/createContentName";

function createBranchName(username) {
    const refRegex = /( |\.|\\|~|^|:|\?|\*|\[)/gm;
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    return `author${username.replace(refRegex, '-')}-${randomSuffix}`;
}

async function createNewcomerGithubFile(username, content, referent) {
    const branch = createBranchName(username);
    console.log(`Début de la création de fiche pour ${username}...`);
  
    const prInfo = await getGithubMasterSha()
      .then((response) => {
        const { sha } = response.data.object;
        console.log('SHA du master obtenu');
        return createGithubBranch(sha, branch);
      })
      .then(() => {
        console.log(`Branche ${branch} créée`);
        const path = `content/_authors/${username}.md`;
        return createGithubFile(path, branch, content);
      })
      .then(() => {
        console.log(`Fiche Github pour ${username} créée dans la branche ${branch}`);
        return makeGithubPullRequest(branch, `Création de fiche pour ${username}. Référent : ${referent || 'pas renseigné'}.`);
      })
      .then((response) => {
        if (response.status !== 201 && response.data.html_url) {
            throw new Error('Il y a eu une erreur merci de recommencer plus tard')
        }
        console.log(`Pull request pour la fiche de ${username} ouverte`);
        return response.data;
      })
      .catch((err) => {
        deleteGithubBranch(branch);
        console.log(`Branche ${branch} supprimée`);
        if (err.status === 422) {
          throw new Error(`Une fiche pour ${username} existe déjà`);
        } else {
          throw new Error(`Erreur Github lors de la création de la fiche de ${username}`);
        }
      });
    return prInfo;
}

export const postFormSchema: Schema = {
    firstName: {
      trim: true, 
      blacklist: {
        options: ['<>&"/']
      },
      notEmpty: {
      errorMessage: 'Le nom de famille est obligatoire',
    }},
    lastName: { trim: true,
      blacklist: {
        options: ['<>&"/']
      },
      notEmpty: {
      errorMessage: 'Le prénom  est obligatoire',
    }},
    description: {
      trim: true,
      blacklist: {
        options: ['<>&/']
      },
    },
    role: {
      trim: true,
      escape: true,
      notEmpty: {
        errorMessage: 'Le role est obligatoire',
      }
    },
    start: {
      escape: true
    },
    end: {
      escape: true
    },
    employer: {
      escape: true
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
      const should_create_marrainage = req.body.should_create_marrainage === 'true' || false;
      const hasPublicServiceEmail = await utils.isPublicServiceEmail(inputEmail);
      const gender = req.body.gender
      const osm_city = req.body.osm_city
      const workplace_insee_code = req.body.workplace_insee_code
      const tjm = req.body.tjm || null;
      const legal_status = req.body.legal_status
      const average_nb_of_days = req.body.average_nb_of_days
      const memberType = req.body.memberType || requiredError('memberType', errorHandler);

      if (legal_status && !statusOptions.map(statusOption => statusOption.key).includes(legal_status)) {
        errorHandler('legal_status', `Le statut legal n'a pas une valeur autorisée`)
      }
      if (gender && !genderOptions.map(genderOption => genderOption.key).includes(gender)) {
        errorHandler('gender', `Le genre n'a pas une valeur autorisé`)
      }
      if (workplace_insee_code && ! await fetchCommuneDetails(req.body.workplace_insee_code)) {
        errorHandler('workplace_insee_code', `Le lieu de travail principal n'as pas été trouvé`)
      }
      if (!hasPublicServiceEmail && !isEmailBetaAsked) {
        errorHandler(
          'email public',
          '⚠ L‘email beta gouv est obligatoire si vous n‘avez pas déjà de compte email appartenant à une structure publique'
        );
      }

      if (memberType && !config.user.memberOptions.map(opt => opt.key).includes(memberType)) {
        errorHandler('memberType', `Le type de membre n'est pas une valeur autorisée.`)
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
      const username = createUsername(firstName, lastName);
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
        memberType
      });
      const prInfo : PRInfo = await createNewcomerGithubFile(username, content, referent);
      let primary_email, secondary_email;
      if (isEmailBetaAsked) {
        // primaryEmail sera l'email beta qui sera créé en asynchrone
        secondary_email = inputEmail;
      } else {
        primary_email = inputEmail;
      }
      const hasChosenSecondaryEmail = req.body.communication_email === CommunicationEmailCode.SECONDARY && secondary_email
      const communication_email = hasChosenSecondaryEmail ? CommunicationEmailCode.SECONDARY : CommunicationEmailCode.PRIMARY

      await knex('users')
        .insert({
          username,
          primary_email,
          tjm,
          gender,
          workplace_insee_code,
          legal_status,
          secondary_email,
          member_type: memberType,
          communication_email,
          primary_email_status: isEmailBetaAsked ? EmailStatusCode.EMAIL_UNSET : EmailStatusCode.EMAIL_ACTIVE,
          primary_email_status_updated_at: new Date(),
          should_create_marrainage,
          osm_city,
          average_nb_of_days,
          email_is_redirection: memberType === MemberType.ATTRIBUTAIRE,
        })
        .onConflict('username')
        .merge();

      await knex('user_details')
        .insert({
          hash: utils.computeHash(username),
          tjm,
          gender,
          average_nb_of_days
        })
        .onConflict('hash')
        .merge();
      
      await knex('pull_requests').insert({
        username,
        url: prInfo.html_url,
        info: JSON.stringify({
          startup,
          username,
          referent,
          name,
          isEmailBetaAsked
        })
      })
  
      res.redirect(`/onboardingSuccess/${prInfo.number}?isEmailBetaAsked=${isEmailBetaAsked}`);
    } catch (err) {
      if (err.message) {
        req.flash('error', err.message);
      }
      const startups = await BetaGouv.startupsInfos();
      const startupOptions = startups.map(startup => {
        return {
          value: startup.id,
          label: startup.attributes.name
        }
      })
      const allUsers = await BetaGouv.usersInfos();
      const users = await BetaGouv.getActiveUsers();
      res.send(OnboardingPage({
        errors: req.flash('error'),
        formValidationErrors,
        messages: req.flash('message'),
        userConfig: config.user,
        startups,
        statusOptions,
        startupOptions,
        genderOptions,
        request: req,
        domaineOptions: DOMAINE_OPTIONS,
        communeInfo: req.body.workplace_insee_code ? await fetchCommuneDetails(req.body.workplace_insee_code) : null,
        users,
        allUsers,
        formData: req.body,
      }));
    }
  }
