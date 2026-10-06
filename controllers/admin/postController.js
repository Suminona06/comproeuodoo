import postModel from '../../models/postModel.js';
import postCategoryModel from '../../models/postCategoryModel.js';
import slugRedirectModel from '../../models/slugRedirectModel.js';
import { processAndSaveWebP } from '../../middleware/uploadMiddleware.js';
import storage from '../../config/storage.js';
import { invalidateSitemapCache } from '../../utils/sitemapGenerator.js';
import logger from '../../utils/logger.js';

const formatSlug = (text) => {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/\-\-+/g, '-');
};

export const postController = {
  async index(req, res) {
    try {
      const type = req.query.type || null;
      const status = req.query.status || null;
      const search = req.query.search || null;

      const [posts, categories] = await Promise.all([
        postModel.findAll({ type, status, search }),
        postCategoryModel.findAll()
      ]);

      res.render('admin/posts/index', {
        title: 'Manajemen Berita & Artikel',
        pageTitle: 'Berita & Artikel Publikasi',
        activeNav: 'posts',
        posts,
        categories,
        currentType: type,
        currentStatus: status,
        searchQuery: search,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Post index error:', { message: err.message });
      res.status(500).render('admin/posts/index', {
        title: 'Berita & Artikel',
        pageTitle: 'Berita & Publikasi',
        activeNav: 'posts',
        posts: [],
        categories: [],
        currentType: null,
        currentStatus: null,
        searchQuery: null,
        error: 'Gagal memuat daftar artikel.'
      });
    }
  },

  async createView(req, res) {
    try {
      const categories = await postCategoryModel.findAll();
      res.render('admin/posts/create', {
        title: 'Tulis Artikel Baru',
        pageTitle: 'Tulis Artikel Baru',
        activeNav: 'posts',
        categories,
        error: null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Post createView error:', err);
      res.redirect('/admin/posts?error=' + encodeURIComponent('Gagal membuka form tulis artikel.'));
    }
  },

  async store(req, res) {
    try {
      const {
        title_id, title_en, type, category_id, content_id, content_en,
        status, scheduled_at, is_headline,
        meta_title_id, meta_title_en, meta_desc_id, meta_desc_en
      } = req.body;

      if (!title_id || title_id.trim() === '') {
        const categories = await postCategoryModel.findAll();
        return res.status(400).render('admin/posts/create', {
          title: 'Tulis Artikel Baru',
          pageTitle: 'Tulis Artikel',
          activeNav: 'posts',
          categories,
          error: 'Judul artikel (Bahasa Indonesia) wajib diisi.',
          formData: req.body,
          csrfToken: res.locals.csrfToken || ''
        });
      }

      let imageUrl = null;
      if (req.file) {
        imageUrl = await processAndSaveWebP(req.file.buffer, 'posts', { maxWidth: 1200, maxHeight: 800, quality: 80 });
      }

      let cleanSlug = (req.body.slug && req.body.slug.trim()) ? formatSlug(req.body.slug) : formatSlug(title_id);
      
      if (!cleanSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
        const categories = await postCategoryModel.findAll();
        return res.status(400).render('admin/posts/create', {
          title: 'Tulis Artikel Baru',
          pageTitle: 'Tulis Artikel',
          activeNav: 'posts',
          categories,
          error: 'Format slug URL tidak valid. Gunakan huruf kecil, angka, dan tanda hubung (-) tanpa spasi.',
          formData: req.body,
          csrfToken: res.locals.csrfToken || ''
        });
      }

      const slugTaken = await postModel.isSlugTaken(cleanSlug);
      if (slugTaken) {
        const categories = await postCategoryModel.findAll();
        return res.status(400).render('admin/posts/create', {
          title: 'Tulis Artikel Baru',
          pageTitle: 'Tulis Artikel',
          activeNav: 'posts',
          categories,
          error: `Slug URL "${cleanSlug}" sudah digunakan oleh artikel lain. Silakan ubah slug artikel.`,
          formData: req.body,
          csrfToken: res.locals.csrfToken || ''
        });
      }

      let postStatus = status || 'draft';
      let scheduleDate = null;
      if (postStatus === 'scheduled' && scheduled_at) {
        scheduleDate = new Date(scheduled_at);
      }

      await postModel.create({
        title_id: title_id.trim(),
        title_en: title_en ? title_en.trim() : title_id.trim(),
        slug: cleanSlug,
        type: type || 'berita',
        category_id: category_id ? parseInt(category_id, 10) : null,
        content_id: content_id || null,
        content_en: content_en || null,
        image_url: imageUrl,
        status: postStatus,
        scheduled_at: scheduleDate,
        is_headline: is_headline === 'on' || is_headline === '1' || is_headline === true,
        meta_title_id: meta_title_id || null,
        meta_title_en: meta_title_en || null,
        meta_desc_id: meta_desc_id || null,
        meta_desc_en: meta_desc_en || null
      });

      invalidateSitemapCache();
      res.redirect('/admin/posts?success=' + encodeURIComponent('Artikel berhasil disimpan.'));
    } catch (err) {
      logger.error('Post store error:', { message: err.message });
      res.redirect('/admin/posts?error=' + encodeURIComponent('Gagal menyimpan artikel: ' + err.message));
    }
  },

  async editView(req, res) {
    try {
      const [post, categories] = await Promise.all([
        postModel.findById(req.params.id),
        postCategoryModel.findAll()
      ]);

      if (!post) {
        return res.redirect('/admin/posts?error=' + encodeURIComponent('Artikel tidak ditemukan.'));
      }

      res.render('admin/posts/edit', {
        title: 'Edit Artikel - ' + post.title_id,
        pageTitle: 'Edit Artikel',
        activeNav: 'posts',
        post,
        categories,
        error: null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Post editView error:', err);
      res.redirect('/admin/posts?error=' + encodeURIComponent('Gagal membuka halaman edit artikel.'));
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        title_id, title_en, type, category_id, content_id, content_en,
        status, scheduled_at, is_headline,
        meta_title_id, meta_title_en, meta_desc_id, meta_desc_en
      } = req.body;

      const post = await postModel.findById(id);
      if (!post) {
        return res.redirect('/admin/posts?error=' + encodeURIComponent('Artikel tidak ditemukan.'));
      }

      let cleanSlug = (req.body.slug && req.body.slug.trim()) ? formatSlug(req.body.slug) : post.slug;

      if (!cleanSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
        const categories = await postCategoryModel.findAll();
        return res.status(400).render('admin/posts/edit', {
          title: 'Edit Artikel - ' + post.title_id,
          pageTitle: 'Edit Artikel',
          activeNav: 'posts',
          post: { ...post, ...req.body },
          categories,
          error: 'Format slug URL tidak valid. Gunakan huruf kecil, angka, dan tanda hubung (-).',
          csrfToken: res.locals.csrfToken || ''
        });
      }

      const slugTaken = await postModel.isSlugTaken(cleanSlug, id);
      if (slugTaken) {
        const categories = await postCategoryModel.findAll();
        return res.status(400).render('admin/posts/edit', {
          title: 'Edit Artikel - ' + post.title_id,
          pageTitle: 'Edit Artikel',
          activeNav: 'posts',
          post: { ...post, ...req.body },
          categories,
          error: `Slug URL "${cleanSlug}" sudah digunakan oleh artikel lain. Silakan gunakan slug yang berbeda.`,
          csrfToken: res.locals.csrfToken || ''
        });
      }

      const updateData = {
        title_id: title_id ? title_id.trim() : post.title_id,
        title_en: title_en ? title_en.trim() : post.title_en,
        type: type || post.type,
        category_id: category_id ? parseInt(category_id, 10) : null,
        content_id: content_id !== undefined ? content_id : post.content_id,
        content_en: content_en !== undefined ? content_en : post.content_en,
        status: status || post.status,
        scheduled_at: status === 'scheduled' && scheduled_at ? new Date(scheduled_at) : null,
        is_headline: is_headline === 'on' || is_headline === '1' || is_headline === true,
        meta_title_id: meta_title_id || null,
        meta_title_en: meta_title_en || null,
        meta_desc_id: meta_desc_id || null,
        meta_desc_en: meta_desc_en || null
      };

      if (cleanSlug !== post.slug) {
        await slugRedirectModel.createRedirect('post', post.id, post.slug, cleanSlug);
        updateData.slug = cleanSlug;
      }

      if (req.file) {
        if (post.display_image) {
          await storage.delete(post.display_image);
        }
        updateData.image_url = await processAndSaveWebP(req.file.buffer, 'posts', { maxWidth: 1200, maxHeight: 800, quality: 80 });
      }

      await postModel.update(id, updateData);
      invalidateSitemapCache();
      res.redirect('/admin/posts?success=' + encodeURIComponent('Artikel berhasil diperbarui.'));
    } catch (err) {
      logger.error('Post update error:', err);
      res.redirect('/admin/posts?error=' + encodeURIComponent('Gagal memperbarui artikel: ' + err.message));
    }
  },

  async destroy(req, res) {
    try {
      const { id } = req.params;
      const post = await postModel.findById(id);
      if (post && post.display_image) {
        await storage.delete(post.display_image);
      }
      await Promise.all([
        postModel.delete(id),
        slugRedirectModel.deleteByEntity('post', id)
      ]);
      invalidateSitemapCache();
      res.redirect('/admin/posts?success=' + encodeURIComponent('Artikel berhasil dihapus.'));
    } catch (err) {
      logger.error('Post destroy error:', err);
      res.redirect('/admin/posts?error=' + encodeURIComponent('Gagal menghapus artikel.'));
    }
  }
};

export default postController;
