Status: ACTIVE | Terakhir diverifikasi: 2026-10-27 | Kode: routes/adminRoutes.js, controllers/admin/, views/admin/

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

### FR-26: Formulir Produk Admin Terpadu & Field Dinamis
- Pembaruan formulir tambah (`/admin/products/create`) dan ubah (`/admin/products/:id/edit`) dengan komponen terstruktur:
  1. **Thumbnail Utama:** Satu gambar pilihan via Universal Media Picker modal.
  2. **Galeri Foto Produk (Gallery Multi-Picker):** Membuka media picker dalam mode multi-select untuk memilih banyak gambar sekaligus. Dilengkapi tombol panah geser untuk mengatur urutan dan tombol silang (×) untuk menghapus. Disimpan sebagai array JSON string URL (`gallery_images`).
  3. **Deskripsi Singkat (Short Description ID & EN):** Textarea dwibahasa maksimal 200 karakter dilengkapi indikator penghitung karakter real-time (*character counter*).
  4. **Deskripsi Lengkap (Full Description ID & EN):** Integrasi editor teks kaya TinyMCE untuk penulisan deskripsi lengkap berformat.
  5. **Variasi Ukuran Produk (Variant Pills):** Baris dinamis dengan tombol "Tambah Ukuran" (tepat 1 ikon) dan tombol hapus baris (×) [PENDING T-212]. Disimpan sebagai array JSON of strings (`variants`).
  6. **Tabel Ukuran Dinamis Per Produk (Size Table) [PENDING T-212, T-214-T-217]:** Builder tabel ukuran dinamis dengan tombol "Tambah Kolom", "Tambah Baris" (tepat 1 ikon), modal "Salin Struktur Kolom dari Produk Lain", reorder kolom/baris, batas 1–8 kolom, 0–30 baris, label maks 40 char, sel maks 80 char, dan SweetAlert2 saat menghapus kolom/baris berisi teks. Disimpan sebagai objek JSON `{ columns, rows }`.
  7. **Eliminasi Field Legacy:** Kolom "Ringkasan Karakteristik Material" dan card "Tabel Spesifikasi Teknis Parameter" dieliminasi total dari formulir.
  8. **Kepatuhan Tampilan Form Admin:** Header form tetap (*sticky*), area isi form dapat digulir (*scrollable body*), tombol aksi Simpan/Batal selalu terlihat di layar pada tingkat zoom 100%, 125%, 150% dan ketinggian layar 600–768px.

### FR-27: Validasi Server-Side Data Produk & Whitelist
- Validasi ketat pada endpoint simpan/update produk:
  1. `short_description_id` dan `short_description_en`: string maksimal 200 karakter.
  2. `variants`: array of strings yang disanitasi dari tag berbahaya.
  3. `size_table`: objek JSON valid `{ columns, rows }` di mana setiap kunci sel diverifikasi terhadap whitelist ID kolom produk bersangkutan (`col_xxxx`). Seluruh label kolom dan nilai sel disanitasi bebas tag HTML dan dipangkas spasi (trim) [PENDING T-217].
  4. `gallery_images`: array of strings URL yang valid.
  5. `cta_text_id` dan `cta_text_en`: string maksimal 50 karakter, disanitasi bebas dari tag HTML berbahaya.

### FR-28: Kustomisasi Teks Tombol CTA Produk
- Form create dan edit produk CMS menyediakan input teks dwibahasa untuk kustomisasi tombol aksi CTA halaman detail produk publik:
  1. **Teks Tombol CTA ID (`cta_text_id`):** Label tombol aksi utama bahasa Indonesia (maks 50 karakter). Bersifat opsional, fallback ke default "Minta Penawaran via WhatsApp".
  2. **Teks Tombol CTA EN (`cta_text_en`):** Label tombol aksi utama bahasa Inggris (maks 50 karakter). Bersifat opsional, fallback ke default "Request Quote via WhatsApp".
  3. **Integrasi Kontak WhatsApp:** Tombol CTA tetap mengarah ke WhatsApp menggunakan nomor telepon resmi yang dikelola terpusat di Pengaturan Situs (`settings.whatsapp_number`).

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Pengurutan Galeri via Tombol Panah** | Menghindari dependensi drag-and-drop eksternal, 100% aman CSP, dan ramah aksesibilitas. | 2026-10-23 |
| **Validasi Whitelist Kolom JSON Produk** | Mencegah injeksi payload data tak terduga pada kolom varian dan tabel ukuran produk. | 2026-10-23 |
| **Pemisahan Peran 3 Tingkat (Superadmin/Admin/Editor)** | Mencegah staf konten mengubah pengaturan sensitif dan memastikan privasi data kontak prospek terjaga. | 2026-10-05 |
| **Tabel Resmi Tunggal `inquiries`** | Memusatkan pencatatan seluruh saluran formulir RFQ ke satu tabel database terstruktur. | 2026-10-06 |
| **Cookie Session HttpOnly & SameSite Lax** | Melindungi kredensial sesi admin dari pencurian skrip jahat (anti-XSS). | 2026-09-29 |
