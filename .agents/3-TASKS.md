# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 7 Task (T-356 s/d T-362)
- **Total Task Selesai:** 355 Task (T-01 s/d T-355)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-356**.

---

## Task Aktif / Terbuka (Open Tasks)

> **Sumber Proposal:** [changes/2026-11-19_refactor-admin-controllers-batch-2.md](changes/2026-11-19_refactor-admin-controllers-batch-2.md)

### [ ] T-356 — Refaktor `productController.js` & Lapisan Service Produk
- **Modul:** Admin Products & RFQ
- **Prioritas:** High | **Dependensi:** - | **Skill:** `antislop-code`
- **Deskripsi:** Memindahkan seluruh orkestrasi CRUD, query `productModel`/`productCategoryModel`, pemrosesan upload WebP & penghapusan `storage` lama, invalidasi sitemap, ekspor CSV, serta pengambilan kolom tabel ukuran (`getSizeTableColumns`) dari `controllers/admin/productController.js` ke `services/productCrudService.js`. Menambahkan guard `NaN` pada `sort_order` di `services/productService.js` dan guard `not_found` pada `destroy` di `services/productCrudService.js`. Mempertahankan kontrak SSR + Fetch JSON pagination (`renderAsyncAppView`), format respons error/redirect, dan re-export `parseDynamicSizeTable`, `parseSizeTable`, `getProductsWithSizeTable` di `productController.js`.
- **File Terdampak:** `controllers/admin/productController.js`, `services/productCrudService.js`, `services/productService.js`, `services/productSizeTableService.js`
- **Acceptance Criteria:**
  - [ ] `controllers/admin/productController.js` tidak lagi mengimpor `productModel`, `productCategoryModel`, `processAndSaveWebP`, `storage`, maupun `invalidateSitemapCache`.
  - [ ] Re-export `parseDynamicSizeTable`, `parseSizeTable`, `getProductsWithSizeTable` serta properti `productController.getProductsWithSizeTable` tetap tersedia tanpa memutus pemanggil/test eksisting.
  - [ ] `services/productService.js` menerapkan guard `NaN` pada `sort_order` (fallback `0` saat create, fallback nilai eksisting saat update), dan `services/productCrudService.js` menangani `not_found` pada `destroy` (404 JSON untuk Fetch/AJAX, redirect `?error=` untuk SSR).
  - [ ] Seluruh endpoint (`/admin/products`, `/admin/products/export`, `/admin/products/create`, `/admin/products/:id/size-table-columns`, `/admin/products/:id/edit`, `store`, `update`, `destroy`) mempertahankan kontrak SSR, Fetch JSON pagination, CSV export, upload WebP, dan sitemap invalidation.
  - [ ] Seluruh file terdampak memenuhi `max-lines <= 300`, `max-lines-per-function <= 40`, `max-depth <= 2`, `complexity <= 8`, bebas komentar AI-slop, dan bebas warning ESLint.
- **Verifikasi:** `npx eslint controllers/admin/productController.js services/productService.js services/productSizeTableService.js services/productCrudService.js` + test produk eksisting.

### [ ] T-357 — Refaktor `productCategoryController.js` ke `services/productCategoryService.js`
- **Modul:** Admin CMS & Users
- **Prioritas:** High | **Dependensi:** - | **Skill:** `antislop-code`
- **Deskripsi:** Mengekstrak helper slug bersama `utils/slugHelper.js` bebas warning `no-useless-escape` serta membuat `services/productCategoryService.js` untuk menampung normalisasi payload (`name_id`, `name_en`, `slug`, `description_*`, `sort_order` dengan guard `NaN`, `is_active`), validasi wajib isi, dan pemanggilan `productCategoryModel` (`findAll`, `create`, `findById`, `update`, `toggleActive`, `delete` dengan guard `not_found`) dalam hasil terstruktur `{ status, ... }`. Merampingkan `controllers/admin/productCategoryController.js` menjadi HTTP handler murni.
- **File Terdampak:** `controllers/admin/productCategoryController.js`, `services/productCategoryService.js`, `utils/slugHelper.js`
- **Acceptance Criteria:**
  - [ ] `controllers/admin/productCategoryController.js` tidak lagi mengimpor `productCategoryModel` dan hanya mendelegasikan ke `services/productCategoryService.js`.
  - [ ] `utils/slugHelper.js` dibuat untuk pemakaian bersama kategori produk & berita dan bebas warning `no-useless-escape`.
  - [ ] `services/productCategoryService.js` menerapkan guard `NaN` pada `sort_order` serta guard `not_found` pada `destroy` (mengembalikan `{ status: 'not_found', error }` -> redirect `?error=`).
  - [ ] Kontrak SSR, redirect `success`/`error`, HTTP 400 saat `name_id` kosong, dan toggle status aktif tetap identik.
  - [ ] Semua file memenuhi metrik `tech/conventions.md` (`max-lines <= 300`, `max-lines-per-function <= 40`, `max-depth <= 2`, `complexity <= 8`) dan bersih dari komentar AI-slop.
- **Verifikasi:** `npx eslint controllers/admin/productCategoryController.js services/productCategoryService.js utils/slugHelper.js`.

### [ ] T-358 — Refaktor `leadController.js` ke `services/leadService.js`
- **Modul:** Admin CMS & Users
- **Prioritas:** High | **Dependensi:** - | **Skill:** `antislop-code`
- **Deskripsi:** Membuat `services/leadService.js` (mengikuti pola `services/inquiryService.js`) untuk menampung normalisasi filter beserta hardening whitelist `status` (`['baru', 'diproses', 'selesai', 'ditolak']`) dan `type` (selaras nilai valid `leadModel.js`/DB) pada filter `index`, validasi whitelist status pada `updateStatus`, pemanggilan `leadModel` (`findAll`, `updateStatus`, `exportAll`), serta konfigurasi kolom & nama file CSV (`leads-pt-euodoo-YYYY-MM-DD.csv`). Merampingkan `controllers/admin/leadController.js`, menurunkan `max-depth` di `updateStatus` menjadi <= 2 dengan helper respons AJAX/SSR, dan menghapus 3 komentar JSDoc generik.
- **File Terdampak:** `controllers/admin/leadController.js`, `services/leadService.js`
- **Acceptance Criteria:**
  - [ ] `controllers/admin/leadController.js` tidak lagi mengimpor `leadModel` dan bebas komentar JSDoc generik (`antislop-code`).
  - [ ] `services/leadService.js` menormalkan parameter filter `status` (`['baru', 'diproses', 'selesai', 'ditolak']`) dan `type` (selaras nilai valid `leadModel.js`/DB) di `index` ke `null` jika di luar whitelist.
  - [ ] `updateStatus` memiliki `max-depth <= 2` dan mempertahankan kontrak respons JSON (`{ success, message, status, id }`) serta redirect SSR untuk status valid, HTTP 400 status tidak valid, dan HTTP 500 error.
  - [ ] `exportCsv` menggunakan payload `{ filename, columns, leads }` dari `leadService` dan mengirim respons via `sendCsvResponse`.
  - [ ] Kedua file lolos metrik `tech/conventions.md` tanpa warning/error.
- **Verifikasi:** `npx eslint controllers/admin/leadController.js services/leadService.js`.

### [ ] T-359 — Refaktor `postController.js` ke `services/postService.js`
- **Modul:** News & Articles
- **Prioritas:** High | **Dependensi:** - | **Skill:** `antislop-code`
- **Deskripsi:** Membuat `services/postService.js` untuk menampung orkestrasi daftar & kategori, validasi judul dan format/keunikan slug artikel dengan `formatSlug` ketat terisolasi (tidak memakai `utils/slugHelper.js`), sanitasi HTML TinyMCE (`sanitizeArticleHtml`), pemrosesan upload/hapus cover WebP, pencatatan/pembersihan `slugRedirectModel`, guard `not_found` pada `destroy`, invalidasi sitemap, serta validasi MIME & pemrosesan `uploadEditorImage`. Memecah logika `store` dan `update` menjadi fungsi helper modular (`<= 40` baris, `max-depth <= 2`, `complexity <= 8`) dan merampingkan `controllers/admin/postController.js` (`<= 300` baris).
- **File Terdampak:** `controllers/admin/postController.js`, `services/postService.js`
- **Acceptance Criteria:**
  - [ ] `controllers/admin/postController.js` tidak lagi mengimpor `postModel`, `postCategoryModel`, `slugRedirectModel`, `processAndSaveWebP`, `storage`, `invalidateSitemapCache`, maupun `sanitizeArticleHtml`.
  - [ ] `services/postService.js` tetap mempertahankan helper `formatSlug` ketat khusus artikel (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) terpisah dari `utils/slugHelper.js`, serta `destroy` memeriksa keberadaan artikel (`not_found` -> redirect `?error=`) sebelum menghapus storage, redirect, dan post.
  - [ ] Seluruh perilaku kritis terjaga: cek duplikasi slug, pembuatan redirect 301 saat slug berubah di `update`, penghapusan redirect saat `destroy`, sanitasi HTML TinyMCE, upload cover WebP (1200x800 q80) & TinyMCE `uploadEditorImage` (1600x1600 q82, return `{ location }`), serta `invalidateSitemapCache()`.
  - [ ] Warning `no-useless-escape` pada `formatSlug` dan komentar inline AI-slop pada `uploadEditorImage` dibersihkan.
  - [ ] Baik `controllers/admin/postController.js` maupun `services/postService.js` memenuhi seluruh metrik `tech/conventions.md` (`max-lines <= 300`, `max-lines-per-function <= 40`, `max-depth <= 2`, `complexity <= 8`).
- **Verifikasi:** `npx eslint controllers/admin/postController.js services/postService.js`.

### [ ] T-360 — Refaktor `postCategoryController.js` ke `services/postCategoryService.js`
- **Modul:** News & Articles
- **Prioritas:** High | **Dependensi:** T-357 | **Skill:** `antislop-code`
- **Deskripsi:** Membuat `services/postCategoryService.js` yang memanfaatkan `utils/slugHelper.js` untuk menampung normalisasi payload (`name_id`, `name_en`, `slug`, `type`, `sort_order` dengan guard `NaN`), hardening whitelist `type` (selaras nilai valid `postCategoryModel.js`/DB) pada `index`/`store`/`update`, validasi wajib isi, serta pemanggilan `postCategoryModel` (termasuk guard `not_found` pada `destroy`). Merampingkan `controllers/admin/postCategoryController.js` serta menyeragamkan pengiriman `csrfToken: res.locals.csrfToken || ''` pada `res.render` agar konsisten dengan controller admin lain.
- **File Terdampak:** `controllers/admin/postCategoryController.js`, `services/postCategoryService.js`, `utils/slugHelper.js`
- **Acceptance Criteria:**
  - [ ] `controllers/admin/postCategoryController.js` tidak lagi mengimpor `postCategoryModel` dan bebas warning `no-useless-escape`.
  - [ ] `services/postCategoryService.js` menggunakan `utils/slugHelper.js`, menerapkan guard `NaN` pada `sort_order`, hardening whitelist `type` (selaras nilai valid `postCategoryModel.js`/DB) pada `index`/`store`/`update`, serta guard `not_found` pada `destroy`.
  - [ ] Kontrak rute `/admin/post-categories` (`index`, `createView`, `store`, `editView`, `update`, `destroy`) dan pengiriman `csrfToken` ke view konsisten tanpa regresi.
  - [ ] Semua file memenuhi seluruh metrik `tech/conventions.md` dan bersih dari komentar AI-slop.
- **Verifikasi:** `npx eslint controllers/admin/postCategoryController.js services/postCategoryService.js utils/slugHelper.js`.

### [ ] T-361 — Penegakan ESLint Ketat & Pembaruan Dokumentasi Spek Modul
- **Modul:** Code Conventions & Standards, Admin CMS, Admin Products & RFQ, News & Articles
- **Prioritas:** High | **Dependensi:** T-356, T-357, T-358, T-359, T-360 | **Skill:** `antislop-code`
- **Deskripsi:** Mendaftarkan 5 controller Batch 2, 7 service terkait (`services/productService.js`, `services/productSizeTableService.js`, `services/productCrudService.js`, `services/productCategoryService.js`, `services/leadService.js`, `services/postService.js`, `services/postCategoryService.js`), dan `utils/slugHelper.js` ke blok strict `error` di `eslint.config.js`, lalu memperbarui dokumentasi modul tech terkait (selama implementasi bertanda `[PENDING T-361]`, dibersihkan saat Close).
- **File Terdampak:** `eslint.config.js`, `.agents/tech/conventions.md`, `.agents/tech/admin-cms.md`, `.agents/tech/admin-products-rfq.md`, `.agents/tech/news.md`
- **Acceptance Criteria:**
  - [ ] Seluruh 5 controller, 7 berkas service (`productService.js`, `productSizeTableService.js`, `productCrudService.js`, `productCategoryService.js`, `leadService.js`, `postService.js`, `postCategoryService.js`), dan `utils/slugHelper.js` terdaftar di blok strict `error` pada `eslint.config.js`.
  - [ ] `npm run lint` menghasilkan 0 error dan 0 warning pada seluruh berkas yang didaftarkan.
  - [ ] Dokumentasi 4 modul `tech/` diperbarui di tempat (*current state only*, tanpa nilai hex, tanpa bagian "Revisi vN") dan seluruh berkas tetap <= ~8KB.
- **Verifikasi:** `npm run lint` + `wc -c` pada berkas `.agents/tech/*.md` dan `wc -l .agents/INDEX.md`.

### [ ] T-362 — Verifikasi Regresi, Gerbang Kualitas CI & Unit Test Service
- **Modul:** Cross-module Verification
- **Prioritas:** High | **Dependensi:** T-361 | **Skill:** `antislop-code`
- **Deskripsi:** Membuat suite unit test terisolasi berbasis mock model/storage (tanpa ketergantungan DB) di `tests/` untuk ke-5 modul service hasil refaktor, menjalankan seluruh gerbang kualitas CI (`npm run lint`, `npm run lint:views`, `npm run lint:i18n`, unit test eksisting dan unit test baru), serta memverifikasi regresi rute & form admin terkait.
- **File Terdampak:** `tests/test-admin-batch2-services.js` *(atau per-service sesuai konvensi `tests/`)*
- **Acceptance Criteria:**
  - [ ] Tersedia suite unit test terisolasi (mock model/storage, tanpa DB) untuk ke-5 modul service hasil refaktor yang menguji validasi wajib isi, guard `NaN` `sort_order`, whitelist `status`/`type`, guard `not_found`, slug 301 redirect, sanitasi HTML TinyMCE, upload WebP/MIME, dan CSV export.
  - [ ] `npm run lint`, `npm run lint:views`, dan `npm run lint:i18n` hijau tanpa error.
  - [ ] Seluruh unit test eksisting beserta unit test service baru lulus 100%.
  - [ ] Verifikasi regresi rute `/admin/products`, `/admin/product-categories`, `/admin/leads`, `/admin/posts`, `/admin/post-categories` (termasuk Fetch JSON pagination, CSV export, slug 301 redirect, dan upload gambar TinyMCE) bebas error server/konsol.
  - [ ] Tidak ada perubahan pada homepage, view EJS, CSS, maupun skema/data database.
- **Verifikasi:** `npm run lint && npm run lint:views && npm run lint:i18n` + eksekusi unit test service baru & suite test eksisting + uji regresi rute admin.
