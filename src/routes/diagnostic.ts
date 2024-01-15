import express from 'express';

import { getWhatIsGoingOnWithMemberController } from '@/controllers/whatIsGoingOnWithMemberController/whatIsGoingOnWithMemberController';
import routes from './routes';

const router = express.Router();

// que ce passe-t-il
router.get(
  routes.WHAT_IS_GOING_ON_WITH_MEMBER,
  getWhatIsGoingOnWithMemberController
);
router.get(routes.WHAT_IS_GOING_ON_WITH_MEMBER_WITH_TYPO, (req, res) =>
  res.redirect(routes.WHAT_IS_GOING_ON_WITH_MEMBER)
);
router.get(routes.WHAT_IS_GOING_ON_WITH_MEMBER_SIMPLE, (req, res) =>
  res.redirect(routes.WHAT_IS_GOING_ON_WITH_MEMBER)
);

export { router as diagnosticRouter };
