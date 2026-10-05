import logger from '../utils/logger.js';

/**
 * Role-Based Access Control Middleware
 * Roles: 'superadmin', 'admin', 'editor'
 * 
 * Matrix:
 * - superadmin: Full access (Users, Settings, Banners, Pages, Products, Posts, Brands, Inquiries, Export)
 * - admin: Operations (Banners, Pages, Products, Posts, Brands, Inquiries, Export, Media Library)
 * - editor: Content only (Posts, Post Categories, Media Library browse & upload)
 * 
 * @param {Array<string>} allowedRoles
 */
export const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ success: false, error: 'Sesi kedaluwarsa. Silakan login kembali.' });
      }
      return res.redirect('/admin/login');
    }

    const userRole = req.user.role;

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      logger.warn(`Unauthorized role access: ${req.user.email} (${userRole}) tried to access ${req.originalUrl}`);

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(403).json({
          success: false,
          error: 'Akses ditolak: Anda tidak memiliki wewenang untuk tindakan ini.'
        });
      }

      // Check if 403 template exists, otherwise fallback to styled response
      return res.status(403).render('admin/403', {
        title: '403 Akses Ditolak - PT Euodoo CMS',
        user: req.user,
        message: `Role Anda (${userRole}) tidak memiliki izin untuk mengakses halaman ini.`
      }, (err, html) => {
        if (err) {
          return res.status(403).send(`
            <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 80px auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center; background: #ffffff;">
              <h2 style="color: #b91c1c; margin-bottom: 8px;">403 - Akses Ditolak</h2>
              <p style="color: #4b5563; margin-bottom: 24px;">Role akun Anda (${userRole}) tidak memiliki wewenang untuk membuka halaman ini.</p>
              <a href="/admin/dashboard" style="display: inline-block; padding: 10px 20px; background: #0055b8; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">Kembali ke Dashboard</a>
            </div>
          `);
        }
        res.send(html);
      });
    }

    next();
  };
};

export const requireRole = roleMiddleware;
export default roleMiddleware;
