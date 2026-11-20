import {
  listUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser
} from '../../services/userService.js';
import logger from '../../utils/logger.js';

const userRedirect = (res, type, message) =>
  res.redirect(`/admin/users?${type}=${encodeURIComponent(message)}`);

function renderCreateFormError(res, error, formData, status = 400) {
  return res.status(status).render('admin/users/create', {
    title: 'Tambah Pengguna Baru',
    pageTitle: 'Tambah Pengguna',
    activeNav: 'users',
    error,
    formData
  });
}

function renderEditFormError(res, targetUser, error, status = 400) {
  return res.status(status).render('admin/users/edit', {
    title: 'Edit Pengguna',
    pageTitle: 'Edit Pengguna',
    activeNav: 'users',
    targetUser,
    error
  });
}

export const userController = {
  async index(req, res) {
    try {
      const users = await listUsers();
      res.render('admin/users/index', {
        title: 'Manajemen Pengguna',
        pageTitle: 'Pengguna & Hak Akses',
        activeNav: 'users',
        users,
        currentUser: req.user
      });
    } catch (err) {
      logger.error('User controller index error:', err);
      res.status(500).render('admin/users/index', {
        title: 'Manajemen Pengguna',
        pageTitle: 'Pengguna & Hak Akses',
        activeNav: 'users',
        users: [],
        currentUser: req.user,
        error: 'Gagal memuat daftar pengguna.'
      });
    }
  },

  createView(req, res) {
    res.render('admin/users/create', {
      title: 'Tambah Pengguna Baru',
      pageTitle: 'Tambah Pengguna',
      activeNav: 'users',
      error: null
    });
  },

  async store(req, res) {
    try {
      const result = await createUser(req.body);
      if (result.status === 'validation_error') {
        return renderCreateFormError(res, result.error, req.body);
      }
      return userRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('User controller store error:', err);
      return renderCreateFormError(res, 'Terjadi kegagalan server saat menyimpan pengguna baru.', req.body, 500);
    }
  },

  async editView(req, res) {
    try {
      const result = await getUserById(req.params.id);
      if (result.status === 'not_found') return userRedirect(res, 'error', result.error);

      return res.render('admin/users/edit', {
        title: 'Edit Pengguna - ' + result.user.name,
        pageTitle: 'Edit Pengguna',
        activeNav: 'users',
        targetUser: result.user,
        error: null
      });
    } catch (err) {
      logger.error('User controller editView error:', err);
      return userRedirect(res, 'error', 'Gagal membuka halaman edit pengguna.');
    }
  },

  async update(req, res) {
    try {
      const result = await updateUser(req.params.id, req.body);
      if (result.status === 'not_found') return userRedirect(res, 'error', result.error);
      if (result.status === 'validation_error') {
        return renderEditFormError(res, result.user, result.error);
      }
      return userRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('User controller update error:', err);
      return userRedirect(res, 'error', 'Gagal memperbarui pengguna.');
    }
  },

  async destroy(req, res) {
    try {
      const result = await deleteUser(req.params.id, req.user?.id);
      if (result.status !== 'ok') return userRedirect(res, 'error', result.error);
      return userRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('User controller destroy error:', err);
      return userRedirect(res, 'error', 'Gagal menghapus pengguna.');
    }
  }
};

export default userController;
