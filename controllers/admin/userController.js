import bcrypt from 'bcryptjs';
import userModel from '../../models/userModel.js';
import logger from '../../utils/logger.js';

const MIN_PASSWORD_LENGTH = 8;

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

async function resolveUpdatePassword(newPassword) {
  const trimmed = typeof newPassword === 'string' ? newPassword.trim() : '';
  if (!trimmed) return { hash: null, error: null };
  if (trimmed.length < MIN_PASSWORD_LENGTH) {
    return { hash: null, error: `Kata sandi baru minimal harus ${MIN_PASSWORD_LENGTH} karakter.` };
  }
  return { hash: await bcrypt.hash(trimmed, 10), error: null };
}

export const userController = {
  async index(req, res) {
    try {
      const users = await userModel.findAll();
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
      const { name, email, password, role } = req.body;
      if (!name || !email || !password || !role) {
        return renderCreateFormError(res, 'Seluruh kolom (Nama, Email, Sandi, Role) wajib diisi.', req.body);
      }
      if (String(password).trim().length < MIN_PASSWORD_LENGTH) {
        return renderCreateFormError(res, `Kata sandi minimal harus ${MIN_PASSWORD_LENGTH} karakter.`, req.body);
      }
      if (!['superadmin', 'admin', 'editor'].includes(role)) {
        return renderCreateFormError(res, 'Role tidak valid. Pilihan role: Superadmin, Admin, atau Editor.', req.body);
      }
      const existing = await userModel.findByEmail(email.trim().toLowerCase());
      if (existing) {
        return renderCreateFormError(res, 'Alamat email sudah terdaftar dalam sistem.', req.body);
      }

      const hashedPassword = await bcrypt.hash(String(password).trim(), 10);
      await userModel.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role
      });

      res.redirect('/admin/users?success=' + encodeURIComponent('Pengguna baru berhasil ditambahkan.'));
    } catch (err) {
      logger.error('User controller store error:', err);
      renderCreateFormError(res, 'Terjadi kegagalan server saat menyimpan pengguna baru.', req.body, 500);
    }
  },

  async editView(req, res) {
    try {
      const user = await userModel.findById(req.params.id);
      if (!user) {
        return res.redirect('/admin/users?error=' + encodeURIComponent('Pengguna tidak ditemukan.'));
      }

      res.render('admin/users/edit', {
        title: 'Edit Pengguna - ' + user.name,
        pageTitle: 'Edit Pengguna',
        activeNav: 'users',
        targetUser: user,
        error: null
      });
    } catch (err) {
      logger.error('User controller editView error:', err);
      res.redirect('/admin/users?error=' + encodeURIComponent('Gagal membuka halaman edit pengguna.'));
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, email, role, new_password } = req.body;

      const user = await userModel.findById(id);
      if (!user) {
        return res.redirect('/admin/users?error=' + encodeURIComponent('Pengguna tidak ditemukan.'));
      }
      if (role && role !== user.role) {
        const check = await userModel.canDemoteUser(id, role);
        if (!check.canDemote) return renderEditFormError(res, user, check.message);
      }

      const pwResult = await resolveUpdatePassword(new_password);
      if (pwResult.error) return renderEditFormError(res, user, pwResult.error);

      const updateData = {
        name: name ? name.trim() : user.name,
        email: email ? email.trim().toLowerCase() : user.email,
        role: role || user.role,
        ...(pwResult.hash ? { password: pwResult.hash } : {})
      };

      await userModel.update(id, updateData);
      res.redirect('/admin/users?success=' + encodeURIComponent('Data pengguna berhasil diperbarui.'));
    } catch (err) {
      logger.error('User controller update error:', err);
      res.redirect('/admin/users?error=' + encodeURIComponent('Gagal memperbarui pengguna.'));
    }
  },

  async destroy(req, res) {
    try {
      const { id } = req.params;
      const check = await userModel.canDeleteUser(id);
      if (!check.canDelete) {
        return res.redirect('/admin/users?error=' + encodeURIComponent(check.message));
      }

      await userModel.delete(id);
      res.redirect('/admin/users?success=' + encodeURIComponent('Pengguna berhasil dihapus.'));
    } catch (err) {
      logger.error('User controller destroy error:', err);
      res.redirect('/admin/users?error=' + encodeURIComponent('Gagal menghapus pengguna.'));
    }
  }
};

export default userController;
