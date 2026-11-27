import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MAX_BULK_DELETE_IDS, parseBulkIds } from '../utils/bulkIdsHelper.js';
import { bulkDeleteAdminProducts } from '../services/productCrudService.js';
import { bulkDeleteProductCategories } from '../services/productCategoryService.js';
import { bulkDeleteAdminPosts } from '../services/postService.js';
import { bulkDeletePostCategories } from '../services/postCategoryService.js';

describe('Admin Bulk Delete Unit Tests (T-466)', () => {
  describe('1. parseBulkIds helper', () => {
    it('rejects empty and missing payloads', () => {
      assert.equal(parseBulkIds(null).status, 'validation_error');
      assert.equal(parseBulkIds({}).status, 'validation_error');
      assert.equal(parseBulkIds({ ids: [] }).status, 'validation_error');
      assert.equal(parseBulkIds({ 'ids[]': [] }).status, 'validation_error');
    });

    it('rejects non-array payloads', () => {
      assert.equal(parseBulkIds({ ids: '1,2' }).status, 'validation_error');
      assert.equal(parseBulkIds({ ids: 123 }).status, 'validation_error');
      assert.equal(parseBulkIds({ ids: { 0: 1 } }).status, 'validation_error');
    });

    it('rejects zero, negative, decimal, and non-numeric string IDs', () => {
      assert.equal(parseBulkIds({ ids: [0] }).status, 'validation_error');
      assert.equal(parseBulkIds({ ids: [-1] }).status, 'validation_error');
      assert.equal(parseBulkIds({ ids: ['0'] }).status, 'validation_error');
      assert.equal(parseBulkIds({ ids: ['-5'] }).status, 'validation_error');
      assert.equal(parseBulkIds({ ids: [1.5] }).status, 'validation_error');
      assert.equal(parseBulkIds({ ids: ['2.5'] }).status, 'validation_error');
      assert.equal(parseBulkIds({ ids: ['abc'] }).status, 'validation_error');
      assert.equal(parseBulkIds({ ids: ['12a'] }).status, 'validation_error');
      assert.equal(parseBulkIds({ ids: [''] }).status, 'validation_error');
    });

    it('deduplicates positive integer IDs and supports ids[] fallback', () => {
      assert.deepEqual(parseBulkIds({ ids: [3, '3', 5, ' 5 ', 3] }), {
        status: 'ok',
        ids: [3, 5]
      });
      assert.deepEqual(parseBulkIds({ 'ids[]': ['10', '20', 10] }), {
        status: 'ok',
        ids: [10, 20]
      });
    });

    it('rejects payloads exceeding MAX_BULK_DELETE_IDS (100)', () => {
      const overLimit = Array.from({ length: MAX_BULK_DELETE_IDS + 1 }, (_, i) => i + 1);
      const res = parseBulkIds({ ids: overLimit });
      assert.equal(res.status, 'validation_error');
      assert.match(res.error, /100/);
    });
  });

  describe('2. bulkDeleteAdminProducts', () => {
    it('returns validation_error for invalid IDs and not_found when none exist', async () => {
      const invalid = await bulkDeleteAdminProducts({ ids: ['bad'] });
      assert.equal(invalid.status, 'validation_error');

      const notFound = await bulkDeleteAdminProducts(
        { ids: [999] },
        { productModel: { async findByIds() { return []; } } }
      );
      assert.equal(notFound.status, 'not_found');
    });

    it('deletes products, deduplicates storage cleanup, and invalidates sitemap', async () => {
      const deletedStorage = [];
      let deletedTargetIds = null;
      let sitemapInvalidated = false;

      const res = await bulkDeleteAdminProducts(
        { ids: [1, 2, 999] },
        {
          productModel: {
            async findByIds() {
              return [
                { id: 1, image_url: '/uploads/products/a.webp' },
                { id: 2, main_image: '/uploads/products/a.webp' }
              ];
            },
            async deleteMany(ids) {
              deletedTargetIds = ids;
              return ids.length;
            }
          },
          storage: {
            async delete(url) {
              deletedStorage.push(url);
            }
          },
          invalidateSitemapCache() {
            sitemapInvalidated = true;
          }
        }
      );

      assert.equal(res.status, 'ok');
      assert.equal(res.deletedCount, 2);
      assert.equal(res.requestedCount, 3);
      assert.deepEqual(res.skippedIds, [999]);
      assert.deepEqual(deletedTargetIds, [1, 2]);
      assert.deepEqual(deletedStorage, ['/uploads/products/a.webp']);
      assert.equal(sitemapInvalidated, true);
    });
  });

  describe('3. bulkDeleteProductCategories & bulkDeletePostCategories', () => {
    it('bulkDeleteProductCategories computes affectedItemsCount and invalidates sitemap', async () => {
      let deletedTargetIds = null;
      let sitemapInvalidated = false;

      const res = await bulkDeleteProductCategories(
        { ids: [11, 12, 77] },
        {
          productCategoryModel: {
            async findByIdsWithProductCount() {
              return [
                { id: 11, product_count: 4 },
                { id: 12, product_count: 3 }
              ];
            },
            async deleteMany(ids) {
              deletedTargetIds = ids;
              return ids.length;
            }
          },
          invalidateSitemapCache() {
            sitemapInvalidated = true;
          }
        }
      );

      assert.equal(res.status, 'ok');
      assert.equal(res.deletedCount, 2);
      assert.equal(res.requestedCount, 3);
      assert.deepEqual(res.skippedIds, [77]);
      assert.equal(res.affectedItemsCount, 7);
      assert.deepEqual(deletedTargetIds, [11, 12]);
      assert.equal(sitemapInvalidated, true);
    });

    it('bulkDeletePostCategories computes affectedItemsCount and invalidates sitemap', async () => {
      let deletedTargetIds = null;
      let sitemapInvalidated = false;

      const res = await bulkDeletePostCategories(
        { ids: [21, 22] },
        {
          postCategoryModel: {
            async findByIdsWithPostCount() {
              return [
                { id: 21, post_count: 2 },
                { id: 22, post_count: 5 }
              ];
            },
            async deleteMany(ids) {
              deletedTargetIds = ids;
              return ids.length;
            }
          },
          invalidateSitemapCache() {
            sitemapInvalidated = true;
          }
        }
      );

      assert.equal(res.status, 'ok');
      assert.equal(res.deletedCount, 2);
      assert.equal(res.requestedCount, 2);
      assert.deepEqual(res.skippedIds, []);
      assert.equal(res.affectedItemsCount, 7);
      assert.deepEqual(deletedTargetIds, [21, 22]);
      assert.equal(sitemapInvalidated, true);
    });

    it('returns not_found when category IDs do not exist', async () => {
      const pcatNotFound = await bulkDeleteProductCategories(
        { ids: [404] },
        { productCategoryModel: { async findByIdsWithProductCount() { return []; } } }
      );
      assert.equal(pcatNotFound.status, 'not_found');

      const postCatNotFound = await bulkDeletePostCategories(
        { ids: [404] },
        { postCategoryModel: { async findByIdsWithPostCount() { return []; } } }
      );
      assert.equal(postCatNotFound.status, 'not_found');
    });
  });

  describe('4. bulkDeleteAdminPosts', () => {
    it('deletes posts, cleans slug_redirects & cover storage, and invalidates sitemap', async () => {
      const deletedStorage = [];
      let redirectCleanup = null;
      let sitemapInvalidated = false;

      const res = await bulkDeleteAdminPosts(
        { ids: [5, 6, 888] },
        {
          postModel: {
            async findByIds() {
              return [
                { id: 5, display_image: '/uploads/posts/cover-1.webp' },
                { id: 6, image_url: '/uploads/posts/cover-2.webp' }
              ];
            },
            async deleteMany(ids) {
              return ids.length;
            }
          },
          slugRedirectModel: {
            async deleteByEntityIds(entityType, ids) {
              redirectCleanup = { entityType, ids };
            }
          },
          storage: {
            async delete(url) {
              deletedStorage.push(url);
            }
          },
          invalidateSitemapCache() {
            sitemapInvalidated = true;
          }
        }
      );

      assert.equal(res.status, 'ok');
      assert.equal(res.deletedCount, 2);
      assert.equal(res.requestedCount, 3);
      assert.deepEqual(res.skippedIds, [888]);
      assert.deepEqual(redirectCleanup, { entityType: 'post', ids: [5, 6] });
      assert.deepEqual(deletedStorage, ['/uploads/posts/cover-1.webp', '/uploads/posts/cover-2.webp']);
      assert.equal(sitemapInvalidated, true);
    });
  });
});
