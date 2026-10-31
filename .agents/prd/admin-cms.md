Status: ACTIVE | Terakhir diverifikasi: 2026-10-30 | Kode: routes/adminRoutes.js, controllers/admin/, views/admin/

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
  5. **Variasi Ukuran Produk (Variant Pills):** Baris dinamis dengan tombol "Tambah Ukuran" (tepat 1 ikon) dan tombol hapus baris (×). Disimpan sebagai array JSON of strings (`variants`).
  6. **Tabel Ukuran Dinamis Per Produk (Size Table):** Builder tabel ukuran dinamis dengan tombol "Tambah Kolom", "Tambah Baris" (tepat 1 ikon), modal "Salin Struktur Kolom dari Produk Lain" (hanya menampilkan produk dengan tabel ukuran), reorder kolom/baris, batas 1–8 kolom, 0–30 baris, label maks 40 char, sel maks 80 char, konfirmasi SweetAlert2 saat menghapus kolom/baris berisi teks, serta navigasi keyboard tombol panah (ArrowUp, ArrowDown, ArrowLeft, ArrowRight) antar sel input dan tombol Enter pada baris terakhir untuk menambah baris baru otomatis. Disimpan sebagai objek JSON `{ columns, rows }`.
  7. **Eliminasi Field Legacy:** Kolom "Ringkasan Karakteristik Material" dan card "Tabel Spesifikasi Teknis Parameter" dieliminasi total dari formulir.
  8. **Kepatuhan Tampilan Form Admin:** Header form tetap (*sticky*), area isi form dapat digulir (*scrollable body*), tombol aksi Simpan/Batal selalu terlihat di layar pada tingkat zoom 100%, 125%, 150% dan ketinggian layar 600–768px.

### FR-27: Validasi Server-Side Data Produk & Whitelist
- Validasi ketat pada endpoint simpan/update produk:
  1. `short_description_id` dan `short_description_en`: string maksimal 200 karakter.
  2. `variants`: array of strings yang disanitasi dari tag berbahaya.
  3. `size_table`: objek JSON valid `{ columns, rows }` di mana setiap kunci sel diverifikasi terhadap whitelist ID kolom produk bersangkutan (`col_xxxx`). Seluruh label kolom dan nilai sel disanitasi bebas tag HTML dan dipangkas spasi (trim).
  4. `gallery_images`: array of strings URL yang valid.
  5. `cta_text_id` dan `cta_text_en`: string maksimal 50 karakter, disanitasi bebas dari tag HTML berbahaya.

### FR-28: Kustomisasi Teks Tombol CTA Produk
- Form create dan edit produk CMS menyediakan input teks dwibahasa untuk kustomisasi tombol aksi CTA halaman detail produk publik:
  1. **Teks Tombol CTA ID (`cta_text_id`):** Label tombol aksi utama bahasa Indonesia (maks 50 karakter). Bersifat opsional, fallback ke default "Minta Penawaran via WhatsApp".
  2. **Teks Tombol CTA EN (`cta_text_en`):** Label tombol aksi utama bahasa Inggris (maks 50 karakter). Bersifat opsional, fallback ke default "Request Quote via WhatsApp".
  3. **Integrasi Kontak WhatsApp:** Tombol CTA tetap mengarah ke WhatsApp menggunakan nomor telepon resmi yang dikelola terpusat di Pengaturan Situs (`settings.whatsapp_number`).

### FR-29: Komponen Tombol Admin Terpadu & Format Slug Ringkas `[PENDING T-255, T-257, T-258]`
- Seluruh tombol di panel Admin wajib menggunakan komponen tombol admin terpadu berprefix unik `.adm-btn` (mengacu pada gaya tombol editor tabel ukuran produk) agar terisolasi dari tombol halaman publik:
  1. **Anatomi & Aksesibilitas Seragam:** Tinggi, radius (`var(--r-md)`), padding, jarak ikon, focus ring (`var(--focus-ring)`), state `disabled`, dan state loading (`.is-loading`) saat submit seragam; target sentuh minimal `44px` pada layar mobile (`<= 768px`); ikon SVG inline di sisi kiri selaras makna; label ringkas dwibahasa (ID dan EN) yang telah dikunci disertai `aria-label` deskriptif.
  2. **Empat Varian Resmi Berbasis Token:**
     - `primary` (Simpan/aksi komit utama): latar solid hijau lembut daun dari token (`var(--adm-btn-primary-bg)` / `var(--color-leaf-soft)`), teks & ikon gelap kontras tinggi (`var(--surface-dark-deep)` / `var(--text-main)`, rasio kontras WCAG AAA), border tipis (`var(--adm-btn-primary-border)`).
     - `secondary` (aksi umum/tambah baris/salin/ekspor/pratinjau): outline tipis seperti tombol tabel ukuran (`var(--bg-surface)`, border `var(--border-main)`, teks & ikon `var(--primary)`).
     - `neutral`/`ghost` (batal/kembali/reset): abu-abu netral (`var(--bg-surface)`, border `var(--border-main)`, teks & ikon `var(--text-secondary)`).
     - `danger` (hapus di halaman, tabel, Media Library/Picker, dan modal konfirmasi): latar `var(--st-ditolak-bg)`, border `var(--st-ditolak-border)`, teks & ikon `var(--st-ditolak-text)`.
  3. **Animasi Mikro:** Hanya menggunakan properti `transform` dan `opacity`, efek hover dibungkus `@media (hover: hover)`, state `:active` untuk layar sentuh, dan dinonaktifkan pada `@media (prefers-reduced-motion: reduce)`.
  4. **Format Tampilan Slug Ringkas `[PENDING T-255]`:** Tampilan slug pada tabel daftar admin (Produk, Artikel Berita, Merek, Kategori) serta pratinjau/input di form tambah/edit hanya merender **1 baris slug tunggal** dengan tipografi monospace kecil (`var(--font-mono)`), warna `var(--text-muted)`, dan pemotongan `text-overflow: ellipsis` tanpa bullet (`&bull;`), tanpa pengulangan judul bahasa Inggris (`name_en`/`title_en`), dan tanpa prefix teks `slug:`. Perilaku pembuatan slug otomatis dan redirect 301 tetap dipertahankan.

### FR-30: Standar Validasi Formulir & Dialog Admin Bertema `[PENDING T-259, T-260, T-261]`
- Seluruh form di panel Admin wajib menggunakan atribut `novalidate` dan divalidasi oleh modul JS terpusat tanpa handler inline untuk menggantikan tooltip validasi bawaan browser:
  1. **Validasi Berbasis Atribut Markup & Kontrol Kustom:** Membaca atribut HTML (`required`, `maxlength`, `minlength`, `pattern`, `type`, `min`, `max`) serta memvalidasi komponen kustom (TinyMCE, Media Picker, `select`, repeater WhatsApp, dan editor tabel ukuran).
  2. **Siklus Pemicu Validasi:** Validasi dijalankan saat tombol **Submit** ditekan, lalu berjalan secara *live* (`input`/`change`) per field setelah field tersebut pernah mengalami error agar pesan dan border merah langsung hilang begitu diperbaiki.
  3. **Tampilan Error Inline & Navigasi Tab Otomatis:** Error ditampilkan di bawah field menggunakan warna token error (`var(--color-error)`, `var(--color-error-bg)`), ikon peringatan kecil, border merah token, `aria-invalid="true"`, dan `aria-describedby` dalam bahasa aktif (ID/EN), selaras dengan error validasi server-side. Jika field error berada di dalam tab/panel yang tersembunyi, tab tersebut otomatis dibuka lalu halaman menggulir dan memfokuskan ke field error pertama.
  4. **Dialog SweetAlert2 Bertema (Pengganti `alert`/`confirm` Native):** Seluruh pemanggilan `alert()` dan `confirm()` native di area admin diganti dengan modal SweetAlert2 bertema token Euodoo, menggunakan tombol `.adm-btn-danger` untuk konfirmasi hapus dan `.adm-btn-neutral` untuk batal.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Komponen Tombol Admin Terpadu `.adm-btn-*` `[PENDING T-257, T-258]`** | Menyeragamkan hierarki aksi admin (primary hijau lembut daun `--color-leaf-soft` berteks gelap kontras AAA, secondary hijau outline, neutral abu, danger merah) tanpa merusak class `.btn-*` halaman publik. | 2026-10-31 |
| **Validasi Form Submit + Live Pasca-Error & SweetAlert2 `[PENDING T-259, T-260]`** | Menggantikan tooltip validasi bawaan browser dan `alert`/`confirm` native dengan umpan balik bertema dwibahasa ID/EN yang aksesibel. | 2026-10-31 |
| **Tampilan Slug Admin 1 Baris Tanpa Bullet & Tanpa Judul EN `[PENDING T-255]`** | Menghilangkan duplikasi visual antara judul bahasa Inggris dan kode slug di tabel daftar serta form admin. | 2026-10-31 |
| **Pengurutan Galeri via Tombol Panah** | Menghindari dependensi drag-and-drop eksternal, 100% aman CSP, dan ramah aksesibilitas. | 2026-10-23 |
| **Validasi Whitelist Kolom JSON Produk** | Mencegah injeksi payload data tak terduga pada kolom varian dan tabel ukuran produk. | 2026-10-23 |
| **Pemisahan Peran 3 Tingkat (Superadmin/Admin/Editor)** | Mencegah staf konten mengubah pengaturan sensitif dan memastikan privasi data kontak prospek terjaga. | 2026-10-05 |
| **Tabel Resmi Tunggal `inquiries`** | Memusatkan pencatatan seluruh saluran formulir RFQ ke satu tabel database terstruktur. | 2026-10-06 |
| **Cookie Session HttpOnly & SameSite Lax** | Melindungi kredensial sesi admin dari pencurian skrip jahat (anti-XSS). | 2026-09-29 |
