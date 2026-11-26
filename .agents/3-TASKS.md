# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 3 Task (`T-454` s/d `T-456` - Bug Fix tanpa ubah spek)
- **Total Task Selesai:** 453 Task (T-01 s/d T-453)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-457**.

---

## Task Aktif / Terbuka (Open Tasks)

### Batch Bug Fix Admin (Tanpa Ubah Spek)
*Keputusan terkunci Azis (2026-11-26): 1a (tambah ENUM `'ditolak'` ke depan tanpa mengubah data lama), 2a (tetap `reverseButtons: true`: Batal di kiri, Hapus/Lanjutkan di kanan), 3a (badge bulat kecil `22px` di pojok kanan atas overlap keluar thumbnail, selalu tampil dengan target sentuh mobile `>= 44px`).*

- [x] **T-454** `[DONE]` `[Tier: Hydrogen Medium]` **Migrasi DB: Tambah Nilai ENUM `'ditolak'` pada Kolom `inquiries.status`**
  - **Jenis:** Bug Fix (tanpa ubah spek)
  - **File Terdampak (1 file):**
    - `database/migrations/025_add_ditolak_to_inquiry_status.sql` (baru)
  - **Langkah Implementasi:**
    1. Buat berkas migrasi baru `database/migrations/025_add_ditolak_to_inquiry_status.sql` berisi pernyataan SQL idempoten:
       ```sql
       -- Migration 025: Restore 'ditolak' status value on inquiries.status ENUM
       ALTER TABLE inquiries
         MODIFY COLUMN status ENUM('baru', 'dibaca', 'ditindaklanjuti', 'ditolak') DEFAULT 'baru';
       ```
    2. Jalankan `npm run migrate` untuk menerapkan migrasi ke database lokal dan pastikan nama migrasi tercatat di tabel `migrations`.
    3. Jalankan pemeriksaan read-only `SHOW CREATE TABLE inquiries` untuk memastikan definisi kolom menjadi `enum('baru','dibaca','ditindaklanjuti','ditolak')` dan jumlah baris existing tidak berubah.
    4. Verifikasi alur update status `'ditolak'` (via `inquiryService.updateInquiryStatus` / endpoint `/admin/inquiries/:id/status`), filter status `'ditolak'`, hitungan `stats.ditolak`, dan ekspor CSV menyertakan status `'ditolak'` dengan 0 error `WARN_DATA_TRUNCATED` (kembalikan status baris uji jika memakai data existing).
  - **Kontrak Target Eksplisit:**
    - Kolom `inquiries.status`: `ENUM('baru', 'dibaca', 'ditindaklanjuti', 'ditolak') DEFAULT 'baru'` (selaras dengan `INQUIRY_STATUSES` di `models/inquiryModel.js` dan `services/inquiryService.js`).
    - Data RFQ existing tidak diubah (Keputusan 1a).
  - **Referensi Pola:** `database/migrations/024_add_selected_variants_to_inquiries.sql` dan `utils/migrationSequence.js`.
  - **Batasan Negatif:**
    - Dilarang mengedit migrasi lama (`001_create_initial_schema.sql`, `003_upgrade_v2_schema.sql`, dll.).
    - Dilarang menjalankan `UPDATE` massal pada data existing `inquiries` atau mengekspor `inquiries`/`users` ke `snapshot.json`.
    - Dilarang mengubah modul spek `prd/` maupun `tech/`.
  - **Skill Relevan:** `debugging-and-error-recovery`
  - **Verifikasi Deterministik:**
    - `npm run migrate`
    - `npm run lint && npm run lint:views && npm run lint:i18n`
    - `node --test tests/test-admin-batch2-services.js && npm test`

- [x] **T-455** `[DONE]` `[Tier: Argon Medium]` **Perbaikan Simetri Tombol & Ikon Modal Konfirmasi SweetAlert2 (`showAdminConfirm`)**
  - **Jenis:** Bug Fix (tanpa ubah spek)
  - **File Terdampak (3 file):**
    - `public/js/admin.js`
    - `public/css/admin/modals-overlays.css`
    - `views/partials/admin-header.ejs` (bump versi query `?v=` untuk `modals-overlays.css`)
  - **Langkah Implementasi:**
    1. Di `public/js/admin.js` (`window.showAdminConfirm`, sekitar baris 507-563):
       - Hapus karakter spasi literal antara `</svg>` dan `<span>` pada `cancelText`, `confirmText` (danger), dan `confirmText` (non-danger).
       - Seragamkan atribut ketiga ikon SVG: `width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`.
       - Seimbangkan proporsi optis koordinat path ikon X (`x1="5" y1="5" x2="19" y2="19"` dan `x1="19" y1="5" x2="5" y2="19"`) terhadap ikon tong sampah (`adm-btn-icon-trash`) dan ikon centang (`adm-btn-icon-save`) agar bobot visual setara.
       - Pertahankan `reverseButtons: true` (Keputusan 2a: Batal di kiri, Hapus/Lanjutkan di kanan).
    2. Di `public/css/admin/modals-overlays.css` (seksi `.swal2-actions`, sekitar baris 188-196):
       - Tambahkan rule `.swal2-actions .adm-btn:not([style*="display: none"])` dengan `display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 6px !important; line-height: 1.2 !important;` agar mengalahkan inline `style="display: inline-block;"` bawaan SweetAlert2 tanpa memunculkan tombol tersembunyi.
       - Tambahkan `.swal2-actions .adm-btn .adm-btn-icon { display: block; width: 15px; height: 15px; flex-shrink: 0; }` dan `.swal2-actions .adm-btn span { line-height: 1; }`.
       - Tambahkan 1 blok `@media (max-width: 768px)` untuk `.swal2-actions .adm-btn { min-height: 44px !important; }`.
    3. Perbarui parameter versi `?v=` pada `<link rel="stylesheet" href="/css/admin/modals-overlays.css?v=...">` di `views/partials/admin-header.ejs`.
    4. Verifikasi tampilan modal konfirmasi varian danger (Hapus) dan non-danger (Lanjutkan) di bahasa ID & EN, viewport 320px s/d 1440px, serta pastikan `showAdminAlert` hanya menampilkan 1 tombol tanpa tombol batal tersembunyi.
  - **Kontrak Target Eksplisit:**
    - Class tetap: `.swal2-actions`, `.adm-btn`, `.adm-btn-danger`, `.adm-btn-primary`, `.adm-btn-neutral`, `.adm-btn-icon`.
    - Dimensi: tinggi tombol sama (`min-height: 38px` desktop, `min-height: 44px` pada `<= 768px`), ikon `15px x 15px` sejajar vertikal tengah, jarak ikon-teks `gap: 6px` (tanpa spasi literal).
    - Urutan tombol tetap `reverseButtons: true` (Keputusan 2a).
    - Zero raw hex (pakai token `public/css/admin/tokens.css`).
  - **Referensi Pola:** `public/css/admin/buttons.css` (`.adm-btn` & `.adm-btn-icon`, baris 3-35).
  - **Batasan Negatif:**
    - Dilarang mengubah class bersama `.adm-btn` di `public/css/admin/buttons.css` atau file vendor `public/vendor/sweetalert2/*`.
    - Dilarang menulis `display: inline-flex !important` tanpa guard `:not([style*="display: none"])`.
    - Dilarang menambah inline style/handler, raw hex, atau blok `@media` duplikat konteks sama.
  - **Skill Relevan:** `antislop-ui`, `antislop-human`
  - **Verifikasi Deterministik:**
    - `npm run lint && npm run lint:views && npm run lint:i18n`
    - `node tests/test-admin-css-modular.js`
    - `npm test` (dan `node tests/test-t260-sweetalert-csp-playwright.js` bila server lokal aktif)

- [x] **T-456** `[DONE]` `[Tier: Argon Medium]` **Perbaikan Tombol Hapus Foto Galeri Produk (`.prod-gallery-btn-del`) & Token CSS Admin**
  - **Jenis:** Bug Fix (tanpa ubah spek)
  - **File Terdampak (4 file):**
    - `views/admin/products/partials/gallery.ejs`
    - `public/js/admin-product-form.js`
    - `public/css/admin/page-catalog.css`
    - `views/partials/admin-header.ejs` (bump versi query `?v=` untuk page styles)
  - **Langkah Implementasi:**
    1. Di `views/admin/products/partials/gallery.ejs` (baris 48-57):
       - Ganti isi tombol `.prod-gallery-btn-del` dari `&times;` menjadi ikon `<svg class="prod-gallery-icon-del" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`.
    2. Di `public/js/admin-product-form.js` (`buildThumbBox` & helper tombol, sekitar baris 71-98):
       - Tambahkan helper `createDeleteIconSvg()` berbasis DOM API murni (`typeof document.createElementNS === 'function' ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag)`) tanpa `innerHTML`, menghasilkan markup SVG identik dengan partial EJS.
       - Perbarui `buildThumbBox` agar tombol `.prod-gallery-btn-del` memakai `createDeleteIconSvg()` alih-alih teks `'×'`.
       - Pertahankan seluruh logika tambah dari Media Library, deduplikasi, reorder (`▲`/`▼`), hapus item, dan sinkronisasi `#gallery_images_input`.
    3. Di `public/css/admin/page-catalog.css` (hanya blok `.prod-gallery-*`, baris 3-135 dan media query baris 380-398):
       - Ganti seluruh token publik yang tidak terdefinisi di `public/css/admin/tokens.css`:
         - `var(--radius-pill)` -> `var(--r-pill)`
         - `var(--color-text-inverse)` -> `var(--bg-surface)`
         - `var(--color-text-muted-on-soft)` -> `var(--text-muted)`
         - `var(--focus-ring-outline)` -> `2px solid var(--primary)`
       - Ubah `.prod-gallery-thumb-box` menjadi `overflow: visible;` dan pindahkan `border-radius: 6px; overflow: hidden;` ke `.prod-gallery-thumb` agar badge overlap tidak terpotong (Keputusan 3a). Tambahkan `padding-top: 6px;` pada `.prod-gallery-strip`.
       - Styling `.prod-gallery-btn-del`: `position: absolute; top: -7px; right: -7px; z-index: 2; width: 22px; height: 22px; padding: 0; border-radius: var(--r-pill); background: var(--color-error); color: var(--bg-surface); border: 2px solid var(--bg-surface); box-shadow: var(--shadow-xs); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: background-color var(--ease), transform var(--ease);`.
       - Tambahkan `.prod-gallery-icon-del { display: block; width: 12px; height: 12px; flex-shrink: 0; pointer-events: none; }`.
       - Bungkus hover `.prod-gallery-btn-del:hover` di dalam `@media (hover: hover)` dengan `background: var(--danger-text-deep); transform: scale(1.06);` (hapus `filter: brightness(0.9)`).
       - Pertahankan `:focus-visible` (`outline: 2px solid var(--primary); outline-offset: 2px; box-shadow: var(--focus-ring);`) dan perluasan hit-area `.prod-gallery-btn-del::after { content: ''; position: absolute; inset: -11px; }` pada blok `@media (pointer: coarse), (max-width: 768px)` yang sudah ada.
    4. Perbarui parameter versi `?v=` untuk page styles (`page-catalog.css`) di `views/partials/admin-header.ejs`.
  - **Kontrak Target Eksplisit:**
    - Prefix terisolasi: hanya class `.prod-gallery-*` (tambah `.prod-gallery-icon-del`).
    - Token resmi dari `public/css/admin/tokens.css`: `--r-pill`, `--color-error`, `--danger-text-deep`, `--bg-surface`, `--text-muted`, `--primary`, `--focus-ring`, `--shadow-xs`, `--ease`.
    - Badge bulat `22px x 22px` di pojok kanan atas overlap keluar thumbnail (`top: -7px; right: -7px;`), selalu tampil, ikon SVG `12px x 12px`, target sentuh mobile `>= 44px x 44px` (Keputusan 3a).
    - Render SSR (`gallery.ejs`) dan render dinamis JS (`admin-product-form.js`) tampil identik.
  - **Referensi Pola:** Tombol tutup bulat dengan SVG di `public/css/admin/modals-overlays.css` (`.modal-close-btn`, baris 72-106) dan builder DOM murni di `public/js/admin-product-form.js` (baris 71-120).
  - **Batasan Negatif:**
    - Dilarang mengubah class bersama di luar `.prod-gallery-*` (`.form-card`, `.form-group`, `.adm-btn-*`, `.media-picker-*`).
    - Dilarang memakai `innerHTML`, inline style, inline handler, atau warna hex mentah.
    - Dilarang menambah blok `@media` duplikat konteks sama di `public/css/admin/page-catalog.css`.
    - Panjang berkas `public/js/admin-product-form.js` wajib tetap `<= 300` baris dan tiap fungsi `<= 40` baris.
  - **Skill Relevan:** `antislop-ui`, `antislop-human`
  - **Verifikasi Deterministik:**
    - `npm run lint && npm run lint:views && npm run lint:i18n`
    - `node tests/test-admin-css-modular.js`
    - `node --test tests/test-t375-t377-gallery-multiupload.js`
    - `npm test`
