Status: ACTIVE | Terakhir diverifikasi: 2026-11-19 | Kode: routes/adminRoutes.js, controllers/admin/, services/, views/admin/

# PRD: Modul Admin & CMS (Admin CMS & Users)

## 1. Ringkasan & Ruang Lingkup

Modul Admin CMS mengelola panel kendali konten, manajemen pengguna, kontrol akses berbasis peran (RBAC), tinjauan metrik ringkasan pada dashboard, serta pengelolaan prospek masuk (inquiries/RFQ). Spesifikasi formulir produk admin dan paginasi dinamis (`FR-26` s/d `FR-28`, `FR-31`, `FR-32`) dipisahkan ke sub-modul [prd/admin-products-rfq.md](admin-products-rfq.md), dan standar komponen UI lintas modul didokumentasikan pada [prd/admin-ui.md](admin-ui.md).

---

## 2. Functional Requirements

### FR-01: Autentikasi Login Admin

- Akses melalui antarmuka khusus di `/admin/login`.
- Input kredensial: Email dan Password.
- Mekanisme session berbasis JWT yang disimpan di Cookie HttpOnly aman.
- Proteksi brute-force login: pembatasan percobaan gagal maksimal 5 kali dalam 15 menit. Jika terlampaui, akun terkunci sementara (`locked_until`). Setelah masa kunci `locked_until` kedaluwarsa, counter kesalahan sebelumnya direset otomatis sehingga percobaan login berikutnya memperoleh kuota 5 percobaan baru.

### FR-02: Logout Admin

- Mengakhiri sesi pengguna secara aman melalui POST atau GET `/admin/logout`.
- Menghapus cookie JWT dan mengarahkan kembali ke halaman login.

### FR-03: Ganti Password Pengguna

- Pengguna yang telah diautentikasi dapat memperbarui kata sandi mandiri di `/admin/change-password`.
- Validasi kata sandi saat ini dan penegakan kekuatan kata sandi baru minimal 8 karakter yang konsisten dengan nilai yang di-hash (menolak input kosong/hanya spasi atau `< 8` karakter tanpa memotong spasi valid secara diam-diam) serta menolak kata sandi baru yang sama persis dengan kata sandi lama.

### FR-04: Role-Based Access Control (RBAC)

- Tiga tingkatan peran pengguna:
  1. **Superadmin:** Hak akses penuh ke seluruh menu sistem, termasuk Pengaturan Situs, Manajemen Pengguna, dan Penghapusan Data Media.
  2. **Admin:** Hak akses operasional mengelola Banner, Merek, Produk, Kategori, Berita, Kapabilitas, Konten Beranda, Tentang Kami, Kontak, dan Inquiries. Tidak dapat mengelola Pengguna atau Pengaturan Global.
  3. **Editor:** Hak akses terbatas hanya untuk mengelola Artikel Berita, Kategori Berita, dan mengunggah ke Media Library.

### Dashboard CMS Terpadu (`/admin/dashboard`)

- Menampilkan ringkasan metrik statistik operasional:
  - Jumlah Inquiry Baru yang belum dibaca.
  - Total Produk Aktif dalam katalog.
  - Jumlah Artikel Berita terpublikasi.
- **Tabel Inquiry RFQ Terbaru:**
  - Menampilkan tepat **10 data Inquiry RFQ terbaru** (urut tanggal masuk menurun `created_at DESC, id DESC`, dibatasi langsung dengan `LIMIT 10` pada query database, bukan dipotong di view).
  - Tampil **tanpa komponen paginasi**.
  - Pada layar desktop (`> 768px`), pembungkus scroll tabel dinonaktifkan (`overflow: visible; max-height: none`), sedangkan pada layar sempit/mobile (`<= 768px`) wrapper scroll horizontal (`overflow-x: auto`) tetap dipertahankan agar tabel tidak merusak tata letak.
  - Tautan pintas **"Lihat Seluruh Inquiry"** menuju `/admin/inquiries` tetap ditampilkan di toolbar tabel dan berfungsi normal; state kosong tetap tertata rapi.

### FR-16: Pengelolaan Inquiries / Permintaan Penawaran RFQ

- Tinjauan seluruh formulir masuk di `/admin/inquiries` (dengan alias `/admin/leads`).
- Filter status data: Semua (`all`), Baru (`baru`), Dibaca (`dibaca`), Ditindaklanjuti (`ditindaklanjuti`), Ditolak (`ditolak`), serta pencarian kata kunci; whitelist status `['baru', 'dibaca', 'ditindaklanjuti', 'ditolak']` ditegakkan seragam pada filter, pembuatan record, pembaruan status, dan ekspor CSV.
- Modal rincian pratinjau cepat (`#inquiryQuickModal`) dan halaman detail (`/admin/inquiries/:id`) untuk memeriksa spesifikasi kebutuhan produk mitra.
- Kolom catatan internal admin (`admin_notes`) untuk mencatat tindak lanjut tim sales.
- Fitur Ekspor Data ke berkas `.csv` melalui `/admin/inquiries/export`.
- Dilengkapi bar paginasi bersama Varian 1 (`.pgn-*`) tanpa reload halaman penuh (`FR-31`).

### FR-23: Manajemen Pengguna (Superadmin Only)

- Pembuatan akun baru (`/admin/users/create`), daftar pengguna (`/admin/users`), pengeditan peran, dan penonaktifan/penghapusan akun.
- Pencegahan penghapusan akun diri sendiri yang sedang login.

### FR-35: Proteksi Noindex Total Portal & Login Admin

- Seluruh halaman login (`/admin/login`), dashboard, modul CMS, halaman 401/403/429/404/500, penolakan CSRF `/admin/*`, JSON API admin, dan ekspor CSV wajib tidak dapat diindeks oleh mesin pencari melalui header HTTP `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`, meta tag `<meta name="robots" content="noindex, nofollow">`, serta aturan `Disallow: /admin` & `Disallow: /admin/*` pada `/robots.txt` (rincian lengkap pada [prd/seo-security.md](seo-security.md)).

### Formulir Produk & Paginasi Dinamis Admin
- Persyaratan `FR-26` (Formulir Produk Terpadu), `FR-27` (Validasi Server-Side), `FR-28` (Tombol CTA Produk), `FR-31` (Paginasi RFQ), dan `FR-32` (Paginasi Produk Admin) dirinci pada sub-modul [prd/admin-products-rfq.md](admin-products-rfq.md).

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan                                                   | Alasan 1 Kalimat                                                                                                                                       | Tanggal    |
| :---------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :--------- |
| **Tabel RFQ Dashboard `LIMIT 10` & Scroll Mobile Only**     | Membatasi dashboard hanya 10 inquiry terbaru tanpa paginasi, menghapus scroll di desktop, dan mempertahankan scroll horizontal di mobile agar ringkas. | 2026-11-09 |
| **Pemisahan Peran 3 Tingkat (Superadmin/Admin/Editor)**     | Mencegah staf konten mengubah pengaturan sensitif dan memastikan privasi data kontak prospek terjaga.                                                  | 2026-10-05 |
| **Tabel Resmi Tunggal `inquiries`**                         | Memusatkan pencatatan seluruh saluran formulir RFQ ke satu tabel database terstruktur.                                                                 | 2026-10-06 |
| **Cookie Session HttpOnly & SameSite Lax**                  | Melindungi kredensial sesi admin dari pencurian skrip jahat (anti-XSS).                                                                                | 2026-09-29 |
| **Proteksi Noindex Total Rute `/admin*` (`FR-35`)** | Menjamin tidak ada halaman login, endpoint CMS, API JSON, ekspor CSV, maupun halaman error admin yang dapat terindeks mesin pencari.                  | 2026-11-17 |
