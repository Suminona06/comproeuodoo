import multer from 'multer';
import sharp from 'sharp';
import os from 'node:os';
import path from 'path';
import fs from 'fs';
import { UPLOAD_CONFIG } from '../config/constants.js';
import storage from '../config/storage.js';
import logger from '../utils/logger.js';

const memoryStorage = multer.memoryStorage();
const tempDiskStorage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `euodoo-tmp-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

// Supported MIME types (SVG excluded to prevent same-origin stored XSS)
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/x-icon',
  'image/vnd.microsoft.icon'
];

const SVG_EXTENSION_RE = /\.svgz?$/i;

function isSvgUpload(originalName = '', mimeType = '') {
  const ext = path.extname(originalName).toLowerCase();
  return SVG_EXTENSION_RE.test(ext) || String(mimeType).toLowerCase().includes('svg');
}

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];

// File filter validator
const mediaFilter = (req, file, cb) => {
  if (isSvgUpload(file.originalname, file.mimetype)) {
    return cb(new Error('Format berkas SVG tidak diizinkan demi keamanan.'), false);
  }
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
        'Format berkas tidak didukung. Harap unggah gambar (JPG, PNG, WebP, ICO), video (MP4, WebM), atau PDF.'
      ),
      false
    );
  }
};

export const uploadMedia = multer({
  storage: memoryStorage,
  limits: { fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE },
  fileFilter: mediaFilter
});

export const uploadLargeMedia = multer({
  storage: tempDiskStorage,
  limits: { fileSize: UPLOAD_CONFIG.MAX_MEDIA_STREAM_SIZE },
  fileFilter: mediaFilter
});

export const cleanupTempFile = async (file) => {
  if (file?.path) await fs.promises.unlink(file.path).catch(() => {});
};

function persistUploadSource(source, filename, mimeType, subFolder) {
  return typeof source === 'string'
    ? storage.saveFromFile(source, filename, mimeType, subFolder)
    : storage.save(source, filename, mimeType, subFolder);
}

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

async function saveWebpAsset(buffer, subFolder = 'media', options = {}) {
  const preset = DIMENSION_PRESETS[subFolder] || DIMENSION_PRESETS.media;
  const maxWidth = options.maxWidth || preset.maxWidth;
  const maxHeight = options.maxHeight || preset.maxHeight;
  const quality = options.quality || preset.quality;
  const filename = `${subFolder}-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;

  const processedBuffer = await sharp(buffer)
    .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toBuffer();

  return await storage.save(processedBuffer, filename, 'image/webp', subFolder);
}

/**
 * Process image buffer through Sharp and save via storage driver as WebP
 * @param {Buffer} buffer
 * @param {string} subFolder 'banners' | 'products' | 'posts' | 'brands' | 'pages' | 'media'
 * @param {Object} options custom override for dimensions/quality
 * @returns {Promise<string>} public URL path
 */
export const processAndSaveWebP = async (buffer, subFolder = 'media', options = {}) => {
  const saved = await saveWebpAsset(buffer, subFolder, options);
  logger.info(`Processed and saved WebP: ${saved.url} (${saved.size} bytes via ${saved.driver})`);
  return saved.url;
};

/**
 * Process raster image buffer via Sharp and return metadata
 * @param {Buffer} buffer
 * @param {string} subFolder
 * @param {string} originalName
 * @param {string} mimeType
 * @param {Object} options
 * @returns {Promise<Object>} storage result object { url, filename, size, driver, mimeType }
 */
export const processAndSaveImage = async (buffer, subFolder = 'media', originalName = '', mimeType = 'image/jpeg', options = {}) => {
  if (isSvgUpload(originalName, mimeType)) {
    throw new Error('Format berkas SVG tidak diizinkan.');
  }
  return await saveWebpAsset(buffer, subFolder, options);
};

export const saveVideoFile = async (source, originalName = '', subFolder = 'banners') => {
  const ext = path.extname(originalName).toLowerCase() || '.mp4';
  const mimeType = ext === '.webm' ? 'video/webm' : 'video/mp4';
  const filename = `video-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  const saved = await persistUploadSource(source, filename, mimeType, subFolder);
  logger.info(`Saved video file: ${saved.url} (${saved.size} bytes via ${saved.driver})`);
  return saved.url;
};

export const saveDocumentFile = async (source, originalName = '', subFolder = 'media') => {
  const ext = path.extname(originalName).toLowerCase() || '.pdf';
  const filename = `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  const saved = await persistUploadSource(source, filename, 'application/pdf', subFolder);
  logger.info(`Saved document file: ${saved.url} (${saved.size} bytes via ${saved.driver})`);
  return saved;
};

export const processAndSaveVideo = async (source, originalName = '', _mimeType = 'video/mp4', subFolder = 'media') => {
  const url = await saveVideoFile(source, originalName, subFolder);
  return { url };
};

export const processAndSaveDocument = async (source, originalName = '', _mimeType = 'application/pdf', subFolder = 'media') => {
  return await saveDocumentFile(source, originalName, subFolder);
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
 * Preserves transparency and supports ICO, PNG, WebP
 */
export const saveSettingUpload = async (file, prefix = 'setting') => {
  if (!file || !file.buffer) return null;
  if (isSvgUpload(file.originalname, file.mimetype)) {
    throw new Error('Format berkas SVG tidak diizinkan.');
  }
  const ext = path.extname(file.originalname).toLowerCase();
  const subFolder = 'settings';

  if (ext === '.ico' || file.mimetype === 'image/x-icon' || file.mimetype === 'image/vnd.microsoft.icon') {
    const filename = `${prefix}-${Date.now()}.ico`;
    const saved = await storage.save(file.buffer, filename, 'image/x-icon', subFolder);
    return saved.url;
  }

  if (ext === '.png' || file.mimetype === 'image/png') {
    const filename = `${prefix}-${Date.now()}.png`;
    const saved = await storage.save(file.buffer, filename, 'image/png', subFolder);
    return saved.url;
  }

  return await processAndSaveWebP(file.buffer, 'settings', { maxWidth: 800, maxHeight: 800, quality: 90 });
};

async function readFaviconSourceBuffer(source) {
  if (Buffer.isBuffer(source)) return source;
  if (typeof source !== 'string' || !source.trim()) {
    throw new Error('Sumber berkas favicon tidak valid.');
  }
  const trimmed = source.trim();
  const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  const resolvedPath = path.isAbsolute(cleanPath) ? cleanPath : path.join(process.cwd(), 'public', cleanPath);
  const altPath = path.join(process.cwd(), cleanPath);
  if (fs.existsSync(resolvedPath)) return await fs.promises.readFile(resolvedPath);
  if (fs.existsSync(altPath)) return await fs.promises.readFile(altPath);
  throw new Error(`Berkas sumber favicon tidak ditemukan di: ${resolvedPath}`);
}

async function syncRootFavicon(pngBuffer) {
  try {
    const rootFaviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
    await fs.promises.writeFile(rootFaviconPath, pngBuffer);
  } catch (err) {
    logger.warn(`Could not sync public/favicon.ico: ${err.message}`);
  }
}

/**
 * Generate multi-size square favicon package (16, 32, 180, 192, 512)
 * Preserves transparency and uses Sharp fit: 'contain' with balanced optical padding
 * @param {Buffer|string} source Buffer or file path / URL
 * @returns {Promise<{ favicon: string, sizes: Object }>}
 */
export const generateFaviconSet = async (source) => {
  const inputBuffer = await readFaviconSourceBuffer(source);
  const sourceToProcess = await sharp(inputBuffer).trim().toBuffer().catch(() => inputBuffer);
  const sizes = [16, 32, 180, 192, 512];
  const results = {};

  for (const size of sizes) {
    const finalBuffer = await sharp(sourceToProcess)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();

    const saved = await storage.save(finalBuffer, `favicon-${size}x${size}.png`, 'image/png', 'settings');
    results[size] = saved.url;
    if (size === 32) await syncRootFavicon(finalBuffer);
  }

  logger.info(`Generated multi-size favicon package: ${Object.values(results).join(', ')}`);
  return { favicon: results[32], sizes: results };
};

export default {
  uploadMedia,
  uploadLargeMedia,
  cleanupTempFile,
  processAndSaveWebP,
  processAndSaveImage,
  saveSettingUpload,
  generateFaviconSet,
  saveVideoFile,
  saveDocumentFile,
  deleteUploadedFile
};
