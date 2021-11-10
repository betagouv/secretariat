import bodyParser from 'body-parser';
import compression from 'compression';
import flash from 'connect-flash';
import cookieParser from 'cookie-parser';
import express from 'express';
import expressJWT from 'express-jwt';
import expressSanitizer from 'express-sanitizer';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import path from 'path';
import config from './config';
import * as accountController from './controllers/accountController';
import * as adminController from './controllers/adminController';
import * as communityController from './controllers/communityController';
import * as githubNotificationController from './controllers/githubNotificationController';
import * as indexController from './controllers/indexController';
import * as loginController from './controllers/loginController';
import * as logoutController from './controllers/logoutController';
import * as marrainageController from './controllers/marrainageController';
import * as newsletterController from './controllers/newsletterController';
import * as onboardingController from './controllers/onboardingController';
import * as resourceController from './controllers/resourceController';
import * as usersController from './controllers/usersController';
import knex from './db';
import * as sentry from './lib/sentry';

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views')); // the code is running in directory "dist".

app.use(compression());

app.use('/static', express.static(path.join(__dirname, '../static')));
app.use(
  '/datagouvfr',
  express.static(
    path.join(__dirname, '../node_modules/template.data.gouv.fr/dist')
  )
); // hack to mimick the behavior of webpack css-loader (used to import template.data.gouv.fr)
app.use(
  '/topbar.js',
  express.static(path.join(__dirname, '../node_modules/topbar/topbar.min.js'))
);

app.use(cookieParser(config.secret));
app.use(session({ cookie: { maxAge: 300000, sameSite: 'lax' } })); // Only used for Flash not safe for others purposes
app.use(flash());
app.use(expressSanitizer());
app.use(bodyParser.urlencoded({ extended: false }));

const getJwtTokenForUser = (id) =>
  jwt.sign({ id }, config.secret, { expiresIn: '7 days' });

app.use(async (req, res, next) => {
  if (!req.query.token) return next();

  try {
    const tokenDbResponse = await knex('login_tokens')
      .select()
      .where({ token: req.query.token })
      .andWhere('expires_at', '>', new Date());

    if (tokenDbResponse.length !== 1) {
      req.flash('error', 'Ce lien de connexion a expiré.');
      return res.redirect('/');
    }

    const dbToken = tokenDbResponse[0];
    if (dbToken.token !== req.query.token) {
      req.flash('error', 'Ce lien de connexion a expiré.');
      return res.redirect('/');
    }

    await knex('login_tokens').where({ email: dbToken.email }).del();

    res.cookie('token', getJwtTokenForUser(dbToken.username));
    return res.redirect(req.path);
  } catch (err) {
    console.log(`Erreur dans l'utilisation du login token : ${err}`);
    return next(err);
  }
});

app.use(
  expressJWT({
    secret: config.secret,
    algorithms: ['HS256'],
    getToken: (req) => req.cookies.token || null,
  }).unless({
    path: [
      '/',
      '/login',
      '/marrainage/accept',
      '/marrainage/decline',
      '/notifications/github',
      '/onboarding',
      /onboardingSuccess\/*/,
    ],
  })
);

// Save a token in cookie that expire after 7 days if user is logged
app.use((req, res, next) => {
  if (req.user && req.user.id) {
    res.cookie('token', getJwtTokenForUser(req.user.id), { sameSite: 'lax' });
  }
  next();
});

app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    // redirect to login and keep the requested url in the '?next=' query param
    if (req.method === 'GET') {
      req.flash(
        'error',
        "Vous n'êtes pas identifié pour accéder à cette page (ou votre accès n'est plus valide)"
      );
      const nextParam = req.url ? `?next=${req.url}` : '';
      return res.redirect(`/login${nextParam}`);
    }
  }
  return next(err);
});

app.get('/', indexController.getIndex);
app.get('/login', loginController.getLogin);
app.post('/login', loginController.postLogin);
app.get('/logout', logoutController.getLogout);
app.post('/users/:username/email', usersController.createEmailForUser);
app.post('/users/:username/email/delete', usersController.deleteEmailForUser);
app.post(
  '/users/:username/redirections',
  usersController.createRedirectionForUser
);
app.post(
  '/users/:username/redirections/:email/delete',
  usersController.deleteRedirectionForUser
);
app.post('/users/:username/password', usersController.updatePasswordForUser);
app.post(
  '/users/:username/secondary_email',
  usersController.manageSecondaryEmailForUser
);
app.post('/users/:username/end-date', usersController.updateEndDateForUser);
app.post(
  '/notifications/github',
  githubNotificationController.processNotification
);
app.post('/marrainage', marrainageController.createRequest);
app.get('/marrainage/accept', marrainageController.acceptRequest);
app.get('/marrainage/decline', marrainageController.declineRequest);
app.post('/marrainage/cancel', marrainageController.cancelRequest);
app.post('/marrainage/reload', marrainageController.reloadRequest);

app.get('/account', accountController.getCurrentAccount);
app.get('/community', communityController.getCommunity);
app.get('/community/:username', communityController.getUser);
app.get('/admin', adminController.getEmailLists);
app.get('/onboarding', onboardingController.getForm);
app.post('/onboarding', onboardingController.postForm);
app.post('/account/set_email_responder', accountController.setEmailResponder);
app.post('/account/delete_email_responder', accountController.deleteEmailResponder);

app.get('/newsletters', newsletterController.getNewsletter);
app.get('/validateNewsletter', newsletterController.validateNewsletter);
app.get('/cancelNewsletter', newsletterController.cancelNewsletter);

app.get('/resources', resourceController.getResources);

sentry.initCaptureConsoleWithHandler(app);

export default app.listen(config.port, () =>
  console.log(`Running on: ${config.protocol}://${config.host}:${config.port}`)
);
