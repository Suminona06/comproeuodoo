# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 5 Task (T-318 s/d T-322)
- **Total Task Selesai:** 317 Task (T-01 s/d T-317)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-323**.

---

## Task Aktif / Terbuka (Open Tasks)

### T-318: Ekstraksi Partial Modular & Pembersihan `views/public/products.ejs` [DONE]
- **Modul Spesifikasi:** [prd/products.md](prd/products.md) (`FR-07`), [tech/products.md](tech/products.md)
- **Deskripsi:** Memecah `views/public/products.ejs` (242 baris) ke dalam partial modular di `views/partials/products/` (`sidebar.ejs`, `toolbar.ejs`, dan `empty-state.ejs`), sedangkan hero banner section tetap dipertahankan di file utama `products.ejs`. Menghapus seluruh 10 komentar HTML `<!-- ... -->`. Membersihkan 6 atribut `style="..."` inline dan 4 warna hex mentah (`#ffffff`, `#e2e8f0`, `#0f172a`, `#64748b`) ke dalam class scoped baru berprefix `.plp-*` di `public/css/components.css` (`.plp-hero-content`, `.plp-hero-cta-wrap`, `.plp-more-wrap.is-hidden`, `.plp-empty-state`, `.plp-empty-title`, `.plp-empty-desc`, `.plp-empty-reset-btn`) menggunakan token desain CSS resmi. Mengonversi seluruh teks literal antarmuka ke helper lokalisasi `t('products.*')` dan mendaftarkan kuncinya di `locales/id.json` serta `locales/en.json`.
- **Acceptance Criteria:**
  - [x] Template utama `views/public/products.ejs` menjadi thin page ramping (~50-60 baris EJS) dan seluruh berkas partial baru di `views/partials/products/` berukuran <= 100 baris.
  - [x] Zero inline `style="..."`, zero raw hex, dan zero komentar HTML `<!-- ... -->` pada berkas terkait.
  - [x] Seluruh teks statis antarmuka katalog menggunakan fungsi `t('products.*')` terdaftar simetris di ID dan EN.
  - [x] `npm run lint:views views/public/products.ejs views/partials/products/*.ejs` lolos dengan ZERO ERROR.
  - [x] `npm run lint` dan `npm run lint:i18n` lolos hijau tanpa error.
  - [x] Tampilan visual katalog `/products` IDENTIK 100% (pixel-perfect) sebelum vs sesudah refaktor pada breakpoint 320px, 375px, 768px, dan 1440px di ID dan EN.
  - [x] Seluruh fungsionalitas interaktif katalog (drawer filter mobile, pencarian debounced, dropdown sorting, AJAX load more, dan paginasi fallback) tetap berfungsi normal tanpa error console.
- **File Terdampak:** `views/public/products.ejs`, `views/partials/products/sidebar.ejs`, `views/partials/products/toolbar.ejs`, `views/partials/products/empty-state.ejs`, `public/css/components.css`, `locales/id.json`, `locales/en.json`
- **Skill:** `antislop-code`, `adapt`
- **Verifikasi:** Jalankan `node scripts/lint-views.js`, `npm run lint`, `npm run lint:i18n`, verifikasi tampilan visual browser di 4 breakpoint, dan uji seluruh kontrol interaktif di konsol DevTools. Selesai 2026-11-12.

### T-319: Ekstraksi 4 Partial Modular & Lokalisasi `views/public/product-detail.ejs` [DONE]
- **Modul Spesifikasi:** [prd/products.md](prd/products.md) (`FR-24`), [tech/products-detail.md](tech/products-detail.md)
- **Deskripsi:** Memecah `views/public/product-detail.ejs` (187 baris) ke dalam 4 partial granular di `views/partials/products/`: `gallery.ejs`, `info-cta.ejs`, `size-table.ejs`, dan `related-section.ejs`. Mengonversi seluruh teks statis hardcoded (breadcrumb, label varian ukuran, tooltip/aria zoom galeri, header tabel ukuran, teks tombol CTA, dan judul produk terkait) ke fungsi lokalisasi `t('product_detail.*')` yang terdaftar lengkap dan simetris di `locales/id.json` dan `locales/en.json`.
- **Acceptance Criteria:**
  - [x] Template utama `views/public/product-detail.ejs` menjadi orchestrator ramping (~50 baris EJS) dan setiap partial (`gallery.ejs`, `info-cta.ejs`, `size-table.ejs`, `related-section.ejs`) berukuran <= 100 baris.
  - [x] Seluruh string statis menggunakan fungsi `t('product_detail.*')` terdaftar simetris di `locales/id.json` dan `locales/en.json`.
  - [x] Zero inline style, zero raw hex, zero HTML comments pada seluruh template EJS terkait.
  - [x] `npm run lint:views views/public/product-detail.ejs views/partials/products/*.ejs` lolos dengan ZERO ERROR.
  - [x] `npm run lint` dan `npm run lint:i18n` lolos hijau tanpa error.
  - [x] Tampilan visual detail produk `/products/:slug` IDENTIK 100% (pixel-perfect) sebelum vs sesudah refaktor pada 320px, 375px, 768px, dan 1440px di ID dan EN.
  - [x] Interaksi galeri sticky, thumbnail switching, PhotoSwipe lightbox zoom, seleksi pill varian, scroll tabel ukuran mobile card, dan tombol WhatsApp/RFQ tetap berfungsi normal tanpa error console.
- **File Terdampak:** `views/public/product-detail.ejs`, `views/partials/products/gallery.ejs`, `views/partials/products/info-cta.ejs`, `views/partials/products/size-table.ejs`, `views/partials/products/related-section.ejs`, `locales/id.json`, `locales/en.json`
- **Skill:** `antislop-code`, `adapt`
- **Verifikasi:** Jalankan `node scripts/lint-views.js`, `npm run lint`, `npm run lint:i18n`, verifikasi rendering tabel ukuran dinamis, uji pembukaan PhotoSwipe lightbox dan klik thumbnail di browser. Selesai 2026-11-12.

### T-320: Pembersihan Minor & Lokalisasi `views/public/news.ejs` [DONE]
- **Modul Spesifikasi:** [prd/news.md](prd/news.md) (`FR-12`), [tech/news.md](tech/news.md)
- **Deskripsi:** Melakukan pembersihan minor pada `views/public/news.ejs` (144 baris) dengan mengonversi teks hardcoded empty state direktori artikel ("No articles match your selected filter criteria..." / "Tidak ditemukan artikel...") dan tombol reset ("View All Publications" / "Lihat Semua Publikasi") ke helper lokalisasi terpusat `t('news.empty_desc')` dan `t('news.empty_reset')` di `locales/id.json` dan `locales/en.json`, serta menyesuaikan konstruksi atribut `heroBg` agar lolos gerbang `lint-views`.
- **Acceptance Criteria:**
  - [x] Teks deskripsi empty state dan tombol reset di `news.ejs` menggunakan `t('news.empty_desc')` dan `t('news.empty_reset')`.
  - [x] Kamus bahasa `locales/id.json` dan `locales/en.json` simetris 100% dan terverifikasi lolos via `npm run lint:i18n`.
  - [x] `npm run lint:views views/public/news.ejs` lolos dengan ZERO ERROR.
  - [x] `npm run lint` lolos hijau.
  - [ ] Tampilan visual portal berita `/news` IDENTIK 100% sebelum vs sesudah refaktor pada breakpoint 320px, 375px, 768px, dan 1440px di ID dan EN. (Menunggu verifikasi visual browser di T-322)
  - [ ] Headline carousel slider, filter Fetch API, pill kategori geser mobile, dan paginasi bersama tetap bekerja normal tanpa error console. (Menunggu uji browser di T-322)
- **File Terdampak:** `views/public/news.ejs`, `locales/id.json`, `locales/en.json`
- **Skill:** `antislop-code`
- **Verifikasi:** `node scripts/lint-views.js views/public/news.ejs`, `npm run lint:i18n`, `npm run lint`, dan simulasi render EJS ID/EN empty state lulus 2026-11-13; verifikasi visual & interaktif browser dilanjutkan di T-322. Selesai 2026-11-13.

### T-321: Refaktor `views/public/news-detail.ejs` & Ekstraksi Skrip `public/js/news-detail.js` [DONE]
- **Modul Spesifikasi:** [prd/news.md](prd/news.md) (`FR-12`), [tech/news.md](tech/news.md)
- **Deskripsi:** Menghapus tag inline `<script>` (L123-137) dari `views/public/news-detail.ejs` dan memindahkan logikanya ke berkas JS eksternal baru `public/js/news-detail.js` (dimuat via defer `<script src="/js/news-detail.js" defer></script>`). Menghapus class ganda `article-prose` dari `<div class="nwd-prose article-prose">` sehingga menyisakan `.nwd-prose` saja. Memindahkan seluruh aturan styling pendukung dari `.article-prose` (link, table, th, td, blockquote, code, pre, ul, ol, li, h4) ke `.nwd-prose` di `public/css/components.css` dengan memetakan seluruh hex mentah ke token CSS resmi. Mengonversi seluruh teks hardcoded (breadcrumb, atribusi editorial redaksi, share label, empty prose, dan alert copy link) ke kunci lokalisasi `t('news_detail.*')` di `locales/id.json` dan `locales/en.json`.
- **Acceptance Criteria:**
  - [x] Zero inline `<script>` di dalam `views/public/news-detail.ejs` (100% patuh CSP Helmet).
  - [x] Berkas eksternal baru `public/js/news-detail.js` mengelola event klik tombol `#copyLinkBtn` via `addEventListener` dengan penanganan fallback clipboard yang aman dan pesan feedback dwibahasa.
  - [x] Class ganda disederhanakan menjadi `<div class="nwd-prose">`.
  - [x] Seluruh aturan CSS artikel terpusat di `.nwd-prose` tanpa sisa warna hex mentah (100% token CSS).
  - [x] Seluruh string statis menggunakan `t('news_detail.*')` terdaftar simetris di `locales/id.json` & `locales/en.json`.
  - [x] `npm run lint:views views/public/news-detail.ejs` lolos dengan ZERO ERROR.
  - [x] `npm run lint` dan `npm run lint:i18n` lolos hijau tanpa error.
  - [ ] Tampilan visual detail berita `/news/:slug` IDENTIK 100% sebelum vs sesudah refaktor pada 320px, 375px, 768px, dan 1440px di ID dan EN.
  - [ ] Fungsionalitas share WhatsApp, Facebook, X, dan Salin Tautan berjalan mulus tanpa error console.
- **File Terdampak:** `views/public/news-detail.ejs`, `public/js/news-detail.js`, `public/css/components.css`, `locales/id.json`, `locales/en.json`
- **Skill:** `antislop-code`
- **Verifikasi:** `node scripts/lint-views.js views/public/news-detail.ejs`, `npx eslint public/js/news-detail.js`, `npm run lint`, `npm run lint:i18n`, simulasi render EJS ID/EN + uji logika clipboard/fallback JS lulus 2026-11-13; verifikasi visual & live browser di T-322. Catatan: `tests/test-modul12-public.js:99` masih memeriksa string legacy `'article-prose'`. Selesai 2026-11-13.

### T-322: QA Audit, Visual Regression Test Lintas Viewport & Gerbang Kualitas Lint [OPEN]
- **Modul Spesifikasi:** [prd/products.md](prd/products.md), [tech/products.md](tech/products.md), [tech/products-detail.md](tech/products-detail.md), [prd/news.md](prd/news.md), [tech/news.md](tech/news.md)
- **Deskripsi:** Melakukan pengujian regresi komprehensif pada keempat halaman publik yang direfaktor (`/products`, `/products/:slug`, `/news`, `/news/:slug`) pada 4 ukuran viewport (320px, 375px, 768px, 1440px) dalam Bahasa Indonesia dan Bahasa Inggris. Memastikan tidak ada layout shift, tidak ada kebocoran horizontal (zero overflow leak), tampilan visual pixel-perfect identik dengan kondisi sebelum refaktor, seluruh interaktivitas klien berfungsi utuh, konsol browser bersih dari error/warning, dan seluruh gerbang kualitas otomatis lolos hijau.
- **Acceptance Criteria:**
  - [ ] Tampilan visual 4 halaman publik 100% identik sebelum vs sesudah refaktor di 320px, 375px, 768px, dan 1440px (ID dan EN).
  - [ ] Gerbang kualitas `npm run lint:views` lolos dengan ZERO ERROR pada seluruh file view EJS dan partial baru/refaktor (`views/public/products.ejs`, `views/partials/products/*.ejs`, `views/public/product-detail.ejs`, `views/public/news.ejs`, `views/public/news-detail.ejs`).
  - [ ] `npm run lint` (ESLint) hijau tanpa error.
  - [ ] `npm run lint:i18n` hijau tanpa error (100% simetris).
  - [ ] Seluruh interaktivitas (filter kategori, search debounce, sort dropdown, drawer mobile, load more ajax, thumbnail galeri, PhotoSwipe lightbox, pil varian, tabel ukuran, tombol WA/RFQ, headline slider, filter berita fetch API, pill geser mobile, paginasi bersama, copy link artikel) berfungsi 100% tanpa error console.
  - [ ] Halaman publik lain (terutama beranda/homepage `/`) terbukti 100% utuh tidak terpengaruh (dibekukan).
- **File Terdampak:** Seluruh berkas yang disentuh pada T-318 s/d T-321.
- **Skill:** `impeccable polish`, `adapt`
- **Verifikasi:** Eksekusi seluruh skrip linting (`npm run lint:views`, `npm run lint`, `npm run lint:i18n`), inspeksi visual komparatif di berbagai ukuran layar, dan verifikasi konsol browser.
