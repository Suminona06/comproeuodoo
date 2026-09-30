import productModel from '../../models/productModel.js';
import postModel from '../../models/postModel.js';
import logger from '../../utils/logger.js';

export const seoController = {
  /**
   * Serve dynamic robots.txt
   */
  robots(req, res) {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const content = [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /admin/*',
      'Disallow: /api/*',
      '',
      `Sitemap: ${baseUrl}/sitemap.xml`
    ].join('\n');

    res.header('Content-Type', 'text/plain; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=86400'); // 1 day
    return res.send(content);
  },

  /**
   * Serve dynamic XML sitemap
   */
  async sitemap(req, res) {
    try {
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:3000';
      const baseUrl = `${protocol}://${host}`;
      const today = new Date().toISOString().split('T')[0];

      // Static routes
      const staticPages = [
        { path: '/', priority: '1.0', changefreq: 'weekly' },
        { path: '/products', priority: '0.9', changefreq: 'weekly' },
        { path: '/capabilities', priority: '0.8', changefreq: 'monthly' },
        { path: '/about', priority: '0.7', changefreq: 'monthly' },
        { path: '/news', priority: '0.8', changefreq: 'daily' },
        { path: '/contact', priority: '0.8', changefreq: 'monthly' }
      ];

      // Fetch active dynamic entities
      const [products, posts] = await Promise.all([
        productModel.findAll({ isActive: true }),
        postModel.findAll({ status: 'published' })
      ]);

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

      // Append static routes
      for (const page of staticPages) {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += '  </url>\n';
      }

      // Append product routes
      for (const prod of products) {
        const prodDate = prod.updated_at ? new Date(prod.updated_at).toISOString().split('T')[0] : today;
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/products/${encodeURIComponent(prod.slug)}</loc>\n`;
        xml += `    <lastmod>${prodDate}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      }

      // Append news routes
      for (const post of posts) {
        const postDate = post.published_at ? new Date(post.published_at).toISOString().split('T')[0] : today;
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/news/${encodeURIComponent(post.slug)}</loc>\n`;
        xml += `    <lastmod>${postDate}</lastmod>\n`;
        xml += '    <changefreq>monthly</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
      }

      xml += '</urlset>';

      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.header('Cache-Control', 'public, max-age=43200'); // 12 hours
      return res.send(xml);
    } catch (err) {
      logger.error('Failed to generate sitemap.xml:', { message: err.message, stack: err.stack });
      res.status(500).send('Error generating sitemap');
    }
  }
};

export default seoController;
