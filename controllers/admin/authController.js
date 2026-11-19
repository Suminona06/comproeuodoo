import { APP_CONFIG } from '../../config/constants.js';
import {
  authenticateAdmin,
  changeAdminPassword
} from '../../services/authService.js';
import logger from '../../utils/logger.js';

const LOGIN_TITLE = 'Login Admin - PT Euodoo CMS';
const CHANGE_PWD_TITLE = 'Ganti Kata Sandi - PT Euodoo CMS';

function renderLoginView(res, { statusCode, error = null } = {}) {
  const target = statusCode ? res.status(statusCode) : res;
  return target.render('admin/login', {
    title: LOGIN_TITLE,
    error,
    csrfToken: res.locals.csrfToken || ''
  });
}

function renderChangePasswordView(res, { statusCode, error = null, success = null } = {}) {
  const target = statusCode ? res.status(statusCode) : res;
  return target.render('admin/change-password', {
    title: CHANGE_PWD_TITLE,
    activeNav: 'password',
    error,
    success,
    csrfToken: res.locals.csrfToken || ''
  });
}

function logLockedLogin(result) {
  if (result.justLocked) {
    logger.warn(`Account locked due to 5 consecutive failures: ${result.email}`);
    return;
  }
  logger.warn(`Locked account login attempt: ${result.email} (locked for ${result.remainingMinutes} more mins)`);
}

export const authController = {
  loginView(req, res) {
    if (req.user) {
      return res.redirect('/admin/dashboard');
    }
    return renderLoginView(res, { error: req.query.error || null });
  },

  async login(req, res) {
    try {
      const result = await authenticateAdmin(req.body);
      if (result.status === 'locked') {
        logLockedLogin(result);
        return renderLoginView(res, { statusCode: result.statusCode, error: result.error });
      }
      if (result.status !== 'ok') {
        return renderLoginView(res, { statusCode: result.statusCode, error: result.error });
      }

      res.cookie(result.cookieName, result.token, result.cookieOptions);
      logger.info(`Admin successfully authenticated: ${result.user.email} (${result.user.role})`);
      return res.redirect('/admin/dashboard');
    } catch (err) {
      logger.error('Login error:', { message: err.message, stack: err.stack });
      return renderLoginView(res, {
        statusCode: 500,
        error: 'Terjadi kendala pada sistem autentikasi. Silakan coba kembali.'
      });
    }
  },

  logout(req, res) {
    res.clearCookie(APP_CONFIG.SESSION_COOKIE_NAME);
    logger.info(`Admin session terminated: ${req.user ? req.user.email : 'Unknown'}`);
    return res.redirect('/admin/login');
  },

  changePasswordView(req, res) {
    return renderChangePasswordView(res, {
      error: req.query.error || null,
      success: req.query.success || null
    });
  },

  async changePassword(req, res) {
    try {
      const result = await changeAdminPassword(req.user?.email, req.body);
      if (result.status !== 'ok') {
        return renderChangePasswordView(res, {
          statusCode: result.statusCode,
          error: result.error
        });
      }
      logger.info(`Password successfully updated for user: ${result.email}`);
      return renderChangePasswordView(res, { success: result.message });
    } catch (err) {
      logger.error('Change password error:', { message: err.message });
      return renderChangePasswordView(res, {
        statusCode: 500,
        error: 'Terjadi kegagalan saat memperbarui kata sandi.'
      });
    }
  }
};

export default authController;
