# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 6 Task (T-301 s/d T-306)
- **Total Task Selesai:** 296 Task (T-01 s/d T-300)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-307**.

---

## Task Aktif / Terbuka (Open Tasks)

### Batch Revisi Hover Footer, Tabel RFQ Dashboard, & Paginasi Tanpa Reload (T-301 s/d T-306)

_Referensi Proposal:_ [changes/2026-11-09_footer-hover-rfq-pagination.md](changes/2026-11-09_footer-hover-rfq-pagination.md)

- [x] **T-301: Perbaikan Bug Hover Kartu Alamat Footer & Kontras WCAG AA Tautan Faks/Telp/Email**
  - **Deskripsi:** Menghapus efek hover pada kartu alamat footer (`.ft-office-card`) dan mengunci warna teks seluruh baris alamat, telepon, faks, serta email (`.ft-phone-val`, `a[href^="tel:"]`, `a[href^="mailto:"]`) pada state `normal`, `:hover`, `:focus-visible`, `:active`, dan `:visited` ke token teks terang footer (`var(--color-text-inverse)`) agar lolos kontras WCAG AA (`>= 4.5:1`) dan tidak tertimpa `a:hover` global (`var(--color-primary-dark)`). Memastikan `.cf-link-inherit` pada `/contact` juga mempertahankan `color: inherit` di semua state.
  - **Acceptance Criteria:**
    - `.ft-office-card:hover` dan `transition` pada `.ft-office-card` dihapus sepenuhnya.
    - Semua baris teks dan tautan (Alamat, Telp, Faks, Email) di `.ft-office-card` memakai `var(--color-text-inverse)` di semua state (`normal`, `:hover`, `:focus-visible`, `:active`, `:visited`), dengan underline saat `:hover` di dalam `@media (hover: hover)` dan focus ring `2px solid var(--color-text-inverse)` saat `:focus-visible`.
    - `.cf-link-inherit` pada `/contact` mempertahankan `color: inherit` pada `:hover` dan `:visited`.
  - **File Terdampak:** `public/css/layout.css`, `public/css/components.css`, `views/partials/footer.ejs`
  - **Skill:** `impeccable` (`polish`), `antislop-human`, `antislop-code`
  - **Verifikasi:** Inspeksi computed style state `:hover`, `:focus-visible`, `:visited` pada nomor Faks/Telp/Email di footer & halaman `/contact`; uji kontras WCAG AA; uji navigasi `Tab`.

- [x] **T-302: Penyederhanaan Tabel Inquiry RFQ Dashboard Admin (`LIMIT 10` & Scroll Hanya di Mobile)** _(Keputusan Q9)_
  - **Deskripsi:** Mengubah query pengambilan data Inquiry RFQ di Dashboard Admin (`/admin/dashboard`) menjadi `LIMIT 10` terbaru (`ORDER BY i.created_at DESC, i.id DESC`), tanpa paginasi, menghapus scroll pada layar desktop (`> 768px`) namun mempertahankan wrapper scroll horizontal (`overflow-x: auto`) pada layar mobile (`<= 768px`), serta mempertahankan tautan "Lihat Seluruh Inquiry".
  - **Acceptance Criteria:**
    - `controllers/admin/dashboardController.js` memanggil `inquiryModel.findAll({ limit: 10 })` di level SQL query.
    - Tabel `#rfqDataTable` di `views/admin/dashboard.ejs` tampil tanpa paginasi, dengan wrapper `.table-scroll-wrapper--mobile-only` (`overflow: visible` di desktop `> 768px`, `overflow-x: auto` di mobile `<= 768px`).
    - Tautan "Lihat Seluruh Inquiry" (`/admin/inquiries`) dan state kosong tetap berfungsi rapi.
  - **File Terdampak:** `controllers/admin/dashboardController.js`, `views/admin/dashboard.ejs`, `public/css/admin.css`
  - **Skill:** `impeccable` (`adapt`, `polish`), `antislop-layoutmobile`, `antislop-code`
  - **Verifikasi:** Uji `/admin/dashboard` dengan `0`, `5`, `10`, dan `>10` data; uji viewport `320px` s/d `1440px`.

- [x] **T-303: Pembuatan Komponen Paginasi Bersama Varian 1 (`.pgn-*`, Partial EJS, Modul JS, & Lokalisasi ID/EN)** _(Keputusan Q1, Q2, Q3, Q7, Q8, Q10)_
  - **Deskripsi:** Membangun komponen paginasi bersama yang terdiri dari partial `views/partials/pagination.ejs`, styling `.pgn-*` berbasis token CSS di `public/css/admin.css` (tanpa mengubah `.pagination-bar` halaman Berita), modul `public/js/pagination.js`, serta kamus lokalisasi ID/EN di `locales/id.json` dan `locales/en.json`.
  - **Acceptance Criteria:**
    - Identik 1:1 dengan Gambar 2 Varian 1: sisi kiri `Page [input] of <total> | Rows per page [select 10/25/50/100]` menggunakan `<select>` native ter-style (`.pgn-per-page-select`); sisi kanan `<< < 1 2 3 ... 8 9 10 > >>` dengan halaman aktif berlatar abu muda netral (`var(--bg-subtle)`) dan hover hijau token di dalam `@media (hover: hover)`.
    - Bila total hanya 1 halaman (`totalPages <= 1`), bar tetap tampil utuh dengan tombol navigasi `disabled`.
    - Di mobile (`<= 768px`), bar ditumpuk 2 baris, nomor halaman diringkas (`<< < 2 / 10 > >>`), dan target sentuh minimal `44x44px`.
    - `public/js/pagination.js` menangani fetch JSON/partial HTML dengan `AbortController`, sinkronisasi `history.pushState` (`?page=&per_page=`), event `popstate`, validasi input halaman, pengumuman `aria-live="polite"`, dan fallback link nyata saat non-JS.
    - Seluruh label teks tersedia di `locales/id.json` dan `locales/en.json`.
  - **File Terdampak:** `views/partials/pagination.ejs`, `public/js/pagination.js`, `public/css/admin.css`, `locales/id.json`, `locales/en.json`
  - **Skill:** `impeccable` (`polish`, `adapt`, `animate`), `antislop-human`, `antislop-layoutmobile`, `antislop-code`
  - **Verifikasi:** Uji kesesuaian visual Varian 1, uji input halaman tidak valid, uji `AbortController`, uji responsif `320px`, dan audit aksesibilitas.

- [x] **T-304: Integrasi Paginasi Tanpa Reload pada Daftar RFQ/Inquiry Admin (`/admin/inquiries`)** _(Keputusan Q1, Q2, Q3, Q8, Q10)_
  - **Deskripsi:** Mengintegrasikan komponen paginasi `.pgn-*` (Varian 1) ke `/admin/inquiries` dengan validasi parameter server (`page`, `per_page` whitelist `10/25/50/100` default `10`), respons JSON/partial HTML pada `GET /admin/inquiries`, sinkronisasi filter status & pencarian, pelestarian event delegation untuk aksi baris, serta penyesuaian halaman aktif setelah penghapusan data.
  - **Acceptance Criteria:**
    - Whitelist `per_page` (`10/25/50/100`, default `10`) dan normalisasi `page` (`>= 1`, maks `totalPages`) di `controllers/admin/inquiryController.js` & `models/inquiryModel.js` menggunakan query terparameter.
    - Pindah halaman, ganti `per_page` (reset ke halaman 1), dan filter status/pencarian (reset ke halaman 1) berjalan tanpa reload halaman penuh dan sinkron dengan `history.pushState`.
    - Aksi baris (Tinjau modal `#inquiryQuickModal`, Detail, dropdown ubah status `.inquiry-status-select` dengan `window.initEuDropdowns()`, badge, hapus data) tetap berfungsi setelah pindah halaman; halaman mundur otomatis bila halaman terakhir kosong setelah hapus.
  - **File Terdampak:** `controllers/admin/inquiryController.js`, `models/inquiryModel.js`, `views/admin/inquiries/index.ejs`, `public/js/admin-inquiries.js`, `public/css/admin.css`
  - **Skill:** `impeccable` (`polish`, `adapt`), `antislop-code`
  - **Verifikasi:** Uji pindah halaman, ganti `per_page`, filter + pencarian, aksi modal/status/hapus di halaman 2+, dan URL manual `?per_page=1000&page=abc`.

- [x] **T-305: Integrasi Paginasi Tanpa Reload pada Daftar Katalog Produk Admin (`/admin/products`)** _(Keputusan Q1, Q2, Q3, Q4, Q5, Q6, Q8, Q10)_
  - **Deskripsi:** Mengintegrasikan komponen paginasi `.pgn-*` (Varian 1) ke halaman daftar Katalog Produk Admin (`/admin/products`) dengan `per_page` `10/25/50/100` (default `10`) tanpa reload halaman, menyinkronkan filter kategori produk dan pencarian kata kunci dengan query server & `history.pushState`, serta menjaga stabilitas tinggi baris/thumbnail (tanpa layout shift).
  - **Acceptance Criteria:**
    - Whitelist `per_page` (`10/25/50/100`, default `10`), normalisasi `page` (`>= 1`, maks `totalPages`), filter `category_id`, dan pencarian `q` di `controllers/admin/productController.js` & `models/productModel.js` menggunakan query terparameter.
    - Pindah halaman, ganti `per_page` (reset ke halaman 1), filter kategori, dan pencarian produk berjalan tanpa reload halaman penuh, melakukan scroll halus ke awal tabel, dan mengumumkan halaman baru via `aria-live="polite"`.
    - Aksi baris produk (Edit, Toggle Status, Hapus Produk) tetap berfungsi setelah pindah halaman; halaman mundur otomatis bila halaman terakhir kosong setelah hapus; halaman katalog publik (`/products`) tidak diubah.
  - **File Terdampak:** `controllers/admin/productController.js`, `models/productModel.js`, `views/admin/products/index.ejs`, `public/js/admin-products.js` (atau `public/js/pagination.js`), `public/css/admin.css`
  - **Skill:** `impeccable` (`polish`, `adapt`, `animate`), `antislop-human`, `antislop-layoutmobile`, `antislop-code`
  - **Verifikasi:** Uji `/admin/products` dengan kombinasi kategori + pencarian + ganti halaman & `per_page`; uji toggle status & hapus produk setelah pindah halaman.

- [x] **T-306: Pengujian Wajib Menyeluruh, Audit Regresi Multi-Viewport (ID/EN), & Gerbang Kualitas Lint** _(Keputusan Q1 s/d Q10)_
  - **Deskripsi:** Melaksanakan seluruh matriks pengujian wajib dan audit regresi lintas halaman (`/admin/inquiries`, `/admin/products`, `/admin/dashboard`, `/products` publik, dan footer di semua halaman publik), lintas viewport (`320px`, `375px`, `768px`, `1024px`, `1440px`), serta bahasa (`ID` & `EN`), dan memastikan `npm run lint` serta `npm run lint:views` hijau.
  - **Acceptance Criteria:**
    - Lulus seluruh skenario uji wajib: halaman 1/tengah/terakhir; ganti `per_page` di tiap halaman; input `Page [n]` (`0`, negatif, huruf, melebihi total, kosong); URL manual `?per_page=1000` / `?page=abc` / `?page=9999`; data `0`, `1`, `10`, `11`, `>100` baris; filter + paginasi; tombol Back/Forward browser; klik cepat berulang (`AbortController`); bukti Network tab tanpa full reload.
    - Bebas regresi dan error console di semua viewport (`320px` s/d `1440px`) dan bahasa (`ID` & `EN`).
    - `npm run lint` dan `npm run lint:views` hijau (0 error).
  - **File Terdampak:** Berkas terkait bila ditemukan temuan saat uji regresi.
  - **Skill:** `impeccable` (`polish`, `adapt`), `antislop-code`
  - **Verifikasi:** Laporan hasil uji lengkap + output `npm run lint` dan `npm run lint:views` .
