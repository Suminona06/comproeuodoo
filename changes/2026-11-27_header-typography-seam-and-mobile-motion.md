# Proposal Perubahan: Perbaikan Tipografi Header, Eliminasi Garis Batas Header-Hero, & Sinkronisasi Animasi Drawer Mobile

Tanggal: 2026-11-27 | Status: MERGED TO SPEC (Task T-472..T-474 Terdaftar di .agents/3-TASKS.md) | Modul Terkait: `prd/public-home-sections.md` -> pecahan baru `prd/public-header-motion.md` & `tech/public-header-motion.md`

---

## 1. Konteks
Header publik saat ini menampilkan garis bayangan tipis di batas bawah header transparan terhadap hero, memiliki bobot teks navigasi yang kurang kontras di atas foto hero, serta mengalami animasi drawer mobile yang patah-patah dengan risiko artefak hitam di Chrome Android dan keterlambatan hilangnya latar putih header saat menutup. Proposal ini memperbaiki akar masalah CSS/JS khusus pada komponen Header/Navbar publik (desktop & mobile) tanpa menyentuh section beranda yang dibekukan, serta membersihkan aturan CSS legacy header yang duplikat/mati.

---

## 2. Hasil Verifikasi Akar Masalah (Berdasarkan Pembacaan Kode Aktual)

### A1. Garis Horizontal di Batas Bawah Header & Hero Section
1. **Akar Masalah Utama (`public/css/layout.css` baris 184-191 vs baris 525-529):**
   - Blok legacy `.site-header` (baris 184-191) memasang `border-bottom: 1px solid var(--color-border)` dan `box-shadow: var(--shadow-level-1)`.
   - Blok override v2 `.site-header` (baris 525-529) hanya me-reset `position: relative`, `background: transparent`, dan `border: none`, tetapi **tidak me-reset `box-shadow`**. Akibatnya `box-shadow: var(--shadow-level-1)` terus tergambar di tepi bawah `.site-header` (`y = 96px`) saat header transparan di atas hero, baik desktop maupun mobile.
   - Blok legacy `.top-bar` (baris 193-199) juga mendeklarasikan `border-bottom` dan `padding` duplikat sebelum ditimpa di baris 452-463.
2. **Temuan Tambahan Baca-Saja pada `public/css/components/home-hero.css` (DIBEKUKAN):**
   - Baris 127-133 dan 489-491 menggunakan `background: var(--hero-overlay-top-scrim) top left / 100% 104px no-repeat`, dengan gradient di `public/css/tokens.css` baris 84 yang turun tajam dari opasitas `0.56` di `58%` (`~60px`) menuju `0` di `100%` (`104px`, tepat 8px di bawah tepi header `96px`).
   - Sesuai keputusan pembekuan, `home-hero.css` dan `--hero-overlay-top-scrim` **tidak disentuh** pada eksekusi awal. Jika setelah pembersihan `box-shadow` di `layout.css` masih tampak batas scrim halus pada beranda, izin terpisah akan diminta terlebih dahulu.

### A2. Jank Animasi Drawer Mobile, Artefak Blok Hitam Chrome Android, & Gejala CLS
1. **Animasi `clip-path` per-frame di main thread & durasi menyimpang dari spek (`public/js/main.js` baris 96-102, 191-197):**
   - Implementasi saat ini menggunakan Anime.js untuk menginterpolasi `clipPath` via inline style per frame dengan durasi `560ms` (Open) dan `480ms` (Close), menyimpang dari kontrak spek (`360ms`/`240ms`), pada panel `.nav-menu` yang memiliki `overflow-y: auto` dan `box-shadow: var(--shadow-level-3)` (`layout.css:1158-1160`).
2. **Pemicu Artefak Blok Hitam Compositor Chromium (`public/css/layout.css` baris 752-765, 788-791):**
   - `.menu-backdrop` menggabungkan transisi `display: none` -> `display: block`, `backdrop-filter: blur(8px)`, animasi `opacity` per-frame, serta `will-change: clip-path, transform, opacity` di atas hero yang juga memiliki layer blur. Kombinasi ini memicu *black tile artifact* dan drop frame pada Skia/Viz Chrome Android.
3. **Ketidaksinkronan Tinggi Header & Rapid-Tap State (`public/css/tokens.css` baris 291 & 325 vs `public/css/layout.css` baris 428, 439, 1159; `public/js/main.js` baris 125 & 152):**
   - `tokens.css` mendefinisikan `--header-actual-height: 92px` (desktop) dan `88px` (`<= 768px`), sedangkan `layout.css` menimpanya menjadi `96px` (`--topbar-h: 32px` + `--site-header-h: 64px`), sementara `.nav-menu` memakai `max-height: calc(100dvh - 80px)`.
   - `openMobileMenu()` memblokir panggilan saat `isMenuAnimating === true`, sedangkan selama close `480ms` class `.open` tetap menempel sampai `finalizeClose()`, menyebabkan klik cepat buka-tutup memicu ulang close atau state macet.
4. **CSS Legacy Mati & Duplikat (`public/css/layout.css` baris 184-340):**
   - Hasil audit grep seluruh `views/` dan `public/`: selector `.mobile-nav-toggle*`, `.mobile-drawer*`, `.mobile-drawer-backdrop*`, dan `.brand-logo*` memiliki **0 pemakaian**, sedangkan `.site-header`, `.top-bar`, `.navbar`, `.nav-menu`, `.nav-link`, `.nav-actions` pada blok baris 184-271 adalah duplikat dari blok v2 baris 425-750.

### A3. Latar Putih Header Terlambat Menghilang saat Animasi Close
- **Terverifikasi di `public/js/main.js` baris 151-202 & `public/css/layout.css` baris 531-554, 698-746:**
  - Di `t = 0ms`, `closeMobileMenu()` hanya memanggil `toggle.classList.remove('active')` (morph X -> 3 garis selesai di `300ms`, tetapi warna ikon tetap gelap karena `.header-wrap.menu-open` masih aktif).
  - `headerWrap.classList.remove('menu-open')` baru dipanggil di dalam `finalizeClose()` pada `t = 480ms`, baru kemudian `.site-header::before` memulai transisi CSS `opacity: 1 -> 0` selama `250ms` (total selesai di `t = 730ms`), jauh tertinggal setelah drawer selesai menyusut.

---

## 3. Keputusan Terkunci (Disetujui Azis, 2026-11-27)

1. **Tipografi Header (Opsi 1c):** `.nav-link` normal memakai `var(--font-weight-semibold)` (`600`) & `.active` memakai `var(--font-weight-bold)` (`700`) di desktop dan mobile, `.top-bar` tetap, ditambah `text-shadow` halus berbasis token `--header-nav-text-shadow` khusus saat header transparan di atas hero (otomatis `none` saat `.is-scrolled`, `.header-wrap--solid`, atau `.menu-open`).
2. **Backdrop Mobile (Opsi 2a):** Hapus `backdrop-filter: blur()` dari `.menu-backdrop`; gunakan scrim gelap semi-transparan murni berbasis token `--header-backdrop-scrim` (100% GPU composited `opacity`) demi 60fps lancar & bebas artefak hitam Chrome Android.
3. **Animasi Hilangnya Latar Putih Header saat Close (Opsi 3b dengan Syarat Ketat 0 Artefak & 0 Lag):** Latar putih `.site-header::before` (pada kondisi non-scrolled & non-solid) ikut menyusut searah *corner wipe* (kiri-bawah ke kanan-atas, titik pusat `100% 100%` yang menyatu persis dengan titik pusat `100% 0%` milik `.hdr-wipe-panel`) serempak di `t = 0ms` bersama drawer, morph & warna hamburger, teks brand, dan backdrop dalam 1 durasi/kurva CSS native terpadu. Wajib lolos gerbang ketat tanpa artefak compositor & tanpa lag (CDP CPU throttling 4x, `0` long task `> 50ms`, `CLS = 0`).
4. **Garis Batas Header saat Scrolled/Solid (Opsi 4a):** `0` garis & `0` bayangan saat header transparan di atas hero, tetap pertahankan `border-bottom` (`var(--color-border)`) & bayangan lembut (`var(--shadow-level-1)`) pada `.site-header::before` saat header putih (`.is-scrolled` / `.header-wrap--solid`).
5. **Cakupan Halaman (Opsi 5a):** Seluruh halaman publik (beranda, sub-halaman hero transparan, dan halaman detail solid); halaman admin tidak disentuh.
6. **Pemecahan Modul PRD (Disetujui: Ya):** Pecah §7 FR-24 dari `prd/public-home-sections.md` menjadi modul mandiri `prd/public-header-motion.md` saat tahap Merge, lalu perbarui tautan PRD pada baris `Public Header & Motion` di `.agents/INDEX.md`.
7. **Pembekuan `home-hero.css` (Disetujui: Ya):** `public/css/components/home-hero.css` dan seluruh section beranda tetap dibekukan penuh pada eksekusi ini; izin terpisah baru akan diminta hanya jika pasca-perbaikan `layout.css` masih tampak pita halus dari `--hero-overlay-top-scrim` (`104px`).

---

## 4. Delta Spesifikasi per Modul

### 4.1. `prd/public-home-sections.md` & Modul Baru `prd/public-header-motion.md`

| Aspek | Kondisi Lama (`prd/public-home-sections.md` §7) | Kondisi Baru (`prd/public-header-motion.md`) |
| :--- | :--- | :--- |
| **Struktur Modul** | §7 FR-24 berada di akhir `prd/public-home-sections.md` (7.647 bytes, mendekati batas ~8KB). | §7 FR-24 dipindah ke modul mandiri `prd/public-header-motion.md` (~2,4 KB); `prd/public-home-sections.md` turun menjadi ~6,5 KB dan menautkan referensi singkat ke modul header. |
| **Tipografi Teks Header** | Belum diatur eksplisit; implementasi eksisting memakai bobot `500` untuk `.nav-link` dan `600` untuk `.active`. | Seluruh halaman publik (beranda, sub-halaman hero, dan halaman solid; admin tidak disentuh) memakai `var(--font-weight-semibold)` untuk `.nav-link` normal dan `var(--font-weight-bold)` untuk `.nav-link.active` di desktop & mobile (`.top-bar` tetap), ditambah `text-shadow` halus berbasis token `--header-nav-text-shadow` khusus saat header transparan di atas hero, dengan jaminan `0` line-wrap di desktop `1025px..1440px` (ID & EN). |
| **Batas Header-Hero** | Tidak diatur secara khusus; bayangan legacy bocor saat header transparan. | Header transparan (non-scrolled, non-solid, menu tertutup) memiliki `0` garis batas dan `0` bayangan ke hero section di desktop maupun mobile. Saat `.is-scrolled` atau `.header-wrap--solid`, header putih mempertahankan garis batas (`var(--color-border)`) dan bayangan lembut (`var(--shadow-level-1)`) agar terpisah jelas dari konten putih. |
| **Sinkronisasi Open/Close Drawer Mobile** | Corner wipe `360ms` buka / `240ms` tutup berbasis Anime.js v3.2.2; latar putih header tertinggal saat tutup. | Saat **Open** (kanan-atas ke kiri-bawah) maupun **Close** (kiri-bawah ke kanan-atas), panel drawer dan latar putih `.site-header::before` (pada kondisi non-scrolled & non-solid) melakukan *corner wipe* menyatu dari titik sudut kanan-bawah header/kanan-atas drawer **serempak dari `t = 0ms`** bersama transisi bentuk & warna ikon hamburger (X -> 3 garis), warna brand, dan pudarnya backdrop dalam durasi & kurva tunggal. Pada kondisi `.is-scrolled` atau `.header-wrap--solid`, header mempertahankan latar solid/frosted tanpa berkedip transparan saat drawer ditutup. |
| **Kelancaran Chrome Android & CLS** | Bebas jitter saat scroll, `CLS = 0`. | Animasi drawer, header wipe, dan backdrop wajib lancar 60fps tanpa lag dan `0` artefak blok hitam di Chrome Android & Safari iOS, `CLS = 0`, rapid tap buka-tutup selalu responsif (interruptible) tanpa state tersangkut, serta patuh `prefers-reduced-motion: reduce`, aksesibilitas keyboard (`Escape`), dan target sentuh `>= 44x44px`. |

### 4.2. `tech/public-header-motion.md`

| Aspek | Kondisi Lama | Kondisi Baru |
| :--- | :--- | :--- |
| **Pembersihan Legacy & Anti-Seam** | Tidak mendokumentasikan blok legacy `.site-header`/`.mobile-drawer*` maupun sinkronisasi `--header-actual-height`. | Hapus total blok CSS legacy mati/duplikat (`layout.css:184-340`). `.site-header` dasar wajib `background: transparent; border: none; box-shadow: none;`. Permukaan solid/frosted, `border-bottom: 1px solid var(--color-border)`, dan `box-shadow: var(--shadow-level-1)` hanya dipasang pada `.site-header::before`. Seragamkan `--header-actual-height: 96px` (`--topbar-h: 32px` + `--site-header-h: 64px`) di `tokens.css` & `layout.css`, serta `max-height: calc(100dvh - var(--header-actual-height, 96px))` pada `.nav-menu` mobile. |
| **Token Tipografi Header** | Tidak ada kontrak token tipografi header. | `.nav-link` menggunakan `var(--font-weight-semibold)`, `.nav-link.active` menggunakan `var(--font-weight-bold)` (desktop & mobile), `white-space: nowrap` pada desktop (`>= 1025px`), dan `text-shadow: var(--header-nav-text-shadow)` hanya ketika `:not(.is-scrolled):not(.header-wrap--solid):not(.menu-open)` (direset ke `none` pada state putih/solid/drawer terbuka). |
| **Backdrop Mobile (`.menu-backdrop`)** | Menggunakan `backdrop-filter: blur(8px)` dengan toggle `display: none -> block`. | Hapus total `backdrop-filter: blur()` pada `.menu-backdrop`. Gunakan `background: var(--header-backdrop-scrim)` dengan `visibility` + `opacity` composited murni (`will-change: opacity` hanya saat `.hdr-wipe-animating`, tanpa `display: none -> block` mendadak), menghilangkan penyebab artefak blok hitam Chromium. |
| **Mesin Animasi & Corner Wipe Menyatu (`.hdr-wipe-*`)** | Anime.js v3.2.2 menginterpolasi `clipPath` inline per-frame (`560ms`/`480ms` di kode, `360ms`/`240ms` di spek); `.menu-open` baru dilepas di `finalizeClose()`. | Beralih ke **CSS Native Composited Transitions** terkendali state class (`.hdr-wipe-opening`, `.hdr-wipe-closing`, `.hdr-wipe-animating`) tanpa penulisan inline `style.clipPath` per-frame via JS dan tanpa `overflow-y: auto` selama transisi (`overflow-y: hidden` saat `.hdr-wipe-animating`, kembali `overflow-y: auto` saat idle terbuka). Durasi tunggal terkunci via token: `--hdr-motion-open-dur: 320ms` (`cubic-bezier(0.22, 1, 0.36, 1)`) dan `--hdr-motion-close-dur: 260ms` (`cubic-bezier(0.4, 0, 0.2, 1)`). **Unified Corner Wipe:** pada `@media (max-width: 1024px)` untuk `.header-wrap:not(.is-scrolled):not(.header-wrap--solid)`, `.site-header::before` (tanpa `backdrop-filter`) memakai `clip-path: circle(0% at 100% 100%)` <-> `circle(150% at 100% 100%)` yang berbagi pusat geometri tepat dengan `.hdr-wipe-panel` (`circle(0% at 100% 0%)` <-> `circle(150% at 100% 0%)`). Saat **Close (`t = 0ms`)**, JS langsung melepas `.menu-open` dari `#headerWrap` & `.active` dari `#mobileToggle` dan memasang `.hdr-wipe-closing` (yang menjaga `opacity: 1` pada `.site-header::before` & `visibility: visible` pada `.hdr-wipe-panel` selama `260ms` sampai `clip-path` mencapai `0%`), sehingga header wipe, drawer wipe, morph & warna hamburger, brand text, dan backdrop berjalan **100% serempak**. State `.is-scrolled` & `.header-wrap--solid` mengecualikan rule `clip-path` (tetap `opacity: 1; clip-path: none`), sehingga 0 kedip transparan saat close dan 0 efek wipe saat scroll normal. Klik cepat 100% interruptible tanpa lock tersangkut; `will-change` dilepas di `transitionend` / fallback timeout. |
| **Kriteria Verifikasi Performa** | CPU throttling 4x, 0 long task `> 50ms`, `CLS = 0`. | Diperketat dengan Playwright + CDP CPU throttling 4x: `0` artefak compositor (`backdrop-filter: none` pada `.menu-backdrop` & pada `.site-header::before` saat non-scrolled), `0` long task `> 50ms`, `CLS = 0`, `0` inline `style` tersisa, `will-change: auto` pasca animasi, `0` garis batas transparan, dan `0` kedip pada state `.is-scrolled` / `--solid`. |

---

## 5. Rencana Task Implementasi (Medium-Ready, Mulai T-472)

*Nomor task dilanjutkan langsung dari `.agents/3-TASKS.md` (terakhir selesai: `T-471`). Seluruh kontrak sudah final mengikuti keputusan terkunci.*

### T-472: Pembersihan Legacy CSS Header, Eliminasi Garis Batas Header-Hero, & Peningkatan Tipografi Header `[Tier: Argon Medium]`
- **File Terdampak (2 file):**
  - `public/css/tokens.css`
  - `public/css/layout.css`
- **Kontrak Data & Token Eksplisit:**
  - Token di `public/css/tokens.css`:
    - Seragamkan `--header-actual-height: 96px` untuk desktop & mobile (hapus override `88px` pada `@media (max-width: 768px)` agar sinkron dengan `--topbar-h: 32px` + `--site-header-h: 64px`).
    - Tambah `--header-nav-text-shadow: 0 1px 4px rgba(7, 31, 23, 0.55), 0 1px 2px rgba(0, 0, 0, 0.35);` (berbasis palet `--surface-dark-deep` / bayangan hero, halus untuk keterbacaan di atas foto).
    - Tambah `--header-backdrop-scrim: rgba(7, 31, 23, 0.52);` (scrim gelap semi-transparan murni tanpa blur).
    - Tambah token motion header:
      - `--hdr-motion-open-dur: 320ms;`
      - `--hdr-motion-close-dur: 260ms;`
      - `--hdr-motion-open-ease: cubic-bezier(0.22, 1, 0.36, 1);`
      - `--hdr-motion-close-ease: cubic-bezier(0.4, 0, 0.2, 1);`
  - Selector di `public/css/layout.css`:
    - Hapus blok legacy duplikat/mati baris 184-340 (`.site-header`, `.top-bar`, `.navbar`, `.brand-logo*`, `.nav-menu`, `.nav-link`, `.nav-actions`, `.mobile-nav-toggle*`, `.mobile-drawer*`, `.mobile-drawer-backdrop*`).
    - `.site-header` v2 wajib memiliki `position: relative; background: transparent; border: none; box-shadow: none;`.
    - `.site-header::before` memiliki `background: var(--color-surface); border-bottom: 1px solid var(--color-border); box-shadow: var(--shadow-level-1); opacity: 0;` (hanya terlihat saat `.is-scrolled`, `.header-wrap--solid`, atau `.menu-open`).
    - `.nav-link` desktop & mobile memakai `font-weight: var(--font-weight-semibold);`, `.nav-link.active` desktop & mobile memakai `font-weight: var(--font-weight-bold);`.
    - `.nav-link` desktop menambahkan `white-space: nowrap;` dan `text-shadow: var(--header-nav-text-shadow);`; direset menjadi `text-shadow: none;` pada `.header-wrap.is-scrolled .nav-link`, `.header-wrap--solid .nav-link`, `.header-wrap.menu-open .nav-link`, serta `.nav-menu .nav-link` di `@media (max-width: 1024px)`.
    - `.nav-menu` mobile memakai `max-height: calc(100dvh - var(--header-actual-height, 96px));` dan mengganti warna teks hardcoded pada `.nav-menu .nav-link` menjadi token `var(--color-text-main)`.
- **Langkah Pelaksanaan:**
  1. Tambahkan token tipografi, scrim backdrop, & durasi/easing motion header serta seragamkan `--header-actual-height: 96px` di `public/css/tokens.css`.
  2. Hapus blok legacy header/mobile-drawer baris 184-340 di `public/css/layout.css` (pastikan blok `.site-footer` mulai baris 345 tidak terhapus).
  3. Perbarui `.site-header` v2 dengan `box-shadow: none; border: none; background: transparent;` dan pastikan `.site-header::before` mempertahankan `border-bottom: 1px solid var(--color-border)` dan `box-shadow: var(--shadow-level-1)` untuk state putih (`.is-scrolled`, `.header-wrap--solid`, `.menu-open`).
  4. Perbarui `font-weight` `.nav-link` (`var(--font-weight-semibold)`) dan `.nav-link.active` (`var(--font-weight-bold)`), tambahkan `white-space: nowrap` (desktop) dan `text-shadow: var(--header-nav-text-shadow)` kondisional (direset `none` pada scrolled/solid/menu-open/mobile), serta ganti `max-height` `.nav-menu` mobile ke `calc(100dvh - var(--header-actual-height, 96px))`.
  5. Pastikan `.top-bar` tidak diubah bobot font-nya dan warna seluruh aturan yang disentuh merujuk token `public/css/tokens.css`.
- **Referensi Pola:** `public/css/tokens.css` (blok `--font-weight-*` & `--hero-body-text-shadow`) dan `public/css/layout.css` (blok `.header-wrap` v2 baris 425-658).
- **Batasan Negatif:**
  - DILARANG menyentuh `public/css/components/home-hero.css`, `views/partials/home/*`, `views/public/index.ejs`, `public/js/main.js`, maupun styling footer (`.site-footer`, `.ft-*`) dan admin (`public/css/admin/*`).
  - DILARANG menambahkan nilai warna hex baru di luar token `public/css/tokens.css`.
- **Skill Relevan (maks 2):** `antislop-ui`, `antislop-layoutmobile`.
- **Verifikasi Deterministik:**
  - `npm run lint && npm run lint:views && npm run lint:i18n`
  - `grep -rnE "mobile-drawer|mobile-nav-toggle" public/css/layout.css` (wajib 0 hasil).

---

### T-473: Sinkronisasi Penuh Animasi Open/Close Drawer Mobile (Unified Corner Wipe 60fps Bebas Artefak) `[Tier: Argon Medium]`
- **File Terdampak (2 file):**
  - `public/css/layout.css`
  - `public/js/main.js`
  *(Catatan: `views/partials/navbar.ejs` sudah memiliki `.hdr-wipe-panel`, `.hdr-wipe-backdrop`, `#headerWrap`, `#siteHeader`, `#navMenu`, `#mobileToggle`, `#menuBackdrop` dan atribut ARIA lengkap, sehingga tidak perlu dimodifikasi.)*
- **Kontrak Data & State Class Eksplisit:**
  - State class pada `#headerWrap`:
    - `.menu-open`: aktif saat drawer terbuka; **dilepas langsung di `t = 0ms`** ketika `closeMobileMenu()` dipanggil.
    - `.hdr-wipe-opening` / `.hdr-wipe-closing`: aktif hanya selama fase transisi (`320ms` open / `260ms` close) untuk mengunci durasi & kurva identik pada `.site-header::before`, `.mobile-toggle span`, `.brand-name`, `.brand-badge`, `.hdr-wipe-panel`, dan `.hdr-wipe-backdrop`.
    - **Kontrak Unified Corner Wipe (`@media (max-width: 1024px)` & `.header-wrap:not(.is-scrolled):not(.header-wrap--solid)`):**
      - Idle tertutup: `.site-header::before` memiliki `opacity: 0; clip-path: circle(0% at 100% 100%); transition: opacity var(--ease);` (tanpa transisi `clip-path` saat scroll normal).
      - Scroll normal (menu tertutup): `.header-wrap.is-scrolled .site-header::before` menimpa `clip-path: none; opacity: 1;` sehingga scroll hanya fade `opacity` murni tanpa wipe.
      - Open (`.hdr-wipe-opening` + `.menu-open`): `.site-header::before` memiliki `opacity: 1; clip-path: circle(150% at 100% 100%); transition: clip-path var(--hdr-motion-open-dur) var(--hdr-motion-open-ease); will-change: clip-path;`.
      - Close (`.hdr-wipe-closing`, setelah `.menu-open` dilepas di `t = 0ms`): `.site-header::before` menahan `opacity: 1;` selama transisi sembari `clip-path` menyusut ke `circle(0% at 100% 100%)` dengan `transition: clip-path var(--hdr-motion-close-dur) var(--hdr-motion-close-ease); will-change: clip-path;`. Saat `.hdr-wipe-closing` dilepas pada `transitionend`/timeout, `clip-path` sudah `0%` sehingga kembali ke `opacity: 0` tanpa kedip/pop.
      - **Proteksi `.is-scrolled` & `.header-wrap--solid`:** Selector wipe wajib menyertakan `:not(.is-scrolled):not(.header-wrap--solid)`, sehingga header scrolled/solid selalu tetap `opacity: 1; clip-path: none;` sepanjang Open dan Close (0 kedip transparan).
  - State class pada `#navMenu` (`.hdr-wipe-panel`) & `#menuBackdrop` (`.hdr-wipe-backdrop`):
    - `.hdr-wipe-panel` di `@media (max-width: 1024px)`: idle `visibility: hidden; pointer-events: none; opacity: 0; clip-path: circle(0% at 100% 0%);`; `.open` `visibility: visible; pointer-events: auto; opacity: 1; clip-path: circle(150% at 100% 0%);`; `.hdr-wipe-opening` memasang `transition: clip-path var(--hdr-motion-open-dur) var(--hdr-motion-open-ease), opacity 120ms linear; overflow-y: hidden; will-change: clip-path, opacity;`; `.hdr-wipe-closing` mempertahankan `visibility: visible; pointer-events: none; overflow-y: hidden; will-change: clip-path, opacity; transition: clip-path var(--hdr-motion-close-dur) var(--hdr-motion-close-ease), opacity var(--hdr-motion-close-dur) var(--hdr-motion-close-ease);`. Saat animasi selesai, `overflow-y: auto` aktif kembali pada `.open` dan `will-change` dilepas.
    - `.menu-backdrop` (`.hdr-wipe-backdrop`): hapus `backdrop-filter: blur(8px)` & `-webkit-backdrop-filter` serta ganti `display: none -> block` menjadi `visibility: hidden; opacity: 0; pointer-events: none; background: var(--header-backdrop-scrim);`; `.open` menjadi `visibility: visible; opacity: 1; pointer-events: auto;`; `.hdr-wipe-opening` / `.hdr-wipe-closing` memasang `transition: opacity var(--hdr-motion-open-dur|close-dur) var(--hdr-motion-open-ease|close-ease); will-change: opacity;` (dan `.hdr-wipe-closing` mempertahankan `visibility: visible; pointer-events: none;` sampai selesai).
    - `.mobile-toggle span`, `.brand-name`, `.brand-badge`: saat `.hdr-wipe-opening` memakai durasi `var(--hdr-motion-open-dur)` dan saat `.hdr-wipe-closing` memakai durasi `var(--hdr-motion-close-dur)` sehingga morph X <-> 3 garis & perubahan warna 100% serempak dengan wipe.
- **Langkah Pelaksanaan:**
  1. Perbarui aturan `.site-header::before`, `.mobile-toggle span`, `.brand-name`, `.brand-badge`, `.menu-backdrop`, `.hdr-wipe-panel`, `.hdr-wipe-backdrop`, dan `@media (prefers-reduced-motion: reduce)` di `public/css/layout.css` sesuai kontrak Unified Corner Wipe di atas.
  2. Pastikan `isolation: isolate;` dipasang pada `.site-header` bila perlu untuk menjaga konteks stacking `.site-header::before` (`z-index: -1`) tetap bersih di atas hero tanpa artefak layer.
  3. Refaktor `openMobileMenu()` dan `closeMobileMenu()` di `public/js/main.js` agar mengganti interpolasi `anime.js` per-frame dengan controller CSS transition terpadu berbasis state class (`.hdr-wipe-opening`, `.hdr-wipe-closing`, `.hdr-wipe-animating`) + satu `transitionend` listener (target `#navMenu` properti `clip-path`) + fallback `setTimeout` (`open: 380ms`, `close: 320ms`), dengan `0` penulisan inline `style` pada `#navMenu`, `li`, maupun `#menuBackdrop`.
  4. Pastikan `closeMobileMenu()` melepas `.menu-open` dari `#headerWrap` dan `.active` dari `#mobileToggle` di `t = 0ms`, mendukung interruptible rapid tap (membatalkan timer/listener transisi berjalan dan langsung membalik arah tanpa memblokir klik), mengunci/melepas `body.menu-scroll-locked` dengan aman, serta menjaga `prefers-reduced-motion: reduce` (instan tanpa kelas animasi), `Escape` + kembalikan fokus ke `#mobileToggle`, klik backdrop/luar, klik tautan drawer, dan auto-close resize `> 1024px`.
  5. Verifikasi tidak ada sisa inline `style` maupun `will-change` tertinggal pasca transisi selesai.
- **Referensi Pola:** `public/js/main.js` (`applyScrollState` dengan rAF + state guard baris 7-25) & `public/css/layout.css` (blok `.hdr-wipe-*` & `@media (prefers-reduced-motion: reduce)` baris 752-802).
- **Batasan Negatif:**
  - DILARANG menyentuh `public/css/components/home-hero.css`, section beranda, `views/partials/navbar.ejs`, atau menghapus library global `anime.js`.
  - DILARANG menganimasikan properti layout (`width`, `height`, `top`, `padding`, `grid-template-rows`), memakai `backdrop-filter: blur()` pada `.menu-backdrop`, memasang `will-change` permanen di CSS statis, atau memakai inline handler/style yang melanggar CSP.
- **Skill Relevan (maks 2):** `antislop-ui`, `antislop-layoutmobile`.
- **Verifikasi Deterministik:**
  - `npm run lint && npm run lint:views && npm run lint:i18n`
  - `node tests/test-mobile-header.js && node tests/test-t387-t394-variants-and-header.js`

---

### T-474: QA E2E Playwright Multi-Viewport, Audit Performa CDP 4x CPU Throttling, & Regresi Visual Header `[Tier: Argon Medium]`
- **File Terdampak (2 file):**
  - `tests/test-header-typography-seam-motion-qa.js` *(skrip QA Playwright baru)*
  - `tests/test-t387-t394-variants-and-header.js` *(hanya bila ada assertion durasi/mekanisme lama yang perlu diselaraskan dengan spek baru)*
- **Kontrak Verifikasi Eksplisit:**
  - Halaman uji: transparan (`/`, `/about`, `/products`, `/news`, `/contact`) + solid (1 detail produk `/products/<slug>` & 1 detail berita `/news/<slug>`).
  - Viewport: `320px`, `375px`, `390px`, `768px`, `1024px`, `1025px`, `1440px` dalam bahasa **ID & EN**.
  - Gerbang kelulusan wajib:
    1. **Tipografi (Opsi 1c & 5a):** computed `fontWeight === '600'` pada `.nav-link` normal & `'700'` pada `.nav-link.active` di desktop & mobile; `textShadow !== 'none'` pada desktop transparan dan `textShadow === 'none'` saat `.is-scrolled`, `.header-wrap--solid`, `.menu-open`, dan mobile drawer; `0` line-wrap pada `.nav-link` desktop (`1025px`, `1440px`, ID & EN); target sentuh `#mobileToggle` & `.nav-menu .nav-link` `>= 44x44px`.
    2. **Anti-Seam (Opsi 4a):** pada halaman transparan `scrollY = 0`, `.site-header` memiliki `boxShadow === 'none'`, `borderBottomWidth === '0px'`, dan `.site-header::before` memiliki `opacity === '0'`; saat `.is-scrolled` dan pada halaman `.header-wrap--solid`, `.site-header::before` memiliki `opacity === '1'`, `borderBottomWidth === '1px'`, dan `boxShadow !== 'none'`.
    3. **Sinkronisasi Close Unified Corner Wipe (Opsi 3b):** dalam `< 50ms` pasca klik tutup pada `scrollY = 0`, `#headerWrap` sudah tidak memiliki `.menu-open`, memiliki `.hdr-wipe-closing`, `#mobileToggle` tidak memiliki `.active`, dan `#navMenu` memiliki `.hdr-wipe-closing`; setelah `<= 360ms`, seluruh kelas animasi bersih dan `.site-header::before` kembali `opacity === '0'`. Pada state `.is-scrolled` dan halaman `.header-wrap--solid`, `.site-header::before` tetap `opacity === '1'` dan `clipPath === 'none'` sepanjang proses Open & Close (0 kedip).
    4. **Performa & Anti-Artefak Chrome Android (Opsi 2a + 3b, CDP `Emulation.setCPUThrottlingRate({ rate: 4 })`):** `CLS === 0`, `0` long task `> 50ms` selama Open/Close & scroll threshold, `backdropFilter === 'none'` pada `.menu-backdrop` dan pada `.site-header::before` non-scrolled, `willChange === 'auto'` & `0` atribut `style` tersisa pada `#navMenu`/`#menuBackdrop` setelah transisi tuntas.
    5. **Edge Cases:** rapid tap buka-tutup 5x berulang (state akhir konsisten dan tidak macet), tombol `Escape` menutup drawer & mengembalikan `document.activeElement === mobileToggle`, klik luar/backdrop menutup drawer, resize `375px -> 1280px` saat terbuka otomatis menutup bersih, `prefers-reduced-motion: reduce` buka/tutup instan, dan `0` console error / page error.
- **Langkah Pelaksanaan:**
  1. Buat `tests/test-header-typography-seam-motion-qa.js` mengikuti struktur helper Playwright & CDP di repo.
  2. Implementasikan 5 grup pengujian deterministik di atas pada seluruh halaman transparan & solid, 7 viewport, dan ID/EN.
  3. Jalankan seluruh suite pengujian termasuk `test-mobile-header.js` dan `test-t387-t394-variants-and-header.js` hingga 100% lulus.
- **Referensi Pola:** `tests/test-hero-and-news-focus-qa.js` dan `tests/test-t387-t394-variants-and-header.js`.
- **Batasan Negatif:**
  - DILARANG memodifikasi file kode produksi (`views/`, `public/`, `controllers/`, `services/`) atau data database pada task ini.
- **Skill Relevan (maks 1):** `browser-testing-with-devtools`.
- **Verifikasi Deterministik:**
  - `npm run lint && npm run lint:views && npm run lint:i18n`
  - `node tests/test-header-typography-seam-motion-qa.js && node tests/test-mobile-header.js && node tests/test-t387-t394-variants-and-header.js`

---

## 6. Dampak Ukuran Modul Spesifikasi

| Modul | Ukuran Saat Ini | Estimasi Pasca-Merge | Status |
| :--- | :--- | :--- | :--- |
| `.agents/prd/public-home-sections.md` | 7.647 bytes (64 baris) | ~6.500 bytes (setelah §7 FR-24 dipecah) | **AMAN** (`< 8KB`) |
| `.agents/prd/public-header-motion.md` *(baru)* | 0 bytes | ~2.400 bytes | **AMAN** (`< 8KB`) |
| `.agents/tech/public-header-motion.md` | 4.533 bytes (44 baris) | ~6.200 bytes | **AMAN** (`< 8KB`) |
| `.agents/INDEX.md` | 52 baris | 52 baris (perbarui link PRD baris `Public Header & Motion`) | **AMAN** (`<= 60 baris`) |

---

## 7. Rencana CLOSE (Setelah Seluruh Task `[DONE]`)

1. Jalankan gerbang kualitas penuh: `npm run lint && npm run lint:views && npm run lint:i18n && node tests/test-header-typography-seam-motion-qa.js && node tests/test-mobile-header.js && node tests/test-t387-t394-variants-and-header.js`.
2. Hapus penanda `[PENDING T-472..T-474]` pada `.agents/prd/public-header-motion.md` dan `.agents/tech/public-header-motion.md`.
3. Pindahkan proposal ini dari `changes/2026-11-27_header-typography-seam-and-mobile-motion.md` ke `.agents/archive/`.
4. Pindahkan task selesai `T-472..T-474` dari `.agents/3-TASKS.md` ke `.agents/archive/tasks-index-full.md`.
5. Perbarui tanggal verifikasi (`2026-11-27`) pada:
   - `.agents/prd/public-header-motion.md`
   - `.agents/prd/public-home-sections.md`
   - `.agents/tech/public-header-motion.md`
   - `.agents/INDEX.md` (baris `Public Header & Motion` & `Public Home Sections`)
6. **Draf 1 baris `.agents/CHANGELOG.md`:**
   `- 2026-11-27 | Peningkatan tipografi navigasi header publik (semibold/bold + text-shadow transparan), eliminasi garis bayangan batas header-hero & pembersihan legacy CSS header, sinkronisasi penuh animasi unified corner-wipe drawer mobile 60fps tanpa blur backdrop, pemecahan PRD prd/public-header-motion.md, serta QA Playwright & CDP 4x CPU throttling | T-472..T-474`
