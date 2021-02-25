const nodemailer = require('nodemailer');
const { request } = require('@octokit/request');

const config = require('../config');
const BetaGouv = require('../betagouv');

const mailTransport = nodemailer.createTransport({
  debug: process.env.MAIL_DEBUG === 'true',
  service: process.env.MAIL_SERVICE ? process.env.MAIL_SERVICE : null,
  host: process.env.MAIL_SERVICE ? null : process.env.MAIL_HOST,
  port: process.env.MAIL_SERVICE ? null : parseInt(process.env.MAIL_PORT || '25', 10),
  ignoreTLS: process.env.MAIL_SERVICE ? null : process.env.MAIL_IGNORE_TLS === 'true',
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

function removeAccents(str) {
  const map = {
    a: 'á|à|ã|â|À|Á|Ã|Â',
    e: 'é|è|ê|ë|É|È|Ê|Ë',
    i: 'í|ì|î|Í|Ì|Î',
    o: 'ó|ò|ô|õ|Ó|Ò|Ô|Õ',
    u: 'ú|ù|û|ü|Ú|Ù|Û|Ü',
    c: 'ç|Ç',
    n: 'ñ|Ñ',
  };
  for (const pattern in map) str = str.replace(new RegExp(map[pattern], 'g'), pattern);
  return str;
}

function hyphenateWhitespace(str) {
  return str.trim().replace(/\s+/g, '-');
}

function replaceSpecialCharacters(str) {
  return str.replace(/( |'|\.)/gi, ' ');
}

module.exports.sendMail = async function (to_email, subject, html, extraParams = {}) {
  const mail = {
    to: to_email,
    from: `Secrétariat BetaGouv <${config.senderEmail}>`,
    subject,
    html,
    text: html.replace(/<(?:.|\n)*?>/gm, ''),
    headers: { 'X-Mailjet-TrackOpen': '0', 'X-Mailjet-TrackClick': '0' },
    ...extraParams,
  };

  return new Promise((resolve, reject) => {
    mailTransport.sendMail(mail, (error, info) => (error ? reject(error) : resolve(info)));
  });
};

module.exports.buildBetaEmail = function (id) {
  return `${id}@${config.domain}`;
};

module.exports.checkUserIsExpired = function (user) {
  // Le membre est considéré comme expiré si:
  // - il/elle existe
  // - il/elle a une date de fin
  // - son/sa date de fin est passée
  return user
    && user.end !== undefined
    && new Date(user.end).getTime() < new Date().getTime();
};

module.exports.isMobileFirefox = (req) => {
  const userAgent = Object.prototype.hasOwnProperty.call(req.headers, 'user-agent') ? req.headers['user-agent'] : null;
  return userAgent && /Android.+Firefox\//.test(userAgent);
};

module.exports.requiredError = (formValidationErrors, field) => {
  formValidationErrors.push(`${field} : le champ n'est pas renseigné`);
};

module.exports.isValidDate = (formValidationErrors, field, date) => {
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    return date;
  }
  formValidationErrors.push(`${field} : la date n'est pas valide`);
  return null;
};

module.exports.isValidNumber = (formValidationErrors, field, number) => {
  if (!number) {
    module.exports.requiredError(formValidationErrors, field);
    return null;
  }
  const numberRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/gmi;
  if (numberRegex.test(number)) {
    return number;
  }
  formValidationErrors.push(`${field} : le numéro n'est pas valide`);
  return null;
};

module.exports.getWeekNumber = (d) => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
};

module.exports.getDateOfISOWeek = (w, y) => {
  const simple = new Date(y, 0, 1 + (w - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
};

module.exports.formatDateToReadableFormat = (date) => {
  let day = date.getDate().toString();
  day = day.length === 1 ? `0${day}` : day;
  let month = (date.getMonth() + 1).toString();
  month = month.length === 1 ? `0${month}` : month;
  return `${day}/${month}/${date.getFullYear()}`;
};

module.exports.formatDateToReadableDateAndTimeFormat = (date) => {
  let day = date.getDate().toString();
  day = day.length === 1 ? `0${day}` : day;

  let month = (date.getMonth() + 1).toString();
  month = month.length === 1 ? `0${month}` : month;

  let minutes = date.getMinutes().toString();
  minutes = minutes.length === 1 ? `0${minutes}` : minutes;

  const hour = date.getHours();
  return `${day}/${month} à ${hour}:${minutes}`;
};

module.exports.formatDateToFrenchTextReadableFormat = (date) => {
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
};

module.exports.userInfos = async function (id, isCurrentUser) {
  try {
    const [userInfos, emailInfos, redirections] = await Promise.all([
      BetaGouv.userInfosById(id),
      BetaGouv.emailInfos(id),
      BetaGouv.redirectionsForId({ from: id }),
    ]);

    const hasUserInfos = userInfos !== undefined;

    const isExpired = module.exports.checkUserIsExpired(userInfos);

    // On ne peut créé un compte que si:
    // - la page fiche Github existe
    // - le membre n'est pas expiré·e
    // - et le compte n'existe pas
    // - et qu'il n'y a aucun redirection (sauf le membre connecté qui peut créer son propre compte)
    const canCreateEmail = hasUserInfos
      && !isExpired
      && emailInfos === null
      && (isCurrentUser || redirections.length === 0);

    // On peut créer une redirection & changer un password si:
    // - la page fiche Github existe
    // - le membre n'est pas expiré·e (le membre ne devrait de toute façon pas pouvoir se connecter)
    // - et que l'on est le membre connecté·e pour créer ces propres redirections.
    const canCreateRedirection = hasUserInfos
      && !isExpired
      && isCurrentUser;
    const canChangePassword = hasUserInfos
      && !isExpired
      && isCurrentUser
      && !emailInfos;

    return {
      emailInfos,
      redirections,
      userInfos,
      isExpired,
      canCreateEmail,
      canCreateRedirection,
      canChangePassword,
    };
  } catch (err) {
    console.error(err);

    throw new Error(
      `Problème pour récupérer les infos du membre ${id}`,
    );
  }
};

module.exports.getGithubMasterSha = function () {
  const url = `https://api.github.com/repos/${config.githubRepository}/git/ref/heads/master`;
  return requestWithAuth(url);
};

module.exports.createGithubBranch = function (sha, branch) {
  const url = `https://api.github.com/repos/${config.githubFork}/git/refs`;
  const ref = `refs/heads/${branch}`;
  return requestWithAuth(`POST ${url}`, { sha, ref });
};

module.exports.deleteGithubBranch = function (branch) {
  const url = `https://api.github.com/repos/${config.githubFork}/git/refs/heads/${branch}`;
  return requestWithAuth(`DELETE ${url}`);
};

module.exports.createGithubFile = function (path, branch, content) {
  const url = `https://api.github.com/repos/${config.githubFork}/contents/${path}`;
  const message = `Création de fichier ${path} sur la branche ${branch}`;
  content = Buffer.from(content, 'utf-8').toString('base64');

  return requestWithAuth(`PUT ${url}`, { message, content, branch });
};

module.exports.makeGithubPullRequest = function (branch, title) {
  const url = `https://api.github.com/repos/${config.githubRepository}/pulls`;
  const head = `${config.githubFork.split('/')[0]}:${branch}`;
  const base = 'master';
  const maintainer_can_modify = true;

  return requestWithAuth(`POST ${url}`, {
    title, head, base, maintainer_can_modify,
  });
};

module.exports.createUsername = function (firstName, lastName) {
  const prepareName = function (str) {
    return hyphenateWhitespace(replaceSpecialCharacters(removeAccents(str)));
  };
  return `${prepareName(firstName)}.${prepareName(lastName)}`.toLowerCase();
};
