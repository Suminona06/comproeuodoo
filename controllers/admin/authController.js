import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../../models/userModel.js';
import { APP_CONFIG } from '../../config/constants.js';
import logger from '../../utils/logger.js';

export const authController = {
  /**
   * Render Login View
   */
  loginView(req, res) {
    // If already authenticated via valid cookie, redirect to dashboard
    if (req.user) {
      return res.redirect('/admin/dashboard');
    }

    res.render('admin/login', {
      title: 'Login Admin - PT Euodoo CMS',
      error: req.query.error || null,
      csrfToken: res.locals.csrfToken || ''
    });
  },

  /**
   * Handle Admin Login Submission
   */
  async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).render('admin/login', {
        title: 'Login Admin - PT Euodoo CMS',
        error: 'Email dan kata sandi wajib diisi.',
        csrfToken: res.locals.csrfToken || ''
      });
    }

    try {
      const user = await userModel.findByEmail(email.trim().toLowerCase());

      if (!user) {
        return res.status(401).render('admin/login', {
          title: 'Login Admin - PT Euodoo CMS',
          error: 'Kombinasi email atau kata sandi tidak valid.',
          csrfToken: res.locals.csrfToken || ''
        });
      }

      // Check brute-force lock
      if (userModel.isAccountLocked(user)) {
        const remainingMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / (60 * 1000));
        logger.warn(`Locked account login attempt: ${user.email} (locked for ${remainingMinutes} more mins)`);
        return res.status(403).render('admin/login', {
          title: 'Login Admin - PT Euodoo CMS',
          error: `Akun terkunci sementara karena 5 kali percobaan gagal berturut-turut. Silakan coba kembali dalam ${remainingMinutes} menit.`,
          csrfToken: res.locals.csrfToken || ''
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        const attemptResult = await userModel.recordFailedAttempt(user.id, user.failed_attempts || 0);

        if (attemptResult.isLocked) {
          logger.warn(`Account locked due to 5 consecutive failures: ${user.email}`);
          return res.status(403).render('admin/login', {
            title: 'Login Admin - PT Euodoo CMS',
            error: 'Akun terkunci selama 15 menit karena 5 kali kesalahan kata sandi berturut-turut.',
            csrfToken: res.locals.csrfToken || ''
          });
        }

        return res.status(401).render('admin/login', {
          title: 'Login Admin - PT Euodoo CMS',
          error: `Kombinasi email atau kata sandi tidak valid. Sisa kesempatan: ${attemptResult.attemptsLeft} kali.`,
          csrfToken: res.locals.csrfToken || ''
        });
      }

      // Reset failed attempts on success
      await userModel.resetFailedAttempts(user.id);

      // Sign JWT session token
      const tokenPayload = {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role
      };

      const jwtSecret = process.env.JWT_SECRET || 'euodoo_jwt_secret_dev';
      const token = jwt.sign(tokenPayload, jwtSecret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      });

      // Set HTTP-Only Secure Cookie
      res.cookie(APP_CONFIG.SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      logger.info(`Admin successfully authenticated: ${user.email} (${user.role})`);
      return res.redirect('/admin/dashboard');
    } catch (err) {
      logger.error('Login error:', { message: err.message, stack: err.stack });
      return res.status(500).render('admin/login', {
        title: 'Login Admin - PT Euodoo CMS',
        error: 'Terjadi kendala pada sistem autentikasi. Silakan coba kembali.',
        csrfToken: res.locals.csrfToken || ''
      });
    }
  },

  /**
   * Handle Admin Logout
   */
  logout(req, res) {
    res.clearCookie(APP_CONFIG.SESSION_COOKIE_NAME);
    logger.info(`Admin session terminated: ${req.user ? req.user.email : 'Unknown'}`);
    return res.redirect('/admin/login');
  },

  /**
   * Render Change Password View
   */
  changePasswordView(req, res) {
    res.render('admin/change-password', {
      title: 'Ganti Kata Sandi - PT Euodoo CMS',
      activeNav: 'settings',
      error: null,
      success: null,
      csrfToken: res.locals.csrfToken || ''
    });
  },

  /**
   * Handle Change Password Submission
   */
  async changePassword(req, res) {
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).render('admin/change-password', {
        title: 'Ganti Kata Sandi - PT Euodoo CMS',
        activeNav: 'settings',
        error: 'Semua kolom kata sandi wajib diisi.',
        success: null,
        csrfToken: res.locals.csrfToken || ''
      });
    }

    if (new_password.length < 8) {
      return res.status(400).render('admin/change-password', {
        title: 'Ganti Kata Sandi - PT Euodoo CMS',
        activeNav: 'settings',
        error: 'Kata sandi baru minimal harus 8 karakter.',
        success: null,
        csrfToken: res.locals.csrfToken || ''
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).render('admin/change-password', {
        title: 'Ganti Kata Sandi - PT Euodoo CMS',
        activeNav: 'settings',
        error: 'Konfirmasi kata sandi baru tidak sesuai.',
        success: null,
        csrfToken: res.locals.csrfToken || ''
      });
    }

    try {
      const user = await userModel.findByEmail(req.user.email);
      if (!user) {
        return res.status(404).render('admin/change-password', {
          title: 'Ganti Kata Sandi - PT Euodoo CMS',
          activeNav: 'settings',
          error: 'Pengguna tidak ditemukan dalam sistem.',
          success: null,
          csrfToken: res.locals.csrfToken || ''
        });
      }

      const isCurrentMatch = await bcrypt.compare(current_password, user.password_hash);
      if (!isCurrentMatch) {
        return res.status(400).render('admin/change-password', {
          title: 'Ganti Kata Sandi - PT Euodoo CMS',
          activeNav: 'settings',
          error: 'Kata sandi lama yang Anda masukkan tidak sesuai.',
          success: null,
          csrfToken: res.locals.csrfToken || ''
        });
      }

      const saltRounds = 10;
      const newHash = await bcrypt.hash(new_password, saltRounds);
      await userModel.updatePassword(user.id, newHash);

      logger.info(`Password successfully updated for user: ${user.email}`);
      return res.render('admin/change-password', {
        title: 'Ganti Kata Sandi - PT Euodoo CMS',
        activeNav: 'settings',
        error: null,
        success: 'Kata sandi berhasil diperbarui dengan aman.',
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Change password error:', { message: err.message });
      return res.status(500).render('admin/change-password', {
        title: 'Ganti Kata Sandi - PT Euodoo CMS',
        activeNav: 'settings',
        error: 'Terjadi kegagalan saat memperbarui kata sandi.',
        success: null,
        csrfToken: res.locals.csrfToken || ''
      });
    }
  }
};

export default authController;
