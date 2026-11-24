# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 7 Task (T-408 s/d T-414)
- **Total Task Selesai:** 407 Task (T-01 s/d T-407)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-415**.

---

## Task Aktif / Terbuka (Open Tasks)

### [DONE] T-408: Backend `MAX_HOME_POSTS` (2 -> 6) & Mapping `postType`/`typeLabel` Terlokalisasi pada `homeService` + Unit Test `[Tier: Argon Medium]`
- **Proposal:** [2026-11-24_news-carousel-card-revamp.md](changes/2026-11-24_news-carousel-card-revamp.md)
- **File Terdampak (4 file):** `services/homeService.js`, `locales/id.json`, `locales/en.json`, `tests/test-home-news-service.js` (file baru).
- **Langkah Kerja:**
  1. Di `locales/id.json` dan `locales/en.json` (namespace `home`), tambahkan simetris key label tipe konten:
     - `locales/id.json`: `"news_type_berita": "Berita"`, `"news_type_pers": "Siaran Pers"`, `"news_type_blog": "Blog"`.
     - `locales/en.json`: `"news_type_berita": "News"`, `"news_type_pers": "Press Release"`, `"news_type_blog": "Blog"`.
  2. Di `services/homeService.js`: ubah `MAX_HOME_POSTS` dari `2` menjadi `6`; definisikan `VALID_NEWS_TYPES = new Set(['berita', 'pers', 'blog'])` dan `NEWS_FALLBACK_IMAGES = ['/images/post-eco-community.jpg', '/images/post-school-recycling.jpg']`.
  3. Perbarui `buildNewsViewModel(rawPosts, lang, t)` (teruskan `translate` dari `buildHomeViewModel`) & `mapNewsItem(post, index, lang, t)`: rotasi `fallbackImage` memakai `NEWS_FALLBACK_IMAGES[index % NEWS_FALLBACK_IMAGES.length]`, validasi `post?.type` terhadap `VALID_NEWS_TYPES`, lalu isi `postType` (`''` jika tidak valid) dan `typeLabel` (`postType ? t(\`home.news_type_${postType}\`) : ''`). Pastikan total berkas tetap `<= 300` baris (`<= 40` baris/fungsi, `max-depth <= 2`, `complexity <= 8`).
  4. Buat `tests/test-home-news-service.js` (`node:test`, `node:assert/strict`) yang menguji: (a) maksimal 6 post (memotong bila > 6), (b) mapping `postType` & `typeLabel` untuk `berita`/`pers`/`blog` pada `id` & `en`, (c) `type` kosong/tidak valid menghasilkan `typeLabel: ''` aman, (d) `getHomePageData` meneruskan `limit: 6` ke `postModel.findAll`.
- **Kontrak Data Eksplisit:**
  - Konstanta: `MAX_HOME_POSTS = 6`, `VALID_NEWS_TYPES = Set(['berita', 'pers', 'blog'])`.
  - Key i18n baru: `home.news_type_berita`, `home.news_type_pers`, `home.news_type_blog`.
  - Item `homeView.news.items[i]`: `{ href: string, title: string, postType: string, typeLabel: string, imageUrl: string, fallbackImage: string, formattedDate: string }`.
- **Referensi Pola:** `buildCategoriesViewModel()` + `mapCategoryPanel()` di `services/homeService.js` (baris 115–142) dan `tests/test-public-services.js`.
- **Batasan Negatif:** Dilarang mengubah `models/postModel.js`, `controllers/public/homeController.js`, template `.ejs`, file `.css`, atau `database/seeds/snapshot.json`; dilarang memakai `post_categories` untuk `typeLabel`.
- **Skill:** `test-driven-development`, `incremental-implementation`.
- **Verifikasi Deterministik:** `npm run lint && npm run lint:i18n && node --test tests/test-home-news-service.js && npm run test:seed`.

### [DONE] T-409: Markup EJS Carousel Latest News Beranda (`.hnc-*`) & Kunci i18n Navigasi Simetris `[Tier: Hydrogen Medium]`
- **Proposal:** [2026-11-24_news-carousel-card-revamp.md](changes/2026-11-24_news-carousel-card-revamp.md)
- **File Terdampak (4 file):** `views/partials/home/news.ejs`, `views/public/index.ejs`, `locales/id.json`, `locales/en.json`.
- **Langkah Kerja:**
  1. Di `locales/id.json` dan `locales/en.json` (namespace `home`), tambahkan simetris key aksesibilitas carousel: `news_carousel_aria`, `news_prev_aria`, `news_next_aria`, `news_slide_aria`.
  2. Di `views/partials/home/news.ejs`, pertahankan `<section class="sec-news" id="berita">` dan blok `.news-empty-state` (`role="status"`) saat `news.items.length === 0`.
  3. Render `.hnc-header`: kiri `.hnc-heading-group` (`<h2>` + `<a href="/news" class="hnc-view-all">` berisi `t('home.news_view_all')` + panah kanan SVG `aria-hidden="true"`); kanan `.hnc-controls` berisi `#hncPrevBtn` (`.hnc-arrow-btn.hnc-arrow-prev`) & `#hncNextBtn` (`.hnc-arrow-btn.hnc-arrow-next`) dengan panah SVG tegas (`20x20`, `aria-hidden="true"`, `focusable="false"`) dan `aria-label` i18n (hanya saat `news.items.length > 0`).
  4. Render `#hncCarousel.hnc-carousel` (`role="region"`, `aria-roledescription="carousel"`, `aria-label`, `data-autoplay-ms="3000"`), `.hnc-viewport`, `#hncTrack.hnc-track` (`aria-live="off"`), dan tiap `.hnc-slide` dengan modifier selang-seling `idx % 2 === 0 ? 'hnc-slide--wide' : 'hnc-slide--compact'` berisi `<a href="<%= post.href %>" class="hnc-card">`, `.hnc-media` (`img[data-fallback-src]`), `.hnc-scrim`, `.hnc-type` (hanya jika `post.typeLabel`), dan `.hnc-content` berisi `.hnc-title` (tanpa tanggal). Jaga `<= 100` baris, nesting `<= 2`, zero inline style/script/komentar HTML.
  5. Di `views/public/index.ejs`, tambahkan tepat 1 baris `<script src="/js/home-news-carousel.js" defer></script>` setelah `<script src="/js/home.js" defer></script>`.
- **Kontrak Data Eksplisit:**
  - Key i18n baru: `home.news_carousel_aria`, `home.news_prev_aria`, `home.news_next_aria`, `home.news_slide_aria`.
  - Class/ID HTML: `<section class="sec-news" id="berita">`, `.hnc-header`, `.hnc-heading-group`, `.hnc-view-all`, `.hnc-controls`, `#hncCarousel`, `#hncTrack`, `#hncPrevBtn`, `#hncNextBtn`, `.hnc-slide`, `.hnc-slide--wide`, `.hnc-slide--compact`, `.hnc-card`, `.hnc-media`, `.hnc-scrim`, `.hnc-type`, `.hnc-content`, `.hnc-title`, `.news-empty-state`.
- **Referensi Pola:** `views/partials/home/brands-marquee.ejs` dan `views/partials/news/headline-section.ejs`.
- **Batasan Negatif:** Dilarang menyentuh 7 partial section homepage lainnya di `views/partials/home/`, dilarang merender tanggal pada `.hnc-card`, dilarang menulis inline style/handler/komentar HTML, dilarang mengubah CSS/JS.
- **Skill:** `frontend-ui-engineering`, `antislop-copywriting`.
- **Verifikasi Deterministik:** `npm run lint:views && npm run lint:i18n && npm run lint`.

### [DONE] T-410: Skrip Interaksi & Loop Autoplay Carousel Latest News (`public/js/home-news-carousel.js`) `[Tier: Argon Medium]`
- **Proposal:** [2026-11-24_news-carousel-card-revamp.md](changes/2026-11-24_news-carousel-card-revamp.md)
- **File Terdampak (1 file):** `public/js/home-news-carousel.js` (file baru).
- **Langkah Kerja:**
  1. Buat IIFE `'use strict'` terisolasi yang menginisialisasi `#hncCarousel` saat DOM siap; early return aman jika elemen/slide tidak ada.
  2. Hitung `visibleCount` per breakpoint (`>= 1024px`: `2`, `768px–1023px`: `1.5`, `< 768px`: `1`): jika `totalOriginal <= Math.ceil(visibleCount)`, set `.is-static` pada `#hncCarousel`, sembunyikan `.hnc-controls`, nonaktifkan autoplay, dan reset `transform` ke `0`.
  3. Untuk mode infinite loop (`totalOriginal > Math.ceil(visibleCount)`), tambahkan clone tepi 1x saat init (`.hnc-slide--clone`, `aria-hidden="true"`, `tabindex="-1"` pada `<a>` clone — tanpa rebuild DOM saat geser) dan hitung posisi geser dari `slide.offsetLeft` aktual.
  4. Geser slide memakai `transform: translate3d(-Xpx, 0, 0)` dengan satu flag `isTransitioning` (`transitionend` + fallback timeout `520ms`) agar klik cepat saat transisi diabaikan; reset dari clone tepi ke indeks asli secara instan via `.is-no-transition`.
  5. Terapkan autoplay `3000ms` di desktop & mobile, pause saat `mouseenter`, `focusin`, `touchstart`, dan `document.visibilitychange` (`document.hidden === true`), resume aman saat interaksi selesai / tab kembali aktif; pada `prefers-reduced-motion: reduce`, matikan autoplay dan gunakan geser instan.
  6. Ikat `#hncPrevBtn`, `#hncNextBtn`, keyboard `ArrowLeft`/`ArrowRight`, swipe sentuh horizontal (threshold `45px`, guard sumbu Y), dan `resize` ter-debounce (`150ms`). Patuhi ESLint ketat (`<= 40` baris/fungsi, `<= 300` baris/berkas, `max-depth <= 2`, `complexity <= 8`).
- **Kontrak Data Eksplisit:**
  - Target DOM: `#hncCarousel`, `#hncTrack`, `#hncPrevBtn`, `#hncNextBtn`, `.hnc-slide`, `.hnc-controls`.
  - Class status: `.is-static`, `.is-no-transition`, `.hnc-slide--clone`.
  - Konstanta: `AUTOPLAY_MS = 3000`, `SWIPE_THRESHOLD_PX = 45`, `TRANSITION_FALLBACK_MS = 520`, `RESIZE_DEBOUNCE_MS = 150`.
- **Referensi Pola:** `initHeroSlider()` dan `bindHeroTouchSwipe()` di `public/js/home.js` (baris 102–190).
- **Batasan Negatif:** Dilarang memodifikasi `public/js/home.js`, `public/js/main.js`, template `.ejs`, atau file CSS.
- **Skill:** `frontend-ui-engineering`, `antislop-human`.
- **Verifikasi Deterministik:** `npm run lint`.

### [TODO] T-411: Styling CSS Carousel Latest News (`.hnc-*`), Asimetri 16:9 + Compact, Peek & Responsivitas Token `[Tier: Argon Medium]`
- **Proposal:** [2026-11-24_news-carousel-card-revamp.md](changes/2026-11-24_news-carousel-card-revamp.md)
- **File Terdampak (1 file):** `public/css/components.css`.
- **Langkah Kerja:**
  1. Pertahankan `.sec-news`, `.sec-news::before`, dan `.sec-news .news-empty-state`; gantikan selektor lama khusus beranda (`.news-header`, `.news-grid`, `.news-card`) di seksi `/* ═══ NEWS SECTION ═══ */` dan media query terkait dengan blok ter-scope `.sec-news .hnc-*`.
  2. Tata `.hnc-header` (`justify-content: space-between; align-items: center;`), `.hnc-heading-group` (`h2` + `.hnc-view-all` uppercase `var(--letter-spacing-wide)`, `min-height: 44px`), dan `.hnc-controls` dengan `.hnc-arrow-btn` (`46x46px`, `var(--radius-pill)`, tema hijau token `--color-primary`, `--color-primary-dark`, `--color-border`, `--color-surface`, `--color-on-primary`, `:focus-visible` memakai `var(--focus-ring-outline)`).
  3. Tata `.hnc-viewport` (`overflow: hidden` dengan peek tepi tanpa horizontal overflow halaman) dan `.hnc-track` (`display: flex; gap: var(--space-lg); will-change: transform; transition: transform var(--transition-slow)`, `.is-no-transition { transition: none; }`).
  4. Tata geometri asimetris terkunci (`0 CLS`): Desktop (`>= 1024px`) tinggi seragam `clamp(320px, 27vw, 380px)`, `.hnc-slide--wide` `aspect-ratio: 16 / 9`, `.hnc-slide--compact` `aspect-ratio: 5 / 4`; Tablet (`768px–1023px`) tinggi `300px`, lebar `64%` (1,5 kartu); Mobile (`< 768px`) lebar `84%`, `aspect-ratio: 16 / 10` (1 kartu + peek).
  5. Tata `.hnc-card` (`border-radius: var(--r-xl)`, `object-fit: cover`), scrim gradasi `color-mix(in srgb, var(--surface-dark-deep) ...)`, `.hnc-type` uppercase kiri atas, `.hnc-title` kiri bawah (`var(--color-text-inverse)`, 3 baris). Bungkus `:hover` di `@media (hover: hover)`, nonaktifkan transisi di `@media (prefers-reduced-motion: reduce)`, sembunyikan `.hnc-controls` saat `.is-static`. Pastikan nol raw hex baru.
- **Kontrak Data Eksplisit:**
  - Prefix eksklusif: `.hnc-header`, `.hnc-heading-group`, `.hnc-view-all`, `.hnc-controls`, `.hnc-arrow-btn`, `.hnc-arrow-prev`, `.hnc-arrow-next`, `.hnc-carousel`, `.hnc-viewport`, `.hnc-track`, `.hnc-slide`, `.hnc-slide--wide`, `.hnc-slide--compact`, `.hnc-card`, `.hnc-media`, `.hnc-scrim`, `.hnc-type`, `.hnc-content`, `.hnc-title`.
  - Token wajib: `var(--bg-subtle)`, `var(--color-text-main)`, `var(--color-text-muted)`, `var(--color-text-inverse)`, `var(--color-primary)`, `var(--color-primary-dark)`, `var(--color-on-primary)`, `var(--color-border)`, `var(--color-surface)`, `var(--surface-dark-deep)`, `var(--surface-dark-surface)`, `var(--r-xl)`, `var(--radius-pill)`, `var(--focus-ring-outline)`, `var(--transition-fast)`, `var(--transition-slow)`.
- **Referensi Pola:** Blok `.sec-why-us` dan `.brand-strip-*` di `public/css/components.css`.
- **Batasan Negatif:** Dilarang mengubah `public/css/tokens.css`, dilarang menyentuh 7 section beranda lainnya, dilarang mengubah class bersama (`.btn-secondary`, `.container`, `.sec-products`).
- **Skill:** `antislop-ui`, `antislop-layoutmobile`.
- **Verifikasi Deterministik:** `npm run lint` dan cek zero raw hex pada blok `.hnc-*`.

### [TODO] T-412: Penyeragaman Ikon Panah SVG Tema Hijau (`>= 44px`) pada Headline Slider `/news` `[Tier: Hydrogen Medium]`
- **Proposal:** [2026-11-24_news-carousel-card-revamp.md](changes/2026-11-24_news-carousel-card-revamp.md)
- **File Terdampak (2 file):** `views/partials/news/headline-section.ejs`, `public/css/components.css`.
- **Langkah Kerja:**
  1. Di `views/partials/news/headline-section.ejs` (baris 75–85), ganti ikon chevron tipis pada `#nwlPrevBtn` (`.nwl-arrow-prev`) dan `#nwlNextBtn` (`.nwl-arrow-next`) dengan panah SVG penuh (`line` + `polyline`, `width="20"`, `height="20"`, `viewBox="0 0 24 24"`, `stroke-width="2"`, `aria-hidden="true"`, `focusable="false"`) yang seragam dengan `.hnc-arrow-btn` di beranda.
  2. Di `public/css/components.css` (blok `.nwl-arrow-btn*`, baris 9737–9777), bersihkan seluruh raw hex & fallback hex menuju token `tokens.css`, pertahankan ukuran `46x46px` (`>= 44px`), bungkus `:hover` di `@media (hover: hover)`, dan lengkapi state `:focus-visible` (`var(--focus-ring-outline)`) serta `:disabled` / `[aria-disabled="true"]`.
- **Kontrak Data Eksplisit:**
  - Selector terdampak: `.nwl-arrow-btn`, `.nwl-arrow-prev`, `.nwl-arrow-next` (`#nwlPrevBtn`, `#nwlNextBtn`).
  - Dimensi tombol & target sentuh: `46px x 46px` (`>= 44px`) di viewport `320px–1440px`.
- **Referensi Pola:** Blok `.nwl-arrow-btn` di `public/css/components.css` (baris 9737–9777) dan panah `.hnc-arrow-btn` hasil T-411.
- **Batasan Negatif:** Dilarang menyentuh `views/partials/pagination.ejs`, blok `.pgn-*`, `public/js/news-filter.js`, atau halaman admin.
- **Skill:** `antislop-ui`, `antislop-human`.
- **Verifikasi Deterministik:** `npm run lint:views && npm run lint:i18n && npm run lint`.

### [TODO] T-413: Revamp Kartu Artikel Flat Editorial (`.nwl-card`) untuk `/news` & Related `/news/:slug` `[Tier: Argon Medium]`
- **Proposal:** [2026-11-24_news-carousel-card-revamp.md](changes/2026-11-24_news-carousel-card-revamp.md)
- **File Terdampak (3 file):** `views/partials/news-card.ejs`, `public/js/news-filter.js`, `public/css/components.css`.
- **Langkah Kerja:**
  1. Di `views/partials/news-card.ejs`, pertahankan `<article class="news-card-v2 nwl-card">`, `.nwl-card-media` (16:9 + placeholder Euodoo), `.nwl-card-date`, `.nwl-card-title` / `.nwl-card-title-link`, dan `.nwl-card-action` (tanpa author; tautan "Baca Selengkapnya" / "Read More" rata kanan dengan ikon panah kanan SVG `aria-hidden="true"`). Pastikan zero inline style & zero komentar HTML.
  2. Di `public/js/news-filter.js`, perbarui `renderCard(post, lang)` (baris 54–92) agar menghasilkan markup HTML 100% identik dengan `views/partials/news-card.ejs`.
  3. Di `public/css/components.css` (blok `.nwl-card*`, baris 9345–9483), ubah kartu bersama menjadi gaya flat editorial untuk `/news` dan `.nwd-related-grid` di `/news/:slug`: netralkan permukaan/border/shadow (`background: transparent; border: none; box-shadow: none; border-radius: 0; overflow: visible;` termasuk `:hover`), pasang `border-radius: var(--r-xl); overflow: hidden; aspect-ratio: 16 / 9;` pada `.nwl-card-media`, ubah `.nwl-card-body` menjadi `padding: var(--space-md) 0 0;`, beri garis penuh `border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end;` pada `.nwl-card-action`, pastikan `.nwl-card-link` `min-height: 44px` dengan `:hover` di `@media (hover: hover)` dan `:focus-within` memakai `var(--focus-ring-outline)`, serta bersihkan seluruh raw hex ke token `tokens.css`.
- **Kontrak Data Eksplisit:**
  - Alias dipertahankan: `.news-card-v2`, `.news-card-v2-img`, `.news-card-v2-body`, `.news-card-v2-title` (`tests/test-modul12-public.js:82`).
  - Struktur: `.nwl-card-media` (16:9, `var(--r-xl)`) -> `.nwl-card-date` -> `.nwl-card-title` (3 baris) -> garis penuh `1px solid var(--color-border)` -> `.nwl-card-action` (rata kanan, tanpa author, `min-height: 44px`).
- **Referensi Pola:** `views/partials/news-card.ejs`, `renderCard()` di `public/js/news-filter.js` (baris 54–92), dan blok `.nwl-card` di `public/css/components.css` (baris 9345–9483).
- **Batasan Negatif:** Dilarang menghapus `.news-card-v2`, dilarang mengubah grid kolom `.nwl-grid`, dilarang mengubah rasio gambar 16:9 ke potret, dilarang mengubah `renderPagination()` atau homepage.
- **Skill:** `antislop-ui`, `frontend-ui-engineering`.
- **Verifikasi Deterministik:** `npm run lint:views && npm run lint:i18n && npm run lint`.

### [TODO] T-414: Verifikasi E2E Playwright Multi-Viewport, Autoplay, CLS, Reduced-Motion & Regresi ID/EN `[Tier: Argon Medium]`
- **Proposal:** [2026-11-24_news-carousel-card-revamp.md](changes/2026-11-24_news-carousel-card-revamp.md)
- **File Terdampak (1 file):** `tests/test-news-carousel-revamp-e2e.js` (file baru).
- **Langkah Kerja:**
  1. Buat skrip pengujian Playwright lintas viewport `320px`, `375px`, `768px`, `1024px`, `1280px`, `1440px` pada bahasa `ID` dan `EN`.
  2. Uji Beranda (`/`): keberadaan `.sec-news`, `.hnc-header`, `.hnc-view-all` di samping kanan judul, panah `>= 44x44px` di kanan atas, hingga 6 slide, label tipe konten (`posts.type`) di kiri atas tanpa tanggal, proporsi asimetris desktop (`wide` > `compact` pada tinggi sama), autoplay loop 3 detik, pause saat hover/focus/tab tersembunyi, klik cepat prev/next bebas bug/stuck, keyboard `ArrowRight`/`ArrowLeft`, `prefers-reduced-motion: reduce`, `CLS < 0.01`, 0 overflow, 0 console error, dan 7 section beranda lain tidak berubah.
  3. Uji `/news` & `/news/:slug`: kartu `.nwl-card` transparan tanpa kotak/shadow, rasio 16:9, garis horizontal penuh, tanpa author, "Baca Selengkapnya" rata kanan `>= 44px`, konsisten setelah filter AJAX dan di kartu related `/news/:slug`, panah slider headline `.nwl-arrow-btn >= 44x44px` dengan SVG baru, paginasi `.pgn-*` dan empty state tanpa regresi.
  4. Jalankan seluruh gerbang kualitas proyek sekaligus (`lint`, `lint:views`, `lint:i18n`, unit tests, dan E2E test).
- **Kontrak Data Eksplisit:**
  - Exit code `0` di seluruh suite; `0` console error; `0` uncaught page error; `document.documentElement.scrollWidth <= window.innerWidth` di `320px–1440px`; `CLS < 0.01` pada `.sec-news`.
- **Referensi Pola:** `tests/test-modul12-public.js` dan `tests/test-homepage-hero-cta-merek-qa.js`.
- **Batasan Negatif:** Dilarang memodifikasi file produksi di luar temuan bug terverifikasi dalam scope T-408..T-413; batas maksimal 2 iterasi perbaikan jika test gagal.
- **Skill:** `browser-testing-with-devtools`, `test-driven-development`.
- **Verifikasi Deterministik:** `npm run lint && npm run lint:views && npm run lint:i18n && node --test tests/test-home-news-service.js && npm test && node tests/test-news-carousel-revamp-e2e.js`.
