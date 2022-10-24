import axios from "axios";
import { request } from '@octokit/request';
import _ from 'lodash';
import nodemailer from 'nodemailer';
import BetaGouv from '../betagouv';
import config from '@config';
import crypto from 'crypto';

export const computeHash = function(username) {
  const hash = crypto.createHmac('sha512', config.HASH_SALT); /** Hashing algorithm sha512 */
  return hash.update(username).digest('hex');
}

const mailTransport = nodemailer.createTransport({
  debug: process.env.MAIL_DEBUG === 'true',
  service: process.env.MAIL_SERVICE ? process.env.MAIL_SERVICE : null,
  host: process.env.MAIL_SERVICE ? null : process.env.MAIL_HOST,
  port: process.env.MAIL_SERVICE
    ? null
    : parseInt(process.env.MAIL_PORT || '25', 10),
  ignoreTLS: process.env.MAIL_SERVICE
    ? null
    : process.env.MAIL_IGNORE_TLS === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const requestWithAuth = request.defaults({
  headers: {
    authorization: `token ${config.githubToken}`,
  },
});

function hyphenateWhitespace(str) {
  return str.trim().replace(/\s+/g, '-');
}

function replaceSpecialCharacters(str) {
  return str.replace(/( |'|\.)/gi, ' ');
}

export async function sendMail(toEmail, subject, html, extraParams = {}, attachments=[]) {
  const mail = {
    to: toEmail,
    from: `Espace Membre BetaGouv <${config.senderEmail}>`,
    subject,
    html,
    text: html.replace(/<(?:.|\n)*?>/gm, ''),
    attachments,
    headers: { 'X-Mailjet-TrackOpen': '0', 'X-Mailjet-TrackClick': '0' },
    ...extraParams,
  };

  return new Promise((resolve, reject) => {
    mailTransport.sendMail(mail, (error, info) =>
      error ? reject(error) : resolve(info)
    );
  });
}

export function capitalizeWords(arr) {
  return arr.map(element => {
    return element.charAt(0).toUpperCase() + element.slice(1).toLowerCase();
  });
}

export function buildBetaEmail(id: string) {
  return `${id}@${config.domain}`;
}

export function objectArrayToCSV<T>(arr: Array<T>) {
  const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
  const header = Object.keys(arr[0])
  const csv = [
  header.join(';'), // header row first
  ...arr.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(';'))
  ].join('\r\n')
  return csv
}

export function checkUserIsExpired(user, minDaysOfExpiration = 1) {
  // Le membre est considéré comme expiré si:
  // - il/elle existe
  // - il/elle a une date de fin
  // - son/sa date de fin est passée

  if (!user || user.end === undefined)
    return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const userEndDate = new Date(user.end);
  if (userEndDate.toString() === "Invalid Date")
    return false;
  userEndDate.setHours(0, 0, 0, 0);

  return userEndDate.getTime() + (minDaysOfExpiration * 24 * 3600 * 1000) <=
      today.getTime();
}

export function getActiveUsers(users, minDaysOfExpiration = 0) {
  return users.filter((u) => !checkUserIsExpired(u, minDaysOfExpiration - 1));
}

export function getExpiredUsers(users, minDaysOfExpiration = 0) {
  return users.filter((u) => checkUserIsExpired(u, minDaysOfExpiration - 1));
}

export function getExpiredUsersForXDays(users, nbDays) {
  const date = new Date();
  date.setDate(date.getDate() - nbDays);
  const formatedDate = this.formatDateYearMonthDay(date);
  return users.filter((x) => x.end === formatedDate);
}

export function isMobileFirefox(req) {
  const userAgent = Object.prototype.hasOwnProperty.call(
    req.headers,
    'user-agent'
  )
    ? req.headers['user-agent']
    : null;
  return userAgent && /Android.+Firefox\//.test(userAgent);
}

export function requiredError(formValidationErrors, field) {
  formValidationErrors.push(`${field} : le champ n'est pas renseigné`);
}

export function isValidDate(formValidationErrors, field, date) {
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    return date;
  }
  formValidationErrors.push(`${field} : la date n'est pas valide`);
  return null;
}

export function isValidNumber(formValidationErrors, field, number) {
  if (!number) {
    requiredError(formValidationErrors, field);
    return null;
  }
  const numberRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/gim;
  if (numberRegex.test(number)) {
    return number;
  }
  formValidationErrors.push(`${field} : le numéro n'est pas valide`);
  return null;
}

export function isValidEmail(formValidationErrors,  field, email) {
  const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (emailRegex.test(email.toLowerCase())) {
    return email;
  }
  formValidationErrors.push(`${field} : l'adresse email n'est pas valide`);
  return null;
}

export function formatDateYearMonthDay(date) {
  let day = date.getDate().toString();
  day = day.length === 1 ? `0${day}` : day;
  let month = (date.getMonth() + 1).toString();
  month = month.length === 1 ? `0${month}` : month;
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatDateToReadableFormat(date) {
  let day = date.getDate().toString();
  day = day.length === 1 ? `0${day}` : day;
  let month = (date.getMonth() + 1).toString();
  month = month.length === 1 ? `0${month}` : month;
  return `${day}/${month}/${date.getFullYear()}`;
}

export function formatDateToReadableDateAndTimeFormat(date) {
  let day = date.getDate().toString();
  day = day.length === 1 ? `0${day}` : day;

  let month = (date.getMonth() + 1).toString();
  month = month.length === 1 ? `0${month}` : month;

  let minutes = date.getMinutes().toString();
  minutes = minutes.length === 1 ? `0${minutes}` : minutes;

  const hour = date.getHours();
  return `${day}/${month} à ${hour}:${minutes}`;
}

export function nbOfDaysBetweenDate(date1, date2) {
  let difference = date1.getTime() - date2.getTime();
  let totalDays = Math.ceil(difference / (1000 * 3600 * 24));
  return totalDays;
}

export function formatDateToFrenchTextReadableFormat(date) {
  const frenchMonth = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'aout',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ];
  const day = date.getDate().toString();
  const month = frenchMonth[date.getMonth()];
  return `${day} ${month} ${date.getFullYear()}`;
}

export const NUMBER_OF_DAY_IN_A_WEEK = 7;

export const NUMBER_OF_DAY_FROM_MONDAY = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
};

export function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  monday.setSeconds(0, 0);
  return monday
}

export function addDays(date, days, week = null) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export async function isPublicServiceEmail (email) {
  if (/@pole-emploi.fr\s*$/.test(email.toLowerCase())) {
    return true
  }
  try {
    const data = await axios.get(config.tchap_api + String(email).toLowerCase()).then((x) => x.data);
      if (data.hs === "agent.externe.tchap.gouv.fr") {
        return false;
      } else {
        return true
      }
  } catch(e) {
    throw new Error('Get response from tchap error')
  }
}

export const asyncFilter = async (arr: Array<any>, predicate) => {
	const results = await Promise.all(arr.map(predicate));
	return arr.filter((_v, index) => results[index]);
}

export async function userInfos(id, isCurrentUser) {
  try {
    const [userInfos, emailInfos, redirections,
     responder
    ] = await Promise.all([
      BetaGouv.userInfosById(id),
      BetaGouv.emailInfos(id),
      BetaGouv.redirectionsForId({ from: id }),
      BetaGouv.getResponder(id)
    ]);
    const hasUserInfos = userInfos !== undefined;

    const isExpired = checkUserIsExpired(userInfos);

    // On ne peut créé un compte que si:
    // - la page fiche Github existe
    // - le membre n'est pas expiré·e
    // - et le compte n'existe pas
    const canCreateEmail =
      hasUserInfos &&
      !isExpired &&
      emailInfos === null;

    // On peut créer une redirection & changer un password si:
    // - la page fiche Github existe
    // - le membre n'est pas expiré·e (le membre ne devrait de toute façon pas pouvoir se connecter)
    // - et que l'on est le membre connecté·e pour créer ces propres redirections.
    const canCreateRedirection = !!(
      hasUserInfos &&
      !isExpired &&
      isCurrentUser
    );
    const canChangePassword = !!(
      hasUserInfos &&
      !isExpired &&
      isCurrentUser &&
      emailInfos
    );

    const canChangeEmails = !!(
      hasUserInfos &&
      !isExpired &&
      isCurrentUser
    );

    return {
      emailInfos,
      redirections,
      userInfos,
      isExpired,
      canCreateEmail,
      canCreateRedirection,
      canChangePassword,
      canChangeEmails,
      responder
    };
  } catch (err) {
    console.error(err);

    throw new Error(`Problème pour récupérer les infos du membre ${id}`);
  }
}

export function getGithubMasterSha() {
  const url = `https://api.github.com/repos/${config.githubRepository}/git/ref/heads/master`;
  return requestWithAuth(url);
}

export function createGithubBranch(sha, branch) {
  const url = `https://api.github.com/repos/${config.githubFork}/git/refs`;
  const ref = `refs/heads/${branch}`;
  return requestWithAuth(`POST ${url}`, { sha, ref });
}

export function deleteGithubBranch(branch) {
  const url = `https://api.github.com/repos/${config.githubFork}/git/refs/heads/${branch}`;
  return requestWithAuth(`DELETE ${url}`);
}

export function getGithubFile(path, branch) {
  const url = `https://api.github.com/repos/${config.githubRepository}/contents/${path}`;

  return requestWithAuth(`GET ${url}`, { branch });
}

export function createGithubFile(path, branch, content, sha = undefined) {
  const url = `https://api.github.com/repos/${config.githubFork}/contents/${path}`;
  const message = `${
    sha ? 'Mise à jour' : 'Création'
  } de fichier ${path} sur la branche ${branch}`;
  const base64EncodedContent = Buffer.from(content, 'utf-8').toString('base64');

  return requestWithAuth(`PUT ${url}`, {
    branch,
    sha,
    message,
    content: base64EncodedContent,
  });
}

export function makeGithubPullRequest(branch, title) {
  const url = `https://api.github.com/repos/${config.githubRepository}/pulls`;
  const head = `${config.githubFork.split('/')[0]}:${branch}`;
  const base = 'master';

  return requestWithAuth(`POST ${url}`, {
    title,
    head,
    base,
    maintainer_can_modify: true,
  });
}

export function createUsername(firstName, lastName) {
  const prepareName = function (str) {
    const normalizedStr = replaceSpecialCharacters(str)
      .split(' ')
      .map((x) => _.deburr(x.toLowerCase()).replace(/[^a-z]/g, ''))
      .join(' ')
      .trim();
    return hyphenateWhitespace(normalizedStr);
  };
  return `${prepareName(firstName)}.${prepareName(lastName)}`.toLowerCase();
}

export function sleep(ms) {
  return new Promise((resolve) => {
      setTimeout(resolve, ms);
  });
}

/**
*@param	{String} date1 A date in ISO format to compare to the other one.
*@param	{String} date2 A date in ISO format to compare to the other one.     
*/
export function sortASC(date1, date2) {
  return date1 < date2 ? -1 : 1;
}

/**
*@param	{Date} date     A date to convert to an ISO formated day.
*/
export function formatDateToISOString(date) {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) {
      month = '0' + month;
  }
  if (day.length < 2) {
      day = '0' + day;
  }

  return [year, month, day].join('-');
}

/**
*@param	{Array} keys An array of strings
*@param {Int} value A value to assign to each key
*/
export function createDefaultObjectWithKeysAndValue(keys, value=0) {
  const obj = {}
  for (const key of keys){
      obj[key] = value
  }
  return obj
}
