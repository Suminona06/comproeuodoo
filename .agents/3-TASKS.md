# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 3 Task (T-472 s/d T-474)
- **Total Task Selesai:** 471 Task (T-01 s/d T-471)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-475**.

---

## Task Aktif / Terbuka (Open Tasks)

### [x] T-472: Pembersihan Legacy CSS Header, Eliminasi Garis Batas Header-Hero, & Peningkatan Tipografi Header `[Tier: Argon Medium]`
- **Proposal & Spek:** `changes/2026-11-27_header-typography-seam-and-mobile-motion.md`, `prd/public-header-motion.md` (§1-§2), `tech/public-header-motion.md` (§1-§2).
- **File Terdampak (2 file):**
  - `public/css/tokens.css`
  - `public/css/layout.css`
- **Kontrak Data & Token Eksplisit:**
  - `public/css/tokens.css`:
    - Seragamkan `--header-actual-height: 96px` untuk desktop & mobile (hapus override `88px` di `@media (max-width: 768px)` agar sinkron dengan `--topbar-h: 32px` + `--site-header-h: 64px`).
    - Tambah `--header-nav-text-shadow: 0 1px 4px rgba(7, 31, 23, 0.55), 0 1px 2px rgba(0, 0, 0, 0.35);`.
    - Tambah `--header-backdrop-scrim: rgba(7, 31, 23, 0.52);`.
    - Tambah token motion header: `--hdr-motion-open-dur: 320ms;`, `--hdr-motion-close-dur: 260ms;`, `--hdr-motion-open-ease: cubic-bezier(0.22, 1, 0.36, 1);`, `--hdr-motion-close-ease: cubic-bezier(0.4, 0, 0.2, 1);`.
  - `public/css/layout.css`:
    - Hapus blok legacy duplikat/mati baris 184-340 (`.site-header`, `.top-bar`, `.navbar`, `.brand-logo*`, `.nav-menu`, `.nav-link`, `.nav-actions`, `.mobile-nav-toggle*`, `.mobile-drawer*`, `.mobile-drawer-backdrop*`).
    - `.site-header` v2 wajib memiliki `position: relative; background: transparent; border: none; box-shadow: none;`.
    - `.site-header::before` mempertahankan `background: var(--color-surface); border-bottom: 1px solid var(--color-border); box-shadow: var(--shadow-level-1); opacity: 0;` (terlihat saat `.is-scrolled`, `.header-wrap--solid`, atau `.menu-open`).
    - `.nav-link` (desktop & mobile) memakai `font-weight: var(--font-weight-semibold);`; `.nav-link.active` (desktop & mobile) memakai `font-weight: var(--font-weight-bold);`.
    - `.nav-link` desktop (`>= 1025px`) menambahkan `white-space: nowrap;` dan `text-shadow: var(--header-nav-text-shadow);`, direset `text-shadow: none;` pada `.header-wrap.is-scrolled .nav-link`, `.header-wrap--solid .nav-link`, `.header-wrap.menu-open .nav-link`, serta `.nav-menu .nav-link` di `@media (max-width: 1024px)`.
    - `.nav-menu` mobile (`<= 1024px`) memakai `max-height: calc(100dvh - var(--header-actual-height, 96px));` dan warna teks `.nav-menu .nav-link` memakai token `var(--color-text-main)`.
- **Langkah Pelaksanaan:**
  1. Tambahkan token `--header-nav-text-shadow`, `--header-backdrop-scrim`, `--hdr-motion-*`, dan seragamkan `--header-actual-height: 96px` pada `public/css/tokens.css`.
  2. Hapus blok legacy header & mobile-drawer (baris 184-340) pada `public/css/layout.css` tanpa menyentuh blok `.site-footer` mulai baris 345.
  3. Pastikan `.site-header` v2 me-reset `box-shadow: none; border: none; background: transparent;`, sedangkan border & shadow state putih tetap berada di `.site-header::before`.
  4. Perbarui `font-weight` `.nav-link` & `.nav-link.active` (desktop & mobile), tambahkan `white-space: nowrap` & `text-shadow` kondisional pada desktop, serta ganti warna teks hardcoded mobile menjadi `var(--color-text-main)`.
  5. Perbarui `max-height` `.nav-menu` mobile menjadi `calc(100dvh - var(--header-actual-height, 96px))` dan pastikan `.top-bar` tidak diubah bobot font-nya.
- **Referensi Pola:** `public/css/tokens.css` (blok `--font-weight-*` & `--hero-body-text-shadow`) dan `public/css/layout.css` (blok `.header-wrap` v2 baris 425-658).
- **Batasan Negatif:**
  - DILARANG menyentuh `public/css/components/home-hero.css`, `views/partials/home/*`, `views/public/index.ejs`, `public/js/main.js`, styling footer (`.site-footer`, `.ft-*`), maupun admin (`public/css/admin/*`).
  - DILARANG menambahkan nilai warna hex baru di luar token `public/css/tokens.css`.
- **Skill Relevan:** `antislop-ui`, `antislop-layoutmobile`.
- **Verifikasi Deterministik:**
  - `npm run lint && npm run lint:views && npm run lint:i18n`
  - `grep -rnE "mobile-drawer|mobile-nav-toggle" public/css/layout.css` (wajib 0 hasil).

---

### [x] T-473: Sinkronisasi Penuh Animasi Open/Close Drawer Mobile (Unified Corner Wipe 60fps Bebas Artefak) `[Tier: Argon Medium]`
- **Proposal & Spek:** `changes/2026-11-27_header-typography-seam-and-mobile-motion.md`, `prd/public-header-motion.md` (§3), `tech/public-header-motion.md` (§2-§3).
- **File Terdampak (2 file):**
  - `public/css/layout.css`
  - `public/js/main.js`
- **Kontrak Data & State Class Eksplisit:**
  - State class pada `#headerWrap`:
    - `.menu-open`: aktif saat drawer terbuka; **dilepas segera di `t = 0ms`** ketika `closeMobileMenu()` dipanggil.
    - `.hdr-wipe-opening` / `.hdr-wipe-closing`: aktif hanya selama fase transisi (`320ms` open / `260ms` close) untuk menyelaraskan `.site-header::before`, `.mobile-toggle span`, `.brand-name`, `.brand-badge`, `.hdr-wipe-panel`, dan `.hdr-wipe-backdrop`.
    - **Unified Corner Wipe (`@media (max-width: 1024px)` & `.header-wrap:not(.is-scrolled):not(.header-wrap--solid)`):**
      - `.site-header` memakai `isolation: isolate;`.
      - Idle tertutup: `.site-header::before` memiliki `opacity: 0; clip-path: circle(0% at 100% 100%); transition: opacity var(--ease);` (tanpa transisi `clip-path` saat scroll normal).
      - Scroll normal: `.header-wrap.is-scrolled .site-header::before` menimpa `clip-path: none; opacity: 1;` (0 efek wipe saat scroll).
      - Open (`.hdr-wipe-opening` + `.menu-open`): `.site-header::before` memiliki `opacity: 1; clip-path: circle(150% at 100% 100%); transition: clip-path var(--hdr-motion-open-dur) var(--hdr-motion-open-ease); will-change: clip-path;`.
      - Close (`.hdr-wipe-closing`, setelah `.menu-open` dilepas di `t = 0ms`): `.site-header::before` mempertahankan `opacity: 1;` selama transisi sembari `clip-path` menyusut ke `circle(0% at 100% 100%)` dengan `transition: clip-path var(--hdr-motion-close-dur) var(--hdr-motion-close-ease); will-change: clip-path;`.
      - **Proteksi Scrolled/Solid:** `.header-wrap.is-scrolled .site-header::before` dan `.header-wrap--solid .site-header::before` tetap `opacity: 1; clip-path: none;` sepanjang Open dan Close (0 kedip transparan).
  - State class pada `#navMenu` (`.hdr-wipe-panel`) & `#menuBackdrop` (`.hdr-wipe-backdrop`):
    - `.hdr-wipe-panel` (`<= 1024px`): idle `visibility: hidden; pointer-events: none; opacity: 0; clip-path: circle(0% at 100% 0%);`; `.open` `visibility: visible; pointer-events: auto; opacity: 1; clip-path: circle(150% at 100% 0%);`; `.hdr-wipe-opening` memasang `transition: clip-path var(--hdr-motion-open-dur) var(--hdr-motion-open-ease), opacity 120ms linear; overflow-y: hidden; will-change: clip-path, opacity;`; `.hdr-wipe-closing` mempertahankan `visibility: visible; pointer-events: none; overflow-y: hidden; will-change: clip-path, opacity; transition: clip-path var(--hdr-motion-close-dur) var(--hdr-motion-close-ease), opacity var(--hdr-motion-close-dur) var(--hdr-motion-close-ease);`. Saat animasi tuntas, `overflow-y: auto` kembali aktif pada `.open` dan `will-change` dilepas.
    - `.menu-backdrop` (`.hdr-wipe-backdrop`): hapus `backdrop-filter: blur(8px)` & `-webkit-backdrop-filter` serta ganti `display: none -> block` menjadi `visibility: hidden; opacity: 0; pointer-events: none; background: var(--header-backdrop-scrim);`; `.open` `visibility: visible; opacity: 1; pointer-events: auto;`; `.hdr-wipe-opening` / `.hdr-wipe-closing` memasang `transition: opacity var(--hdr-motion-open-dur|close-dur) var(--hdr-motion-open-ease|close-ease); will-change: opacity;` (dan `.hdr-wipe-closing` menahan `visibility: visible; pointer-events: none;` sampai selesai).
    - `.mobile-toggle span`, `.brand-name`, `.brand-badge`: menyelaraskan durasi transisi ke `var(--hdr-motion-open-dur)` saat `.hdr-wipe-opening` dan `var(--hdr-motion-close-dur)` saat `.hdr-wipe-closing`.
- **Langkah Pelaksanaan:**
  1. Perbarui aturan `.site-header`, `.site-header::before`, `.mobile-toggle span`, `.brand-name`, `.brand-badge`, `.menu-backdrop`, `.hdr-wipe-panel`, `.hdr-wipe-backdrop`, dan `@media (prefers-reduced-motion: reduce)` pada `public/css/layout.css` sesuai kontrak Unified Corner Wipe.
  2. Refaktor `openMobileMenu()` dan `closeMobileMenu()` pada `public/js/main.js` untuk mengganti interpolasi per-frame Anime.js dengan pengontrol CSS transition berbasis state class + satu `transitionend` listener (target `#navMenu`, properti `clip-path`) + fallback `setTimeout` (`open: 380ms`, `close: 320ms`), tanpa menulis inline `style` pada `#navMenu`, `li`, maupun `#menuBackdrop`.
  3. Pastikan `closeMobileMenu()` langsung melepas `.menu-open` dari `#headerWrap` dan `.active` dari `#mobileToggle` di `t = 0ms`, mendukung rapid tap 100% interruptible (membatalkan timer/listener aktif sebelum membalik arah tanpa lock tersangkut), serta mengelola `body.menu-scroll-locked` dengan bersih.
  4. Pertahankan seluruh perilaku aksesibilitas & fallback: `prefers-reduced-motion: reduce` (instan), `Escape` (tutup & fokus kembali ke `#mobileToggle`), klik backdrop/luar, klik tautan drawer, dan auto-close saat resize `> 1024px`.
  5. Pastikan seluruh class fase animasi (`.hdr-wipe-opening`, `.hdr-wipe-closing`, `.hdr-wipe-animating`) dilepas saat selesai sehingga `will-change` kembali `auto` dan `0` inline `style` tersisa.
- **Referensi Pola:** `public/js/main.js` (`applyScrollState` dengan rAF + state guard baris 7-25) & `public/css/layout.css` (blok `.hdr-wipe-*` & `@media (prefers-reduced-motion: reduce)` baris 752-802).
- **Batasan Negatif:**
  - DILARANG menyentuh `public/css/components/home-hero.css`, section beranda, `views/partials/navbar.ejs`, atau menghapus library global `anime.js`.
  - DILARANG menganimasikan properti layout (`width`, `height`, `top`, `padding`, `grid-template-rows`), memakai `backdrop-filter: blur()` pada `.menu-backdrop`, memasang `will-change` permanen di CSS statis, atau memakai inline handler/style yang melanggar CSP.
- **Skill Relevan:** `antislop-ui`, `antislop-layoutmobile`.
- **Verifikasi Deterministik:**
  - `npm run lint && npm run lint:views && npm run lint:i18n`
  - `node tests/test-mobile-header.js && node tests/test-t387-t394-variants-and-header.js`

---

### [ ] T-474: QA E2E Playwright Multi-Viewport, Audit Performa CDP 4x CPU Throttling, & Regresi Visual Header `[Tier: Argon Medium]`
- **Proposal & Spek:** `changes/2026-11-27_header-typography-seam-and-mobile-motion.md`, `prd/public-header-motion.md` (§1-§3), `tech/public-header-motion.md` (§4).
- **File Terdampak (2 file):**
  - `tests/test-header-typography-seam-motion-qa.js` *(baru)*
  - `tests/test-t387-t394-variants-and-header.js` *(hanya bila ada assertion durasi/mekanisme lama yang perlu diselaraskan)*
- **Kontrak Verifikasi Eksplisit:**
  - Halaman uji: transparan (`/`, `/about`, `/products`, `/news`, `/contact`) + solid (1 detail produk `/products/<slug>` & 1 detail berita `/news/<slug>`).
  - Viewport: `320px`, `375px`, `390px`, `768px`, `1024px`, `1025px`, `1440px` dalam bahasa **ID & EN**.
  - Gerbang lulus:
    1. Tipografi: `fontWeight === '600'` pada `.nav-link` normal & `'700'` pada `.nav-link.active` (desktop & mobile); `textShadow !== 'none'` saat transparan desktop dan `'none'` saat `.is-scrolled`/`.header-wrap--solid`/`.menu-open`/mobile; `0` line-wrap desktop (`1025px`, `1440px`, ID/EN); target sentuh `#mobileToggle` & `.nav-menu .nav-link` `>= 44x44px`.
    2. Anti-Seam: `scrollY = 0` halaman transparan -> `.site-header` `boxShadow === 'none'`, `borderBottomWidth === '0px'`, `.site-header::before` `opacity === '0'`; saat `.is-scrolled` dan `--solid` -> `.site-header::before` `opacity === '1'`, `borderBottomWidth === '1px'`, `boxShadow !== 'none'`.
    3. Sinkronisasi Close Unified Corner Wipe: `< 50ms` pasca klik tutup pada `scrollY = 0` -> `#headerWrap` tidak punya `.menu-open`, punya `.hdr-wipe-closing`, `#mobileToggle` tidak punya `.active`, `#navMenu` punya `.hdr-wipe-closing`; selesai `<= 360ms` -> semua kelas animasi bersih & `.site-header::before` `opacity === '0'`. Pada `.is-scrolled` dan `--solid`, `.site-header::before` tetap `opacity === '1'` dan `clipPath === 'none'` sepanjang Open/Close (0 kedip).
    4. Performa CDP (`Emulation.setCPUThrottlingRate({ rate: 4 })`): `CLS === 0`, `0` long task `> 50ms`, `backdropFilter === 'none'` pada `.menu-backdrop` & `.site-header::before` non-scrolled, `willChange === 'auto'` & `0` inline `style` tersisa pasca selesai.
    5. Edge Cases: rapid tap buka-tutup 5x berulang (state akhir konsisten), `Escape` mengembalikan fokus ke `#mobileToggle`, klik luar/backdrop menutup menu, resize `375px -> 1280px` auto-close bersih, `prefers-reduced-motion: reduce` instan, `0` console error / page error.
- **Langkah Pelaksanaan:**
  1. Buat `tests/test-header-typography-seam-motion-qa.js` mengikuti pola helper Playwright & CDP di repo.
  2. Implementasikan 5 grup pengujian deterministik di atas pada halaman transparan & solid, 7 viewport, dan ID/EN.
  3. Jalankan seluruh suite header (`test-header-typography-seam-motion-qa.js`, `test-mobile-header.js`, `test-t387-t394-variants-and-header.js`) dan selaraskan assertion lama di `test-t387-t394-variants-and-header.js` bila perlu hingga 100% lulus.
- **Referensi Pola:** `tests/test-hero-and-news-focus-qa.js` dan `tests/test-t387-t394-variants-and-header.js`.
- **Batasan Negatif:**
  - DILARANG memodifikasi file kode produksi (`views/`, `public/`, `controllers/`, `services/`) atau data database pada task ini.
- **Skill Relevan:** `browser-testing-with-devtools`.
- **Verifikasi Deterministik:**
  - `npm run lint && npm run lint:views && npm run lint:i18n`
  - `node tests/test-header-typography-seam-motion-qa.js && node tests/test-mobile-header.js && node tests/test-t387-t394-variants-and-header.js`
