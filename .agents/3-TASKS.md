# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 4 Task (T-200 s/d T-203)
- **Total Task Selesai:** 199 Task (T-01 s/d T-199)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-199**.

---

## Task Aktif / Terbuka (Open Tasks)

### T-199: Migrasi Database Skema Kolom Baru Produk

- **Modul:** Products Detail / Database
- **Prioritas:** High
- **Status:** Done
- **Deskripsi:** Membuat berkas migrasi SQL `database/migrations/015_add_product_detail_fields.sql` untuk menambahkan kolom nullable pada tabel `products`: `short_description_id` (VARCHAR 500), `short_description_en` (VARCHAR 500), `variants` (JSON), `size_table` (JSON), serta memastikan kesiapan kolom `gallery_images` (JSON).
- **Acceptance Criteria:**
  - Berkas migrasi `015_add_product_detail_fields.sql` berhasil dieksekusi tanpa error.
  - Kolom baru bertipe NULLABLE sehingga aman bagi seluruh data produk eksisting.
  - Data JSON default berupa `NULL` atau array kosong `[]`.
- **File yang Diubah / Dibuat:**
  - `database/migrations/015_add_product_detail_fields.sql` (baru)
- **Verifikasi:** Eksekusi script migrasi dan periksa ketersediaan kolom via `DESCRIBE products;`.

### T-200: Backend Model, Controller & Validasi Server-Side

- **Modul:** Products Detail & Admin CMS
- **Prioritas:** High
- **Status:** Open
- **Deskripsi:** Memperbarui `models/productModel.js`, `controllers/public/productController.js`, dan `controllers/admin/productController.js` untuk mendukung query, safe JSON parse, dan validasi server-side whitelist pada seluruh kolom baru.
- **Acceptance Criteria:**
  - `productModel.findBySlug` dan `productModel.findById` mengembalikan kolom baru dengan safe JSON parsing (fallback `[]`).
  - `controllers/public/productController.detail` merender data baru ke view EJS tanpa error 500 saat kolom bernilai null.
  - `controllers/admin/productController.store` dan `update` memvalidasi ketat: panjang short description maksimal 500 karakter, variants berupa array of strings, size_table berupa array of objects dengan whitelist keys (`product_code`, `width`, `length`, `thickness`, `capacity`, `material`), dan gallery_images berupa array URL valid.
- **File yang Diubah:**
  - `models/productModel.js`
  - `controllers/public/productController.js`
  - `controllers/admin/productController.js`
- **Verifikasi:** Uji request POST simpan produk dengan berbagai payload data baru dan uji akses GET `/products/:slug` via curl atau browser.

### T-201: Frontend Publik Halaman Detail Produk Baru

- **Modul:** Products Detail
- **Prioritas:** High
- **Status:** Open
- **Deskripsi:** Merombak total `views/public/product-detail.ejs`, menambahkan style dengan namespace `.pd-*` pada `public/css/components.css`, dan membuat skrip interaksi `public/js/product-detail.js` identik dengan prototipe HTML: grid 5:6, galeri foto sticky + thumbnail strip dengan transisi opacity 200ms, breadcrumb, judul responsif, deskripsi singkat, pil varian ukuran, CTA WhatsApp & RFQ form, tab bar navigasi Deskripsi & Tabel Ukuran (mobile card view via `data-l`), serta sticky CTA bar mobile dengan retensi penutupan `sessionStorage`.
- **Acceptance Criteria:**
  - Tata letak identik dengan referensi prototype HTML menggunakan token resmi `tokens.css` (tanpa warna biru, tanpa nilai hex hardcoded).
  - Galeri foto sticky di desktop dan thumbnail strip interaktif berfungsi mulus tanpa layout shift.
  - Pil varian ukuran dapat dipilih dengan status `aria-pressed` yang benar; tersembunyi jika data kosong.
  - Tab bar berpindah mulus antara Deskripsi dan Tabel Ukuran; tabel di mobile (<= 600px) bertransformasi rapi menjadi card layout dengan label `data-l`.
  - Bilah sticky CTA mobile tampil di layar <= 760px dan tombol silang (×) menyembunyikannya selama sesi berjalan.
  - 100% bebas dari inline style baru dan inline event handler (`onclick`), patuh CSP Helmet.
- **File yang Diubah / Dibuat:**
  - `views/public/product-detail.ejs`
  - `public/css/components.css`
  - `public/js/product-detail.js` (baru)
- **Skill:** `impeccable` ($polish, $adapt, $animate)
- **Verifikasi:** Buka halaman detail produk di browser pada resolusi 320px, 480px, 768px, 1024px, dan 1440px; verifikasi klik thumbnail, klik varian, tab switching, dan tombol close sticky bar.

### T-202: Admin CMS Form Produk & Multi-Select Media Picker

- **Modul:** Admin CMS & Media Library
- **Prioritas:** High
- **Status:** Open
- **Deskripsi:** Memperbarui Universal Media Picker untuk mendukung mode multi-select, serta memperbarui formulir tambah dan edit produk di admin (`views/admin/products/create.ejs` dan `edit.ejs`): galeri foto multi-picker dengan tombol pengatur urutan (panah) dan hapus, textarea deskripsi singkat dengan counter 200 karakter, editor TinyMCE untuk deskripsi lengkap, input varian ukuran dinamis, dan tabel ukuran dinamis 6 kolom.
- **Acceptance Criteria:**
  - Universal Media Picker mendukung opsi `multiple: true` untuk memilih beberapa gambar sekaligus tanpa merusak mode single-select eksisting.
  - Admin dapat menambah, mengurutkan (geser panah), dan menghapus gambar galeri produk.
  - Counter karakter pada deskripsi singkat menghitung sisa karakter secara akurat real-time.
  - Editor TinyMCE terintegrasi untuk input deskripsi lengkap dwibahasa.
  - Input varian dan tabel ukuran mendukung penambahan dan penghapusan baris dinamis secara instan.
  - Modal dan layout form tetap rapi (header sticky, footer aksi selalu terlihat) pada zoom 100%, 125%, 150%.
- **File yang Diubah / Dibuat:**
  - `views/partials/media-picker-modal.ejs`
  - `public/js/media-picker.js`
  - `views/admin/products/create.ejs`
  - `views/admin/products/edit.ejs`
- **Skill:** `antislop-code`, `impeccable` ($polish)
- **Verifikasi:** Buat produk baru melalui CMS dengan mengisi seluruh field baru, periksa penyimpanan di database, lalu buka form edit untuk memverifikasi data ter-populate kembali dengan benar.

### T-203: QA, Kepatuhan CSP, Audit Aksesibilitas WCAG AA & Uji Regresi

- **Modul:** Cross-Module QA
- **Prioritas:** High
- **Status:** Open
- **Deskripsi:** Menjalankan pengujian menyeluruh terhadap halaman publik detail produk dan form admin: pengujian responsif (320px hingga 1440px), pengujian dwibahasa (ID dan EN), audit kontras warna WCAG AA, navigasi keyboard (Tab, Enter, Space, Escape), verifikasi zero console error, validasi kepatuhan CSP Helmet, serta pengujian regresi untuk memastikan homepage, listing produk (`/products`), dan modul admin lainnya tidak mengalami gangguan.
- **Acceptance Criteria:**
  - Kontras warna teks dan elemen interaktif memenuhi standar WCAG AA (>= 4.5:1 untuk teks normal, >= 3:1 untuk elemen UI).
  - Seluruh interaksi dapat diakses penuh via keyboard dengan focus ring yang tampak jelas.
  - Bebas dari error JavaScript console browser dan nol peringatan pelanggaran CSP.
  - Halaman listing produk (`/products`), beranda 4 panel kategori, dan menu admin lain berfungsi normal 100% tanpa regresi.
- **File yang Diubah / Dibuat:**
  - `tests/test-product-detail-redesign-qa.js` (baru)
- **Skill:** `antislop-human`, `antislop-code`
- **Verifikasi:** Jalankan automated QA script `node tests/test-product-detail-redesign-qa.js` dan lakukan click-through audit manual di berbagai viewport.
