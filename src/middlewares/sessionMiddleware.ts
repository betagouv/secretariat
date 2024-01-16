import session from 'express-session';
import makeSessionStore from '@/infra/sessionStore/sessionStore';
import config from '@/config';

const setupSessionMiddleware = (app) => {
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
};

export { setupSessionMiddleware };
