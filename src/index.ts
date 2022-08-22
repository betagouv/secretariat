import bodyParser from 'body-parser';
import compression from 'compression';
import flash from 'connect-flash';
import cookieParser from 'cookie-parser';
import express from 'express';
import { expressjwt, Request } from "express-jwt";
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
import * as startupController from './controllers/startupController';
import * as usersController from './controllers/usersController';
import * as mapController from './controllers/mapController';
import * as hookController from './controllers/hookController';
import * as sentry from './lib/sentry';
import EventBus from '@infra/eventBus/eventBus';
import { MARRAINAGE_EVENTS_VALUES } from './models/marrainage';

const app = express();
EventBus.init([...MARRAINAGE_EVENTS_VALUES])

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views/templates')); // the code is running in directory "dist".

app.use(compression());
app.use('/public', express.static(path.join(__dirname, './public')));
app.use('/static', express.static(path.join(__dirname, '../static')));
app.use(
  '/datagouvfr',
  express.static(
    path.join(__dirname, process.env.NODE_ENV === 'prod' ? '../..' : '..', 'node_modules/template.data.gouv.fr/dist')
  )
); // hack to mimick the behavior of webpack css-loader (used to import template.data.gouv.fr)
app.use(
  '/react-datepicker/react-datepicker.css',
  express.static(
    path.join(__dirname, process.env.NODE_ENV === 'prod' ? '../..' : '..', 'node_modules/react-datepicker/dist/react-datepicker.css')
  )
)
app.use(
  '/react-tabulator/styles.css',
  express.static(
    path.join(__dirname, process.env.NODE_ENV === 'prod' ? '../..' : '..', 'node_modules/react-tabulator/lib/styles.css')
  )
);
app.use(
  '/react-tabulator/tabulator.min.css',
  express.static(
    path.join(__dirname, process.env.NODE_ENV === 'prod' ? '../..' : '..', 'node_modules/react-tabulator/lib/css/tabulator.min.css')
  )
); 
app.use(
  '/topbar.js',
  express.static(path.join(__dirname, process.env.NODE_ENV === 'prod' ? '../..' : '..', 'node_modules/topbar/topbar.min.js'))
);

app.use(cookieParser(config.secret));
app.use(session({ cookie: { maxAge: 300000, sameSite: 'lax' } })); // Only used for Flash not safe for others purposes
app.use(flash());
app.use(expressSanitizer());
app.use(bodyParser.urlencoded({ extended: false }));

const getJwtTokenForUser = (id) =>
  jwt.sign({ id }, config.secret, { expiresIn: '7 days' });

app.use(
  expressjwt({
    secret: config.secret,
    algorithms: ['HS256'],
    getToken: (req) => req.cookies.token || null,
  }).unless({
    path: [
      '/',
      '/login',
      '/signin',
      '/marrainage/accept',
      '/marrainage/decline',
      '/notifications/github',
      '/onboarding',
      /hook\/*/,
      /onboardingSuccess\/*/,
    ],
  })
);

// Save a token in cookie that expire after 7 days if user is logged
app.use((req: Request, res, next) => {
  if (req.auth && req.auth.id) {
    res.cookie('token', getJwtTokenForUser(req.auth.id), { sameSite: 'lax' });
  }
  next();
});

app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    // redirect to login and keep the requested url in the '?next=' query param
    if (req.method === 'GET') {
      req.flash(
        'message',
        "Pour accéder à cette page vous devez vous identifier, vous pouvez le faire en renseignant votre email juste en dessous."
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
app.get('/signin', loginController.getSignIn);
app.post('/signin', loginController.postSignIn);
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
app.post(
  '/users/:username/primary_email',
  usersController.managePrimaryEmailForUser
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

app.get('/startups', startupController.getStartupList);
app.get('/startups/:startup', startupController.getStartup);
app.get('/account', accountController.getCurrentAccount);
app.get('/account/info', accountController.getCurrentInfo);
app.post('/account/info', accountController.updateCurrentInfo);

app.get('/community', communityController.getCommunity);
app.get('/community/:username', communityController.getUser);
app.get('/admin', adminController.getEmailLists);
app.get('/onboarding', onboardingController.getForm);
app.post('/onboarding', onboardingController.postForm);
app.get('/onboardingSuccess/:prNumber', onboardingController.getConfirmation);
app.post('/account/set_email_responder', accountController.setEmailResponder);
app.post('/account/delete_email_responder', accountController.deleteEmailResponder);
app.post('/account/set_email_responder', accountController.setEmailResponder);
app.post('/account/update_communication_email', accountController.updateCommunicationEmail);

app.get('/newsletters', newsletterController.getNewsletter);
app.get('/validateNewsletter', newsletterController.validateNewsletter);
app.get('/cancelNewsletter', newsletterController.cancelNewsletter);

app.get('/resources', resourceController.getResources);
app.get('/api/get-users', adminController.getUsers);
app.get('/api/get-users-location', mapController.getUsersLocation);
app.get('/map', mapController.getMap);
app.post('/hook/:hookId', express.json({type: '*/*'}), hookController.postToHook);


sentry.initCaptureConsoleWithHandler(app);

export default app.listen(config.port, () =>
  console.log(`Running on: ${config.protocol}://${config.host}:${config.port}`)
);
