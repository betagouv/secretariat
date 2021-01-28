const crypto = require('crypto');
const ejs = require('ejs');
const knex = require('../db');
const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');
const { updatePassword } = require('./usersController');

module.exports.getPasswordReset = async function (req, res) {
  res.render('passwordReset', {
    errors: req.flash('error'),
    messages: req.flash('message'),
    domain: config.domain,
  });
};

module.exports.postPasswordReset = async function (req, res) {
  try {
    const { email } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error("L'adresse email renseignée n'est pas valide");
    }
    const dbResponse = await knex('users').where({ secondary_email: email });
    if (!dbResponse || dbResponse.length === 0) {
      throw new Error("Nous n'avons pas trouvé un utilisateur avec cette adresse email.");
    }

    const dbUser = dbResponse[0];

    const emailInfos = await BetaGouv.emailInfos(dbUser.username);
    if (!emailInfos || !emailInfos.email) {
      throw new Error(`Le compte spécifié n'a pas d'adresse email ${config.domain}`);
    }

    const token = crypto.randomBytes(256).toString('base64');
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    await knex('password_reset_tokens').insert({
      token,
      username: dbUser.username,
      email: emailInfos.email,
      expires_at: expirationDate,
    });

    const passwordResetUrlWithToken = `${config.protocol}://${config.host}/passwordReset/form?passwordResetToken=${encodeURIComponent(token)}`;
    const html = await ejs.renderFile('./views/emails/passwordReset.ejs', { passwordResetUrlWithToken });

    await utils.sendMail(dbUser.secondary_email, 'Réinitialisation de mot de passe', html);
    res.redirect('/passwordReset/emailSent');
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('/passwordReset');
  }
};

module.exports.getEmailSent = async function (req, res) {
  res.render('passwordResetEmailSent', {});
};

module.exports.getForm = async function (req, res) {
  try {
    if (!req.query || !req.query.passwordResetToken) {
      throw new Error('Token de réinitialisation manquant');
    }

    const tokenDbResponse = await knex('password_reset_tokens').select()
      .where({ token: req.query.passwordResetToken })
      .andWhere('expires_at', '>', new Date());

    if (tokenDbResponse.length !== 1) {
      throw new Error('Ce lien de réinitialisation a expiré.');
    }

    res.render('passwordResetForm', {
      token: req.query.passwordResetToken,
      errors: req.flash('error'),
      messages: req.flash('message'),
    });
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('/passwordReset');
  }
};

module.exports.postForm = async function (req, res) {
  const { password1, password2, token } = req.body;

  try {
    if (password1 !== password2) {
      throw new Error('Les mots de passe ne correspondent pas.');
    }

    if (!token) {
      throw new Error('Token de réinitialisation manquant.');
    }

    const tokenDbResponse = await knex('password_reset_tokens').select()
      .where({ token })
      .andWhere('expires_at', '>', new Date());

    if (tokenDbResponse.length !== 1) {
      throw new Error('Ce lien de réinitialisation a expiré.');
    }

    const dbToken = tokenDbResponse[0];
    await knex('password_reset_tokens')
      .where({ email: dbToken.email })
      .del();

    await updatePassword(dbToken.username, true, password1, dbToken.username);

    req.flash('message', 'Le mot de passe a bien été modifié.');
    res.redirect('/login');
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect(`/passwordReset/form?passwordResetToken=${encodeURIComponent(token)}`);
  }
};
