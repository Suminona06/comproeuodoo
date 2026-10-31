# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 4 Task (T-258 s/d T-261)
- **Total Task Selesai:** 257 Task (T-01 s/d T-257)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-262**.

---

## Task Aktif / Terbuka (Open Tasks)

### [x] T-255: Perbaikan Tampilan Slug di Admin Katalog Produk, Artikel Berita & Merek (Bug A1) *(diperbarui sesuai jawaban Q3)*
- **Ukuran**: S | **Skill Terkait**: `impeccable polish`, `impeccable adapt`
- **Akar Masalah Dugaan**: Template `views/admin/products/index.ejs` (baris 77) dan `views/admin/posts/index.ejs` (baris 60) menggabungkan `name_en`/`title_en` dengan `&bull; <code>slug</code>` di dalam `.td-client-sub`, sehingga kata bahasa Inggris terulang bersama slug dan ikon bullet. Di `brands/index.ejs` (baris 81) terdapat prefix `slug: `, di `posts/{create,edit}.ejs` input `#slug` masih memakai inline style, dan di `products/edit.ejs` belum ada tampilan slug kanonik produk.
- **Deskripsi**: Membersihkan render slug pada tabel daftar Produk, Artikel Berita, Merek, dan Kategori serta pada form tambah/edit produk dan artikel (sesuai jawaban Q3: Opsi C, 1 baris saja tanpa bullet dan tanpa judul EN). Menggunakan class `.adm-slug-text` (untuk tabel daftar) dan `.adm-slug-input-group` / `.adm-slug-box` (untuk form) dengan tipografi monospace/muted berbasis token (`var(--font-mono)`, `var(--text-muted)`), `max-width` responsif, dan `text-overflow: ellipsis`. Tidak ada migrasi skema database; kolom `slug` (`VARCHAR(191)`) dan perilaku redirect 301 (`slug_redirects`) tetap utuh.
- **File Terdampak**: `public/css/admin.css`, `views/admin/products/index.ejs`, `views/admin/products/edit.ejs`, `views/admin/posts/index.ejs`, `views/admin/posts/create.ejs`, `views/admin/posts/edit.ejs`, `views/admin/brands/index.ejs`, `views/admin/product-categories/index.ejs`, `views/admin/post-categories/index.ejs`.
- **Acceptance Criteria (AC)**:
  1. Pada daftar Produk (`products/index.ejs`), Artikel Berita (`posts/index.ejs`), dan Merek (`brands/index.ejs`), hanya tampil **1 baris slug tunggal** di bawah judul utama, tanpa bullet (`&bull;`), tanpa judul bahasa Inggris (`name_en`/`title_en`), dan tanpa prefix `slug:`.
  2. Pada form edit Produk (`products/edit.ejs`) tampil informasi slug kanonik satu baris (`.adm-slug-box`), dan pada form tambah/edit Artikel Berita (`posts/{create,edit}.ejs`) field `#slug` (`maxlength="191"`) tampil rapi menggunakan class `.adm-slug-input-group` tanpa inline style.
  3. Teks slug yang panjang otomatis terpotong dengan `text-overflow: ellipsis` (dilengkapi atribut `title` berisi slug penuh) tanpa merusak layout tabel dari viewport `320px` sampai desktop.
  4. Mekanisme pembuatan slug otomatis dan redirect 301 (`slug_redirects`) tetap berjalan tanpa perubahan.

### [x] T-256: Perbaikan Proporsi & Generator Multi-Ukuran Favicon di Pengaturan Situs serta Layout Publik/Admin (Bug A2) *(diperbarui sesuai jawaban Q6)*
- **Ukuran**: M | **Skill Terkait**: `polish`
- **Akar Masalah Dugaan**: Pengaturan `site_favicon` mengambil URL aset dari Media Library yang di-resize dengan `fit: 'inside'` (mempertahankan rasio persegi panjang logo perusahaan yang memuat teks), lalu dirender langsung pada `<link rel="icon">` tunggal tanpa kanvas persegi `1:1`, sehingga browser memaksa gambar horizontal masuk ke kotak `16x16`/`32x32` dan membuatnya gepeng.
- **Deskripsi**: Memperbaiki pengelolaan dan pemrosesan favicon sesuai jawaban Q6 (Opsi B dengan fallback ke Opsi A, menggunakan simbol logo saja tanpa teks):
  1. Memperjelas kolom unggah/pilih khusus **Favicon Situs (Simbol Logo Persegi 1:1 Tanpa Teks)** di `views/admin/settings/index.ejs` terpisah dari Logo Utama, disertai opsi unggah langsung atau pilih dari Media Library dan pratinjau persegi `1:1`.
  2. Menambahkan fungsi generator `generateFaviconSet(sourcePath)` di `middleware/uploadMiddleware.js` menggunakan Sharp `fit: 'contain'`, latar transparan (`background: { r: 0, g: 0, b: 0, alpha: 0 }`), dan padding seimbang untuk menghasilkan paket PNG persegi (`16x16`, `32x32`, `180x180` apple-touch-icon, `192x192`, dan `512x512`) di `public/uploads/settings/`.
  3. Di `controllers/admin/settingController.js`, jika `site_favicon` diisi/diunggah, jalankan `generateFaviconSet` dari aset favicon tersebut; jika `site_favicon` dikosongkan, jalankan fallback otomatis dari `site_logo_header` / `site_logo`. Key disimpan di tabel `settings` (`site_favicon`, `site_favicon_16`, `site_favicon_32`, `site_favicon_180`, `site_favicon_192`, `site_favicon_512`) tanpa migrasi DDL baru.
  4. Memperbarui tag `<link rel="icon">` dan `<link rel="apple-touch-icon">` lengkap dengan atribut `sizes` di seluruh layout publik dan admin.
- **File Terdampak**: `middleware/uploadMiddleware.js`, `controllers/admin/settingController.js`, `views/admin/settings/index.ejs`, `views/partials/head.ejs`, `views/partials/admin-header.ejs`, `views/admin/login.ejs`, `views/admin/403.ejs`.
- **Acceptance Criteria (AC)**:
  1. Pengaturan Situs memiliki input khusus Favicon (simbol logo persegi `1:1` tanpa teks) dan fallback otomatis ke logo situs bila favicon khusus kosong.
  2. Setiap penyimpanan favicon men-generate paket ikon persegi (`16x16`, `32x32`, `180x180`, `192x192`, `512x512`) menggunakan Sharp `fit: 'contain'` dengan latar transparan dan padding seimbang sehingga proporsi simbol asli tidak pernah gepeng.
  3. Tag `<link rel="icon" type="image/png" sizes="32x32">`, `<link rel="icon" type="image/png" sizes="16x16">`, `<link rel="apple-touch-icon" sizes="180x180">`, dan `<link rel="icon" type="image/png" sizes="192x192">` terpasang di `head.ejs` (publik), `admin-header.ejs`, `login.ejs`, dan `403.ejs`.
  4. Favicon tampil proporsional dan tajam di tab Chrome maupun Firefox pada mode terang dan gelap, baik di halaman publik maupun admin.

### [x] T-257: Fondasi CSS & Standarisasi Komponen Tombol Admin Terpadu `.adm-btn-*` beserta Animasi & Kontras WCAG AA _(diperbarui sesuai jawaban Q1, Q2, Q7)_

- **Ukuran**: M | **Skill Terkait**: `polish`, `animate`, `adapt`
- **Deskripsi**: Mendaftarkan token warna tombol utama admin `--color-leaf-soft: #d1ecb9` (beserta token turunan `--adm-btn-primary-bg`, `--adm-btn-primary-hover-bg`, `--adm-btn-primary-border`, `--adm-btn-primary-text`) di `Design/DESIGN.md`, `public/css/tokens.css`, dan `public/css/admin.css` sesuai jawaban Q1, lalu membangun sistem komponen tombol admin terpadu berprefix `.adm-btn` di `public/css/admin.css` yang mengadopsi anatomi visual dan animasi `.btn-add-row` (editor tabel ukuran produk) tanpa menyentuh `.btn-secondary` milik halaman publik:
  - `.adm-btn-primary` (Q1: Opsi A dengan latar `var(--adm-btn-primary-bg)`, teks & ikon gelap `var(--surface-dark-deep)` / `var(--text-main)` dengan kontras **13.91:1 s/d 14.15:1 AAA**, border tipis `var(--adm-btn-primary-border)`).
  - `.adm-btn-secondary` (Acuan tabel ukuran: latar `var(--bg-surface)`, border tipis `1px solid var(--border-main)`, teks & ikon hijau `var(--primary)` dengan kontras **5.66:1 AA**, hover `var(--primary-subtle)` dengan teks `var(--primary-hover)` **7.59:1 AAA**).
  - `.adm-btn-neutral` / `.adm-btn-ghost` (Q2: Opsi A, latar `var(--bg-surface)`, border `1px solid var(--border-main)`, teks & ikon abu-abu `var(--text-secondary)` dengan kontras **10.36:1 AAA**).
  - `.adm-btn-danger` (Q7: Standarkan sekarang, latar `var(--st-ditolak-bg)`, border `1px solid var(--st-ditolak-border)`, teks & ikon `var(--st-ditolak-text)` dengan kontras **7.02:1 AAA**).
  - Mendukung ukuran standar, `.adm-btn-sm` (aksi tabel), `.adm-btn-block`, state `.is-loading` (spinner SVG), focus ring berbasis token, dan target sentuh `min-height: 44px` di layar mobile (`<= 768px`).
- **File Terdampak**: `Design/DESIGN.md`, `public/css/tokens.css`, `public/css/admin.css`.
- **Acceptance Criteria (AC)**:
  1. Tombol `.adm-btn-primary` menggunakan latar hijau lembut daun `var(--adm-btn-primary-bg)` dengan teks/ikon gelap `var(--surface-dark-deep)` / `var(--text-main)` (rasio kontras **>= 13.9:1**, Lulus WCAG AAA).
  2. Tombol `.adm-btn-secondary` (**5.66:1**), `.adm-btn-neutral` (**10.36:1**), dan `.adm-btn-danger` (**7.02:1**) seluruhnya memakai token resmi tanpa warna biru dan lulus WCAG AA.
  3. Animasi mikro hanya menggunakan properti `transform` dan `opacity`, dibungkus `@media (hover: hover)` untuk hover, memiliki state `:active` untuk layar sentuh, dan dinonaktifkan pada `@media (prefers-reduced-motion: reduce)`.
  4. Target sentuh memiliki tinggi minimal `44px` pada mobile (`<= 768px`).
  5. Class `.btn-secondary` di `public/css/components.css` untuk halaman publik tetap utuh 100%.

### [ ] T-258: Migrasi Seluruh Tombol Halaman Admin, Modal, Tabel & Pemendekan Label ID/EN ke `.adm-btn-*` _(diperbarui sesuai jawaban Q1, Q2, Q4, Q7)_

- **Ukuran**: M | **Skill Terkait**: `polish`, `adapt`
- **Deskripsi**: Mengganti seluruh pemakaian tombol lama (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-ghost`, `.btn-action-*`, `.btn-add-row`) di seluruh view EJS admin dan script pembentuk tombol dinamis (`admin-size-table.js`, `admin-settings.js`, `media-picker.js`) ke `.adm-btn-*` sesuai pemetaan varian Q1 (`primary`), Q2 (`neutral`), dan Q7 (`danger`). Memasang set ikon SVG inline yang seragam di sisi kiri serta menerapkan daftar 31 label pendek dwibahasa ID/EN dan `aria-label` yang telah disetujui pada Q4.
- **File Terdampak**: Seluruh view di `views/admin/**/*.ejs`, `views/partials/media-picker-modal.ejs`, `public/js/admin-size-table.js`, `public/js/admin-settings.js`, `public/js/media-picker.js`.
- **Acceptance Criteria (AC)**:
  1. Tidak ada lagi tombol di area admin yang menggunakan `.btn-secondary` lama atau tombol tanpa ikon standar.
  2. Seluruh tombol Simpan memakai `.adm-btn-primary`, tombol Batal/Kembali/Reset memakai `.adm-btn-neutral`, tombol aksi umum/tambah baris/ekspor/pratinjau memakai `.adm-btn-secondary`, dan tombol Hapus memakai `.adm-btn-danger`.
  3. Seluruh label tombol di halaman, tabel, dan modal admin menggunakan label pendek ID/EN sesuai tabel Q4 dengan `aria-label` deskriptif.

### [ ] T-259: Modul Validasi Formulir Admin Terpusat, Pesan Dwibahasa ID/EN, Auto-Open Tab & Integrasi Kontrol Kustom _(diperbarui sesuai jawaban Q5)_

- **Ukuran**: M | **Skill Terkait**: `polish`, `adapt`
- **Deskripsi**: Membangun modul `public/js/admin-form-validation.js` dan menambahkan `novalidate` serta kelengkapan atribut batas karakter (`maxlength` sesuai skema kolom database) pada seluruh form admin untuk menggantikan tooltip validasi bawaan browser. Sesuai jawaban Q5 (Opsi A), validasi dijalankan saat tombol **Submit** ditekan, lalu berjalan secara _live_ (`input`/`change`) per field setelah field tersebut pernah mengalami error. Mencakup validasi kontrol kustom (TinyMCE, Media Picker, select, repeater WhatsApp, dan editor tabel ukuran), membuka tab tersembunyi secara otomatis jika terdapat field error di dalamnya, memfokuskan & menggulir ke field error pertama, menampilkan error server-side dengan gaya yang sama, serta mengaktifkan loading state tombol submit untuk mencegah kirim ganda.
- **File Terdampak**: `public/js/admin-form-validation.js` (baru), `public/css/admin.css`, `views/partials/admin-footer.ejs`, `views/admin/login.ejs`, seluruh view form di `views/admin/**/*.ejs`.
- **Acceptance Criteria (AC)**:
  1. Tidak ada lagi tooltip validasi bawaan browser (_"Please fill out this field."_) di seluruh form admin.
  2. Validasi berjalan tepat saat **Submit** ditekan, dan setelah suatu field berstatus error, perubahan nilai (`input`/`change`) pada field tersebut langsung memvalidasi ulang dan menghilangkan error seketika saat valid (Q5: Opsi A).
  3. Error tampil inline di bawah field dengan warna `var(--color-error)`, ikon kecil, border field merah dari token, `aria-invalid="true"`, dan `aria-describedby` yang terhubung ke ID elemen pesan error dalam bahasa ID dan EN.
  4. Jika field error berada di dalam tab yang sedang tertutup (`about/index.ejs`, `home-content/index.ejs`, `settings/index.ejs`), tab tersebut otomatis terbuka lalu halaman menggulir dan fokus ke field error pertama.
  5. Mencakup validasi TinyMCE, Media Picker, select, repeater WhatsApp, dan editor tabel ukuran, serta merender error dari server-side dengan gaya visual yang sama.
  6. Tombol submit masuk ke state `.is-loading` (`disabled`) saat form valid dikirim guna mencegah pengiriman ganda.

### [ ] T-260: Penggantian Seluruh Native `alert()`/`confirm()` dengan SweetAlert2 Bertema & Pembersihan Inline Handler Admin _(diperbarui sesuai jawaban Q7)_

- **Ukuran**: M | **Skill Terkait**: `polish`
- **Deskripsi**: Mengaudit dan mengganti seluruh pemanggilan `alert()` dan `confirm()` native di script dan view admin (`public/js/admin-settings.js`, `public/js/admin-size-table.js`, `public/js/media-picker.js`, `public/js/admin.js`, `views/admin/dashboard.ejs`, `views/admin/inquiries/index.ejs`) menjadi dialog SweetAlert2 bertema token Euodoo. Sesuai jawaban Q7, seluruh tombol konfirmasi hapus di dalam popup SweetAlert2 wajib menggunakan komponen `.adm-btn .adm-btn-danger` (dengan ikon tempat sampah) dan tombol batal menggunakan `.adm-btn .adm-btn-neutral` (`buttonsStyling: false`). Sekaligus memindahkan event handler inline (`onclick`, `onchange`, `onsubmit`, `oninput`, `onerror`) pada view admin ke event listener terpusat yang patuh CSP tanpa inline handler baru.
- **File Terdampak**: `public/js/admin.js`, `public/js/admin-settings.js`, `public/js/admin-size-table.js`, `public/js/media-picker.js`, `views/admin/dashboard.ejs`, `views/admin/inquiries/index.ejs`, `views/admin/inquiries/detail.ejs`, `views/admin/products/index.ejs`, `views/admin/posts/create.ejs`, `views/admin/posts/edit.ejs`, `views/admin/banners/create.ejs`, `views/admin/banners/edit.ejs`, `views/admin/media/index.ejs`, `views/admin/about/index.ejs`.
- **Acceptance Criteria (AC)**:
  1. Nol pemanggilan `alert()` atau `confirm()` native di seluruh kode admin.
  2. Seluruh dialog konfirmasi hapus menggunakan SweetAlert2 bertema dengan tombol konfirmasi `.adm-btn .adm-btn-danger` dan tombol batal `.adm-btn .adm-btn-neutral` (Q7).
  3. Tidak ada lagi penambahan atau ketergantungan pada inline style maupun inline event handler (`onclick`, `onchange`, `onsubmit`, `oninput`) di template admin; sepenuhnya kompatibel dengan kebijakan CSP.

### [ ] T-261: UI Polish, Adaptasi Mobile (320px-Desktop, Zoom 100/125/150%, Tinggi 600-768px) & Pengujian Regresi Menyeluruh (Bagian C) _(diperbarui sesuai jawaban Q1 s/d Q7)_

- **Ukuran**: S | **Skill Terkait**: `polish`, `adapt`, `animate`
- **Deskripsi**: Melakukan pengecekan akhir konsistensi visual tombol `.adm-btn-*` (termasuk varian `primary` `#D1ECB9`, `secondary`, `neutral`, `danger`), tampilan slug satu baris, favicon simbol logo persegi, serta validasi form di seluruh menu admin pada level zoom `100%`, `125%`, dan `150%`, tinggi layar pendek `600px`-`768px` (memastikan bagian body modal dapat di-scroll dan footer modal berisi tombol Batal/Simpan selalu terlihat dan tidak terpotong), serta lebar viewport `320px` hingga desktop.
- **File Terdampak**: `public/css/admin.css`.
- **Acceptance Criteria (AC)**:
  1. Pada tinggi layar `600px`-`768px` dan zoom `100%`/`125%`/`150%`, footer modal (`Batal` / `Simpan`) dan sticky action bar tetap terlihat serta dapat diakses tanpa terpotong viewport.
  2. Seluruh fungsi CRUD dan aksi admin (simpan, batal, tambah, hapus, ekspor CSV, unggah media, filter/reset) berjalan lancar dengan token CSRF tetap utuh.
  3. Responsif penuh dari `320px` sampai desktop dalam bahasa ID dan EN, favicon tampil proporsional di publik & admin, serta nol error pada console browser.
