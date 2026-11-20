import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import mediaModel from '../models/mediaModel.js';
import { checkMediaUsage, deleteMediaItem } from '../services/mediaService.js';
import { mediaController } from '../controllers/admin/mediaController.js';
import { productController } from '../controllers/admin/productController.js';
import pool from '../config/database.js';
import storage from '../config/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

after(async () => {
  await pool.end();
});

function loadMediaUploadHelper(fetchImpl) {
  const code = fs.readFileSync(path.join(ROOT, 'public/js/media-upload-queue.js'), 'utf8');
  const doc = {
    documentElement: { lang: 'id' },
    querySelector: (sel) => (sel === 'meta[name="csrf-token"]' ? { content: 'csrf-tok-123' } : null)
  };
  const win = {};
  const ctx = vm.createContext({
    window: win,
    document: doc,
    fetch: fetchImpl,
    FormData: class MockFormData {
      constructor() { this.entries = []; }
      append(k, v) { this.entries.push([k, v]); }
    }
  });
  vm.runInContext(code, ctx);
  return { helper: win.EuMediaUpload, doc };
}

function createFakeElement(tag) {
  const attrs = {};
  const listeners = {};
  const el = {
    tagName: tag.toUpperCase(),
    className: '',
    children: [],
    style: {},
    value: '',
    disabled: false,
    title: '',
    textContent: '',
    setAttribute(k, v) { attrs[k] = String(v); },
    getAttribute(k) { return attrs[k] ?? null; },
    appendChild(child) { this.children.push(child); return child; },
    replaceChildren(...nodes) {
      if (nodes.length === 1 && nodes[0].isFragment) {
        this.children = [...nodes[0].children];
      } else {
        this.children = [...nodes];
      }
    },
    addEventListener(evt, fn) {
      listeners[evt] = listeners[evt] || [];
      listeners[evt].push(fn);
    },
    trigger(evt, eventObj = {}) {
      (listeners[evt] || []).forEach((fn) => fn(eventObj));
    },
    closest(sel) {
      if (sel === 'form') return el._form || null;
      return null;
    },
    querySelectorAll(sel) {
      if (sel === '.prod-gallery-item') return el.children;
      return [];
    },
    querySelector() { return null; }
  };
  return el;
}

describe('T-375..T-377: Product Gallery, Check-Usage & Multi-Upload', () => {
  it('T-375: media-picker.js uses pure DOM appendChild in renderGrid without innerHTML += overwrite', () => {
    const pickerJs = fs.readFileSync(path.join(ROOT, 'public/js/media-picker.js'), 'utf8');
    assert.equal(pickerJs.includes('card.innerHTML +='), false);
    assert.equal(pickerJs.includes('card.appendChild(checkbox)'), true);
    assert.equal(pickerJs.includes('createCardPreview(item)'), true);
    assert.equal(pickerJs.includes('Number(m.id) === Number(item.id)'), true);

    const createView = fs.readFileSync(path.join(ROOT, 'views/admin/products/create.ejs'), 'utf8');
    const editView = fs.readFileSync(path.join(ROOT, 'views/admin/products/edit.ejs'), 'utf8');
    assert.equal(createView.includes('/js/admin-product-form.js'), true);
    assert.equal(editView.includes('/js/admin-product-form.js'), true);
  });

  it('T-375: admin-product-form.js supports >12 photos, deduplication, reorder, and delete', () => {
    const code = fs.readFileSync(path.join(ROOT, 'public/js/admin-product-form.js'), 'utf8');
    const openPickerBtn = createFakeElement('button');
    const galleryStrip = createFakeElement('div');
    const galleryInput = createFakeElement('input');
    const form = createFakeElement('form');
    galleryInput._form = form;
    galleryInput.value = '[]';

    let capturedPickerOpts = null;
    const win = {
      openMediaPicker(opts) { capturedPickerOpts = opts; }
    };
    const doc = {
      documentElement: { lang: 'id' },
      getElementById(id) {
        if (id === 'btnOpenGalleryPicker') return openPickerBtn;
        if (id === 'prodGalleryStrip') return galleryStrip;
        if (id === 'gallery_images_input') return galleryInput;
        return null;
      },
      createElement: (tag) => createFakeElement(tag),
      createDocumentFragment: () => ({ isFragment: true, children: [], appendChild(c) { this.children.push(c); } })
    };

    vm.runInContext(code, vm.createContext({ window: win, document: doc }));
    openPickerBtn.trigger('click');
    assert.equal(capturedPickerOpts.type, 'image');
    assert.equal(capturedPickerOpts.multiple, true);

    const fifteenItems = Array.from({ length: 15 }, (_, idx) => ({
      id: idx + 101,
      file_url: `/uploads/media/img-${idx + 101}.webp`,
      filename: `img-${idx + 101}.webp`
    }));
    capturedPickerOpts.onSelect([...fifteenItems, fifteenItems[0]]);

    const savedIds = JSON.parse(galleryInput.value);
    assert.equal(savedIds.length, 15);
    assert.equal(savedIds[0], 101);
    assert.equal(savedIds[14], 115);

    const card0 = galleryStrip.children[0];
    const card1 = galleryStrip.children[1];
    galleryStrip.trigger('click', {
      target: {
        closest(sel) {
          if (sel === '.prod-gallery-item') return card0;
          if (sel === '.prod-gallery-btn-down') return {};
          return null;
        }
      }
    });
    assert.deepEqual(JSON.parse(galleryInput.value).slice(0, 2), [102, 101]);

    galleryStrip.trigger('click', {
      target: {
        closest(sel) {
          if (sel === '.prod-gallery-item') return card1;
          if (sel === '.prod-gallery-btn-del') return {};
          return null;
        }
      }
    });
    assert.equal(JSON.parse(galleryInput.value).length, 14);
    assert.equal(JSON.parse(galleryInput.value)[0], 102);
  });

  it('T-375: productController.store validation error preserves resolved gallery_items in formData', async () => {
    const origQuery = pool.query;
    const origExec = pool.execute;
    pool.execute = async (sql) => {
      if (sql.includes('FROM media WHERE id IN')) {
        return [[{ id: 96, file_url: '/uploads/media/a.webp', filename: 'a.webp' }]];
      }
      if (sql.includes('FROM product_categories')) return [[{ id: 1, name_id: 'HDPE' }]];
      return [[]];
    };
    pool.query = pool.execute;

    let rendered = null;
    const mockRes = {
      locals: { csrfToken: 'tok' },
      status() { return this; },
      render(view, data) { rendered = { view, data }; return this; }
    };

    try {
      await productController.store(
        { body: { name_id: '', gallery_images: '[96]' } },
        mockRes
      );
      assert.equal(rendered.view, 'admin/products/create');
      assert.equal(rendered.data.formData.gallery_items.length, 1);
      assert.equal(rendered.data.formData.gallery_items[0].url, '/uploads/media/a.webp');
    } finally {
      pool.query = origQuery;
      pool.execute = origExec;
    }
  });

  it('T-376: mediaModel.checkUsage queries products.gallery_images with JSON_CONTAINS for both URL and integer ID', async () => {
    const origQuery = pool.query;
    const calls = [];
    pool.query = async (sql, params) => {
      calls.push({ sql, params });
      if (sql.includes('SELECT id FROM media WHERE file_url = ?')) return [[{ id: 96 }]];
      return [[{ source: 'Katalog Produk', label: 'Soft Loop Bag' }]];
    };

    try {
      const usages = await mediaModel.checkUsage('/uploads/media/test.webp');
      assert.equal(usages.length, 1);
      assert.equal(calls.length, 2);
      assert.ok(calls[1].sql.includes('JSON_CONTAINS(gallery_images, CAST(? AS JSON))'));
      assert.ok(calls[1].params.includes('"/uploads/media/test.webp"'));
      assert.ok(calls[1].params.includes('96'));

      let passedArgs = null;
      const origCheck = mediaModel.checkUsage;
      const origFindById = mediaModel.findById;
      const origStorageDelete = storage.delete;
      mediaModel.findById = async () => ({ id: 96, media_type: 'image', file_url: '/uploads/media/test.webp' });
      mediaModel.checkUsage = async (url, id) => {
        passedArgs = { url, id };
        return [{ source: 'Katalog Produk', label: 'Soft Loop Bag' }];
      };
      storage.delete = async () => true;

      try {
        const delRes = await deleteMediaItem(96);
        assert.equal(delRes.status, 'in_use');
        assert.deepEqual(passedArgs, { url: '/uploads/media/test.webp', id: 96 });

        const checkRes = await checkMediaUsage('/uploads/media/test.webp', 96);
        assert.equal(checkRes.inUse, true);

        let apiResJson = null;
        await mediaController.apiCheckUsage(
          { body: { file_url: '/uploads/media/test.webp', media_id: 96 } },
          { json: (d) => { apiResJson = d; }, status() { return this; } }
        );
        assert.equal(apiResJson.inUse, true);
        assert.deepEqual(passedArgs, { url: '/uploads/media/test.webp', id: 96 });
      } finally {
        mediaModel.checkUsage = origCheck;
        mediaModel.findById = origFindById;
        storage.delete = origStorageDelete;
      }
    } finally {
      pool.query = origQuery;
    }
  });

  it('T-377: EuMediaUpload validates SVG/30MB and uploads unlimited sequential queue with partial failure isolation', async () => {
    const requests = [];
    const { helper } = loadMediaUploadHelper(async (url, opts) => {
      const fileEntry = opts.body.entries.find(([k]) => k === 'file')[1];
      requests.push({ url, csrf: opts.headers['X-CSRF-Token'], name: fileEntry.name });
      if (fileEntry.name === 'server-fail.png') {
        return { ok: false, json: async () => ({ success: false, message: 'Server error' }) };
      }
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { id: requests.length + 10, file_url: `/uploads/media/${fileEntry.name}`, filename: fileEntry.name, media_type: 'image' }
        })
      };
    });

    assert.equal(helper.validateMediaFile({ name: 'bad.svg', type: 'image/svg+xml', size: 100 }).ok, false);
    assert.equal(helper.validateMediaFile({ name: 'huge.png', type: 'image/png', size: 31 * 1024 * 1024 }).ok, false);
    assert.equal(helper.validateMediaFile({ name: 'ok.webp', type: 'image/webp', size: 1024 }).ok, true);

    const files = [
      ...Array.from({ length: 11 }, (_, i) => ({ name: `ok-${i}.png`, type: 'image/png', size: 1000 })),
      { name: 'bad.svg', type: 'image/svg+xml', size: 500 },
      { name: 'server-fail.png', type: 'image/png', size: 1000 },
      { name: 'after-fail.jpg', type: 'image/jpeg', size: 1000 }
    ];

    const events = [];
    const summary = await helper.runUploadQueue(files, {
      onFileDone: (idx, total, entry) => events.push({ idx, total, ok: entry.ok })
    });

    assert.equal(summary.total, 14);
    assert.equal(summary.successCount, 12);
    assert.equal(summary.failedCount, 2);
    assert.equal(summary.uploadedItems.length, 12);
    assert.equal(requests.length, 13);
    assert.equal(requests[0].csrf, 'csrf-tok-123');
    assert.equal(events.length, 14);
  });

  it('T-377: picker modal and /admin/media views expose multiple file input and 30MB non-SVG hint', () => {
    const pickerModal = fs.readFileSync(path.join(ROOT, 'views/partials/media-picker-modal.ejs'), 'utf8');
    const mediaIndex = fs.readFileSync(path.join(ROOT, 'views/admin/media/index.ejs'), 'utf8');

    assert.equal(pickerModal.includes('id="pickerFileInput" class="adm-d-none" multiple'), true);
    assert.equal(pickerModal.includes('Maks 30MB'), true);
    assert.equal(pickerModal.includes('SVG'), false);
    assert.equal(pickerModal.includes('Maks 15MB'), false);
    assert.equal(pickerModal.includes('aria-live="polite"'), true);

    assert.equal(mediaIndex.includes('id="mediaLibraryUploadForm"'), true);
    assert.equal(mediaIndex.includes('id="file" name="file" multiple'), true);
    assert.equal(mediaIndex.includes('id="mediaUploadQueue"'), true);
  });
});
