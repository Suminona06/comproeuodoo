# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 14 Task (T-284 s/d T-293)
- **Total Task Selesai:** 279 Task (T-01 s/d T-283)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-294**.

---

## Task Aktif / Terbuka (Open Tasks)

> [!IMPORTANT]
> **Aturan Wajib Tangkapan Layar Playwright (QA & Visual Regression):**
> DILARANG MENYIMPAN berkas screenshot Playwright (`.png`) di dalam direktori proyek (`tests/screenshots/` atau subfolder lainnya). Repositori proyek harus tetap bersih dan ringan. Seluruh tangkapan layar Playwright WAJIB disimpan di direktori brain Antigravity (`~/.gemini/antigravity/brain/<conversation-id>/screenshots/<batch>/`), dapat diakses via `process.env.ANTIGRAVITY_BRAIN_DIR` atau path absolut brain yang aktif.


### T-277: Refaktor View Admin Batch 1 - Auth & Error (403, Login, Change Password) [DONE]
- **Deskripsi**: Merefaktor berkas view admin auth dan error (`views/admin/403.ejs`, `views/admin/login.ejs`, `views/admin/change-password.ejs`) agar patuh `tech/conventions.md`: eliminasi 27 style inline, 6 warna hex mentah, 1 tag `<script>` inline, dan 1 komentar HTML. Style diekstraksi ke class berprefix `.err403-*`, `.adm-login-*`, dan `.chpwd-*` di `public/css/admin.css`. Script inline fallback logo login dipindahkan ke `public/js/admin-login.js`. Bersihkan komentar tak perlu dan hex lama pada CSS/JS terkait sesuai Keputusan 1 Opsi B.
- **Acceptance Criteria**:
  - [x] 0 error & 0 warning pada `node scripts/lint-views.js --strict views/admin/403.ejs,views/admin/login.ejs,views/admin/change-password.ejs`.
  - [x] `npm run lint` hijau (0 error).
  - [x] Test suites eksisting lulus (`npm run test:storage && npm run test:security && npm run test:cms`).
  - [x] Bukti perbandingan visual Playwright sebelum vs sesudah identik pada resolusi mobile (375px), tablet (768px), laptop (1280px), dan desktop (1440px) (screenshot disimpan di brain Antigravity, bukan di proyek).
  - [x] Fungsionalitas login, validasi CSRF, feedback error kredensial, fallback logo, dan submit form ganti password berfungsi normal tanpa error konsol.
  - [x] Berkas `views/admin/403.ejs`, `views/admin/login.ejs`, dan `views/admin/change-password.ejs` ditambahkan ke `DEFAULT_STRICT_PATHS` pada `scripts/lint-views.js`.
- **File Terdampak**: `views/admin/403.ejs`, `views/admin/login.ejs`, `views/admin/change-password.ejs`, `public/css/admin.css`, `public/js/admin-login.js`, `scripts/lint-views.js`, `tests/test-t277-auth-views-refactor-qa.js`
- **Skill**: `antislop-code` + `frontend-ui-engineering` + `test-driven-development`
- **Verifikasi**: `node tests/test-t277-auth-views-refactor-qa.js` (6/6 gerbang kualitas lulus murni). Selesai 2026-11-03.

### T-278: Refaktor View Admin Batch 2 - Kategori Produk (Product Categories) [DONE]
- **Deskripsi**: Merefaktor berkas modul kategori produk (`views/admin/product-categories/` `index.ejs`, `create.ejs`, `edit.ejs`): eliminasi 12 style inline dan ekstraksi ke class berprefix `.adm-pcat-*` di `public/css/admin.css`. Pertahankan integrasi dropdown `.eu-dd-*` dan tombol `.adm-btn-*`. Bersihkan komentar dan hex lama terkait di CSS/JS.
- **Acceptance Criteria**:
  - [x] 0 error & 0 warning pada `node scripts/lint-views.js views/admin/product-categories/`.
  - [x] `npm run lint` hijau (0 error).
  - [x] Test suites eksisting lulus (`npm run test:storage && npm run test:security && npm run test:cms`).
  - [x] Bukti perbandingan visual Playwright sebelum vs sesudah identik lintas 4 resolusi admin (375px, 768px, 1280px, 1440px) (screenshot disimpan di brain Antigravity, bukan di proyek).
  - [x] CRUD kategori produk, validasi form, slug generate, dan redirect berfungsi lancar tanpa error konsol.
  - [x] Path `views/admin/product-categories/` ditambahkan ke `DEFAULT_STRICT_PATHS` pada `scripts/lint-views.js`.
- **File Terdampak**: `views/admin/product-categories/index.ejs`, `views/admin/product-categories/create.ejs`, `views/admin/product-categories/edit.ejs`, `public/css/admin.css`, `scripts/lint-views.js`, `tests/test-t278-product-categories-views-refactor-qa.js`
- **Skill**: `antislop-code` + `frontend-ui-engineering` + `test-driven-development`
- **Verifikasi**: `node tests/test-t278-product-categories-views-refactor-qa.js` (seluruh gerbang kualitas lulus 100%, 0 error konsol). Selesai 2026-11-03.

### T-279: Refaktor View Admin Batch 3 - Kategori Artikel (Post Categories) [DONE]
- **Deskripsi**: Merefaktor berkas modul kategori artikel (`views/admin/post-categories/` `index.ejs`, `create.ejs`, `edit.ejs`): eliminasi 10 style inline dan ekstraksi ke class berprefix `.adm-postcat-*` di `public/css/admin.css`. Bersihkan komentar dan hex lama terkait.
- **Acceptance Criteria**:
  - [x] 0 error & 0 warning pada `node scripts/lint-views.js views/admin/post-categories/`.
  - [x] `npm run lint` hijau (0 error).
  - [x] Test suites eksisting lulus (`npm run test:storage && npm run test:security && npm run test:cms`).
  - [x] Bukti perbandingan visual Playwright sebelum vs sesudah identik lintas 4 resolusi admin (375px, 768px, 1280px, 1440px) (screenshot disimpan di brain Antigravity, bukan di proyek).
  - [x] CRUD kategori artikel, edit slug, filter tabs, dan validasi form berfungsi normal tanpa error konsol.
  - [x] Path `views/admin/post-categories/` ditambahkan ke `DEFAULT_STRICT_PATHS` pada `scripts/lint-views.js`.
- **File Terdampak**: `views/admin/post-categories/index.ejs`, `views/admin/post-categories/create.ejs`, `views/admin/post-categories/edit.ejs`, `public/css/admin.css`, `scripts/lint-views.js`, `tests/test-t279-post-categories-views-refactor-qa.js`
- **Skill**: `antislop-code` + `frontend-ui-engineering` + `test-driven-development`
- **Verifikasi**: `node tests/test-t279-post-categories-views-refactor-qa.js` (seluruh gerbang kualitas lulus 100%, 0 error konsol). Selesai 2026-11-03.

### T-280: Refaktor View Admin Batch 4 - Manajemen Pengguna (Users) [DONE]
- **Deskripsi**: Merefaktor modul pengguna (`views/admin/users/` `index.ejs`, `create.ejs`, `edit.ejs`): eliminasi 10 style inline dan 1 warna hex `#fafbfc` pada box role superadmin. Ekstraksi ke class berprefix `.adm-usr-*` di `public/css/admin.css`. Bersihkan komentar dan hex lama terkait.
- **Acceptance Criteria**:
  - [x] 0 error & 0 warning pada `node scripts/lint-views.js views/admin/users/`.
  - [x] `npm run lint` hijau (0 error).
  - [x] Test suites eksisting lulus (`npm run test:storage && npm run test:security && npm run test:cms`).
  - [x] Bukti perbandingan visual Playwright sebelum vs sesudah identik lintas 4 resolusi admin (375px, 768px, 1280px, 1440px) (screenshot disimpan di brain Antigravity, bukan di proyek).
  - [x] Manajemen akun user, hak akses role RBAC, proteksi last superadmin, dan ganti role berfungsi normal tanpa error konsol.
  - [x] Path `views/admin/users/` ditambahkan ke `DEFAULT_STRICT_PATHS` pada `scripts/lint-views.js`.
- **File Terdampak**: `views/admin/users/index.ejs`, `views/admin/users/create.ejs`, `views/admin/users/edit.ejs`, `public/css/admin.css`, `scripts/lint-views.js`, `tests/test-t280-users-views-refactor-qa.js`
- **Skill**: `antislop-code` + `frontend-ui-engineering` + `test-driven-development`
- **Verifikasi**: `node tests/test-t280-users-views-refactor-qa.js` (seluruh gerbang kualitas lulus 100%, 0 error konsol). Selesai 2026-11-04.

### T-281: Refaktor View Admin Batch 5 - Merek Klien (Brands) [DONE]
- **Deskripsi**: Merefaktor modul merek (`views/admin/brands/` `index.ejs`, `create.ejs`, `edit.ejs`): eliminasi 29 style inline, 1 hex `#fafbfc`, dan 1 komentar HTML. Ekstraksi ke class berprefix `.adm-brd-*` di `public/css/admin.css`. Pindahkan box thumbnail brand ke class CSS komponen. Bersihkan komentar dan hex lama terkait.
- **Acceptance Criteria**:
  - [x] 0 error & 0 warning pada `node scripts/lint-views.js --strict views/admin/brands/`.
  - [x] `npm run lint` hijau (0 error).
  - [x] Test suites eksisting lulus (`npm run test:storage && npm run test:security && npm run test:cms`).
  - [x] Bukti perbandingan visual Playwright sebelum vs sesudah identik lintas resolusi admin (screenshot disimpan di brain Antigravity, bukan di proyek).
  - [x] Upload logo merek, drag sort / toggle aktif, update judul seksi beranda, dan hapus merek berfungsi normal tanpa error konsol.
  - [x] Path `views/admin/brands/` ditambahkan ke `DEFAULT_STRICT_PATHS` pada `scripts/lint-views.js`.
- **File Terdampak**: `views/admin/brands/index.ejs`, `views/admin/brands/create.ejs`, `views/admin/brands/edit.ejs`, `public/css/admin.css`, `scripts/lint-views.js`, `tests/test-t281-brands-views-refactor-qa.js`
- **Skill**: `antislop-code` + `frontend-ui-engineering` + `test-driven-development`
- **Verifikasi**: `node tests/test-t281-brands-views-refactor-qa.js` (seluruh gerbang kualitas lulus 100%, 0 error konsol). Selesai 2026-11-04.

### T-282: Refaktor View Admin Batch 6 - Kapabilitas Manufaktur & Kontak [DONE]
- **Deskripsi**: Merefaktor berkas `views/admin/capabilities/index.ejs` dan `views/admin/contact/index.ejs`: eliminasi 25 style inline, 5 hex (`#10b981`, `#00755a`, `#424753`, `#64748b`), dan 5 komentar HTML. Ekstraksi ke class berprefix `.adm-cap-*` dan `.adm-ctc-*` di `public/css/admin.css`. Bersihkan komentar dan hex lama terkait.
- **Acceptance Criteria**:
  - [x] 0 error & 0 warning pada `node scripts/lint-views.js --strict views/admin/capabilities/index.ejs,views/admin/contact/index.ejs`.
  - [x] `npm run lint` hijau (0 error).
  - [x] Test suites eksisting lulus (`npm run test:storage && npm run test:security && npm run test:cms`).
  - [x] Bukti perbandingan visual Playwright sebelum vs sesudah identik lintas resolusi admin (screenshot disimpan di brain Antigravity, bukan di proyek).
  - [x] Simpan jam operasional kerja, teks formulir inquiry, dan CRUD kapabilitas pabrik berfungsi lancar tanpa error konsol.
  - [x] Berkas `capabilities/index.ejs` dan `contact/index.ejs` ditambahkan ke `DEFAULT_STRICT_PATHS` pada `scripts/lint-views.js`.
- **File Terdampak**: `views/admin/capabilities/index.ejs`, `views/admin/contact/index.ejs`, `public/css/admin.css`, `scripts/lint-views.js`, `tests/test-t282-capabilities-contact-views-refactor-qa.js`
- **Skill**: `antislop-code` + `frontend-ui-engineering` + `test-driven-development`
- **Verifikasi**: `node tests/test-t282-capabilities-contact-views-refactor-qa.js` (seluruh gerbang kualitas lulus 100%, 0 error konsol). Selesai 2026-11-04.

### T-283: Refaktor View Admin Batch 7 - Hero Banners & WhatsApp Leads [DONE]
- **Deskripsi**: Merefaktor berkas `views/admin/hero-banners/index.ejs` dan `views/admin/leads/index.ejs`: eliminasi 39 style inline, 15 hex (termasuk `#475569`, `#16a34a`), dan 7 komentar HTML. Ekstraksi ke class berprefix `.adm-hbn-*` dan `.adm-leads-*` di `public/css/admin.css`. Bersihkan komentar dan hex lama terkait.
- **Acceptance Criteria**:
  - [x] 0 error & 0 warning pada `node scripts/lint-views.js --strict views/admin/hero-banners/index.ejs,views/admin/leads/index.ejs`.
  - [x] `npm run lint` hijau (0 error).
  - [x] Test suites eksisting lulus (`npm run test:storage && npm run test:security && npm run test:cms`).
  - [x] Bukti perbandingan visual Playwright sebelum vs sesudah identik lintas resolusi admin (screenshot disimpan di brain Antigravity, bukan di proyek).
  - [x] Mockup preview banner sub-halaman, upload overlay banner, pagination filter leads WA, dan export CSV leads berfungsi normal tanpa error konsol.
  - [x] Berkas `hero-banners/index.ejs` dan `leads/index.ejs` ditambahkan ke `DEFAULT_STRICT_PATHS` pada `scripts/lint-views.js`.
- **File Terdampak**: `views/admin/hero-banners/index.ejs`, `views/admin/leads/index.ejs`, `public/css/admin.css`, `scripts/lint-views.js`, `tests/test-t283-hero-banners-leads-views-refactor-qa.js`
- **Skill**: `antislop-code` + `frontend-ui-engineering` + `test-driven-development`
- **Verifikasi**: `node tests/test-t283-hero-banners-leads-views-refactor-qa.js` (seluruh gerbang kualitas lulus 100%, 0 error konsol). Selesai 2026-11-04.

### T-284: Refaktor View Admin Batch 8 - Pesan Masuk (Inquiries) [TODO]
- **Deskripsi**: Merefaktor modul pesan masuk (`views/admin/inquiries/` `index.ejs`, `detail.ejs`): eliminasi 40 style inline, 1 hex `#fafbfc`, 1 tag `<script>` inline, dan 4 komentar HTML. Ekstraksi style ke `.adm-inq-*` di `public/css/admin.css`. Pindahkan script modal quick review dan filter ke `public/js/admin-inquiries.js` dengan data transfer aman via JSON script block. Bersihkan komentar dan hex lama terkait.
- **Acceptance Criteria**:
  - [ ] 0 error & 0 warning pada `node scripts/lint-views.js --strict views/admin/inquiries/`.
  - [ ] `npm run lint` hijau (0 error).
  - [ ] Test suites eksisting lulus (`npm run test:storage && npm run test:security && npm run test:cms`).
  - [ ] Bukti perbandingan visual Playwright sebelum vs sesudah identik lintas resolusi admin (screenshot disimpan di brain Antigravity, bukan di proyek).
  - [ ] Tabel pesan, filter status, modal quick review, detail pesan, update status & catatan admin berfungsi normal tanpa error konsol.
  - [ ] Path `views/admin/inquiries/` ditambahkan ke `DEFAULT_STRICT_PATHS` pada `scripts/lint-views.js`.
- **File Terdampak**: `views/admin/inquiries/index.ejs`, `views/admin/inquiries/detail.ejs`, `public/css/admin.css`, `public/js/admin-inquiries.js`, `scripts/lint-views.js`
- **Skill**: `antislop-code` + `frontend-ui-engineering` + `test-driven-development`
- **Verifikasi**: Laporan gerbang kualitas (lint, tests, visual diff Playwright, browser console).

### T-285: Refaktor View Admin Batch 9 - Dashboard Admin [TODO]
- **Deskripsi**: Merefaktor berkas `views/admin/dashboard.ejs`: eliminasi 18 style inline, 1 hex `#fafbfc`, 1 tag `<script>` inline, dan 3 komentar HTML. Ekstraksi style metrik dan tabel ke class `.adm-dash-*` di `public/css/admin.css`. Pindahkan script slide-over inquiry ke `public/js/admin-dashboard.js`. Bersihkan komentar dan hex lama terkait.
- **Acceptance Criteria**:
  - [ ] 0 error & 0 warning pada `node scripts/lint-views.js --strict views/admin/dashboard.ejs`.
  - [ ] `npm run lint` hijau (0 error).
  - [ ] Test suites eksisting lulus (`npm run test:storage && npm run test:security && npm run test:cms`).
  - [ ] Bukti perbandingan visual Playwright sebelum vs sesudah identik lintas resolusi admin (screenshot disimpan di brain Antigravity, bukan di proyek).
  - [ ] Kartu ringkasan metrik, grafik/tabel RFQ terbaru, dan slide-over panel detail inquiry berfungsi lancar tanpa error konsol.
  - [ ] Berkas `views/admin/dashboard.ejs` ditambahkan ke `DEFAULT_STRICT_PATHS` pada `scripts/lint-views.js`.
- **File Terdampak**: `views/admin/dashboard.ejs`, `public/css/admin.css`, `public/js/admin-dashboard.js`, `scripts/lint-views.js`
- **Skill**: `antislop-code` + `frontend-ui-engineering` + `test-driven-development`
- **Verifikasi**: Laporan gerbang kualitas (lint, tests, visual diff Playwright, browser console).

### T-286: Refaktor View Admin Batch 10 - Admin Shell & Universal Partials [TODO]
- **Deskripsi**: Merefaktor partial shell admin (`views/partials/admin-header.ejs`, `views/partials/admin-footer.ejs`, `views/partials/media-picker-modal.ejs`): eliminasi 30 style inline, 18 hex, 1 script inline anti-FOUC sidebar, dan 26 komentar HTML. Ekstraksi ke class `.adm-shell-*` dan `.adm-picker-*` di `public/css/admin.css`. Script init sidebar dipindahkan ke `public/js/admin-header-init.js`. Bersihkan komentar dan hex lama terkait.
- **Acceptance Criteria**:
  - [ ] 0 error & 0 warning pada `node scripts/lint-views.js --strict views/partials/admin-header.ejs,views/partials/admin-footer.ejs,views/partials/media-picker-modal.ejs`.
  - [ ] `npm run lint` hijau (0 error).
  - [ ] Test suites eksisting lulus (`npm run test:storage && npm run test:security && npm run test:cms`).
  - [ ] Bukti perbandingan visual Playwright sebelum vs sesudah identik lintas resolusi admin bebas FOUC sidebar (screenshot disimpan di brain Antigravity, bukan di proyek).
  - [ ] Toggle collapse sidebar desktop, drawer menu mobile, flash alert, dan interaktivitas universal media picker modal berfungsi 100% tanpa error konsol.
  - [ ] Tiga berkas partials admin ditambahkan ke `DEFAULT_STRICT_PATHS` pada `scripts/lint-views.js`.
- **File Terdampak**: `views/partials/admin-header.ejs`, `views/partials/admin-footer.ejs`, `views/partials/media-picker-modal.ejs`, `public/css/admin.css`, `public/js/admin-header-init.js`, `scripts/lint-views.js`
- **Skill**: `antislop-code` + `frontend-ui-engineering` + `test-driven-development`
- **Verifikasi**: Laporan gerbang kualitas (lint, tests, visual diff Playwright, browser console).

### T-287: Refaktor View Admin Batch 11 - Media Library [TODO]
- **Deskripsi**: Merefaktor berkas `views/admin/media/index.ejs`: eliminasi 17 style inline, 3 hex (`#dc2626`, `#b45309`), 1 tag `<script>` inline, dan 3 komentar HTML. Ekstraksi ke class berprefix `.adm-media-*` di `public/css/admin.css`. Pindahkan fungsi preview YouTube ke `public/js/admin-media.js`. Bersihkan komentar dan hex lama terkait.
- **Acceptance Criteria**:
  - [ ] 0 error & 0 warning pada `node scripts/lint-views.js --strict views/admin/media/index.ejs`.
  - [ ] `npm run lint` hijau (0 error).
  - [ ] Test suites eksisting lulus (`npm run test:storage && npm run test:security && npm run test:cms`).
  - [ ] Bukti perbandingan visual Playwright sebelum vs sesudah identik lintas resolusi admin (screenshot disimpan di brain Antigravity, bukan di proyek).
  - [ ] Upload file media (gambar, video, PDF), integrasi YouTube video modal, filter tipe media, copy link, dan hapus berkas berfungsi lancar tanpa error konsol.
  - [ ] Berkas `views/admin/media/index.ejs` ditambahkan ke `DEFAULT_STRICT_PATHS` pada `scripts/lint-views.js`.
- **File Terdampak**: `views/admin/media/index.ejs`, `public/css/admin.css`, `public/js/admin-media.js`, `scripts/lint-views.js`
- **Skill**: `antislop-code` + `frontend-ui-engineering` + `test-driven-development`
- **Verifikasi**: Laporan gerbang kualitas (lint, tests, visual diff Playwright, browser console).

### T-288: Refaktor View Admin Batch 12 - Hero Banner Slider (Banners) [TODO]
- **Deskripsi**: Merefaktor modul hero banner (`views/admin/banners/` `index.ejs`, `create.ejs`, `edit.ejs`): eliminasi 65 style inline, 7 hex, 2 tag `<script>` inline, dan 10 komentar HTML. Ekstraksi ke class berprefix `.adm-banner-*` di `public/css/admin.css`. Pindahkan script switch sumber banner (upload/library/youtube) ke `public/js/admin-banners.js`. Bersihkan komentar dan hex lama terkait.
- **Acceptance Criteria**:
  - [ ] 0 error & 0 warning pada `node scripts/lint-views.js --strict views/admin/banners/`.
  - [ ] `npm run lint` hijau (0 error).
  - [ ] Test suites eksisting lulus (`npm run test:storage && npm run test:security && npm run test:cms`).
  - [ ] Bukti perbandingan visual Playwright sebelum vs sesudah identik lintas resolusi admin (screenshot disimpan di brain Antigravity, bukan di proyek).
  - [ ] Switch sumber media hero banner, pengaturan dual CTA button, preview banner, dan CRUD banner slider berfungsi lancar tanpa error konsol.
  - [ ] Path `views/admin/banners/` ditambahkan ke `DEFAULT_STRICT_PATHS` pada `scripts/lint-views.js`.
- **File Terdampak**: `views/admin/banners/index.ejs`, `views/admin/banners/create.ejs`, `views/admin/banners/edit.ejs`, `public/css/admin.css`, `public/js/admin-banners.js`, `scripts/lint-views.js`
- **Skill**: `antislop-code` + `frontend-ui-engineering` + `test-driven-development`
- **Verifikasi**: Laporan gerbang kualitas (lint, tests, visual diff Playwright, browser console).

### T-289: Refaktor View Admin Batch 13 - Artikel Berita & Blog (Posts) [TODO]
- **Deskripsi**: Merefaktor modul artikel (`views/admin/posts/` `index.ejs`, `create.ejs`, `edit.ejs`): eliminasi 30 style inline, 2 hex (`#fafbfc`, `#b45309`), 2 tag `<script>` inline, dan 6 komentar HTML. Ekstraksi ke class berprefix `.adm-post-*` di `public/css/admin.css`. Pindahkan script toggle baris jadwal tayang ke `public/js/admin-posts.js`. Konversi style dinamis media picker ke class semantik (`.adm-d-none` / `.adm-d-block`). Bersihkan komentar dan hex lama terkait.
- **Acceptance Criteria**:
  - [ ] 0 error & 0 warning pada `node scripts/lint-views.js --strict views/admin/posts/`.
  - [ ] `npm run lint` hijau (0 error).
  - [ ] Test suites eksisting lulus (`npm run test:storage && npm run test:security && npm run test:cms`).
  - [ ] Bukti perbandingan visual Playwright sebelum vs sesudah identik lintas resolusi admin (screenshot disimpan di brain Antigravity, bukan di proyek).
  - [ ] Integrasi TinyMCE editor, publish/draft/schedule artikel, upload sampul via media picker, dan SEO meta tags berfungsi normal tanpa error konsol.
  - [ ] Path `views/admin/posts/` ditambahkan ke `DEFAULT_STRICT_PATHS` pada `scripts/lint-views.js`.
- **File Terdampak**: `views/admin/posts/index.ejs`, `views/admin/posts/create.ejs`, `views/admin/posts/edit.ejs`, `public/css/admin.css`, `public/js/admin-posts.js`, `scripts/lint-views.js`
- **Skill**: `antislop-code` + `frontend-ui-engineering` + `test-driven-development`
- **Verifikasi**: Laporan gerbang kualitas (lint, tests, visual diff Playwright, browser console).

### T-290: Refaktor & Modularisasi View Admin Batch 14 - Katalog Produk (Products) [TODO]
- **Deskripsi**: Merefaktor dan modularisasi modul produk (`views/admin/products/` `index.ejs`, `create.ejs`, `edit.ejs`): eliminasi 12 style inline, 1 hex `#fafbfc`, 2 tag `<script>` inline, dan 1 komentar HTML. Pecah form besar (>400 baris) menjadi partials terisolasi (`views/admin/products/partials/basic-info.ejs`, `gallery.ejs`, `size-table.ejs`, `seo.ejs`) masing-masing <=100 baris. Pindahkan counter karakter ke `public/js/admin-products.js`. Ekstraksi style ke `.adm-prod-*`. Bersihkan komentar dan hex lama terkait.
- **Acceptance Criteria**:
  - [ ] 0 error & 0 warning pada `node scripts/lint-views.js --strict views/admin/products/`.
  - [ ] Setiap berkas partials produk berukuran <=100 baris.
  - [ ] `npm run lint` hijau (0 error).
  - [ ] Test suites eksisting lulus (`npm run test:storage && npm run test:security && npm run test:cms`).
  - [ ] Bukti perbandingan visual Playwright sebelum vs sesudah identik lintas resolusi admin (screenshot disimpan di brain Antigravity, bukan di proyek).
  - [ ] Editor tabel ukuran produk dinamis, upload galeri multi-foto, debounced filter kategori, dan CRUD produk berfungsi normal tanpa error konsol.
  - [ ] Path `views/admin/products/` ditambahkan ke `DEFAULT_STRICT_PATHS` pada `scripts/lint-views.js`.
- **File Terdampak**: `views/admin/products/index.ejs`, `views/admin/products/create.ejs`, `views/admin/products/edit.ejs`, `views/admin/products/partials/*.ejs`, `public/css/admin.css`, `public/js/admin-products.js`, `scripts/lint-views.js`
- **Skill**: `antislop-code` + `frontend-ui-engineering` + `test-driven-development`
- **Verifikasi**: Laporan gerbang kualitas (lint, tests, visual diff Playwright, browser console).

### T-291: Refaktor & Modularisasi View Admin Batch 15 - Konten Beranda (Home Content) [TODO]
- **Deskripsi**: Merefaktor dan modularisasi berkas raksasa `views/admin/home-content/index.ejs` (681 baris): eliminasi 131 style inline, 22 hex, dan 15 komentar HTML. Pecah template menjadi 6 partial modular per tab pane (`views/admin/home-content/partials/tab-intro.ejs`, `tab-wcu.ejs`, `tab-categories.ejs`, `tab-certifications.ejs`, `tab-cta.ejs`, `sticky-actions.ejs`) masing-masing <=100 baris. Konversi 9 kasus style dinamis media picker ke class semantik. Ekstraksi style ke `.adm-home-*` di `public/css/admin.css`. Bersihkan komentar dan hex lama terkait.
- **Acceptance Criteria**:
  - [ ] 0 error & 0 warning pada `node scripts/lint-views.js --strict views/admin/home-content/`.
  - [ ] Seluruh berkas partials home-content berukuran <=100 baris.
  - [ ] `npm run lint` hijau (0 error).
  - [ ] Test suites eksisting lulus (`npm run test:storage && npm run test:security && npm run test:cms`).
  - [ ] Bukti perbandingan visual Playwright sebelum vs sesudah identik lintas resolusi admin (screenshot disimpan di brain Antigravity, bukan di proyek).
  - [ ] Seluruh 5 panel tab beranda (intro, WCU, 4 kategori primer, sertifikasi mutu, pre-footer CTA) tersimpan dan terupdate normal tanpa error konsol.
  - [ ] Path `views/admin/home-content/` ditambahkan ke `DEFAULT_STRICT_PATHS` pada `scripts/lint-views.js`.
- **File Terdampak**: `views/admin/home-content/index.ejs`, `views/admin/home-content/partials/*.ejs`, `public/css/admin.css`, `scripts/lint-views.js`
- **Skill**: `antislop-code` + `frontend-ui-engineering` + `test-driven-development`
- **Verifikasi**: Laporan gerbang kualitas (lint, tests, visual diff Playwright, browser console).

### T-292: Refaktor & Modularisasi View Admin Batch 16 - Tentang Kami (About) [TODO]
- **Deskripsi**: Merefaktor dan modularisasi berkas terbesar `views/admin/about/index.ejs` (960 baris): eliminasi 178 style inline, 5 hex, dan 30 komentar HTML. Pecah template menjadi partials per tab pane dan per modal (`views/admin/about/partials/tab-sejarah.ejs`, `tab-visi-misi.ejs`, `tab-nilai.ejs`, `tab-sertifikasi.ejs`, `tab-galeri.ejs`, `modal-galeri.ejs`, `modal-statistik.ejs`, `modal-timeline.ejs`) masing-masing <=100 baris. Ekstraksi style ke `.adm-abt-*` di `public/css/admin.css`. Bersihkan komentar dan hex lama terkait.
- **Acceptance Criteria**:
  - [ ] 0 error & 0 warning pada `node scripts/lint-views.js --strict views/admin/about/`.
  - [ ] Seluruh berkas partials about berukuran <=100 baris.
  - [ ] `npm run lint` hijau (0 error).
  - [ ] Test suites eksisting lulus (`npm run test:storage && npm run test:security && npm run test:cms`).
  - [ ] Bukti perbandingan visual Playwright sebelum vs sesudah identik lintas resolusi admin (screenshot disimpan di brain Antigravity, bukan di proyek).
  - [ ] Pengelolaan sejarah, statistik pabrik, milestone linimasa, visi misi, dan slide galeri fasilitas berfungsi lancar tanpa error konsol.
  - [ ] Path `views/admin/about/` ditambahkan ke `DEFAULT_STRICT_PATHS` pada `scripts/lint-views.js`.
- **File Terdampak**: `views/admin/about/index.ejs`, `views/admin/about/partials/*.ejs`, `public/css/admin.css`, `scripts/lint-views.js`
- **Skill**: `antislop-code` + `frontend-ui-engineering` + `test-driven-development`
- **Verifikasi**: Laporan gerbang kualitas (lint, tests, visual diff Playwright, browser console).

### T-293: Enforce 100% Strict Lint Views & QA Regresi Publik Menyeluruh [TODO]
- **Deskripsi**: Memperluas konfigurasi penegakan lint views pada `scripts/lint-views.js` sehingga `DEFAULT_STRICT_PATHS` mencakup 100% direktori `views/admin/` dan partials admin. Menjalankan audit menyeluruh: target 0 error dan 0 warning di seluruh view admin, verifikasi integritas DOM & visual sampel halaman publik (`/`, `/about`, `/products`, `/contact`), dan menjalankan seluruh test suites backend.
- **Acceptance Criteria**:
  - [ ] `npm run lint:views` menghasilkan 0 error dan 0 warning di seluruh `views/admin/**` dan partials admin.
  - [ ] `npm run lint` hijau (0 error).
  - [ ] Test suites backend dan publik 100% PASS.
  - [ ] Verifikasi visual halaman publik membuktikan 0 perubahan (tidak ada regresi).
  - [ ] Laporan akhir penutupan refaktor siap untuk tahap Close.
- **File Terdampak**: `scripts/lint-views.js`, `tests/test-t293-full-regression-qa.js`
- **Skill**: `antislop-code` + `ci-cd-and-automation` + `code-review-and-quality`
- **Verifikasi**: Laporan akhir 0 pelanggaran lint views pada admin dan audit non-regresi publik.
