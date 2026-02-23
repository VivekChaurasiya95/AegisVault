import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { getActivityLogs, getActivityStats } from '../controllers/activity.controller';

const router = Router();

router.use(authenticateToken);

router.get('/logs', getActivityLogs);
router.get('/stats', getActivityStats);

export default router;
