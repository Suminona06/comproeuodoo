# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 21 Task (`T-433` s/d `T-453` — Modularisasi CSS Komponen Publik & Optimasi Performa)
- **Total Task Selesai:** 432 Task (T-01 s/d T-432)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-454**.
- **Referensi Proposal & Spek:** [changes/2026-11-26_modular-public-components-css.md](../changes/2026-11-26_modular-public-components-css.md), [tech/public-ui-css.md](tech/public-ui-css.md), [tech/conventions.md](tech/conventions.md), [tech/conventions-lint.md](tech/conventions-lint.md).

---

## Task Aktif / Terbuka (Open Tasks)

> **Aturan Eksekusi Multi-Sesi:** Kerjakan **hanya 1 `T-xxx`** per conversation baru sesuai Tag Tier-nya. Dilarang men-dump utuh `public/css/components.css` ke konteks — gunakan `ctx_execute` atau pembacaan rentang baris terarah. Setelah verifikasi lulus 100%, tandai `[DONE]` lalu **BERHENTI**.

### [DONE] `T-433` — Buat Suite Baseline Visual & Metrik Performa Playwright Publik `[Tier: Argon Medium]`
- **File Terdampak (1):** `tests/test-public-css-visual-qa.js` (baru).
- **Langkah Bernomor:**
  1. Buat `tests/test-public-css-visual-qa.js` mendukung argumen CLI `--baseline` dan `--verify` (output laporan JSON & screenshot sementara ke `/tmp/euodoo-public-css-qa/` agar tidak mengotori repo).
  2. Definisikan daftar 11 rute target: `/`, `/about`, `/products`, `/products/<slug-aktif-pertama>`, `/capabilities`, `/news`, `/news/<slug-aktif-pertama>`, `/contact`, `/halaman-tidak-ada-404`, `/admin/login`, `/403`.
  3. Iterasi pada 5 viewport (`320x700`, `375x812`, `768x1024`, `1024x768`, `1440x900`) untuk bahasa `id` dan `en` (`?lang=en` pada rute publik).
  4. Rekam per rute: (a) 0 console error, (b) 0 status >= 400 pada resource `.css`, (c) 0 horizontal overflow (`scrollWidth <= innerWidth`), (d) total byte & jumlah request stylesheet CSS yang diunduh, (e) estimasi unused CSS ratio via CDP `CSS.startRuleUsageTracking`, (f) nilai CLS via `PerformanceObserver`, dan (g) snapshot visual elemen kunci.
  5. Jalankan `node tests/test-public-css-visual-qa.js --baseline` melawan server lokal aktif untuk mengunci metrik awal (`components.css` = 234,88 KB global).
- **Kontrak Data Eksplisit:** `/tmp/euodoo-public-css-qa/baseline.json` berisi `{ routes: { [route]: { cssRequests, cssBytes, unusedRatio, cls, overflow, consoleErrors, css404 } } }`.
- **Referensi Pola:** `tests/test-admin-css-visual-qa.js`.
- **Batasan Negatif:** Dilarang memodifikasi `public/css/*`, `views/*`, atau menyimpan artefak screenshot ke direktori repo git.
- **Skill:** `browser-testing-with-devtools`.
- **Verifikasi Deterministik:** `npm run lint && node tests/test-public-css-visual-qa.js --baseline`.

---

### [ ] `T-434` — Konsolidasi Token Publik (`--pd-*` & Token Turunan Semantik/Netral) di `public/css/tokens.css` `[Tier: Argon Medium]`
- **File Terdampak (2):** `public/css/tokens.css`, `Design/DESIGN.md`.
- **Langkah Bernomor:**
  1. Baca blok `:root` baris `8158–8177` pada `public/css/components.css` (rentang terbatas 20 baris) dan pindahkan seluruh 17 token `--pd-*` ke bagian baru `/* Product Detail Surface & Ink Tokens */` di `public/css/tokens.css`.
  2. Tambahkan 8 token turunan baru di `public/css/tokens.css` dengan nilai warna **100% identik** dengan nilai existing di `components.css` (tanpa rona biru): `--color-text-muted-light`, `--plp-divider`, `--plp-btn-border`, `--color-warning-text`, `--color-success-text-deep`, `--color-success-border`, `--color-error-text-deep`, `--color-error-border`.
  3. Dokumentasikan daftar token turunan baru tersebut secara ringkas di `Design/DESIGN.md`.
- **Kontrak Data Eksplisit:** 25 token wajib tersedia di `:root` `public/css/tokens.css`: `--pd-bg`, `--pd-bg-soft`, `--pd-surface`, `--pd-surface-2`, `--pd-ink`, `--pd-ink-2`, `--pd-ink-3`, `--pd-line`, `--pd-line-soft`, `--pd-green`, `--pd-green-hover`, `--pd-green-bright`, `--pd-green-deep`, `--pd-sage`, `--pd-sage-2`, `--pd-radius-lg`, `--pd-shadow`, `--color-text-muted-light`, `--plp-divider`, `--plp-btn-border`, `--color-warning-text`, `--color-success-text-deep`, `--color-success-border`, `--color-error-text-deep`, `--color-error-border`.
- **Referensi Pola:** `public/css/tokens.css` (seksi `/* Turunan Semantik Resmi */`), `public/css/admin/tokens.css`.
- **Batasan Negatif:** Dilarang mengubah nilai token existing di `public/css/tokens.css`, dilarang menambah warna biru (hue 190°–255° saturasi tinggi), dilarang mengubah `public/css/components.css` pada task ini.
- **Skill:** `antislop-ui`.
- **Verifikasi Deterministik:** `npm run lint:views && node -e "const fs=require('fs'),c=fs.readFileSync('public/css/tokens.css','utf8');for(const t of ['--pd-bg','--pd-ink','--plp-btn-border','--color-warning-text','--color-success-border','--color-error-border'])if(!c.includes(t))throw new Error('Missing '+t);console.log('OK')"`.

---

### [ ] `T-435` — Pembersihan 70 Class Mati, 36 Duplikat Konteks Sama & Komentar Historis di `public/css/components.css` `[Tier: Argon Medium]`
- **File Terdampak (1):** `public/css/components.css`.
- **Langkah Bernomor:**
  1. Verifikasi programmatic via `ctx_execute` bahwa seluruh 70 class mati (daftar di `tech/public-ui-css.md` §5) tidak dipakai di `views/**/*.ejs` maupun `public/js/**/*.js` (wajib pertahankan `.hero-slide-image`, `.hero-slide-video`, `.nwl-headline-sec`).
  2. Hapus blok legacy Home v1 (baris `638–1031`: `.showcase-card*`, `.section-journey`, `.metric-stat-*`, `.news-asymmetric-grid`, `.news-card-tall/horizontal`, `.footer-corp-*`, `.social-icon*`, serta deklarasi awal `.btn-pill-*` & `.hero-explore-*` yang ditimpa di bawahnya) dan seluruh aturan milik 70 class mati lainnya.
  3. Gabungkan/deduplikasi seluruh 36 duplikat `(context, selector)` dengan mempertahankan deklarasi pemenang cascade akhir.
  4. Hapus blok `:root` inline milik `--pd-*` (sudah dipindah di `T-434`) dan bersihkan 3 komentar historis nomor task sesuai `antislop-code`.
- **Kontrak Data Eksplisit:** Setelah task ini, `public/css/components.css` memiliki **0** dari 70 class mati, **0** duplikat `(context, selector)`, dan **0** blok `:root`.
- **Referensi Pola:** `tests/test-admin-css-modular.js` (`collectSelectorEntries` & `hasDeadClassToken`).
- **Batasan Negatif:** Dilarang memodifikasi properti visual class aktif; dilarang menghapus `.hero-slide-image`, `.hero-slide-video`, `.nwl-headline-sec`, `.hcat-grid--1..4`, `.abt-cnt-card--q1..4`, `.abt-gal-tile--pos-1..6`, `.bento-tile--pos-1..6`, `.swal2-*`, atau `.eu-dd--*`.
- **Skill:** `antislop-code`.
- **Verifikasi Deterministik:** Skrip `ctx_execute` cek 0 duplikat `(context, selector)` & 0 dari 70 class mati pada `public/css/components.css` && `npm run lint:views`.

---

### [ ] `T-436` — Ekstraksi Layer Core Always-On (`primitives.css`, `whatsapp-float.css`, `cta-reveal.css`) `[Tier: Argon Medium]`
- **File Terdampak (3):** `public/css/components/primitives.css`, `public/css/components/whatsapp-float.css`, `public/css/components/cta-reveal.css` (semua baru).
- **Langkah Bernomor:**
  1. Ekstrak blok primitives aktif (`.btn*`, `.card*`, `.form-*`, `.badge*`, `.table`, `.alert*`) ke `public/css/components/primitives.css` (<= ~300 baris).
  2. Ekstrak blok floating WhatsApp (`.wa-float-*`, `.wa-icon`, `.wa-tooltip`) ke `public/css/components/whatsapp-float.css` (<= ~150 baris).
  3. Ekstrak blok CTA global & reveal (`.sec-cta`, `.cta-*`, `.reveal` + `@media` milik `.sec-cta`/`.cta-*`) ke `public/css/components/cta-reveal.css` (<= ~220 baris).
  4. Ganti seluruh raw hex (termasuk fallback `var(--token, ...)`) dengan token resmi dari `public/css/tokens.css`.
- **Kontrak Data Eksplisit:** 3 berkas baru di `public/css/components/`, masing-masing <= 600 baris, 0 raw hex, 0 duplikat selector.
- **Referensi Pola:** `public/css/admin/buttons.css`, `public/css/admin/forms-inputs.css`, `tech/public-ui-css.md` §3.
- **Batasan Negatif:** Belum mengubah `views/partials/head.ejs` dan belum menghapus `public/css/components.css`; dilarang mengubah nilai warna atau dimensi visual.
- **Skill:** `antislop-ui`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/components/primitives.css public/css/components/whatsapp-float.css public/css/components/cta-reveal.css`.

---

### [ ] `T-437` — Ekstraksi Komponen Bersama Kondisional Bagian 1 (`page-hero.css`, `dropdown.css`, `pagination.css`) `[Tier: Argon Medium]`
- **File Terdampak (3):** `public/css/components/page-hero.css`, `public/css/components/dropdown.css`, `public/css/components/pagination.css` (semua baru).
- **Langkah Bernomor:**
  1. Ekstrak blok `.page-hero*` & subpage breadcrumbs + scrim responsif ke `public/css/components/page-hero.css` (<= ~230 baris).
  2. Ekstrak blok `.eu-dd-*` & `@keyframes euDdShimmer` ke `public/css/components/dropdown.css` (<= ~500 baris).
  3. Ekstrak blok `.pgn-*` ke `public/css/components/pagination.css` (<= ~180 baris).
  4. Petakan seluruh raw hex & fallback hex ke token `public/css/tokens.css`.
- **Kontrak Data Eksplisit:** 3 berkas di `public/css/components/`, masing-masing <= 600 baris, 0 raw hex, 0 komentar task historis.
- **Referensi Pola:** `public/css/admin/dropdown.css`, `public/css/admin/pagination.css`.
- **Batasan Negatif:** Dilarang mengubah perilaku `.eu-dd-*` atau menyentuh `public/css/admin/dropdown.css` & `public/css/admin/pagination.css`.
- **Skill:** `antislop-ui`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/components/page-hero.css public/css/components/dropdown.css public/css/components/pagination.css`.

---

### [ ] `T-438` — Ekstraksi Komponen Bersama Kondisional Bagian 2 (`product-cards.css`, `news-cards.css`) `[Tier: Argon Medium]`
- **File Terdampak (2):** `public/css/components/product-cards.css`, `public/css/components/news-cards.css` (keduanya baru).
- **Langkah Bernomor:**
  1. Ekstrak seluruh aturan kartu & grid produk lintas halaman (`/products` & `/products/<slug>`): `.plp-grid`, `.plp-card*`, `.plp-card-entering`, `.plp-more-wrap`, `.plp-pagination*`, `.plp-empty*` + `@media` kartu ke `public/css/components/product-cards.css` (<= ~480 baris).
  2. Ekstrak seluruh aturan kartu & grid berita lintas halaman (`/news` & `/news/<slug>`): `.news-card-v2*`, `.nwl-grid`, `.nwl-card*`, `.nwl-img-placeholder`, `.nwd-related-grid` + `@media` kartu ke `public/css/components/news-cards.css` (<= ~360 baris).
  3. Petakan seluruh raw hex & fallback hex ke token `public/css/tokens.css` (termasuk `--plp-btn-border`).
- **Kontrak Data Eksplisit:** Seluruh selector `.plp-grid`/`.plp-card*` dan `.nwl-grid`/`.nwl-card*`/`.news-card-v2*` terpusat pada 2 berkas ini tanpa duplikasi di berkas halaman.
- **Referensi Pola:** `tech/public-ui-css.md` §3, `views/partials/news-card.ejs`, `views/public/partials/product-card-fragment.ejs`.
- **Batasan Negatif:** Dilarang mengubah rasio gambar kartu 1:1 mobile atau tap target 44px pada `.plp-card-btn`.
- **Skill:** `antislop-ui`, `antislop-layoutmobile`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/components/product-cards.css public/css/components/news-cards.css`.

---

### [ ] `T-439` — Ekstraksi Modul Homepage Bagian 1 (`home-hero.css`, `home-intro-categories.css`, `home-why-choose-us.css`) `[Tier: Argon Medium]`
- **File Terdampak (3):** `public/css/components/home-hero.css`, `public/css/components/home-intro-categories.css`, `public/css/components/home-why-choose-us.css` (semua baru).
- **Langkah Bernomor:**
  1. Ekstrak blok Hero Slider (`.hero*` termasuk `.hero-slide-image`/`.hero-slide-video`, `.hero-cta-*`, `.hero-explore-*`) + `@media` hero ke `public/css/components/home-hero.css` (<= ~560 baris).
  2. Ekstrak blok Intro & Kategori Utama (`.sec-intro`, `.intro-*`, `.home-intro-*`, `.sec-products`, `.prod-*`, `.hcat-*`, `.hcat-grid--1..4`) + `@media` ke `public/css/components/home-intro-categories.css` (<= ~410 baris).
  3. Ekstrak blok Why Choose Us (`.sec-why-us`, `.wcu-*`, `.sec-pillars`) + `@media` & `prefers-reduced-motion` ke `public/css/components/home-why-choose-us.css` (<= ~460 baris).
  4. Ganti seluruh raw hex & fallback hex dengan token `public/css/tokens.css`.
- **Kontrak Data Eksplisit:** Urutan `@media` (`1024px` -> `860px` -> `768px` -> `480px`) di tiap berkas identik dengan urutan cascade asal.
- **Referensi Pola:** `public/css/admin/page-home.css`, `views/partials/home/hero-slide.ejs`.
- **Batasan Negatif:** Homepage DIBEKUKAN secara visual; dilarang mengubah overlay scrim hero, animasi, tinggi hero, warna token, atau `views/public/index.ejs`.
- **Skill:** `antislop-ui`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/components/home-hero.css public/css/components/home-intro-categories.css public/css/components/home-why-choose-us.css`.

---

### [ ] `T-440` — Ekstraksi Modul Homepage Bagian 2 (`home-cert-brands.css`, `home-news-carousel.css`) `[Tier: Argon Medium]`
- **File Terdampak (2):** `public/css/components/home-cert-brands.css`, `public/css/components/home-news-carousel.css` (keduanya baru).
- **Langkah Bernomor:**
  1. Ekstrak blok Sertifikasi & Brand Marquee (`.sec-evidence`, `.ev-*`, `.cert-*`, `.home-cert-logo`, `.brand-strip-*`, brand zoom modal, `@keyframes` marquee) + `@media` ke `public/css/components/home-cert-brands.css` (<= ~550 baris).
  2. Ekstrak blok Home News Carousel (`.sec-news`, `.hnc-*`) + `@media` ke `public/css/components/home-news-carousel.css` (<= ~370 baris).
  3. Ganti seluruh raw hex & fallback hex dengan token `public/css/tokens.css`.
- **Kontrak Data Eksplisit:** 2 berkas <= 600 baris, 0 raw hex, seluruh `@keyframes` marquee & carousel utuh.
- **Referensi Pola:** `views/partials/home/brands-marquee.ejs`, `views/partials/home/news.ejs`.
- **Batasan Negatif:** Dilarang mengubah kecepatan animasi marquee, ukuran logo sertifikasi, atau struktur kartu carousel berita Homepage.
- **Skill:** `antislop-ui`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/components/home-cert-brands.css public/css/components/home-news-carousel.css`.

---

### [ ] `T-441` — Ekstraksi Modul Katalog & Detail Produk (`products-catalog.css`, `product-detail-core.css`, `product-detail-specs.css`) `[Tier: Argon Medium]`
- **File Terdampak (3):** `public/css/components/products-catalog.css`, `public/css/components/product-detail-core.css`, `public/css/components/product-detail-specs.css` (semua baru).
- **Langkah Bernomor:**
  1. Ekstrak aturan non-kartu PLP (`.plp-section/container/layout`, sidebar, toolbar, search, sort, drawer mobile & backdrop, `@media` layout/toolbar) ke `public/css/components/products-catalog.css` (<= ~580 baris).
  2. Ekstrak blok atas Product Detail (`.pd-wrap/card/crumb*/title`, galeri & thumbnail, info & varian produk) ke `public/css/components/product-detail-core.css` (<= ~460 baris).
  3. Ekstrak blok bawah Product Detail (`.pd-cta-row`, `.pd-btn*`, tab spesifikasi, tabel ukuran, related section, `.pd-gallery-track`, `@media` PDP) ke `public/css/components/product-detail-specs.css` (<= ~450 baris).
  4. Ganti seluruh raw hex & fallback hex (termasuk `var(--pd-*, ...)` & `--plp-divider`) dengan token murni dari `public/css/tokens.css`.
- **Kontrak Data Eksplisit:** Tidak ada blok `.cf-var-*` di berkas PDP (dipindah ke `contact-variants.css` di `T-444`), dan tidak ada duplikat `.plp-grid`/`.plp-card*` (sudah di `product-cards.css`).
- **Referensi Pola:** `public/css/admin/page-catalog.css`, `public/css/admin/page-product-editors.css`.
- **Batasan Negatif:** Dilarang menyentuh `public/css/lightbox.css` atau mengubah layout tabel ukuran/varian PDP.
- **Skill:** `antislop-ui`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/components/products-catalog.css public/css/components/product-detail-core.css public/css/components/product-detail-specs.css`.

---

### [ ] `T-442` — Ekstraksi Modul About Bagian 1 (`about-story.css`, `about-timeline.css`, `about-vision-mission.css`) `[Tier: Argon Medium]`
- **File Terdampak (3):** `public/css/components/about-story.css`, `public/css/components/about-timeline.css`, `public/css/components/about-vision-mission.css` (semua baru).
- **Langkah Bernomor:**
  1. Ekstrak blok Story & Counter 2x2 (`.abt-cnt-*`, `.abt-cnt-card--q1..4`) ke `public/css/components/about-story.css` (<= ~240 baris).
  2. Ekstrak blok Vertical History Timeline (`.abt-htl-*`) ke `public/css/components/about-timeline.css` (<= ~560 baris).
  3. Ekstrak blok Vision & Mission (`.sec-vm`, `.vm-*`, `.abt-vm-*`) ke `public/css/components/about-vision-mission.css` (<= ~240 baris).
  4. Ganti seluruh raw hex & fallback hex dengan token `public/css/tokens.css` (jaga permukaan `--bg-soft-green` & `--color-text-muted-on-soft`).
- **Kontrak Data Eksplisit:** 3 berkas <= 600 baris, 0 raw hex, 0 duplikat selector.
- **Referensi Pola:** `public/css/admin/page-about.css`, `views/partials/about/story-counter.ejs`.
- **Batasan Negatif:** Dilarang mengubah `tabular-nums`, animasi counter, atau permukaan `--bg-soft-green` di `/about`.
- **Skill:** `antislop-ui`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/components/about-story.css public/css/components/about-timeline.css public/css/components/about-vision-mission.css`.

---

### [ ] `T-443` — Ekstraksi Modul About Bagian 2 (`about-ticket.css`, `about-gallery.css`) `[Tier: Argon Medium]`
- **File Terdampak (2):** `public/css/components/about-ticket.css`, `public/css/components/about-gallery.css` (keduanya baru).
- **Langkah Bernomor:**
  1. Ekstrak blok Expanding T-I-C-K-E-T Accordion (`.abt-tkt-*`) ke `public/css/components/about-ticket.css` (<= ~585 baris).
  2. Ekstrak blok Bento Mosaic Gallery (`.sec-gallery`, `.gal-*`, `.abt-gal-*`, `.bento-*` termasuk `.bento-grid` + `@media` galeri) ke `public/css/components/about-gallery.css` (<= ~595 baris).
  3. Ganti seluruh raw hex & fallback hex dengan token `public/css/tokens.css`.
- **Kontrak Data Eksplisit:** Kedua berkas <= 600 baris, 0 raw hex, 0 duplikat selector.
- **Referensi Pola:** `views/partials/about/ticket-accordion.ejs`, `views/partials/about/gallery-bento.ejs`.
- **Batasan Negatif:** Dilarang mengubah aturan konflik Anime.js pada `.sec-gallery` atau perilaku expand/collapse `.abt-tkt-panel.is-active`.
- **Skill:** `antislop-ui`, `antislop-layoutmobile`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/components/about-ticket.css public/css/components/about-gallery.css`.

---

### [ ] `T-444` — Ekstraksi Modul Berita & Kontak (`news-listing.css`, `news-detail.css`, `contact-page.css`, `contact-variants.css`) `[Tier: Argon Medium]`
- **File Terdampak (4):** `public/css/components/news-listing.css`, `public/css/components/news-detail.css`, `public/css/components/contact-page.css`, `public/css/components/contact-variants.css` (semua baru).
- **Langkah Bernomor:**
  1. Ekstrak blok News Listing non-kartu (`.filter-bar`, `.nwl-hero-*`, `.nwl-headline-*`, `.nwl-slide*`, `.nwl-indicator*`, `.nwl-tab-*`, `.nwl-cat-*`, `.nwl-sec-directory*`) ke `public/css/components/news-listing.css` (<= ~560 baris).
  2. Ekstrak blok News Detail (`.nwd-*`) dan copy-link toast (`.nwd-swal-*`, `.swal2-popup.nwd-swal-popup*`) ke `public/css/components/news-detail.css` (<= ~450 baris).
  3. Ekstrak blok Contact Split & Form/Locations (`.contact-split*`, `.cf-*` kecuali `.cf-var-*`) ke `public/css/components/contact-page.css` (<= ~460 baris).
  4. Ekstrak blok pemilih varian RFQ (`.cf-var-*`) ke `public/css/components/contact-variants.css` (<= ~140 baris).
  5. Petakan seluruh raw hex & fallback hex ke token `public/css/tokens.css`.
- **Kontrak Data Eksplisit:** Seluruh 25 berkas di `public/css/components/*.css` lengkap, masing-masing <= 600 baris, 0 raw hex, 0 duplikat selector lintas 25 berkas.
- **Referensi Pola:** `views/public/news.ejs`, `views/public/news-detail.ejs`, `views/partials/contact/rfq-variants-picker.ejs`.
- **Batasan Negatif:** Dilarang menduplikasi `.nwl-grid`/`.nwl-card*` (sudah di `news-cards.css`) atau menyentuh `public/js/contact.js` & `public/js/news-detail.js`.
- **Skill:** `antislop-ui`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/components/news-listing.css public/css/components/news-detail.css public/css/components/contact-page.css public/css/components/contact-variants.css` && cek total berkas di `public/css/components/` = 25 berkas.

---

### [ ] `T-445` — Pemuatan Kondisional `PUBLIC_PAGE_STYLES` di `views/partials/head.ejs` & Aktivasi Batch 1 (`index`, `about`, `capabilities`) `[Tier: Argon Medium]`
- **File Terdampak (4):** `views/partials/head.ejs`, `views/public/index.ejs`, `views/public/about.ejs`, `views/public/capabilities.ejs`.
- **Langkah Bernomor:**
  1. Pada `views/partials/head.ejs`, ganti `<link rel="stylesheet" href="/css/components.css?v=...">` dengan 3 link Core Always-On (`primitives.css`, `whatsapp-float.css`, `cta-reveal.css`) berversi `?v=20261126-1`.
  2. Tambahkan peta `PUBLIC_PAGE_STYLES` (meniru `PAGE_STYLES` di `views/partials/admin-header.ejs`, nesting <= 2 level) untuk kunci `'home'`, `'about'`, `'products'`, `'product-detail'`, `'capabilities'`, `'news'`, `'news-detail'`, `'contact'`, `'404'`, lengkap dengan fallback resolusi dari `path` jika `pageStyle` tidak diteruskan + dukungan array opsional `extraPublicStyles`.
  3. Perbarui pemanggilan header di `views/public/index.ejs` (`{ pageStyle: 'home' }`), `views/public/about.ejs` (`{ pageStyle: 'about' }`), dan `views/public/capabilities.ejs` (`{ pageStyle: 'capabilities' }`).
- **Kontrak Data Eksplisit:** Sesuai pemetaan resmi pada `tech/public-ui-css.md` §4 (`home`, `about`, `products`, `product-detail`, `news`, `news-detail`, `contact`, `capabilities`, `404`).
- **Referensi Pola:** `views/partials/admin-header.ejs` (baris `38–65`).
- **Batasan Negatif:** Dilarang mengubah teks, i18n, meta SEO, urutan `tokens.css`/`base.css`/`layout.css`/`sweetalert2.min.css`/`photoswipe.css`/`lightbox.css`, atau menambah `<script>`/`style="..."` inline.
- **Skill:** `frontend-ui-engineering`.
- **Verifikasi Deterministik:** `npm run lint:views && npm run lint:i18n`.

---

### [ ] `T-446` — Aktivasi Eksplisit `pageStyle` di View Publik Batch 2 (`products.ejs`, `product-detail.ejs`, `news.ejs`) `[Tier: Hydrogen Medium]`
- **File Terdampak (3):** `views/public/products.ejs`, `views/public/product-detail.ejs`, `views/public/news.ejs`.
- **Langkah Bernomor:**
  1. Perbarui `include('../partials/header')` pada `views/public/products.ejs` menjadi `include('../partials/header', { pageStyle: 'products' })`.
  2. Perbarui pada `views/public/product-detail.ejs` menjadi `include('../partials/header', { pageStyle: 'product-detail' })`.
  3. Perbarui pada `views/public/news.ejs` menjadi `include('../partials/header', { pageStyle: 'news' })`.
- **Kontrak Data Eksplisit:** Kunci `pageStyle` sesuai peta `PUBLIC_PAGE_STYLES` di `views/partials/head.ejs`.
- **Referensi Pola:** `views/public/index.ejs` (hasil `T-445`).
- **Batasan Negatif:** Dilarang mengubah markup HTML, partial include lain, atau logika EJS di ketiga berkas.
- **Skill:** `frontend-ui-engineering`.
- **Verifikasi Deterministik:** `npm run lint:views && npm run lint:i18n`.

---

### [ ] `T-447` — Aktivasi Eksplisit `pageStyle` di View Publik Batch 3 (`news-detail.ejs`, `contact.ejs`, `404.ejs`) `[Tier: Hydrogen Medium]`
- **File Terdampak (3):** `views/public/news-detail.ejs`, `views/public/contact.ejs`, `views/public/404.ejs`.
- **Langkah Bernomor:**
  1. Perbarui `include('../partials/header')` pada `views/public/news-detail.ejs` menjadi `include('../partials/header', { pageStyle: 'news-detail' })`.
  2. Perbarui pada `views/public/contact.ejs` menjadi `include('../partials/header', { pageStyle: 'contact' })`.
  3. Perbarui pada `views/public/404.ejs` menjadi `include('../partials/header', { pageStyle: '404' })`.
- **Kontrak Data Eksplisit:** Kunci `pageStyle` sesuai peta `PUBLIC_PAGE_STYLES` di `views/partials/head.ejs`.
- **Referensi Pola:** `views/public/index.ejs` (hasil `T-445`).
- **Batasan Negatif:** Dilarang mengubah markup HTML, `useSweetAlert`, atau teks/i18n di ketiga berkas.
- **Skill:** `frontend-ui-engineering`.
- **Verifikasi Deterministik:** `npm run lint:views && npm run lint:i18n`.

---

### [ ] `T-448` — Isolasi Penuh `views/admin/login.ejs` & `views/admin/403.ejs` ke `public/css/admin/page-auth.css` `[Tier: Argon Medium]`
- **File Terdampak (3):** `public/css/admin/page-auth.css`, `views/admin/login.ejs`, `views/admin/403.ejs`.
- **Langkah Bernomor:**
  1. Tambahkan aturan ter-scope di `public/css/admin/page-auth.css` (memakai token `public/css/admin/tokens.css`, 0 raw hex) untuk menggantikan ketergantungan CSS publik:
     - `login.ejs`: `.adm-login-card`, `.adm-login-card-body`, `.adm-login-card-footer`, `.adm-login-body .form-label-required::after`, `.adm-login-text-center`, `.adm-login-brand-name`, `.adm-login-brand-badge`, `.adm-login-fallback`, + reset dasar standalone auth.
     - `403.ejs`: `.err403-header-inner`, `.err403-header-group`, `.err403-badge`, + reset dasar standalone 403.
  2. Perbarui class elemen terkait di `views/admin/login.ejs` & `views/admin/403.ejs`, lalu hapus 4 `<link>` CSS publik (`/css/tokens.css`, `/css/base.css`, `/css/layout.css`, `/css/components.css`) dari kedua berkas.
  3. Verifikasi `public/css/admin/page-auth.css` tetap <= ~300 baris dan lulus `tests/test-admin-css-modular.js`.
- **Kontrak Data Eksplisit:** `login.ejs` hanya memuat `admin/{tokens,buttons,forms-inputs,page-auth}.css`; `403.ejs` hanya memuat `admin/{tokens,buttons,page-auth}.css`.
- **Referensi Pola:** `tech/admin-ui-css.md` §4, `public/css/admin/page-auth.css`.
- **Batasan Negatif:** Dilarang mengubah struktur form CSRF/validasi di `login.ejs`, dilarang menambah raw hex, dilarang mengubah file admin CSS lain selain `page-auth.css`.
- **Skill:** `antislop-ui`.
- **Verifikasi Deterministik:** `npm run lint:views && node --test tests/test-admin-css-modular.js`.

---

### [ ] `T-449` — Buat `tests/helpers/readPublicCss.js`, Suite `tests/test-public-css-modular.js`, & Strict Lint `scripts/lint-views.js` `[Tier: Argon Medium]`
- **File Terdampak (3):** `tests/helpers/readPublicCss.js` (baru), `tests/test-public-css-modular.js` (baru), `scripts/lint-views.js`.
- **Langkah Bernomor:**
  1. Buat `tests/helpers/readPublicCss.js` mengekspor `PUBLIC_COMPONENT_CSS_FILES` (urutan cascade 25 berkas), `readPublicTokensCss()`, `readPublicComponentCss(file)`, dan `readAllPublicComponentsCss()`.
  2. Daftarkan `'public/css/components/'` ke `DEFAULT_STRICT_PATHS` di `scripts/lint-views.js`.
  3. Buat `tests/test-public-css-modular.js` memverifikasi: (a) tepat 25 berkas & <= 620 baris/berkas, (b) 0 raw hex di luar `public/css/tokens.css`, (c) 0 duplikat `(context, selector)` lintas 25 berkas, (d) token fondasi palet hijau zero-blue utuh di `public/css/tokens.css`, (e) 0 dari 70 class mati eksis, (f) seluruh referensi CSS di `views/partials/head.ejs` menunjuk berkas valid dan 0 referensi `/css/components.css` di `head.ejs`, `login.ejs`, maupun `403.ejs`. *(Assertion `fs.existsSync('public/css/components.css') === false` diaktifkan pada `T-453`).*
- **Kontrak Data Eksplisit:** Ekspor ESM `PUBLIC_COMPONENT_CSS_FILES`, `readPublicTokensCss`, `readPublicComponentCss`, `readAllPublicComponentsCss`.
- **Referensi Pola:** `tests/helpers/readAdminCss.js`, `tests/test-admin-css-modular.js`.
- **Batasan Negatif:** Dilarang menghapus `public/css/components.css` pada task ini (menunggu migrasi 34 tes di `T-450`–`T-452`).
- **Skill:** `test-driven-development`.
- **Verifikasi Deterministik:** `npm run lint && npm run lint:views && node --test tests/test-public-css-modular.js`.

---

### [ ] `T-450` — Migrasi Helper Tes Batch 1 (11 Berkas: Home, Brand, Header, Dropdown, Rebrand) `[Tier: Hydrogen Medium]`
- **File Terdampak (11 berkas tes — swap impor identik 2 baris per berkas):** `tests/test-brand-marquee-scaling.js`, `tests/test-dropdown-css.js`, `tests/test-homepage-hero-cta-merek-qa.js`, `tests/test-homepage-major-update-qa.js`, `tests/test-kelompok-c-polish.js`, `tests/test-mobile-header.js`, `tests/test-public-dropdown-migration.js`, `tests/test-rebrand-visual-functional.js`, `tests/test-t187-hero-cta-public.js`, `tests/test-t188-brand-strip-marquee.js`, `tests/test-t189-dead-code-cleanup.js`.
- **Langkah Bernomor:**
  1. Ganti pembacaan `fs.readFileSync('...public/css/components.css', 'utf8')` di ke-11 berkas dengan `readAllPublicComponentsCss()` dari `./helpers/readPublicCss.js`.
  2. Perbarui teks log/deskripsi yang menyebut monolit agar merujuk CSS modular publik tanpa mengubah assertion.
  3. Verifikasi 0 kemunculan `components.css` pada ke-11 berkas.
- **Kontrak Data Eksplisit:** `import { readAllPublicComponentsCss } from './helpers/readPublicCss.js';` (atau setara CJS bila berkas CJS).
- **Referensi Pola:** `tests/helpers/readAdminCss.js`, `tests/helpers/readPublicCss.js`.
- **Batasan Negatif:** Dilarang menghapus, melemahkan, atau men-skip assertion; dilarang menyentuh berkas di luar daftar 11 file target.
- **Skill:** `test-driven-development`.
- **Verifikasi Deterministik:** `npm run lint` && cek grep 0 kemunculan `components.css` pada ke-11 berkas.

---

### [ ] `T-451` — Migrasi Helper Tes Batch 2 (12 Berkas: Produk & About) `[Tier: Hydrogen Medium]`
- **File Terdampak (12 berkas tes — swap impor identik 2 baris per berkas):** `tests/test-product-detail-redesign-qa.js`, `tests/test-product-detail-size-table-qa.js`, `tests/test-product-dynamic-size-table-qa.js`, `tests/test-product-listing-redesign-qa.js`, `tests/test-t122-bento.js`, `tests/test-t123-animation.js`, `tests/test-t124-mobile.js`, `tests/test-t126-count-up.js`, `tests/test-t127-timeline-hover.js`, `tests/test-t128-mobile-regression.js`, `tests/test-t297-ticket-accordion-styles-qa.js`, `tests/test-t298-ticket-accordion-interaction-qa.js`.
- **Langkah Bernomor:**
  1. Ganti seluruh pembacaan langsung `public/css/components.css` di ke-12 berkas dengan `readAllPublicComponentsCss()` dari `./helpers/readPublicCss.js`.
  2. Pertahankan seluruh assertion eksisting 100% utuh.
  3. Verifikasi 0 kemunculan `components.css` pada ke-12 berkas.
- **Kontrak Data Eksplisit:** Sama dengan `T-450`.
- **Referensi Pola:** `tests/helpers/readPublicCss.js`.
- **Batasan Negatif:** Dilarang mengubah/melemahkan assertion atau menyentuh kode aplikasi.
- **Skill:** `test-driven-development`.
- **Verifikasi Deterministik:** `npm run lint` && cek grep 0 kemunculan `components.css` pada ke-12 berkas.

---

### [ ] `T-452` — Migrasi Helper Tes Batch 3 (11 Berkas: News, Pagination, Buttons, Public UI & Regression) `[Tier: Hydrogen Medium]`
- **File Terdampak (11 berkas tes — swap impor identik 2 baris per berkas):** `tests/test-t132-delivery-gate.js`, `tests/test-t139-full-regression.js`, `tests/test-t193-card-component.js`, `tests/test-t196-load-more.js`, `tests/test-t197-responsive-mobile.js`, `tests/test-t241-public-ui.js`, `tests/test-t243-hero-filter.js`, `tests/test-t257-buttons-playwright.js`, `tests/test-t312-unified-pagination.js`, `tests/test-t320-t321-news-regression.js`, `tests/test-task-201-frontend.js`.
- **Langkah Bernomor:**
  1. Ganti seluruh pembacaan langsung `public/css/components.css` di ke-11 berkas dengan `readAllPublicComponentsCss()` dari `./helpers/readPublicCss.js`.
  2. Pertahankan seluruh assertion eksisting (pada `test-t257-buttons-playwright.js`, arahkan pengecekan keutuhan tombol publik ke `readAllPublicComponentsCss()`).
  3. Verifikasi 0 berkas di seluruh `tests/` (selain assertion negatif di `test-public-css-modular.js`) yang masih merujuk `public/css/components.css`.
- **Kontrak Data Eksplisit:** Sama dengan `T-450`.
- **Referensi Pola:** `tests/helpers/readPublicCss.js`.
- **Batasan Negatif:** Dilarang menghapus/melemahkan assertion atau menyentuh kode aplikasi.
- **Skill:** `test-driven-development`.
- **Verifikasi Deterministik:** `npm run lint` && cek grep seluruh `tests/` hanya `test-public-css-modular.js` yang menyebut `components.css`.

---

### [ ] `T-453` — Hapus Permanen `public/css/components.css` & Verifikasi Regresi Visual + Performa Playwright `[Tier: Argon Medium]`
- **File Terdampak (2):** `public/css/components.css` (dihapus permanen sesuai Keputusan 5a), `tests/test-public-css-modular.js` (aktifkan assertion `fs.existsSync('public/css/components.css') === false`).
- **Langkah Bernomor:**
  1. Pastikan 0 referensi `components.css` tersisa di `views/`, `public/js/`, `controllers/`, dan `tests/` (kecuali assertion negatif di `test-public-css-modular.js`).
  2. Hapus permanen `public/css/components.css` dan aktifkan assertion `monolith components.css must stay deleted` di `tests/test-public-css-modular.js`.
  3. Jalankan gerbang kualitas lengkap: `npm run lint`, `npm run lint:views`, `npm run lint:i18n`, `node --test tests/test-public-css-modular.js`, `node --test tests/test-admin-css-modular.js`, dan `npm test`.
  4. Jalankan `node tests/test-public-css-visual-qa.js --verify` untuk membandingkan 11 rute (`320/375/768/1024/1440`, ID & EN) terhadap baseline `T-433`: buktikan 0 console error, 0 404 CSS, 0 horizontal overflow, 0 regresi visual, 0 CLS/FOUC spike, serta penurunan transfer KB CSS (-72% s/d -94%) & rasio unused CSS lebih rendah.
- **Kontrak Data Eksplisit:** Seluruh 25 berkas di `public/css/components/*.css` lulus lint strict & modular integrity test; laporan perbandingan baseline vs verify hijau.
- **Referensi Pola:** `tests/test-admin-css-modular.js` (baris 118), `tests/test-admin-css-visual-qa.js`.
- **Batasan Negatif:** Dilarang menjalankan tahap Close atau mengubah `.agents/tech/`/`CHANGELOG.md` pada task ini (tahap Close dijalankan pada sesi terpisah sesuai `WORKFLOW.md`).
- **Skill:** `browser-testing-with-devtools`, `code-review-and-quality`.
- **Verifikasi Deterministik:** `npm run lint && npm run lint:views && npm run lint:i18n && node --test tests/test-public-css-modular.js && node --test tests/test-admin-css-modular.js && node tests/test-public-css-visual-qa.js --verify`.
