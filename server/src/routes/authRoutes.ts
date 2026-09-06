import { Router } from 'express';
import { login, me } from '../controllers/authController.js';
import { authGuard } from '../middleware/authGuard.js';

const router = Router();

router.post('/login', login);
router.get('/me', authGuard, me);

export default router;
