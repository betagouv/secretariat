require('dotenv').config();
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const expressJWT = require('express-jwt');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const expressSanitizer = require('express-sanitizer');
const config = require('./config');
const knex = require('./db');

const indexController = require('./controllers/indexController');
const loginController = require('./controllers/loginController');
const logoutController = require('./controllers/logoutController');
const usersController = require('./controllers/usersController');
const marrainageController = require('./controllers/marrainageController');
const githubNotificationController = require('./controllers/githubNotificationController');
const accountController = require('./controllers/accountController');
const communityController = require('./controllers/communityController');
const adminController = require('./controllers/adminController');
const onboardingController = require('./controllers/onboardingController');
const visitController = require('./controllers/visitController');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/static', express.static('static'));
app.use('/datagouvfr', express.static(path.join(__dirname, 'node_modules/template.data.gouv.fr/dist'))); // hack to mimick the behavior of webpack css-loader (used to import template.data.gouv.fr)

app.use(cookieParser(config.secret));
app.use(session({ cookie: { maxAge: 300000, sameSite: 'lax' } })); // Only used for Flash not safe for others purposes
app.use(flash());
app.use(expressSanitizer());
app.use(bodyParser.urlencoded({ extended: false }));

const getJwtTokenForUser = (id) => jwt.sign({ id }, config.secret, { expiresIn: '7 days' });

app.use(async (req, res, next) => {
  if (!req.query.token) return next();

  try {
    const tokenDbResponse = await knex('login_tokens').select()
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

    await knex('login_tokens')
      .where({ email: dbToken.email })
      .del();

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
      '/visit',
      /onboardingSuccess\/*/,
    ],
  }),
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
        "Vous n'êtes pas identifié pour accéder à cette page (ou votre accès n'est plus valide)",
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
app.post('/users/:username/redirections', usersController.createRedirectionForUser);
app.post('/users/:username/redirections/:email/delete', usersController.deleteRedirectionForUser);
app.post('/users/:username/password', usersController.updatePasswordForUser);
app.post('/notifications/github', githubNotificationController.processNotification);
app.post('/marrainage', marrainageController.createRequest);
app.get('/marrainage/accept', marrainageController.acceptRequest);
app.get('/marrainage/decline', marrainageController.declineRequest);
app.post('/marrainage/cancel', marrainageController.cancelRequest);
app.post('/marrainage/reload', marrainageController.reloadRequest);
app.post('/visit', visitController.postForm);

app.get('/account', accountController.getCurrentAccount);
app.get('/community', communityController.getCommunity);
app.get('/community/:username', communityController.getUser);
app.get('/admin', adminController.getEmailLists);
app.get('/onboarding', onboardingController.getForm);
app.post('/onboarding', onboardingController.postForm);
app.get('/onboardingSuccess/:prNumber', onboardingController.getConfirmation);
app.get('/visit', visitController.getForm);

module.exports = app.listen(config.port, () => console.log(`Running on port: ${config.port}`));
