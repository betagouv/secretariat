import { isValidGithubUserName } from "@/lib/github";

type ValidatorCalback = (field: string, message: string) => void

export const requiredError = function (field: string, callback: ValidatorCalback) {
    callback(field, 'Le champ n‘est pas renseigné');
  }

export const isValidDate = function (field: string, date: Date, callback: ValidatorCalback) {
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    return date;
  }
  callback(field, 'La date n‘est pas valide');
  return null;
}

export const isValidUrl = function (field: string, url: string, callback: ValidatorCalback) {
  if (!url || url.indexOf('http') === 0) {
    return url;
  }
  callback(field, 'L‘URL ne commence pas avec http ou https');
  return null;
}

export const shouldBeOnlyUsername = function (field: string, value: string, callback: ValidatorCalback) {
  if (isValidGithubUserName(value)) {
    return value;
  }
  callback(field, 'La valeur doit être le nom du membre seul et ne doit pas être l‘URL du membre ni commencer avec "@"');
  return null;
}

export const isValidEmail = function (field: string, email: string, callback: ValidatorCalback) {
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

export const isValidDomain = function (field:string, domain: string, callback: ValidatorCalback) {
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
  callback(field, 'Le domaine n‘est pas valide');
  return null;
}

export function isValidPhoneNumber(field: string, number: string, callback: ValidatorCalback) {
  if (!number) {
    requiredError(field, callback);
    return null;
  }
  const numberRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/gim;
  if (numberRegex.test(number)) {
    return number;
  }
  callback(field, `${field} : le numéro n'est pas valide`);
  return null;
}
