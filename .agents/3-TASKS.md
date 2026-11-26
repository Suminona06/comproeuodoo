# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 11 Task (`T-457` s/d `T-467` - Revamp Tabs Dashboard Admin Growing Underline & Bulk Delete 4 Modul Admin)
- **Total Task Selesai:** 456 Task (T-01 s/d T-456)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Proposal Acuan:** [changes/2026-11-26_admin-tabs-revamp-bulk-delete.md](../changes/2026-11-26_admin-tabs-revamp-bulk-delete.md) (Keputusan terkunci: 1a, 2a, 3a, 4a, 5a)
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-468**.

---

## Task Aktif / Terbuka (Open Tasks)

### [OPEN] `T-457` `[Tier: Argon Medium]`: Revamp CSS Tabs Dashboard Admin (Growing Underline Tema Hijau Euodoo)
- **Modul Spek:** [prd/admin-ui-tabs-bulk.md](prd/admin-ui-tabs-bulk.md) (`FR-41`), [tech/admin-ui-tabs-bulk.md](tech/admin-ui-tabs-bulk.md), [tech/admin-ui-css.md](tech/admin-ui-css.md)
- **File Terdampak (4 file):**
  1. `public/css/admin/tabs-toggles.css`
  2. `public/css/admin/tables-badges.css`
  3. `public/css/admin/responsive-viewport.css`
  4. `public/css/admin/media-picker.css`
- **Langkah Kerja:**
  1. Pindahkan aturan `.filter-tabs-wrap` dan `.tab-btn` dari `public/css/admin/tables-badges.css` ke `public/css/admin/tabs-toggles.css` (pastikan 0 duplikat selector lintas 21 file CSS admin).
  2. Terapkan gaya kontainer putih membulat (`background: var(--bg-surface)`, `border: 1px solid var(--border-main)`, `box-shadow: var(--shadow-sm)`, `border-radius: var(--r-xl)` untuk `.about-tabs-nav` dan `var(--r-lg)` untuk `.filter-tabs-wrap`) serta hapus `backdrop-filter` liquid-glass pada `.about-tabs-nav`.
  3. Standarisasi proporsi tipografi & padding: `.filter-tabs-wrap .tab-btn` (`font-size: 13px`, `padding: 7px 14px`), `.about-tab-btn` (`font-size: 13.5px`, `padding: 9px 16px`), teks non-aktif `var(--text-slate-dark)` / `var(--text-muted)`, teks aktif `var(--text-main)` `font-weight: 600`, dan `cursor: pointer`.
  4. Implementasikan indikator *growing underline* melalui `::after` (`height: 2.5px`, `background-color: var(--primary)`, `border-radius: var(--r-pill)`, `transform-origin: center`) dengan animasi hanya pada `transform` dan `opacity`: default `scaleX(0); opacity: 0;`, hover non-aktif di dalam `@media (hover: hover)` `scaleX(0.6); opacity: 0.35;`, aktif `.active` / `[aria-selected="true"]` `scaleX(1); opacity: 1;`, state `:active` sentuh, `:focus-visible` (`outline: 2px solid var(--primary)` + `var(--focus-ring)`), serta `@media (prefers-reduced-motion: reduce)` (`transition: none`).
  5. Perbarui `.media-picker-tabs` dan `.media-picker-tab-btn` di `public/css/admin/media-picker.css` memakai pola *growing underline* `::after` identik (`transform-origin: center`, `var(--primary)`, pratinjau hover redup, `font-size: 13.5px`, teks aktif `var(--text-main)` `font-weight: 600`, tanpa border-bottom statis lama).
  6. Perbarui aturan mobile di `public/css/admin/responsive-viewport.css` (dan `tabs-toggles.css`) agar tab pada `<= 768px` memakai `min-height: 44px`, `flex-wrap: nowrap`, `overflow-x: auto`, `scroll-snap-type: x proximity`, tanpa memotong label di `320px-768px`.
- **Kontrak Data / Class CSS:** Mempertahankan class `.filter-tabs-wrap`, `.tab-btn`, `.about-tabs-nav`, `.about-tab-btn`, `.media-picker-tabs`, `.media-picker-tab-btn` + state `.active` / `[aria-selected="true"]`; wajib token `public/css/admin/tokens.css` (zero raw hex, nol warna biru).
- **Referensi Pola:** `public/css/admin/tabs-toggles.css`, `public/css/admin/buttons.css`, `Design/Tabs design.png`.
- **Batasan Negatif:** Dilarang menyentuh `public/css/tokens.css`, `public/css/components/*.css`, `views/partials/products/spec-tabs.ejs`, atau file JS/EJS. Dilarang menulis hex mentah di luar `public/css/admin/tokens.css`. Tiap file CSS wajib `<= 600` baris dan 0 duplikat selector.
- **Skill Relevan:** `antislop-ui`, `antislop-layoutmobile`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && npm run lint:views && node --test tests/test-admin-css-modular.js
  ```

---

### [OPEN] `T-458` `[Tier: Argon Medium]`: Backend Bulk Delete Katalog Produk (Helper Whitelist, Model, Service & Controller)
- **Modul Spek:** [prd/admin-ui-tabs-bulk.md](prd/admin-ui-tabs-bulk.md) (`FR-42`), [tech/admin-ui-tabs-bulk.md](tech/admin-ui-tabs-bulk.md), [tech/admin-products-rfq.md](tech/admin-products-rfq.md)
- **File Terdampak (4 file):**
  1. `utils/bulkIdsHelper.js` *(baru)*
  2. `models/productModel.js`
  3. `services/productCrudService.js`
  4. `controllers/admin/productController.js`
- **Langkah Kerja:**
  1. Buat `utils/bulkIdsHelper.js` yang mengekspor `MAX_BULK_DELETE_IDS = 100` dan fungsi murni `parseBulkIds(rawBody, { max = MAX_BULK_DELETE_IDS })` untuk menerima `rawBody?.ids ?? rawBody?.['ids[]']`, memvalidasi array tidak kosong, menolak nilai non-integer/<=0/NaN/string huruf/objek, menduplikasi unik via `Set`, dan menolak jika jumlah ID > `max`.
  2. Tambahkan `findByIds(ids)` dan `deleteMany(ids)` di `models/productModel.js` memakai *prepared statement* terparameter (`IN (?, ...)`) dan transaksi DB (`DELETE FROM product_variants WHERE product_id IN (...)` lalu `DELETE FROM products WHERE id IN (...)`).
  3. Tambahkan `bulkDeleteAdminProducts(rawBody, deps = {})` di `services/productCrudService.js` mengikuti pola DI `useDeps(deps)`: validasi `parseBulkIds`, ambil record via `findByIds`, hapus transaksi via `deleteMany`, cleanup `image_url` unik via `d.storage.delete`, panggil `d.invalidateSitemapCache()` sekali, dan kembalikan `{ status, deletedCount, requestedCount, skippedIds, message }`.
  4. Tambahkan handler `bulkDestroy(req, res)` di `controllers/admin/productController.js` dengan pemetaan HTTP `400` (`validation_error`), `404` (`not_found`), `200` (`ok`), `500` (error generik).
- **Kontrak Data Eksplisit:** Input `POST` JSON `{ ids: number[] }` (1..100 integer positif unik); `200` `{ success: true, deletedCount, requestedCount, skippedIds, message }`; `400`/`404` `{ success: false, message }`.
- **Referensi Pola:** `deleteAdminProduct` di `services/productCrudService.js`, `productModel.delete` di `models/productModel.js`, `respondDestroyResult` di `controllers/admin/productController.js`.
- **Batasan Negatif:** Dilarang menyentuh `routes/adminRoutes.js`, view EJS, JS klien, atau skema DB. Ikuti aturan ESLint strict (`max-lines-per-function`, `max-depth`, `complexity`).
- **Skill Relevan:** `api-and-interface-design`, `security-and-hardening`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && node --test tests/test-admin-batch2-services.js
  ```

---

### [OPEN] `T-459` `[Tier: Hydrogen Medium]`: Backend Bulk Delete Kategori Produk & Registrasi Rute Katalog
- **Modul Spek:** [prd/admin-ui-tabs-bulk.md](prd/admin-ui-tabs-bulk.md) (`FR-42`), [tech/admin-ui-tabs-bulk.md](tech/admin-ui-tabs-bulk.md), [tech/admin-cms.md](tech/admin-cms.md)
- **File Terdampak (4 file):**
  1. `models/productCategoryModel.js`
  2. `services/productCategoryService.js`
  3. `controllers/admin/productCategoryController.js`
  4. `routes/adminRoutes.js`
- **Langkah Kerja:**
  1. Tambahkan `findByIdsWithProductCount(ids)` dan `deleteMany(ids)` di `models/productCategoryModel.js` menggunakan transaksi DB (`pool.getConnection()`): `UPDATE products SET category_id = NULL WHERE category_id IN (...)` lalu `DELETE FROM product_categories WHERE id IN (...)`.
  2. Tambahkan `bulkDeleteProductCategories(rawBody, deps = {})` di `services/productCategoryService.js` dengan validasi `parseBulkIds`, hitung `affectedItemsCount`, eksekusi `deleteMany`, panggil `invalidateSitemapCache()`, dan kembalikan `{ status, deletedCount, requestedCount, skippedIds, affectedItemsCount, message }`.
  3. Tambahkan handler `bulkDestroy(req, res)` di `controllers/admin/productCategoryController.js` yang merespons JSON `200`/`400`/`404`/`500` (serta fallback redirect bila bukan JSON).
  4. Daftarkan `POST /products/bulk-delete` dan `POST /product-categories/bulk-delete` di `routes/adminRoutes.js` dengan middleware `requireAuth, roleMiddleware(['superadmin', 'admin'])` tepat **sebelum** rute berparameter `/:id`.
- **Kontrak Data Eksplisit:** Endpoint `POST /admin/products/bulk-delete` & `POST /admin/product-categories/bulk-delete` (RBAC `['superadmin', 'admin']`, CSRF aktif); body `{ ids: number[] }` (1..100); `200` `{ success: true, deletedCount, requestedCount, skippedIds, affectedItemsCount, message }`; `400`/`403`/`404`.
- **Referensi Pola:** `deleteProductCategory` di `services/productCategoryService.js`, `productCategoryModel.delete` di `models/productCategoryModel.js`, rute T-46 di `routes/adminRoutes.js`.
- **Batasan Negatif:** Dilarang mengubah perilaku endpoint single delete `/:id/delete`, dilarang menyentuh rute berita/artikel (`posts`/`post-categories`), dan dilarang mengedit file frontend.
- **Skill Relevan:** `api-and-interface-design`, `security-and-hardening`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && node --test tests/test-admin-batch2-services.js
  ```

---

### [OPEN] `T-460` `[Tier: Argon Medium]`: Backend Bulk Delete Berita / Artikel (Model, Redirect Cleanup, Service & Controller)
- **Modul Spek:** [prd/admin-ui-tabs-bulk.md](prd/admin-ui-tabs-bulk.md) (`FR-42`), [tech/admin-ui-tabs-bulk.md](tech/admin-ui-tabs-bulk.md), [tech/news.md](tech/news.md)
- **File Terdampak (4 file):**
  1. `models/postModel.js`
  2. `models/slugRedirectModel.js`
  3. `services/postService.js`
  4. `controllers/admin/postController.js`
- **Langkah Kerja:**
  1. Tambahkan `findByIds(ids)` dan `deleteMany(ids)` di `models/postModel.js` memakai *prepared statement* terparameter (`IN (?, ...)`).
  2. Tambahkan `deleteByEntityIds(entityType, entityIds)` di `models/slugRedirectModel.js` (`DELETE FROM slug_redirects WHERE entity_type = ? AND entity_id IN (...)`).
  3. Tambahkan `bulkDeleteAdminPosts(rawBody, deps = {})` di `services/postService.js`: validasi `parseBulkIds`, ambil data existing via `findByIds`, hapus `posts` dan `slug_redirects` secara aman, hapus tiap `display_image`/`image_url` via `d.storage.delete`, panggil `d.invalidateSitemapCache()` sekali, dan kembalikan `{ status, deletedCount, requestedCount, skippedIds, message }`.
  4. Tambahkan handler `bulkDestroy(req, res)` di `controllers/admin/postController.js` dengan pemetaan HTTP `200`/`400`/`404`/`500`.
- **Kontrak Data Eksplisit:** Body `{ ids: number[] }` (1..100 integer positif unik); `200` `{ success: true, deletedCount, requestedCount, skippedIds, message }`; `400`/`404`.
- **Referensi Pola:** `deleteAdminPost` di `services/postService.js`, `slugRedirectModel.deleteByEntity` di `models/slugRedirectModel.js`.
- **Batasan Negatif:** Dilarang menyentuh `routes/adminRoutes.js`, halaman publik `/news`, atau view admin. Ikuti aturan ESLint strict.
- **Skill Relevan:** `api-and-interface-design`, `security-and-hardening`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && node --test tests/test-admin-batch3-services.js
  ```

---

### [OPEN] `T-461` `[Tier: Hydrogen Medium]`: Backend Bulk Delete Kategori Berita & Registrasi Rute Berita
- **Modul Spek:** [prd/admin-ui-tabs-bulk.md](prd/admin-ui-tabs-bulk.md) (`FR-42`), [tech/admin-ui-tabs-bulk.md](tech/admin-ui-tabs-bulk.md), [tech/news.md](tech/news.md)
- **File Terdampak (4 file):**
  1. `models/postCategoryModel.js`
  2. `services/postCategoryService.js`
  3. `controllers/admin/postCategoryController.js`
  4. `routes/adminRoutes.js`
- **Langkah Kerja:**
  1. Tambahkan `findByIdsWithPostCount(ids)` dan `deleteMany(ids)` di `models/postCategoryModel.js` memakai transaksi DB (`UPDATE posts SET category_id = NULL WHERE category_id IN (...)` lalu `DELETE FROM post_categories WHERE id IN (...)`).
  2. Tambahkan `bulkDeletePostCategories(rawBody, deps = {})` di `services/postCategoryService.js` menggunakan `parseBulkIds`, hitung `affectedItemsCount`, jalankan transaksi `deleteMany`, dan panggil `invalidateSitemapCache()`.
  3. Tambahkan handler `bulkDestroy(req, res)` di `controllers/admin/postCategoryController.js` (JSON `200`/`400`/`404`/`500`).
  4. Daftarkan `POST /posts/bulk-delete` dan `POST /post-categories/bulk-delete` di `routes/adminRoutes.js` dengan middleware `requireAuth, roleMiddleware(['superadmin', 'admin', 'editor'])` tepat **sebelum** rute berparameter `/:id`.
- **Kontrak Data Eksplisit:** Endpoint `POST /admin/posts/bulk-delete` & `POST /admin/post-categories/bulk-delete` (RBAC `['superadmin', 'admin', 'editor']`, CSRF aktif); `200` `{ success: true, deletedCount, requestedCount, skippedIds, affectedItemsCount, message }`; `400`/`403`/`404`.
- **Referensi Pola:** `deletePostCategory` di `services/postCategoryService.js`, `postCategoryModel.delete` di `models/postCategoryModel.js`, rute T-47 di `routes/adminRoutes.js`.
- **Batasan Negatif:** Dilarang mengubah rute produk/inquiry, dilarang mengedit view EJS atau CSS.
- **Skill Relevan:** `api-and-interface-design`, `security-and-hardening`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && node --test tests/test-admin-batch3-services.js
  ```

---

### [OPEN] `T-462` `[Tier: Argon Medium]`: Kamus i18n Simetris & Modul Shared JS Bulk Select (`admin-bulk-delete.js`)
- **Modul Spek:** [prd/admin-ui-tabs-bulk.md](prd/admin-ui-tabs-bulk.md) (`FR-41`), [tech/admin-ui-tabs-bulk.md](tech/admin-ui-tabs-bulk.md)
- **File Terdampak (4 file):**
  1. `locales/id.json`
  2. `locales/en.json`
  3. `public/js/admin-bulk-delete.js` *(baru)*
  4. `views/partials/admin-footer.ejs`
- **Langkah Kerja:**
  1. Tambahkan namespace `admin_bulk` secara simetris 1:1 di `locales/id.json` dan `locales/en.json` untuk seluruh kunci label UI, aria-label, konfirmasi SweetAlert2, peringatan item terkait kategori, dan pesan sukses/error.
  2. Buat `public/js/admin-bulk-delete.js` (CSP-safe, tanpa inline handler, event delegation pada `[data-bulk-table]`):
     - Mengelola checkbox header `[data-bulk-select-all]` dalam 3 state (`unchecked`, `checked`, `indeterminate`) hanya terhadap baris yang **aktif tampil** (`row.style.display !== 'none' && !row.hidden && !row.querySelector('td[colspan]')`).
     - Menambahkan/menghapus class `.is-bulk-selected` pada `<tr>` terpilih dan menampilkan/menyembunyikan tombol kontekstual `[data-bulk-delete-btn]` (memakai `.adm-bulk-hidden` saat 0 terpilih, tampil dengan counter saat >= 1 terpilih).
     - Mendengarkan `admin:table-filtered` dan `admin:products-loaded` untuk **mereset seluruh centang & checkbox header otomatis**.
     - Saat tombol bulk delete diklik: kumpulkan ID dari baris aktif tampil, jumlahkan `data-bulk-related-count` bila ada dan tampilkan peringatan item terkait di `window.showAdminConfirm({ title, text, isDanger: true })`, kirim `fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ ids }) })`, kunci tombol `.is-loading`, tampilkan `window.adminToast`, lalu refresh (`window.reloadAdminProductsAfterBulkDelete()` untuk `fetch` atau `window.location.reload()` untuk `reload`).
  3. Muat `<script src="/js/admin-bulk-delete.js?v=1.0" defer></script>` di `views/partials/admin-footer.ejs`.
- **Kontrak Data Eksplisit:** Key i18n `admin_bulk.*` (`col_select`, `select_all`, `select_row`, `delete_selected`, `confirm_title`, `confirm_products`, `confirm_product_categories`, `confirm_posts`, `confirm_post_categories`, `confirm_related_products`, `confirm_related_posts`, `success_deleted`, `error_empty`, `error_failed`); atribut `data-bulk-*`; API `window.AdminBulkSelect.reset(container)` & `.sync(container)`.
- **Referensi Pola:** `window.showAdminConfirm` & `adminToast` di `public/js/admin.js`, pola modul di `public/js/pagination.js`.
- **Batasan Negatif:** Dilarang menyentuh file backend/CSS/EJS halaman tabel di task ini; dilarang memakai `innerHTML` dengan data mentah.
- **Skill Relevan:** `frontend-ui-engineering`, `antislop-human`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && npm run lint:views && npm run lint:i18n
  ```

---

### [OPEN] `T-463` `[Tier: Argon Medium]`: Integrasi Markup Bulk Delete & Sinkronisasi Paginasi Katalog Produk & Kategori Produk
- **Modul Spek:** [prd/admin-ui-tabs-bulk.md](prd/admin-ui-tabs-bulk.md) (`FR-42`), [tech/admin-products-rfq.md](tech/admin-products-rfq.md)
- **File Terdampak (4 file):**
  1. `views/admin/products/index.ejs`
  2. `views/admin/products/partials/table-rows.ejs`
  3. `views/admin/product-categories/index.ejs`
  4. `public/js/admin-products.js`
- **Langkah Kerja:**
  1. Pada `views/admin/products/index.ejs`: tambahkan `data-bulk-table="products" data-bulk-endpoint="/admin/products/bulk-delete" data-bulk-mode="fetch"` pada `.table-card`, sisipkan tombol kontekstual `.adm-btn.adm-btn-danger.adm-btn-sm.adm-bulk-delete-btn.adm-bulk-hidden` di `.table-toolbar`, dan tambahkan `th.adm-bulk-col` checkbox "Pilih Semua" di kolom paling kiri `<thead>`.
  2. Pada `views/admin/products/partials/table-rows.ejs`: tambahkan `td.adm-bulk-col` berisi checkbox baris (`data-bulk-id="<%= p.id %>"`, `aria-label` deskriptif) di kolom paling kiri tiap `<tr>`, dan perbarui state kosong dari `colspan="5"` menjadi `colspan="6"`.
  3. Pada `views/admin/product-categories/index.ejs`: tambahkan `data-bulk-table="product-categories" data-bulk-endpoint="/admin/product-categories/bulk-delete" data-bulk-mode="reload"`, tombol bulk delete kontekstual (`.adm-bulk-hidden`) di `.table-toolbar`, kolom checkbox paling kiri pada `<thead>` & `<tbody>` (menyertakan `data-bulk-related-count="<%= cat.product_count || 0 %>"`), dan perbarui state kosong dari `colspan="7"` menjadi `colspan="8"`.
  4. Pada `public/js/admin-products.js`: pancarkan `document.dispatchEvent(new CustomEvent('admin:products-loaded'))` setelah `tbody.innerHTML = data.rowsHtml` di `loadProducts()`, serta sediakan `window.reloadAdminProductsAfterBulkDelete()` yang memuat ulang URL aktif via `loadProducts()` (menjaga mundur halaman otomatis saat halaman ujung kosong).
- **Kontrak Data Eksplisit:** Gunakan `t('admin_bulk.*')` pada seluruh label/aria-label/konfirmasi; zero inline `style="..."`, zero inline handler.
- **Referensi Pola:** `views/admin/products/index.ejs`, `views/admin/products/partials/table-rows.ejs`, `loadProducts` di `public/js/admin-products.js`.
- **Batasan Negatif:** Dilarang mengubah tombol hapus satuan per baris, dilarang menyentuh modul berita/post atau CSS di task ini.
- **Skill Relevan:** `frontend-ui-engineering`, `antislop-human`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && npm run lint:views && npm run lint:i18n
  ```

---

### [OPEN] `T-464` `[Tier: Argon Medium]`: Integrasi Markup Bulk Delete & Sinkronisasi Live Search Berita & Kategori Berita
- **Modul Spek:** [prd/admin-ui-tabs-bulk.md](prd/admin-ui-tabs-bulk.md) (`FR-42`), [tech/admin-ui-tabs-bulk.md](tech/admin-ui-tabs-bulk.md)
- **File Terdampak (3 file):**
  1. `views/admin/posts/index.ejs`
  2. `views/admin/post-categories/index.ejs`
  3. `public/js/admin.js`
- **Langkah Kerja:**
  1. Pada `views/admin/posts/index.ejs`: tambahkan `data-bulk-table="posts" data-bulk-endpoint="/admin/posts/bulk-delete" data-bulk-mode="reload"` pada `.table-card`, bungkus sisi kanan `.table-toolbar` bersama tombol kontekstual `.adm-btn.adm-btn-danger.adm-btn-sm.adm-bulk-delete-btn.adm-bulk-hidden` dan `#liveSearchInput`, tambahkan kolom checkbox paling kiri pada `<thead>` & `<tbody>` (`data-bulk-id="<%= post.id %>"`), dan perbarui state kosong dari `colspan="7"` menjadi `colspan="8"`.
  2. Pada `views/admin/post-categories/index.ejs`: tambahkan `data-bulk-table="post-categories" data-bulk-endpoint="/admin/post-categories/bulk-delete" data-bulk-mode="reload"` pada `.table-card`, tambahkan tombol kontekstual `.adm-btn.adm-btn-danger.adm-btn-sm.adm-bulk-delete-btn.adm-bulk-hidden` di `.table-toolbar`, tambahkan kolom checkbox paling kiri pada `<thead>` & `<tbody>` (`data-bulk-id="<%= cat.id %>"` + `data-bulk-related-count="<%= cat.post_count || 0 %>"`), dan perbarui state kosong dari `colspan="7"` menjadi `colspan="8"`.
  3. Pada `public/js/admin.js`: di akhir `filterRows()`, pancarkan `document.dispatchEvent(new CustomEvent('admin:table-filtered'))` agar perubahan `#liveSearchInput` langsung mereset seleksi otomatis dan menyinkronkan checkbox header.
- **Kontrak Data Eksplisit:** Gunakan `t('admin_bulk.*')` pada seluruh label/aria-label/konfirmasi; zero inline `style="..."` dan zero inline handler.
- **Referensi Pola:** `filterRows()` di `public/js/admin.js`, `views/admin/posts/index.ejs`, `views/admin/post-categories/index.ejs`.
- **Batasan Negatif:** Dilarang mengubah modal, sidebar, atau SweetAlert2 interceptor existing di `public/js/admin.js`; dilarang menyentuh halaman publik `/news`.
- **Skill Relevan:** `frontend-ui-engineering`, `antislop-human`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && npm run lint:views && npm run lint:i18n
  ```

---

### [OPEN] `T-465` `[Tier: Argon Medium]`: Styling CSS Bulk Checkbox, Baris Terpilih & Toolbar Anti-Overflow Responsif
- **Modul Spek:** [tech/admin-ui-tabs-bulk.md](tech/admin-ui-tabs-bulk.md), [tech/admin-ui-css.md](tech/admin-ui-css.md)
- **File Terdampak (3 file):**
  1. `public/css/admin/tables-badges.css`
  2. `public/css/admin/page-catalog.css`
  3. `public/css/admin/responsive-viewport.css`
- **Langkah Kerja:**
  1. Tambahkan aturan komponen `.adm-bulk-*` di `public/css/admin/tables-badges.css`: `.adm-bulk-col` (`width: 40px; min-width: 40px; text-align: center; padding-left: 12px; padding-right: 6px;`), `.adm-bulk-check` (`accent-color: var(--primary)`, `17px x 17px`, `cursor: pointer`, border kontras >= 3:1 via `var(--text-muted)`, `:focus-visible` dengan `outline: 2px solid var(--primary)` + `var(--focus-ring)`), `tr.is-bulk-selected` (`background-color: var(--primary-subtle)`), `.adm-bulk-toolbar-group`, `.adm-bulk-delete-btn`, `.adm-bulk-hidden` (`display: none`).
  2. Rapikan tata letak `.table-toolbar` dan `.adm-prod-toolbar-left` di `public/css/admin/page-catalog.css` & `tables-badges.css` agar judul, dropdown kategori, tab filter *growing underline*, kotak pencarian, dan tombol bulk delete kontekstual reflow rapi (`flex-wrap: wrap`, `min-width: 0`, `gap: 8px-10px`) tanpa saling menimpa teks pada `1024px`, `1280px`, `1440px`, dan zoom `125%`.
  3. Tambahkan aturan responsif di `public/css/admin/responsive-viewport.css`: target sentuh checkbox wrapper minimal `44x44px` di `@media (pointer: coarse), (max-width: 768px)`, tombol bulk delete rapi pada `<= 480px`, serta `overflow-x: auto` terkontrol pada `.table-scroll-wrapper` di `320px-768px` agar 0 page-level horizontal overflow.
- **Kontrak Data / Class CSS:** Prefix unik `.adm-bulk-*` + `is-bulk-selected`; zero raw hex, 0 duplikat selector, batas `<= 600` baris per berkas.
- **Referensi Pola:** `public/css/admin/tables-badges.css`, `public/css/admin/buttons.css`, `public/css/admin/pagination.css`.
- **Batasan Negatif:** Dilarang menyentuh `public/css/admin/tokens.css`, CSS publik, atau menambah berkas CSS ke-22 kecuali `tables-badges.css` terancam melewati 600 baris (berhenti dan laporkan ke Azis bila terjadi).
- **Skill Relevan:** `antislop-ui`, `antislop-layoutmobile`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && npm run lint:views && node --test tests/test-admin-css-modular.js
  ```

---

### [OPEN] `T-466` `[Tier: Argon Medium]`: Unit & HTTP Integration Test Bulk Delete (4 Service, Helper, RBAC & CSRF)
- **Modul Spek:** [tech/admin-ui-tabs-bulk.md](tech/admin-ui-tabs-bulk.md)
- **File Terdampak (2 file):**
  1. `tests/test-admin-bulk-delete-services.js` *(baru)*
  2. `tests/test-admin-bulk-delete-http.js` *(baru)*
- **Langkah Kerja:**
  1. Buat unit test `tests/test-admin-bulk-delete-services.js` (`node:test` + DI `deps`) yang memverifikasi `parseBulkIds` (kosong, non-array, <=0, desimal, string huruf, duplikat, >100), `bulkDeleteAdminProducts` (storage cleanup + sitemap), `bulkDeleteProductCategories` & `bulkDeletePostCategories` (`category_id = NULL` + `affectedItemsCount` + sitemap), dan `bulkDeleteAdminPosts` (`slug_redirects` + cover storage + sitemap).
  2. Buat tes integrasi HTTP `tests/test-admin-bulk-delete-http.js` yang memverifikasi penolakan CSRF `403`, RBAC `editor` (`403` pada produk/kategori produk, diizinkan pada berita/kategori berita), dan validasi payload `400`.
- **Kontrak Data Eksplisit:** Assert HTTP `200`/`400`/`403`/`404` dan struktur body `{ success, deletedCount, requestedCount, skippedIds, affectedItemsCount?, message }`.
- **Referensi Pola:** `tests/test-admin-batch2-services.js`, `tests/test-admin-batch3-services.js`, `tests/test-admin-http.js`.
- **Batasan Negatif:** Dilarang memodifikasi data produksi/seed permanen tanpa cleanup; dilarang men-skip test.
- **Skill Relevan:** `test-driven-development`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && node --test tests/test-admin-bulk-delete-services.js tests/test-admin-bulk-delete-http.js
  ```

---

### [OPEN] `T-467` `[Tier: Argon Medium]`: QA E2E & Visual Playwright (Tabs Growing Underline + Bulk Delete 4 Modul + Regresi 16 Rute Admin)
- **Modul Spek:** [prd/admin-ui-tabs-bulk.md](prd/admin-ui-tabs-bulk.md), [tech/admin-ui-tabs-bulk.md](tech/admin-ui-tabs-bulk.md)
- **File Terdampak (1 file):**
  1. `tests/test-admin-tabs-bulk-delete-qa.js` *(baru)*
- **Langkah Kerja:**
  1. Buat skrip QA Playwright `tests/test-admin-tabs-bulk-delete-qa.js` yang memverifikasi:
     - **Tabs Growing Underline (semua 3 jenis tab):** warna underline token `--primary` (nol biru), font >= 13px, `transform-origin: center` & `::after` aktif di `/admin/products`, `/admin/posts`, `/admin/about`, `/admin/home-content`, dan modal `#universalMediaPickerModal`, `prefers-reduced-motion: reduce`, serta mobile `320px-768px` target sentuh >= 44px tanpa terpotong.
     - **Bulk Delete 4 Modul (data dummy `QA-BULK-*` dibersihkan pada `finally`):** visibilitas kontekstual tombol bulk delete, checkbox header 3 state, sinkronisasi `#liveSearchInput` di `/admin/posts`, sinkronisasi filter & paginasi Fetch `.pgn-*` di `/admin/products` (termasuk reset seleksi & mundur halaman otomatis), konfirmasi SweetAlert2 (termasuk peringatan item terkait pada kategori), dan toast sukses.
     - **Anti-Overflow & Zero Collision:** cek bounding-box toolbar (0 tumpang tindih), 0 console error, 0 horizontal page overflow pada `320px`, `375px`, `768px`, `1024px`, `1280px`, `1440px`, dan zoom `125%`.
  2. Jalankan juga regresi CSS modular & visual 16 rute admin (`tests/test-admin-css-modular.js`, `tests/test-admin-css-visual-qa.js`) + gerbang lint penuh.
- **Kontrak Data Eksplisit:** Seluruh record dummy memakai prefix `QA-BULK-` dan dibersihkan di blok `finally`.
- **Referensi Pola:** `tests/test-admin-css-visual-qa.js`, `tests/test-admin-css-modular.js`.
- **Batasan Negatif:** Dilarang menyentuh kode aplikasi kecuali melaporkan bug bila ditemukan; dilarang meninggalkan data dummy di database lokal.
- **Skill Relevan:** `browser-testing-with-devtools`, `antislop-layoutmobile`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && npm run lint:views && npm run lint:i18n && node --test tests/test-admin-css-modular.js && node tests/test-admin-tabs-bulk-delete-qa.js && node tests/test-admin-css-visual-qa.js
  ```
