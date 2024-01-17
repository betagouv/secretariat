import bodyParser from 'body-parser';
import compression from 'compression';
import flash from 'connect-flash';
import express from 'express';
import { expressjwt, Request } from 'express-jwt';
import expressSanitizer from 'express-sanitizer';
import path from 'path';
import cors from 'cors';
import config from '@config';
import * as githubNotificationController from '@controllers/githubNotificationController';
import * as indexController from '@controllers/indexController';
import * as resourceController from '@controllers/resourceController';
import * as hookController from '@controllers/hookController';
import * as pullRequestsController from '@controllers/pullRequestsController';
import EventBus from '@infra/eventBus/eventBus';
import { MARRAINAGE_EVENTS_VALUES } from '@models/marrainage';
import routes from './routes/routes';
import { rateLimiter } from './middlewares/rateLimiter';
import { getJwtTokenForUser, getToken } from '@/helpers/session';
import getAllIncubators from './controllers/incubatorController/api/getAllIncubators';
import getAllSponsors from './controllers/sponsorController/api/getAllSponsors';
import {
  accountRouter,
  adminRouter,
  authRouter,
  badgeRouter,
  communityRouter,
  diagnosticRouter,
  userRouter,
  userApiRouter,
  userPublicApiRouter,
  mapRouter,
  marrainageRouter,
  newsletterRouter,
  onboardingRouter,
  setupStaticFiles,
  startupRouter,
} from './routes';
import { corsOptions } from './utils/corsConfig';
import { errorHandler } from './middlewares/errorHandler';
import { setupSessionMiddleware } from './middlewares/sessionMiddleware';
import { PUBLIC_ROUTES } from './config/jwt.config';
import { initializeSentry, sentryErrorHandler } from './lib/sentry';

export const app = express();
app.set('trust proxy', 1);

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
EventBus.init([...MARRAINAGE_EVENTS_VALUES]);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views/templates')); // the code is running in directory "dist".

// MIDDLEWARES
initializeSentry(app);
app.use(compression());
setupStaticFiles(app);
setupSessionMiddleware(app);
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
    path: PUBLIC_ROUTES,
  })
);
// Save a token in cookie that expire after 7 days if user is logged
app.use((req: Request, res, next) => {
  if (req.auth && req.auth.id) {
    (req.session.token = getJwtTokenForUser(req.auth.id)), { sameSite: 'lax' };
  }
  next();
});
app.use(errorHandler);

//ROUTES
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

// INCUBATORS
app.get(routes.API_PUBLIC_INCUBATORS_GET_ALL, getAllIncubators);

//sponsors
app.get(routes.API_PUBLIC_SPONSORS_GET_ALL, getAllSponsors);

app.get('/resources', resourceController.getResources);
app.post(
  '/hook/:hookId',
  express.json({ type: '*/*' }),
  hookController.postToHook
);
app.use(sentryErrorHandler);

export default app.listen(config.port, () =>
  console.log(`Running on: ${config.protocol}://${config.host}:${config.port}`)
);
