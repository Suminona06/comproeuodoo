import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  PAGE_SIZE as NEWS_PAGE_SIZE,
  parseNewsQuery,
  getNewsListData,
  buildNewsFallbackPayload,
  fetchRelatedPosts,
  getPostDetailData
} from '../services/publicPostService.js';
import {
  buildTicketAcronym,
  getAboutPageData,
  buildAboutFallbackPayload,
  getCapabilitiesPageData,
  buildCapabilitiesFallbackPayload
} from '../services/publicPageService.js';
import {
  PAGE_SIZE as PRODUCT_PAGE_SIZE,
  INVALID_CATEGORY_ID,
  DEFAULT_WHATSAPP_NUMBER,
  parseCatalogQuery,
  resolveCatalogCategory,
  shouldNoIndexCatalog,
  getCatalogPageData,
  buildCatalogFallbackPayload,
  resolveProductGallery,
  buildProductSpecPayload,
  buildMetaDescription,
  buildWhatsappQuoteUrl,
  getProductDetailData
} from '../services/publicProductService.js';
import {
  DEFAULT_TURNSTILE_SITE_KEY,
  normalizeRfqPayload,
  validateRfqPayload,
  resolveProductSelection,
  persistAndNotifyInquiry,
  getContactPageData,
  buildContactFallbackPayload
} from '../services/publicContactService.js';
import { resolveBaseUrl } from '../middleware/seoMiddleware.js';
import productController from '../controllers/public/productController.js';
import productModel from '../models/productModel.js';

const mockTranslator = (dict = {}) => (key, params = {}) => {
  let val = dict[key] || key;
  for (const [k, v] of Object.entries(params)) {
    val = val.replace(`{${k}}`, v);
  }
  return val;
};

describe('Public Services & Thin Controllers Unit Tests (T-369..T-373)', () => {
  describe('1. publicPostService (T-369)', () => {
    it('1a. parses query filters with whitelist and loads headline only on page 1 without search', async () => {
      const parsed = parseNewsQuery({ page: '0', type: 'invalid', category: ' eco ', search: ' oxium ' });
      assert.equal(parsed.page, 1);
      assert.equal(parsed.type, 'all');
      assert.equal(parsed.categorySlug, 'eco');
      assert.equal(parsed.search, 'oxium');

      let headlineQueries = 0;
      const deps = {
        postCategoryModel: {
          async findBySlug(slug) { return slug === 'eco' ? { id: 12, slug: 'eco' } : null; },
          async findAll() { return [{ id: 12, slug: 'eco' }]; }
        },
        postModel: {
          async findAll(opts) {
            if (opts.isHeadline) {
              headlineQueries += 1;
              return [{ id: 99, title_id: 'Headline' }];
            }
            return [{ id: 1, title_id: 'Post 1' }];
          },
          async countAll() { return 19; }
        },
        pageHeroBannerModel: {
          async getByPageKey(key) { return { page_key: key, title_id: 'News Hero' }; }
        }
      };

      const withSearch = await getNewsListData(
        { page: '1', type: 'berita', category: 'eco', search: 'oxium' },
        { settings: { company_name: 'PT Euodoo Plastic' }, t: mockTranslator({ 'news.page_title': 'Publikasi' }) },
        deps
      );
      assert.equal(headlineQueries, 0);
      assert.deepEqual(withSearch.viewData.headlinePosts, []);
      assert.equal(withSearch.ajaxPayload.totalPages, Math.ceil(19 / NEWS_PAGE_SIZE));
      assert.equal(withSearch.ajaxPayload.activeType, 'berita');
      assert.equal(withSearch.viewData.heroBanner.page_key, 'news');

      const pageOne = await getNewsListData({ page: '1' }, {}, deps);
      assert.equal(headlineQueries, 1);
      assert.equal(pageOne.viewData.headlinePost.id, 99);
    });

    it('1b. builds symmetric fallback 500 payload with headlinePosts and heroBanner', () => {
      const fallback = buildNewsFallbackPayload({
        settings: { company_name: 'PT Euodoo Plastic' },
        t: mockTranslator({ 'news.page_title': 'News & Publications' })
      });
      assert.equal(fallback.title, 'News & Publications | PT Euodoo Plastic');
      assert.deepEqual(fallback.headlinePosts, []);
      assert.equal(fallback.headlinePost, null);
      assert.equal(fallback.heroBanner, null);
      assert.equal(fallback.totalPages, 1);
    });

    it('1c. fills related posts from other types when same type has fewer than 3 and handles 301/404', async () => {
      const deps = {
        postModel: {
          async findAll(opts) {
            if (opts.type === 'pers') return [{ id: 10 }, { id: 11 }];
            return [{ id: 10 }, { id: 11 }, { id: 12 }, { id: 13 }];
          },
          async findBySlug(slug) {
            if (slug === 'published-slug') return { id: 10, type: 'pers', status: 'published', title_id: 'Judul', title_en: 'Title' };
            if (slug === 'draft-slug') return { id: 20, type: 'berita', status: 'draft' };
            return null;
          }
        },
        slugRedirectModel: {
          async findRedirect(_entity, slug) {
            return slug === 'old-slug' ? { new_slug: 'published-slug' } : null;
          }
        }
      };

      const related = await fetchRelatedPosts({ id: 10, type: 'pers' }, deps);
      assert.deepEqual(related.map((p) => p.id), [11, 12, 13]);

      const redir = await getPostDetailData('old-slug', {}, deps);
      assert.equal(redir.status, 'redirect');
      assert.equal(redir.redirectUrl, '/news/published-slug');

      const draftRes = await getPostDetailData('draft-slug', { t: mockTranslator({ 'news.not_found_title': 'Article Not Found' }) }, deps);
      assert.equal(draftRes.status, 'not_found');
      assert.equal(draftRes.notFoundData.title, 'Article Not Found | PT Euodoo Plastic');

      const okRes = await getPostDetailData('published-slug', { currentLang: 'en' }, deps);
      assert.equal(okRes.status, 'ok');
      assert.equal(okRes.viewData.useSweetAlert, true);
      assert.equal(okRes.viewData.headerSolid, true);
      assert.equal(okRes.viewData.title, 'Title | PT Euodoo Plastic');
      assert.equal(okRes.viewData.recentPosts.length, 3);
    });
  });

  describe('2. publicPageService (T-370)', () => {
    it('2a. builds About page data, ticket acronym fallback, and 500 fallback payload', async () => {
      assert.equal(buildTicketAcronym({ values: [] }), 'T - I - C - K - E - T');
      assert.equal(buildTicketAcronym({ values: [{ letter: 'A' }, { letter: 'B' }] }), 'A - B');

      const mockAboutModel = {
        getDefaults: () => ({ slogan_id: 'Default', values: [{ letter: 'T' }] }),
        async getAboutData() { return { values: [{ letter: 'E' }, { letter: 'U' }] }; },
        async getGalleryHeader() { return { title_id: 'Galeri' }; },
        async getStoryHeader() { return { kicker_id: 'Kisah' }; },
        async getTimelineHeader() { return { title_id: 'Sejarah' }; },
        async getVisionMissionImages() { return { vision_image_url: '/v.webp', mission_image_url: '/m.webp' }; }
      };
      const deps = {
        aboutModel: mockAboutModel,
        pageHeroBannerModel: { async getByPageKey() { return { page_key: 'about' }; } },
        aboutGalleryModel: { async findAll() { return [{ id: 1 }]; } },
        aboutStatsModel: { async findAll() { return [{ id: 2 }]; } },
        aboutTimelineModel: { async findAll() { return [{ id: 3 }]; } }
      };

      const data = await getAboutPageData({ t: mockTranslator({ 'about.meta_title': 'Tentang Kami' }) }, deps);
      assert.equal(data.title, 'Tentang Kami | PT Euodoo Plastic');
      assert.equal(data.ticketAcronym, 'E - U');
      assert.equal(data.gallerySlides.length, 1);

      const fallback = buildAboutFallbackPayload({ t: mockTranslator({ 'about.meta_title': 'About Us' }) }, deps);
      assert.equal(fallback.title, 'About Us | PT Euodoo Plastic');
      assert.equal(fallback.heroBanner, null);
      assert.deepEqual(fallback.gallerySlides, []);
    });

    it('2b. delegates Capabilities listing to capabilityService.listActiveCapabilities', async () => {
      let calledActiveOnly = null;
      const capData = await getCapabilitiesPageData(
        { t: mockTranslator({ 'capabilities.page_title': 'Capabilities' }) },
        {
          capabilityModel: {
            async findAll(activeOnly) {
              calledActiveOnly = activeOnly;
              return [{ id: 1, title_id: 'Extruder' }];
            }
          }
        }
      );
      assert.equal(calledActiveOnly, true);
      assert.equal(capData.capabilities.length, 1);
      assert.equal(capData.title, 'Capabilities | PT Euodoo Plastic');

      const capFallback = buildCapabilitiesFallbackPayload({ t: mockTranslator({ 'capabilities.page_title': 'Capabilities' }) });
      assert.deepEqual(capFallback.capabilities, []);
    });
  });

  describe('3. publicProductService (T-371)', () => {
    it('3a. enforces sort whitelist, search max 100 chars, invalid category -> -1, and noindex policy', async () => {
      const longSearch = 'x'.repeat(150);
      const parsed = parseCatalogQuery({ sort: 'price-asc', search: `  ${longSearch}  `, page: '2' });
      assert.equal(parsed.sort, 'newest');
      assert.equal(parsed.search.length, 100);
      assert.equal(parsed.offset, PRODUCT_PAGE_SIZE);

      const catModel = {
        async findById(id) { return id === 5 ? { id: 5, slug: 'hdpe', is_active: 1 } : { id: 6, slug: 'off', is_active: 0 }; },
        async findBySlug(slug) { return slug === 'lldpe' ? { id: 7, slug: 'lldpe', is_active: null } : null; },
        async findAll() { return [{ id: 5, slug: 'hdpe' }]; }
      };

      assert.deepEqual(await resolveCatalogCategory('6', catModel), { selectedCategory: null, categoryId: INVALID_CATEGORY_ID });
      assert.deepEqual(await resolveCatalogCategory('missing', catModel), { selectedCategory: null, categoryId: INVALID_CATEGORY_ID });
      assert.deepEqual(await resolveCatalogCategory(['hdpe', 'lldpe'], catModel), { selectedCategory: null, categoryId: INVALID_CATEGORY_ID });
      assert.equal((await resolveCatalogCategory('lldpe', catModel)).categoryId, 7);

      assert.equal(shouldNoIndexCatalog({ page: 1, search: '', rawSort: 'newest', category: '' }, null), false);
      assert.equal(shouldNoIndexCatalog({ page: 2, search: '', rawSort: '', category: '' }, null), true);
      assert.equal(shouldNoIndexCatalog({ page: 1, search: 'bag', rawSort: '', category: '' }, null), true);
      assert.equal(shouldNoIndexCatalog({ page: 1, search: '', rawSort: 'alpha-asc', category: '' }, null), true);
      assert.equal(shouldNoIndexCatalog({ page: 1, search: '', rawSort: '', category: 'missing' }, null), true);

      const catalogRes = await getCatalogPageData(
        { page: '1', sort: 'alpha-asc' },
        { currentLang: 'en', t: mockTranslator({ 'products.catalog_title': 'Product Catalog' }) },
        {
          productCategoryModel: catModel,
          productModel: {
            async findAll() { return [{ id: 1, name_en: 'Bag' }]; },
            async countAll(opts) { return opts.sort ? 15 : 25; }
          },
          pageHeroBannerModel: { async getByPageKey() { return { page_key: 'products' }; } }
        }
      );
      assert.equal(catalogRes.noindex, true);
      assert.equal(catalogRes.fragmentHeaders['X-Has-More'], 'true');
      assert.equal(catalogRes.fragmentHeaders['X-Total-Count'], '15');
      assert.equal(catalogRes.fragmentHeaders['X-Total-All-Count'], '25');
      assert.equal(catalogRes.fragmentHeaders['X-Current-Page'], '1');
      assert.equal(catalogRes.fragmentHeaders['X-Total-Pages'], '2');
      assert.equal(catalogRes.viewData.title, 'Product Catalog | PT Euodoo Plastic');

      const fallback = buildCatalogFallbackPayload({ t: mockTranslator({ 'products.catalog_title': 'Katalog Produk' }) });
      assert.equal(fallback.heroBanner, null);
      assert.deepEqual(fallback.products, []);
    });

    it('3b. resolves gallery media IDs via mediaModel, builds meta description <= 160, WA URL, canonical, and max 4 related', async () => {
      let queriedIds = null;
      const mockMediaModel = {
        async findUrlsByIds(ids) {
          queriedIds = ids;
          return [
            { id: 10, file_url: '/uploads/10.webp' },
            { id: 20, file_url: '/uploads/20.webp' }
          ];
        }
      };

      const resolved = await resolveProductGallery(
        { main_image: '/images/main.webp', gallery_images: '[10, "20", "/images/direct.webp", 999]' },
        mockMediaModel
      );
      assert.deepEqual(queriedIds, [10, 20, 999]);
      assert.deepEqual(resolved, ['/images/main.webp', '/uploads/10.webp', '/uploads/20.webp', '/images/direct.webp']);

      const deduped = await resolveProductGallery(
        { main_image: '/uploads/10.webp', gallery_images: '[10, 20, "/uploads/10.webp"]' },
        mockMediaModel
      );
      assert.deepEqual(deduped, ['/uploads/10.webp', '/uploads/20.webp']);

      const fallbackGallery = await resolveProductGallery(
        { main_image: '/images/main.webp', gallery_images: '[999]' },
        { async findUrlsByIds() { return []; } }
      );
      assert.deepEqual(fallbackGallery, ['/images/main.webp']);

      const emptyGallery = await resolveProductGallery(
        { main_image: null, gallery_images: '[]' },
        mockMediaModel
      );
      assert.deepEqual(emptyGallery, []);

      const sizeTableSample = { columns: [{ id: 'col_1', label: 'Kode' }], rows: [{ col_1: 'A1' }] };
      const specHidden = buildProductSpecPayload(
        { show_description_tab: 0, description_id: '<p>Desc</p>', size_table: sizeTableSample },
        'id'
      );
      assert.equal(specHidden.specDisplayMode, 'size-only');

      const specTabs = buildProductSpecPayload(
        { show_description_tab: 1, description_id: '<p>Aman</p><script>alert(1)</script>', size_table: sizeTableSample },
        'id'
      );
      assert.equal(specTabs.specDisplayMode, 'tabs');
      assert.equal(specTabs.sanitizedDescription.includes('<script>'), false);

      const specDescOnly = buildProductSpecPayload(
        { show_description_tab: 1, description_id: '<p>Isi</p>', size_table: null },
        'id'
      );
      assert.equal(specDescOnly.specDisplayMode, 'description-only');

      const specSizeOnly = buildProductSpecPayload(
        { show_description_tab: 1, description_id: '<p>   </p>', size_table: sizeTableSample },
        'id'
      );
      assert.equal(specSizeOnly.specDisplayMode, 'size-only');

      const specNone = buildProductSpecPayload(
        { show_description_tab: 1, description_id: '', size_table: null },
        'id'
      );
      assert.equal(specNone.specDisplayMode, 'none');

      const meta = buildMetaDescription(
        { description_en: `<p>${'A'.repeat(180)}</p>   <b>tail</b>` },
        'en'
      );
      assert.equal(meta.includes('<'), false);
      assert.equal(meta.length, 160);

      const defaultWa = buildWhatsappQuoteUrl('HDPE Bag', null, mockTranslator({
        'product_detail.whatsapp_quote_message': 'Hello, interested in {name}'
      }));
      assert.equal(defaultWa, `https://wa.me/${DEFAULT_WHATSAPP_NUMBER}?text=Hello%2C%20interested%20in%20HDPE%20Bag`);

      const detail = await getProductDetailData(
        'hdpe-bag',
        {
          currentLang: 'en',
          baseUrl: 'https://euodoo.co.id',
          settings: { company_name: 'PT Euodoo Plastic', whatsapp_number: '+62 811-2233-44' },
          t: mockTranslator({ 'product_detail.whatsapp_quote_message': 'Quote {name}' })
        },
        {
          mediaModel: mockMediaModel,
          productModel: {
            async findBySlug() {
              return {
                id: 1,
                slug: 'hdpe-bag',
                category_id: 3,
                name_id: 'Tas HDPE',
                name_en: 'HDPE Bag',
                description_en: '<p>Eco bag</p>',
                gallery_images: [10],
                status: 'published',
                is_active: 1
              };
            },
            async findAll() {
              return [
                { id: 1, is_active: 1 },
                { id: 2, is_active: 1 },
                { id: 3, is_active: 0 },
                { id: 4, is_active: 1 },
                { id: 5, is_active: 1 },
                { id: 6, is_active: 1 },
                { id: 7, is_active: 1 }
              ];
            }
          }
        }
      );
      assert.equal(detail.status, 'ok');
      assert.equal(detail.viewData.canonicalUrl, 'https://euodoo.co.id/products/hdpe-bag');
      assert.equal(detail.viewData.relatedProducts.length, 4);
      assert.equal(detail.viewData.relatedProducts.some((p) => p.id === 1 || p.id === 3), false);

      const draftDetail = await getProductDetailData(
        '99',
        { t: mockTranslator({ 'product_detail.not_found_title': 'Not Found', 'product_detail.not_found_message': 'Unavailable' }) },
        { productModel: { async findById() { return { id: 99, status: 'draft', is_active: 1 }; } } }
      );
      assert.equal(draftDetail.status, 'not_found');
      assert.equal(draftDetail.notFoundData.title, 'Not Found | PT Euodoo Plastic');
    });

    it('3c. resolveBaseUrl and productController.detail reject spoofed Host headers', async () => {
      const prevBase = process.env.APP_BASE_URL;
      const origFindBySlug = productModel.findBySlug;
      delete process.env.APP_BASE_URL;
      productModel.findBySlug = async () => null;
      try {
        const safeBase = resolveBaseUrl({
          protocol: 'http',
          headers: {},
          get: () => 'evil.attacker.com'
        });
        assert.equal(safeBase.includes('evil.attacker.com'), false);

        let rendered = null;
        await productController.detail(
          { params: { slug: 'non-existent-slug-xyz' }, protocol: 'http', headers: {}, get: () => 'evil.attacker.com' },
          {
            locals: { currentLang: 'en', t: mockTranslator({ 'product_detail.not_found_title': 'Product Not Found' }) },
            statusCode: 200,
            status(c) { this.statusCode = c; return this; },
            render(view, data) { rendered = { view, data, statusCode: this.statusCode }; }
          }
        );
        assert.equal(rendered.statusCode, 404);
        assert.equal(rendered.view, 'public/404');
      } finally {
        productModel.findBySlug = origFindBySlug;
        if (prevBase !== undefined) process.env.APP_BASE_URL = prevBase;
      }
    });
  });

  describe('4. publicContactService (T-372)', () => {
    it('4a. normalizes and validates RFQ payload lengths and formats', () => {
      const normalized = normalizeRfqPayload({
        name: '  Budi ',
        company: '  PT Maju ',
        email: ' BUDI@EXAMPLE.COM ',
        phone: ' +62 812-3456-7890 ',
        type: 'unknown_type',
        message: '  Permintaan penawaran minimal sepuluh karakter.  '
      });
      assert.equal(normalized.email, 'budi@example.com');
      assert.equal(normalized.type, 'inquiry');
      assert.equal(validateRfqPayload(normalized), null);

      assert.equal(validateRfqPayload({ ...normalized, name: '' }), 'contact.err_required_fields');
      assert.equal(validateRfqPayload({ ...normalized, company: 'x'.repeat(101) }), 'contact.err_company_max');
      assert.equal(validateRfqPayload({ ...normalized, message: 'short' }), 'contact.err_message_length');
      assert.equal(validateRfqPayload({ ...normalized, message: 'a'.repeat(3001) }), 'contact.err_message_length');
      assert.equal(validateRfqPayload({ ...normalized, email: 'bad-email' }), 'contact.err_email_format');
      assert.equal(validateRfqPayload({ ...normalized, phone: '123' }), 'contact.err_phone_format');
    });

    it('4b. guards product_id selection and runs background mailer without blocking on SMTP failure', async () => {
      const mockProductModel = {
        async findById(id) {
          return id === 8 ? { id: 8, name_id: 'Tas ID', name_en: 'Bag EN' } : null;
        }
      };
      const t = mockTranslator({ 'contact.default_product_name': 'General' });

      const empty = await resolveProductSelection('', { t }, { productModel: mockProductModel });
      assert.deepEqual(empty, { valid: true, productId: null, productName: 'General' });

      const badNum = await resolveProductSelection('abc', { t }, { productModel: mockProductModel });
      assert.equal(badNum.valid, false);
      assert.equal(badNum.errorKey, 'contact.err_product_invalid');

      const missing = await resolveProductSelection('999', { t }, { productModel: mockProductModel });
      assert.equal(missing.valid, false);

      const validEn = await resolveProductSelection('8', { currentLang: 'en', t }, { productModel: mockProductModel });
      assert.deepEqual(validEn, { valid: true, productId: 8, productName: 'Bag EN' });

      let createdData = null;
      let loggedWarn = null;
      const inquiryId = await persistAndNotifyInquiry(
        {
          type: 'partnership',
          name: 'Budi',
          company: 'PT Test',
          email: 'budi@test.com',
          phone: '0812345678',
          quantity: '1000',
          message: 'Pesan panjang minimal sepuluh karakter'
        },
        validEn,
        '127.0.0.1',
        {
          inquiryModel: { async create(d) { createdData = d; return 55; } },
          mailer: { async sendLeadNotification() { throw new Error('SMTP down'); } },
          logger: { info() {}, warn(msg) { loggedWarn = msg; } }
        }
      );
      await new Promise((r) => setTimeout(r, 10));
      assert.equal(inquiryId, 55);
      assert.equal(createdData.product_id, 8);
      assert.equal(loggedWarn, 'Background mailer error:');
    });

    it('4c. builds contact page data and fallback payload with default Turnstile constant', async () => {
      const data = await getContactPageData(
        { product: 'hdpe', success: '1', error: 'validation' },
        { t: mockTranslator({ 'contact.page_title': 'Contact', 'contact.err_validation': 'Invalid' }) },
        {
          productModel: { async findAll() { return [{ id: 3, slug: 'hdpe' }]; } },
          pageHeroBannerModel: { async getByPageKey() { return { page_key: 'contact' }; } }
        }
      );
      assert.equal(data.selectedProduct.id, 3);
      assert.equal(data.success, true);
      assert.equal(data.error, true);
      assert.equal(data.errorMsg, 'Invalid');
      assert.equal(data.turnstileSiteKey, DEFAULT_TURNSTILE_SITE_KEY);

      const fallback = buildContactFallbackPayload({ t: mockTranslator({ 'contact.err_system_load': 'Load err' }) });
      assert.equal(fallback.error, true);
      assert.equal(fallback.errorMsg, 'Load err');
      assert.equal(fallback.turnstileSiteKey, DEFAULT_TURNSTILE_SITE_KEY);
    });
  });
});
