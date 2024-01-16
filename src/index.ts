import bodyParser from 'body-parser';
import compression from 'compression';
import flash from 'connect-flash';
import express from 'express';
import { expressjwt, Request } from 'express-jwt';
import expressSanitizer from 'express-sanitizer';
import session from 'express-session';
import path from 'path';
import cors from 'cors';
import config from '@config';
import * as githubNotificationController from '@controllers/githubNotificationController';
import * as indexController from '@controllers/indexController';
import * as resourceController from '@controllers/resourceController';
import * as hookController from '@controllers/hookController';
import * as pullRequestsController from '@controllers/pullRequestsController';
import * as sentry from './lib/sentry';
import EventBus from '@infra/eventBus/eventBus';
import { MARRAINAGE_EVENTS_VALUES } from '@models/marrainage';
import routes from './routes/routes';
import { rateLimiter } from './middlewares/rateLimiter';
import makeSessionStore from './infra/sessionStore/sessionStore';
import { getJwtTokenForUser, getToken } from '@/helpers/session';
import getAllIncubators from './controllers/incubatorController/api/getAllIncubators';
import getAllSponsors from './controllers/sponsorController/api/getAllSponsors';
import { userRouter, userApiRouter, userPublicApiRouter } from './routes/users';
import { marrainageRouter } from './routes/marrainage';
import { accountRouter } from './routes/account';
import { startupRouter } from './routes/startups';
import { communityRouter } from './routes/community';
import { adminRouter } from './routes/admin';
import { authRouter } from './routes/auth';
import { diagnosticRouter } from './routes/diagnostic';
import { badgeRouter } from './routes/badge';
import { newsletterRouter } from './routes/newsletter';
import setupStaticFiles from './routes/staticFiles';
import { onboardingRouter } from './routes/onboarding';
import { mapRouter } from './routes/map';

export const app = express();
app.set('trust proxy', 1);

var whitelist = config.CORS_ORIGIN;

const corsOptions = {
  origin: function (origin, callback) {
    if (
      whitelist.indexOf(origin) !== -1 ||
      process.env.NODE_ENV === 'test' ||
      !origin
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: 'POST, PUT, OPTIONS, DELETE, GET',
  allowedHeaders:
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-HTTP-Method-Override, Set-Cookie, Cookie',
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
EventBus.init([...MARRAINAGE_EVENTS_VALUES]);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views/templates')); // the code is running in directory "dist".

app.use(compression());
setupStaticFiles(app);

app.use(
  session({
    store: process.env.NODE_ENV !== 'test' ? makeSessionStore() : null,
    secret: config.secret,
    resave: false, // required: force lightweight session keep alive (touch)
    saveUninitialized: false, // recommended: only save session when data exists
    unset: 'destroy',
    proxy: true, // Required for Heroku & Digital Ocean (regarding X-Forwarded-For)
    name: 'espaceMembreCookieName',
    cookie: {
      maxAge: 24 * 60 * 60 * 1000 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' ? true : false,
      sameSite: 'lax',
    },
  })
); // Only used for Flash not safe for others purposes
app.use(flash());
app.use(expressSanitizer());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(rateLimiter);

app.use(
  expressjwt({
    secret: config.secret,
    algorithms: ['HS256'],
    getToken: (req) => {
      return getToken(req);
    },
  }).unless({
    path: [
      '/login',
      routes.LOGIN_API,
      '/signin',
      routes.SIGNIN_API,
      '/marrainage/accept',
      '/marrainage/decline',
      '/notifications/github',
      routes.WHAT_IS_GOING_ON_WITH_MEMBER,
      routes.WHAT_IS_GOING_ON_WITH_MEMBER_SIMPLE,
      routes.WHAT_IS_GOING_ON_WITH_MEMBER_WITH_TYPO,
      routes.PULL_REQUEST_GET_PRS,
      routes.ONBOARDING,
      routes.ONBOARDING_API,
      routes.ONBOARDING_ACTION,
      /api\/public\/users\/*/,
      /hook\/*/,
      /onboardingSuccess\/*/,
      /api\/public\/account\/base-info\/*/,
    ],
  })
);

// Save a token in cookie that expire after 7 days if user is logged
app.use((req: Request, res, next) => {
  if (req.auth && req.auth.id) {
    (req.session.token = getJwtTokenForUser(req.auth.id)), { sameSite: 'lax' };
  }
  next();
});

app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    // redirect to login and keep the requested url in the '?next=' query param
    if (req.method === 'GET') {
      req.flash(
        'message',
        'Pour accéder à cette page vous devez vous identifier, vous pouvez le faire en renseignant votre email juste en dessous.'
      );
      const nextParam = req.url ? `?next=${req.url}` : '';
      return res.redirect(`/login${nextParam}`);
    }
  }
  return next(err);
});

app.get('/', indexController.getIndex);
app.use(userRouter);
app.use(userApiRouter);
app.use(userPublicApiRouter);
app.use(marrainageRouter);
app.use(accountRouter);
app.use(startupRouter);
app.use(communityRouter);
app.use(adminRouter);
app.use(authRouter);
app.use(diagnosticRouter);
app.use(badgeRouter);
app.use(newsletterRouter);
app.use(onboardingRouter);
app.use(mapRouter);

app.get(routes.PULL_REQUEST_GET_PRS, pullRequestsController.getAllPullRequests);
//
app.post(
  '/notifications/github',
  githubNotificationController.processNotification
);

// INCUBTORS
app.get(routes.API_PUBLIC_INCUBATORS_GET_ALL, getAllIncubators);

//sponsors
app.get(routes.API_PUBLIC_SPONSORS_GET_ALL, getAllSponsors);

app.get('/resources', resourceController.getResources);
app.post(
  '/hook/:hookId',
  express.json({ type: '*/*' }),
  hookController.postToHook
);

sentry.initCaptureConsoleWithHandler(app);

export default app.listen(config.port, () =>
  console.log(`Running on: ${config.protocol}://${config.host}:${config.port}`)
);
