import { Router } from 'express';
import authController from '../controllers/admin/authController.js';
import dashboardController from '../controllers/admin/dashboardController.js';
import bannerController from '../controllers/admin/bannerController.js';
import productController from '../controllers/admin/productController.js';
import capabilityController from '../controllers/admin/capabilityController.js';
import postController from '../controllers/admin/postController.js';
import leadController from '../controllers/admin/leadController.js';
import settingController from '../controllers/admin/settingController.js';
import aboutController from '../controllers/admin/aboutController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { uploadMedia } from '../middleware/uploadMiddleware.js';

const router = Router();

// Guest & Login Routes
router.get('/login', optionalAuth, authController.loginView);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/logout', requireAuth, authController.logout);

// Change Password Routes (All Authenticated Users)
router.get('/change-password', requireAuth, authController.changePasswordView);
router.post('/change-password', requireAuth, authController.changePassword);

// Admin Dashboard (All Authenticated Users: superadmin, admin, editor)
router.get(['/', '/dashboard'], requireAuth, dashboardController.index);

// Banners Management (Superadmin & Admin)
router.get('/banners', requireAuth, roleMiddleware(['superadmin', 'admin']), bannerController.index);
router.post('/banners', requireAuth, roleMiddleware(['superadmin', 'admin']), uploadMedia.single('media_file'), bannerController.store);
router.post('/banners/:id/status', requireAuth, roleMiddleware(['superadmin', 'admin']), bannerController.toggleStatus);
router.post('/banners/:id/delete', requireAuth, roleMiddleware(['superadmin', 'admin']), bannerController.destroy);

// Products Catalog Management (Superadmin & Admin)
router.get('/products', requireAuth, roleMiddleware(['superadmin', 'admin']), productController.index);
router.get('/products/create', requireAuth, roleMiddleware(['superadmin', 'admin']), productController.createView);
router.post('/products', requireAuth, roleMiddleware(['superadmin', 'admin']), uploadMedia.single('image_file'), productController.store);
router.get('/products/:id/edit', requireAuth, roleMiddleware(['superadmin', 'admin']), productController.editView);
router.post('/products/:id', requireAuth, roleMiddleware(['superadmin', 'admin']), uploadMedia.single('image_file'), productController.update);
router.post('/products/:id/delete', requireAuth, roleMiddleware(['superadmin', 'admin']), productController.destroy);

// Capabilities Management (Superadmin & Admin)
router.get('/capabilities', requireAuth, roleMiddleware(['superadmin', 'admin']), capabilityController.index);
router.post('/capabilities', requireAuth, roleMiddleware(['superadmin', 'admin']), uploadMedia.single('image_file'), capabilityController.store);
router.post('/capabilities/:id', requireAuth, roleMiddleware(['superadmin', 'admin']), capabilityController.update);
router.post('/capabilities/:id/delete', requireAuth, roleMiddleware(['superadmin', 'admin']), capabilityController.destroy);

// News & Articles Management (Editor, Admin, Superadmin)
router.get('/posts', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), postController.index);
router.post('/posts', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), uploadMedia.single('cover_file'), postController.store);
router.post('/posts/:id/delete', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), postController.destroy);

// Leads & Inquiries Management (Superadmin & Admin)
router.get('/leads', requireAuth, roleMiddleware(['superadmin', 'admin']), leadController.index);
router.get('/leads/export', requireAuth, roleMiddleware(['superadmin', 'admin']), leadController.exportCsv);
router.post('/leads/:id/status', requireAuth, roleMiddleware(['superadmin', 'admin']), leadController.updateStatus);

// Settings Management (Superadmin Only)
router.get('/settings', requireAuth, roleMiddleware(['superadmin']), settingController.index);
router.post('/settings', requireAuth, roleMiddleware(['superadmin']), settingController.update);

// About Us Content Management (Superadmin & Admin)
router.get('/about', requireAuth, roleMiddleware(['superadmin', 'admin']), aboutController.index);
router.post('/about', requireAuth, roleMiddleware(['superadmin', 'admin']), uploadMedia.single('about_image'), aboutController.update);

export default router;
