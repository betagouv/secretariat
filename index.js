require('dotenv').config();
const config = require('./config');
const path = require('path');
const express = require('express');
const cons = require('consolidate');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const expressJWT = require('express-jwt');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');

indexController = require('./controllers/indexController');
logoutController = require('./controllers/logoutController');
loginController = require('./controllers/loginController');
emailsController = require('./controllers/emailsController');
usersController = require('./controllers/usersController');
onboardingController = require('./controllers/onboardingController');

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
    algorithms: ['HS256'],
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
      "Vous n'étes pas identifié pour accéder à cette page (ou votre accès n'est plus valide)"
    );

    return res.redirect('/login');
  }

  next(err);
});

app.get('/', indexController.getIndex);
app.get('/logout', logoutController.getLogout);
app.get('/login', loginController.getLogin);
app.post('/login', loginController.postLogin);
app.get('/emails', emailsController.getEmails);
app.get('/users', usersController.getUsers);
app.get('/users/:name', usersController.getUserByName);
app.post('/users/:id/email', usersController.createEmailForUser);
app.post('/users/:id/redirections', usersController.createRedirectionForUser);
app.post('/users/:id/redirections/:email/delete', usersController.deleteRedirectionForUser);
app.post('/users/:id/password', usersController.updatePasswordForUser);
app.post('/onboardingRequest', onboardingController.createOnboardingRequest);
app.get('/onboardingRequest/accept', onboardingController.acceptOnboardingRequest);
app.get('/onboardingRequest/decline', onboardingController.declineOnboardingRequest);

module.exports = app.listen(config.port, () => console.log(`Running on port: ${config.port}`));
