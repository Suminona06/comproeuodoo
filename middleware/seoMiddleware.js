import { APP_CONFIG } from '../config/constants.js';
import { safeJsonForHtml } from '../utils/sanitizer.js';

const DEFAULT_ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'euodoo.co.id', 'www.euodoo.co.id'];
const HOST_HEADER_RE = /^[a-z0-9.-]+(:\d{1,5})?$/i;

function parseSafeBaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  try {
    const parsed = new URL(rawUrl.trim());
    const valid = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    return valid ? parsed.origin : null;
  } catch {
    return null;
  }
}

function getAllowedHosts() {
  const extra = String(process.env.ALLOWED_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_HOSTS, ...extra]);
}

function resolveProtocol(req) {
  const forwarded = String(req.headers?.['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  if (forwarded === 'https' || forwarded === 'http') return forwarded;
  return req.protocol === 'https' ? 'https' : 'http';
}

function resolveBaseUrl(req) {
  const configured = parseSafeBaseUrl(process.env.APP_BASE_URL);
  if (configured) return configured;
  const fallback = process.env.NODE_ENV === 'production' ? 'https://euodoo.co.id' : 'http://localhost:3000';
  const rawHost = typeof req.get === 'function' ? String(req.get('host') || '').trim() : '';
  if (!rawHost || !HOST_HEADER_RE.test(rawHost)) return fallback;
  const hostname = rawHost.split(':')[0].toLowerCase();
  if (!getAllowedHosts().has(hostname)) return fallback;
  return `${resolveProtocol(req)}://${rawHost}`;
}

function isCardEnabled(val) {
  return val !== '0' && val !== 0;
}

function buildOrgAddresses(settings) {
  const addresses = [];
  if (isCardEnabled(settings.office_card_visible) && settings.office_address) {
    addresses.push({ '@type': 'PostalAddress', streetAddress: settings.office_address, addressCountry: 'ID' });
  }
  if (isCardEnabled(settings.factory_card_visible) && settings.factory_address) {
    addresses.push({ '@type': 'PostalAddress', streetAddress: settings.factory_address, addressCountry: 'ID' });
  }
  if (addresses.length > 0) return addresses;
  return [{ '@type': 'PostalAddress', addressLocality: 'Bandung', postalCode: '40214', streetAddress: 'Jl. Paralon II No. 21 Cijerah', addressCountry: 'ID' }];
}

function buildOrgContactPoints(settings) {
  const candidates = [
    [settings.factory_card_visible, settings.factory_phone],
    [settings.office_card_visible, settings.office_phone || settings.company_phone]
  ];
  const points = candidates
    .filter(([visible, phone]) => isCardEnabled(visible) && phone)
    .map(([, telephone]) => ({
      '@type': 'ContactPoint',
      telephone,
      contactType: 'customer service',
      availableLanguage: ['Indonesian', 'English']
    }));
  if (points.length > 0) return points;
  return [{ '@type': 'ContactPoint', telephone: settings.company_phone || '+6222-6012519', contactType: 'customer service', availableLanguage: ['Indonesian', 'English'] }];
}

function resolveOrgLogo(baseUrl, settings) {
  const raw = settings.site_logo_header || settings.site_logo_footer || '/images/brands/brand-euodoo.webp';
  return raw.startsWith('/') ? `${baseUrl}${raw}` : raw;
}

function resolveOrgDescription(currentLang, settings) {
  if (currentLang === 'en') {
    return settings.footer_desc_en || settings.meta_description_en || '100% degradable eco-friendly HDPE and LLDPE plastic bags manufacturer based in Bandung, Indonesia.';
  }
  return settings.footer_desc_id || settings.meta_description_id || 'Produsen manufaktur kantong plastik ramah lingkungan 100% degradable HDPE dan LLDPE di Bandung, Indonesia.';
}

function buildOrganizationSchema(baseUrl, currentLang, settings = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.company_name || 'PT Euodoo',
    alternateName: 'PT Euodoo',
    url: baseUrl,
    logo: resolveOrgLogo(baseUrl, settings),
    description: resolveOrgDescription(currentLang, settings),
    address: buildOrgAddresses(settings),
    contactPoint: buildOrgContactPoints(settings)
  };
}

function createSeoObject(baseUrl, canonicalUrl, currentLang, schemas) {
  return {
    title: '',
    description: '',
    keywords: 'kantong plastik ramah lingkungan, 100% degradable, oxium, kantong belanja hdpe, lldpe industri, karung woven, pt euodoo',
    author: 'PT Euodoo',
    robots: 'index, follow',
    canonicalUrl,
    ogType: 'website',
    ogImage: `${baseUrl}/images/hero-factory-precision.webp`,
    ogTitle: '',
    ogDescription: '',
    currentLang,
    alternateUrls: {
      id: `${canonicalUrl}?lang=id`,
      en: `${canonicalUrl}?lang=en`,
      xDefault: canonicalUrl
    },
    schemas,
    addSchema(schemaObj) {
      if (schemaObj) schemas.push(schemaObj);
    },
    renderJsonLd() {
      if (schemas.length === 0) return '';
      return schemas
        .map((s) => `<script type="application/ld+json">\n${safeJsonForHtml(s, 2)}\n</script>`)
        .join('\n');
    }
  };
}

/**
 * Dynamic SEO Engine Middleware
 * Injects meta tags, Open Graph, Twitter Cards, canonical links, hreflang, and JSON-LD schema into res.locals.seo
 */
export const seoMiddleware = (req, res, next) => {
  const currentLang = req.cookies?.[APP_CONFIG.LANG_COOKIE_NAME] || APP_CONFIG.DEFAULT_LANG;
  const baseUrl = resolveBaseUrl(req);
  const currentPath = String(req.originalUrl || '/').split('?')[0];
  const canonicalUrl = `${baseUrl}${currentPath === '/' ? '' : currentPath}`;
  const schemas = [];

  if (currentPath === '/' || currentPath === '') {
    schemas.push(buildOrganizationSchema(baseUrl, currentLang, res.locals?.settings || {}));
  }

  res.locals.seo = createSeoObject(baseUrl, canonicalUrl, currentLang, schemas);
  next();
};

export default seoMiddleware;
