import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { APP_CONFIG } from '../config/constants.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load dictionaries
const idLocale = JSON.parse(fs.readFileSync(path.join(rootDir, 'locales', 'id.json'), 'utf8'));
const enLocale = JSON.parse(fs.readFileSync(path.join(rootDir, 'locales', 'en.json'), 'utf8'));

const dictionaries = {
  id: idLocale,
  en: enLocale
};

/**
 * Resolve nested object property by dot notation (e.g. 'home.hero_title')
 * @param {Object} obj
 * @param {string} keyPath
 * @returns {string|null}
 */
const getNestedValue = (obj, keyPath) => {
  if (!obj || !keyPath) return null;
  const parts = keyPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
};

/**
 * i18n Localization Middleware
 */
export const i18nMiddleware = (req, res, next) => {
  const cookieLang = req.cookies?.[APP_CONFIG.LANG_COOKIE_NAME];
  const lang = APP_CONFIG.SUPPORTED_LANGS.includes(cookieLang) ? cookieLang : APP_CONFIG.DEFAULT_LANG;

  const t = (key, params = {}) => {
    // 1. Try current language
    let text = getNestedValue(dictionaries[lang], key);

    // 2. Fallback to Indonesian if missing in current language
    if (!text && lang !== 'id') {
      text = getNestedValue(dictionaries.id, key);
    }

    // 3. Fallback to key itself
    if (!text) {
      return key;
    }

    // Replace dynamic placeholders e.g. {year} or {{year}}
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        const regex = new RegExp(`\\{\\{?\\s*${paramKey}\\s*\\}?}`, 'g');
        text = text.replace(regex, paramVal);
      });
    }

    return text;
  };

  req.lang = lang;
  req.t = t;
  req.__ = t;

  res.locals.currentLang = lang;
  res.locals.otherLang = lang === 'id' ? 'en' : 'id';
  res.locals.t = t;
  res.locals.__ = t;

  next();
};

export default i18nMiddleware;
