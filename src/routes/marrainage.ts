import express from 'express';

import * as marrainageController from '@controllers/marrainageController';

const router = express.Router();

router.post('/marrainage', marrainageController.createRequest);
router.get('/marrainage/accept', marrainageController.acceptRequest);
router.get('/marrainage/decline', marrainageController.declineRequest);
router.post('/marrainage/cancel', marrainageController.cancelRequest);
router.post('/marrainage/reload', marrainageController.reloadRequest);

export { router as marrainageRouter };
