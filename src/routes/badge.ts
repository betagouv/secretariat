import express from 'express';

import routes from './routes';
import {
  updateBadgeRenewalRequestStatus,
  updateBadgeRequestStatus,
} from '@/controllers/badgeRequestsController/updateBadgeRequestStatus';
import { postBadgeRequest } from '@/controllers/badgeRequestsController/postBadgeRequest';
import { postBadgeRenewalRequest } from '@/controllers/badgeRequestsController/postBadgeRenewalRequest';

const router = express.Router();

router.post(
  routes.API_POST_BADGE_REQUEST,
  express.json({ type: '*/*' }),
  postBadgeRequest
);
router.post(
  routes.API_POST_BADGE_RENEWAL_REQUEST,
  express.json({ type: '*/*' }),
  postBadgeRenewalRequest
);
router.put(
  routes.API_UPDATE_BADGE_REQUEST_STATUS,
  express.json({ type: '*/*' }),
  updateBadgeRequestStatus
);

router.put(
  routes.API_UPDATE_BADGE_RENEWAL_REQUEST_STATUS,
  express.json({ type: '*/*' }),
  updateBadgeRenewalRequestStatus
);

export { router as badgeRouter };
