require('dotenv').config();
const config = require('./config');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const expressJWT = require('express-jwt');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const knex = require('./db');

indexController = require('./controllers/indexController');
loginController = require('./controllers/loginController');
logoutController = require('./controllers/logoutController');
emailsController = require('./controllers/emailsController');
usersController = require('./controllers/usersController');
marrainageController = require('./controllers/marrainageController');
githubNotificationController = require('./controllers/githubNotificationController');
homeController = require('./controllers/homeController');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/static', express.static('static'));
app.use('/~', express.static(path.join(__dirname, 'node_modules'))); // hack to mimick the behavior of webpack css-loader (used to import template.data.gouv.fr)

app.use(cookieParser(config.secret));
app.use(session({ cookie: { maxAge: 300000, sameSite: 'lax' } })); // Only used for Flash not safe for others purposes
app.use(flash());

app.use(bodyParser.urlencoded({ extended: false }));

const getJwtTokenForUser = (id) => {
  return jwt.sign({ id }, config.secret, { expiresIn: '7 days' });
}

app.use(async function (req, res, next) {
  if (!req.query.token)
    return next();

  try {
    const tokenDbResponse = await knex('login_tokens').select()
      .where({ token: req.query.token })
      .andWhere('expires_at', '>', new Date());

    if (tokenDbResponse.length !== 1) {
      req.flash("error", "Ce lien de connexion a expiré");
      return res.redirect('/');
    }

    const dbToken = tokenDbResponse[0];
    if (dbToken.token !== req.query.token) {
      req.flash("error", "Ce lien de connexion a expiré");
      return res.redirect('/');
    }

    await knex('login_tokens')
      .where({ email: dbToken.email })
      .del();

    res.cookie('token', getJwtTokenForUser(dbToken.username));
    return res.redirect(req.path);

  } catch (err) {
    console.log(`Erreur dans l'utilisation du login token : ${err}`);
    next(err);
  }
});

app.use(
  expressJWT({
    secret: config.secret,
    algorithms: ['HS256'],
    getToken: req => req.cookies.token || null,
  }).unless({ path: ['/', '/login', '/marrainage/accept', '/marrainage/decline', '/notifications/github'] })
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
    req.flash(
      'error',
      "Vous n'étes pas identifié pour accéder à cette page (ou votre accès n'est plus valide)"
    );

    return res.redirect('/login');
  }

  next(err);
});

app.get('/', indexController.getIndex);
app.get('/login', loginController.getLogin);
app.post('/login', loginController.postLogin);
app.get('/logout', logoutController.getLogout);
app.get('/emails', emailsController.getEmails);
app.get('/emails/expired', emailsController.getExpiredEmails);
app.get('/redirections', usersController.getRedirections);
app.get('/users', usersController.getUsers);
app.get('/users/:id', usersController.getUserById);
app.post('/users/:id/email', usersController.createEmailForUser);
app.post('/users/emailAccount', usersController.createEmailAccount);
app.post('/users/:id/redirections', usersController.createRedirectionForUser);
app.post('/users/:id/redirections/:email/delete', usersController.deleteRedirectionForUser);
app.post('/users/:id/password', usersController.updatePasswordForUser);
app.post('/notifications/github', githubNotificationController.processNotification);
app.post('/marrainage', marrainageController.createRequest);
app.get('/marrainage/accept', marrainageController.acceptRequest);
app.get('/marrainage/decline', marrainageController.declineRequest);
app.get('/home', homeController.getHome);


module.exports = app.listen(config.port, () => console.log(`Running on port: ${config.port}`));
