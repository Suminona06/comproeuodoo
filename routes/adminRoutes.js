import { Router } from 'express';
import authController from '../controllers/admin/authController.js';
import dashboardController from '../controllers/admin/dashboardController.js';
import bannerController from '../controllers/admin/bannerController.js';
import productController from '../controllers/admin/productController.js';
import capabilityController from '../controllers/admin/capabilityController.js';
import postController from '../controllers/admin/postController.js';
import leadController from '../controllers/admin/leadController.js';
import settingController from '../controllers/admin/settingController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { uploadMedia } from '../middleware/uploadMiddleware.js';

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
router.get(['/', '/dashboard'], requireAuth, dashboardController.index);

// Banners Management
router.get('/banners', requireAuth, bannerController.index);
router.post('/banners', requireAuth, uploadMedia.single('media_file'), bannerController.store);
router.post('/banners/:id/status', requireAuth, bannerController.toggleStatus);
router.post('/banners/:id/delete', requireAuth, bannerController.destroy);

// Products Catalog Management
router.get('/products', requireAuth, productController.index);
router.get('/products/create', requireAuth, productController.createView);
router.post('/products', requireAuth, uploadMedia.single('image_file'), productController.store);
router.get('/products/:id/edit', requireAuth, productController.editView);
router.post('/products/:id', requireAuth, uploadMedia.single('image_file'), productController.update);
router.post('/products/:id/delete', requireAuth, productController.destroy);

// Capabilities Management
router.get('/capabilities', requireAuth, capabilityController.index);
router.post('/capabilities', requireAuth, uploadMedia.single('image_file'), capabilityController.store);
router.post('/capabilities/:id', requireAuth, capabilityController.update);
router.post('/capabilities/:id/delete', requireAuth, capabilityController.destroy);

// News & Articles Management
router.get('/posts', requireAuth, postController.index);
router.post('/posts', requireAuth, uploadMedia.single('cover_file'), postController.store);
router.post('/posts/:id/delete', requireAuth, postController.destroy);

// Leads & Inquiries Management
router.get('/leads', requireAuth, leadController.index);
router.get('/leads/export', requireAuth, leadController.exportCsv);
router.post('/leads/:id/status', requireAuth, leadController.updateStatus);

// Settings Management
router.get('/settings', requireAuth, settingController.index);
router.post('/settings', requireAuth, settingController.update);

export default router;

