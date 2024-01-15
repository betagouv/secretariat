import express from 'express';
import * as communityController from '@controllers/communityController';
import routes from './routes';

const router = express.Router();

router.get(routes.GET_COMMUNITY, communityController.getCommunity);
router.get(routes.GET_COMMUNITY_API, communityController.getCommunityApi);
router.get(routes.GET_USER, communityController.getUser);
router.get(routes.GET_USER_API, communityController.getUserApi);

export { router as communityRouter };
