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
    e: 'é|è|ê|É|È|Ê',
    i: 'í|ì|î|Í|Ì|Î',
    o: 'ó|ò|ô|õ|Ó|Ò|Ô|Õ',
    u: 'ú|ù|û|ü|Ú|Ù|Û|Ü',
    c: 'ç|Ç',
    n: 'ñ|Ñ',
  };
  for (const pattern in map) str = str.replace(new RegExp(map[pattern], 'g'), pattern);
  return str;
}

module.exports.sendMail = async function (to_email, subject, html) {
  const mail = {
    to: to_email,
    from: `Secrétariat BetaGouv <${config.senderEmail}>`,
    subject,
    html,
    text: html.replace(/<(?:.|\n)*?>/gm, ''),
    headers: { 'X-Mailjet-TrackOpen': '0', 'X-Mailjet-TrackClick': '0' },
  };

  return new Promise((resolve, reject) => {
    mailTransport.sendMail(mail, (error, info) => (error ? reject(error) : resolve(info)));
  });
};

module.exports.buildBetaEmail = function (id) {
  return `${id}@${config.domain}`;
};

module.exports.checkUserIsExpired = function (user) {
  // L'utilisateur·rice est considéré comme expiré si:
  // - il/elle existe
  // - il/elle a une date de fin
  // - son/sa date de fin est passée
  return user
    && user.end !== undefined
    && new Date(user.end).getTime() < new Date().getTime();
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
    // - l'utilisateur·rice n'est pas expiré·e
    // - et le compte n'existe pas
    // - et qu'il n'y a aucun redirection (sauf l'utilisateur·rice connecté qui peut créer son propre compte)
    const canCreateEmail = hasUserInfos
      && !isExpired
      && emailInfos === null
      && (isCurrentUser || redirections.length === 0);

    // On peut créer une redirection & changer un password si:
    // - la page fiche Github existe
    // - l'utilisateur·rice n'est pas expiré·e (l'utilisateur·rice ne devrait de toute façon pas pouvoir se connecter)
    // - et que l'on est l'utilisateur·rice connecté·e pour créer ces propres redirections.
    const canCreateRedirection = hasUserInfos
      && !isExpired
      && isCurrentUser;
    const canChangePassword = hasUserInfos
      && !isExpired
      && isCurrentUser;

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
      `Problème pour récupérer les infos de l'utilisateur·rice ${id}`,
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
  const firstNameSegment = removeAccents(firstName).replace(/( |'|\.)/gi, '-');
  const lastNameSegment = removeAccents(lastName).replace(/( |'|\.)/gi, '-');
  return `${firstNameSegment}.${lastNameSegment}`.toLowerCase();
};
