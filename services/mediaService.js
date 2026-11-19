import mediaModel from '../models/mediaModel.js';
import {
  processAndSaveImage,
  processAndSaveVideo,
  processAndSaveDocument
} from '../middleware/uploadMiddleware.js';
import storage from '../config/storage.js';
import { extractYouTubeId } from '../utils/youtube.js';

const MEDIA_LIBRARY_LIMIT = 40;
const EMPTY_MEDIA_COUNTS = { all: 0, image: 0, video: 0, document: 0, youtube: 0 };

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/x-icon',
  'image/vnd.microsoft.icon'
]);
const ALLOWED_VIDEO_MIMES = new Set(['video/mp4', 'video/webm']);

const MEDIA_PROCESSORS = [
  {
    match: (mime) => ALLOWED_IMAGE_MIMES.has(mime),
    mediaType: 'image',
    process: (source, file) => processAndSaveImage(source, 'media', file.originalname, file.mimetype)
  },
  {
    match: (mime) => ALLOWED_VIDEO_MIMES.has(mime),
    mediaType: 'video',
    process: (source, file) => processAndSaveVideo(source, file.originalname, file.mimetype, 'media')
  },
  {
    match: (mime) => mime === 'application/pdf',
    mediaType: 'document',
    process: (source, file) => processAndSaveDocument(source, file.originalname, file.mimetype, 'media')
  }
];

function parsePositiveInt(rawValue, fallback) {
  const parsed = parseInt(rawValue, 10);
  return parsed > 0 ? parsed : fallback;
}

function resolveMediaProcessor(mimeType) {
  const mime = String(mimeType || '').toLowerCase();
  return MEDIA_PROCESSORS.find((entry) => entry.match(mime));
}

async function findBlockingUsages(media, force) {
  if (force || !media.file_url) return [];
  return await mediaModel.checkUsage(media.file_url);
}

export async function getMediaLibraryViewData(rawQuery) {
  const query = rawQuery || {};
  const type = query.type || 'all';
  const search = query.search || '';
  const currentPage = parsePositiveInt(query.page, 1);
  const offset = (currentPage - 1) * MEDIA_LIBRARY_LIMIT;

  const [mediaList, totalCount, countsByType] = await Promise.all([
    mediaModel.findAll({ mediaType: type, search, limit: MEDIA_LIBRARY_LIMIT, offset }),
    mediaModel.count({ mediaType: type, search }),
    mediaModel.countByType()
  ]);

  return {
    mediaList,
    totalCount,
    countsByType,
    currentType: type,
    searchQuery: search,
    currentPage,
    totalPages: Math.ceil(totalCount / MEDIA_LIBRARY_LIMIT) || 1
  };
}

export function buildEmptyMediaLibraryViewData(errorMsg) {
  return {
    mediaList: [],
    totalCount: 0,
    countsByType: { ...EMPTY_MEDIA_COUNTS },
    currentType: 'all',
    searchQuery: '',
    currentPage: 1,
    totalPages: 1,
    error: errorMsg || 'Gagal memuat media library.'
  };
}

export async function getMediaPickerList(rawQuery) {
  const query = rawQuery || {};
  const type = query.type || 'all';
  const search = query.search || '';
  const parsedLimit = Math.min(parsePositiveInt(query.limit, 24), 100);
  const parsedPage = parsePositiveInt(query.page, 1);
  const offset = (parsedPage - 1) * parsedLimit;

  const [list, total] = await Promise.all([
    mediaModel.findAll({ mediaType: type, search, limit: parsedLimit, offset }),
    mediaModel.count({ mediaType: type, search })
  ]);

  return {
    list,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit) || 1
    }
  };
}

export async function uploadAndCreateMedia(file, userId, options) {
  if (!file) return { status: 'missing_file', id: null, media: null };
  const handler = resolveMediaProcessor(file.mimetype);
  if (!handler) return { status: 'unsupported_type', id: null, media: null };

  const source = file.path || file.buffer;
  const result = await handler.process(source, file);
  const id = await mediaModel.create({
    filename: file.originalname,
    file_url: result.url,
    mime_type: file.mimetype,
    file_size: file.size,
    media_type: handler.mediaType,
    created_by: userId || null
  });
  const media = options?.includeRecord ? await mediaModel.findById(id) : null;
  return { status: 'created', id, media };
}

export async function registerYoutubeMedia(input) {
  const { youtubeUrl, title, userId } = input || {};
  const youtubeId = extractYouTubeId(youtubeUrl);
  if (!youtubeId) return { status: 'invalid_url', id: null };

  const trimmedTitle = typeof title === 'string' ? title.trim() : '';
  const filename = trimmedTitle || `YouTube Video (${youtubeId})`;
  const id = await mediaModel.create({
    filename,
    file_url: `https://www.youtube.com/embed/${youtubeId}`,
    mime_type: 'video/youtube',
    file_size: 0,
    media_type: 'youtube',
    youtube_id: youtubeId,
    created_by: userId || null
  });
  return { status: 'created', id };
}

export async function checkMediaUsage(fileUrl) {
  if (!fileUrl) return { inUse: false, usages: [] };
  const usages = await mediaModel.checkUsage(fileUrl);
  return { inUse: usages.length > 0, usages };
}

export async function deleteMediaItem(id, options) {
  const media = await mediaModel.findById(id);
  if (!media) return { status: 'not_found', usages: [] };

  const usages = await findBlockingUsages(media, Boolean(options?.force));
  if (usages.length > 0) return { status: 'in_use', usages };

  if (media.media_type !== 'youtube' && media.file_url) {
    await storage.delete(media.file_url);
  }
  await mediaModel.delete(id);
  return { status: 'deleted', usages: [] };
}

export default {
  getMediaLibraryViewData,
  buildEmptyMediaLibraryViewData,
  getMediaPickerList,
  uploadAndCreateMedia,
  registerYoutubeMedia,
  checkMediaUsage,
  deleteMediaItem
};
