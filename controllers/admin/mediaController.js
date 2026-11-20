import {
  getMediaLibraryViewData,
  buildEmptyMediaLibraryViewData,
  getMediaPickerList,
  uploadAndCreateMedia,
  registerYoutubeMedia,
  checkMediaUsage,
  deleteMediaItem
} from '../../services/mediaService.js';
import { cleanupTempFile } from '../../middleware/uploadMiddleware.js';
import logger from '../../utils/logger.js';

const wantsJson = (req) =>
  Boolean(req.xhr || req.headers?.accept?.includes('application/json') || req.query?.format === 'json');

const mediaRedirect = (res, type, message) =>
  res.redirect(`/admin/media?${type}=${encodeURIComponent(message)}`);

function renderMediaIndex(res, data, user, status) {
  const target = status ? res.status(status) : res;
  return target.render('admin/media/index', {
    title: 'Media Library Terpadu',
    pageTitle: 'Media Library',
    activeNav: 'media',
    ...data,
    user
  });
}

function respondDestroyResult(res, isJson, result) {
  if (result.status === 'not_found') {
    return isJson
      ? res.status(404).json({ success: false, message: 'Media tidak ditemukan.' })
      : mediaRedirect(res, 'error', 'Media tidak ditemukan.');
  }
  if (result.status === 'in_use') {
    if (isJson) return res.status(409).json({ success: false, inUse: true, usages: result.usages });
    const usageList = result.usages.map((u) => `${u.source}: ${u.label}`).join(', ');
    return mediaRedirect(res, 'error', `Media sedang aktif digunakan pada: ${usageList}. Gunakan force delete jika ingin tetap menghapus.`);
  }
  return isJson
    ? res.json({ success: true, message: 'Media berhasil dihapus.' })
    : mediaRedirect(res, 'success', 'Media berhasil dihapus.');
}

export const mediaController = {
  async index(req, res) {
    try {
      const data = await getMediaLibraryViewData(req.query);
      const messages = { error: req.query.error || null, success: req.query.success || null };
      return renderMediaIndex(res, { ...data, ...messages }, req.user);
    } catch (err) {
      logger.error('Media controller index error:', err);
      return renderMediaIndex(res, buildEmptyMediaLibraryViewData(), req.user, 500);
    }
  },

  async upload(req, res) {
    try {
      const result = await uploadAndCreateMedia(req.file, req.user?.id);
      if (result.status === 'missing_file') {
        return mediaRedirect(res, 'error', 'Pilih berkas file yang ingin diunggah.');
      }
      if (result.status === 'unsupported_type') {
        return mediaRedirect(res, 'error', 'Tipe file tidak didukung.');
      }
      return mediaRedirect(res, 'success', 'Berkas media berhasil diunggah.');
    } catch (err) {
      logger.error('Media controller upload error:', err);
      return mediaRedirect(res, 'error', 'Gagal mengunggah media: ' + err.message);
    } finally {
      await cleanupTempFile(req.file);
    }
  },

  async addYoutube(req, res) {
    try {
      const result = await registerYoutubeMedia({
        youtubeUrl: req.body?.youtube_url,
        title: req.body?.title,
        userId: req.user?.id
      });
      if (result.status === 'invalid_url') {
        return mediaRedirect(res, 'error', 'Tautan YouTube tidak valid. Harap gunakan URL video YouTube resmi.');
      }
      return mediaRedirect(res, 'success', 'Tautan video YouTube berhasil didaftarkan.');
    } catch (err) {
      logger.error('Media controller addYoutube error:', err);
      return mediaRedirect(res, 'error', 'Gagal menambahkan video YouTube.');
    }
  },

  async destroy(req, res) {
    const isJson = wantsJson(req);
    try {
      const isForce = req.query?.force === 'true' || req.body?.force === 'true';
      const result = await deleteMediaItem(req.params.id, { force: isForce });
      return respondDestroyResult(res, isJson, result);
    } catch (err) {
      logger.error('Media controller destroy error:', err);
      return isJson
        ? res.status(500).json({ success: false, message: err.message })
        : mediaRedirect(res, 'error', 'Gagal menghapus media.');
    }
  },

  async apiList(req, res) {
    try {
      const { list, pagination } = await getMediaPickerList(req.query);
      return res.json({ success: true, data: list, pagination });
    } catch (err) {
      logger.error('mediaController.apiList error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async apiUpload(req, res) {
    try {
      const result = await uploadAndCreateMedia(req.file, req.user?.id, { includeRecord: true });
      if (result.status === 'missing_file') {
        return res.status(400).json({ success: false, message: 'Pilih berkas file yang ingin diunggah.' });
      }
      if (result.status === 'unsupported_type') {
        return res.status(400).json({ success: false, message: 'Tipe file tidak didukung.' });
      }
      return res.json({ success: true, data: result.media });
    } catch (err) {
      logger.error('mediaController.apiUpload error:', err);
      return res.status(500).json({ success: false, message: 'Gagal mengunggah media: ' + err.message });
    } finally {
      await cleanupTempFile(req.file);
    }
  },

  async apiCheckUsage(req, res) {
    try {
      const body = req.body || {};
      const query = req.query || {};
      const fileUrl = body.file_url || query.file_url;
      const mediaId = body.media_id || query.media_id || null;
      const usage = await checkMediaUsage(fileUrl, mediaId);
      return res.json(usage);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

export default mediaController;
