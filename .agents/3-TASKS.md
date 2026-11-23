# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 8 Task (T-395 s/d T-402)
- **Total Task Selesai:** 394 Task (T-01 s/d T-394)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-403**.

---

## Task Aktif / Terbuka (Open Tasks)

> **Proposal:** [changes/2026-11-23_about-timeline-vertical.md](changes/2026-11-23_about-timeline-vertical.md) — Revamp Timeline Sejarah `/about` Menjadi Vertikal (Gaya LRT Jakarta History)

### T-395: Helper Grouping Timeline per Tahun di `publicPageService` & Unit Test `[DONE]` `[Tier: Argon Medium]`
- **File Terdampak (2 file):**
  1. `services/publicPageService.js`
  2. `tests/test-public-services.js`
- **Langkah Implementasi:**
  1. Tambahkan fungsi murni `extractSortYear(label)` dan `groupTimelineByYear(timelineItems = [], lang = 'id', defaultDir = 'asc')` di `services/publicPageService.js` (`<= 40` baris/fungsi, `complexity <= 8`).
  2. Resolusi label tahun per item berdasarkan bahasa aktif (`lang === 'en' ? (item.year_label_en || item.year_label_id) : item.year_label_id`), trim string-nya, bentuk `yearKey` slug aman (`^[a-z0-9-]+$`), dan kelompokkan item dengan string label tahun persis yang sama ke dalam satu grup.
  3. Di dalam tiap grup, urutkan `milestones` berdasarkan `sort_order ASC, id ASC` dan simpan `count: milestones.length`.
  4. Urutkan daftar grup secara default **Terlama (`asc`)** berdasarkan `sortYear` (angka 4 digit pertama dari `/\b(\d{4})\b/`, fallback `Infinity` untuk label non-angka), dengan tie-breaker `firstSortOrder ASC, firstId ASC`; dukung parameter `defaultDir = 'desc'` untuk membalik urutan grup dan milestone.
  5. Eksport `groupTimelineByYear` dari `services/publicPageService.js` dan tambahkan unit test di `tests/test-public-services.js` untuk skenario: beberapa milestone di tahun yang sama, campuran tahun 4 digit dan teks era (`"1990"`, `"2000-an"`, `"Era Inovasi Hijau"`), fallback bahasa EN->ID, array kosong, serta urutan `asc` dan `desc`.
- **Kontrak Data Eksplisit:**
  - Fungsi tereksport: `groupTimelineByYear(timelineItems, lang = 'id', defaultDir = 'asc')`
  - Output item grup: `{ yearKey: string, yearLabel: string, sortYear: number, firstSortOrder: number, count: number, milestones: Array<{ id: number, title: string, description: string, sortOrder: number }> }`
- **Referensi Pola:** `buildTicketAcronym` & `getAboutPageData` pada `services/publicPageService.js`.
- **Batasan Negatif:** Dilarang mengubah skema database, `models/aboutTimelineModel.js`, atau controller admin; fungsi wajib murni tanpa memutasi array input.
- **Skill Relevan:** `test-driven-development`
- **Verifikasi Deterministik:**
  - `npm run lint`
  - `node --test tests/test-public-services.js`

---

### T-396: Penambahan Key i18n Dwibahasa (ID/EN) Timeline Vertikal `[DONE]` `[Tier: Hydrogen Medium]`
- **File Terdampak (3 file):**
  1. `locales/id.json`
  2. `locales/en.json`
  3. `tests/test-i18n-keys.js`
- **Langkah Implementasi:**
  1. Tambahkan 7 key i18n baru secara simetris di bawah objek `about` pada `locales/id.json` dan `locales/en.json`.
  2. Pertahankan key `about.timeline_default_*`, `about.timeline_empty`, `about.timeline_region_label`, dan `about.timeline_position`.
  3. Tambahkan pengujian keberadaan key baru tersebut di `tests/test-i18n-keys.js`.
- **Kontrak Data Eksplisit (Key i18n):**
  - `about.timeline_sort_label`: `"Urutkan Waktu"` (ID) / `"Sort Time"` (EN)
  - `about.timeline_sort_latest`: `"Terkini"` (ID) / `"Latest"` (EN)
  - `about.timeline_sort_oldest`: `"Terlama"` (ID) / `"Oldest"` (EN)
  - `about.timeline_year_label`: `"Pilih Tahun"` (ID) / `"Select Year"` (EN)
  - `about.timeline_year_nav_label`: `"Navigasi tahun linimasa sejarah"` (ID) / `"Historical timeline year navigation"` (EN)
  - `about.timeline_event_singular`: `"Peristiwa"` (ID) / `"Event"` (EN)
  - `about.timeline_event_plural`: `"Peristiwa"` (ID) / `"Events"` (EN)
- **Referensi Pola:** Namespace `about` di `locales/id.json` dan `locales/en.json`.
- **Batasan Negatif:** Dilarang menggunakan karakter em dash di nilai terjemahan baru; dilarang menghapus key i18n yang sudah dipakai seksi lain.
- **Skill Relevan:** `antislop-copywriting`
- **Verifikasi Deterministik:**
  - `npm run lint:i18n`
  - `node --test tests/test-i18n-keys.js`

---

### T-397: Refactor Partial EJS `history-timeline.ejs` ke Struktur Vertikal 2 Kolom `[OPEN]` `[Tier: Argon Medium]`
- **File Terdampak (2 file):**
  1. `views/partials/about/history-timeline.ejs`
  2. `services/publicPageService.js` *(menyertakan `timelineGroups` atau helper grouping ke view payload bila diperlukan)*
- **Langkah Implementasi:**
  1. Perbarui `views/partials/about/history-timeline.ejs` (`<= 100` baris, nesting `<= 2`, 0 komentar HTML, 0 atribut `style=""` atau handler inline).
  2. Hapus `aria-roledescription="carousel"` dan seluruh markup tombol `.abt-htl-nav` (`.abt-htl-btn--prev/next`).
  3. Pertahankan `header.abt-htl-header` (tagline, `h2.abt-htl-title`, `p.abt-htl-desc`) di atas layout dua kolom, `.abt-htl-live.sr-only`, serta `.abt-htl-empty` saat tidak ada item.
  4. Bentuk daftar grup tahun (dari `timelineGroups` atau pengelompokan lokal atas `timeline` untuk `currentLang` dengan urutan default `asc` / Terlama).
  5. Render `.abt-htl-layout[data-sort-dir="asc"]` berisi:
     - `<aside class="abt-htl-sidebar">`: blok `.abt-htl-sort-box` (label "Urutkan Waktu" + `.abt-htl-sort-group[role="group"]` dengan tombol *Terkini* `data-sort-dir="desc" aria-pressed="false"` dan tombol *Terlama* `data-sort-dir="asc" aria-pressed="true" is-active`) serta blok `.abt-htl-year-box` (label "Pilih Tahun" + `<nav class="abt-htl-year-nav">` berisi tombol `.abt-htl-year-pill` dengan `aria-current="true"` pada grup pertama dan `.abt-htl-pill-dot`).
     - `<div class="abt-htl-main">`: `.abt-htl-rail` (`<span class="abt-htl-rail-fill"></span>`) dan `<ol class="abt-htl-list" id="abt-htl-list">` berisi `<li class="abt-htl-group" id="abt-htl-yr-<yearKey>" data-year-key="<yearKey>">` -> `.abt-htl-group-head` (`.abt-htl-dot`, `h3.abt-htl-year`, `span.abt-htl-count` `"N Peristiwa"`) + `.abt-htl-cards` -> 1 `<article class="abt-htl-card">` per milestone (`.abt-htl-card-head` > `.abt-htl-card-marker` + `h4.abt-htl-item-title`, `hr.abt-htl-card-divider`, `p.abt-htl-item-desc`).
- **Kontrak Data Eksplisit (Class, ID & Data-Attribute):**
  - Root: `.abt-htl-block.reveal[data-od-id="company-timeline"][role="region"][aria-label]`
  - Header: `header.abt-htl-header > .abt-htl-header-copy > span.abt-htl-tagline + h2.abt-htl-title + p.abt-htl-desc`
  - Layout: `.abt-htl-layout[data-sort-dir="asc"]`
  - Sidebar: `aside.abt-htl-sidebar`, `.abt-htl-sort-box`, `.abt-htl-sidebar-label`, `.abt-htl-sort-group[role="group"]`, `button.abt-htl-sort-btn[data-sort-dir="desc|asc"][aria-pressed="false|true"]`, `.abt-htl-year-box`, `nav.abt-htl-year-nav[aria-label]`, `button.abt-htl-year-pill[data-year-target="abt-htl-yr-<yearKey>"][data-year-key="<yearKey>"][aria-current="true|false"]`, `span.abt-htl-pill-text`, `span.abt-htl-pill-dot`
  - Main: `.abt-htl-main`, `.abt-htl-rail[aria-hidden="true"] > span.abt-htl-rail-fill`, `ol.abt-htl-list#abt-htl-list`, `li.abt-htl-group#abt-htl-yr-<yearKey>[data-year-key="<yearKey>"]`, `.abt-htl-group-head` (`span.abt-htl-dot`, `h3.abt-htl-year`, `span.abt-htl-count`), `.abt-htl-cards` > `article.abt-htl-card` (`.abt-htl-card-head` > `span.abt-htl-card-marker` + `h4.abt-htl-item-title`, `hr.abt-htl-card-divider`, `p.abt-htl-item-desc`).
- **Referensi Pola:** `views/partials/about/history-timeline.ejs` dan `.agents/tech/conventions.md`.
- **Batasan Negatif:** Dilarang menulis inline style (`style=""`), inline script, komentar HTML, atau teks tanpa `t('about.*')`; file EJS wajib `<= 100` baris.
- **Skill Relevan:** `antislop-human`, `modern-web-guidance`
- **Verifikasi Deterministik:**
  - `npm run lint`
  - `npm run lint:views`
  - `npm run lint:i18n`

---

### T-398: Styling CSS Timeline Vertikal Desktop & Mobile + Pembersihan Slider Lama `[OPEN]` `[Tier: Argon Medium]`
- **File Terdampak (1 file):**
  1. `public/css/components.css`
- **Langkah Implementasi:**
  1. Hapus bersih seluruh aturan CSS slider horizontal lama di blok `.abt-htl-*` pada `public/css/components.css` (`.abt-htl-viewport`, `.abt-htl-track`, `scroll-snap-type`, `.abt-htl-nav`, `.abt-htl-btn`, `.abt-htl-line` horizontal, `scaleX`, dan breakpoint kolom 3/2/1 slider).
  2. Buat layout desktop (`>= 1024px`): `.abt-htl-layout` menggunakan CSS Grid 2 kolom (`minmax(220px, 260px) 1fr`, gap `clamp(40px, 5vw, 72px)`), dengan `.abt-htl-sidebar` `position: sticky; top: calc(var(--navbar-height, 80px) + var(--space-lg)); align-self: start`.
  3. Buat gaya `.abt-htl-sort-group` (segmented control kapsul `var(--color-surface-container)`, tombol aktif `[aria-pressed="true"]` berlatar `var(--color-surface)` + teks `var(--color-primary)` bold + `var(--shadow-level-1)`) dan `.abt-htl-year-nav` vertikal (tombol pill `min-height: 44px`, non-aktif `var(--color-surface-container)`, aktif `var(--color-primary)` + teks `var(--color-on-primary)` + titik kanan `.abt-htl-pill-dot` `8px` bulat putih).
  4. Buat gaya jalur kanan `.abt-htl-main`: garis `.abt-htl-rail` (`width: 2px; background: var(--primary-border)`) dimulai `28px` di atas heading tahun pertama dan berakhir tepat di pusat bulatan tahun terakhir (`height: var(--abt-htl-rail-height, 100%)`), dengan `.abt-htl-rail-fill` (`background: var(--color-primary-dark); transform-origin: top center; transform: scaleY(var(--abt-htl-progress, 0))`).
  5. Buat gaya `.abt-htl-group-head` (bulatan `.abt-htl-dot` tepat di sumbu rail, `.abt-htl-year` besar bold `tabular-nums`, `.abt-htl-count` `var(--color-text-muted-on-soft)`) dan `.abt-htl-card` (`background: var(--color-surface)`, `border: 1px solid var(--color-border)`, `border-radius: var(--radius-xl)`, kapsul kiri `.abt-htl-card-marker` `5px x 18px` `var(--color-primary)`, subjudul `.abt-htl-item-title` `var(--color-primary)`, `.abt-htl-card-divider`, `.abt-htl-item-desc`, serta state animasi masuk `.abt-htl-card.is-revealed`).
  6. Buat layout mobile & tablet (`< 1024px`): `.abt-htl-layout` menjadi 1 kolom; `.abt-htl-sidebar` menjadi bar atas sticky di bawah navbar (baris atas: label "Pilih Tahun" di kiri + segmented control di kanan; baris bawah: `.abt-htl-year-nav` horizontal `overflow-x: auto` tanpa scrollbar); kartu pada grup tahun aktif (`.abt-htl-group.is-active .abt-htl-card`) mendapat `border-color: var(--color-primary)`.
  7. Pastikan `@media (prefers-reduced-motion: reduce)` menonaktifkan transisi/transform masuk kartu dan smooth scroll.
- **Kontrak Data Eksplisit (CSS Custom Properties & Token):**
  - Custom properties: `--abt-htl-progress` (`0`..`1`), `--abt-htl-rail-height` (`px`).
  - Token warna wajib dari `public/css/tokens.css`: `var(--color-primary)`, `var(--color-primary-dark)`, `var(--color-on-primary)`, `var(--primary-subtle)`, `var(--primary-border)`, `var(--color-surface)`, `var(--color-surface-container)`, `var(--color-border)`, `var(--color-text-main)`, `var(--color-text-variant)`, `var(--color-text-muted-on-soft)`, `var(--focus-ring)`, `var(--focus-ring-outline)`.
- **Referensi Pola:** Blok `.abt-cnt-*` di `public/css/components.css` dan `public/css/tokens.css`.
- **Batasan Negatif:** Dilarang menulis kode warna hex/rgb mentah; dilarang mengubah CSS `.abt-cnt-*`, `.abt-vm-*`, `.abt-tkt-*`, `.abt-gal-*`, atau Homepage; wajib 0 horizontal overflow pada `320px`.
- **Skill Relevan:** `impeccable`, `antislop-layoutmobile`
- **Verifikasi Deterministik:**
  - `npm run lint`
  - `npm run lint:views`

---

### T-399: Interaksi JS Timeline Vertikal (Scroll-Spy, Progres `scaleY`, Reveal Kartu, Klik Tahun, Sort & Auto-Scroll Chip) `[OPEN]` `[Tier: Argon Medium]`
- **File Terdampak (1 file):**
  1. `public/js/about-story.js`
- **Langkah Implementasi:**
  1. Hapus fungsi slider horizontal lama (`getVisibleColumns`, `setBtnDisabled`, `animateLineSegment`, `syncTimelineVisuals`, `scrollToTimelineIndex`, `onViewportScroll`, `onTimelineKeydown`, `initHorizontalTimeline`) dari `public/js/about-story.js`.
  2. Implementasikan `initVerticalTimeline()` dengan fungsi-fungsi terdekomposisi rapi (`<= 40` baris/fungsi, `max-depth <= 2`, `complexity <= 8`).
  3. **Cache Geometri (`ResizeObserver`):** Hitung dan cache offset vertikal tiap `.abt-htl-group` serta jarak dari titik awal `.abt-htl-rail` ke pusat `.abt-htl-dot` grup terakhir; set `--abt-htl-rail-height` via `railEl.style.setProperty`.
  4. **Scroll-Spy & Progres Garis (`requestAnimationFrame` + `{ passive: true }`):** Pada event scroll, hitung rasio `0..1` terhadap `--abt-htl-rail-height`, set `--abt-htl-progress`, tentukan grup tahun aktif, toggle `.is-active` pada `.abt-htl-group` dan `.abt-htl-year-pill`, set `aria-current="true"` pada pill aktif (`"false"` pada pill lain), dan pada viewport `< 1024px` geser container `.abt-htl-year-nav` secara horizontal agar chip aktif selalu terlihat tanpa menggeser scroll halaman.
  5. **Klik Pill/Chip Tahun:** Saat `.abt-htl-year-pill` diklik, aktifkan pill target, perbarui `.abt-htl-live`, dan gulirkan halaman ke `.abt-htl-group` target (`scrollIntoView({ behavior: isReducedMotion() ? 'auto' : 'smooth', block: 'start' })`).
  6. **Sort Terkini / Terlama In-Place (`DocumentFragment`):** Saat `.abt-htl-sort-btn` diklik dan arah berubah (`asc` <-> `desc`), perbarui `aria-pressed` dan `data-sort-dir`, balik urutan node DOM `.abt-htl-group`, `.abt-htl-year-pill`, dan `.abt-htl-card` di dalam tiap `.abt-htl-cards` menggunakan `DocumentFragment`, terapkan kelas transisi singkat `.is-sorting` (bila non-reduced-motion), lalu hitung ulang cache geometri dan sinkronkan scroll-spy.
  7. **Reveal Masuk Kartu (`IntersectionObserver`):** Amati `.abt-htl-card` (`threshold: 0.15`) untuk menambahkan kelas `.is-revealed` satu kali saat kartu masuk viewport (langsung tambahkan `.is-revealed` ke semua kartu jika `isReducedMotion()`).
- **Kontrak Data Eksplisit:**
  - State classes & attributes: `.is-active`, `.is-sorting`, `.is-revealed`, `aria-current="true"`, `aria-pressed="true"`, `--abt-htl-progress`, `--abt-htl-rail-height`.
- **Referensi Pola:** `initCounterStats` & `isReducedMotion` pada `public/js/about-story.js`.
- **Batasan Negatif:** Dilarang membaca layout (`getBoundingClientRect` / `offsetTop`) berulang di setiap frame scroll tanpa cache; dilarang memakai `innerHTML`; dilarang mengubah `initCounterStats` dan `initBadgeHover`.
- **Skill Relevan:** `modern-web-guidance`, `performance-optimization`
- **Verifikasi Deterministik:**
  - `npm run lint`

---

### T-400: Penyesuaian Label & Petunjuk Pengelompokan Tahun di Form Admin Sejarah `[OPEN]` `[Tier: Hydrogen Medium]`
- **File Terdampak (2 file):**
  1. `views/admin/about/partials/modal-timeline.ejs`
  2. `views/admin/about/partials/tab-sejarah-timeline.ejs`
- **Langkah Implementasi:**
  1. Pada `views/admin/about/partials/modal-timeline.ejs`, sesuaikan placeholder pada `timeline_year_label_id` dan `timeline_year_label_en` (mis. `"contoh: 1990 atau 2015"`) agar admin memahami bahwa beberapa milestone dengan label tahun yang sama akan otomatis dikelompokkan di bawah satu tahun pada tampilan vertikal publik.
  2. Pastikan label kolom dan tombol aksi pada `views/admin/about/partials/tab-sejarah-timeline.ejs` tetap konsisten, bebas istilah slider horizontal, serta mematuhi batas `<= 100` baris dan nesting `<= 2`.
- **Kontrak Data Eksplisit:**
  - Field input form tetap: `year_label_id`, `year_label_en`, `title_id`, `title_en`, `description_id`, `description_en`, `sort_order`, `is_active`.
- **Referensi Pola:** `views/admin/about/partials/modal-timeline.ejs`.
- **Batasan Negatif:** Dilarang mengubah atribut `name` atau `id` input form maupun endpoint POST `/admin/about/timeline`.
- **Skill Relevan:** `antislop-copywriting`
- **Verifikasi Deterministik:**
  - `npm run lint:views`

---

### T-401: Pengujian Otomatis SSR, Interaksi & Multi-Viewport Timeline Vertikal `[OPEN]` `[Tier: Argon Medium]`
- **File Terdampak (2 file):**
  1. `tests/test-t313-about-story-htimeline.js`
  2. `tests/test-public-ssr.js` *(bila terdapat asersi class carousel horizontal lama)*
- **Langkah Implementasi:**
  1. Perbarui pengujian timeline di `tests/test-t313-about-story-htimeline.js` (dan `tests/test-public-ssr.js` bila terdampak) agar menguji struktur vertikal baru pada bahasa ID & EN.
  2. Verifikasi SSR: keberadaan `header.abt-htl-header`, `.abt-htl-sidebar`, `.abt-htl-sort-btn[aria-pressed]`, `nav.abt-htl-year-nav`, `.abt-htl-year-pill[aria-current]`, `.abt-htl-rail > .abt-htl-rail-fill`, `<ol class="abt-htl-list">`, `.abt-htl-group`, `.abt-htl-count` (`"Peristiwa"` / `"Event"`), `.abt-htl-card`, serta pastikan `aria-roledescription="carousel"` dan `.abt-htl-btn--prev/next` sudah tidak ada.
  3. Verifikasi Playwright pada viewport `320px`, `375px`, `390px`, `768px`, `1024px`, dan `1440px`:
     - `0` console error / page error dan `0` horizontal overflow (`scrollWidth <= innerWidth`).
     - Urutan default saat buka adalah **Terlama (`asc`)** (`[data-sort-dir="asc"][aria-pressed="true"]`).
     - Klik tombol **Terkini (`desc`)** membalik urutan DOM `.abt-htl-year-pill` dan `.abt-htl-group` tanpa reload serta mengubah `aria-pressed="true"`.
     - Klik pill tahun mengaktifkan `aria-current="true"` dan menggulir halaman ke grup tahun target.
     - Scroll halaman mengupdate `--abt-htl-progress` dan `.is-revealed` pada kartu.
     - Pada viewport `< 1024px`, kartu di dalam grup tahun aktif memiliki border warna primary (`var(--color-primary)`), dan target sentuh tombol memenuhi minimal `44px`.
- **Kontrak Data Eksplisit:**
  - Viewport uji wajib: `320x568`, `375x667`, `390x844`, `768x1024`, `1024x768`, `1440x900`.
- **Referensi Pola:** `tests/test-t313-about-story-htimeline.js`.
- **Batasan Negatif:** Dilarang menghapus pengujian Counter 2x2 (`.abt-cnt-*`) di berkas test tersebut.
- **Skill Relevan:** `browser-testing-with-devtools`, `test-driven-development`
- **Verifikasi Deterministik:**
  - `npm run lint`
  - `node --test tests/test-t313-about-story-htimeline.js`

---

### T-402: Audit Visual Presisi vs Referensi LRT Jakarta & Verifikasi Performa Scroll Mobile `[OPEN]` `[Tier: High]`
- **File Terdampak (maks 3 file bila perlu penyesuaian mikro):**
  1. `public/css/components.css`
  2. `public/js/about-story.js`
  3. `tests/test-t313-about-story-htimeline.js`
- **Langkah Implementasi:**
  1. Ambil tangkapan layar Playwright pada desktop (`1440x900`, `1024x768`) dan mobile (`390x844`, `320x568`), lalu bandingkan dengan `Design/Screenshot 2026-11-23 085207.png` serta `Design/Screenshot 2026-11-23 090417.png`.
  2. Pastikan kemiripan presisi pada: proporsi kolom sidebar sticky vs konten, bentuk segmented control *Terkini/Terlama*, pill tahun aktif dengan titik putih di kanan, posisi garis vertikal (mulai sedikit di atas tahun pertama dan berakhir tepat di bulatan tahun terakhir), ukuran heading tahun + `"N Peristiwa"`, kapsul vertikal kecil di kiri subjudul kartu, garis pemisah dalam kartu, serta bar chip tahun sticky + border kartu aktif di mobile.
  3. Jalankan uji scroll dengan emulasi CPU throttling 4x di Playwright/CDP untuk memastikan transisi antar tahun halus tanpa jank/CLS, serta uji regresi halaman `/admin/about` tab Sejarah.
- **Kontrak Data Eksplisit:**
  - Kriteria lulus: `0` console error, `0` horizontal overflow di `320px`, kontras WCAG AA lulus, lulus seluruh linter dan test suite terkait.
- **Referensi Pola:** `Design/Screenshot 2026-11-23 085207.png`, `Design/Screenshot 2026-11-23 090417.png`.
- **Batasan Negatif:** Dilarang menggunakan warna merah LRT atau font LRT; dilarang menyentuh komponen di luar `.abt-htl-*`.
- **Skill Relevan:** `impeccable`, `browser-testing-with-devtools`
- **Verifikasi Deterministik:**
  - `npm run lint && npm run lint:views && npm run lint:i18n`
  - `node --test tests/test-public-services.js tests/test-t313-about-story-htimeline.js`
