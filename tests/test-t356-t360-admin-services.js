import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { slugify } from '../utils/slugHelper.js';
import {
  parseSortOrder,
  parseShowDescriptionTab,
  buildProductCreateData,
  buildProductUpdateData
} from '../services/productService.js';
import {
  getAdminProductList,
  getProductCsvExportPayload,
  getProductSizeTableColumns,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct
} from '../services/productCrudService.js';
import productController, {
  parseDynamicSizeTable,
  parseSizeTable,
  getProductsWithSizeTable
} from '../controllers/admin/productController.js';
import {
  createProductCategory,
  updateProductCategory,
  toggleProductCategoryStatus,
  deleteProductCategory
} from '../services/productCategoryService.js';
import {
  LEAD_STATUSES,
  LEAD_TYPES,
  formatLeadCsvDate,
  getLeadListData,
  updateLeadStatus,
  getLeadCsvExportPayload
} from '../services/leadService.js';
import leadController from '../controllers/admin/leadController.js';
import {
  ALLOWED_EDITOR_MIMES,
  formatSlug,
  isValidPostSlug,
  createAdminPost,
  updateAdminPost,
  deleteAdminPost,
  uploadPostEditorImage
} from '../services/postService.js';
import {
  POST_CATEGORY_TYPES,
  listPostCategories,
  createPostCategory,
  updatePostCategory,
  deletePostCategory
} from '../services/postCategoryService.js';
import postCategoryController from '../controllers/admin/postCategoryController.js';

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    locals: { csrfToken: 'csrf-test-token' },
    rendered: null,
    redirectedTo: null,
    jsonPayload: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    json(obj) { this.jsonPayload = obj; return this; },
    render(view, data) { this.rendered = { view, data }; return this; },
    redirect(url) { this.redirectedTo = url; return this; }
  };
}

describe('Batch 2 Refactored Admin Services & Controllers Unit Tests (T-356..T-360)', () => {
  describe('0. utils/slugHelper.js', () => {
    it('normalizes whitespace, case, symbols, and repeated dashes', () => {
      assert.equal(slugify('  Plastik HDPE & Ramah Lingkungan! '), 'plastik-hdpe-ramah-lingkungan');
      assert.equal(slugify('Foo---Bar   Baz'), 'foo-bar-baz');
      assert.equal(slugify(''), '');
      assert.equal(slugify(null), '');
    });
  });

  describe('1. Product services & controller (T-356)', () => {
    it('1a. guards NaN sort_order across create and update payloads', () => {
      assert.equal(parseSortOrder('abc', 0), 0);
      assert.equal(parseSortOrder('', 7), 7);
      assert.equal(parseSortOrder(null, 5), 5);
      assert.equal(parseSortOrder(undefined, 3), 3);
      assert.equal(parseSortOrder('0', 9), 0);
      assert.equal(parseSortOrder('12', 0), 12);

      const created = buildProductCreateData(
        { name_id: 'Kantong HD', sort_order: 'not-a-num' },
        { cleanCtaId: null, cleanCtaEn: null, imageUrl: null, sizeTable: null }
      );
      assert.equal(created.sort_order, 0);

      const updated = buildProductUpdateData(
        { sort_order: 'invalid' },
        { name_id: 'Old', name_en: 'Old', slug: 'old', status: 'published', sort_order: 8 },
        { cleanCtaId: null, cleanCtaEn: null }
      );
      assert.equal(updated.sort_order, 8);
      assert.equal(updated.show_description_tab, 0);

      assert.equal(parseShowDescriptionTab('1'), 1);
      assert.equal(parseShowDescriptionTab(1), 1);
      assert.equal(parseShowDescriptionTab(true), 1);
      assert.equal(parseShowDescriptionTab(undefined), 0);
      assert.equal(parseShowDescriptionTab('0'), 0);
      assert.equal(parseShowDescriptionTab('99'), 0);

      const createdWithTab = buildProductCreateData(
        { name_id: 'Tas HDPE', show_description_tab: '1' },
        { cleanCtaId: null, cleanCtaEn: null, imageUrl: null, sizeTable: null }
      );
      assert.equal(createdWithTab.show_description_tab, 1);
    });

    it('1b. normalizes pagination, exports CSV with dynamic size columns, and returns size columns', async () => {
      let capturedFindArgs = null;
      const listRes = await getAdminProductList(
        { per_page: '999', page: '10', status: 'published', q: 'hdpe' },
        {
          productModel: {
            async countAll() { return 25; },
            async findAll(args) { capturedFindArgs = args; return [{ id: 1, name_id: 'HDPE' }]; }
          },
          productCategoryModel: { async findAll() { return [{ id: 2, name_id: 'Bags' }]; } }
        }
      );
      assert.equal(listRes.perPage, 10);
      assert.equal(listRes.totalPages, 3);
      assert.equal(listRes.currentPage, 3);
      assert.equal(capturedFindArgs.offset, 20);

      const csvRes = await getProductCsvExportPayload({
        date: new Date('2026-11-19T00:00:00Z'),
        productModel: {
          async findAll() {
            return [{
              id: 1,
              slug: 'hdpe-bag',
              name_id: 'Kantong HDPE',
              name_en: 'HDPE Bag',
              status: 'published',
              size_table: { columns: [{ id: 'col_1', label: 'Lebar' }], rows: [{ col_1: '30 cm' }] }
            }];
          }
        }
      });
      assert.equal(csvRes.filename, 'katalog-produk-euodoo-2026-11-19.csv');
      assert.ok(csvRes.columns.some((c) => c.label === 'Lebar'));
      assert.equal(csvRes.rows[0].__dyn_lebar, '30 cm');

      const missingCols = await getProductSizeTableColumns(999, { productModel: { async findById() { return null; } } });
      assert.equal(missingCols.status, 'not_found');

      const foundCols = await getProductSizeTableColumns(1, {
        productModel: {
          async findById() {
            return { id: 1, size_table: { columns: [{ id: 'c1', label: 'Panjang' }], rows: [] } };
          }
        }
      });
      assert.deepEqual(foundCols, { status: 'ok', columns: [{ id: 'col_1', label: 'Panjang' }] });
    });

    it('1c. validates createAdminProduct, preserves safe update order, and checks deleteAdminProduct', async () => {
      const noName = await createAdminProduct({}, null, {});
      assert.equal(noName.status, 'validation_error');

      const badJson = await createAdminProduct({ name_id: 'Produk A', size_table: '{bad-json' }, null, {});
      assert.equal(badJson.status, 'validation_error');

      let sitemapCalls = 0;
      const created = await createAdminProduct(
        { name_id: 'Produk A' },
        { buffer: Buffer.from('img') },
        {
          processAndSaveWebP: async () => '/uploads/products/a.webp',
          productModel: { async create() { return 55; } },
          invalidateSitemapCache: () => { sitemapCalls += 1; }
        }
      );
      assert.equal(created.status, 'ok');
      assert.equal(created.id, 55);
      assert.equal(sitemapCalls, 1);

      const events = [];
      await updateAdminProduct(
        5,
        { name_id: 'Produk Baru' },
        { buffer: Buffer.from('new-img') },
        {
          productModel: {
            async findById() {
              return { id: 5, name_id: 'Lama', name_en: 'Old', slug: 'lama', status: 'published', sort_order: 1, image_url: '/uploads/products/old.webp' };
            },
            async update() { events.push('db_update'); return true; }
          },
          processAndSaveWebP: async () => { events.push('save_webp'); return '/uploads/products/new.webp'; },
          storage: { async delete(url) { events.push(`delete:${url}`); } },
          invalidateSitemapCache: () => { events.push('sitemap'); }
        }
      );
      assert.deepEqual(events, ['save_webp', 'db_update', 'delete:/uploads/products/old.webp', 'sitemap']);

      const deletedUrls = [];
      await assert.rejects(
        () => updateAdminProduct(
          5,
          { name_id: 'Produk Baru' },
          { buffer: Buffer.from('bad-img') },
          {
            productModel: {
              async findById() {
                return { id: 5, name_id: 'Lama', name_en: 'Old', slug: 'lama', status: 'published', sort_order: 1, image_url: '/uploads/products/old.webp' };
              },
              async update() { throw new Error('must not reach update'); }
            },
            processAndSaveWebP: async () => { throw new Error('webp fail'); },
            storage: { async delete(url) { deletedUrls.push(url); } }
          }
        ),
        /webp fail/
      );
      assert.equal(deletedUrls.length, 0);

      const missingUpd = await updateAdminProduct(99, {}, null, { productModel: { async findById() { return null; } } });
      assert.equal(missingUpd.status, 'not_found');

      const missingDel = await deleteAdminProduct(99, { productModel: { async findById() { return null; } } });
      assert.equal(missingDel.status, 'not_found');

      const delOrder = [];
      const delOk = await deleteAdminProduct(5, {
        productModel: {
          async findById() { return { id: 5, image_url: '/uploads/products/old.webp' }; },
          async delete() { delOrder.push('db_delete'); return true; }
        },
        storage: { async delete(url) { delOrder.push(`storage_delete:${url}`); } },
        invalidateSitemapCache: () => { delOrder.push('sitemap'); }
      });
      assert.equal(delOk.status, 'ok');
      assert.deepEqual(delOrder, ['db_delete', 'storage_delete:/uploads/products/old.webp', 'sitemap']);
    });

    it('1d. keeps productController re-exports and returns 404/redirect on destroy not_found', async () => {
      assert.equal(typeof parseDynamicSizeTable, 'function');
      assert.equal(typeof parseSizeTable, 'function');
      assert.equal(typeof getProductsWithSizeTable, 'function');
      assert.equal(typeof productController.getProductsWithSizeTable, 'function');

      const { default: productModel } = await import('../models/productModel.js');
      const origFindById = productModel.findById;
      productModel.findById = async () => null;
      try {
        const jsonRes = createMockRes();
        await productController.destroy({ params: { id: 999 }, headers: { accept: 'application/json' }, query: {} }, jsonRes);
        assert.equal(jsonRes.statusCode, 404);
        assert.equal(jsonRes.jsonPayload.success, false);

        const ssrRes = createMockRes();
        await productController.destroy({ params: { id: 999 }, headers: {}, query: {} }, ssrRes);
        assert.ok(ssrRes.redirectedTo.startsWith('/admin/products?error='));
      } finally {
        productModel.findById = origFindById;
      }
    });
  });

  describe('2. productCategoryService (T-357)', () => {
    it('validates name_id, guards NaN sort_order, preserves slug on partial update, and guards not_found', async () => {
      const invalid = await createProductCategory({ name_id: '   ' }, {});
      assert.equal(invalid.status, 'validation_error');

      let createdPayload = null;
      const created = await createProductCategory(
        { name_id: 'Kemasan HDPE', sort_order: 'bad', is_active: 'on' },
        { productCategoryModel: { async create(data) { createdPayload = data; return 11; } } }
      );
      assert.equal(created.status, 'ok');
      assert.equal(createdPayload.slug, 'kemasan-hdpe');
      assert.equal(createdPayload.sort_order, 0);
      assert.equal(createdPayload.is_active, 1);

      let updatedPayload = null;
      const updMissing = await updateProductCategory(99, {}, { productCategoryModel: { async findById() { return null; } } });
      assert.equal(updMissing.status, 'not_found');

      const updOk = await updateProductCategory(
        11,
        { name_en: 'HDPE Packaging', sort_order: 'oops', is_active: '' },
        {
          productCategoryModel: {
            async findById() {
              return { id: 11, name_id: 'Kemasan HDPE', name_en: 'Old', slug: 'kemasan-hdpe', sort_order: 6 };
            },
            async update(_id, data) { updatedPayload = data; return true; }
          }
        }
      );
      assert.equal(updOk.status, 'ok');
      assert.equal(updatedPayload.slug, 'kemasan-hdpe');
      assert.equal(updatedPayload.sort_order, 6);
      assert.equal(updatedPayload.is_active, 0);

      const toggleMissing = await toggleProductCategoryStatus(99, { productCategoryModel: { async toggleActive() { return null; } } });
      assert.equal(toggleMissing.status, 'not_found');

      const toggleOk = await toggleProductCategoryStatus(11, {
        productCategoryModel: { async toggleActive() { return { id: 11, name_id: 'Kemasan HDPE', is_active: 0 }; } }
      });
      assert.equal(toggleOk.status, 'ok');

      const delMissing = await deleteProductCategory(99, { productCategoryModel: { async findById() { return null; } } });
      assert.equal(delMissing.status, 'not_found');

      const delOk = await deleteProductCategory(11, {
        productCategoryModel: {
          async findById() { return { id: 11 }; },
          async delete() { return true; }
        }
      });
      assert.equal(delOk.status, 'ok');
    });
  });

  describe('3. leadService & leadController (T-358)', () => {
    it('whitelists filter status/type, validates updateStatus, guards CSV dates, and responds JSON/SSR', async () => {
      assert.deepEqual(LEAD_STATUSES, ['baru', 'diproses', 'selesai', 'ditolak']);
      assert.deepEqual(LEAD_TYPES, ['inquiry', 'partnership', 'general']);

      let capturedFilter = null;
      const listRes = await getLeadListData(
        { status: 'invalid_status', type: 'unknown_type' },
        { leadModel: { async findAll(filter) { capturedFilter = filter; return []; } } }
      );
      assert.deepEqual(capturedFilter, { status: null, type: null });
      assert.equal(listRes.selectedStatus, null);
      assert.equal(listRes.selectedType, null);

      const validListRes = await getLeadListData(
        { status: 'diproses', type: 'partnership' },
        { leadModel: { async findAll(filter) { capturedFilter = filter; return [{ id: 1 }]; } } }
      );
      assert.deepEqual(capturedFilter, { status: 'diproses', type: 'partnership' });
      assert.equal(validListRes.leads.length, 1);

      const badStatus = await updateLeadStatus(1, { status: 'dibaca' }, {});
      assert.equal(badStatus.status, 'validation_error');

      let savedNotes = null;
      const okStatus = await updateLeadStatus(1, { status: 'selesai', admin_notes: 'Quoted' }, {
        leadModel: { async updateStatus(_id, _st, notes) { savedNotes = notes; return true; } }
      });
      assert.equal(okStatus.status, 'ok');
      assert.equal(savedNotes, 'Quoted');

      assert.equal(formatLeadCsvDate('2026-11-19T10:20:30Z'), '2026-11-19 10:20:30');
      assert.equal(formatLeadCsvDate(null), '');
      assert.equal(formatLeadCsvDate('invalid-date'), '');

      const csvPayload = await getLeadCsvExportPayload({
        date: new Date('2026-11-19T00:00:00Z'),
        leadModel: { async exportAll() { return [{ id: 1, tanggal: null }]; } }
      });
      assert.equal(csvPayload.filename, 'leads-pt-euodoo-2026-11-19.csv');
      assert.equal(csvPayload.columns[1].key(csvPayload.leads[0]), '');

      const { default: leadModel } = await import('../models/leadModel.js');
      const origUpdateStatus = leadModel.updateStatus;
      leadModel.updateStatus = async () => true;
      try {
        const res400 = createMockRes();
        await leadController.updateStatus({ params: { id: 4 }, body: { status: 'bad' }, headers: { accept: 'application/json' } }, res400);
        assert.equal(res400.statusCode, 400);
        assert.equal(res400.jsonPayload.success, false);

        const res200 = createMockRes();
        await leadController.updateStatus({ params: { id: 4 }, body: { status: 'selesai' }, headers: { accept: 'application/json' } }, res200);
        assert.equal(res200.statusCode, 200);
        assert.deepEqual(res200.jsonPayload, { success: true, message: 'Status lead berhasil diperbarui.', status: 'selesai', id: 4 });
      } finally {
        leadModel.updateStatus = origUpdateStatus;
      }
    });
  });

  describe('4. postService (T-359)', () => {
    it('4a. enforces isolated formatSlug, validates before upload, sanitizes HTML, and invalidates sitemap', async () => {
      assert.equal(formatSlug('Berita Baru 2026!!'), 'berita-baru-2026');
      assert.equal(isValidPostSlug('berita-baru-2026'), true);
      assert.equal(isValidPostSlug('Invalid_Slug'), false);

      let uploadCalls = 0;
      const baseFailDeps = {
        postCategoryModel: { async findAll() { return [{ id: 1, name_id: 'Berita' }]; } },
        postModel: { async isSlugTaken(s) { return s === 'sudah-ada'; } },
        processAndSaveWebP: async () => { uploadCalls += 1; return '/uploads/posts/x.webp'; }
      };

      const emptyTitle = await createAdminPost({ title_id: '  ' }, { buffer: Buffer.from('img') }, baseFailDeps);
      assert.equal(emptyTitle.status, 'validation_error');

      const invalidSlug = await createAdminPost({ title_id: 'Judul', slug: '---' }, { buffer: Buffer.from('img') }, baseFailDeps);
      assert.equal(invalidSlug.status, 'validation_error');

      const dupSlug = await createAdminPost({ title_id: 'Judul', slug: 'sudah-ada' }, { buffer: Buffer.from('img') }, baseFailDeps);
      assert.equal(dupSlug.status, 'validation_error');
      assert.equal(uploadCalls, 0);

      let createdData = null;
      let sitemapCalls = 0;
      const okCreate = await createAdminPost(
        {
          title_id: 'Artikel Uji',
          content_id: '<p>Aman</p><script>alert(1)</script><img src="https://x.test/a.png" onerror="alert(1)">'
        },
        null,
        {
          postCategoryModel: { async findAll() { return []; } },
          postModel: {
            async isSlugTaken() { return false; },
            async create(data) { createdData = data; return 77; }
          },
          invalidateSitemapCache: () => { sitemapCalls += 1; }
        }
      );
      assert.equal(okCreate.status, 'ok');
      assert.equal(createdData.slug, 'artikel-uji');
      assert.equal(createdData.content_id.includes('<script>'), false);
      assert.equal(createdData.content_id.includes('onerror'), false);
      assert.equal(sitemapCalls, 1);
    });

    it('4b. orders updateAdminPost safely (DB update before redirect/delete), deleteAdminPost, and uploadPostEditorImage', async () => {
      const missing = await updateAdminPost(99, {}, null, { postModel: { async findById() { return null; } } });
      assert.equal(missing.status, 'not_found');

      const events = [];
      const okUpdate = await updateAdminPost(
        10,
        { title_id: 'Judul Baru', slug: 'slug-baru' },
        { buffer: Buffer.from('cover') },
        {
          postModel: {
            async findById() {
              return { id: 10, title_id: 'Lama', title_en: 'Old', slug: 'slug-lama', type: 'berita', status: 'published', display_image: '/uploads/posts/old.webp' };
            },
            async isSlugTaken() { return false; },
            async update() { events.push('db_update'); return true; }
          },
          processAndSaveWebP: async () => { events.push('save_webp'); return '/uploads/posts/new.webp'; },
          slugRedirectModel: { async createRedirect(_t, _id, oldS, newS) { events.push(`redirect:${oldS}->${newS}`); } },
          storage: { async delete(url) { events.push(`delete:${url}`); } },
          invalidateSitemapCache: () => { events.push('sitemap'); }
        }
      );
      assert.equal(okUpdate.status, 'ok');
      assert.deepEqual(events, [
        'save_webp',
        'db_update',
        'redirect:slug-lama->slug-baru',
        'delete:/uploads/posts/old.webp',
        'sitemap'
      ]);

      const sideEffects = [];
      await assert.rejects(
        () => updateAdminPost(
          10,
          { slug: 'slug-baru' },
          { buffer: Buffer.from('cover') },
          {
            postModel: {
              async findById() { return { id: 10, title_id: 'Lama', title_en: 'Old', slug: 'slug-lama', type: 'berita', status: 'published', display_image: '/uploads/posts/old.webp' }; },
              async isSlugTaken() { return false; },
              async update() { throw new Error('db fail'); }
            },
            processAndSaveWebP: async () => '/uploads/posts/new.webp',
            slugRedirectModel: { async createRedirect() { sideEffects.push('redirect'); } },
            storage: { async delete() { sideEffects.push('delete'); } }
          }
        ),
        /db fail/
      );
      assert.equal(sideEffects.length, 0);

      const delMissing = await deleteAdminPost(99, {
        postModel: {
          async findById() { return null; },
          async delete() { sideEffects.push('del'); }
        },
        storage: { async delete() { sideEffects.push('storage'); } },
        slugRedirectModel: { async deleteByEntity() { sideEffects.push('redir'); } }
      });
      assert.equal(delMissing.status, 'not_found');
      assert.equal(sideEffects.length, 0);

      const delOrder = [];
      const delOk = await deleteAdminPost(10, {
        postModel: {
          async findById() { return { id: 10, display_image: '/uploads/posts/old.webp' }; },
          async delete() { delOrder.push('db_delete'); return true; }
        },
        slugRedirectModel: { async deleteByEntity() { delOrder.push('redir_delete'); return true; } },
        storage: { async delete(url) { delOrder.push(`storage_delete:${url}`); } },
        invalidateSitemapCache: () => { delOrder.push('sitemap'); }
      });
      assert.equal(delOk.status, 'ok');
      assert.deepEqual(delOrder, ['db_delete', 'redir_delete', 'storage_delete:/uploads/posts/old.webp', 'sitemap']);

      assert.deepEqual(ALLOWED_EDITOR_MIMES, ['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
      assert.equal((await uploadPostEditorImage(null, {})).status, 'validation_error');
      assert.equal((await uploadPostEditorImage({ buffer: Buffer.from('x'), mimetype: 'image/svg+xml' }, {})).status, 'validation_error');

      let webpOpts = null;
      const uploadOk = await uploadPostEditorImage(
        { buffer: Buffer.from('png'), mimetype: 'image/png' },
        {
          processAndSaveWebP: async (_buf, dir, opts) => {
            webpOpts = { dir, opts };
            return '/uploads/posts/inline.webp';
          }
        }
      );
      assert.deepEqual(uploadOk, { status: 'ok', location: '/uploads/posts/inline.webp' });
      assert.deepEqual(webpOpts, { dir: 'posts', opts: { maxWidth: 1600, maxHeight: 1600, quality: 82 } });
    });
  });

  describe('5. postCategoryService & postCategoryController (T-360)', () => {
    it('enforces type whitelist, guards NaN sort_order, handles not_found, and passes csrfToken', async () => {
      assert.deepEqual(POST_CATEGORY_TYPES, ['berita', 'blog']);

      let filterArg = null;
      const listInvalid = await listPostCategories(
        { type: 'pers' },
        { postCategoryModel: { async findAll(arg) { filterArg = arg; return []; } } }
      );
      assert.deepEqual(filterArg, { type: null });
      assert.equal(listInvalid.currentType, null);

      const badCreate = await createPostCategory({ name_id: 'Kat', type: 'pers' }, {});
      assert.equal(badCreate.status, 'validation_error');

      let createdPayload = null;
      const okCreate = await createPostCategory(
        { name_id: 'Edukasi Industri', sort_order: 'bad-num' },
        { postCategoryModel: { async create(data) { createdPayload = data; return 3; } } }
      );
      assert.equal(okCreate.status, 'ok');
      assert.equal(createdPayload.type, 'berita');
      assert.equal(createdPayload.slug, 'edukasi-industri');
      assert.equal(createdPayload.sort_order, 0);

      let updatedPayload = null;
      const okUpdate = await updatePostCategory(
        3,
        { sort_order: 'nan' },
        {
          postCategoryModel: {
            async findById() { return { id: 3, name_id: 'Edukasi', name_en: 'Edu', slug: 'edukasi', type: 'blog', sort_order: 4 }; },
            async update(_id, data) { updatedPayload = data; return true; }
          }
        }
      );
      assert.equal(okUpdate.status, 'ok');
      assert.equal(updatedPayload.type, 'blog');
      assert.equal(updatedPayload.sort_order, 4);

      const delMissing = await deletePostCategory(99, { postCategoryModel: { async findById() { return null; } } });
      assert.equal(delMissing.status, 'not_found');

      const { default: postCategoryModel } = await import('../models/postCategoryModel.js');
      const origFindAll = postCategoryModel.findAll;
      const origFindById = postCategoryModel.findById;
      postCategoryModel.findAll = async () => [];
      postCategoryModel.findById = async () => ({ id: 3, name_id: 'Edukasi', type: 'blog', sort_order: 4 });
      try {
        const resIndex = createMockRes();
        await postCategoryController.index({ query: {} }, resIndex);
        assert.equal(resIndex.rendered.data.csrfToken, 'csrf-test-token');

        const resCreate = createMockRes();
        postCategoryController.createView({}, resCreate);
        assert.equal(resCreate.rendered.data.csrfToken, 'csrf-test-token');

        const resStoreErr = createMockRes();
        await postCategoryController.store({ body: {} }, resStoreErr);
        assert.equal(resStoreErr.statusCode, 400);
        assert.equal(resStoreErr.rendered.data.csrfToken, 'csrf-test-token');

        const resEdit = createMockRes();
        await postCategoryController.editView({ params: { id: 3 } }, resEdit);
        assert.equal(resEdit.rendered.data.csrfToken, 'csrf-test-token');
      } finally {
        postCategoryModel.findAll = origFindAll;
        postCategoryModel.findById = origFindById;
      }
    });
  });

  describe('6. eslint.config.js strict block (T-361)', () => {
    it('enforces strict error rules on all 13 Batch 2 files', async () => {
      const { default: eslintConfig } = await import('../eslint.config.js');
      const batch2Targets = [
        'controllers/admin/leadController.js',
        'controllers/admin/postCategoryController.js',
        'controllers/admin/postController.js',
        'controllers/admin/productCategoryController.js',
        'controllers/admin/productController.js',
        'services/leadService.js',
        'services/postCategoryService.js',
        'services/postService.js',
        'services/productCategoryService.js',
        'services/productCrudService.js',
        'services/productService.js',
        'services/productSizeTableService.js',
        'utils/slugHelper.js'
      ];
      const strictBlock = eslintConfig.find(
        (entry) => Array.isArray(entry.files) && batch2Targets.every((f) => entry.files.includes(f))
      );
      assert.ok(strictBlock, 'Strict override block must include all 13 Batch 2 files');
      for (const ruleName of ['max-lines', 'max-lines-per-function', 'max-depth', 'complexity', 'no-unused-vars']) {
        const ruleVal = strictBlock.rules?.[ruleName];
        assert.equal(Array.isArray(ruleVal) ? ruleVal[0] : ruleVal, 'error');
      }
    });
  });
});
