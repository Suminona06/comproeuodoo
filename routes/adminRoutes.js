import { Router } from 'express';
import authController from '../controllers/admin/authController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Guest & Login Routes
router.get('/login', optionalAuth, authController.loginView);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/logout', requireAuth, authController.logout);

// Change Password Routes (Authenticated)
router.get('/change-password', requireAuth, authController.changePasswordView);
router.post('/change-password', requireAuth, authController.changePassword);

// Admin Dashboard (Authenticated)
router.get(['/', '/dashboard'], requireAuth, (req, res) => {
  res.render('admin/dashboard', {
    title: 'Dashboard Administrasi - PT Euodoo CMS',
    activeNav: 'dashboard'
  });
});

export default router;
