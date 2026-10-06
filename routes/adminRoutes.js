import { Router } from 'express';
import authController from '../controllers/admin/authController.js';
import dashboardController from '../controllers/admin/dashboardController.js';
import userController from '../controllers/admin/userController.js';
import brandController from '../controllers/admin/brandController.js';
import mediaController from '../controllers/admin/mediaController.js';
import productCategoryController from '../controllers/admin/productCategoryController.js';
import productController from '../controllers/admin/productController.js';
import postCategoryController from '../controllers/admin/postCategoryController.js';
import postController from '../controllers/admin/postController.js';
import inquiryController from '../controllers/admin/inquiryController.js';
import settingController from '../controllers/admin/settingController.js';
import aboutController from '../controllers/admin/aboutController.js';
import contactCmsController from '../controllers/admin/contactCmsController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { uploadMedia } from '../middleware/uploadMiddleware.js';
import bannerController from '../controllers/admin/bannerController.js';

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

// T-43: Users Management (Superadmin Only)
router.get('/users', requireAuth, roleMiddleware(['superadmin']), userController.index);
router.get('/users/create', requireAuth, roleMiddleware(['superadmin']), userController.createView);
router.post('/users', requireAuth, roleMiddleware(['superadmin']), userController.store);
router.get('/users/:id/edit', requireAuth, roleMiddleware(['superadmin']), userController.editView);
router.post('/users/:id', requireAuth, roleMiddleware(['superadmin']), userController.update);
router.post('/users/:id/delete', requireAuth, roleMiddleware(['superadmin']), userController.destroy);

// T-44: Brands Management (Superadmin & Admin)
router.get('/brands', requireAuth, roleMiddleware(['superadmin', 'admin']), brandController.index);
router.get('/brands/create', requireAuth, roleMiddleware(['superadmin', 'admin']), brandController.createView);
router.post('/brands', requireAuth, roleMiddleware(['superadmin', 'admin']), uploadMedia.single('logo_file'), brandController.store);
router.get('/brands/:id/edit', requireAuth, roleMiddleware(['superadmin', 'admin']), brandController.editView);
router.post('/brands/:id', requireAuth, roleMiddleware(['superadmin', 'admin']), uploadMedia.single('logo_file'), brandController.update);
router.post('/brands/:id/toggle', requireAuth, roleMiddleware(['superadmin', 'admin']), brandController.toggleStatus);
router.post('/brands/:id/delete', requireAuth, roleMiddleware(['superadmin', 'admin']), brandController.destroy);

// T-45: Media Library (Editor, Admin, Superadmin; Deletion Admin+)
router.get('/media', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), mediaController.index);
router.get('/media/api', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), mediaController.apiList);
router.post('/media/upload', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), uploadMedia.single('file'), mediaController.upload);
router.post('/media/youtube', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), mediaController.addYoutube);
router.post('/media/:id/delete', requireAuth, roleMiddleware(['superadmin', 'admin']), mediaController.destroy);

// T-46: Product Categories & Products (Superadmin & Admin)
router.get('/product-categories', requireAuth, roleMiddleware(['superadmin', 'admin']), productCategoryController.index);
router.get('/product-categories/create', requireAuth, roleMiddleware(['superadmin', 'admin']), productCategoryController.createView);
router.post('/product-categories', requireAuth, roleMiddleware(['superadmin', 'admin']), productCategoryController.store);
router.get('/product-categories/:id/edit', requireAuth, roleMiddleware(['superadmin', 'admin']), productCategoryController.editView);
router.post('/product-categories/:id', requireAuth, roleMiddleware(['superadmin', 'admin']), productCategoryController.update);
router.post('/product-categories/:id/delete', requireAuth, roleMiddleware(['superadmin', 'admin']), productCategoryController.destroy);

router.get('/products', requireAuth, roleMiddleware(['superadmin', 'admin']), productController.index);
router.get('/products/export', requireAuth, roleMiddleware(['superadmin', 'admin']), productController.exportCsv);
router.get('/products/create', requireAuth, roleMiddleware(['superadmin', 'admin']), productController.createView);
router.post('/products', requireAuth, roleMiddleware(['superadmin', 'admin']), uploadMedia.single('image_file'), productController.store);
router.get('/products/:id/edit', requireAuth, roleMiddleware(['superadmin', 'admin']), productController.editView);
router.post('/products/:id', requireAuth, roleMiddleware(['superadmin', 'admin']), uploadMedia.single('image_file'), productController.update);
router.post('/products/:id/delete', requireAuth, roleMiddleware(['superadmin', 'admin']), productController.destroy);

// T-47: Post Categories & Posts (Editor, Admin, Superadmin)
router.get('/post-categories', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), postCategoryController.index);
router.get('/post-categories/create', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), postCategoryController.createView);
router.post('/post-categories', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), postCategoryController.store);
router.get('/post-categories/:id/edit', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), postCategoryController.editView);
router.post('/post-categories/:id', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), postCategoryController.update);
router.post('/post-categories/:id/delete', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), postCategoryController.destroy);

router.get('/posts', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), postController.index);
router.get('/posts/create', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), postController.createView);
router.post('/posts', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), uploadMedia.single('cover_file'), postController.store);
router.get('/posts/:id/edit', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), postController.editView);
router.post('/posts/:id', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), uploadMedia.single('cover_file'), postController.update);
router.post('/posts/:id/delete', requireAuth, roleMiddleware(['superadmin', 'admin', 'editor']), postController.destroy);

// T-48: Inquiries & RFQ Management (Superadmin & Admin) + alias /leads
router.get(['/inquiries', '/leads'], requireAuth, roleMiddleware(['superadmin', 'admin']), inquiryController.index);
router.get(['/inquiries/export', '/leads/export'], requireAuth, roleMiddleware(['superadmin', 'admin']), inquiryController.exportCsv);
router.get(['/inquiries/:id', '/leads/:id'], requireAuth, roleMiddleware(['superadmin', 'admin']), inquiryController.detail);
router.post(['/inquiries/:id/status', '/leads/:id/status'], requireAuth, roleMiddleware(['superadmin', 'admin']), inquiryController.updateStatus);
router.post(['/inquiries/:id/delete', '/leads/:id/delete'], requireAuth, roleMiddleware(['superadmin', 'admin']), inquiryController.destroy);

// T-49, T-64, T-65: Settings (Superadmin Only)
router.get('/settings', requireAuth, roleMiddleware(['superadmin']), settingController.index);
router.post(
  '/settings',
  requireAuth,
  roleMiddleware(['superadmin']),
  uploadMedia.fields([
    { name: 'favicon_file', maxCount: 1 },
    { name: 'logo_header_file', maxCount: 1 },
    { name: 'logo_footer_file', maxCount: 1 }
  ]),
  settingController.update
);

// T-50: Banners Management (Superadmin & Admin)
router.get('/banners', requireAuth, roleMiddleware(['superadmin', 'admin']), bannerController.index);
router.get('/banners/create', requireAuth, roleMiddleware(['superadmin', 'admin']), bannerController.createView);
router.post('/banners', requireAuth, roleMiddleware(['superadmin', 'admin']), uploadMedia.single('media_file'), bannerController.store);
router.get('/banners/:id/edit', requireAuth, roleMiddleware(['superadmin', 'admin']), bannerController.editView);
router.post('/banners/:id', requireAuth, roleMiddleware(['superadmin', 'admin']), uploadMedia.single('media_file'), bannerController.update);
router.post('/banners/:id/status', requireAuth, roleMiddleware(['superadmin', 'admin']), bannerController.toggleStatus);
router.post('/banners/:id/delete', requireAuth, roleMiddleware(['superadmin', 'admin']), bannerController.destroy);

// About Us Content Management (Superadmin & Admin)
router.get('/about', requireAuth, roleMiddleware(['superadmin', 'admin']), aboutController.index);
router.post('/about', requireAuth, roleMiddleware(['superadmin', 'admin']), uploadMedia.single('about_image'), aboutController.update);

// T-63: CMS Halaman Kontak (Superadmin & Admin)
router.get('/contact', requireAuth, roleMiddleware(['superadmin', 'admin']), contactCmsController.index);
router.post('/contact', requireAuth, roleMiddleware(['superadmin', 'admin']), contactCmsController.update);

export default router;
