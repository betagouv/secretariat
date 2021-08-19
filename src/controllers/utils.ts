import { request } from '@octokit/request';
import _ from 'lodash';
import nodemailer from 'nodemailer';
import BetaGouv from '../betagouv';
import config from '../config';

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

export async function sendMail(toEmail, subject, html, extraParams = {}) {
  const mail = {
    to: toEmail,
    from: `Secrétariat BetaGouv <${config.senderEmail}>`,
    subject,
    html,
    text: html.replace(/<(?:.|\n)*?>/gm, ''),
    headers: { 'X-Mailjet-TrackOpen': '0', 'X-Mailjet-TrackClick': '0' },
    ...extraParams,
  };

  return new Promise((resolve, reject) => {
    mailTransport.sendMail(mail, (error, info) =>
      error ? reject(error) : resolve(info)
    );
  });
}

export function buildBetaEmail(id) {
  return `${id}@${config.domain}`;
}

export function checkUserIsExpired(user, minDaysOfExpiration = 1) {
  // Le membre est considéré comme expiré si:
  // - il/elle existe
  // - il/elle a une date de fin
  // - son/sa date de fin est passée

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (
    user &&
    user.end !== undefined &&
    new Date().toString() !== 'Invalid Date' &&
    new Date(user.end).getTime() + (minDaysOfExpiration * 24 * 3600 * 1000) <=
      today.getTime()
  );
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
  return new Date(date.setDate(diff));
}

export function addDays(date, days, week = null) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export async function userInfos(id, isCurrentUser) {
  try {
    const [userInfos, emailInfos, redirections] = await Promise.all([
      BetaGouv.userInfosById(id),
      BetaGouv.emailInfos(id),
      BetaGouv.redirectionsForId({ from: id }),
    ]);

    const hasUserInfos = userInfos !== undefined;

    const isExpired = checkUserIsExpired(userInfos);

    // On ne peut créé un compte que si:
    // - la page fiche Github existe
    // - le membre n'est pas expiré·e
    // - et le compte n'existe pas
    // - et qu'il n'y a aucun redirection (sauf le membre connecté qui peut créer son propre compte)
    const canCreateEmail =
      hasUserInfos &&
      !isExpired &&
      emailInfos === null &&
      (isCurrentUser || redirections.length === 0);

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

    const canChangeSecondaryEmail = !!(
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
      canChangeSecondaryEmail,
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
