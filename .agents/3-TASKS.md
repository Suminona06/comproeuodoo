# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 8 Task (T-212 s/d T-219)
- **Total Task Selesai:** 211 Task (T-01 s/d T-211)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-220**.

---

## Task Aktif / Terbuka (Open Tasks)

- [ ] **T-212**: Perbaikan Bug Ikon Ganda pada Tombol Aksi Form Admin Produk (`btnAddSizeRow`, `btnAddVariant`, `btnOpenGalleryPicker`).
  - *Deskripsi:* Eliminasi karakter literal `+ ` pada teks span tombol aksi di form create dan edit produk, tambahkan `aria-hidden="true"` pada elemen SVG dekoratif, dan pastikan inisialisasi tombol idempoten.
  - *Acceptance Criteria:* Tepat 1 ikon per tombol, bebas duplikasi simbol plus, atribut aksesibilitas lengkap, tetap konsisten setelah aksi berulang dan switch ID/EN.
  - *File Terdampak:* `views/admin/products/create.ejs`, `views/admin/products/edit.ejs`, `public/css/admin.css`.
  - *Skill:* Impeccable (`$polish`), `antislop-code`.

- [ ] **T-213**: Skrip Backup Database & Migrasi SQL Format Tabel Ukuran Produk (`018_migrate_legacy_size_table_format.sql`).
  - *Deskripsi:* Membuat skrip migrasi SQL batch untuk mentransformasi data 3 produk lama di database (ID 92, 215, 218) ke format JSON dinamis standar `{ columns: [{ id, label }], rows: [{ [id]: val }] }` dengan backup aman sebelum eksekusi.
  - *Acceptance Criteria:* Data legacy terkonversi presisi ke 6 kolom default, produk null/kosong tidak error, skrip migrasi idempotent dan aman dijalankan.
  - *File Terdampak:* `database/migrations/018_migrate_legacy_size_table_format.sql`.
  - *Skill:* `implement-task`.

- [ ] **T-214**: Helper Normalizer & Model Produk untuk Struktur Kolom Dinamis JSON Satu Bahasa.
  - *Deskripsi:* Memperbarui `models/productModel.js` dan controller agar menangani pembacaan dan penyimpanan `size_table` format dinamis `{ columns: Array, rows: Array }` dengan fallback aman bila kosong/malformed.
  - *Acceptance Criteria:* Pembacaan `size_table` selalu menghasilkan objek valid `{ columns, rows }`, serialisasi aman, CRUD model produk lulus tes.
  - *File Terdampak:* `models/productModel.js`, `controllers/public/productController.js`.
  - *Skill:* `implement-task`.

- [ ] **T-215**: Antarmuka Editor Dinamis Admin Form (Create & Edit) + Modal "Salin Struktur Kolom dari Produk Lain" + SweetAlert2 + Pembersihan Komentar Frontend.
  - *Deskripsi:* Membangun UI builder tabel ukuran per produk di form create/edit produk: tambah/ubah/hapus kolom (SweetAlert2 jika ada data teks), tambah/hapus baris, tombol reorder, modal salin struktur kolom dari produk lain, template awal 6 kolom pada create, serta pembersihan total komentar frontend.
  - *Acceptance Criteria:* Builder interaktif berfungsi mulus, konfirmasi hapus SweetAlert2 hanya jika ada data teks, modal salin kolom menduplikasi kolom tanpa isi data sel, 320px–desktop responsive, zero comments di frontend.
  - *File Terdampak:* `views/admin/products/create.ejs`, `views/admin/products/edit.ejs`, `public/js/admin-size-table.js`, `public/css/admin.css`, `locales/id.json`, `locales/en.json`.
  - *Skill:* Impeccable (`$layout`, `$adapt`, `$animate`, `$polish`), `antislop-ui`, `antislop-layoutmobile`, `antislop-human`, `antislop-code`.

- [ ] **T-216**: Endpoint API Salin Kolom (`GET /admin/products/:id/size-table-columns`) & Ekspor CSV Katalog Dinamis Gabungan (*Union of Columns*).
  - *Deskripsi:* Menyediakan endpoint AJAX untuk mengambil definisi kolom produk tertentu, serta memperbarui helper `exportCsv` agar menggabungkan seluruh kolom unik tabel ukuran produk aktif sebagai kolom tambahan CSV.
  - *Acceptance Criteria:* Endpoint API merespons JSON `{ success: true, columns }` dengan proteksi RBAC, ekspor CSV memuat kolom gabungan dinamis, produk tanpa tabel ukuran terisi string kosong `""`.
  - *File Terdampak:* `routes/admin/productRoutes.js`, `controllers/admin/productController.js`.
  - *Skill:* `implement-task`.

- [ ] **T-217**: Validasi Server-Side, Whitelist Kunci Sel, Batas Karakter & Isolasi Data Per Produk secara Atomik.
  - *Deskripsi:* Mengimplementasikan `parseDynamicSizeTable` di controller admin untuk memvalidasi kunci sel terhadap whitelist kolom aktif produk, sanitasi HTML, pemangkasan spasi (trim), pembatasan 1–8 kolom, 0–30 baris, label maks 40 char, sel maks 80 char, dan penjaminan isolasi antar produk.
  - *Acceptance Criteria:* Kunci liar dibuang, label kosong ditolak, tag HTML disanitasi, simpan atomik dalam 1 transaksi SQL, edit Produk A terbukti tidak mengubah data Produk B.
  - *File Terdampak:* `controllers/admin/productController.js`.
  - *Skill:* `implement-task`.

- [ ] **T-218**: Rendering Publik Tabel Ukuran Dinamis Responsif di Halaman Detail Produk (PDP `/products/:slug`).
  - *Deskripsi:* Merender header dan sel tabel ukuran sesuai struktur kolom dinamis produk di `views/public/product-detail.ejs`, mengimplementasikan lebar minimal scoped `.pd-size[data-cols="N"]`, scroll horizontal dengan bayangan visual di desktop, mobile stacked cards (kolom pertama sebagai judul kartu), dan auto-hide jika tabel kosong.
  - *Acceptance Criteria:* Responsif 320px s/d 1440px tanpa horizontal leak di body, kontras AA, zero comments frontend, escape aman bebas XSS.
  - *File Terdampak:* `views/public/product-detail.ejs`, `public/css/components.css`, `locales/id.json`, `locales/en.json`.
  - *Skill:* Impeccable (`$layout`, `$adapt`, `$animate`, `$polish`), `antislop-human`, `antislop-layoutmobile`.

- [ ] **T-219**: Test Suite Otomatis End-to-End (`tests/test-product-dynamic-size-table-qa.js`), Uji Isolasi Produk A vs B, Uji Salin Kolom, Uji CSV Gabungan, Audit XSS, Regresi & Zero Comments Frontend.
  - *Deskripsi:* Membangun test suite QA otomatis yang memvalidasi seluruh alur tabel ukuran dinamis, isolasi data produk, API salin kolom, ekspor CSV gabungan, keamanan sanitasi XSS, verifikasi bug ikon ganda teratasi, penyesuaian unit test terdampak, dan audit nol komentar frontend.
  - *Acceptance Criteria:* Seluruh suite tes berjalan dengan status 100% PASS, zero console errors, nol pelanggaran CSP, view-source bebas `<!--`.
  - *File Terdampak:* `tests/test-product-dynamic-size-table-qa.js`, `tests/test-task-200-backend.js`, `tests/test-task-202-admin-form.js`, `tests/test-task-201-frontend.js`.
  - *Skill:* `implement-task`, `antislop-code`.

