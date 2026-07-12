import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// GET dashboard KPIs
router.get('/', getDashboardStats);

export default router;
