# Proposal Perubahan: Audit Dead CSS, Refaktor Modular `public/css/components.css`, & Optimasi Performa Pemuatan CSS Publik

**Tanggal:** 2026-11-26  
**Status:** APPROVED & MERGED KE SPEC (Tahap 3 Selesai — Siap Tahap 4: Implement `T-433` s/d `T-453`, 1 sesi = 1 task)  
**Cakupan:** Arsitektur CSS Modular Publik (`public/css/components/*.css`, `public/css/layout.css` dijadwalkan di proposal terpisah berikutnya), Konsolidasi Token (`public/css/tokens.css`), Pemuatan Kondisional (`views/partials/head.ejs` & `views/public/*.ejs`), Isolasi Auth Admin (`views/admin/login.ejs`, `views/admin/403.ejs`), Strict Lint & Migrasi 34 Tes.

---

## 1. Konteks
Audit otomatis terhadap `public/css/components.css` menemukan monolit **10.922 baris (234,88 KB)** yang dimuat secara *render-blocking* di seluruh rute publik maupun halaman auth admin (`login.ejs`, `403.ejs`), dengan **70 class mati terkonfirmasi (~792 baris / ~18 KB)**, **36 duplikat selector dalam konteks `@media`/root yang sama**, **3 komentar historis nomor task**, **433 raw hex** (424 non-komentar: 366 cocok langsung dengan `public/css/tokens.css`, 58 belum bertoken pada 20 nilai unik termasuk 10 variabel `--pd-*` di `:root` inline baris 8158), serta **34 berkas tes** yang masih membaca monolit ini secara langsung.
Refaktor ini memecah monolit menjadi **25 berkas modular <= ~600 baris/berkas** di bawah `public/css/components/*.css` dengan pemuatan kondisional per rute publik (estimasi pemangkasan payload CSS **-72% s/d -94%** per halaman) tanpa bundler berat dan dengan **0 regresi visual** pada viewport `320px`–`1440px` (ID & EN).
Audit juga mengonfirmasi `views/admin/login.ejs` dan `views/admin/403.ejs` masih memuat `tokens.css`, `base.css`, `layout.css`, dan `components.css` karena masing-masing masih bergantung pada 9 dan 7 class utilitas/kartu/badge publik yang belum dipindah ke `public/css/admin/page-auth.css`.

---

## 2. Delta Spesifikasi per Modul

### A. `.agents/tech/conventions.md`
- **Kondisi Lama (Bagian 5.B & 5.C):** Hanya mengatur arsitektur CSS modular untuk Admin CMS (`public/css/admin/*.css` yang dirujuk ke `tech/admin-ui-css.md`), sementara CSS komponen publik masih mengacu secara implisit pada monolit `public/css/components.css`.
- **Kondisi Baru (Bagian 5.B & 5.C):**
  - Tambahkan kontrak **Modularitas CSS Publik**: lembar gaya komponen publik wajib modular di bawah `public/css/components/*.css` dengan batas **<= ~600 baris/berkas**, **zero raw hex** di luar `public/css/tokens.css`, pemuatan kondisional per rute publik via `views/partials/head.ejs`, dan urutan cascade resmi didefinisikan di `tech/public-ui-css.md`.
  - Tegaskan bahwa warna latar publik tetap mematuhi sistem dual-token (`--bg-base` & `--bg-subtle`, dengan pengecualian resmi `--bg-soft-green` khusus `/about` & `/news` per `Design/DESIGN.md`) serta palet hijau tanpa rona biru.
  - Tegaskan larangan memodifikasi perilaku class bersama lintas halaman (`.sec-products`, `.btn-primary`, `.btn-secondary`, `.btn-pill-solid-white`, `.page-hero`, `.plp-card`, `.nwl-card`, `.eu-dd-*`, `.pgn-*`).

### B. `.agents/tech/conventions-lint.md`
- **Kondisi Lama (Bagian 2 & 4):** `DEFAULT_STRICT_PATHS` di `scripts/lint-views.js` mencakup view/partial Admin, `public/css/admin/`, serta view/partial publik hasil refaktor (`index.ejs`, `home/`, `about.ejs`, `about/`, `contact.ejs`, `contact/`). CSS publik belum masuk daftar strict blocking.
- **Kondisi Baru (Bagian 2 & 4):**
  - Daftarkan `'public/css/components/'` ke `DEFAULT_STRICT_PATHS` di `scripts/lint-views.js` sehingga setiap raw hex atau pelanggaran aturan pada berkas CSS modular publik menjadi *blocking error* pada `npm run lint:views`.
  - Pengecualian raw hex pada `scripts/lint-views.js` tetap **eksklusif** hanya pada `public/css/tokens.css` dan `public/css/admin/tokens.css`.

### C. Sub-Modul Baru `.agents/tech/public-ui-css.md` (Mengikuti Pola `tech/admin-ui-css.md`)
- **Kondisi Lama:** Belum ada sub-modul khusus arsitektur CSS komponen publik.
- **Kondisi Baru:** Buat sub-modul baru `tech/public-ui-css.md` (target ~6,5–7,5 KB, maks ~8 KB) berisi 5 bagian:
  1. **Tujuan & Prinsip Arsitektur:**
     - Vanilla CSS modular tanpa bundler berat (Express 4 + EJS SSR + CSP-safe, kompatibel HTTP/1.1 & HTTP/2 di cPanel Passenger).
     - Batas ukuran **<= ~600 baris/berkas** (toleransi keras tes integritas `<= 620` baris).
     - **Zero raw hex** di seluruh `public/css/components/*.css` (wajib token `public/css/tokens.css`).
     - **0 selector mati** (70 class mati permanen dihapus), **0 duplikat selector pada konteks `@media`/root yang sama**, **0 komentar historis nomor task** (`antislop-code`).
     - Monolit `public/css/components.css` dihapus permanen setelah seluruh template & 34 berkas tes dimigrasi dan lolos QA regresi (Keputusan 5a).
  2. **Konsolidasi Token Publik (`public/css/tokens.css`):**
     - Pindahkan blok `:root` lokal milik Product Detail (`--pd-bg`, `--pd-bg-soft`, `--pd-surface`, `--pd-surface-2`, `--pd-ink`, `--pd-ink-2`, `--pd-ink-3`, `--pd-line`, `--pd-line-soft`, `--pd-green`, `--pd-green-hover`, `--pd-green-bright`, `--pd-green-deep`, `--pd-sage`, `--pd-sage-2`, `--pd-radius-lg`, `--pd-shadow`) dari `components.css` ke `public/css/tokens.css`.
     - Tambahkan token turunan semantik/netral terkalibrasi (tanpa rona biru, nilai warna identik visual 100%) untuk 8 nilai warna sah yang belum bertoken:
       - Teks netral terang sekunder (untuk teks muted di latar gelap/border katalog): `--color-text-muted-light`, `--plp-divider`, `--plp-btn-border`.
       - Umpan balik semantik badge & alert (status warning/success/error): `--color-warning-text`, `--color-success-text-deep`, `--color-success-border`, `--color-error-text-deep`, `--color-error-border`.
     - Hilangkan seluruh fallback hex di dalam `var(--token, ...)` (309 kemunculan) termasuk 3 fallback rona biru-slate lama pada `--color-text-main` sehingga 100% merujuk token primer murni.
  3. **Peta Direktori & Urutan Cascade Resmi (25 Berkas di `public/css/components/*.css`):**

| Urutan | Berkas (`public/css/components/...`) | Lapisan | Est. Baris | Prefix / Tanggung Jawab | Dimuat Pada Rute (`pageStyle`) |
| :---: | :--- | :--- | :---: | :--- | :--- |
| 1 | `primitives.css` | Core (Always-On) | ~260 | `.btn*`, `.card*`, `.form-*`, `.badge*`, `.table`, `.alert*` | Semua rute publik |
| 2 | `whatsapp-float.css` | Core (Always-On) | ~130 | `.wa-float-*`, `.wa-icon`, `.wa-tooltip` (`footer.ejs`) | Semua rute publik |
| 3 | `cta-reveal.css` | Core (Always-On) | ~200 | `.sec-cta`, `.cta-*`, `.reveal` + `@media` responsif (`footer.ejs`) | Semua rute publik |
| 4 | `page-hero.css` | Shared Kondisional | ~210 | `.page-hero*`, breadcrumbs subpage & scrim responsif | `about`, `products`, `news`, `contact` |
| 5 | `dropdown.css` | Shared Kondisional | ~480 | `.eu-dd-*`, `@keyframes euDdShimmer` (`admin-dropdown.js`) | `products`, `contact` |
| 6 | `pagination.css` | Shared Kondisional | ~165 | `.pgn-bar*`, `.pgn-nav`, `.pgn-pages`, `.pgn-btn` | `news` |
| 7 | `product-cards.css` | Shared Kondisional | ~450 | `.plp-grid`, `.plp-card*`, `.plp-card-entering`, `.plp-more-wrap`, `.plp-empty*` + `@media` kartu | `products`, `product-detail` |
| 8 | `news-cards.css` | Shared Kondisional | ~320 | `.news-card-v2*`, `.nwl-grid`, `.nwl-card*`, `.nwl-img-placeholder`, `.nwd-related-grid` | `news`, `news-detail` |
| 9 | `home-hero.css` | Halaman (`home`) | ~530 | `.hero`, `.hero-slider*`, `.hero-slide*`, `.hero-bg*`, `.hero-youtube-*`, `.hero-cta-*`, `.hero-explore-*` + `@media` | `home` |
| 10 | `home-intro-categories.css` | Halaman (`home`) | ~380 | `.sec-intro`, `.intro-*`, `.home-intro-*`, `.sec-products`, `.prod-*`, `.hcat-*` + `@media` | `home` |
| 11 | `home-why-choose-us.css` | Halaman (`home`) | ~440 | `.sec-why-us`, `.wcu-*`, `.sec-pillars` + `@media` | `home` |
| 12 | `home-cert-brands.css` | Halaman (`home`) | ~520 | `.sec-evidence`, `.ev-*`, `.cert-*`, `.home-cert-logo`, `.brand-strip-*`, brand zoom modal + `@media` | `home` |
| 13 | `home-news-carousel.css` | Halaman (`home`) | ~350 | `.sec-news`, `.hnc-*` + `@media` | `home` |
| 14 | `products-catalog.css` | Halaman (`products`) | ~560 | `.plp-section/container/layout`, sidebar, toolbar, search, sort, mobile offcanvas drawer & backdrop | `products` |
| 15 | `product-detail-core.css` | Halaman (`product-detail`) | ~440 | `.pd-wrap`, `.pd-card`, `.pd-crumb*`, `.pd-title`, galeri, info produk, meta & chip varian | `product-detail` |
| 16 | `product-detail-specs.css` | Halaman (`product-detail`) | ~420 | `.pd-cta-row`, `.pd-btn*`, tab spesifikasi, tabel ukuran, related tweaks + `@media` | `product-detail` |
| 17 | `about-story.css` | Halaman (`about`) | ~220 | `.abt-cnt-*` (Story & Counter 2x2) | `about` |
| 18 | `about-timeline.css` | Halaman (`about`) | ~540 | `.abt-htl-*` (Vertical History Timeline) | `about` |
| 19 | `about-vision-mission.css` | Halaman (`about`) | ~220 | `.sec-vm`, `.vm-*`, `.abt-vm-*` | `about` |
| 20 | `about-ticket.css` | Halaman (`about`) | ~570 | `.abt-tkt-*` (Expanding T-I-C-K-E-T Accordion) | `about` |
| 21 | `about-gallery.css` | Halaman (`about`) | ~580 | `.sec-gallery`, `.gal-*`, `.abt-gal-*`, `.bento-*` (Bento Mosaic Gallery) | `about` |
| 22 | `news-listing.css` | Halaman (`news`) | ~540 | `.filter-bar`, `.nwl-hero-*`, `.nwl-headline-*`, `.nwl-slide*`, `.nwl-indicator*`, `.nwl-tab-*`, `.nwl-cat-*`, `.nwl-sec-directory*` | `news` |
| 23 | `news-detail.css` | Halaman (`news-detail`) | ~430 | `.nwd-*` (breadcrumb, artikel, prose, share) + `.nwd-swal-*` / `.swal2-*` copy toast | `news-detail` |
| 24 | `contact-page.css` | Halaman (`contact`) | ~450 | `.contact-split*`, `.cf-*` (form RFQ, kantor, peta responsif) | `contact` |
| 25 | `contact-variants.css` | Halaman (`contact`) | ~130 | `.cf-var-*` (pemilih varian produk pada form RFQ) | `contact` |

  4. **Kontrak Pemuatan Template EJS & Isolasi Auth Admin:**
     - `views/partials/head.ejs` memuat 3 berkas Core (`primitives.css`, `whatsapp-float.css`, `cta-reveal.css`) setelah `tokens.css`, `base.css`, `layout.css` (dan `sweetalert2.min.css` bila `useSweetAlert`), lalu memuat berkas kondisional dari peta `PUBLIC_PAGE_STYLES[pageStyle]` (dengan fallback aman berbasis `path` + dukungan opsional `extraPublicStyles`, nesting <= 2 level, query version seragam `?v=20261126-1`).
     - Setiap template `views/public/*.ejs` meneruskan `{ pageStyle: '<key>' }` saat `include('../partials/header', { pageStyle: '...' })`:
       - `index.ejs` -> `'home'` (total 8 berkas, ~60,4 KB vs 234,9 KB = **-74%**)
       - `about.ejs` -> `'about'` (total 9 berkas, ~66,9 KB = **-72%**)
       - `products.ejs` -> `'products'` (total 7 berkas, ~52,1 KB = **-78%**)
       - `product-detail.ejs` -> `'product-detail'` (total 6 berkas, ~41,2 KB = **-82%**)
       - `news.ejs` -> `'news'` (total 7 berkas, ~40,6 KB = **-83%**)
       - `news-detail.ejs` -> `'news-detail'` (total 5 berkas, ~30,8 KB = **-87%**)
       - `contact.ejs` -> `'contact'` (total 7 berkas, ~41,6 KB = **-82%**)
       - `capabilities.ejs` -> `'capabilities'` & `404.ejs` -> `'404'` (hanya 3 berkas Core, ~14,2 KB = **-94%**)
     - `views/admin/login.ejs` & `views/admin/403.ejs` memindahkan aturan utilitas/kartu/badge/brand minimal (~60 baris) ke `public/css/admin/page-auth.css` (tetap ~260 baris <= 600 baris) dan melepas seluruh `<link>` CSS publik (`tokens.css`, `base.css`, `layout.css`, `components.css`) agar 100% terisolasi ke `public/css/admin/*.css` (selaras dengan `tech/admin-ui-css.md` §4).
  5. **Kontrak Pengujian, Hygiene & Performa:**
     - **70 Class Mati yang Dihapus Permanen:** blok legacy Home v1 (`.showcase-card*`, `.showcase-floating-badge`, `.section-journey`, `.metric-stat-*`, `.news-asymmetric-grid`, `.news-card-tall`, `.news-card-horizontal`, `.news-tag-date`, `.news-title-overlay`, `.footer-corp-*`, `.social-icon-btn`, `.social-icons-row`), varian tombol/kartu/tabel/form usang (`.btn-outline`, `.btn-outline-primary`, `.btn-outline-white`, `.btn-ghost`, `.btn-link`, `.btn-white`, `.btn-lg`, `.btn-block`, `.btn-pill-sky`, `.card-header`, `.card-metric`, `.metric-label`, `.metric-val`, `.form-error`, `.table-dense`, `.table-responsive`, `.th-neutral`, `.breadcrumb`, `.eco`), komponen berita/produk/WCU/kontak usang (`.news-headline-*`, `.news-card-v2-excerpt`, `.pill-filter`, `.topic-chip*`, `.share-btn-pill`, `.office-info-card`, `.pillar-card*`, `.wcu-callout*`, `.wcu-anchor-target`, `.wcu-note`, `.spec-table*`, `.brand-tag-eco`, `.media-overlay-pill`, `.cf-field-error`, `.cf-var-hint`, `.plp-chevron`, `.nwl-hidden`, `.vm-list-text`, `.eu-dd-error-msg`). *(Catatan audit: `.hero-slide-image`, `.hero-slide-video`, dan `.nwl-headline-sec` terbukti AKTIF secara dinamis di EJS/JS sehingga DIPERTAHANKAN).*
     - **Helper Tes:** `tests/helpers/readPublicCss.js` mengekspor `PUBLIC_COMPONENT_CSS_FILES`, `readAllPublicComponentsCss()`, `readPublicComponentCss(file)`, dan `readPublicTokensCss()`.
     - **Suite Integritas Modular:** `tests/test-public-css-modular.js` (memverifikasi 25 berkas eksis, <= 620 baris, zero raw hex, zero duplikat konteks `@media`/root sama, zero 70 class mati, token zero-blue di `tokens.css`, validitas `<link href="/css/components/...">` di `head.ejs`, absensi `components.css` di `head.ejs`/`login.ejs`/`403.ejs`).
     - **Suite QA Visual & Performa Playwright:** `tests/test-public-css-visual-qa.js` (mode `--baseline` & `--verify` pada 9 rute publik + `/admin/login` & `/403`, 5 viewport `320/375/768/1024/1440`, ID & EN, 0 console error, 0 404 aset CSS, 0 horizontal overflow, bukti penurunan CSS transferred KB & unused CSS ratio, 0 CLS/FOUC spike).

---

## 3. Keputusan Terkunci (Disetujui Azis pada 2026-11-26)

| No | Topik Keputusan | Pilihan Terkunci | Ringkasan Ketetapan |
| :---: | :--- | :---: | :--- |
| 1 | Cakupan Target File Refaktor | **Opsi C (1c)** | Fokus penuh pada `public/css/components.css` pada siklus ini; `public/css/layout.css` (1.598 baris) dievaluasi di proposal terpisah berikutnya. |
| 2 | Struktur Direktori & Strategi Pemuatan | **Opsi A (2a)** | Direktori `public/css/components/*.css` (25 berkas <= ~600 baris) dengan pemuatan kondisional per rute di `views/partials/head.ejs` (3 Core Always-On + modul spesifik rute berbasis `pageStyle` & fallback `path`), tanpa bundler berat. |
| 3 | Penanganan 433 Raw Hex | **Opsi A (3a)** | Zero raw hex penuh pada seluruh berkas modular baru: pindahkan blok `:root --pd-*` ke `public/css/tokens.css`, tambahkan 8 token turunan semantik/netral (tanpa rona biru), dan hapus seluruh fallback hex di `var(--token, ...)`. |
| 4 | Isolasi `views/admin/login.ejs` & `403.ejs` | **Opsi A (4a)** | Migrasikan 9 class utilitas/kartu/brand (`login.ejs`) & 7 class utilitas/badge (`403.ejs`) secara ter-scope ke `public/css/admin/page-auth.css` (~260 baris), lalu hapus seluruh `<link>` CSS publik (`tokens.css`, `base.css`, `layout.css`, `components.css`) dari kedua berkas. |
| 5 | Nasib Monolit `public/css/components.css` | **Opsi A (5a)** | Hapus permanen pada `T-453` setelah seluruh template & 34 berkas tes dimigrasi dan diverifikasi lulus. |
| 6 | Acceptance Criteria Performa & Visual | **Opsi A (6a)** | Pengukuran Playwright penuh (transfer KB CSS per rute sebelum vs sesudah, jumlah request CSS, rasio unused CSS via CDP coverage, 0 CLS/FOUC spike, 0 console error, 0 404 CSS, 0 horizontal overflow di `320px`–`1440px` ID & EN). |

---

## 4. Rencana Task Atomik (Medium-Ready, Mulai dari `T-433`)

> Seluruh task didesain agar **1 sesi baru = 1 task atomik** dengan context budget < 2.000 baris fokus. Dilarang men-dump utuh `public/css/components.css` ke konteks; gunakan `ctx_execute` atau pembacaan rentang baris terarah.

---

### `T-433` — Buat Suite Baseline Visual & Metrik Performa Playwright Publik `[Tier: Argon Medium]`
- **File Terdampak (1):** `tests/test-public-css-visual-qa.js` (baru).
- **Langkah Bernomor:**
  1. Buat `tests/test-public-css-visual-qa.js` mendukung argumen CLI `--baseline` dan `--verify` (output laporan JSON & screenshot sementara ke `/tmp/euodoo-public-css-qa/` agar tidak mengotori repo).
  2. Definisikan daftar rute target: `/`, `/about`, `/products`, `/products/<slug-aktif-pertama>`, `/capabilities`, `/news`, `/news/<slug-aktif-pertama>`, `/contact`, `/halaman-tidak-ada-404`, `/admin/login`, `/403` (via sesi editor atau simulasi rute 403).
  3. Iterasi pada 5 viewport (`320x700`, `375x812`, `768x1024`, `1024x768`, `1440x900`) untuk bahasa `id` dan `en` (`?lang=en` pada rute publik).
  4. Rekam per rute: (a) 0 console error, (b) 0 status >= 400 pada resource `.css`, (c) 0 horizontal overflow (`scrollWidth <= innerWidth`), (d) total byte & jumlah request stylesheet CSS yang diunduh, (e) estimasi unused CSS ratio via CDP `CSS.startRuleUsageTracking`, (f) nilai CLS via `PerformanceObserver`, dan (g) snapshot visual elemen kunci.
  5. Jalankan `node tests/test-public-css-visual-qa.js --baseline` melawan server lokal aktif untuk mengunci metrik awal (`components.css` = 234,88 KB global).
- **Kontrak Data Eksplisit:** Output `/tmp/euodoo-public-css-qa/baseline.json` berisi `{ routes: { [route]: { cssRequests, cssBytes, unusedRatio, cls, overflow, consoleErrors, css404 } } }`.
- **Referensi Pola:** `tests/test-admin-css-visual-qa.js` (pola Playwright multi-viewport).
- **Batasan Negatif:** Dilarang memodifikasi `public/css/*`, `views/*`, atau menyimpan artefak screenshot ke direktori repo git.
- **Skill:** `browser-testing-with-devtools`.
- **Verifikasi Deterministik:** `npm run lint` && `node tests/test-public-css-visual-qa.js --baseline`.

---

### `T-434` — Konsolidasi Token Publik (`--pd-*` & Token Turunan Semantik/Netral) di `public/css/tokens.css` `[Tier: Argon Medium]`
- **File Terdampak (2):** `public/css/tokens.css`, `Design/DESIGN.md`.
- **Langkah Bernomor:**
  1. Baca blok `:root` baris 8158–8177 pada `public/css/components.css` (rentang terbatas 20 baris) dan pindahkan seluruh 17 token `--pd-*` ke bagian baru `/* Product Detail Surface & Ink Tokens */` di `public/css/tokens.css`.
  2. Tambahkan 8 token turunan baru di `public/css/tokens.css` dengan nilai warna **100% identik** dengan nilai existing di `components.css` (tanpa rona biru): `--color-text-muted-light`, `--plp-divider`, `--plp-btn-border`, `--color-warning-text`, `--color-success-text-deep`, `--color-success-border`, `--color-error-text-deep`, `--color-error-border`.
  3. Dokumentasikan daftar token turunan baru tersebut secara ringkas di `Design/DESIGN.md`.
- **Kontrak Data Eksplisit:** Nama token wajib tersedia di `:root` `public/css/tokens.css`: `--pd-bg`, `--pd-bg-soft`, `--pd-surface`, `--pd-surface-2`, `--pd-ink`, `--pd-ink-2`, `--pd-ink-3`, `--pd-line`, `--pd-line-soft`, `--pd-green`, `--pd-green-hover`, `--pd-green-bright`, `--pd-green-deep`, `--pd-sage`, `--pd-sage-2`, `--pd-radius-lg`, `--pd-shadow`, `--color-text-muted-light`, `--plp-divider`, `--plp-btn-border`, `--color-warning-text`, `--color-success-text-deep`, `--color-success-border`, `--color-error-text-deep`, `--color-error-border`.
- **Referensi Pola:** `public/css/tokens.css` (seksi `/* Turunan Semantik Resmi */`), `public/css/admin/tokens.css`.
- **Batasan Negatif:** Dilarang mengubah nilai token existing di `public/css/tokens.css`, dilarang menambah warna biru (hue 190°–255° saturasi tinggi), dilarang mengubah `public/css/components.css` pada task ini.
- **Skill:** `antislop-ui`.
- **Verifikasi Deterministik:** `npm run lint:views` && `node -e "const fs=require('fs'),c=fs.readFileSync('public/css/tokens.css','utf8');for(const t of ['--pd-bg','--pd-ink','--plp-btn-border','--color-warning-text','--color-success-border','--color-error-border'])if(!c.includes(t))throw new Error('Missing '+t);console.log('OK')"`.

---

### `T-435` — Pembersihan 70 Class Mati, 36 Duplikat Konteks Sama & Komentar Historis di `public/css/components.css` `[Tier: Argon Medium]`
- **File Terdampak (1):** `public/css/components.css`.
- **Langkah Bernomor:**
  1. Jalankan verifikasi programmatic via `ctx_execute` untuk memastikan seluruh 70 class mati (daftar di `tech/public-ui-css.md` §5) memang tidak dipakai di `views/**/*.ejs` maupun `public/js/**/*.js` (kecuali `.hero-slide-image`, `.hero-slide-video`, `.nwl-headline-sec` yang WAJIB dipertahankan).
  2. Hapus blok legacy Home v1 (baris 638–1031: `.showcase-card*`, `.section-journey`, `.metric-stat-*`, `.news-asymmetric-grid`, `.news-card-tall/horizontal`, `.footer-corp-*`, `.social-icon*`, serta deklarasi awal `.btn-pill-*` & `.hero-explore-*` yang sudah ditimpa di bawahnya) dan seluruh aturan milik 70 class mati lainnya.
  3. Gabungkan/deduplikasi seluruh **36 duplikat `(context, selector)`** (mis. `.btn-primary/secondary` L1 vs L64/91, `.form-textarea`, `.btn-see-more:focus-visible`, `.hero-bg img`, `.hero-slides-wrapper`/`.hero-slide` di `@media 1024/768/480`, `.abt-htl-card` reduced-motion, `.abt-tkt-panel.is-active .abt-tkt-baseline`, `.sec-gallery .abt-gal-tile--pos-1..6`, `.cf-textarea`/`.cf-select`, `.cf-maps-wrap`, `.nwd-prose th`) dengan mempertahankan deklarasi pemenang cascade akhir.
  4. Hapus blok `:root` inline milik `--pd-*` (sudah dipindah ke `tokens.css` di `T-434`) dan bersihkan 3 komentar historis nomor task (`T-262`, `T-326`, dsb.) sesuai `antislop-code`.
- **Kontrak Data Eksplisit:** Setelah task ini, `public/css/components.css` memiliki **0** dari 70 class mati, **0** duplikat `(context, selector)`, dan **0** blok `:root`.
- **Referensi Pola:** `tests/test-admin-css-modular.js` (`collectSelectorEntries` & `hasDeadClassToken`).
- **Batasan Negatif:** Dilarang memodifikasi properti visual class aktif mana pun; dilarang menghapus `.hero-slide-image`, `.hero-slide-video`, `.nwl-headline-sec`, `.hcat-grid--1..4`, `.abt-cnt-card--q1..4`, `.abt-gal-tile--pos-1..6`, `.bento-tile--pos-1..6`, `.swal2-*`, atau `.eu-dd--*`.
- **Skill:** `antislop-code`.
- **Verifikasi Deterministik:** Skrip `ctx_execute` cek 0 duplikat `(context, selector)` & 0 dari 70 class mati pada `public/css/components.css` && `npm run lint:views`.

---

### `T-436` — Ekstraksi Layer Core Always-On (`primitives.css`, `whatsapp-float.css`, `cta-reveal.css`) `[Tier: Argon Medium]`
- **File Terdampak (3):** `public/css/components/primitives.css`, `public/css/components/whatsapp-float.css`, `public/css/components/cta-reveal.css` (semua baru).
- **Langkah Bernomor:**
  1. Ekstrak blok primitives aktif (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-sm`, `.btn-md`, `.btn-pill-solid-white`, `.btn-pill-white`, `.btn-see-more`, `.card`, `.card-body`, `.card-footer`, `.card-interactive`, `.form-group/label/label-required/control/select/textarea`, `.badge*`, `.table`, `.alert*`) ke `public/css/components/primitives.css` (target <= ~300 baris).
  2. Ekstrak blok floating WhatsApp (`.wa-float-*`, `.wa-icon`, `.wa-tooltip`) ke `public/css/components/whatsapp-float.css` (target <= ~150 baris).
  3. Ekstrak blok CTA global & animasi reveal (`.sec-cta`, `.cta-*`, `.reveal`, `.reveal.visible` beserta aturan `@media` milik `.sec-cta`/`.cta-*` dari blok responsif) ke `public/css/components/cta-reveal.css` (target <= ~220 baris).
  4. Ganti seluruh raw hex (termasuk fallback `var(--token, ...)`) dengan token resmi dari `public/css/tokens.css`.
- **Kontrak Data Eksplisit:** 3 berkas baru di `public/css/components/`, masing-masing <= 600 baris, 0 raw hex, 0 duplikat selector.
- **Referensi Pola:** `public/css/admin/buttons.css`, `public/css/admin/forms-inputs.css`, `tech/public-ui-css.md` §3.
- **Batasan Negatif:** Belum mengubah `views/partials/head.ejs` dan belum menghapus `public/css/components.css`; dilarang mengubah nilai warna atau dimensi visual.
- **Skill:** `antislop-ui`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/components/primitives.css public/css/components/whatsapp-float.css public/css/components/cta-reveal.css` (0 error, 0 warning).

---

### `T-437` — Ekstraksi Komponen Bersama Kondisional Bagian 1 (`page-hero.css`, `dropdown.css`, `pagination.css`) `[Tier: Argon Medium]`
- **File Terdampak (3):** `public/css/components/page-hero.css`, `public/css/components/dropdown.css`, `public/css/components/pagination.css` (semua baru).
- **Langkah Bernomor:**
  1. Ekstrak blok `.page-hero*` & subpage breadcrumbs + scrim responsif ke `public/css/components/page-hero.css` (target <= ~230 baris).
  2. Ekstrak blok `.eu-dd-*` & `@keyframes euDdShimmer` ke `public/css/components/dropdown.css` (target <= ~500 baris).
  3. Ekstrak blok `.pgn-*` ke `public/css/components/pagination.css` (target <= ~180 baris).
  4. Petakan seluruh raw hex & fallback hex ke token `public/css/tokens.css`.
- **Kontrak Data Eksplisit:** 3 berkas di `public/css/components/`, masing-masing <= 600 baris, 0 raw hex, 0 komentar task historis.
- **Referensi Pola:** `public/css/admin/dropdown.css`, `public/css/admin/pagination.css`.
- **Batasan Negatif:** Dilarang mengubah perilaku `.eu-dd-*` atau menyentuh `public/css/admin/dropdown.css` & `public/css/admin/pagination.css`.
- **Skill:** `antislop-ui`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/components/page-hero.css public/css/components/dropdown.css public/css/components/pagination.css`.

---

### `T-438` — Ekstraksi Komponen Bersama Kondisional Bagian 2 (`product-cards.css`, `news-cards.css`) `[Tier: Argon Medium]`
- **File Terdampak (2):** `public/css/components/product-cards.css`, `public/css/components/news-cards.css` (keduanya baru).
- **Langkah Bernomor:**
  1. Ekstrak seluruh aturan kartu & grid produk lintas halaman (`/products` & `/products/<slug>` related products): `.plp-grid`, `.plp-card*`, `.plp-card-entering`, `.plp-more-wrap`, `.plp-pagination*`, `.plp-empty*` beserta aturan `@media` responsif kartu ke `public/css/components/product-cards.css` (target <= ~480 baris).
  2. Ekstrak seluruh aturan kartu & grid berita lintas halaman (`/news` & `/news/<slug>` related articles): `.news-card-v2*`, `.nwl-grid`, `.nwl-card*`, `.nwl-img-placeholder`, `.nwd-related-grid` + `@media` kartu ke `public/css/components/news-cards.css` (target <= ~360 baris).
  3. Petakan seluruh raw hex & fallback hex ke token `public/css/tokens.css` (termasuk `--plp-btn-border`).
- **Kontrak Data Eksplisit:** Seluruh selector `.plp-grid`/`.plp-card*` dan `.nwl-grid`/`.nwl-card*`/`.news-card-v2*` terpusat pada 2 berkas ini (tanpa duplikasi di `products-catalog.css`, `product-detail-*.css`, `news-listing.css`, atau `news-detail.css`).
- **Referensi Pola:** `tech/public-ui-css.md` §3, `views/partials/news-card.ejs`, `views/public/partials/product-card-fragment.ejs`.
- **Batasan Negatif:** Dilarang mengubah rasio gambar kartu 1:1 mobile atau tap target 44px pada `.plp-card-btn`.
- **Skill:** `antislop-ui`, `antislop-layoutmobile`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/components/product-cards.css public/css/components/news-cards.css`.

---

### `T-439` — Ekstraksi Modul Homepage Bagian 1 (`home-hero.css`, `home-intro-categories.css`, `home-why-choose-us.css`) `[Tier: Argon Medium]`
- **File Terdampak (3):** `public/css/components/home-hero.css`, `public/css/components/home-intro-categories.css`, `public/css/components/home-why-choose-us.css` (semua baru).
- **Langkah Bernomor:**
  1. Ekstrak blok Hero Slider (`.hero`, `.hero-slider*`, `.hero-slides-wrapper`, `.hero-slide*` termasuk `.hero-slide-image`/`.hero-slide-video`, `.hero-bg*`, `.hero-youtube-*`, `.hero-cta-*`, `.hero-explore-*`) beserta aturan `@media` hero dari blok responsif ke `public/css/components/home-hero.css` (target <= ~560 baris).
  2. Ekstrak blok Intro & Kategori Utama (`.sec-intro`, `.intro-*`, `.home-intro-*`, `.sec-products`, `.prod-*`, `.hcat-*`, `.hcat-grid--1..4`) beserta aturan `@media` ke `public/css/components/home-intro-categories.css` (target <= ~410 baris).
  3. Ekstrak blok Why Choose Us (`.sec-why-us`, `.wcu-*`, `.sec-pillars`) beserta aturan `@media` & `prefers-reduced-motion` ke `public/css/components/home-why-choose-us.css` (target <= ~460 baris).
  4. Ganti seluruh raw hex & fallback hex dengan token `public/css/tokens.css`.
- **Kontrak Data Eksplisit:** Urutan `@media` (`1024px` -> `860px` -> `768px` -> `480px`) di tiap berkas identik dengan urutan cascade asal.
- **Referensi Pola:** `public/css/admin/page-home.css`, `views/partials/home/hero-slide.ejs`.
- **Batasan Negatif:** Homepage DIBEKUKAN secara visual; dilarang mengubah overlay scrim hero, animasi, tinggi hero, atau warna token; dilarang menyentuh `views/public/index.ejs`.
- **Skill:** `antislop-ui`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/components/home-hero.css public/css/components/home-intro-categories.css public/css/components/home-why-choose-us.css`.

---

### `T-440` — Ekstraksi Modul Homepage Bagian 2 (`home-cert-brands.css`, `home-news-carousel.css`) `[Tier: Argon Medium]`
- **File Terdampak (2):** `public/css/components/home-cert-brands.css`, `public/css/components/home-news-carousel.css` (keduanya baru).
- **Langkah Bernomor:**
  1. Ekstrak blok Sertifikasi & Brand Marquee (`.sec-evidence`, `.ev-*`, `.cert-*`, `.home-cert-logo`, `.brand-strip-*`, brand zoom preview modal, `@keyframes` marquee) beserta aturan `@media` ke `public/css/components/home-cert-brands.css` (target <= ~550 baris).
  2. Ekstrak blok Home News Carousel (`.sec-news`, `.hnc-*`) beserta aturan `@media` ke `public/css/components/home-news-carousel.css` (target <= ~370 baris).
  3. Ganti seluruh raw hex & fallback hex dengan token `public/css/tokens.css`.
- **Kontrak Data Eksplisit:** 2 berkas <= 600 baris, 0 raw hex, seluruh `@keyframes` marquee & carousel tetap utuh.
- **Referensi Pola:** `views/partials/home/brands-marquee.ejs`, `views/partials/home/news.ejs`.
- **Batasan Negatif:** Dilarang mengubah kecepatan animasi marquee, ukuran logo sertifikasi, atau struktur kartu carousel berita Homepage.
- **Skill:** `antislop-ui`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/components/home-cert-brands.css public/css/components/home-news-carousel.css`.

---

### `T-441` — Ekstraksi Modul Katalog & Detail Produk (`products-catalog.css`, `product-detail-core.css`, `product-detail-specs.css`) `[Tier: Argon Medium]`
- **File Terdampak (3):** `public/css/components/products-catalog.css`, `public/css/components/product-detail-core.css`, `public/css/components/product-detail-specs.css` (semua baru).
- **Langkah Bernomor:**
  1. Ekstrak aturan non-kartu PLP (`.plp-section`, `.plp-container`, `.plp-layout`, sidebar, toolbar, search, sort, offcanvas drawer mobile, backdrop, filter trigger, `@media` layout/toolbar) ke `public/css/components/products-catalog.css` (target <= ~580 baris).
  2. Ekstrak blok atas Product Detail (`.pd-wrap`, `.pd-card`, `.pd-crumb*`, `.pd-title`, galeri & thumbnail, info & meta varian produk) ke `public/css/components/product-detail-core.css` (target <= ~460 baris).
  3. Ekstrak blok bawah Product Detail (`.pd-cta-row`, `.pd-btn*`, tab spesifikasi, tabel ukuran, related section, `.pd-gallery-track`, `@media` PDP) ke `public/css/components/product-detail-specs.css` (target <= ~450 baris).
  4. Ganti seluruh raw hex & fallback hex (termasuk `var(--pd-*, ...)` & `--plp-divider`) dengan token murni dari `public/css/tokens.css`.
- **Kontrak Data Eksplisit:** Tidak ada blok `.cf-var-*` di berkas PDP (dipindah ke `contact-variants.css` di `T-444`), dan tidak ada duplikat `.plp-grid`/`.plp-card*` (sudah di `product-cards.css`).
- **Referensi Pola:** `public/css/admin/page-catalog.css`, `public/css/admin/page-product-editors.css`.
- **Batasan Negatif:** Dilarang menyentuh `public/css/lightbox.css` atau mengubah layout tabel ukuran/varian PDP.
- **Skill:** `antislop-ui`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/components/products-catalog.css public/css/components/product-detail-core.css public/css/components/product-detail-specs.css`.

---

### `T-442` — Ekstraksi Modul About Bagian 1 (`about-story.css`, `about-timeline.css`, `about-vision-mission.css`) `[Tier: Argon Medium]`
- **File Terdampak (3):** `public/css/components/about-story.css`, `public/css/components/about-timeline.css`, `public/css/components/about-vision-mission.css` (semua baru).
- **Langkah Bernomor:**
  1. Ekstrak blok Story & Counter 2x2 (`.abt-cnt-*`, `.abt-cnt-card--q1..4`) ke `public/css/components/about-story.css` (target <= ~240 baris).
  2. Ekstrak blok Vertical History Timeline (`.abt-htl-*`) ke `public/css/components/about-timeline.css` (target <= ~560 baris).
  3. Ekstrak blok Vision & Mission (`.sec-vm`, `.vm-*`, `.abt-vm-*`) ke `public/css/components/about-vision-mission.css` (target <= ~240 baris).
  4. Ganti seluruh raw hex & fallback hex dengan token `public/css/tokens.css` (jaga permukaan `--bg-soft-green` & `--color-text-muted-on-soft`).
- **Kontrak Data Eksplisit:** 3 berkas <= 600 baris, 0 raw hex, 0 duplikat selector.
- **Referensi Pola:** `public/css/admin/page-about.css`, `views/partials/about/story-counter.ejs`.
- **Batasan Negatif:** Dilarang mengubah `tabular-nums`, animasi counter, atau warna permukaan `--bg-soft-green` di `/about`.
- **Skill:** `antislop-ui`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/components/about-story.css public/css/components/about-timeline.css public/css/components/about-vision-mission.css`.

---

### `T-443` — Ekstraksi Modul About Bagian 2 (`about-ticket.css`, `about-gallery.css`) `[Tier: Argon Medium]`
- **File Terdampak (2):** `public/css/components/about-ticket.css`, `public/css/components/about-gallery.css` (keduanya baru).
- **Langkah Bernomor:**
  1. Ekstrak blok Expanding T-I-C-K-E-T Accordion (`.abt-tkt-*`) ke `public/css/components/about-ticket.css` (target <= ~585 baris).
  2. Ekstrak blok Bento Mosaic Gallery (`.sec-gallery`, `.gal-*`, `.abt-gal-*`, `.bento-*` termasuk `.bento-grid` & aturan `@media` galeri dari blok responsif) ke `public/css/components/about-gallery.css` (target <= ~595 baris).
  3. Ganti seluruh raw hex & fallback hex dengan token `public/css/tokens.css`.
- **Kontrak Data Eksplisit:** Kedua berkas <= 600 baris (jika salah satu mendekati > 590 baris, rapikan baris kosong berlebih tanpa mengorbankan keterbacaan atau pecah utilitas responsif dengan persetujuan).
- **Referensi Pola:** `views/partials/about/ticket-accordion.ejs`, `views/partials/about/gallery-bento.ejs`.
- **Batasan Negatif:** Dilarang mengubah aturan konflik Anime.js pada `.sec-gallery` atau perilaku expand/collapse `.abt-tkt-panel.is-active`.
- **Skill:** `antislop-ui`, `antislop-layoutmobile`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/components/about-ticket.css public/css/components/about-gallery.css`.

---

### `T-444` — Ekstraksi Modul Berita & Kontak (`news-listing.css`, `news-detail.css`, `contact-page.css`, `contact-variants.css`) `[Tier: Argon Medium]`
- **File Terdampak (4):** `public/css/components/news-listing.css`, `public/css/components/news-detail.css`, `public/css/components/contact-page.css`, `public/css/components/contact-variants.css` (semua baru).
- **Langkah Bernomor:**
  1. Ekstrak blok News Listing non-kartu (`.filter-bar`, `.nwl-hero-*`, `.nwl-headline-*`, `.nwl-slide*`, `.nwl-indicator*`, `.nwl-tab-*`, `.nwl-cat-*`, `.nwl-sec-directory*`) ke `public/css/components/news-listing.css` (target <= ~560 baris).
  2. Ekstrak blok News Detail (`.nwd-*`) dan copy-link toast (`.nwd-swal-*`, `.swal2-popup.nwd-swal-popup*`) ke `public/css/components/news-detail.css` (target <= ~450 baris).
  3. Ekstrak blok Contact Split & Form/Locations (`.contact-split*`, `.cf-*` kecuali `.cf-var-*`) ke `public/css/components/contact-page.css` (target <= ~460 baris).
  4. Ekstrak blok pemilih varian RFQ (`.cf-var-*`) ke `public/css/components/contact-variants.css` (target <= ~140 baris).
  5. Petakan seluruh raw hex & fallback hex ke token `public/css/tokens.css`.
- **Kontrak Data Eksplisit:** Seluruh 25 berkas di `public/css/components/*.css` lengkap, masing-masing <= 600 baris, 0 raw hex, 0 duplikat selector lintas 25 berkas.
- **Referensi Pola:** `views/public/news.ejs`, `views/public/news-detail.ejs`, `views/partials/contact/rfq-variants-picker.ejs`.
- **Batasan Negatif:** Dilarang menduplikasi `.nwl-grid`/`.nwl-card*` (sudah di `news-cards.css`) atau menyentuh `public/js/contact.js` & `public/js/news-detail.js`.
- **Skill:** `antislop-ui`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/components/news-listing.css public/css/components/news-detail.css public/css/components/contact-page.css public/css/components/contact-variants.css` && cek total jumlah berkas di `public/css/components/` = 25 berkas.

---

### `T-445` — Pemuatan Kondisional `PUBLIC_PAGE_STYLES` di `views/partials/head.ejs` & Aktivasi Batch 1 (`index`, `about`, `capabilities`) `[Tier: Argon Medium]`
- **File Terdampak (4):** `views/partials/head.ejs`, `views/public/index.ejs`, `views/public/about.ejs`, `views/public/capabilities.ejs`.
- **Langkah Bernomor:**
  1. Pada `views/partials/head.ejs`, ganti `<link rel="stylesheet" href="/css/components.css?v=...">` dengan 3 link Core Always-On (`primitives.css`, `whatsapp-float.css`, `cta-reveal.css`) berversi `?v=20261126-1`.
  2. Tambahkan peta `PUBLIC_PAGE_STYLES` (meniru `PAGE_STYLES` di `views/partials/admin-header.ejs`, nesting <= 2 level) untuk kunci `'home'`, `'about'`, `'products'`, `'product-detail'`, `'capabilities'`, `'news'`, `'news-detail'`, `'contact'`, `'404'`, lengkap dengan fallback resolusi dari `path` jika `pageStyle` tidak diteruskan + dukungan array opsional `extraPublicStyles`.
  3. Perbarui pemanggilan header di `views/public/index.ejs` (`{ pageStyle: 'home' }`), `views/public/about.ejs` (`{ pageStyle: 'about' }`), dan `views/public/capabilities.ejs` (`{ pageStyle: 'capabilities' }`).
- **Kontrak Data Eksplisit:**
  - `home` -> `['home-hero.css', 'home-intro-categories.css', 'home-why-choose-us.css', 'home-cert-brands.css', 'home-news-carousel.css']`
  - `about` -> `['page-hero.css', 'about-story.css', 'about-timeline.css', 'about-vision-mission.css', 'about-ticket.css', 'about-gallery.css']`
  - `products` -> `['page-hero.css', 'dropdown.css', 'product-cards.css', 'products-catalog.css']`
  - `product-detail` -> `['product-cards.css', 'product-detail-core.css', 'product-detail-specs.css']`
  - `news` -> `['page-hero.css', 'pagination.css', 'news-cards.css', 'news-listing.css']`
  - `news-detail` -> `['news-cards.css', 'news-detail.css']`
  - `contact` -> `['page-hero.css', 'dropdown.css', 'contact-page.css', 'contact-variants.css']`
  - `capabilities`, `404` -> `[]` (hanya 3 Core Always-On).
- **Referensi Pola:** `views/partials/admin-header.ejs` (baris 38–65).
- **Batasan Negatif:** Dilarang mengubah teks, i18n, meta SEO, urutan `tokens.css`/`base.css`/`layout.css`/`sweetalert2.min.css`/`photoswipe.css`/`lightbox.css`, atau menambah `<script>`/`style="..."` inline.
- **Skill:** `frontend-ui-engineering`.
- **Verifikasi Deterministik:** `npm run lint:views` && `npm run lint:i18n`.

---

### `T-446` — Aktivasi Eksplisit `pageStyle` di View Publik Batch 2 (`products.ejs`, `product-detail.ejs`, `news.ejs`) `[Tier: Hydrogen Medium]`
- **File Terdampak (3):** `views/public/products.ejs`, `views/public/product-detail.ejs`, `views/public/news.ejs`.
- **Langkah Bernomor:**
  1. Perbarui `include('../partials/header')` pada `views/public/products.ejs` menjadi `include('../partials/header', { pageStyle: 'products' })`.
  2. Perbarui pada `views/public/product-detail.ejs` menjadi `include('../partials/header', { pageStyle: 'product-detail' })`.
  3. Perbarui pada `views/public/news.ejs` menjadi `include('../partials/header', { pageStyle: 'news' })`.
- **Kontrak Data Eksplisit:** Kunci `pageStyle` sesuai peta `PUBLIC_PAGE_STYLES` di `views/partials/head.ejs`.
- **Referensi Pola:** `views/public/index.ejs` (hasil `T-445`).
- **Batasan Negatif:** Dilarang mengubah markup HTML, partial include lain, atau logika EJS di ketiga berkas.
- **Skill:** `frontend-ui-engineering`.
- **Verifikasi Deterministik:** `npm run lint:views` && `npm run lint:i18n`.

---

### `T-447` — Aktivasi Eksplisit `pageStyle` di View Publik Batch 3 (`news-detail.ejs`, `contact.ejs`, `404.ejs`) `[Tier: Hydrogen Medium]`
- **File Terdampak (3):** `views/public/news-detail.ejs`, `views/public/contact.ejs`, `views/public/404.ejs`.
- **Langkah Bernomor:**
  1. Perbarui `include('../partials/header')` pada `views/public/news-detail.ejs` menjadi `include('../partials/header', { pageStyle: 'news-detail' })`.
  2. Perbarui pada `views/public/contact.ejs` menjadi `include('../partials/header', { pageStyle: 'contact' })`.
  3. Perbarui pada `views/public/404.ejs` menjadi `include('../partials/header', { pageStyle: '404' })`.
- **Kontrak Data Eksplisit:** Kunci `pageStyle` sesuai peta `PUBLIC_PAGE_STYLES` di `views/partials/head.ejs`.
- **Referensi Pola:** `views/public/index.ejs` (hasil `T-445`).
- **Batasan Negatif:** Dilarang mengubah markup HTML, `useSweetAlert`, atau teks/i18n di ketiga berkas.
- **Skill:** `frontend-ui-engineering`.
- **Verifikasi Deterministik:** `npm run lint:views` && `npm run lint:i18n`.

---

### `T-448` — Isolasi Penuh `views/admin/login.ejs` & `views/admin/403.ejs` ke `public/css/admin/page-auth.css` `[Tier: Argon Medium]`
- **File Terdampak (3):** `public/css/admin/page-auth.css`, `views/admin/login.ejs`, `views/admin/403.ejs`.
- **Langkah Bernomor:**
  1. Tambahkan aturan ter-scope di `public/css/admin/page-auth.css` (menggunakan token `public/css/admin/tokens.css`, 0 raw hex) untuk menggantikan ketergantungan CSS publik yang ditemukan pada audit:
     - Untuk `login.ejs`: styling kartu (`.adm-login-card`, `.adm-login-card-body`, `.adm-login-card-footer`), tanda wajib label (`.adm-login-body .form-label-required::after`), perataan teks (`.adm-login-text-center`), serta fallback brand logo/badge (`.adm-login-brand-name`, `.adm-login-brand-badge`, `.adm-login-fallback`) + reset box-sizing/font dasar halaman standalone auth.
     - Untuk `403.ejs`: layout header flex (`.err403-header-inner`, `.err403-header-group`), pill badge (`.err403-badge`), serta reset box-sizing/font dasar halaman standalone 403.
  2. Perbarui class elemen terkait di `views/admin/login.ejs` dan `views/admin/403.ejs`, lalu hapus 4 tag `<link>` CSS publik (`/css/tokens.css`, `/css/base.css`, `/css/layout.css`, `/css/components.css`) dari kedua berkas sehingga hanya memuat subset `public/css/admin/*.css` sesuai `tech/admin-ui-css.md` §4.
  3. Verifikasi `public/css/admin/page-auth.css` tetap <= ~300 baris (jauh di bawah batas 600 baris) dan lulus `tests/test-admin-css-modular.js`.
- **Kontrak Data Eksplisit:** `login.ejs` hanya memuat `admin/{tokens,buttons,forms-inputs,page-auth}.css`; `403.ejs` hanya memuat `admin/{tokens,buttons,page-auth}.css`.
- **Referensi Pola:** `tech/admin-ui-css.md` §4, `public/css/admin/page-auth.css`.
- **Batasan Negatif:** Dilarang mengubah struktur form CSRF/validasi di `login.ejs`, dilarang menambah raw hex, dilarang mengubah file admin CSS lain selain `page-auth.css`.
- **Skill:** `antislop-ui`.
- **Verifikasi Deterministik:** `npm run lint:views` && `node --test tests/test-admin-css-modular.js`.

---

### `T-449` — Buat `tests/helpers/readPublicCss.js`, Suite `tests/test-public-css-modular.js`, & Strict Lint `scripts/lint-views.js` `[Tier: Argon Medium]`
- **File Terdampak (3):** `tests/helpers/readPublicCss.js` (baru), `tests/test-public-css-modular.js` (baru), `scripts/lint-views.js`.
- **Langkah Bernomor:**
  1. Buat `tests/helpers/readPublicCss.js` mengekspor `PUBLIC_COMPONENT_CSS_FILES` (urutan cascade resmi 25 berkas), `readPublicTokensCss()`, `readPublicComponentCss(file)`, dan `readAllPublicComponentsCss()`.
  2. Daftarkan `'public/css/components/'` ke array `DEFAULT_STRICT_PATHS` di `scripts/lint-views.js`.
  3. Buat `tests/test-public-css-modular.js` yang memverifikasi 6 kontrak integritas: (a) tepat 25 berkas di `public/css/components/` & tiap berkas <= 620 baris, (b) 0 raw hex di luar `public/css/tokens.css`, (c) 0 duplikat `(context, selector)` lintas 25 berkas, (d) token fondasi palet hijau zero-blue utuh di `public/css/tokens.css`, (e) 0 dari 70 class mati eksis di 25 berkas, (f) seluruh referensi CSS di `views/partials/head.ejs` menunjuk berkas valid dan 0 referensi `/css/components.css` di `head.ejs`, `login.ejs`, maupun `403.ejs`. *(Pengecekan absensi file `public/css/components.css` diaktifkan pada `T-453` setelah 34 tes selesai dimigrasi).*
- **Kontrak Data Eksplisit:** Ekspor ESM `PUBLIC_COMPONENT_CSS_FILES`, `readPublicTokensCss`, `readPublicComponentCss`, `readAllPublicComponentsCss`.
- **Referensi Pola:** `tests/helpers/readAdminCss.js`, `tests/test-admin-css-modular.js`.
- **Batasan Negatif:** Dilarang menghapus `public/css/components.css` pada task ini (menunggu migrasi 34 tes di `T-450`–`T-452`).
- **Skill:** `test-driven-development`.
- **Verifikasi Deterministik:** `npm run lint` && `npm run lint:views` && `node --test tests/test-public-css-modular.js`.

---

### `T-450` — Migrasi Helper Tes Batch 1 (11 Berkas: Home, Brand, Header, Dropdown, Rebrand) `[Tier: Hydrogen Medium]`
- **File Terdampak (11 berkas tes — perubahan mekanis identik 2 baris per berkas):**
  `tests/test-brand-marquee-scaling.js`, `tests/test-dropdown-css.js`, `tests/test-homepage-hero-cta-merek-qa.js`, `tests/test-homepage-major-update-qa.js`, `tests/test-kelompok-c-polish.js`, `tests/test-mobile-header.js`, `tests/test-public-dropdown-migration.js`, `tests/test-rebrand-visual-functional.js`, `tests/test-t187-hero-cta-public.js`, `tests/test-t188-brand-strip-marquee.js`, `tests/test-t189-dead-code-cleanup.js`.
- **Langkah Bernomor:**
  1. Pada tiap berkas di daftar di atas, ganti pembacaan `fs.readFileSync('...public/css/components.css', 'utf8')` dengan impor `readAllPublicComponentsCss` dari `./helpers/readPublicCss.js`.
  2. Perbarui pesan log/assertion yang menyebut path literal monolit agar mencerminkan CSS modular publik (tanpa mengurangi satu pun assertion kualitas).
  3. Pastikan tidak ada lagi string `public/css/components.css` di ke-11 berkas tersebut.
- **Kontrak Data Eksplisit:** Impor `import { readAllPublicComponentsCss } from './helpers/readPublicCss.js';` (atau `createRequire`/path relatif setara bila CJS).
- **Referensi Pola:** Penggunaan `readAllAdminCss` di suite tes admin setelah migrasi `readAdminCss.js`.
- **Batasan Negatif:** Dilarang menghapus, melemahkan, atau men-skip assertion tes apa pun; dilarang menyentuh berkas di luar 11 file target.
- **Skill:** `test-driven-development`.
- **Verifikasi Deterministik:** `npm run lint` && cek grep 0 kemunculan `components.css` pada ke-11 berkas.

---

### `T-451` — Migrasi Helper Tes Batch 2 (12 Berkas: Produk & About) `[Tier: Hydrogen Medium]`
- **File Terdampak (12 berkas tes — perubahan mekanis identik 2 baris per berkas):**
  `tests/test-product-detail-redesign-qa.js`, `tests/test-product-detail-size-table-qa.js`, `tests/test-product-dynamic-size-table-qa.js`, `tests/test-product-listing-redesign-qa.js`, `tests/test-t122-bento.js`, `tests/test-t123-animation.js`, `tests/test-t124-mobile.js`, `tests/test-t126-count-up.js`, `tests/test-t127-timeline-hover.js`, `tests/test-t128-mobile-regression.js`, `tests/test-t297-ticket-accordion-styles-qa.js`, `tests/test-t298-ticket-accordion-interaction-qa.js`.
- **Langkah Bernomor:**
  1. Ganti seluruh pembacaan langsung `public/css/components.css` pada ke-12 berkas di atas dengan `readAllPublicComponentsCss()` dari `./helpers/readPublicCss.js`.
  2. Pertahankan seluruh logika dan assertion eksisting 100% utuh.
  3. Verifikasi 0 kemunculan string `components.css` tersisa pada ke-12 berkas.
- **Kontrak Data Eksplisit:** Sama dengan `T-450`.
- **Referensi Pola:** `tests/helpers/readPublicCss.js`.
- **Batasan Negatif:** Dilarang mengubah/melemahkan assertion atau menyentuh kode aplikasi.
- **Skill:** `test-driven-development`.
- **Verifikasi Deterministik:** `npm run lint` && cek grep 0 kemunculan `components.css` pada ke-12 berkas.

---

### `T-452` — Migrasi Helper Tes Batch 3 (11 Berkas: News, Pagination, Buttons, Public UI & Regression) `[Tier: Hydrogen Medium]`
- **File Terdampak (11 berkas tes — perubahan mekanis identik 2 baris per berkas):**
  `tests/test-t132-delivery-gate.js`, `tests/test-t139-full-regression.js`, `tests/test-t193-card-component.js`, `tests/test-t196-load-more.js`, `tests/test-t197-responsive-mobile.js`, `tests/test-t241-public-ui.js`, `tests/test-t243-hero-filter.js`, `tests/test-t257-buttons-playwright.js`, `tests/test-t312-unified-pagination.js`, `tests/test-t320-t321-news-regression.js`, `tests/test-task-201-frontend.js`.
- **Langkah Bernomor:**
  1. Ganti seluruh pembacaan langsung `public/css/components.css` pada ke-11 berkas di atas dengan `readAllPublicComponentsCss()` dari `./helpers/readPublicCss.js`.
  2. Pertahankan seluruh assertion eksisting (khusus `test-t257-buttons-playwright.js`, arahkan verifikasi utuhnya tombol publik ke `readAllPublicComponentsCss()`).
  3. Verifikasi 0 berkas di seluruh `tests/` (kecuali assertion negatif di `test-public-css-modular.js`) yang masih merujuk `public/css/components.css`.
- **Kontrak Data Eksplisit:** Sama dengan `T-450`.
- **Referensi Pola:** `tests/helpers/readPublicCss.js`.
- **Batasan Negatif:** Dilarang menghapus/melemahkan assertion atau menyentuh kode aplikasi.
- **Skill:** `test-driven-development`.
- **Verifikasi Deterministik:** `npm run lint` && cek grep seluruh `tests/` hanya `test-public-css-modular.js` yang menyebut `components.css`.

---

### `T-453` — Hapus Permanen `public/css/components.css` & Verifikasi Regresi Visual + Performa Playwright `[Tier: Argon Medium]`
- **File Terdampak (2):** `public/css/components.css` (dihapus permanen sesuai Keputusan 5a), `tests/test-public-css-modular.js` (aktifkan assertion `fs.existsSync('public/css/components.css') === false`).
- **Langkah Bernomor:**
  1. Pastikan 0 referensi `components.css` tersisa di `views/`, `public/js/`, `controllers/`, dan `tests/` (selain assertion negatif di `test-public-css-modular.js`).
  2. Hapus permanen `public/css/components.css` dan aktifkan assertion `monolith components.css must stay deleted` di `tests/test-public-css-modular.js`.
  3. Jalankan seluruh gerbang kualitas lokal: `npm run lint`, `npm run lint:views`, `npm run lint:i18n`, `node --test tests/test-public-css-modular.js`, `node --test tests/test-admin-css-modular.js`, dan `npm test`.
  4. Jalankan `node tests/test-public-css-visual-qa.js --verify` untuk membandingkan seluruh 11 rute (`320/375/768/1024/1440`, ID & EN) terhadap baseline `T-433`: buktikan **0 console error**, **0 404 CSS**, **0 horizontal overflow**, **0 regresi visual**, **0 CLS/FOUC spike**, dan **penurunan transfer KB CSS (-72% s/d -94%) serta rasio unused CSS lebih rendah di setiap rute publik**.
- **Kontrak Data Eksplisit:** Seluruh 25 berkas di `public/css/components/*.css` lulus lint strict & modular integrity test; laporan perbandingan baseline vs verify tervalidasi hijau.
- **Referensi Pola:** `tests/test-admin-css-modular.js` (baris 118), `tests/test-admin-css-visual-qa.js`.
- **Batasan Negatif:** Dilarang melakukan tahap Close atau mengedit `.agents/tech/`/`CHANGELOG.md` pada task ini (tahap Close dijalankan di sesi terpisah sesuai `WORKFLOW.md`).
- **Skill:** `browser-testing-with-devtools`, `code-review-and-quality`.
- **Verifikasi Deterministik:** `npm run lint && npm run lint:views && npm run lint:i18n && node --test tests/test-public-css-modular.js && node --test tests/test-admin-css-modular.js && node tests/test-public-css-visual-qa.js --verify`.

---

## 5. Dampak Ukuran Modul & `.agents/INDEX.md`

| Berkas Dokumentasi | Ukuran Saat Ini | Estimasi Setelah Merge | Batas Maksimum | Status |
| :--- | :---: | :---: | :---: | :---: |
| `.agents/INDEX.md` | 50 baris (8,83 KB) | **51 baris** (+1 entri `Public UI — Modular CSS Architecture`) | **60 baris** | AMAN (sisa 9 baris) |
| `.agents/tech/conventions.md` | 74 baris (6,35 KB) | **~7,0 KB** (+~0,65 KB pada §5.B/C) | **~8 KB** | AMAN |
| `.agents/tech/conventions-lint.md` | 28 baris (2,44 KB) | **~2,6 KB** (+~0,18 KB pada §4) | **~8 KB** | AMAN |
| `.agents/tech/public-ui-css.md` *(baru)* | 0 KB | **~6,8–7,5 KB** (setara `tech/admin-ui-css.md` 7,57 KB) | **~8 KB** | AMAN |

---

## 6. Rencana CLOSE (Setelah Seluruh Task `T-433`–`T-453` `[DONE]`)
1. Jalankan gerbang kualitas penuh (`npm run lint`, `npm run lint:views`, `npm run lint:i18n`, `node --test tests/test-public-css-modular.js`, `node --test tests/test-admin-css-modular.js`, `npm test`, serta `tests/test-public-css-visual-qa.js --verify`).
2. Hapus penanda `[PENDING T-xxx]` pada `tech/conventions.md`, `tech/conventions-lint.md`, dan `tech/public-ui-css.md`.
3. Perbarui tanggal verifikasi (`2026-11-26` atau tanggal selesai aktual) pada:
   - `.agents/tech/conventions.md`
   - `.agents/tech/conventions-lint.md`
   - `.agents/tech/public-ui-css.md`
   - `.agents/tech/admin-ui-css.md` (bila `login.ejs`/`403.ejs` diverifikasi ulang)
   - `.agents/INDEX.md`
4. Pindahkan proposal ini dari `changes/2026-11-26_modular-public-components-css.md` ke `.agents/archive/` dan pindahkan `T-433`..`T-453` dari `.agents/3-TASKS.md` ke `.agents/archive/tasks-index-full.md`.
5. **Draf 1 baris `CHANGELOG.md`:**
   `2026-11-26 | Modularisasi public/css/components.css ke 25 modul <=600 baris dengan pemuatan kondisional per rute, 0 raw hex, 70 class mati & 36 duplikat dihapus, isolasi auth admin, serta migrasi 34 tes & QA visual/performa | T-433..T-453`
