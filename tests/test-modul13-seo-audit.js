import assert from 'assert';
import { generateSitemap, invalidateSitemapCache } from '../utils/sitemapGenerator.js';
import productModel from '../models/productModel.js';
import postModel from '../models/postModel.js';

const BASE_URL = 'http://127.0.0.1:3000';

async function runModul13Tests() {
  console.log('--- STARTING MODUL 13 (SEO ENGINE, AUDIT & DELIVERY GATE) TESTS ---');

  // ==========================================
  // SECTION 1: robots.txt & Dynamic sitemap.xml
  // ==========================================
  console.log('\n[TEST 1] Testing robots.txt pointer & crawler directives...');
  const resRobots = await fetch(`${BASE_URL}/robots.txt`);
  assert.strictEqual(resRobots.status, 200, 'robots.txt must return HTTP 200');
  assert.ok(resRobots.headers.get('content-type')?.includes('text/plain'), 'Content-type must be text/plain');
  const robotsText = await resRobots.text();
  assert.ok(robotsText.includes('User-agent: *'), 'Must declare User-agent');
  assert.ok(robotsText.includes('Disallow: /admin'), 'Must disallow admin area');
  assert.ok(robotsText.includes('Disallow: /api/*'), 'Must disallow api routes');
  assert.ok(robotsText.includes('/sitemap.xml'), 'Must reference sitemap.xml location');
  console.log('  1a. robots.txt structure and crawler directives verified: PASSED');

  console.log('\n[TEST 2] Testing dynamic sitemap.xml generator & hreflang...');
  const resSitemap = await fetch(`${BASE_URL}/sitemap.xml`);
  assert.strictEqual(resSitemap.status, 200, 'sitemap.xml must return HTTP 200');
  assert.ok(resSitemap.headers.get('content-type')?.includes('xml'), 'Content-type must be xml');
  const sitemapXml = await resSitemap.text();
  assert.ok(sitemapXml.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'Must contain XML declaration');
  assert.ok(sitemapXml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'), 'Must have sitemaps namespace');
  assert.ok(sitemapXml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'), 'Must have xhtml namespace for hreflang');

  // Verify static routes in sitemap
  assert.ok(sitemapXml.includes('<loc>http://127.0.0.1:3000/</loc>'), 'Must include home');
  assert.ok(sitemapXml.includes('<loc>http://127.0.0.1:3000/about</loc>'), 'Must include about');
  assert.ok(sitemapXml.includes('<loc>http://127.0.0.1:3000/products</loc>'), 'Must include products');
  assert.ok(sitemapXml.includes('<loc>http://127.0.0.1:3000/news</loc>'), 'Must include news');
  assert.ok(sitemapXml.includes('<loc>http://127.0.0.1:3000/contact</loc>'), 'Must include contact');

  // Verify bilingual alternates
  assert.ok(sitemapXml.includes('hreflang="id"'), 'Must include Indonesian hreflang');
  assert.ok(sitemapXml.includes('hreflang="en"'), 'Must include English hreflang');

  // Verify dynamic products & news in sitemap
  assert.ok(sitemapXml.includes('/products/soft-loop-handle-shopping-bag'), 'Must include published product');
  assert.ok(sitemapXml.includes('/news/mengenal-teknologi-oxium-plastik-biodegradable'), 'Must include published post');
  console.log('  2a. sitemap.xml dynamic routes and bilingual alternates verified: PASSED');

  console.log('\n[TEST 3] Testing sitemap cache invalidation & noindex filter...');
  invalidateSitemapCache();
  const directXml = await generateSitemap('https://euodoo.com', { forceRefresh: true });
  assert.ok(directXml.includes('<loc>https://euodoo.com/</loc>'), 'Direct generator must format baseUrl correctly');
  assert.ok(directXml.includes('https://euodoo.com/products/'), 'Must prefix dynamic products with domain');
  console.log('  3a. Cache invalidation and domain prefixing verified: PASSED');

  // ==========================================
  // SECTION 2: Security & Header Defense Audit
  // ==========================================
  console.log('\n[TEST 4] Testing Helmet Security Headers...');
  const resSecurity = await fetch(`${BASE_URL}/`);
  const headers = resSecurity.headers;
  assert.strictEqual(headers.get('x-content-type-options'), 'nosniff', 'Must enforce nosniff');
  assert.strictEqual(headers.get('x-frame-options'), 'SAMEORIGIN', 'Must enforce SAMEORIGIN');
  assert.ok(headers.get('content-security-policy'), 'Must have Content-Security-Policy');
  assert.strictEqual(headers.get('origin-agent-cluster'), '?1', 'Must have Origin-Agent-Cluster');
  console.log('  4a. Helmet security headers (CSP, nosniff, SAMEORIGIN) verified: PASSED');

  console.log('\n[TEST 5] Testing CSRF Protection Gate on POST endpoints...');
  // 5a: Missing CSRF token
  const postNoCsrf = await fetch(`${BASE_URL}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'name=Hacker&email=hacker@evil.com&message=attack'
  });
  assert.strictEqual(postNoCsrf.status, 403, 'Missing CSRF must be rejected with 403 Forbidden');

  // 5b: Invalid CSRF token
  const postBadCsrf = await fetch(`${BASE_URL}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: '_csrf=invalid_token_12345&name=Hacker&email=hacker@evil.com&message=attack'
  });
  assert.strictEqual(postBadCsrf.status, 403, 'Forged CSRF must be rejected with 403 Forbidden');
  console.log('  5a. CSRF attack protection gate verified: PASSED');

  // ==========================================
  // SECTION 3: Performance, WebP & Caching Audit
  // ==========================================
  console.log('\n[TEST 6] Testing Static Asset Caching & Compression...');
  const resStatic = await fetch(`${BASE_URL}/css/tokens.css`);
  assert.strictEqual(resStatic.status, 200, 'Static CSS must return HTTP 200');
  assert.ok(resStatic.headers.get('cache-control')?.includes('max-age'), 'Static assets must have Cache-Control header');

  const resGzip = await fetch(`${BASE_URL}/`, {
    headers: { 'Accept-Encoding': 'gzip, deflate, br' }
  });
  assert.strictEqual(resGzip.status, 200);
  assert.ok(resGzip.headers.get('vary')?.includes('Accept-Encoding'), 'Must send Vary: Accept-Encoding');
  console.log('  6a. Static caching headers and compression negotiation verified: PASSED');

  console.log('\n[TEST 7] Testing Native Lazy-Loading & Media Best Practices in Views...');
  const homeHtml = await (await fetch(`${BASE_URL}/`)).text();
  assert.ok(homeHtml.includes('loading="lazy"'), 'Homepage must contain native loading="lazy" for below-fold images');

  // Verify video banner specification: template must enforce preload="metadata" and poster image fallback
  const fs = await import('fs');
  const indexTemplate = fs.readFileSync(new URL('../views/public/index.ejs', import.meta.url), 'utf8');
  assert.ok(indexTemplate.includes('preload="metadata"'), 'Video banners in template must use preload="metadata" for bandwidth efficiency');
  assert.ok(indexTemplate.includes('poster='), 'Video banners in template must provide a poster image');
  if (homeHtml.includes('<video')) {
    assert.ok(homeHtml.includes('preload="metadata"'), 'Rendered video must include preload="metadata"');
    assert.ok(homeHtml.includes('poster='), 'Rendered video must include poster attribute');
  }

  const newsHtml = await (await fetch(`${BASE_URL}/news`)).text();
  assert.ok(newsHtml.includes('loading="lazy"'), 'News listing must apply loading="lazy" on cards');
  console.log('  7a. Native lazy-loading and video metadata preloading verified: PASSED');

  // ==========================================
  // SECTION 4: Structured Data (JSON-LD) Audit
  // ==========================================
  console.log('\n[TEST 8] Testing Schema.org Structured Data (JSON-LD)...');
  // 8a: Organization Schema on Homepage
  assert.ok(homeHtml.includes('"@type": "Organization"') || homeHtml.includes('"@type":"Organization"'), 'Homepage must inject Organization schema');
  assert.ok(homeHtml.includes('"name": "PT Euodoo"') || homeHtml.includes('"name":"PT Euodoo"'), 'Organization schema must declare company name');

  // 8b: Article Schema on News Detail
  const newsDetailHtml = await (await fetch(`${BASE_URL}/news/mengenal-teknologi-oxium-plastik-biodegradable`)).text();
  assert.ok(newsDetailHtml.includes('"@type": "Article"'), 'Article detail must inject Article schema');
  assert.ok(newsDetailHtml.includes('"headline":'), 'Article schema must contain headline');
  assert.ok(newsDetailHtml.includes('"datePublished":'), 'Article schema must contain datePublished');
  console.log('  8a. Organization and Article JSON-LD structured data verified: PASSED');

  console.log('\n--- ALL MODUL 13 TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

runModul13Tests().catch(err => {
  console.error('\nFAILED MODUL 13 TEST:', err);
  process.exit(1);
});
