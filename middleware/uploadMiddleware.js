import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Ensure destination directories exist
const uploadDirs = ['banners', 'products', 'posts'];
uploadDirs.forEach((dir) => {
  const dirPath = path.join(rootDir, 'public', 'uploads', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Configure Multer Memory Storage for Image Processing with Sharp
const memoryStorage = multer.memoryStorage();

// Disk storage for direct video uploads (bypassing Sharp memory buffer)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(rootDir, 'public', 'uploads', 'banners'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

// File filter for images and videos
const mediaFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm'];

  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format berkas tidak didukung. Harap unggah gambar (JPG, PNG, WebP) atau video (MP4, WebM).'), false);
  }
};

export const uploadMedia = multer({
  storage: memoryStorage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB max
  fileFilter: mediaFilter
});

/**
 * Process image buffer through Sharp and save as WebP
 * @param {Buffer} buffer
 * @param {string} subFolder 'banners' | 'products' | 'posts'
 * @param {Object} options { maxWidth: 1920, maxHeight: 1080, quality: 80 }
 * @returns {Promise<string>} relative URL path e.g. /uploads/banners/filename.webp
 */
export const processAndSaveWebP = async (buffer, subFolder, options = {}) => {
  const maxWidth = options.maxWidth || 1920;
  const maxHeight = options.maxHeight || 1080;
  const quality = options.quality || 82;

  const filename = `${subFolder}-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
  const targetDir = path.join(rootDir, 'public', 'uploads', subFolder);
  const targetPath = path.join(targetDir, filename);

  await sharp(buffer)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality })
    .toFile(targetPath);

  logger.info(`Saved processed WebP image: /uploads/${subFolder}/${filename}`);
  return `/uploads/${subFolder}/${filename}`;
};

/**
 * Save video file buffer to disk
 * @param {Buffer} buffer
 * @param {string} originalName
 * @returns {Promise<string>} relative URL path
 */
export const saveVideoFile = async (buffer, originalName) => {
  const ext = path.extname(originalName).toLowerCase() || '.mp4';
  const filename = `video-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const targetDir = path.join(rootDir, 'public', 'uploads', 'banners');
  const targetPath = path.join(targetDir, filename);

  fs.writeFileSync(targetPath, buffer);
  logger.info(`Saved video file: /uploads/banners/${filename}`);
  return `/uploads/banners/${filename}`;
};

export default {
  uploadMedia,
  processAndSaveWebP,
  saveVideoFile
};
