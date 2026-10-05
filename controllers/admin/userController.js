import bcrypt from 'bcryptjs';
import userModel from '../../models/userModel.js';
import logger from '../../utils/logger.js';

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
        return res.status(400).render('admin/users/create', {
          title: 'Tambah Pengguna Baru',
          pageTitle: 'Tambah Pengguna',
          activeNav: 'users',
          error: 'Seluruh kolom (Nama, Email, Sandi, Role) wajib diisi.',
          formData: req.body
        });
      }

      if (!['superadmin', 'admin', 'editor'].includes(role)) {
        return res.status(400).render('admin/users/create', {
          title: 'Tambah Pengguna Baru',
          pageTitle: 'Tambah Pengguna',
          activeNav: 'users',
          error: 'Role tidak valid. Pilihan role: Superadmin, Admin, atau Editor.',
          formData: req.body
        });
      }

      const existing = await userModel.findByEmail(email);
      if (existing) {
        return res.status(400).render('admin/users/create', {
          title: 'Tambah Pengguna Baru',
          pageTitle: 'Tambah Pengguna',
          activeNav: 'users',
          error: 'Alamat email sudah terdaftar dalam sistem.',
          formData: req.body
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await userModel.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role
      });

      res.redirect('/admin/users?success=' + encodeURIComponent('Pengguna baru berhasil ditambahkan.'));
    } catch (err) {
      logger.error('User controller store error:', err);
      res.status(500).render('admin/users/create', {
        title: 'Tambah Pengguna Baru',
        pageTitle: 'Tambah Pengguna',
        activeNav: 'users',
        error: 'Terjadi kegagalan server saat menyimpan pengguna baru.',
        formData: req.body
      });
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
        if (!check.canDemote) {
          return res.status(400).render('admin/users/edit', {
            title: 'Edit Pengguna',
            pageTitle: 'Edit Pengguna',
            activeNav: 'users',
            targetUser: user,
            error: check.message
          });
        }
      }

      const updateData = {
        name: name ? name.trim() : user.name,
        email: email ? email.trim().toLowerCase() : user.email,
        role: role || user.role
      };

      if (new_password && new_password.trim().length >= 6) {
        updateData.password = await bcrypt.hash(new_password.trim(), 10);
      }

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
