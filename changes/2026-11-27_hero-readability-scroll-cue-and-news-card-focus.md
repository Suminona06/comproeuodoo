# Proposal Perubahan: Optimasi Hero Section (Tinggi 1:1, Directional Gradient Overlay, Animasi Scroll Cue) & Perbaikan Bug Border Fokus Kartu Berita

Tanggal: 2026-11-27 | Status: APPROVED & MERGED KE SPEC (Menunggu Implementasi T-468..T-471)

---

## 1. Konteks

Menyamakan proporsi tinggi Hero Section beranda menjadi penuh 1:1 viewport ala `chandra-asri.com`, mengganti overlay gelap-hijau menyeluruh dengan _directional gradient overlay_ berbasis token palet hijau gelap PT Euodoo di kontainer induk `.hero.hero-slider` agar sisi kanan media tampil jernih, serta menambahkan animasi garis bergerak pada indikator dekoratif `JELAJAHI` / `EXPLORE MORE`.
Sekaligus memperbaiki bug border/outline hijau tertinggal pada kartu berita (`.nwl-card`) setelah klik kartu menuju `/news/:slug` lalu kembali via tombol Back browser, tanpa mengurangi aksesibilitas fokus keyboard (`Tab`).
Homepage di luar `.hero.hero-slider` (7 section lainnya), `public/js/home.js`, database, dan palet hijau korporat bebas rona biru dibekukan total.

---

## 2. Delta Spesifikasi per Modul

### A. `.agents/prd/public-home.md`

- **Kondisi Lama (`FR-10: Hero Banner Slider Dual CTA`):**
  - Menampilkan carousel slider banner berukuran penuh (`92vh`/`96vh` desktop, `88svh`/`84svh` mobile) dengan auto-slide, navigasi dot/arrow, keyboard arrow, touch swipe, dual CTA, dukungan media gambar/video/YouTube, dan kontrol slider terpusat di bawah.
  - Belum mengatur tinggi penuh 1:1 viewport tanpa celah putih bawah, _directional gradient overlay_ kiri-pekat ke kanan-transparan, scrim atas navbar, batas lebar subheadline, maupun animasi indikator scroll `JELAJAHI` / `EXPLORE MORE`.
- **Kondisi Baru (`FR-10: Hero Banner Slider Dual CTA`):**
  - Hero banner memenuhi tinggi penuh 1:1 viewport di desktop (`height: 100svh; min-height: 100vh;`, tanpa celah putih section berikutnya di bagian bawah layar) dan adaptif anti-potong di mobile (`min-height: 100svh; height: auto;` pada `<= 768px`) untuk seluruh tipe media (`image`, `video`, `youtube`).
  - Keterbacaan teks dilindungi oleh _directional gradient overlay_ tunggal berbasis token hijau gelap korporat PT Euodoo (kiri pekat ke kanan transparan penuh di desktop + scrim tipis tepi atas `~112px` pelindung navbar transparan; vertikal atas-pekat ke bawah-transparan di mobile `<= 768px`) tanpa peredupan global media (`filter: brightness(...)`), dengan lebar subheadline dibatasi (`max-width: 540px`) dan kontras memenuhi WCAG AA.
  - Indikator scroll dekoratif `JELAJAHI` (`EN: EXPLORE MORE`, `aria-hidden="true"`) di pojok kanan bawah desktop (di atas tombol floating WhatsApp dengan jarak aman, tersembunyi pada `<= 768px`) menampilkan animasi garis vertikal bergerak kontinu (rel tipis + garis putih meluncur turun) yang menjadi statis saat `prefers-reduced-motion: reduce`, tanpa bertabrakan dengan tombol floating WhatsApp maupun kontrol dots tengah bawah.
- **Tambahan Baris pada Tabel `Keputusan Desain & Fungsional Terkunci`:**
  - `| **Hero 1:1 Viewport, Directional Gradient Overlay, & Scroll Cue Dekoratif** | Menyamakan proporsi hero penuh viewport dengan sisi kanan media jernih, melindungi keterbacaan teks/navbar WCAG AA via token hijau gelap, serta menjaga jarak aman indikator JELAJAHI di atas tombol WA. | 2026-11-27 |`

### B. `.agents/tech/public-home-sections.md`

- **Kondisi Lama:**
  - §1 (`hero-slider.ejs`, `hero-slide.ejs`): `<div class="hero-grad"></div>` dirender berulang di dalam `.hero-bg` pada setiap slide.
  - §2 (`Hero Slider & Dual CTA` & `Isolasi Class Bersama & Zero Hex`): masih merujuk berkas monolit lama `public/css/components.css`; tinggi `.hero-slider` menggunakan `92vh` (desktop) / `max(88svh, 600px)` (tablet-mobile) / `max(84svh, 560px)` (`<= 480px`); `.hero-bg img` dan `.hero-youtube-poster` diberi `filter: brightness(0.85)`; `.hero-grad` menumpuk 3 gradien gelap-hijau menyeluruh hingga tepi kanan; `.hero-body` `max-width: 640px`; `.hero-explore-line` berupa garis statis.
- **Kondisi Baru:**
  - §1 (`hero-slider.ejs`, `hero-slide.ejs`): memindahkan 1 elemen tunggal `<div class="hero-grad" aria-hidden="true"></div>` ke anak langsung kontainer induk `.hero.hero-slider` (menghapus duplikasi di dalam `hero-slide.ejs`). Elemen `<div class="hero-explore-indicator" aria-hidden="true">` tetap dekoratif.
  - §2 (`Hero Slider & Dual CTA`):
    - Referensi stylesheet diperbarui ke `public/css/components/home-hero.css` (batas `<= 600` baris, zero raw hex) dengan token baru di `public/css/tokens.css`: `--hero-overlay-desktop`, `--hero-overlay-top-scrim`, `--hero-overlay-mobile`, `--hero-body-text-shadow`, `--hero-heading-text-shadow`, `--hero-explore-track`, `--hero-explore-runner`.
    - Tinggi penuh 1:1 viewport desktop (`min-height: 100vh; min-height: 100svh; height: 100svh;`) dan `<= 1024px` (`100svh`); mobile `<= 768px` & `<= 480px` memakai `min-height: 100svh; height: auto;` dengan `.hero-slide.is-active { position: relative; }` agar teks/CTA tidak pernah terpotong.
    - **Kontrak Stacking Context Terverifikasi (tahan saat diam maupun crossfade slide):**
      - `.hero.hero-slider`: `position: relative; isolation: isolate;`
      - `.hero-slides-wrapper`: `position: relative;` tanpa `z-index` (tidak membentuk stacking context).
      - `.hero-slide`: tanpa `z-index` dan tanpa transisi `opacity` pada wrapper `.hero-slide` (`visibility: hidden; pointer-events: none;`), melainkan memindahkan transisi `opacity` ke `.hero-bg` dan `.hero-content` sehingga `.hero-slide` tidak pernah mengurung stacking context baik saat diam maupun saat crossfade.
      - Lapisan final dalam `.hero.hero-slider`: `.hero-bg` (`z-index: 1`, mencakup `img`/`video`/`.hero-youtube-wrapper`/`.hero-youtube-poster`/`.hero-video-shield`) -> `.hero-slider > .hero-grad` (`z-index: 2; pointer-events: none;`) -> `.hero-content` (`z-index: 3`) -> `.hero-explore-indicator` (`z-index: 6`) -> `.hero-slider-nav` & `.hero-slider-controls` (`z-index: 10`).
    - Hapus `filter: brightness(...)` pada `.hero-bg img` & `.hero-youtube-poster` serta override `.hero-slide-image .hero-grad` / `.hero-slide-video .hero-grad`.
    - `.hero-grad` desktop melapiskan `var(--hero-overlay-top-scrim)` (`top left / 100% 112px no-repeat`) di atas `var(--hero-overlay-desktop)`; pada `<= 768px` beralih ke `var(--hero-overlay-mobile)` (vertikal atas-pekat ke bawah-transparan).
    - `.hero-body` dibatasi `max-width: 540px` dengan `text-shadow: var(--hero-body-text-shadow)`.
    - Indikator `.hero-explore-indicator` (desktop `right: 44px; bottom: 96px; z-index: 6;`, mobile `<= 768px` `display: none;`) menggunakan rel tipis `.hero-explore-line` (`var(--hero-explore-track)`) + runner `.hero-explore-line::after` (`var(--hero-explore-runner)`) beranimasi `@keyframes heroExploreScroll` khusus properti GPU-composited (`transform` & `opacity`, `2s cubic-bezier(0.65, 0, 0.35, 1) infinite`) dengan fallback statis pada `@media (prefers-reduced-motion: reduce)`. Seluruh state `:hover` dibungkus `@media (hover: hover)`.
  - §3 (`public/js/home.js`): tidak berubah (0 JS baru).

### C. `.agents/tech/news-card.md` (Penyelarasan Catatan Teknis Bug Fix; PRD `prd/news.md` Tidak Berubah)

- **Kondisi Lama:**
  - Header & §1 masih merujuk `public/css/components.css`.
  - §1 menyatakan `:focus-within` kartu memakai `var(--focus-ring-outline)` (`.nwl-card:focus-within` di `public/css/components/news-cards.css` L131-L135).
- **Kondisi Baru:**
  - Referensi path diperbarui ke `public/css/components/news-cards.css`, `public/js/news-filter.js`, dan `public/js/news-detail.js`.
  - Aturan fokus kartu pada `public/css/components/news-cards.css` mengganti `.nwl-card:focus-within` menjadi `.nwl-card:has(:focus-visible)` (+ fallback `@supports not selector(:has(*))` untuk `.nwl-card-title-link:focus-visible`) disertai guard `pageshow` di `public/js/news-filter.js` dan `public/js/news-detail.js` untuk membebaskan fokus tertinggal pasca-bfcache Back browser di `/news` (`.nwl-grid`) dan `/news/:slug` (`.nwd-related-grid`).

### D. `.agents/tech/public-ui-css.md` (Penyelarasan Token & Cache-Busting)

- **Kondisi Lama:** §2 mencatat token turunan publik; §4 mencatat query version `?v=20261126-1` di `views/partials/head.ejs`.
- **Kondisi Baru:** §2 menambahkan daftar 7 token hero baru di `public/css/tokens.css` (zero blue hue); §4 memperbarui versi cache-busting `tokens.css` & komponen CSS publik di `views/partials/head.ejs` menjadi `?v=20261127-1`.

---

## 3. Verifikasi Akar Masalah Bug Kartu Berita (Kode Aktual)

Berdasarkan inspeksi langsung pada `public/css/components/news-cards.css`, `views/partials/news-card.ejs`, `public/js/news-filter.js`, dan `views/public/news-detail.ejs`:

1. **Stretched Link pada Kartu:** `views/partials/news-card.ejs` (L19) dan `renderCard()` di `public/js/news-filter.js` (L82) menggunakan `<a href="/news/..." class="nwl-card-title-link">` dengan pseudo-element `.nwl-card-title-link::after { position: absolute; inset: 0; z-index: 1; }` (`news-cards.css` L141-L146). Klik di area mana pun pada kartu memfokuskan tautan `<a>` ini.
2. **Penyebab Utama CSS (`public/css/components/news-cards.css` L131-L139):**
   - Selector `.nwl-card:focus-within` memberi `outline: var(--focus-ring-outline); outline-offset: 4px; border-radius: var(--r-xl);` pada kartu setiap kali elemen di dalamnya menerima fokus, **termasuk dari klik mouse/tap maupun pemulihan fokus browser**, bukan hanya navigasi keyboard.
3. **Penyebab Pemulihan Back Browser (Chromium bfcache / Focus Restoration):**
   - Saat pengguna mengklik kartu di `/news` (atau kartu terkait `.nwd-related-grid` di `/news/:slug`), berpindah ke halaman detail, lalu menekan tombol **Back**, Chromium memulihkan halaman dari bfcache bersama status fokus terakhir pada `.nwl-card-title-link`.
   - Dampaknya terjadi seragam pada `/news` (`.nwl-grid`) dan `/news/:slug` (`.nwd-related-grid`) karena keduanya memakai `views/partials/news-card.ejs` dan `public/css/components/news-cards.css`.
   - Karena restorasi bfcache Chromium pada sebagian kasus tetap memicu `:focus-visible` pada tautan terakhir, penggantian ke `.nwl-card:has(:focus-visible)` dilengkapi guard `pageshow` yang memanggil `blur()` jika `document.activeElement` berada di dalam `.nwl-card`.

---

## 4. Keputusan Terkunci (Disetujui Azis pada 2026-11-27)

|   #   | Topik                                | Pilihan Terkunci            | Ringkasan Kontrak Implementasi                                                                                                                                                                                                                                                                                                                                                                   |
| :---: | :----------------------------------- | :-------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | Tinggi Hero Mobile vs Desktop        | **1a**                      | Desktop & `<= 1024px`: `height: 100svh` (`min-height: 100vh`) penuh 1:1. Mobile (`<= 768px` & `<= 480px`): `min-height: 100svh; height: auto;` + `.hero-slide.is-active { position: relative; }` agar teks/CTA tidak pernah terpotong.                                                                                                                                                           |
| **2** | Scrim Tipis Tepi Atas Navbar         | **2a**                      | Tambah `--hero-overlay-top-scrim` (`top left / 100% 112px no-repeat`) di atas `--hero-overlay-desktop` untuk kontras WCAG AA (`>= 4.91:1`) navbar transparan tanpa menggelapkan badan foto kanan.                                                                                                                                                                                                |
| **3** | Animasi, Posisi & Sifat `JELAJAHI`   | **3a, Posisi 1, Dekoratif** | Rel tipis (`--hero-explore-track`) + runner putih (`--hero-explore-runner`) meluncur turun via `transform`/`opacity` (`2s infinite`, statis pada `prefers-reduced-motion: reduce`). Posisi di atas tombol WA (`right: 44px; bottom: 96px; z-index: 6;`, clearance `16px` di atas WA & bebas tooltip WA). Tetap dekoratif (`<div class="hero-explore-indicator" aria-hidden="true">`, 0 JS baru). |
| **4** | Gradasi Vertikal & `JELAJAHI` Mobile | **4a**                      | Gradasi vertikal mobile pekat di atas ke transparan di bawah (`--hero-overlay-mobile` `180deg`) mengikuti `justify-content: flex-start`; `.hero-explore-indicator` tetap `display: none` di `<= 768px`.                                                                                                                                                                                          |
| **5** | Strategi Fokus Kartu Berita          | **5a**                      | Ganti `.nwl-card:focus-within` -> `.nwl-card:has(:focus-visible)` (+ fallback `@supports not selector(:has(*))` untuk `.nwl-card-title-link:focus-visible`) + guard `pageshow` di `public/js/news-filter.js` & `public/js/news-detail.js`.                                                                                                                                                       |

---

## 5. Rencana Task Terkunci (Medium-Ready, Mulai T-468)

### T-468 `[Tier: Hydrogen Medium]` — Token Hero Baru, Pemindahan Markup Overlay ke Induk Hero & Cache-Busting

- **File Terdampak (4 file):**
  1. `public/css/tokens.css`
  2. `views/partials/home/hero-slider.ejs`
  3. `views/partials/home/hero-slide.ejs`
  4. `views/partials/head.ejs`
- **Langkah Implementasi:**
  1. Tambahkan 7 token hero baru berbasis palet hijau gelap korporat (`rgba(7, 31, 23, ...)` & `rgba(0, 87, 63, ...)`, zero blue hue) di `:root` `public/css/tokens.css` tanpa menghapus token `--hero-grad` lama.
  2. Hapus `<div class="hero-grad"></div>` dari dalam `.hero-bg` pada `views/partials/home/hero-slide.ejs` (L28).
  3. Tambahkan tepat 1 elemen `<div class="hero-grad" aria-hidden="true"></div>` sebagai anak langsung `<section class="hero hero-slider">` tepat setelah penutup `.hero-slides-wrapper` pada `views/partials/home/hero-slider.ejs`. Pertahankan `<div class="hero-explore-indicator" aria-hidden="true">` tetap dekoratif.
  4. Perbarui query string cache-busting `tokens.css` dan link `/css/components/*.css` pada `views/partials/head.ejs` menjadi `?v=20261127-1`.
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

### T-469 `[Tier: Argon Medium]` — CSS Hero 1:1 Viewport, Stacking Context, Directional Gradient & Animasi Scroll Cue

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

### T-470 `[Tier: Hydrogen Medium]` — Perbaikan Bug Border Fokus Kartu Berita Pasca-Klik & Navigasi Back

- **File Terdampak (3 file):**
  1. `public/css/components/news-cards.css`
  2. `public/js/news-filter.js`
  3. `public/js/news-detail.js`
- **Langkah Implementasi:**
  1. Pada `public/css/components/news-cards.css` (L131-L139), ganti blok `.nwl-card:focus-within` menjadi `.nwl-card:has(:focus-visible)` (`outline: var(--focus-ring-outline); outline-offset: 4px; border-radius: var(--r-xl);`), dan tambahkan blok `@supports not selector(:has(*))` yang memberikan `outline: var(--focus-ring-outline); outline-offset: 2px;` pada `.nwl-card-title-link:focus-visible` agar browser tanpa dukungan `:has()` tetap aksesibel (WCAG R-32).
  2. Pertahankan `.nwl-card-title-link:focus { outline: none; }` hanya ketika didukung `:has()`, atau gunakan `.nwl-card-title-link:focus:not(:focus-visible) { outline: none; }` ditambah `.nwl-card:has(:focus-visible) .nwl-card-title-link:focus-visible { outline: none; }` agar tidak pernah menghasilkan double outline maupun hilangnya fokus pada fallback.
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

### T-471 `[Tier: Argon Medium]` — QA Playwright Multi-Viewport, Kontras WCAG AA, Reduced-Motion & Simulasi Back Kartu Berita

- **File Terdampak (1 file):**
  1. `tests/test-hero-and-news-focus-qa.js` (skrip verifikasi E2E Playwright baru)
     _(Catatan temuan: `tests/test-rebrand-visual-functional.js` L100 bukan bagian dari `npm test` dan secara historis memeriksa string literal `rgba(0, 87, 63, 0.45)` di CSS publik; tidak perlu dimodifikasi kecuali diminta terpisah.)_
- **Langkah Implementasi:**
  1. Buat skrip Playwright `tests/test-hero-and-news-focus-qa.js` mengikuti pola `tests/test-news-carousel-revamp-e2e.js` untuk menguji rute `/`, `/news`, dan `/news/:slug` pada bahasa `id` & `en` di viewport `320px`, `375px`, `480px`, `768px`, `1024px`, `1280x720` (simulasi laptop 14" scaling 150%), dan `1440x900`.
  2. Verifikasi di `/` (Hero Section):
     - Tinggi `.hero.hero-slider` memenuhi `>= 99%` tinggi viewport desktop (0 celah putih bawah); di mobile `height >= viewportHeight` tanpa pemotongan konten CTA & 0 horizontal overflow.
     - `.hero-grad` merupakan direct child `.hero.hero-slider` dengan `z-index` di atas `.hero-bg` dan di bawah `.hero-content`, `.hero-slider-controls`, serta `.hero-explore-indicator`.
     - `.hero-bg img` tidak memiliki `filter: brightness(...)` dan `.hero-body` memiliki `max-width <= 540px`.
     - Pengecekan _bounding box_: `.hero-explore-indicator` berada di atas `.wa-float-btn` (jarak aman `>= 12px`, 0 tumpang tindih), tidak bertabrakan dengan `.hero-slider-controls` / `.hero-slider-next`, dan tersembunyi (`display: none`) pada `<= 768px`.
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

---

## 6. Dampak Ukuran Modul & Anggaran Baris CSS

| Berkas                                 | Ukuran / Baris Saat Ini | Batas Aturan                             | Estimasi Pasca-Perubahan                                                            | Status |
| :------------------------------------- | :---------------------- | :--------------------------------------- | :---------------------------------------------------------------------------------- | :----- |
| `.agents/INDEX.md`                     | 52 baris (9,3 KB)       | Maks 60 baris                            | 52 baris (update tanggal saja)                                                      | AMAN   |
| `.agents/prd/public-home.md`           | 61 baris (6,8 KB)       | Maks ~8 KB                               | ~7,4 KB                                                                             | AMAN   |
| `.agents/tech/public-home-sections.md` | 44 baris (6,4 KB)       | Maks ~8 KB                               | ~7,2 KB                                                                             | AMAN   |
| `.agents/tech/news-card.md`            | 33 baris (4,2 KB)       | Maks ~8 KB                               | ~4,6 KB                                                                             | AMAN   |
| `public/css/components/home-hero.css`  | 522 baris               | Maks `<= 600` baris (tes keras `<= 620`) | ~535-555 baris _(hemat ~18 baris dari penghapusan override `.hero-grad` per slide)_ | AMAN   |
| `public/css/components/news-cards.css` | 269 baris               | Maks `<= 600` baris                      | ~278 baris                                                                          | AMAN   |

---

## 7. Rencana CLOSE (Dijalankan Setelah T-468..T-471 `[DONE]`)

1. Jalankan gerbang kualitas penuh (`npm run lint`, `npm run lint:views`, `npm run lint:i18n`, `node --test tests/test-public-css-modular.js`, `npm test`, dan `node tests/test-hero-and-news-focus-qa.js`).
2. Hapus penanda `[PENDING T-468..T-471]` pada modul spek terkait.
3. Pindahkan `changes/2026-11-27_hero-readability-scroll-cue-and-news-card-focus.md` ke `.agents/archive/`.
4. Pindahkan task selesai `T-468..T-471` dari `.agents/3-TASKS.md` ke `.agents/archive/tasks-index-full.md`.
5. Perbarui tanggal verifikasi (`2026-11-27`) pada modul:
   - `.agents/prd/public-home.md`
   - `.agents/tech/public-home-sections.md`
   - `.agents/tech/news-card.md`
   - `.agents/tech/public-ui-css.md`
   - `.agents/INDEX.md` (baris Public Home, Public Home Sections, News Card & Arrows, Public UI: Modular CSS)
6. Tambahkan 1 baris entri di `.agents/CHANGELOG.md`:
   `- 2026-11-27 | Optimasi hero beranda 1:1 viewport, directional gradient overlay berbasis token, animasi scroll cue JELAJAHI, & perbaikan bug border fokus kartu berita pasca-Back | T-468..T-471`
