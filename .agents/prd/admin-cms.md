Status: ACTIVE | Terakhir diverifikasi: 2026-11-03 | Kode: routes/adminRoutes.js, controllers/admin/, views/admin/

# PRD: Modul Admin & CMS (Admin CMS & Users)

## 1. Ringkasan & Ruang Lingkup

Modul Admin CMS mengelola panel kendali konten, manajemen pengguna, kontrol akses berbasis peran (RBAC), tinjauan metrik ringkasan pada dashboard, katalog produk admin, serta pengelolaan prospek masuk (inquiries/RFQ). Standar komponen UI lintas modul (`.adm-btn-*`, `.eu-dd-*`, `.pgn-*`, dan validasi form) didokumentasikan pada sub-modul [prd/admin-ui.md](admin-ui.md).

---

## 2. Functional Requirements

### FR-01: Autentikasi Login Admin

- Akses melalui antarmuka khusus di `/admin/login`.
- Input kredensial: Email dan Password.
- Mekanisme session berbasis JWT yang disimpan di Cookie HttpOnly aman.
- Proteksi brute-force login: pembatasan percobaan gagal maksimal 5 kali dalam 15 menit. Jika terlampaui, akun terkunci sementara (`locked_until`).

### FR-02: Logout Admin

- Mengakhiri sesi pengguna secara aman melalui POST atau GET `/admin/logout`.
- Menghapus cookie JWT dan mengarahkan kembali ke halaman login.

### FR-03: Ganti Password Pengguna

- Pengguna yang telah diautentikasi dapat memperbarui kata sandi mandiri di `/admin/change-password`.
- Validasi kata sandi saat ini dan penegakan kekuatan kata sandi baru (minimal 8 karakter).

### FR-04: Role-Based Access Control (RBAC)

- Tiga tingkatan peran pengguna:
  1. **Superadmin:** Hak akses penuh ke seluruh menu sistem, termasuk Pengaturan Situs, Manajemen Pengguna, dan Penghapusan Data Media.
  2. **Admin:** Hak akses operasional mengelola Banner, Merek, Produk, Kategori, Berita, Kapabilitas, Konten Beranda, Tentang Kami, Kontak, dan Inquiries. Tidak dapat mengelola Pengguna atau Pengaturan Global.
  3. **Editor:** Hak akses terbatas hanya untuk mengelola Artikel Berita, Kategori Berita, dan mengunggah ke Media Library.

### Dashboard CMS Terpadu (`/admin/dashboard`) `[PENDING T-302]`

- Menampilkan ringkasan metrik statistik operasional:
  - Jumlah Inquiry Baru yang belum dibaca.
  - Total Produk Aktif dalam katalog.
  - Jumlah Artikel Berita terpublikasi.
- **Tabel Inquiry RFQ Terbaru `[PENDING T-302]`:**
  - Menampilkan tepat **10 data Inquiry RFQ terbaru** (urut tanggal masuk menurun `created_at DESC, id DESC`, dibatasi langsung dengan `LIMIT 10` pada query database, bukan dipotong di view).
  - Tampil **tanpa komponen paginasi**.
  - Pada layar desktop (`> 768px`), pembungkus scroll tabel dinonaktifkan (`overflow: visible; max-height: none`), sedangkan pada layar sempit/mobile (`<= 768px`) wrapper scroll horizontal (`overflow-x: auto`) tetap dipertahankan agar tabel tidak merusak tata letak.
  - Tautan pintas **"Lihat Seluruh Inquiry"** menuju `/admin/inquiries` tetap ditampilkan di toolbar tabel dan berfungsi normal; state kosong tetap tertata rapi.

### FR-16: Pengelolaan Inquiries / Permintaan Penawaran RFQ `[PENDING T-304]`

- Tinjauan seluruh formulir masuk di `/admin/inquiries` (dengan alias `/admin/leads`).
- Filter status data: Semua (`all`), Baru (`baru`), Diproses (`diproses`), Selesai (`selesai`), Ditolak (`ditolak`), serta pencarian kata kunci.
- Modal rincian pratinjau cepat (`#inquiryQuickModal`) dan halaman detail (`/admin/inquiries/:id`) untuk memeriksa spesifikasi kebutuhan produk mitra.
- Kolom catatan internal admin (`admin_notes`) untuk mencatat tindak lanjut tim sales.
- Fitur Ekspor Data ke berkas `.csv` melalui `/admin/inquiries/export`.
- Dilengkapi bar paginasi bersama Varian 1 (`.pgn-*`) tanpa reload halaman penuh (`FR-31`).

### FR-23: Manajemen Pengguna (Superadmin Only)

- Pembuatan akun baru (`/admin/users/create`), daftar pengguna (`/admin/users`), pengeditan peran, dan penonaktifan/penghapusan akun.
- Pencegahan penghapusan akun diri sendiri yang sedang login.

### FR-26: Formulir Produk Admin Terpadu & Field Dinamis

- Pembaruan formulir tambah (`/admin/products/create`) dan ubah (`/admin/products/:id/edit`) dengan komponen terstruktur:
  1. **Thumbnail Utama:** Satu gambar pilihan via Universal Media Picker modal.
  2. **Galeri Foto Produk (Gallery Multi-Picker):** Mode multi-select dilengkapi tombol panah geser untuk mengatur urutan dan tombol silang untuk menghapus. Disimpan sebagai array JSON string URL (`gallery_images`).
  3. **Deskripsi Singkat (Short Description ID & EN):** Textarea dwibahasa maksimal 200 karakter dengan _character counter_ real-time.
  4. **Deskripsi Lengkap (Full Description ID & EN):** Editor teks kaya TinyMCE.
  5. **Variasi Ukuran Produk (Variant Pills):** Baris dinamis dengan tombol "Tambah Ukuran" (1 ikon) dan tombol hapus baris. Disimpan sebagai array JSON of strings (`variants`).
  6. **Tabel Ukuran Dinamis Per Produk (Size Table):** Builder tabel ukuran dinamis dengan tombol "Tambah Kolom", "Tambah Baris", modal "Salin Struktur Kolom dari Produk Lain", reorder kolom/baris, batas 1-8 kolom, 0-30 baris, label maks 40 char, sel maks 80 char, konfirmasi SweetAlert2 saat menghapus kolom/baris berisi teks, serta navigasi keyboard panah antar sel dan Enter pada baris terakhir. Disimpan sebagai JSON `{ columns, rows }`.
  7. **Eliminasi Field Legacy:** Kolom "Ringkasan Karakteristik Material" dan card "Tabel Spesifikasi Teknis Parameter" dieliminasi total.
  8. **Kepatuhan Tampilan Form Admin:** Header form _sticky_, body _scrollable_, tombol Simpan/Batal selalu terlihat pada zoom 100%, 125%, 150% dan tinggi layar 600-768px.

### FR-27: Validasi Server-Side Data Produk & Whitelist

- Validasi ketat pada endpoint simpan/update produk:
  1. `short_description_id` dan `short_description_en`: string maksimal 200 karakter.
  2. `variants`: array of strings yang disanitasi dari tag berbahaya.
  3. `size_table`: objek JSON valid `{ columns, rows }` dengan verifikasi whitelist ID kolom (`col_xxxx`), bebas tag HTML, dan dipangkas spasi.
  4. `gallery_images`: array of strings URL yang valid.
  5. `cta_text_id` dan `cta_text_en`: string maksimal 50 karakter, disanitasi bebas tag HTML.

### FR-28: Kustomisasi Teks Tombol CTA Produk

- Form create dan edit produk menyediakan input teks dwibahasa (`cta_text_id` dan `cta_text_en`, maks 50 karakter, opsional) dengan fallback ke default ("Minta Penawaran via WhatsApp" / "Request Quote via WhatsApp") dan mengarah ke `settings.whatsapp_number`.

### FR-31: Paginasi Dinamis Tanpa Reload pada Daftar RFQ/Inquiry Admin (`/admin/inquiries`) `[PENDING T-303, T-304, T-306]`

- Menggunakan komponen paginasi bersama Varian 1 (`.pgn-*`, `views/partials/pagination.ejs` + `public/js/pagination.js`) dengan pilihan `per_page` **10, 25, 50, dan 100** (default **10**).
- Perpindahan halaman dan perubahan `per_page` berjalan **tanpa reload halaman penuh** (fetch JSON/partial HTML dari server per halaman dengan `AbortController`) dan menyinkronkan URL melalui `history.pushState` (`?page=&per_page=`) serta mendukung tombol Back/Forward browser (`popstate`).
- Mengganti `per_page`, memilih tab filter status, atau mengetik pencarian otomatis mereset halaman kembali ke **halaman 1** dan mempertahankan filter aktif.
- Seluruh aksi per baris (Tinjau modal, Detail, ubah status dropdown, badge status, hapus data) tetap berfungsi setelah halaman berganti melalui _event delegation_ dan re-inisialisasi state modal/dropdown.
- Setelah penghapusan baris yang membuat halaman terakhir kosong, tampilan otomatis mundur ke halaman valid terakhir.

### FR-32: Paginasi Dinamis Tanpa Reload pada Daftar Katalog Produk Admin (`/admin/products`) `[PENDING T-303, T-305, T-306]`

- Halaman daftar Katalog Produk Admin (`/admin/products`) menggunakan komponen paginasi bersama Varian 1 (`.pgn-*`) dengan pilihan `per_page` **10, 25, 50, dan 100** (default **10**), tanpa mengubah halaman katalog publik (`/products`).
- Filter kategori produk (`category_id`) dan pencarian kata kunci (`q`) tetap sinkron dengan paginasi tanpa reload halaman penuh, memperbarui URL via `history.pushState`, dan mereset halaman ke **halaman 1** saat diubah.
- Saat berpindah halaman, dimensi thumbnail dan baris tabel tetap stabil (tanpa _layout shift_), viewport melakukan scroll halus ke awal tabel produk, fokus dikelola secara aksesibel, dan `aria-live="polite"` mengumumkan halaman baru.
- Seluruh aksi baris produk (Edit, Toggle Status, Hapus Produk) tetap berfungsi setelah pergantian halaman; penghapusan produk terakhir pada halaman ujung memundurkan halaman aktif ke halaman valid sebelumnya.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan                                                           | Alasan 1 Kalimat                                                                                                                                            | Tanggal    |
| :------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------- |
| **Tabel RFQ Dashboard `LIMIT 10` & Scroll Mobile Only**             | Membatasi dashboard hanya 10 inquiry terbaru tanpa paginasi, menghapus scroll di desktop, dan mempertahankan scroll horizontal di mobile agar ringkas.      | 2026-11-09 |
| **Paginasi Tanpa Reload Varian 1 (`.pgn-*`) di RFQ & Produk Admin** | Menyatukan navigasi tabel `/admin/inquiries` dan `/admin/products` dalam satu komponen bersama berbasis Fetch + `pushState` tanpa membebani halaman publik. | 2026-11-09 |
| **Pengurutan Galeri via Tombol Panah**                              | Menghindari dependensi drag-and-drop eksternal, 100% aman CSP, dan ramah aksesibilitas.                                                                     | 2026-10-23 |
| **Validasi Whitelist Kolom JSON Produk**                            | Mencegah injeksi payload data tak terduga pada kolom varian dan tabel ukuran produk.                                                                        | 2026-10-23 |
| **Pemisahan Peran 3 Tingkat (Superadmin/Admin/Editor)**             | Mencegah staf konten mengubah pengaturan sensitif dan memastikan privasi data kontak prospek terjaga.                                                       | 2026-10-05 |
| **Tabel Resmi Tunggal `inquiries`**                                 | Memusatkan pencatatan seluruh saluran formulir RFQ ke satu tabel database terstruktur.                                                                      | 2026-10-06 |
| **Cookie Session HttpOnly & SameSite Lax**                          | Melindungi kredensial sesi admin dari pencurian skrip jahat (anti-XSS).                                                                                     | 2026-09-29 |
