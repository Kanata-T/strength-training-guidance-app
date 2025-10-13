import { Router } from 'express';
import authRoutes from './authRoutes';
import trainingRoutes from './trainingRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/training', trainingRoutes);

export default router;