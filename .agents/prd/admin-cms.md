Status: ACTIVE | Terakhir diverifikasi: 2026-10-21 | Kode: routes/adminRoutes.js, controllers/admin/, views/admin/

# PRD: Modul Admin & CMS (Admin CMS & Users)

## 1. Ringkasan & Ruang Lingkup
Modul Admin CMS mengelola panel kendali konten, manajemen pengguna, kontrol akses berbasis peran (RBAC), tinjauan metrik ringkasan pada dashboard, serta pengelolaan prospek masuk (inquiries/RFQ).

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

### FR-16: Pengelolaan Inquiries / Permintaan Penawaran RFQ
- Tinjauan seluruh formulir masuk di `/admin/inquiries` (dengan alias `/admin/leads`).
- Filter status data: Semua, Baru (`baru`), Sudah Dibaca (`dibaca`), Ditindaklanjuti (`ditindaklanjuti`), Ditolak (`ditolak`).
- Modal/Halaman rincian pesan untuk memeriksa spesifikasi kebutuhan produk mitra.
- Kolom catatan internal admin (`admin_notes`) untuk mencatat tindak lanjut tim sales.
- Fitur Ekspor Data ke berkas `.csv` melalui `/admin/inquiries/export`.

### FR-23: Manajemen Pengguna (Superadmin Only)
- Pembuatan akun baru (`/admin/users/create`), daftar pengguna (`/admin/users`), pengeditan peran, dan penonaktifan/penghapusan akun.
- Pencegahan penghapusan akun diri sendiri yang sedang login.

### Dashboard CMS Terpadu (`/admin/dashboard`)
- Menampilkan ringkasan metrik statistik operasional:
  - Jumlah Inquiry Baru yang belum dibaca.
  - Total Produk Aktif dalam katalog.
  - Jumlah Artikel Berita terpublikasi.
  - Tabel 5 Inquiry terbaru untuk penanganan cepat tim sales.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Pemisahan Peran 3 Tingkat (Superadmin/Admin/Editor)** | Mencegah staf konten mengubah pengaturan sensitif dan memastikan privasi data kontak prospek terjaga. | 2026-10-05 |
| **Tabel Resmi Tunggal `inquiries`** | Memusatkan pencatatan seluruh saluran formulir RFQ ke satu tabel database terstruktur. | 2026-10-06 |
| **Cookie Session HttpOnly & SameSite Lax** | Melindungi kredensial sesi admin dari pencurian skrip jahat (anti-XSS). | 2026-09-29 |
