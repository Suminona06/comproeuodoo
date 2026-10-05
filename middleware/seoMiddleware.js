import { APP_CONFIG } from '../config/constants.js';

/**
 * Dynamic SEO Engine Middleware
 * Injects meta tags, Open Graph, Twitter Cards, canonical links, hreflang, and JSON-LD schema into res.locals.seo
 */
export const seoMiddleware = (req, res, next) => {
  const currentLang = req.cookies?.[APP_CONFIG.LANG_COOKIE_NAME] || APP_CONFIG.DEFAULT_LANG;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;
  const currentPath = req.originalUrl.split('?')[0];
  const canonicalUrl = `${baseUrl}${currentPath === '/' ? '' : currentPath}`;

  const schemas = [];

  // Organization Schema (default for corporate homepage)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PT Euodoo',
    alternateName: 'PT. EUODOO',
    url: baseUrl,
    logo: `${baseUrl}/images/brands/brand-euodoo.webp`,
    description: currentLang === 'en'
      ? '100% degradable eco-friendly HDPE and LLDPE plastic bags manufacturer based in Bandung, Indonesia.'
      : 'Produsen manufaktur kantong plastik ramah lingkungan 100% degradable HDPE dan LLDPE di Bandung, Indonesia.',
    address: [
      {
        '@type': 'PostalAddress',
        addressLocality: 'Jakarta Pusat',
        postalCode: '10270',
        streetAddress: 'Karindra Building Jl. Palmerah Selatan 30 A Suite 02 - 07',
        addressCountry: 'ID'
      },
      {
        '@type': 'PostalAddress',
        addressLocality: 'Bandung',
        postalCode: '40214',
        streetAddress: 'Jl. Paralon II No. 21 Cijerah',
        addressCountry: 'ID'
      }
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+6221-53668626',
        contactType: 'customer service',
        availableLanguage: ['Indonesian', 'English']
      }
    ]
  };

  if (currentPath === '/' || currentPath === '') {
    schemas.push(organizationSchema);
  }

  res.locals.seo = {
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
    /**
     * Add custom schema (e.g. Product or Article)
     * @param {Object} schemaObj
     */
    addSchema(schemaObj) {
      if (schemaObj) {
        schemas.push(schemaObj);
      }
    },
    /**
     * Helper to render application/ld+json script tags
     * @returns {string}
     */
    renderJsonLd() {
      if (schemas.length === 0) return '';
      return schemas
        .map((s) => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`)
        .join('\n');
    }
  };

  next();
};

export default seoMiddleware;
