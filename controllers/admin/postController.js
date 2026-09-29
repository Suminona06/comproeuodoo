import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postModel from '../../models/postModel.js';
import { processAndSaveWebP } from '../../middleware/uploadMiddleware.js';
import logger from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export const postController = {
  async index(req, res) {
    try {
      const posts = await postModel.findAll({});
      res.render('admin/posts/index', {
        title: 'Manajemen Berita & Artikel - PT Euodoo CMS',
        activeNav: 'posts',
        posts,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Post index error:', { message: err.message });
      res.redirect('/admin/dashboard?error=Gagal+memuat+data+berita.');
    }
  },

  async store(req, res) {
    try {
      const { title_id, title_en, content_id, content_en, excerpt_id, excerpt_en, status } = req.body;

      if (!title_id) {
        return res.redirect('/admin/posts?error=Judul+artikel+wajib+diisi.');
      }

      let coverImage = null;
      if (req.file) {
        coverImage = await processAndSaveWebP(req.file.buffer, 'posts', { maxWidth: 1200, maxHeight: 800, quality: 80 });
      }

      const baseSlug = createSlug(title_id);
      const uniqueSuffix = Math.floor(Math.random() * 899 + 100);
      const slug = `${baseSlug}-${uniqueSuffix}`;

      await postModel.create({
        title_id,
        title_en: title_en || title_id,
        slug,
        content_id,
        content_en,
        excerpt_id,
        excerpt_en,
        cover_image: coverImage,
        status: status || 'draft',
        published_at: status === 'published' ? new Date() : null
      });

      return res.redirect('/admin/posts?success=Artikel+berhasil+disimpan.');
    } catch (err) {
      logger.error('Post store error:', { message: err.message });
      return res.redirect(`/admin/posts?error=${encodeURIComponent(err.message)}`);
    }
  },

  async destroy(req, res) {
    const { id } = req.params;
    try {
      const post = await postModel.findById(id);
      if (!post) {
        return res.redirect('/admin/posts?error=Artikel+tidak+ditemukan.');
      }

      await postModel.delete(id);

      if (post.cover_image && post.cover_image.startsWith('/uploads/')) {
        const filePath = path.join(rootDir, 'public', post.cover_image);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      return res.redirect('/admin/posts?success=Artikel+berhasil+dihapus.');
    } catch (err) {
      logger.error('Post destroy error:', { message: err.message });
      return res.redirect(`/admin/posts?error=${encodeURIComponent(err.message)}`);
    }
  }
};

export default postController;
