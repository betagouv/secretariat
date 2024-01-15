import express from 'express';
import routes from './routes';
import {
  getStartupInfoCreate,
  getStartupInfoCreateApi,
} from '@/controllers/startupController/getStartupInfoCreate';
import * as startupController from '@controllers/startupController';
import {
  getStartupInfoUpdate,
  getStartupInfoUpdateApi,
} from '@controllers/startupController';

const router = express.Router();
// STARTUP
router.get(routes.STARTUP_GET_INFO_CREATE_FORM, getStartupInfoCreate);
router.get(routes.STARTUP_GET_INFO_CREATE_FORM_API, getStartupInfoCreateApi);

router.get(routes.STARTUP_GET_ALL, startupController.getStartupList);
router.get(routes.STARTUP_GET_ALL_API, startupController.getStartupListApi);

router.get(routes.STARTUP_GET_DETAIL, startupController.getStartup);
router.get(routes.STARTUP_GET_DETAIL_API, startupController.getStartupApi);
router.get(routes.STARTUP_GET_INFO_UPDATE_FORM, getStartupInfoUpdate);
router.get(routes.STARTUP_GET_INFO_UPDATE_FORM_API, getStartupInfoUpdateApi);

router.post(
  routes.STARTUP_POST_INFO_UPDATE_FORM,
  express.json({ type: '*/*' }),
  startupController.postStartupInfoUpdate
);
router.post(
  routes.STARTUP_POST_INFO_CREATE_FORM,
  express.json({ type: '*/*' }),
  startupController.postStartupInfoUpdate
);

export { router as startupRouter };
