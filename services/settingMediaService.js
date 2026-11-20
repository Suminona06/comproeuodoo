import fs from 'node:fs';
import path from 'node:path';
import settingModel from '../models/settingModel.js';
import { saveSettingUpload, generateFaviconSet } from '../middleware/uploadMiddleware.js';
import logger from '../utils/logger.js';

const FAVICON_SIZES = [16, 32, 180, 192, 512];
const LOGO_FIELDS = [
  ['site_logo_header', 'logo_header_file', 'logo-header'],
  ['site_logo_footer', 'logo_footer_file', 'logo-footer']
];

const getUploadedFile = (files, field) => (files && Array.isArray(files[field]) ? files[field][0] : null);

export async function applyLogoUpdates(updates, body, files, deps = {}) {
  const saveUpload = deps.saveSettingUpload || saveSettingUpload;
  const safeBody = body || {};
  for (const [settingKey, fileField, uploadPrefix] of LOGO_FIELDS) {
    if (safeBody[settingKey] !== undefined) {
      updates[settingKey] = String(safeBody[settingKey]).trim();
    }
    const uploadedFile = getUploadedFile(files, fileField);
    if (!uploadedFile) continue;
    const savedUrl = await saveUpload(uploadedFile, uploadPrefix);
    if (savedUrl) updates[settingKey] = savedUrl;
  }
}

function hasFaviconPackage(current) {
  const publicDir = path.resolve(process.cwd(), 'public');
  return FAVICON_SIZES.every((size) => {
    const relPath = current[`site_favicon_${size}`];
    const absPath = relPath?.startsWith('/') ? path.resolve(publicDir, relPath.slice(1)) : '';
    return absPath.startsWith(publicDir + path.sep) && fs.existsSync(absPath);
  });
}

function resolveFallbackFaviconSource(updates, current, packageReady) {
  const curLogo = current.site_logo_header || '';
  const fallback = updates.site_logo_header || curLogo;
  if (!fallback) return null;
  if (!current.site_favicon_source && fallback === curLogo && packageReady) return null;
  updates.site_favicon_source = '';
  return fallback;
}

async function resolveFaviconInput(updates, body, files, model) {
  const uploadedFavicon = getUploadedFile(files, 'favicon_file');
  if (uploadedFavicon) return { source: uploadedFavicon.buffer, isExplicit: true };
  if (body?.site_favicon === undefined) return { source: null, isExplicit: false };

  const current = await model.getAll();
  const ready = hasFaviconPackage(current);
  const raw = String(body.site_favicon).trim();
  if (!raw) return { source: resolveFallbackFaviconSource(updates, current, ready), isExplicit: false };
  if (ready && raw === (current.site_favicon_source || current.site_favicon)) return { source: null, isExplicit: false };
  return { source: raw, isExplicit: true };
}

function storeFaviconSet(updates, faviconSet, source, isExplicit) {
  updates.site_favicon = faviconSet.favicon;
  for (const size of FAVICON_SIZES) {
    updates[`site_favicon_${size}`] = faviconSet.sizes[size];
  }
  if (isExplicit && typeof source === 'string') updates.site_favicon_source = source;
}

export async function applyFaviconUpdates(updates, body, files, deps = {}) {
  const model = deps.settingModel || settingModel;
  const createFaviconSet = deps.generateFaviconSet || generateFaviconSet;
  const { source, isExplicit } = await resolveFaviconInput(updates, body, files, model);
  if (!source) return;

  try {
    const faviconSet = await createFaviconSet(source);
    storeFaviconSet(updates, faviconSet, source, isExplicit);
  } catch (faviconErr) {
    logger.warn(`Favicon generation error: ${faviconErr.message}`);
    if (typeof source === 'string') updates.site_favicon = source;
  }
}
