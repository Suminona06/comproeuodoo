import pageHeroBannerModel from '../models/pageHeroBannerModel.js';
import { processAndSaveWebP } from '../middleware/uploadMiddleware.js';

export const ALLOWED_PAGE_KEYS = ['about', 'products', 'news', 'contact'];
export const DEFAULT_OVERLAY_OPACITY = 0.60;

const PAGE_LABELS = {
  about: 'Tentang Kami',
  products: 'Produk',
  news: 'Berita & Artikel',
  contact: 'Kontak'
};

const ACTIVE_VALUES = new Set(['1', 1, true, 'on']);
const asTrimmed = (val) => (typeof val === 'string' ? val.trim() : '');
const hasControlChars = (val) => [...val].some((ch) => ch.charCodeAt(0) <= 31 || ch.charCodeAt(0) === 127);

const useModel = (deps) => deps?.pageHeroBannerModel || pageHeroBannerModel;
const useSaveWebP = (deps) => deps?.processAndSaveWebP || processAndSaveWebP;

export function normalizeOverlayOpacity(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return DEFAULT_OVERLAY_OPACITY;
  }
  const parsed = Number(String(raw).trim());
  if (!Number.isFinite(parsed)) return DEFAULT_OVERLAY_OPACITY;
  return Math.min(1, Math.max(0, parsed));
}

function isValidHttpUrl(trimmed) {
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

const isSafeRelativePath = (trimmed) =>
  trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\');
const isBlockedUrlText = (trimmed) =>
  !trimmed || hasControlChars(trimmed) || trimmed.includes('..');

export function isSafeActionUrl(rawUrl, allowHash = true) {
  if (typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (isBlockedUrlText(trimmed)) return false;
  if (allowHash && trimmed.startsWith('#')) return true;
  return isSafeRelativePath(trimmed) || isValidHttpUrl(trimmed);
}

function validateUrls(body) {
  const ctaUrl = asTrimmed(body.cta_url);
  if (ctaUrl && !isSafeActionUrl(ctaUrl, true)) {
    return { error: 'URL CTA tidak valid. Gunakan http(s)://, path /, atau #.' };
  }
  const imageUrl = asTrimmed(body.image_url);
  if (imageUrl && !isSafeActionUrl(imageUrl, false)) {
    return { error: 'URL gambar tidak valid. Gunakan path / atau http(s):// yang aman.' };
  }
  return { ctaUrl, imageUrl };
}

function buildHeroPayload(body, ctaUrl) {
  return {
    title_id: asTrimmed(body.title_id),
    title_en: asTrimmed(body.title_en),
    subtitle_id: asTrimmed(body.subtitle_id),
    subtitle_en: asTrimmed(body.subtitle_en),
    overlay_opacity: normalizeOverlayOpacity(body.overlay_opacity),
    cta_text_id: asTrimmed(body.cta_text_id),
    cta_text_en: asTrimmed(body.cta_text_en),
    cta_url: ctaUrl,
    is_active: ACTIVE_VALUES.has(body.is_active) ? 1 : 0
  };
}

export async function listPageHeroBanners(deps = {}) {
  return useModel(deps).getAll();
}

async function attachHeroImage(updateData, imageUrl, file, deps) {
  if (file) {
    const uploadedUrl = await useSaveWebP(deps)(file.buffer, 'pages', { maxWidth: 1920, maxHeight: 1080 });
    if (uploadedUrl) updateData.image_url = uploadedUrl;
    return;
  }
  if (imageUrl) updateData.image_url = imageUrl;
}

export async function updatePageHeroBanner(pageKey, rawBody, file, deps = {}) {
  if (!ALLOWED_PAGE_KEYS.includes(pageKey)) {
    return { status: 'validation_error', error: 'Halaman tidak valid.' };
  }

  const body = rawBody || {};
  const urlCheck = validateUrls(body);
  if (urlCheck.error) return { status: 'validation_error', error: urlCheck.error };

  const updateData = buildHeroPayload(body, urlCheck.ctaUrl);
  await attachHeroImage(updateData, urlCheck.imageUrl, file, deps);

  await useModel(deps).updateByPageKey(pageKey, updateData);
  const label = PAGE_LABELS[pageKey] || pageKey;
  return { status: 'ok', message: `Hero banner untuk halaman ${label} berhasil diperbarui.` };
}

export default {
  ALLOWED_PAGE_KEYS,
  DEFAULT_OVERLAY_OPACITY,
  normalizeOverlayOpacity,
  isSafeActionUrl,
  listPageHeroBanners,
  updatePageHeroBanner
};
