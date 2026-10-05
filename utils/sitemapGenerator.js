import productModel from '../models/productModel.js';
import postModel from '../models/postModel.js';
import logger from './logger.js';

let cachedXml = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function invalidateSitemapCache() {
  cachedXml = null;
  cacheTimestamp = 0;
  logger.info('[Sitemap] In-memory sitemap cache invalidated.');
}

export async function generateSitemap(baseUrl, options = {}) {
  const now = Date.now();
  const forceRefresh = options.forceRefresh || false;

  if (!forceRefresh && cachedXml && (now - cacheTimestamp < CACHE_TTL_MS)) {
    return cachedXml;
  }

  const cleanBaseUrl = (baseUrl || 'http://localhost:3000').replace(/\/+$/, '');
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/about', priority: '0.8', changefreq: 'monthly' },
    { path: '/products', priority: '0.9', changefreq: 'weekly' },
    { path: '/capabilities', priority: '0.8', changefreq: 'monthly' },
    { path: '/news', priority: '0.8', changefreq: 'daily' },
    { path: '/contact', priority: '0.8', changefreq: 'monthly' }
  ];

  const [products, posts] = await Promise.all([
    productModel.findAll({ isActive: true }),
    postModel.findAll({ status: 'published' })
  ]);

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  for (const page of staticPages) {
    const pageUrl = `${cleanBaseUrl}${page.path}`;
    xml += '  <url>\n';
    xml += `    <loc>${pageUrl}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="id" href="${pageUrl}?lang=id" />\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="en" href="${pageUrl}?lang=en" />\n`;
    xml += '  </url>\n';
  }

  for (const prod of products) {
    if (prod.robots && prod.robots.includes('noindex')) {
      continue;
    }
    const prodDate = prod.updated_at ? new Date(prod.updated_at).toISOString().split('T')[0] : today;
    const prodUrl = `${cleanBaseUrl}/products/${encodeURIComponent(prod.slug)}`;
    xml += '  <url>\n';
    xml += `    <loc>${prodUrl}</loc>\n`;
    xml += `    <lastmod>${prodDate}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += `    <xhtml:link rel="alternate" hreflang="id" href="${prodUrl}?lang=id" />\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="en" href="${prodUrl}?lang=en" />\n`;
    xml += '  </url>\n';
  }

  for (const post of posts) {
    if (post.robots && post.robots.includes('noindex')) {
      continue;
    }
    const postDate = post.published_at ? new Date(post.published_at).toISOString().split('T')[0] : today;
    const postUrl = `${cleanBaseUrl}/news/${encodeURIComponent(post.slug)}`;
    xml += '  <url>\n';
    xml += `    <loc>${postUrl}</loc>\n`;
    xml += `    <lastmod>${postDate}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += `    <xhtml:link rel="alternate" hreflang="id" href="${postUrl}?lang=id" />\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="en" href="${postUrl}?lang=en" />\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>';

  cachedXml = xml;
  cacheTimestamp = now;

  return xml;
}

export default {
  generateSitemap,
  invalidateSitemapCache
};
