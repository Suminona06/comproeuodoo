# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 5 Task (`T-342` s/d `T-346`)
- **Total Task Selesai:** 341 Task (T-01 s/d T-341)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-347**.
- **Proposal Aktif:** [changes/2026-11-17_meta-title-brand-slider-admin-noindex.md](changes/2026-11-17_meta-title-brand-slider-admin-noindex.md)

---

## Task Aktif / Terbuka (Open Tasks)

### [x] `T-342` — [Bug A1] Perbaikan Auto-Resume Marquee Merek (`#merek`) Setelah Menutup `#brandPreviewModal`
- **Akar Masalah Dugaan:** `closeBrandPreview(state)` di `public/js/home.js` (baris 236–243) selalu memanggil `state.lastActiveTrigger.focus()` kembali ke `.brand-strip-item` di dalam `.brand-strip-wrapper`, sementara `public/css/components.css` (baris 3730–3733) menjeda `.brand-strip-track` via `.brand-strip-wrapper:hover` dan `.brand-strip-wrapper:focus-within`; aturan `:hover` belum dibungkus `@media (hover: hover)` sehingga berisiko *sticky hover* sentuh, dan `.brand-strip-wrapper` (`views/partials/home/brands-marquee.ejs`) memiliki `tabindex="0"`.
- **Acceptance Criteria (Keputusan 3: Opsi b):**
  - `closeBrandPreview(state)` di `public/js/home.js` tidak mengembalikan fokus ke `state.lastActiveTrigger`; sebelum menyetel `aria-hidden="true"` pada `#brandPreviewModal`, fungsi memanggil `.blur()` pada elemen terfokus di dalam modal maupun `.brand-strip-wrapper` (jika ada) dan mereset `state.lastActiveTrigger = null`.
  - Seluruh aturan `:hover` pada `.brand-strip-wrapper` dan `.brand-strip-item` di `public/css/components.css` dibungkus `@media (hover: hover)`, sementara `.brand-strip-wrapper:focus-within .brand-strip-track` tetap menjeda animasi saat navigasi `Tab` langsung ke strip dan `@media (prefers-reduced-motion: reduce)` tetap aktif.
  - Setelah menutup modal via tombol X, tombol Tutup, backdrop, atau `Escape`, `getComputedStyle(track).animationPlayState` langsung kembali `'running'` tanpa klik elemen lain, tanpa perubahan desain visual, tanpa hex baru, dan tanpa menyentuh class bersama.
  - Tambah verifikasi Playwright pada `tests/test-brand-marquee-scaling.js` (close via klik & `Escape`, `activeElement` tidak tertinggal di modal/strip, `Tab` ke strip tetap `paused`).
- **File Terdampak:** `public/js/home.js`, `public/css/components.css`, `tests/test-brand-marquee-scaling.js`
- **Skill:** `animate`, `antislop-code`, `polish`
- **Verifikasi:** `npm run lint`, `npm run lint:views`, `node tests/test-brand-marquee-scaling.js`, `node tests/test-homepage-hero-cta-merek-qa.js`, `node tests/test-t188-brand-strip-marquee.js`

### [x] `T-343` — [B1] Pembaruan `settings.company_name` (`021` Migrasi & Snapshot), Default Card CMS, dan Kamus i18n
- **Acceptance Criteria (Keputusan 1: Opsi a & 2: Opsi a):**
  - Buat migrasi `database/migrations/021_update_company_name_euodoo_plastic.sql` yang memperbarui `settings` untuk `company_name` (`'PT Euodoo Plastic'`), `meta_title_id` (`'PT Euodoo Plastic - Manufaktur Kantong Plastik Ramah Lingkungan 100% Degradable'`), dan `meta_title_en` (`'PT Euodoo Plastic - 100% Degradable Eco-Friendly Plastic Bag Manufacturer'`).
  - Perbarui `database/seeds/snapshot.json` untuk kunci `settings` yang sama tanpa menyentuh `users`/`inquiries`, tetap lulus `npm run test:seed` dan `validateMigrationSequence`.
  - Perbarui fallback input `#company_name` di `views/admin/settings/partials/corporate-identity-card.ejs` menjadi `'PT Euodoo Plastic'`.
  - Perbarui `common.company_name` dan `home.meta_title_fallback` di `locales/id.json` & `locales/en.json` ke `PT Euodoo Plastic` secara simetris.
  - `config/mailer.js` tidak diubah.
- **File Terdampak:** `database/migrations/021_update_company_name_euodoo_plastic.sql`, `database/seeds/snapshot.json`, `views/admin/settings/partials/corporate-identity-card.ejs`, `locales/id.json`, `locales/en.json`
- **Skill:** `antislop-code`
- **Verifikasi:** `npm run migrate`, `npm run test:seed`, `npm run lint:views`, `npm run lint:i18n`

### [x] `T-344` — [B1] Penyeragaman Pembentukan `<title>`, `og:site_name`, `alt` Logo & Fallback Error Publik ke `PT Euodoo Plastic`
- **Acceptance Criteria (Keputusan 1: Opsi a & 2: Opsi a):**
  - Seluruh fallback merek di `views/partials/head.ejs` (`resolvedTitle`, `author`, `og:site_name`), `views/partials/navbar.ejs` & `views/partials/footer.ejs` (`alt` logo), `middleware/settingsMiddleware.js`, `middleware/seoMiddleware.js` (`Organization.name` & `author`), `middleware/errorHandler.js`, `middleware/csrfMiddleware.js`, `services/homeService.js`, `controllers/public/pageController.js`, `productController.js`, `postController.js`, dan `contactController.js` diseragamkan ke `PT Euodoo Plastic`, tanpa mengubah perilaku pembacaan custom `meta_title_id`/`meta_title_en` pada detail produk/berita.
  - Tidak ada lagi `<title>` rute publik (ID & EN, termasuk 404/error) yang menampilkan `PT Euodoo Presisi Indonesia`, `PT. EUODOO`, atau `PT Euodoo` tanpa `Plastic`.
  - Perbarui test `tests/test-admin-crud.js`, `tests/test-revisi-admin-v1.js`, `tests/test-t276-conventions-refactor-qa.js`, dan tambahkan assertion `<title>` & `og:site_name` di `tests/test-public-ssr.js`.
  - Fungsi `<= 40` baris, berkas `<= 300` baris, `max-depth <= 2`.
- **File Terdampak:** `views/partials/head.ejs`, `views/partials/navbar.ejs`, `views/partials/footer.ejs`, `middleware/settingsMiddleware.js`, `middleware/seoMiddleware.js`, `middleware/errorHandler.js`, `middleware/csrfMiddleware.js`, `services/homeService.js`, `controllers/public/pageController.js`, `controllers/public/productController.js`, `controllers/public/postController.js`, `controllers/public/contactController.js`, `tests/test-admin-crud.js`, `tests/test-revisi-admin-v1.js`, `tests/test-t276-conventions-refactor-qa.js`, `tests/test-public-ssr.js`
- **Skill:** `antislop-code`
- **Verifikasi:** `npm run lint`, `npm run lint:views`, `npm run lint:i18n`, `npm run test:public`, `npm run test:security`, `node tests/test-public-ssr.js`, `node tests/test-admin-crud.js`, `node tests/test-revisi-admin-v1.js`, `node tests/test-t276-conventions-refactor-qa.js`

### [x] `T-345` — [B2 / FR-35] Proteksi Noindex Total Rute `/admin`, `/admin/login`, `/admin/*` & Retensi `Disallow` di `/robots.txt`
- **Acceptance Criteria (Keputusan 4: Opsi a):**
  - Pasang middleware `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` di `app.js` pada mount `/admin` **sebelum** `csrfProtection` sehingga mencakup `/admin`, `/admin/login`, seluruh rute `adminRoutes.js`, `429` `loginLimiter`, `401`/`403` `requireAuth`/`roleMiddleware`, `403` CSRF HTML/JSON, `404` `notFoundHandler`, `500` `errorHandler`, JSON API admin, serta ekspor CSV.
  - Tambahkan `<meta name="robots" content="noindex, nofollow">` pada `views/admin/login.ejs`, `views/partials/admin-header.ejs`, `views/admin/403.ejs`, dan HTML fallback error/CSRF pada `middleware/csrfMiddleware.js`, `middleware/roleMiddleware.js`, serta `middleware/errorHandler.js` (bebas inline style/hex/handler baru di template EJS strict).
  - `middleware/seoMiddleware.js` menyetel `res.locals.seo.robots = 'noindex, nofollow'` otomatis bila `currentPath === '/admin' || currentPath.startsWith('/admin/')` tanpa menyuntikkan skema publik.
  - Pertahankan `Disallow: /admin` & `Disallow: /admin/*` di `controllers/public/seoController.js`, pastikan `utils/sitemapGenerator.js` & view publik bebas URL `/admin`, dan tambah test pada `tests/test-modul10-security.js` & `tests/test-modul13-seo-audit.js`.
- **File Terdampak:** `app.js`, `middleware/seoMiddleware.js`, `middleware/csrfMiddleware.js`, `middleware/roleMiddleware.js`, `middleware/errorHandler.js`, `views/admin/login.ejs`, `views/partials/admin-header.ejs`, `views/admin/403.ejs`, `tests/test-modul10-security.js`, `tests/test-modul13-seo-audit.js`
- **Skill:** `antislop-code`
- **Verifikasi:** `npm run lint`, `npm run lint:views`, `npm run test:security`, `npm run test:audit`, `npm run test:admin-http`

### [ ] `T-346` — [C1] Polish, Audit Batas Kode, Keamanan & Regresi Menyeluruh
- **Acceptance Criteria:**
  - Seluruh gerbang CI hijau tanpa error (`npm run lint`, `npm run lint:views`, `npm run lint:i18n`, `npm run test:seed`, `npm test`).
  - Terkonfirmasi `<title>` & `og:site_name` publik (ID/EN/404) menampilkan `PT Euodoo Plastic`, rute `/admin*` terproteksi `X-Robots-Tag` + meta `noindex` + `Disallow: /admin`, serta uji responsif Playwright (`320`, `375`, `480`, `768`, `1024`, `1440px`) lulus zero overflow, zero console/page error, dan auto-resume marquee berfungsi.
- **File Terdampak:** Seluruh berkas tersentuh `T-342` s/d `T-345`
- **Skill:** `polish`, `animate`, `antislop-code`
- **Verifikasi:** `npm run lint && npm run lint:views && npm run lint:i18n && npm run test:seed`, `npm test`, `node tests/test-brand-marquee-scaling.js`, `node tests/test-homepage-major-update-qa.js`, `node tests/test-t276-conventions-refactor-qa.js`
