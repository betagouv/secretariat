const config = require('../config');
const BetaGouv = require('../betagouv');
const Promise = require('bluebird');
const nodemailer = require('nodemailer');

const mailTransport = nodemailer.createTransport({
  debug: process.env.MAIL_DEBUG === 'true',
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

module.exports.sendMail = async function (to_email, subject, html, text) {
  const mail = {
    to: to_email,
    from: `Secretariat BetaGouv <${config.senderEmail}>`,
    subject: subject,
    html: html,
    text: html.replace(/<(?:.|\n)*?>/gm, ''),
    headers: { 'X-Mailjet-TrackOpen': '0', 'X-Mailjet-TrackClick': '0' }
  };

  return new Promise((resolve, reject) => {
    mailTransport.sendMail(mail, (error, info) =>
      error ? reject(error) : resolve(info)
    );
  });
}

module.exports.buildBetaEmail = function(id) {
  return `${id}@${config.domain}`;
}

module.exports.checkUserIsExpired = function(user) {
  // L'utilisateur(trice) est considéré comme expiré si:
  // - il/elle existe
  // - il/elle a une date de fin
  // - son/sa date de fin est passée
  return user &&
    user.end != undefined &&
    new Date(user.end).getTime() < new Date().getTime();
}

module.exports.userInfos = async function(id, isCurrentUser) {
  try {
    const [userInfos, emailInfos, redirections] = await Promise.all([
      BetaGouv.userInfosById(id),
      BetaGouv.emailInfos(id),
      BetaGouv.redirectionsForId({ from: id })
    ]);

    const hasUserInfos = userInfos != undefined;

    // On ne peut créé un compte que si:
    // - la page fiche Github existe
    // - et le compte n'existe pas
    // - et qu'il n'y a aucun redirection (sauf l'utilisateur(trice) connecté qui peut créer son propre compte)
    const canCreateEmail =
      hasUserInfos &&
      emailInfos === null &&
      (isCurrentUser || redirections.length === 0);

    // On peut créer une redirection si:
    // - la page fiche Github existe
    // - et que l'on est l'utilisateur(trice) connecté(e) pour créer ces propres redirections.
    const canCreateRedirection = hasUserInfos && isCurrentUser;
    const canChangePassword = hasUserInfos && isCurrentUser;

    return {
      emailInfos,
      redirections,
      userInfos,
      canCreateEmail,
      canCreateRedirection,
      canChangePassword
    };
  } catch (err) {
    console.error(err);

    throw new Error(
      `Problème pour récupérer les infos de l'utilisateur(trice) ${name}`
    );
  }
}
