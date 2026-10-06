import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import storage from '../config/storage.js';
import logger from '../utils/logger.js';

// Memory storage to process image buffers directly via Sharp
const memoryStorage = multer.memoryStorage();

// Supported MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon'
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm'
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf'
];

// File filter validator
const mediaFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isIco = ext === '.ico';
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype) || isIco;
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);
  const isDoc = ALLOWED_DOCUMENT_TYPES.includes(file.mimetype);

  if (isImage || isVideo || isDoc) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Format berkas tidak didukung. Harap unggah gambar (JPG, PNG, WebP, SVG, ICO), video (MP4, WebM), atau PDF.'
      ),
      false
    );
  }
};

export const uploadMedia = multer({
  storage: memoryStorage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB max
  fileFilter: mediaFilter
});

// Dimension presets based on context
const DIMENSION_PRESETS = {
  banners: { maxWidth: 1920, maxHeight: 1080, quality: 80 },
  products: { maxWidth: 800, maxHeight: 800, quality: 80 },
  brands: { maxWidth: 400, maxHeight: 400, quality: 80 },
  posts: { maxWidth: 1200, maxHeight: 800, quality: 80 },
  pages: { maxWidth: 1920, maxHeight: 1080, quality: 80 },
  media: { maxWidth: 1600, maxHeight: 1600, quality: 80 },
  settings: { maxWidth: 800, maxHeight: 800, quality: 90 }
};

/**
 * Process image buffer through Sharp and save via storage driver as WebP
 * @param {Buffer} buffer
 * @param {string} subFolder 'banners' | 'products' | 'posts' | 'brands' | 'pages' | 'media'
 * @param {Object} options custom override for dimensions/quality
 * @returns {Promise<string>} public URL path
 */
export const processAndSaveWebP = async (buffer, subFolder = 'media', options = {}) => {
  const preset = DIMENSION_PRESETS[subFolder] || DIMENSION_PRESETS.media;
  const maxWidth = options.maxWidth || preset.maxWidth;
  const maxHeight = options.maxHeight || preset.maxHeight;
  const quality = options.quality || preset.quality;

  const filename = `${subFolder}-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;

  const processedBuffer = await sharp(buffer)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality, effort: 4 })
    .toBuffer();

  const saved = await storage.save(processedBuffer, filename, 'image/webp', subFolder);
  logger.info(`Processed and saved WebP: ${saved.url} (${saved.size} bytes via ${saved.driver})`);
  return saved.url;
};

/**
 * Comprehensive image processor supporting SVG preservation and metadata return
 * @param {Buffer} buffer
 * @param {string} subFolder
 * @param {string} originalName
 * @param {string} mimeType
 * @param {Object} options
 * @returns {Promise<Object>} storage result object { url, filename, size, driver, mimeType }
 */
export const processAndSaveImage = async (buffer, subFolder = 'media', originalName = '', mimeType = 'image/jpeg', options = {}) => {
  // SVG files are saved directly without Sharp rasterization
  if (mimeType === 'image/svg+xml') {
    const filename = `${subFolder}-${Date.now()}-${Math.round(Math.random() * 1e9)}.svg`;
    return await storage.save(buffer, filename, 'image/svg+xml', subFolder);
  }

  const preset = DIMENSION_PRESETS[subFolder] || DIMENSION_PRESETS.media;
  const maxWidth = options.maxWidth || preset.maxWidth;
  const maxHeight = options.maxHeight || preset.maxHeight;
  const quality = options.quality || preset.quality;

  const filename = `${subFolder}-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;

  const processedBuffer = await sharp(buffer)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality, effort: 4 })
    .toBuffer();

  return await storage.save(processedBuffer, filename, 'image/webp', subFolder);
};

/**
 * Save video file buffer via storage driver
 * @param {Buffer} buffer
 * @param {string} originalName
 * @param {string} subFolder 'banners' | 'media'
 * @returns {Promise<string>} public URL path
 */
export const saveVideoFile = async (buffer, originalName = '', subFolder = 'banners') => {
  const ext = path.extname(originalName).toLowerCase() || '.mp4';
  const mimeType = ext === '.webm' ? 'video/webm' : 'video/mp4';
  const filename = `video-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  const saved = await storage.save(buffer, filename, mimeType, subFolder);
  logger.info(`Saved video file: ${saved.url} (${saved.size} bytes via ${saved.driver})`);
  return saved.url;
};

/**
 * Save document file buffer (PDF) via storage driver
 * @param {Buffer} buffer
 * @param {string} originalName
 * @param {string} subFolder
 * @returns {Promise<Object>} storage result
 */
export const saveDocumentFile = async (buffer, originalName = '', subFolder = 'media') => {
  const ext = path.extname(originalName).toLowerCase() || '.pdf';
  const filename = `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  const saved = await storage.save(buffer, filename, 'application/pdf', subFolder);
  logger.info(`Saved document file: ${saved.url} (${saved.size} bytes via ${saved.driver})`);
  return saved;
};

export const processAndSaveVideo = async (buffer, originalName = '', mimeType = 'video/mp4', subFolder = 'media') => {
  const url = await saveVideoFile(buffer, originalName, subFolder);
  return { url };
};

export const processAndSaveDocument = async (buffer, originalName = '', mimeType = 'application/pdf', subFolder = 'media') => {
  return await saveDocumentFile(buffer, originalName, subFolder);
};

/**
 * Delete uploaded file by URL or path
 * @param {string} fileUrl
 * @returns {Promise<boolean>}
 */
export const deleteUploadedFile = async (fileUrl) => {
  return await storage.delete(fileUrl);
};

/**
 * Save settings media (favicon, logo header, logo footer)
 * Preserves transparency and supports ICO, SVG, PNG, WebP
 */
export const saveSettingUpload = async (file, prefix = 'setting') => {
  if (!file || !file.buffer) return null;
  const ext = path.extname(file.originalname).toLowerCase();
  const subFolder = 'settings';

  if (ext === '.ico' || file.mimetype === 'image/x-icon' || file.mimetype === 'image/vnd.microsoft.icon') {
    const filename = `${prefix}-${Date.now()}.ico`;
    const saved = await storage.save(file.buffer, filename, 'image/x-icon', subFolder);
    return saved.url;
  }

  if (ext === '.svg' || file.mimetype === 'image/svg+xml') {
    const filename = `${prefix}-${Date.now()}.svg`;
    const saved = await storage.save(file.buffer, filename, 'image/svg+xml', subFolder);
    return saved.url;
  }

  // PNG or WebP or JPG
  if (ext === '.png' || file.mimetype === 'image/png') {
    // Preserve transparent PNG format for crisp vector/raster corporate logos
    const filename = `${prefix}-${Date.now()}.png`;
    const saved = await storage.save(file.buffer, filename, 'image/png', subFolder);
    return saved.url;
  }

  // Default to optimized WebP
  return await processAndSaveWebP(file.buffer, 'settings', { maxWidth: 800, maxHeight: 800, quality: 90 });
};

export default {
  uploadMedia,
  processAndSaveWebP,
  processAndSaveImage,
  saveSettingUpload,
  saveVideoFile,
  saveDocumentFile,
  deleteUploadedFile
};
