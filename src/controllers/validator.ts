import { isValidGithubUserName } from "../lib/github";
import * as utils from "./utils";

export const requiredError = function (field, callback) {
    callback(field, 'Le champ n‘est pas renseigné');
  }

  export const isValidDate = function (field, date, callback) {
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      return date;
    }
    callback(field, 'La date n‘est pas valide');
    return null;
  }

  export const isValidUrl = function (field, url, callback) {
    if (!url || url.indexOf('http') === 0) {
      return url;
    }
    callback(field, 'L‘URL ne commence pas avec http ou https');
    return null;
  }

  export const shouldBeOnlyUsername = function (field, value, callback) {
    if (isValidGithubUserName(value)) {
      return value;
    }
    callback(field, 'La valeur doit être le nom du membre seul et ne doit pas être l‘URL du membre ni commencer avec "@"');
    return null;
  }

  export const isValidEmail = function (field, email, callback) {
    if (!email) {
      requiredError(field, callback);
      return null;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      return email;
    }
    callback(field, 'L‘adresse email n‘est pas valide');
    return null;
  }

  export const isValidDomain = function (field, domain, callback) {
    if (!domain) {
      requiredError(field, callback);
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
    callback('Le domaine n‘est pas valide');
    return null;
  }

  export const requiredEmail = async function(field, email, isEmailBetaAsked, callback) {
    const publicServiceEmail = await utils.isPublicServiceEmail(email);
    if (!publicServiceEmail && !isEmailBetaAsked) {
      callback('⚠ L‘email beta gouv est obligatoire si vous n‘avez pas déjà de compte email appartenant à une structure publique');
      return null;
    }
    return email;
  }