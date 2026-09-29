/**
 * Application Constants
 * PT Euodoo - Website Company Profile & CMS
 */

export const APP_CONFIG = {
  NAME: 'PT Euodoo',
  DEFAULT_LANG: 'id',
  SUPPORTED_LANGS: ['id', 'en'],
  SESSION_COOKIE_NAME: 'euodoo_session',
  LANG_COOKIE_NAME: 'euodoo_lang'
};

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin'
};

export const LEAD_STATUS = {
  PENDING: 'pending',
  CONTACTED: 'contacted',
  QUOTED: 'quoted',
  COMPLETED: 'completed',
  REJECTED: 'rejected'
};

export const LEAD_TYPE = {
  RFQ: 'rfq',
  PARTNERSHIP: 'partnership',
  GENERAL: 'general'
};

export const BANNER_MEDIA_TYPE = {
  IMAGE: 'image',
  VIDEO: 'video'
};

export const POST_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published'
};

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],
  DIRECTORIES: {
    BANNERS: 'public/uploads/banners',
    PRODUCTS: 'public/uploads/products',
    POSTS: 'public/uploads/posts'
  }
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50
};
