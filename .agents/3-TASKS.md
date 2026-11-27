# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 4 Task (`T-468` s/d `T-471`)
- **Total Task Selesai:** 467 Task (T-01 s/d T-467)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-472**.

---

## Task Aktif / Terbuka (Open Tasks)

### [DONE] T-468 `[Tier: Hydrogen Medium]` - Token Hero Baru, Pemindahan Markup Overlay ke Induk Hero & Cache-Busting
- **Proposal & Spek:** `changes/2026-11-27_hero-readability-scroll-cue-and-news-card-focus.md`, `.agents/prd/public-home.md` (`FR-10`), `.agents/tech/public-home-sections.md`, `.agents/tech/public-ui-css.md`.
- **File Terdampak (4 file):**
  1. `public/css/tokens.css`
  2. `views/partials/home/hero-slider.ejs`
  3. `views/partials/home/hero-slide.ejs`
  4. `views/partials/head.ejs`
- **Langkah Implementasi:**
  1. Tambahkan 7 token hero baru berbasis palet hijau gelap korporat (`rgba(7, 31, 23, ...)` & `rgba(0, 87, 63, ...)`, zero blue hue) di `:root` `public/css/tokens.css` tanpa menghapus token `--hero-grad` lama.
  2. Hapus `<div class="hero-grad"></div>` dari dalam `.hero-bg` pada `views/partials/home/hero-slide.ejs` (L28).
  3. Tambahkan tepat 1 elemen `<div class="hero-grad" aria-hidden="true"></div>` sebagai anak langsung `<section class="hero hero-slider">` tepat setelah penutup `.hero-slides-wrapper` pada `views/partials/home/hero-slider.ejs`. Pertahankan `<div class="hero-explore-indicator" aria-hidden="true">` tetap dekoratif.
  4. Perbarui query string cache-busting `/css/tokens.css` dan seluruh link `/css/components/*.css` pada `views/partials/head.ejs` menjadi `?v=20261127-1`.
- **Kontrak Data Eksplisit:**
  - Token baru di `public/css/tokens.css`:
    - `--hero-overlay-desktop: linear-gradient(90deg, rgba(7, 31, 23, 0.88) 0%, rgba(7, 31, 23, 0.76) 28%, rgba(7, 31, 23, 0.62) 44%, rgba(0, 87, 63, 0.24) 58%, rgba(0, 87, 63, 0) 72%, transparent 100%);`
    - `--hero-overlay-top-scrim: linear-gradient(180deg, rgba(7, 31, 23, 0.62) 0%, rgba(7, 31, 23, 0.28) 58%, rgba(7, 31, 23, 0) 100%);`
    - `--hero-overlay-mobile: linear-gradient(180deg, rgba(7, 31, 23, 0.88) 0%, rgba(7, 31, 23, 0.76) 44%, rgba(0, 87, 63, 0.30) 68%, rgba(0, 87, 63, 0) 88%);`
    - `--hero-body-text-shadow: 0 2px 10px rgba(7, 31, 23, 0.72), 0 1px 3px rgba(0, 0, 0, 0.65);`
    - `--hero-heading-text-shadow: 0 2px 16px rgba(7, 31, 23, 0.65), 0 1px 4px rgba(0, 0, 0, 0.55);`
    - `--hero-explore-track: rgba(255, 255, 255, 0.28);`
    - `--hero-explore-runner: rgba(255, 255, 255, 0.95);`
  - Struktur DOM induk: `.hero.hero-slider > .hero-slides-wrapper` diikuti langsung `.hero.hero-slider > .hero-grad[aria-hidden="true"]`, tombol navigasi, `.hero-slider-controls`, dan `.hero-explore-indicator[aria-hidden="true"]`.
  - Versi aset `views/partials/head.ejs`: `?v=20261127-1` pada `/css/tokens.css` dan seluruh `/css/components/*.css`.
- **Referensi Pola:** Blok Dark & Transparent Surfaces di `public/css/tokens.css` (L77-L89) dan `views/partials/home/hero-slider.ejs` (L1-L38).
- **Batasan Negatif:**
  - Dilarang menyentuh 7 partial beranda lainnya (`intro.ejs`, `categories.ejs`, `why-choose-us.ejs`, `certifications.ejs`, `brands-marquee.ejs`, `news.ejs`, `cta-global.ejs`).
  - Dilarang menambahkan inline `style`, inline handler, komentar HTML, atau warna hex di file `.ejs`.
  - Dilarang mengubah `public/css/components/home-hero.css` (dikerjakan di T-469), `public/js/home.js`, atau data database.
- **Skill Relevan (2):** `antislop-ui`, `frontend-ui-engineering`.
- **Verifikasi Deterministik:**
  `npm run lint && npm run lint:views && npm run lint:i18n && node --test tests/test-public-css-modular.js && node tests/test-modul13-seo-audit.js`

---

### [DONE] T-469 `[Tier: Argon Medium]` - CSS Hero 1:1 Viewport, Stacking Context, Directional Gradient & Animasi Scroll Cue
- **Proposal & Spek:** `changes/2026-11-27_hero-readability-scroll-cue-and-news-card-focus.md`, `.agents/prd/public-home.md` (`FR-10`), `.agents/tech/public-home-sections.md`.
- **File Terdampak (1 file):**
  1. `public/css/components/home-hero.css`
- **Langkah Implementasi:**
  1. Ubah tinggi `.hero`, `.hero-slider`, `.hero-slides-wrapper`, dan `.hero-slide` pada desktop dan `@media (max-width: 1024px)` menjadi penuh 1:1 viewport (`min-height: 100vh; min-height: 100svh; height: 100svh;`).
  2. Pada `@media (max-width: 768px)` dan `@media (max-width: 480px)`, terapkan `min-height: 100svh; height: auto;` pada `.hero`, `.hero-slider`, `.hero-slides-wrapper`, dan `.hero-slide`, serta atur `.hero-slide.is-active { position: relative; }` agar kontainer hero tumbuh alami mengikuti teks dan 2 CTA bertumpuk tanpa memotong konten maupun menyisakan celah putih di layar standar.
  3. Terapkan kontrak stacking context pada `.hero.hero-slider` (`isolation: isolate;`), hapus `z-index` dari `.hero-slide` & `.hero-slide.is-active`, pindahkan transisi `opacity` (`0 -> 1`, `0.8s cubic-bezier(0.16, 1, 0.3, 1)`) dari `.hero-slide` ke `.hero-slide .hero-bg` (`z-index: 1`) dan `.hero-slide .hero-content` (`z-index: 3`), serta atur `.hero-slider > .hero-grad` pada `position: absolute; inset: 0; z-index: 2; pointer-events: none;`.
  4. Hapus `filter: brightness(0.85) contrast(1.02)` pada `.hero-bg img` (L69) dan `filter: brightness(0.85)` pada `.hero-youtube-poster` (L112); hapus blok override `.hero-slide-image .hero-grad` dan `.hero-slide-video .hero-grad` (L128-L143).
  5. Atur background `.hero-grad` desktop menjadi `var(--hero-overlay-top-scrim) top left / 100% 112px no-repeat, var(--hero-overlay-desktop)` dan pada `@media (max-width: 768px)` ubah menjadi `var(--hero-overlay-mobile)` (gradasi vertikal atas-pekat ke bawah-transparan).
  6. Perbarui `.hero-body` menjadi `max-width: 540px;` dan `text-shadow: var(--hero-body-text-shadow);`, serta `.hero h1, .hero .hero-heading` memakai `text-shadow: var(--hero-heading-text-shadow);`.
  7. Terapkan posisi dan animasi scroll cue pada `.hero-explore-indicator` (`right: 44px; bottom: 96px; z-index: 6; pointer-events: none;`, tetap `display: none` di `<= 768px`), `.hero-explore-line` (`position: relative; width: 1.5px; height: 48px; background: var(--hero-explore-track); overflow: hidden;`), dan `.hero-explore-line::after` (`content: ''; position: absolute; inset: 0; background: var(--hero-explore-runner); animation: heroExploreScroll 2s cubic-bezier(0.65, 0, 0.35, 1) infinite;`) dengan `@keyframes heroExploreScroll` hanya menggunakan `transform: translateY(-100% -> 100%)` & `opacity`. Tambahkan fallback statis (`.hero-explore-line::after { animation: none; transform: translateY(0); opacity: 0.85; }`) pada `@media (prefers-reduced-motion: reduce)`. Bungkus rule `:hover` tombol hero pada `@media (hover: hover)`.
- **Kontrak Data Eksplisit:**
  - Selector utama: `.hero.hero-slider`, `.hero-slides-wrapper`, `.hero-slide`, `.hero-slide.is-active`, `.hero-bg`, `.hero-slider > .hero-grad`, `.hero-content`, `.hero-body`, `.hero-explore-indicator`, `.hero-explore-text`, `.hero-explore-line`, `.hero-explore-line::after`.
  - Keyframes: `@keyframes heroExploreScroll` (hanya `transform` & `opacity`, 0 properti layout `height`/`width`/`top`).
  - Lapisan z-index terkunci: `.hero-bg (1)` < `.hero-grad (2)` < `.hero-content (3)` < `.hero-explore-indicator (6)` < `.hero-slider-nav / .hero-slider-controls (10)`.
  - Koordinat aman vs WA: `.hero-explore-indicator` di `right: 44px; bottom: 96px;` (clearance `16px` di atas `.wa-float-btn` pada `bottom: 24..80px`, `0` konflik dengan `.wa-tooltip` maupun `.hero-slider-controls`).
  - Anggaran baris `public/css/components/home-hero.css`: **wajib `<= 600` baris** (target ~535-555 baris), **0 raw hex**, **0 duplikat `(context, selector)`**.
- **Referensi Pola:** `public/css/components/home-hero.css` (struktur responsif & reduced-motion) dan `public/css/components/whatsapp-float.css` (koordinat `.wa-float-container` & `@media (hover: hover)`).
- **Batasan Negatif:**
  - Dilarang menulis raw hex di `home-hero.css`.
  - Dilarang menganimasikan `height`, `width`, `top`, atau `bottom`.
  - Dilarang menyentuh `public/js/home.js`, file CSS 7 section homepage lain (`home-intro-categories.css`, `home-why-choose-us.css`, `home-cert-brands.css`, `home-news-carousel.css`), atau mengubah class bersama (`.btn-pill-solid-white`, `.btn-pill-white`).
  - Dilarang melebihi batas `<= 600` baris pada `home-hero.css`.
- **Skill Relevan (2):** `antislop-ui`, `antislop-layoutmobile`.
- **Verifikasi Deterministik:**
  `npm run lint && npm run lint:views && npm run lint:i18n && node --test tests/test-public-css-modular.js && wc -l public/css/components/home-hero.css`

---

### [TODO] T-470 `[Tier: Hydrogen Medium]` - Perbaikan Bug Border Fokus Kartu Berita Pasca-Klik & Navigasi Back
- **Proposal & Spek:** `changes/2026-11-27_hero-readability-scroll-cue-and-news-card-focus.md`, `.agents/tech/news-card.md`.
- **File Terdampak (3 file):**
  1. `public/css/components/news-cards.css`
  2. `public/js/news-filter.js`
  3. `public/js/news-detail.js`
- **Langkah Implementasi:**
  1. Pada `public/css/components/news-cards.css` (L131-L139), ganti blok `.nwl-card:focus-within` menjadi `.nwl-card:has(:focus-visible)` (`outline: var(--focus-ring-outline); outline-offset: 4px; border-radius: var(--r-xl);`), dan tambahkan blok `@supports not selector(:has(*))` yang memberikan `outline: var(--focus-ring-outline); outline-offset: 2px;` pada `.nwl-card-title-link:focus-visible` agar browser tanpa dukungan `:has()` tetap aksesibel (WCAG R-32).
  2. Gunakan `.nwl-card-title-link:focus:not(:focus-visible) { outline: none; }` ditambah `.nwl-card:has(:focus-visible) .nwl-card-title-link:focus-visible { outline: none; }` agar tidak pernah menghasilkan double outline maupun hilangnya fokus pada fallback.
  3. Pada `public/js/news-filter.js` dan `public/js/news-detail.js`, tambahkan helper `clearRestoredCardFocus()` (`<= 8` baris) yang dipanggil pada `window.addEventListener('pageshow', clearRestoredCardFocus)`: apabila `document.activeElement` berada di dalam `.nwl-card` (`document.activeElement.closest('.nwl-card')`), panggil `document.activeElement.blur()` untuk mencegah border fokus tertinggal pasca-bfcache navigasi Back di `/news` dan `/news/:slug`.
- **Kontrak Data Eksplisit:**
  - Selector CSS: `.nwl-card:has(:focus-visible)`, `.nwl-card-title-link:focus:not(:focus-visible)`, `.nwl-card:has(:focus-visible) .nwl-card-title-link:focus-visible`, dan `@supports not selector(:has(*)) { .nwl-card-title-link:focus-visible { ... } }`.
  - Event JS: `window` `pageshow` -> cek `document.activeElement && document.activeElement.closest && document.activeElement.closest('.nwl-card')` -> `document.activeElement.blur()`.
  - Cakupan rute: `/news` (`.nwl-grid`) dan `/news/:slug` (`.nwd-related-grid`).
- **Referensi Pola:** Helper `blurFocusedWithin()` di `public/js/home.js` (L222-L227) dan `:focus-visible` di `public/css/components/whatsapp-float.css` (L45-L49).
- **Batasan Negatif:**
  - Dilarang mengubah layout grid `.nwl-grid` / `.nwd-related-grid`, struktur HTML `views/partials/news-card.ejs`, `renderCard()` di `news-filter.js`, atau paginasi `.pgn-*`.
  - Dilarang menghapus class alias `.news-card-v2*` (diuji `tests/test-modul12-public.js`).
  - Dilarang menulis raw hex di `news-cards.css` atau melampaui batas `<= 600` baris.
- **Skill Relevan (2):** `antislop-human`, `debugging-and-error-recovery`.
- **Verifikasi Deterministik:**
  `npm run lint && npm run lint:views && npm run lint:i18n && node --test tests/test-public-css-modular.js && node tests/test-modul12-public.js`

---

### [TODO] T-471 `[Tier: Argon Medium]` - QA Playwright Multi-Viewport, Kontras WCAG AA, Reduced-Motion & Simulasi Back Kartu Berita
- **Proposal & Spek:** `changes/2026-11-27_hero-readability-scroll-cue-and-news-card-focus.md`.
- **File Terdampak (1 file):**
  1. `tests/test-hero-and-news-focus-qa.js`
- **Langkah Implementasi:**
  1. Buat skrip Playwright `tests/test-hero-and-news-focus-qa.js` mengikuti pola `tests/test-news-carousel-revamp-e2e.js` untuk menguji rute `/`, `/news`, dan `/news/:slug` pada bahasa `id` & `en` di viewport `320px`, `375px`, `480px`, `768px`, `1024px`, `1280x720` (simulasi laptop 14" scaling 150%), dan `1440x900`.
  2. Verifikasi di `/` (Hero Section):
     - Tinggi `.hero.hero-slider` memenuhi `>= 99%` tinggi viewport desktop (0 celah putih bawah); di mobile `height >= viewportHeight` tanpa pemotongan konten CTA & 0 horizontal overflow.
     - `.hero-grad` merupakan direct child `.hero.hero-slider` dengan `z-index` di atas `.hero-bg` dan di bawah `.hero-content`, `.hero-slider-controls`, serta `.hero-explore-indicator`.
     - `.hero-bg img` tidak memiliki `filter: brightness(...)` dan `.hero-body` memiliki `max-width <= 540px`.
     - Pengecekan *bounding box*: `.hero-explore-indicator` berada di atas `.wa-float-btn` (jarak aman `>= 12px`, 0 tumpang tindih), tidak bertabrakan dengan `.hero-slider-controls` / `.hero-slider-next`, dan tersembunyi (`display: none`) pada `<= 768px`.
     - Verifikasi `prefers-reduced-motion: reduce`: animasi `.hero-explore-line::after` berhenti (`animationName === 'none'`).
     - Verifikasi integritas 7 section beranda di bawah hero (tetap terender utuh, 0 perubahan).
  3. Verifikasi di `/news` dan `/news/:slug` (Bug Kartu Berita):
     - Simulasi klik mouse kartu berita pertama di `/news` -> pindah ke `/news/:slug` -> jalankan `page.goBack()` -> pastikan seluruh `.nwl-card` dan `.nwl-card-title-link` memiliki `outlineStyle === 'none'` / `outlineWidth === '0px'` (0 border hijau tertinggal). Ulangi skenario serupa pada kartu terkait `.nwd-related-grid` di `/news/:slug`.
     - Simulasi navigasi keyboard `Tab` menuju `.nwl-card-title-link` -> pastikan bingkai fokus `.nwl-card` terlihat jelas (`outlineStyle !== 'none'` & `outlineWidth >= 2px`).
  4. Verifikasi gerbang kualitas global: `0 console error`, `0 pageerror`, `0 horizontal overflow`, serta verifikasi rasio kontras WCAG AA pada zona teks hero & navbar transparan.
- **Kontrak Data Eksplisit:**
  - Env target server: `TEST_BASE_URL` / `BASE_URL` default `http://127.0.0.1:3000`.
  - Exit code `0` bila seluruh assertion lulus; exit code non-zero dengan pesan kegagalan spesifik per viewport/bahasa bila gagal.
- **Referensi Pola:** `tests/test-news-carousel-revamp-e2e.js` (multi-viewport, `attachErrorListeners`, `assertNoOverflow`) dan `tests/test-t237-playwright-verification.js` (verifikasi bounding box hero).
- **Batasan Negatif:**
  - Dilarang mengubah file produksi (`views/`, `public/`, `controllers/`, `services/`) atau data database pada task QA ini.
- **Skill Relevan (2):** `antislop-human`, `browser-testing-with-devtools`.
- **Verifikasi Deterministik:**
  `npm run lint && npm run lint:views && npm run lint:i18n && node --test tests/test-public-css-modular.js && node tests/test-hero-and-news-focus-qa.js`
