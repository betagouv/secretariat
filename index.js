require('dotenv').config();
const path = require('path');
const express = require('express');
const cons = require('consolidate');
const BetaGouv = require('./betagouv');
const Promise = require('bluebird');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const expressJWT = require('express-jwt');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const PromiseMemoize = require('promise-memoize');

const config = {
  secret: process.env.SESSION_SECRET,
  port: process.env.PORT || 8100,
  secure: (process.env.SECURE || 'true') === 'true',
  senderEmail: process.env.MAIL_SENDER || "secretariat@incubateur.net"
};

const mailTransport = nodemailer.createTransport({
  debug: process.env.MAIL_DEBUG || false,
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const app = express();

app.engine('mustache', cons.mustache);
app.set('view engine', 'mustache');
app.set('views', path.join(__dirname, 'views'));

app.use('/static', express.static('static'));

app.use(cookieParser(config.secret));
app.use(session({ cookie: { maxAge: 300000 } })); // Only used for Flash not safe for others purposes
app.use(flash());

app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  expressJWT({
    secret: config.secret,
    getToken: req =>
      req.query.token || req.cookies.token
        ? req.query.token || req.cookies.token
        : null
  }).unless({ path: ['/', '/login'] })
);

// Save a token in cookie that expire after 7 days if user is logged
app.use((req, res, next) => {
  if (req.user && req.user.id) {
    const token = jwt.sign({ id: req.user.id }, config.secret, {
      expiresIn: '7 days'
    });

    res.cookie('token', token);
  }

  next();
});

app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    req.flash(
      'error',
      "Vous n'étes pas identifié pour accèder à cette page (ou votre accès n'est plus valide)"
    );

    return res.redirect('/login');
  }

  next(err);
});

app.get('/', (req, res) => {
  if (!req.cookies.token) {
    return res.redirect('/login');
  }

  res.redirect('/users');
});

app.get('/logout', (req, res) => {
  res.clearCookie('token').redirect('/login');
});

function renderLogin(req, res, params) {
  params.partials = {
    header: 'header',
    footer: 'footer',
    user: req.user
  };

  return res.render('login', params);
}

const buildBetaEmail = id => `${id}@beta.gouv.fr`;
const getBetaEmailId = email => email && email.split('@')[0];
const isBetaEmail = email => email && email.endsWith('beta.gouv.fr');

async function sendMail(to_email, subject, html, text) {
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

async function sendLoginEmail(id, domain) {
  const user = await BetaGouv.userInfosById(id);

  if (!user) {
    throw new Error(
      `Utilisateur(trice) ${id} inconnu(e) sur beta.gouv.fr (Avez-vous une fiche sur github ?)`
    );
  }

  if (
    user.end != undefined &&
    new Date(user.end).getTime() < new Date().getTime()
  ) {
    throw new Error(
      `Utilisateur(trice) ${id} a une date de fin expiré sur Github`
    );
  }

  const email = buildBetaEmail(id);
  const token = jwt.sign({ id: id }, config.secret, { expiresIn: '1 hours' });
  const url = `${domain}/users?token=${encodeURIComponent(token)}`;
  const html = `
      <h1>Ton lien de connexion ! (Valable 1 heure)</h1>
      <a href="${url}">${url}
      </a>
      <p>Tu as une heure pour cliquez dessus.<br>
      Sur le secretariat, tu pourras :
      <ul><li>Consulter les informations sur les emails</li>
          <li>Changer ton mot de passe</li>
          <li>Ajouter ou supprimer des redirections d'email</li>
      </ul>
    </p><p>Si tu as des questions, n'hésites pas à les poser sur le channel #incubateur-secretariat sur le Slack de BetaGouv.</p>`;

  try {
    await sendMail(email, 'Connexion secrétariat BetaGouv', html);
  } catch (err) {
    console.error(err);

    throw new Error("Erreur d'envoi de mail à ton adresse");
  }
}

async function userInfos(name, isCurrentUser) {
  try {
    const [userInfos, emailInfos, redirections] = await Promise.all([
      BetaGouv.userInfosById(name),
      BetaGouv.emailInfos(name),
      BetaGouv.redirectionsForName({ from: name })
    ]);

    const hasUserInfos = userInfos != undefined;

    // On ne peut créé un compte que se la page fiche github existe
    // que le compte n'existe pas et qu'il n'y a aucun redirection.
    // (sauf l'utilisateur(trice) connecté qui peut créer son propre compte)
    const canCreateEmail =
      hasUserInfos &&
      emailInfos === undefined &&
      (isCurrentUser || redirections.length === 0);

    // On peut créer une redirection si la page fiche github existe
    // et que l'on est l'utilisateur(trice) connecté(e)
    // pour créer ces propres redirections.
    const canCreateRedirection = hasUserInfos && isCurrentUser;
    const canChangePassword = hasUserInfos && isCurrentUser;

    return {
      emailInfos,
      redirections,
      userInfos,
      name,
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

app.get('/login', async (req, res) => {
  try {
    const users = await BetaGouv.usersInfos();

    renderLogin(req, res, { errors: req.flash('error'), users });
  } catch (err) {
    console.error(err);

    renderLogin(req, res, {
      errors: [
        'Erreur interne: impossible de récupérer la liste des membres sur beta.gouv.fr'
      ]
    });
  }
});

app.post('/login', async (req, res) => {
  if (
    req.body.id === undefined ||
    !/^[a-z0-9_-]+\.[a-z0-9_-]+$/.test(req.body.id)
  ) {
    req.flash('error', 'Nom invalid ([a-z0-9_-]+.[a-z0-9_-]+)');
    return res.redirect('/login');
  }

  const domain = `${config.secure ? 'https' : 'http'}://${req.hostname}`;

  try {
    const result = await sendLoginEmail(req.body.id, domain);

    renderLogin(req, res, {
      message: `Email de connexion envoyé pour ${req.body.id}`
    });
  } catch (err) {
    console.error(err);

    renderLogin(req, res, { errors: [err] });
  }
});

app.get('/users', async (req, res) => {
  if (req.query.name) {
    return res.redirect(`/users/${req.query.name}`);
  }

  try {
    const users = await BetaGouv.usersInfos();

    res.render('search', {
      users: users,
      user: req.user,
      partials: {
        header: 'header',
        footer: 'footer'
      }
    });
  } catch (err) {
    console.error(err);

    res.render('search', {
      users: [],
      errors: [
        'Erreur interne: impossible de récupérer la liste des membres sur beta.gouv.fr'
      ],
      user: req.user,
      partials: {
        header: 'header',
        footer: 'footer'
      }
    });
  }
});

const emailWithMetadataMemoized = PromiseMemoize(
  async () => {
    const [accounts, redirections, users] = await Promise.all([
      BetaGouv.accounts(),
      BetaGouv.redirections(),
      BetaGouv.usersInfos()
    ]);

    console.log('users', users.length);

    const emails = Array.from(
      new Set([
        ...redirections.reduce(
          (acc, r) => (!isBetaEmail(r.to) ? [...acc, r.from] : acc),
          []
        ),
        ...accounts.map(buildBetaEmail)
      ])
    ).sort();

    return emails.map(email => {
      const id = getBetaEmailId(email);
      const user = users.find(ui => ui.id === id);

      return {
        email: email,
        github: user != undefined,
        redirections: redirections.reduce(
          (acc, r) => (r.from === email ? [...acc, r.to] : acc),
          []
        ),
        account: accounts.includes(id),
        expired:
          user &&
          user.end &&
          new Date(user.end).getTime() < new Date().getTime()
      };
    });
  },
  {
    maxAge: 120000
  }
);

app.get('/emails', async (req, res) => {
  try {
    const emails = await emailWithMetadataMemoized();

    res.render('emails', {
      user: req.user,
      emails,
      partials: {
        header: 'header',
        footer: 'footer'
      }
    });
  } catch (err) {
    console.error(err);

    res.render('emails', {
      errors: ['Erreur interne'],
      user: req.user,
      partials: {
        header: 'header',
        footer: 'footer'
      }
    });
  }
});

app.get('/users/:name', async (req, res) => {
  const name = req.params.name;

  try {
    const user = await userInfos(name, req.user.id === name);

    res.render('user', {
      name,
      user: req.user,
      emailInfos: user.emailInfos,
      redirections: user.redirections,
      userInfos: user.userInfos,
      canCreateEmail: user.canCreateEmail,
      canCreateRedirection: user.canCreateRedirection,
      canChangePassword: user.canChangePassword,
      errors: req.flash('error'),
      messages: req.flash('message'),
      partials: {
        header: 'header',
        footer: 'footer'
      }
    });
  } catch (err) {
    console.error(err);

    res.send(err);
  }
});

app.post('/users/:id/email', async (req, res) => {
  const id = req.params.id;

  try {
    const user = await userInfos(id, req.user.id === id);

    if (!user.userInfos) {
      throw new Error(
        `L'utilisateur(trice) ${id} n'a pas de fiche sur github : vous ne pouvez pas créer son compte email`
      );
    }

    if (!user.canCreateEmail) {
      throw new Error("Vous n'avez pas le droits de créer le compte email de l'utilisateur");
    }

    const password = Math.random()
      .toString(36)
      .slice(-10);
    const email = buildBetaEmail(id);

    console.log(
      `Création de compte by=${req.user.id}&email=${email}&to_email=${req.query.to_email}&createRedirection=${req.body.createRedirection}&keep_copy=${req.body.keep_copy}`
    );

    const url = `${config.secure ? 'https' : 'http'}://${req.hostname}`;

    const message = `À la demande de ${req.user.id} sur <${url}>, je crée un compte mail pour ${id}`;

    await BetaGouv.sendInfoToSlack(message);
    await BetaGouv.createEmail(id, password);

    const html = `
      <h1>Ton compte ${email} a été créé !</h1>
      <ul>
      <li>Identifiant de login : ${email}</li>
      <li>Mot de passe : ${password}</li>
      <li>Comment utiliser ton compte email, voici les infos OVH pour configurer ta boite mail : <a href="https://docs.ovh.com/fr/emails/">https://docs.ovh.com/fr/emails/</a></li>
      <li>Gérer son compte mail sur le secrétariat BetaGouv : <a href="${url}">${url}</a></li>
      </a>`;

    try {
      await sendMail(req.body.to_email, `Création compte ${email}`, html);
    } catch (err) {
      throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
    }

    req.flash('message', 'Le compte email a bien été créé');
    res.redirect(`/users/${id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err);
    res.redirect(`/users/${id}`);
  }
});

app.post('/users/:id/redirections', async (req, res) => {
  const id = req.params.id;
  const url = `${config.secure ? 'https' : 'http'}://${req.hostname}`;

  try {
    const user = await userInfos(id, req.user.id === id);

    // TODO: généraliser ce code dans un `app.param("id")` ?
    if (!user.userInfos) {
      throw new Error(
        `L'utilisateur(trice) ${id} n'a pas de fiche sur github : vous ne pouvez pas créer de redirection`
      );
    }

    if (!user.canCreateRedirection) {
      throw new Error("Vous n'avez pas le droits de créer de redirection");
    }

    console.log(
      `Création d'une redirection d'email id=${req.user.id}&from_email=${id}&to_email=${req.body.to_email}&createRedirection=${req.body.createRedirection}&keep_copy=${req.body.keep_copy}`
    );

    const message = `À la demande de ${req.user.id} sur <${url}>, je crée une redirection mail pour ${id}`;

    try {
      await BetaGouv.sendInfoToSlack(message);
      await BetaGouv.createRedirection(
        buildBetaEmail(id),
        req.body.to_email,
        req.body.keep_copy === 'true'
      );
    } catch (err) {
      throw new Error(`Erreur pour créer la redirection: ${err}`);
    }

    req.flash('message', 'La redirection a bien été créé');
    res.redirect(`/users/${id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err);
    res.redirect(`/users/${id}`);
  }
});

app.post('/users/:id/redirections/:email/delete', async (req, res) => {
  const { id, email: to_email } = req.params;

  try {
    const user = await userInfos(id, req.user.id === id);
    // TODO: vérifier si l'utilisateur existe sur github ?

    if (!user.canCreateRedirection) {
      throw new Error("Vous n'avez pas le droits de supprimer cette redirection");
    }

    console.log(`Suppression de la redirection by=${id}&to_email=${to_email}`);

    const url = `${config.secure ? 'https' : 'http'}://${req.hostname}`;
    const message = `À la demande de ${req.user.id} sur <${url}>, je supprime la redirection mail de ${id} vers ${to_email}`;

    try {
      await BetaGouv.sendInfoToSlack(message);
      await BetaGouv.deleteRedirection(buildBetaEmail(id), to_email);
    } catch (err) {
      throw new Error(`Erreur pour supprimer la redirection: ${err}`);
    }

    req.flash('message', 'La redirection a bien été supprimé');
    res.redirect(`/users/${id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/users/${id}`);
  }
});

app.post('/users/:id/password', async (req, res) => {
  const id = req.params.id;

  try {
    const user = await userInfos(id, req.user.id === id);

    if (!user.userInfos) {
      throw new Error(
        `L'utilisateur(trice) ${id} n'a pas de fiche sur github : vous ne pouvez pas modifier le mot de passe`
      );
    }
    console.log(user)
    if (!user.canChangePassword) {
      throw new Error("Vous n'avez pas le droits de changer le mot de passe.");
    }

    const password = req.body.new_password;

    if (
      !password ||
      password.length < 9 ||
      password.length > 30 ||
      password !== password.trim()
    ) {
      throw new Error(
        "Le mot de passe doit comporter de 9 à 30 caractères, ne pas contenir d'accents ni d'espace au début ou à la fin"
      );
    }

    const email = buildBetaEmail(id);

    console.log(`Changement de mot de passe by=${req.user.id}&email=${email}`);

    const url = `${config.secure ? 'https' : 'http'}://${req.hostname}`;

    const message = `À la demande de ${req.user.id} sur <${url}>, je change le mot de passe pour ${id}`;

    await BetaGouv.sendInfoToSlack(message);
    await BetaGouv.changePassword(id, password);

    req.flash('message', 'Le mot de passe a bien été modifié');
    res.redirect(`/users/${id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/users/${id}`);
  }
});

app.listen(config.port, () => console.log(`Running on port: ${config.port}`));
