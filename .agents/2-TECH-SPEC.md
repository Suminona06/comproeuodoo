# TECH SPEC: Website Company Profile PT Euodoo

- **Versi:** 1.0
- **Tech Stack:** Node.js (Express.js) + EJS (SSR) + Vanilla CSS + MySQL 8
- **Design Reference:** `Design/DESIGN.md` (Pacific Corporate & Energy)
- **Target Hosting:** Jagoanhosting Shared Hosting (cPanel / CloudLinux / Phusion Passenger)
- **Bahasa:** Indonesia dan Inggris (Dwibahasa)

---

## BAGIAN 1: Tech Stack & Arsitektur

### 1.1 Tech Stack Table

| Layer | Technology | Version | Keterangan |
|---|---|---|---|
| **Runtime** | Node.js | 20 LTS | Kompatibel dengan CloudLinux Node.js Selector di cPanel |
| **Backend Framework** | Express.js | 4.19+ | Arsitektur MVC modular, cepat, dan hemat sumber daya |
| **Template Engine** | EJS (Embedded JavaScript) | 3.1+ | Server-Side Rendering (SSR) untuk SEO maksimal dan performa tinggi |
| **Language** | JavaScript (ES Modules) | ES2022+ | `type: "module"` pada package.json |
| **Styling** | Vanilla CSS (CSS Variables) | Modern CSS | Mengacu pada `Design/DESIGN.md` (Pacific Corporate & Energy, 8px grid) |
| **Client Script** | Vanilla JavaScript | ES6+ | Interaktivitas ringan tanpa bundle build step berat (DOM, drawer, WhatsApp float) |
| **Database** | MySQL / MariaDB | 8.0+ / 10.x | Database relasional standar cPanel Jagoanhosting |
| **Database Driver** | `mysql2/promise` | 3.9+ | Connection pooling asinkron native (tanpa kompilasi native C++ yang rentan error di cPanel) |
| **File Upload & Media** | Multer & Sharp | 1.4+ / 0.33+ | Upload gambar/video dengan resize dan kompresi WebP otomatis |
| **Authentication** | JWT & bcryptjs | 9.0+ / 2.4+ | Sesi admin stateless via HTTP-Only Secure Cookie |
| **Security Middleware** | Helmet, Rate-Limit, CSURF / double-csrf | Terbaru | Proteksi header HTTP, proteksi brute-force, dan token anti-CSRF |
| **Mail Service** | Nodemailer | 6.9+ | Integrasi SMTP server cPanel untuk notifikasi lead masuk |
| **Hosting & Web Server** | Jagoanhosting (cPanel + CloudLinux) | Phusion Passenger | Reverse proxy Nginx/Apache cPanel meneruskan request ke Passenger Node.js |

### 1.2 Arsitektur Sistem

```
[ Pengunjung Publik & Browser Admin ]
                 │
                 ▼ (HTTPS / Port 443)
       [ Web Server cPanel ]
       (Nginx / Apache Reverse Proxy)
                 │
                 ▼ (Unix Socket / Passenger Port)
       [ Phusion Passenger (Node.js 20 LTS) ]
                 │
        [ Express.js Application ]
        ├── Security & i18n Middleware (ID/EN)
        ├── Route Dispatcher (Public vs Admin)
        ├── Controllers (MVC Business Logic)
        ├── EJS Template Renderer (SSR HTML)
        └── Upload Handler (Multer + Sharp)
                 │
        ┌────────┴──────────────────────────┐
        ▼                                   ▼
[ MySQL 8 Database ]              [ Local File System ]
(Tabel leads, products,           (public/uploads/:
 banners, posts, settings)         banners, products, posts)
        │
        ▼ (SMTP Port 465/587)
[ cPanel Mail Server ]
(Notifikasi Email Sales)
```

### 1.3 Struktur Folder Proyek

```
Euodoo/
├── config/
│   ├── database.js               # Inisialisasi pool koneksi mysql2/promise
│   ├── mailer.js                 # Konfigurasi SMTP Nodemailer untuk notifikasi lead
│   └── constants.js              # Konstanta status, batas upload, dan pagination
├── controllers/
│   ├── admin/
│   │   ├── authController.js     # Login, logout, ganti password admin
│   │   ├── bannerController.js   # CRUD hero banner (gambar & video)
│   │   ├── productController.js  # CRUD produk dan spesifikasi
│   │   ├── postController.js     # CRUD artikel publikasi / berita
│   │   ├── leadController.js     # Pemantauan status lead dan export CSV
│   │   └── settingController.js  # Pengaturan kontak, nomor WA, dan profil situs
│   └── public/
│       ├── homeController.js     # Render beranda publik (banner, highlight, produk)
│       ├── productController.js  # Halaman katalog produk dan detail spesifikasi
│       ├── pageController.js     # Halaman tentang kami, fasilitas, dan kapabilitas
│       ├── contactController.js  # Halaman kontak resmi perusahaan
│       └── leadController.js     # Handler submit form penawaran dan kemitraan
├── database/
│   ├── migrations/               # File SQL skrip pembuatan tabel (001_create_tables.sql)
│   ├── seeds/                    # Data inisial admin, pengaturan, dan contoh produk
│   └── migrate.js                # Skrip CLI untuk menjalankan migrasi ke MySQL
├── locales/
│   ├── id.json                   # Glosarium teks antarmuka Bahasa Indonesia
│   └── en.json                   # Glosarium teks antarmuka Bahasa Inggris
├── middleware/
│   ├── authMiddleware.js         # Verifikasi JWT cookie untuk rute admin
│   ├── csrfMiddleware.js         # Validasi token CSRF pada form POST
│   ├── errorHandler.js           # Penanganan error global 404 dan 500
│   ├── i18nMiddleware.js         # Deteksi preferensi bahasa (ID default, cookie 'lang')
│   ├── rateLimiter.js            # Proteksi brute-force login dan spam submission form
│   └── uploadMiddleware.js       # Validasi MIME type, limit ukuran, dan Sharp pipeline
├── models/
│   ├── bannerModel.js            # Query data banner hero
│   ├── leadModel.js              # Query pencatatan dan update status lead
│   ├── postModel.js              # Query artikel berita dan publikasi
│   ├── productModel.js           # Query produk, kategori, dan spesifikasi
│   ├── settingModel.js           # Query key-value pengaturan situs
│   └── userModel.js              # Query admin user dan kredensial bcrypt
├── public/
│   ├── css/
│   │   ├── tokens.css            # Variabel warna, tipografi, dan radius dari DESIGN.md
│   │   ├── base.css              # Reset CSS, utilitas font Plus Jakarta Sans
│   │   ├── components.css        # Komponen tombol, kartu, badge, form, tabel data
│   │   ├── layout.css            # Header, navigasi, grid 12/8/4 kolom, footer
│   │   └── admin.css             # Gaya visual dashboard pengelolaan konten
│   ├── js/
│   │   ├── main.js               # Mobile menu drawer, tab filter, dan scroll handler
│   │   ├── whatsapp.js           # Logika tombol WhatsApp mengambang
│   │   └── admin.js              # Konfirmasi hapus, preview upload, validasi form admin
│   ├── uploads/                  # Folder penyimpanan berkas media terkelola
│   │   ├── banners/              # Gambar WebP dan video banner MP4
│   │   ├── products/             # Foto produk manufaktur
│   │   └── posts/                # Gambar sampul artikel berita
│   └── favicon.ico
├── routes/
│   ├── adminRoutes.js            # Definisi rute area manajemen admin
│   └── publicRoutes.js           # Definisi rute pengunjung publik
├── utils/
│   ├── helpers.js                # Format tanggal, format nomor telepon, sanitasi slug
│   └── logger.js                 # Pencatatan aktivitas sistem dan error log
├── views/
│   ├── layouts/
│   │   ├── main.ejs              # Shell HTML utama halaman publik
│   │   └── admin.ejs             # Shell HTML dashboard admin
│   ├── partials/
│   │   ├── header.ejs            # Meta tags SEO, link font Plus Jakarta Sans, CSS
│   │   ├── navbar.ejs            # Navigasi utama dwibahasa (ID/EN)
│   │   ├── footer.ejs            # Informasi legal, peta situs, kontak perusahaan
│   │   ├── whatsapp-btn.ejs      # Tombol melayang WhatsApp dinamis
│   │   └── alert.ejs             # Komponen notifikasi flash pesan
│   ├── public/
│   │   ├── index.ejs             # Halaman Beranda (Hero Banner, Highlights, CTA)
│   │   ├── products.ejs          # Katalog daftar produk manufaktur
│   │   ├── product-detail.ejs    # Halaman spesifikasi teknis dan material produk
│   │   ├── capabilities.ejs      # Kapabilitas mesin pabrik dan proses manufaktur
│   │   ├── news.ejs              # Daftar publikasi dan berita industri
│   │   ├── news-detail.ejs       # Halaman baca artikel
│   │   ├── contact.ejs           # Formulir penawaran, kemitraan, peta dan alamat
│   │   └── 404.ejs               # Halaman kustom error not found
│   └── admin/
│       ├── login.ejs             # Halaman login admin
│       ├── dashboard.ejs         # Ringkasan lead terbaru dan metrik ringkas
│       ├── banners/              # Tampilan kelola banner hero
│       ├── products/             # Tampilan kelola produk dan form input
│       ├── posts/                # Tampilan kelola artikel berita
│       ├── leads/                # Tampilan tabel lead dan rincian pesan
│       └── settings/             # Tampilan form pengaturan profil situs
├── app.js                        # Konfigurasi Express app, middleware, rute
├── server.js                     # Entry point server (kompatibel dengan Passenger cPanel)
├── package.json
└── .env.example
```

### 1.4 Justifikasi Pilihan Teknis

- **Node.js (Express.js) & EJS:** Sangat ringan, cepat, dan kompatibel langsung dengan CloudLinux Node.js Selector (Phusion Passenger) di Jagoanhosting cPanel tanpa memerlukan container Docker yang berat. Server-Side Rendering (SSR) memastikan seluruh halaman ramah crawler SEO.
- **MySQL 8 (`mysql2/promise`):** Database relasional native cPanel dengan performa tinggi. Penggunaan `mysql2/promise` murni JavaScript menghindari kendala kompilasi binary C++ yang kerap bermasalah di shared hosting.
- **Vanilla CSS (Design System tokens):** Mengikuti panduan `Design/DESIGN.md` secara presisi tanpa ketergantungan build-tool runtime, menghasilkan ukuran aset yang sangat kecil dan loading di bawah 2 detik.
- **Multer & Sharp:** Memproses kompresi WebP otomatis di server agar beban bandwidth shared hosting tetap optimal.

---

## BAGIAN 2: Database Design

### 2.1 Ringkasan Database

| Item | Detail |
|---|---|
| **Database** | MySQL 8.0+ / MariaDB 10.x (Standar cPanel) |
| **Driver / Connection** | `mysql2/promise` dengan Connection Pool (`connectionLimit: 10`) |
| **Pendekatan** | Relational Database Design dengan foreign key constraint |
| **Tools Migrasi** | SQL Migration Runner mandiri (`database/migrate.js` mengeksekusi file `.sql` berurutan) |
| **Karakter Set & Collation** | `utf8mb4` / `utf8mb4_unicode_ci` (dukungan multibahasa dan simbol) |

### 2.2 Entity Overview

| Entity | Deskripsi & Field Utama | Relasi |
|---|---|---|
| **`users`** | Menyimpan kredensial admin sistem: `id`, `email`, `password_hash`, `full_name`, `role`, `failed_attempts`, `locked_until`, `created_at`, `updated_at`. | Mandiri (pengelola CMS) |
| **`banners`** | Media hero carousel (gambar/video): `id`, `title_id`, `title_en`, `media_type` ('image'/'video'), `file_url`, `poster_url`, `link_url`, `sort_order`, `is_active`, `created_at`, `updated_at`. | Mandiri |
| **`categories`** | Kategori lini produk manufaktur: `id`, `name_id`, `name_en`, `slug`, `sort_order`, `created_at`. | `1 : N` ke `products` |
| **`products`** | Katalog produk dan spesifikasi teknis: `id`, `category_id`, `name_id`, `name_en`, `slug`, `description_id`, `description_en`, `material_specs`, `technical_specs`, `main_image`, `gallery_images`, `is_active`, `created_at`, `updated_at`. | `N : 1` ke `categories`, `1 : N` ke `leads` |
| **`capabilities`** | Data kapabilitas mesin dan fasilitas pabrik: `id`, `title_id`, `title_en`, `machine_type`, `capacity`, `description_id`, `description_en`, `image_url`, `sort_order`, `is_active`, `created_at`, `updated_at`. | Mandiri |
| **`posts`** | Artikel publikasi dan berita industri: `id`, `title_id`, `title_en`, `slug`, `content_id`, `content_en`, `cover_image`, `status` ('draft'/'published'), `published_at`, `created_at`, `updated_at`. | Mandiri |
| **`leads`** | Formulir permintaan penawaran & kemitraan: `id`, `type` ('inquiry'/'partnership'), `name`, `company`, `email`, `phone`, `product_id` (nullable), `quantity`, `message`, `status` ('baru'/'diproses'/'selesai'/'ditolak'), `admin_notes`, `ip_address`, `created_at`, `updated_at`. | `N : 1` ke `products` (opsional) |
| **`settings`** | Pengaturan dinamis profil & kontak: `id`, `key` (unik), `value` (teks), `updated_at`. Menyimpan konfigurasi: `whatsapp_number`, `company_email`, `company_phone`, `company_address`, `whatsapp_default_message`, dan tautan sosial. | Mandiri (Key-Value) |

### 2.3 Index Strategy

Penerapan index difokuskan pada query publik dan pencarian admin:
- **`products`**:
  - `idx_products_slug` pada `(slug)`: pencarian cepat halaman detail.
  - `idx_products_status_category` pada `(is_active, category_id)`: filter katalog aktif per kategori.
- **`posts`**:
  - `idx_posts_slug` pada `(slug)`: query detail artikel.
  - `idx_posts_status_published` pada `(status, published_at)`: listing artikel publik terurut tanggal.
- **`banners`**:
  - `idx_banners_active_sort` pada `(is_active, sort_order)`: urutan render hero beranda.
- **`leads`**:
  - `idx_leads_status_type` pada `(status, type, created_at)`: filter dashboard admin dan monitoring penjualan.
- **`settings`**:
  - `idx_settings_key` pada `(key)`: pembacaan instan key-value profil kontak dan floating WhatsApp.

### 2.4 Data Flow

1. **Alur Hero Banner:** Pengunjung memuat beranda -> Sistem query tabel `banners` (`WHERE is_active = 1 ORDER BY sort_order ASC`) -> EJS merender elemen media hero card sesuai tipe (`image` atau `video` dengan poster fallback).
2. **Alur Katalog & Permintaan Penawaran:** Pengunjung melihat katalog `products` -> Memilih produk -> Halaman `product-detail` membaca spesifikasi -> Pengunjung klik "Minta Penawaran" -> Form penawaran otomatis terisi data produk -> Submit form -> Sistem memasukkan baris baru ke tabel `leads` dengan status `baru` -> Notifikasi SMTP Nodemailer terkirim ke tim sales.
3. **Alur Pengaturan WhatsApp Dinamis:** Admin memperbarui nomor WhatsApp di menu CMS -> Nilai `whatsapp_number` tersimpan di tabel `settings` -> Middleware otomatis menginjeksi nomor ke komponen partial `whatsapp-btn.ejs` di seluruh halaman publik tanpa deploy ulang.

---

## BAGIAN 3: Interface Design

Arsitektur aplikasi berbasis Monolith Server-Side Rendering (Express.js + EJS). Seluruh interaksi antarmuka ditangani melalui HTTP route, controller MVC, dan form action standar.

### 3.1 Public Interface Routes

| Method | Path / Action | Handler / Controller | Description | Auth |
|---|---|---|---|---|
| `GET` | `/` | `homeController.index` | Render Beranda: Hero banner, ringkasan profil, produk unggulan, tombol CTA penawaran | No |
| `GET` | `/products` | `productController.list` | Render Katalog Produk: filter kategori, grid produk, status ketersediaan | No |
| `GET` | `/products/:slug` | `productController.detail` | Render Detail Produk: spesifikasi teknis, material, galeri foto, tombol pre-fill form penawaran | No |
| `GET` | `/capabilities` | `pageController.capabilities` | Render Kapabilitas Manufaktur: daftar mesin, kapasitas produksi, foto fasilitas pabrik | No |
| `GET` | `/about` | `pageController.about` | Render Profil Perusahaan: visi, misi, nilai perusahaan, sertifikasi standar mutu | No |
| `GET` | `/news` | `postController.list` | Render Daftar Berita: artikel publikasi dan kabar industri | No |
| `GET` | `/news/:slug` | `postController.detail` | Render Artikel Lengkap: isi berita, tanggal terbit, cover image | No |
| `GET` | `/contact` | `contactController.index` | Render Halaman Kontak: info kantor, peta lokasi, formulir penawaran & kemitraan | No |
| `POST` | `/leads/inquiry` | `leadController.submitInquiry` | Submit form permintaan penawaran harga produk (validasi input + rate limit) | No |
| `POST` | `/leads/partnership` | `leadController.submitPartnership` | Submit form pengajuan mitra distributor / reseller | No |
| `GET` | `/lang/:lang` | `i18nController.switchLang` | Pengalihan bahasa (ID/EN), menetapkan cookie `lang`, redirect ke halaman sebelumnya | No |

### 3.2 Admin Interface Routes (CMS)

| Method | Path / Action | Handler / Controller | Description | Auth |
|---|---|---|---|---|
| `GET` | `/admin/login` | `authController.loginView` | Render halaman form login admin | No |
| `POST` | `/admin/login` | `authController.login` | Autentikasi kredensial admin, verifikasi bcrypt, generate JWT cookie | No |
| `POST` | `/admin/logout` | `authController.logout` | Hapus JWT cookie, invalidate sesi, redirect ke login | Yes (Admin) |
| `GET` | `/admin/change-password` | `authController.changePasswordView` | Render form ganti kata sandi admin | Yes (Admin) |
| `POST` | `/admin/change-password` | `authController.changePassword` | Update hash password baru ke tabel `users` | Yes (Admin) |
| `GET` | `/admin` | `dashboardController.index` | Render dashboard admin: statistik lead baru, status ringkas katalog & banner | Yes (Admin) |
| `GET` | `/admin/banners` | `bannerController.index` | Render daftar kelola banner hero | Yes (Admin) |
| `POST` | `/admin/banners` | `bannerController.store` | Upload banner baru (gambar/video), validasi MIME & ukuran file | Yes (Admin) |
| `POST` | `/admin/banners/:id/update` | `bannerController.update` | Perbarui judul, tautan, dan urutan banner | Yes (Admin) |
| `POST` | `/admin/banners/:id/status` | `bannerController.toggleStatus` | Toggle status aktif atau nonaktif banner | Yes (Admin) |
| `POST` | `/admin/banners/:id/delete` | `bannerController.destroy` | Hapus file banner dari storage dan hapus record dari database | Yes (Admin) |
| `GET` | `/admin/products` | `productController.index` | Render daftar produk dan filter kategori | Yes (Admin) |
| `GET` | `/admin/products/create` | `productController.createView` | Render form tambah produk dan upload foto | Yes (Admin) |
| `POST` | `/admin/products` | `productController.store` | Simpan produk baru, kompresi foto via Sharp ke format WebP | Yes (Admin) |
| `GET` | `/admin/products/:id/edit` | `productController.editView` | Render form edit produk dan spesifikasi teknis | Yes (Admin) |
| `POST` | `/admin/products/:id` | `productController.update` | Perbarui informasi produk dan galeri | Yes (Admin) |
| `POST` | `/admin/products/:id/delete` | `productController.destroy` | Hapus produk beserta file gambar terkait | Yes (Admin) |
| `GET` | `/admin/posts` | `postController.index` | Render daftar artikel dan draf publikasi | Yes (Admin) |
| `POST` | `/admin/posts` | `postController.store` | Simpan artikel baru (bisa simpan draf atau langsung publikasi) | Yes (Admin) |
| `POST` | `/admin/posts/:id/delete` | `postController.destroy` | Hapus artikel dan sampul foto | Yes (Admin) |
| `GET` | `/admin/leads` | `leadController.index` | Render tabel data lead masuk dengan filter tipe dan status | Yes (Admin) |
| `POST` | `/admin/leads/:id/status` | `leadController.updateStatus` | Perbarui status lead (baru, diproses, selesai, ditolak) dan tambah catatan | Yes (Admin) |
| `GET` | `/admin/leads/export` | `leadController.exportCsv` | Unduh file CSV data lead untuk arsip tim sales | Yes (Admin) |
| `GET` | `/admin/settings` | `settingController.index` | Render form pengaturan kontak, alamat, tautan sosmed, dan nomor WA | Yes (Admin) |
| `POST` | `/admin/settings` | `settingController.update` | Simpan konfigurasi key-value tabel `settings` | Yes (Admin) |

---

## BAGIAN 4: Alur Logika & Business Rules

### 4.1 Alur Logika Utama

#### Alur 1: Autentikasi dan Keamanan Sesi Admin (FR-01, FR-02, FR-03)
1. **User Request:** Admin membuka `/admin/login`, memasukkan email dan password.
2. **Rate Limit & Brute-Force Check:** Middleware memeriksa IP dan tabel `users` (`failed_attempts` dan `locked_until`). Jika gagal 5 kali berturut-turut, akun terkunci selama 15 menit.
3. **Verifikasi Kredensial:** Controller memanggil `userModel.findByEmail()`, memvalidasi hash dengan `bcrypt.compare()`.
4. **Penerbitan Sesi:** Jika valid, reset `failed_attempts`, buat JSON Web Token (JWT) berdurasi 24 jam, lalu simpan token ke dalam HTTP-Only, Secure, SameSite Cookie.
5. **Akses Dashboard:** Admin diarahkan ke `/admin`. Setiap request ke rute admin berikutnya diverifikasi oleh `authMiddleware`. Jika token tidak valid atau expired, cookie dihapus dan diarahkan ke login.

#### Alur 2: Pengalihan Bahasa Dwibahasa ID/EN (FR-05)
1. **Pilihan Bahasa:** Pengunjung mengklik tombol bahasa (ID atau EN) pada navbar, mengarah ke `/lang/:lang`.
2. **Penyimpanan Preferensi:** `i18nController` menetapkan cookie `lang` dengan nilai `id` atau `en` (durasi 1 tahun), lalu mengarahkan kembali pengunjung ke URL asal (`Referer`).
3. **Penyajian Konten:** `i18nMiddleware` membaca cookie `lang`. Jika cookie kosong, default ditetapkan ke `id`.
4. **Seleksi Field Database:** Saat query produk, banner, artikel, dan pengaturan, controller memilih kolom bahasa yang sesuai (misal: `name_id` vs `name_en`). Jika konten bahasa Inggris belum terisi, sistem otomatis melakukan fallback menampilkan versi bahasa Indonesia dengan label penjelas.

#### Alur 3: Pengajuan Formulir Penawaran & Kemitraan (FR-12, FR-13)
1. **Pengisian Form:** Calon klien mengisi formulir penawaran di `/contact` atau melalui tombol "Minta Penawaran" pada halaman detail produk (yang otomatis mengisi input hidden `product_id`).
2. **Validasi & Proteksi Spam:** `csrfMiddleware` memverifikasi token anti-CSRF, honeypot field divalidasi (harus kosong), dan format email diverifikasi.
3. **Penyimpanan Database:** Controller memanggil `leadModel.create()` dengan tipe `inquiry` atau `partnership` dan status awal `baru`.
4. **Notifikasi Otomatis:** Sistem memanggil `mailer.sendLeadNotification()` via SMTP cPanel untuk mengirim ringkasan detail permintaan ke email tim sales PT Euodoo.
5. **Respon Pengguna:** Halaman merender pesan konfirmasi sukses bahwa tim representatif PT Euodoo akan segera menghubungi klien.

#### Alur 4: Pengelolaan Hero Banner Media Gambar dan Video (FR-09, FR-10, FR-11)
1. **Upload Berkas:** Admin mengunggah file media melalui form `/admin/banners`.
2. **Validasi Multer:** Sistem memeriksa MIME type asli berkas (bukan hanya ekstensi): gambar (JPEG, PNG, WebP) maks 5MB, video (MP4, WebM) maks 30MB.
3. **Pemrosesan Media:**
   - Untuk gambar: Sharp melakukan resize proporsional dan konversi ke format WebP untuk efisiensi loading.
   - Untuk video: Memeriksa ketersediaan poster thumbnail sebagai fallback agar halaman tidak tersendat.
4. **Penyimpanan Metadata:** File disimpan pada direktori `public/uploads/banners/`, dan path berkas dicatat ke tabel `banners` bersama nilai `sort_order` dan status `is_active`.
5. **Render Beranda:** Halaman beranda hanya mengambil banner aktif yang diurutkan berdasarkan `sort_order ASC`.

#### Alur 5: Pengaturan Dinamis WhatsApp Floating Button (FR-18, FR-19)
1. **Pembaruan Nomor:** Admin membuka `/admin/settings`, mengisi nomor WhatsApp resmi perusahaan dengan kode negara (contoh: 6281234567890) serta template pesan pembuka.
2. **Validasi Format:** Controller memastikan nomor hanya mengandung karakter numerik yang valid dan diawali kode negara.
3. **Injeksi Parsial Global:** Nilai `whatsapp_number` dan pesan awal dimuat ke dalam `res.locals.settings` melalui middleware pengaturan.
4. **Render Komponen:** Template `whatsapp-btn.ejs` merender tombol mengambang di kanan bawah layar pada seluruh halaman publik. Jika nomor WhatsApp di database kosong, tombol otomatis disembunyikan.

### 4.2 Business Rules

1. **Integritas Banner Hero:** Minimal harus ada 1 banner yang berstatus aktif di dalam database agar tampilan hero card beranda tidak kosong.
2. **Slug Unik Otomatis:** Setiap penambahan produk atau artikel baru harus menghasilkan slug yang unik (sanitasi teks URL-friendly). Jika terjadi duplikasi nama, sistem otomatis menambahkan akhiran angka unik (contoh: `wadah-plastik-hdpe-1`).
3. **Pemisahan Visibilitas Publik:** Data produk berstatus nonaktif (`is_active = 0`) atau artikel dengan status draf (`status = 'draft'`) tidak boleh muncul di rute publik dalam kondisi apa pun.
4. **Audit Status Lead:** Setiap perubahan status lead (dari `baru` -> `diproses` -> `selesai` atau `ditolak`) mencatat waktu pembaruan dan catatan admin (`admin_notes`) untuk keperluan pelacakan tim penjualan.
5. **Sanitasi & Keamanan Input:** Semua input formulir wajib disanitasi dari tag HTML berbahaya guna mencegah serangan XSS, dan seluruh query database wajib menggunakan parameterized statements (prepared statements).

---

## BAGIAN 5: Keamanan, Performa, & Deployment

### 5.1 Keamanan (Security)

- **HTTP Headers Protection:** Middleware `helmet` diterapkan pada Express.js untuk menyematkan header keamanan HTTP (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`, `Content-Security-Policy` yang mengizinkan resource lokal dan Google Fonts).
- **Anti-Brute-Force & Rate Limiting:**
  - Login endpoint (`/admin/login`): dibatasi maksimal 5 kali percobaan per IP per 15 menit menggunakan `express-rate-limit`.
  - Formulir Lead (`/leads/*`): dibatasi maksimal 3 submit per IP per 10 menit guna mencegah bot spamming penawaran.
  - Honeypot form field tersembunyi untuk mendeteksi bot pengisi form otomatis.
- **CSRF Protection:** Seluruh form HTTP POST (admin dan publik) diverifikasi menggunakan token CSRF (`double-csrf` atau `csurf`).
- **SQL Injection Prevention:** 100% interaksi database menggunakan parameterized query dengan `mysql2/promise` (`db.execute('SELECT ... WHERE id = ?', [id])`).
- **XSS & Output Sanitization:** Semua input teks disanitasi sebelum disimpan dan EJS secara default melakukan HTML entity encoding (`<%= %>`) saat merender konten ke template.
- **File Upload Safeguards:**
  - Validasi ketat MIME type (`image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/webm`).
  - Pembersihan nama file (random UUID/timestamp) untuk mencegah directory traversal.
  - File executable seperti `.php`, `.js`, `.sh` diblokir secara mutlak.
- **Cookie Security:** Cookie JWT dan session dikonfigurasi dengan flag `httpOnly: true`, `secure: true` (pada HTTPS), dan `sameSite: 'strict'`.

### 5.2 Performa (Performance)

- **Optimasi Gambar Otomatis:** File gambar yang diunggah diproses menggunakan pustaka `sharp`, di-convert ke WebP dengan target kompresi 80% dan ukuran maksimal yang disesuaikan (Hero: 1920px lebar, Produk: 800px lebar).
- **Video Preload Optimization:** Video hero card menggunakan atribut `preload="metadata"` dan menyertakan `poster` image WebP agar tidak memblokir proses rendering awal (First Contentful Paint < 1.2 detik).
- **Caching Static Assets:** Middleware `express.static` menyematkan header `Cache-Control: public, max-age=604800` (7 hari) untuk berkas CSS, client JS, font Plus Jakarta Sans, dan gambar statis.
- **Database Connection Pooling:** Menggunakan pool koneksi berkapasitas 10 koneksi simultan yang dapat digunakan kembali, menghindari overhead pembukaan socket baru di setiap request.
- **Gzip / Deflate Compression:** Menggunakan middleware `compression` untuk memadatkan payload respons HTML dan CSS hingga 70%.

### 5.3 Deployment di Jagoanhosting (cPanel + CloudLinux)

Aplikasi dijalankan menggunakan modul **CloudLinux Node.js Selector** yang terintegrasi dengan web server Apache/Nginx via Phusion Passenger:

1. **Konfigurasi Application Root cPanel:**
   - **Node.js version:** 20.x LTS
   - **Application mode:** `Production`
   - **Application root:** `/home/username/public_html/euodoo` (atau subdomain folder)
   - **Application startup file:** `server.js`

2. **File `.htaccess` (Passenger Dispatcher):**
   ```apache
   PassengerAppRoot "/home/username/public_html/euodoo"
   PassengerBaseURI "/"
   PassengerNodejs "/home/username/nodevenv/public_html/euodoo/20/bin/node"
   PassengerAppType node
   PassengerStartupFile server.js

   # Paksa redirect HTTPS
   RewriteEngine On
   RewriteCond %{HTTPS} !=on
   RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

3. **Environment Variables (`.env`):**
   Disimpan di direktori aplikasi (di luar document root publik):
   ```env
   NODE_ENV=production
   PORT=3000
   APP_URL=https://euodoo.co.id
   SESSION_SECRET=super_secret_jwt_key_here
   
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=cpanel_dbuser
   DB_PASSWORD=cpanel_dbpassword
   DB_NAME=cpanel_dbname

   SMTP_HOST=mail.euodoo.co.id
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=no-reply@euodoo.co.id
   SMTP_PASS=smtp_password
   NOTIFICATION_EMAIL=sales@euodoo.co.id
   ```

4. **Direktori Berkas Upload & Hak Akses:**
   Pastikan folder `public/uploads/` memiliki izin tulis (permission `755`) bagi user web server.

### 5.4 Development & Local Setup

1. **Instalasi Dependensi:**
   ```bash
   npm install
   ```

2. **Konfigurasi Lingkungan:**
   ```bash
   cp .env.example .env
   # Edit konfigurasi database MySQL lokal pada .env
   ```

3. **Migrasi dan Seed Database:**
   ```bash
   npm run migrate
   npm run seed
   ```

4. **Menjalankan Server Lokal:**
   ```bash
   # Development dengan hot-reload
   npm run dev

   # Mode produksi lokal
   npm start
   ```

---

## 🔄 Finalisasi & Alur Lanjutan

Dokumen Tech Spec ini telah lengkap mencakup seluruh kebutuhan functional dan non-functional dari PRD Website PT Euodoo dengan target stack Node.js Express + EJS + MySQL di cPanel Jagoanhosting.

Langkah berikutnya:
Ketik: `"Buat Task berdasarkan Tech Spec yang sudah dibuat"` untuk memecah spesifikasi teknis ini menjadi daftar pekerjaan (task issues) yang siap dieksekusi.
