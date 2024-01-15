import express from 'express';

import * as loginController from '@controllers/loginController';
import * as logoutController from '@controllers/logoutController';
import routes from './routes';

const router = express.Router();

router.get('/login', loginController.getLogin);
router.post('/login', loginController.postLogin);
router.post(
  routes.LOGIN_API,
  express.json({ type: '*/*' }),
  loginController.postLoginApi
);
router.get('/signin', loginController.getSignIn);
router.post(
  routes.SIGNIN_API,
  express.json({ type: '*/*' }),
  loginController.postSignInApi
);

router.post(routes.SIGNIN, loginController.postSignIn);
router.get(routes.LOGOUT, logoutController.getLogout);
router.get(routes.LOGOUT_API, logoutController.getLogoutApi);

export { router as authRouter };
