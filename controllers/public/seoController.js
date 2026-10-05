import { generateSitemap } from '../../utils/sitemapGenerator.js';
import logger from '../../utils/logger.js';

export const seoController = {
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
    res.header('Cache-Control', 'public, max-age=86400');
    return res.send(content);
  },

  async sitemap(req, res) {
    try {
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:3000';
      const baseUrl = `${protocol}://${host}`;

      const xml = await generateSitemap(baseUrl);

      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.header('Cache-Control', 'public, max-age=43200');
      return res.send(xml);
    } catch (err) {
      logger.error('Failed to generate sitemap.xml:', { message: err.message, stack: err.stack });
      res.status(500).send('Error generating sitemap');
    }
  }
};

export default seoController;
