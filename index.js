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

indexController = require('./controllers/indexController');
loginController = require('./controllers/loginController');
logoutController = require('./controllers/logoutController');
emailsController = require('./controllers/emailsController');
usersController = require('./controllers/usersController');
marrainageController = require('./controllers/marrainageController');
githubNotificationController = require('./controllers/githubNotificationController');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/static', express.static('static'));

app.use(cookieParser(config.secret));
app.use(session({ cookie: { maxAge: 300000, sameSite: 'lax' } })); // Only used for Flash not safe for others purposes
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
  }).unless({ path: ['/', '/login', '/marrainage/accept', '/marrainage/decline', '/notifications/github'] })
);

// Save a token in cookie that expire after 7 days if user is logged
app.use((req, res, next) => {
  if (req.user && req.user.id) {
    const token = jwt.sign({ id: req.user.id }, config.secret, {
      expiresIn: '7 days'
    });

    res.cookie('token', token, { sameSite: 'lax' });
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
app.get('/users', usersController.getUsers);
app.get('/users/:id', usersController.getUserById);
app.post('/users/:id/email', usersController.createEmailForUser);
app.post('/users/:id/redirections', usersController.createRedirectionForUser);
app.post('/users/:id/redirections/:email/delete', usersController.deleteRedirectionForUser);
app.post('/users/:id/password', usersController.updatePasswordForUser);
app.post('/notifications/github', githubNotificationController.processNotification);
app.post('/marrainage', marrainageController.createRequest);
app.get('/marrainage/accept', marrainageController.acceptRequest);
app.get('/marrainage/decline', marrainageController.declineRequest);

module.exports = app.listen(config.port, () => console.log(`Running on port: ${config.port}`));
