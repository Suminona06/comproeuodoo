# TASK LIST: Website Company Profile PT Euodoo

- **Tanggal Pembuatan:** 2026-09-29
- **Sumber Acuan:** [.agents/2-TECH-SPEC.md](file:///home/itpc/Euodoo/.agents/2-TECH-SPEC.md)
- **Tech Stack:** Node.js (Express.js) + EJS (SSR) + Vanilla CSS + MySQL 8
- **Target Hosting:** Jagoanhosting Shared Hosting (cPanel / Phusion Passenger)
- **Total Task:** 25 Task (T-01 s/d T-25)

---

## Ringkasan Modul & Dependensi

```
[Modul 0: Inisialisasi & Fondasi (T-01..T-03)]
                 │
                 ▼
[Modul 1: Database & Migrasi (T-04..T-06)]
                 │
                 ▼
[Modul 2: Autentikasi Admin & Keamanan (T-07..T-09)]
                 │
                 ▼
[Modul 3: Content Management System (T-10..T-15)]
                 │
                 ▼
[Modul 4: Halaman Publik SSR & Lokalisasi (T-16..T-21)]
                 │
                 ▼
[Modul 5: Optimasi, Audit & Deployment (T-22..T-25)]
```

---

## Modul 0: Project Initialization & Foundation Setup

#### T-01: Inisialisasi Proyek Node.js & Dependensi Inti
- **Judul:** Inisialisasi package.json dan instalasi dependensi Express
- **Deskripsi:** Membuat file `package.json` dengan `type: "module"`, menginstal dependensi inti (`express`, `ejs`, `mysql2`, `dotenv`, `helmet`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `compression`, `express-rate-limit`, `multer`, `sharp`, `nodemailer`) serta nodemon untuk development.
- **Modul:** Modul 0: Inisialisasi & Fondasi
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** None
- **Tanggal:** 2026-09-29
- **Estimasi:** 1 jam
- **File yang diubah:**
  - `package.json`
  - `.env.example`
  - `.gitignore`

#### T-02: Setup Entry Point Server & Struktur MVC Express
- **Judul:** Pembuatan kerangka server Express dan folder MVC
- **Deskripsi:** Membuat skeleton direktori (`config/`, `controllers/`, `models/`, `routes/`, `views/`, `public/`, `middleware/`, `utils/`), konfigurasi `app.js` (middleware parser, cookie, helmet, compression, static files), dan `server.js` yang kompatibel dengan Phusion Passenger cPanel.
- **Modul:** Modul 0: Inisialisasi & Fondasi
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-01
- **Tanggal:** 2026-09-29
- **Estimasi:** 2 jam
- **File yang diubah:**
  - `app.js`
  - `server.js`
  - `config/constants.js`
  - `middleware/errorHandler.js`

#### T-03: Implementasi Design System CSS Tokens & Grid
- **Judul:** Pembuatan CSS Design System (Pacific Corporate & Energy)
- **Deskripsi:** Mengimplementasikan token CSS sesuai panduan `Design/DESIGN.md`: warna korporat primer (`#0055B8`), navy (`#0A192F`), font Plus Jakarta Sans, radius token (4px-8px, status pill 9999px), elevasi Level 0-3, serta layout grid responsif 12 kolom desktop, 8 kolom tablet, dan 4 kolom mobile.
- **Modul:** Modul 0: Inisialisasi & Fondasi
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-02
- **Tanggal:** 2026-09-29
- **Estimasi:** 3 jam
- **File yang diubah:**
  - `public/css/tokens.css`
  - `public/css/base.css`
  - `public/css/layout.css`
  - `public/css/components.css`

---

## Modul 1: Database Architecture & Migration

#### T-04: Setup MySQL Connection Pool & Runner Migrasi
- **Judul:** Konfigurasi koneksi MySQL dan skrip runner migrasi
- **Deskripsi:** Mengonfigurasi `config/database.js` menggunakan `mysql2/promise` dengan pooling (`connectionLimit: 10`), serta membuat runner migrasi mandiri `database/migrate.js` yang mengeksekusi berkas-berkas SQL secara berurutan dan idempotent.
- **Modul:** Modul 1: Arsitektur Database & Migrasi
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-01, T-02
- **Tanggal:** 2026-09-29
- **Estimasi:** 2 jam
- **File yang diubah:**
  - `config/database.js`
  - `database/migrate.js`

#### T-05: Pembuatan Skrip SQL Migrasi Skema 8 Tabel
- **Judul:** Skrip DDL tabel dan indexing database
- **Deskripsi:** Membuat file migrasi SQL skema 8 tabel lengkap dengan tipe data, charset `utf8mb4`, constraint foreign key, dan indeks performa (`users`, `banners`, `categories`, `products`, `capabilities`, `posts`, `leads`, `settings`).
- **Modul:** Modul 1: Arsitektur Database & Migrasi
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-04
- **Tanggal:** 2026-09-29
- **Estimasi:** 3 jam
- **File yang diubah:**
  - `database/migrations/001_create_initial_schema.sql`

#### T-06: Database Seeder Data Awal & Default Settings
- **Judul:** Skrip seeding data awal akun admin, profil, dan kategori
- **Deskripsi:** Membuat skrip seeder `database/seeds/initial_seed.js` untuk membuat akun admin default dengan password ter-hash bcrypt, kategori awal produk plastik manufaktur, pengaturan identitas perusahaan di tabel `settings` (termasuk `whatsapp_number`, `company_email`, `company_phone`), serta contoh banner hero awal.
- **Modul:** Modul 1: Arsitektur Database & Migrasi
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-05
- **Tanggal:** 2026-09-29
- **Estimasi:** 2 jam
- **File yang diubah:**
  - `database/seeds/initial_seed.js`
  - `package.json`

---

## Modul 2: Admin Authentication & Security

#### T-07: UserModel & Autentikasi Admin
- **Judul:** Implementasi model user dan alur login/logout admin
- **Deskripsi:** Mengembangkan `models/userModel.js` untuk query kredensial dan `controllers/admin/authController.js` untuk verifikasi email, perbandingan hash password menggunakan `bcryptjs`, penerbitan sesi JWT berdurasi 24 jam ke dalam HTTP-Only Secure Cookie, dan pembersihan sesi saat logout.
- **Modul:** Modul 2: Autentikasi Admin & Keamanan
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-05, T-06
- **Tanggal:** 2026-09-29
- **Estimasi:** 3 jam
- **File yang diubah:**
  - `models/userModel.js`
  - `controllers/admin/authController.js`
  - `routes/adminRoutes.js`

#### T-08: Middleware Auth, Brute-Force Guard & CSRF Protection
- **Judul:** Middleware verifikasi sesi, penguncian akun, dan token CSRF
- **Deskripsi:** Membuat `middleware/authMiddleware.js` untuk validasi JWT cookie pada rute admin, `middleware/rateLimiter.js` yang membatasi 5 kali gagal berturut-turut lalu mengunci akun selama 15 menit, serta `middleware/csrfMiddleware.js` untuk melindungi formulir POST admin dan publik.
- **Modul:** Modul 2: Autentikasi Admin & Keamanan
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-07
- **Tanggal:** 2026-09-29
- **Estimasi:** 2.5 jam
- **File yang diubah:**
  - `middleware/authMiddleware.js`
  - `middleware/rateLimiter.js`
  - `middleware/csrfMiddleware.js`
  - `app.js`

#### T-09: Halaman Antarmuka Login & Ganti Kata Sandi Admin
- **Judul:** Template EJS halaman login dan ganti password admin
- **Deskripsi:** Membangun antarmuka `views/admin/login.ejs` dan `views/admin/change-password.ejs` dengan gaya Modern Corporate sesuai token `Design/DESIGN.md`, dilengkapi validasi form di sisi browser, tampilan flash alert notifikasi error, dan token anti-CSRF tersembunyi.
- **Modul:** Modul 2: Autentikasi Admin & Keamanan
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-03, T-07, T-08
- **Tanggal:** 2026-09-29
- **Estimasi:** 2 jam
- **File yang diubah:**
  - `views/admin/login.ejs`
  - `views/admin/change-password.ejs`
  - `public/css/admin.css`

---

## Modul 3: Content Management System (CMS Admin)

#### T-10: Dashboard Admin & Layout Shell CMS
- **Judul:** Pembuatan shell layout admin dan halaman ringkasan dashboard
- **Deskripsi:** Membuat layout `views/layouts/admin.ejs` (sidebar navigasi, topbar profil, status flash message) dan controller `dashboardController.js` untuk menampilkan ringkasan metrik (jumlah lead baru, jumlah produk aktif, jumlah banner tayang).
- **Modul:** Modul 3: Content Management System (CMS)
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-07, T-09
- **Tanggal:** 2026-09-29
- **Estimasi:** 2.5 jam
- **File yang diubah:**
  - `views/layouts/admin.ejs`
  - `views/admin/dashboard.ejs`
  - `controllers/admin/dashboardController.js`

#### T-11: Manajemen Banner Hero Media (Gambar & Video)
- **Judul:** CRUD banner hero, pemrosesan upload media, dan pengurutan
- **Deskripsi:** Mengimplementasikan `models/bannerModel.js`, `middleware/uploadMiddleware.js` (Multer + Sharp konversi WebP maks 5MB, MP4 maks 30MB), dan `controllers/admin/bannerController.js`. Fitur meliputi tambah media, atur urutan `sort_order`, toggle aktif/nonaktif, dan validasi minimal 1 banner aktif.
- **Modul:** Modul 3: Content Management System (CMS)
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-10
- **Tanggal:** 2026-09-29
- **Estimasi:** 3.5 jam
- **File yang diubah:**
  - `models/bannerModel.js`
  - `middleware/uploadMiddleware.js`
  - `controllers/admin/bannerController.js`
  - `views/admin/banners/index.ejs`

#### T-12: Manajemen Produk, Kategori & Spesifikasi Teknis
- **Judul:** CRUD produk manufaktur, kategori, dan spesifikasi material
- **Deskripsi:** Mengembangkan `models/productModel.js`, controller `productController.js`, dan antarmuka form tambah/edit produk. Menyediakan input dwibahasa (nama & deskripsi ID/EN), kategori, spesifikasi material, upload gambar utama & galeri WebP, serta toggle status aktif.
- **Modul:** Modul 3: Content Management System (CMS)
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-10, T-11
- **Tanggal:** 2026-09-29
- **Estimasi:** 4 jam
- **File yang diubah:**
  - `models/productModel.js`
  - `controllers/admin/productController.js`
  - `views/admin/products/index.ejs`
  - `views/admin/products/create.ejs`
  - `views/admin/products/edit.ejs`

#### T-13: Manajemen Kapabilitas Fasilitas & Artikel Berita
- **Judul:** CRUD kapabilitas mesin dan publikasi berita/artikel
- **Deskripsi:** Membuat model dan controller untuk mengelola data mesin manufaktur (`models/capabilityModel.js`) serta modul artikel publikasi (`models/postModel.js`, `controllers/admin/postController.js`) yang mendukung draf/publikasi dan upload gambar sampul.
- **Modul:** Modul 3: Content Management System (CMS)
- **Prioritas:** Mid
- **Status:** Done
- **Dependensi:** T-10
- **Tanggal:** 2026-09-29
- **Estimasi:** 3 jam
- **File yang diubah:**
  - `models/capabilityModel.js`
  - `models/postModel.js`
  - `controllers/admin/postController.js`
  - `views/admin/posts/index.ejs`

#### T-14: Pemantauan Lead B2B & Ekspor CSV
- **Judul:** Tabel manajemen lead masuk, update status, dan ekspor CSV
- **Deskripsi:** Mengembangkan `models/leadModel.js` dan `controllers/admin/leadController.js` untuk melihat data penawaran harga & kemitraan, filter tipe/status, update status lead (`baru`, `diproses`, `selesai`, `ditolak`), menambah `admin_notes`, serta fungsi unduh data ke format CSV untuk tim sales.
- **Modul:** Modul 3: Content Management System (CMS)
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-10
- **Tanggal:** 2026-09-29
- **Estimasi:** 3 jam
- **File yang diubah:**
  - `models/leadModel.js`
  - `controllers/admin/leadController.js`
  - `views/admin/leads/index.ejs`

#### T-15: Pengaturan Profil Situs & WhatsApp Floating Button
- **Judul:** Manajemen konfigurasi kontak, alamat, dan nomor WhatsApp
- **Deskripsi:** Mengembangkan `models/settingModel.js` dan `controllers/admin/settingController.js` untuk memperbarui kontak resmi perusahaan, alamat fisik, jam kerja, tautan sosial media, dan nomor WhatsApp beserta pesan awal otomatis tanpa deploy ulang.
- **Modul:** Modul 3: Content Management System (CMS)
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-10
- **Tanggal:** 2026-09-29
- **Estimasi:** 2 jam
- **File yang diubah:**
  - `models/settingModel.js`
  - `controllers/admin/settingController.js`
  - `views/admin/settings/index.ejs`

---

## Modul 4: Public SSR Views & Localization

#### T-16: Middleware Dwibahasa (ID/EN) & Kamus Teks Antarmuka
- **Judul:** Implementasi sistem i18n dwibahasa dan helper pemilihan bahasa
- **Deskripsi:** Membuat kamus bahasa `locales/id.json` dan `locales/en.json`, middleware `middleware/i18nMiddleware.js` (membaca cookie `lang`, default Indonesia, fallback teks bila versi EN kosong), dan rute handler `/lang/:lang` yang menyimpan pilihan bahasa pengunjung ke cookie 1 tahun.
- **Modul:** Modul 4: Halaman Publik SSR & Lokalisasi
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-02
- **Tanggal:** 2026-09-29
- **Estimasi:** 2 jam
- **File yang diubah:**
  - `locales/id.json`
  - `locales/en.json`
  - `middleware/i18nMiddleware.js`
  - `routes/publicRoutes.js`

#### T-17: Layout Publik & Komponen Parsial Responsif
- **Judul:** Shell layout publik, navbar dwibahasa, footer, dan WhatsApp float
- **Deskripsi:** Membangun `views/layouts/main.ejs` beserta partials (`navbar.ejs`, `footer.ejs`, `whatsapp-btn.ejs`). Navbar mendukung drawer menu mobile (<44px target sentuh), tombol ganti bahasa, tautan navigasi valid, dan tombol WhatsApp mengambang di kanan bawah yang membaca nomor dari tabel `settings`.
- **Modul:** Modul 4: Halaman Publik SSR & Lokalisasi
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-03, T-15, T-16
- **Tanggal:** 2026-09-29
- **Estimasi:** 3.5 jam
- **File yang diubah:**
  - `views/layouts/main.ejs`
  - `views/partials/header.ejs`
  - `views/partials/navbar.ejs`
  - `views/partials/footer.ejs`
  - `views/partials/whatsapp-btn.ejs`
  - `public/js/main.js`

#### T-18: Halaman Beranda (Hero Card Media & Industrial Highlights)
- **Judul:** Render beranda, hero banner dinamis (gambar/video), dan CTA penawaran
- **Deskripsi:** Mengembangkan `controllers/public/homeController.js` dan `views/public/index.ejs`. Hero section merender banner aktif (video dengan poster image WebP fallback atau gambar beresolusi tinggi), ringkasan lini produk unggulan, statistik fasilitas manufaktur, dan tombol CTA spesifik penawaran B2B.
- **Modul:** Modul 4: Halaman Publik SSR & Lokalisasi
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-11, T-12, T-17
- **Tanggal:** 2026-09-29
- **Estimasi:** 3 jam
- **File yang diubah:**
  - `controllers/public/homeController.js`
  - `views/public/index.ejs`

#### T-19: Katalog Produk & Halaman Detail Spesifikasi
- **Judul:** Tampilan katalog produk, filter kategori, dan detail spesifikasi material
- **Deskripsi:** Membuat `controllers/public/productController.js`, `views/public/products.ejs` (grid produk responsif, filter kategori, badge status ketersediaan), dan `views/public/product-detail.ejs` (tabel data teknis material, galeri foto, tombol pre-fill "Minta Penawaran").
- **Modul:** Modul 4: Halaman Publik SSR & Lokalisasi
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-12, T-17
- **Tanggal:** 2026-09-29
- **Estimasi:** 3.5 jam
- **File yang diubah:**
  - `controllers/public/productController.js`
  - `views/public/products.ejs`
  - `views/public/product-detail.ejs`

#### T-20: Halaman Kapabilitas Manufaktur, Profil (About) & Berita
- **Judul:** Tampilan kapabilitas mesin, profil kredibilitas pabrik, dan artikel berita
- **Deskripsi:** Membuat controller dan views untuk halaman kapabilitas fasilitas produksi (`views/public/capabilities.ejs`), profil perusahaan dan sertifikasi mutu (`views/public/about.ejs`), serta artikel publikasi (`views/public/news.ejs` dan `views/public/news-detail.ejs`).
- **Modul:** Modul 4: Halaman Publik SSR & Lokalisasi
- **Prioritas:** Mid
- **Status:** Done
- **Dependensi:** T-13, T-17
- **Tanggal:** 2026-09-29
- **Estimasi:** 3 jam
- **File yang diubah:**
  - `controllers/public/pageController.js`
  - `controllers/public/postController.js`
  - `views/public/capabilities.ejs`
  - `views/public/about.ejs`
  - `views/public/news.ejs`
  - `views/public/news-detail.ejs`

#### T-21: Halaman Kontak & Integrasi Form Penawaran dengan Notifikasi Email
- **Judul:** Formulir permintaan penawaran harga, kemitraan, dan notifikasi SMTP
- **Deskripsi:** Mengembangkan `views/public/contact.ejs` dan `controllers/public/contactController.js`. Form dilengkapi honeypot spam guard, validasi CSRF, verifikasi email, penyimpanan ke tabel `leads`, dan pengiriman notifikasi otomatis ke email tim sales menggunakan Nodemailer (`config/mailer.js`).
- **Modul:** Modul 4: Halaman Publik SSR & Lokalisasi
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-14, T-17
- **Tanggal:** 2026-09-29
- **Estimasi:** 3 jam
- **File yang diubah:**
  - `controllers/public/contactController.js`
  - `config/mailer.js`
  - `views/public/contact.ejs`

---

## Modul 5: Optimization, Testing & Deployment Preparation

#### T-22: Pipeline Kompresi Media & Optimasi Performa Laju Akses
- **Judul:** Optimasi asset caching, kompresi respons, dan Sharp WebP pipeline
- **Deskripsi:** Memastikan kompresi HTTP gzip via `compression`, header `Cache-Control` pada aset statis, validasi loading video hero dengan `preload="metadata"` dan poster image WebP, memastikan FCP < 1.2 detik dan waktu muat total di bawah 2 detik.
- **Modul:** Modul 5: Optimasi, Audit & Deployment
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-18, T-19
- **Tanggal:** 2026-09-29
- **Estimasi:** 2 jam
- **File yang diubah:**
  - `app.js`
  - `middleware/uploadMiddleware.js`

#### T-23: SEO Otomatis, Meta Tags, Robots.txt & Sitemap Generator
- **Judul:** Implementasi OpenGraph, meta description dwibahasa, robots.txt dan sitemap.xml
- **Deskripsi:** Menambahkan dynamic meta tag, OpenGraph, title tag tunggal H1 per halaman, rute dinamis `/robots.txt` dan `/sitemap.xml` yang mengindeks seluruh halaman statis serta entitas produk dan berita yang berstatus aktif.
- **Modul:** Modul 5: Optimasi, Audit & Deployment
- **Prioritas:** Mid
- **Status:** Done
- **Dependensi:** T-18, T-19, T-20
- **Tanggal:** 2026-09-29
- **Estimasi:** 2 jam
- **File yang diubah:**
  - `views/partials/header.ejs`
  - `routes/publicRoutes.js`
  - `controllers/public/seoController.js`

#### T-24: Audit Antislop & Pengujian Responsivitas Lintas Perangkat
- **Judul:** Pengujian visual contrast WCAG AA, navigasi keyboard, dan click-through test
- **Deskripsi:** Menjalankan verifikasi penuh terhadap 38 aturan antislop: memastikan tidak ada karakter em dash, tidak ada tombol atau tautan yang mati (R-26), kontras warna memenuhi standar WCAG AA (R-25), navigasi keyboard Tab/Escape berfungsi lancar (R-32), dan layout responsif tanpa horizontal overflow pada breakpoint desktop (12 kolom), tablet (8 kolom), dan mobile (4 kolom).
- **Modul:** Modul 5: Optimasi, Audit & Deployment
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-17 s/d T-21
- **Tanggal:** 2026-09-29
- **Estimasi:** 3 jam
- **File yang diubah:**
  - `public/css/layout.css`
  - `public/css/components.css`
  - `public/js/main.js`

#### T-25: Konfigurasi Deployment cPanel Jagoanhosting & Passenger
- **Judul:** Penyiapan file .htaccess, skrip startup Passenger, dan panduan environment cPanel
- **Deskripsi:** Menyiapkan file `.htaccess` yang mengarahkan request ke CloudLinux Node.js Selector via Phusion Passenger, memastikan `server.js` mengenali port dan socket server cPanel, serta menyiapkan checklist environment variable untuk deployment di Jagoanhosting.
- **Modul:** Modul 5: Optimasi, Audit & Deployment
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-02, T-22
- **Tanggal:** 2026-09-29
- **Estimasi:** 2 jam
- **File yang diubah:**
  - `.htaccess`
  - `server.js`
  - `README.md`
