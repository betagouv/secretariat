require('dotenv').config();
const path = require('path');
const express = require('express');
const cons = require('consolidate');
const BetaGouv = require('./betagouv');
const Promise = require('bluebird')
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
  secure: (process.env.SECURE || 'true') === 'true'
};

const mailTransport = nodemailer.createTransport({
  debug: process.env.MAIL_DEBUG || false,
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

var app = express();

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
    getToken: req => {
      if (req.query.token || req.cookies.token) {
        return req.query.token || req.cookies.token;
      }
      return null;
    }
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

function sendMail(to_email, subject, html, text) {
  const mail = {
    to: to_email,
    from: 'Secrétariat BetaGouv <secretariat@beta.gouv.fr>',
    subject: subject,
    html: html,
    text: html.replace(/<(?:.|\n)*?>/gm, ''),
    headers: { 'X-Mailjet-TrackOpen': '0', 'X-Mailjet-TrackClick': '0' }
  };
  return new Promise((resolve, reject) => {
    mailTransport.sendMail(mail, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve(info);
      }
    });
  });
}

function sendLoginEmail(id, domain) {
  return BetaGouv.user_infos_by_id(id).then(user => {
    if (!user) {
      throw new Error(
        `Utilisateur(trice) ${id} inconnu(e) sur beta.gouv.fr (Avez-vous une fiche sur github ?)`
      );
    }
    if (
      user.end !== undefined &&
      new Date(user.end).getTime() < new Date().getTime()
    ) {
      throw new Error(
        `Utilisateur(trice) ${id} a une date de fin expiré sur Github`
      );
    }

    const email = `${id}@beta.gouv.fr`;
    const token = jwt.sign({ id: id }, config.secret, { expiresIn: '1 hours' });
    const url = `${domain}/users?token=${encodeURIComponent(token)}`;
    const html = `
        <h1>Ton lien de connexion ! (Valable 1 heure)</h1>
        <a href="${url}">${url}
        </a>`;

    return sendMail(email, 'Connexion secrétariat BetaGouv', html).catch(
      err => {
        console.log(err);
        throw "Erreur d'envoi de mail à ton adresse";
      }
    );
  });
}

function userInfos(name, is_current_user) {
  return Promise.all([
    BetaGouv.user_infos_by_id(name),
    BetaGouv.email_infos(name),
    BetaGouv.redirection_for_name(name)
  ])
    .then(([user_infos, email_infos, redirections]) => {
      // On ne peut créé un compte que se la page fiche github existe, que le compte n'existe pas et qu'il n'y a aucun redirection. (sauf l'utilisateur(trice) connecté qui peut créer son propre compte)
      const can_create_email =
        user_infos != undefined &&
        email_infos == undefined &&
        (is_current_user || redirections.length === 0);

      // On peut créer une redirection si la page fiche github existe et que l'on est l'utilisateur(trice) connecté pour créer ces propres redirections.
      const can_create_redirection =
        user_infos != undefined &&
         is_current_user;

      const result = {
        email_infos,
        redirections,
        user_infos,
        name,
        can_create_email,
        can_create_redirection
      };
      return result;
    })
    .catch(err => {
      console.log(err);
      throw new Error(
        `Problème pour récupérer les infos de l'utilisateur(trice) ${name}`
      );
    });
}

app.get('/login', (req, res) => {
  BetaGouv.users_infos()
    .then(users => {
      renderLogin(req, res, { errors: req.flash('error'), users: users });
    })
    .catch(err => {
      console.log(err);
      renderLogin(req, res, {
        errors: [
          'Erreur interne: impossible de récupérer la liste des membres sur beta.gouv.fr'
        ]
      });
    });
});

app.post('/login', (req, res) => {
  if (
    req.body.id == undefined ||
    !/^[a-z0-9_-]+\.[a-z0-9_-]+$/.test(req.body.id)
  ) {
    req.flash('error', 'Nom invalid ([a-z0-9_-]+.[a-z0-9_-]+)');
    return res.redirect('/login');
  }

  const domain = `${config.secure ? 'https' : 'http'}://${req.hostname}`;
  sendLoginEmail(req.body.id, domain)
    .then(result => {
      renderLogin(req, res, {
        message: `Email de connexion envoyé pour ${req.body.id}`
      });
    })
    .catch(err => {
      console.log(err);
      renderLogin(req, res, { errors: [err] });
    });
});

app.get('/users', (req, res) => {
  if (req.query.name) {
    return res.redirect(`/users/${req.query.name}`);
  }

  BetaGouv.users_infos()
    .then(users => {
      res.render('search', {
        users: users,
        user: req.user,
        partials: {
          header: 'header',
          footer: 'footer'
        }
      });
    })
    .catch(err => {
      console.log(err);
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
    });
});

function email_with_metadata() {
  return Promise.all([
    BetaGouv.accounts(),
    BetaGouv.redirections(),
    BetaGouv.users_infos()
  ]).then(([accounts, redirections, user_infos]) => {
    const emails = Array.from(
      new Set([
        ...redirections.reduce(
          (acc, r) => (!r.to.endsWith('beta.gouv.fr') ? [...acc, r.from] : acc),
          []
        ),
        ...accounts.map(a => `${a}@beta.gouv.fr`)
      ])
    ).sort();

    return emails.map(email => {
      const [id] = email.split('@');
      const user = user_infos.find(ui => ui.id == id);

      return {
        email: email,
        github: user !== undefined,
        redirections: redirections.reduce(
          (acc, r) => (r.from == email ? [...acc, r.to] : acc),
          []
        ),
        account: accounts.includes(id),
        expired:
          user &&
          user.end &&
          new Date(user.end).getTime() < new Date().getTime()
      };
    });
  });
}

app.get('/emails', (req, res) =>
  PromiseMemoize(email_with_metadata, { maxAge: 120000 })()
    .then(emails_with_metadata => {
      res.render('emails', {
        user: req.user,
        emails: emails_with_metadata,
        partials: {
          header: 'header',
          footer: 'footer'
        }
      });
    })
    .catch(err => {
      console.log(err);
      res.render('emails', {
        errors: ['Erreur interne'],
        user: req.user,
        partials: {
          header: 'header',
          footer: 'footer'
        }
      });
    })
);

app.get('/users/:name', (req, res) => {
  const name = req.params.name;
  userInfos(name, req.user.id === name)
    .then(result => {
      res.render('user', {
        email_infos: result.email_infos,
        redirections: result.redirections,
        user_infos: result.user_infos,
        name,
        user: req.user,
        can_create_email: result.can_create_email,
        can_create_redirection: result.can_create_redirection,
        errors: req.flash('error'),
        messages: req.flash('message'),
        partials: {
          header: 'header',
          footer: 'footer'
        }
      });
    })
    .catch(err => {
      console.log(err);
      res.send(err);
    });
});

app.post('/users/:id/email', (req, res) => {
  const id = req.params.id;
  const url = `${config.secure ? 'https' : 'http'}://${req.hostname}`;
  userInfos(id, req.user.id === id)
    .then(result => {
      if (!result.user_infos) {
        throw `L'utilisateur(trice) ${id} n'a pas de fiche sur github: vous ne pouvez pas créer son compte email`;
      }
      if (!result.can_create_email) {
        throw "Vous n'avez pas le droits de créer de redirection";
      }
      const password = Math.random()
        .toString(36)
        .slice(-10);
      const email = `${id}@beta.gouv.fr`;
      console.log(
        `Email account creation by=${req.user.id}&email=${email}&to_email=${req.query.to_email}&create_redirection=${req.body.create_redirection}&keep_copy=${req.body.keep_copy}`
      );
      const message = `A la demande de ${
        req.user.id
      } sur <${url}>, je créé un compte mail pour ${id}`;
      return BetaGouv.sendInfoToSlack(message)
        .then(result => BetaGouv.create_email(id, password))
        .then(result => {
          const html = `
            <h1>Ton compte ${email} a été créé !</h1>
            <ul>
            <li>Identifiant de login : ${email}</li>
            <li>Mot de passe : ${password}</li>
            <li>Comment utiliser ton compte email, voici les infos OVH pour configurer ta boite mail : <a href="https://docs.ovh.com/fr/emails/">https://docs.ovh.com/fr/emails/</a></li>
            <li>Gérer son compte mail sur le secrétariat BetaGouv : <a href="${url}">${url}</a></li>
            </a>`;
          return sendMail(
            req.body.to_email,
            `Création compte ${email}`,
            html
          ).catch(err => {
            throw new Error(
              `Erreur d'envoi de mail à l'adresse indiqué ${err}`
            );
          });
        })
        .then(result => {
          if (req.body.create_redirection === 'true') {
            return BetaGouv.create_redirection(
              email,
              req.body.to_email,
              req.body.keep_copy == 'true'
            ).catch(err => {
              throw new Error(`Erreur pour créer la redirection: ${err}`);
            });
          }
          return null;
        });
    })
    .then(result => {
      req.flash('message', 'Le compte email a bien été créé');
      res.redirect(`/users/${id}`);
    })
    .catch(err => {
      console.log(err);
      req.flash('error', err);
      res.redirect(`/users/${id}`);
    });
});

app.post('/users/:id/redirections', (req, res) => {
  const id = req.params.id;
  const url = `${config.secure ? 'https' : 'http'}://${req.hostname}`;
  userInfos(id, req.user.id === id)
    .then(result => {
      if (!result.user_infos) {
        throw `L'utilisateur(trice) ${id} n'a pas de fiche sur github: vous ne pouvez pas créer de redirection`;
      }
      if (!result.can_create_redirection) {
        throw "Vous n'avez pas le droits de créer de redirection";
      }
      console.log(
        `Email account creation by=${req.user.id}&from_email=${id}&to_email=${req.query.to_email}&create_redirection=${req.body.create_redirection}&keep_copy=${req.body.keep_copy}`
      );
      const message = `A la demande de ${
        req.user.id
      } sur <${url}>, je créé une redirection mail pour ${id}`;
      return BetaGouv.sendInfoToSlack(message)
        .then(result =>
          BetaGouv.create_redirection(
            `${id}@beta.gouv.fr`,
            req.body.to_email,
            req.body.keep_copy == 'true'
          )
        )
        .catch(err => {
          throw new Error(`Erreur pour créer la redirection: ${err}`);
        });
    })
    .then(result => {
      req.flash('message', 'La redirection a bien été créé');
      res.redirect(`/users/${id}`);
    })
    .catch(err => {
      console.log(err);
      req.flash('error', err);
      res.redirect(`/users/${id}`);
    });
});

app.post('/users/:id/redirections/:email', (req, res) => {
  const { id, email: to_email } = req.params;
  const url = `${config.secure ? 'https' : 'http'}://${req.hostname}`;
  userInfos(id, req.user.id === id)
    .then(result => {
      if (!result.can_create_redirection) {
        new Error("Vous n'avez pas le droits de supprimer cette redirection");
      }
      console.log(
        `Delete redirection by=${id}&to_email=${to_email}`
      );
      const message = `A la demande de ${
        req.user.id
      } sur <${url}>, je supprime la redirection mail de ${id} vers ${to_email}`;
      return BetaGouv.sendInfoToSlack(message)
        .then(result =>
          BetaGouv.delete_redirection(
            `${id}@beta.gouv.fr`,
            to_email
          )
        )
        .catch(err => {
          throw new Error(`Erreur pour supprimer la redirection: ${err}`);
        });
    })
    .then(result => {
      req.flash('message', 'La redirection a bien été supprimé');
      res.redirect(`/users/${id}`);
    })
    .catch(err => {
      console.error(err);
      req.flash('error', err.message);
      res.redirect(`/users/${id}`);
    });
});

app.listen(config.port);
