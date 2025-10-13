import { Router } from 'express';
import AuthController from '../controllers/authController';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authMiddleware.verifyToken, authController.logout);

export default router;