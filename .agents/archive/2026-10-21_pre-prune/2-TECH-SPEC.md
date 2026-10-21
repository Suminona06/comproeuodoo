# TECH SPEC: Website Company Profile PT Euodoo

- **Versi:** 2.0
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
| **Client Script** | Vanilla JavaScript | ES6+ | Interaktivitas ringan tanpa bundle build step berat (DOM, drawer, WhatsApp float, tab filter, search) |
| **Database** | MySQL / MariaDB | 8.0+ / 10.x | Database relasional standar cPanel Jagoanhosting |
| **Database Driver** | `mysql2/promise` | 3.9+ | Connection pooling asinkron native (tanpa kompilasi native C++ yang rentan error di cPanel) |
| **File Upload & Media** | Multer & Sharp | 1.4+ / 0.33+ | Upload gambar/video dengan resize dan kompresi WebP otomatis |
| **Storage Driver** | Local / S3 (opsional) | — | Default local filesystem, bisa diganti S3/CDN via konfigurasi `.env` |
| **Authentication** | JWT & bcryptjs | 9.0+ / 2.4+ | Sesi admin stateless via HTTP-Only Secure Cookie, expiry 1 jam |
| **Security Middleware** | Helmet, Rate-Limit, CSURF / double-csrf | Terbaru | Proteksi header HTTP, proteksi brute-force, dan token anti-CSRF |
| **Mail Service** | Nodemailer | 6.9+ | Integrasi SMTP server cPanel untuk notifikasi inquiry masuk |
| **SEO Tools** | Custom middleware | — | Sitemap.xml, robots.txt, hreflang, JSON-LD generator |
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
        ├── Role-Based Auth Middleware (superadmin/admin/editor)
        ├── Route Dispatcher (Public vs Admin)
        ├── Controllers (MVC Business Logic)
        ├── EJS Template Renderer (SSR HTML)
        ├── SEO Middleware (meta tags, JSON-LD, hreflang)
        └── Upload Handler (Multer + Sharp + Storage Driver)
                 │
        ┌────────┴──────────────────────────┐
        ▼                                   ▼
[ MySQL 8 Database ]              [ File Storage ]
(Tabel inquiries, products,       (Local: public/uploads/
 banners, posts, brands,           atau S3/CDN via config)
 media, pages, settings,
 users, post_categories,
 product_variants)
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
│   ├── mailer.js                 # Konfigurasi SMTP Nodemailer untuk notifikasi inquiry
│   ├── storage.js                # Abstraksi storage driver (local / S3), dipilih via .env
│   └── constants.js              # Konstanta status, batas upload, pagination, dan role
├── controllers/
│   ├── admin/
│   │   ├── authController.js     # Login, logout, ganti password admin
│   │   ├── dashboardController.js # Ringkasan metrik: inquiry, produk, artikel, status sistem
│   │   ├── bannerController.js   # CRUD hero banner/slider (gambar & video)
│   │   ├── pageController.js     # Kelola halaman statis (About Us, dll)
│   │   ├── productController.js  # CRUD produk, kategori, varian, spesifikasi, galeri
│   │   ├── postController.js     # CRUD artikel (berita, siaran pers, blog) + kategori
│   │   ├── brandController.js    # CRUD merek terdaftar perusahaan
│   │   ├── inquiryController.js  # List, detail, status inquiry, export CSV
│   │   ├── mediaController.js    # Upload, browse, delete media library
│   │   ├── settingController.js  # Pengaturan situs, kontak, WhatsApp, floating button
│   │   └── userController.js     # Manajemen user admin dan assignment role (superadmin)
│   └── public/
│       ├── homeController.js     # Render beranda (hero slider, intro, produk unggulan, brands, news, CTA)
│       ├── productController.js  # Katalog produk (filter, search) dan detail (galeri, varian, spek)
│       ├── pageController.js     # Halaman About Us (profil, visi misi, core values)
│       ├── postController.js     # Halaman News (3 tab: berita, pers, blog + headline slider)
│       ├── contactController.js  # Halaman Kontak (form + alamat + maps)
│       ├── inquiryController.js  # Handler submit form kontak dan penawaran via WA
│       └── seoController.js      # Generator sitemap.xml dan robots.txt
├── database/
│   ├── migrations/               # File SQL skrip pembuatan tabel (001_create_tables.sql, dst)
│   ├── seeds/                    # Data inisial: admin user, pengaturan, contoh produk, kategori
│   └── migrate.js                # Skrip CLI untuk menjalankan migrasi ke MySQL
├── locales/
│   ├── id.json                   # Glosarium teks antarmuka Bahasa Indonesia
│   └── en.json                   # Glosarium teks antarmuka Bahasa Inggris
├── middleware/
│   ├── authMiddleware.js         # Verifikasi JWT cookie untuk rute admin
│   ├── roleMiddleware.js         # Pemeriksaan role (superadmin, admin, editor) per rute
│   ├── csrfMiddleware.js         # Validasi token CSRF pada form POST
│   ├── errorHandler.js           # Penanganan error global 404 dan 500
│   ├── i18nMiddleware.js         # Deteksi preferensi bahasa (ID default, cookie 'lang')
│   ├── seoMiddleware.js          # Injeksi meta tags, OG, canonical, hreflang, JSON-LD ke res.locals
│   ├── settingsMiddleware.js     # Muat settings (WA number, alamat, dll) ke res.locals
│   ├── rateLimiter.js            # Proteksi brute-force login dan spam submission form
│   └── uploadMiddleware.js       # Validasi MIME type, limit ukuran, Sharp pipeline, storage routing
├── models/
│   ├── bannerModel.js            # Query data banner hero
│   ├── brandModel.js             # Query data merek terdaftar
│   ├── inquiryModel.js           # Query pencatatan dan update status inquiry
│   ├── mediaModel.js             # Query metadata file media library
│   ├── pageModel.js              # Query konten halaman statis (About Us)
│   ├── postModel.js              # Query artikel berita, siaran pers, dan blog
│   ├── postCategoryModel.js      # Query kategori artikel
│   ├── productModel.js           # Query produk, kategori, varian, dan spesifikasi
│   ├── productCategoryModel.js   # Query kategori produk
│   ├── productVariantModel.js    # Query varian produk
│   ├── settingModel.js           # Query key-value pengaturan situs
│   └── userModel.js              # Query admin user, kredensial bcrypt, dan role
├── public/
│   ├── css/
│   │   ├── tokens.css            # Variabel warna, tipografi, dan radius dari DESIGN.md
│   │   ├── base.css              # Reset CSS, utilitas font Plus Jakarta Sans
│   │   ├── components.css        # Komponen tombol, kartu, badge, form, tabel data, tabs
│   │   ├── layout.css            # Header, navigasi, grid 12/8/4 kolom, footer
│   │   └── admin.css             # Gaya visual dashboard pengelolaan konten
│   ├── js/
│   │   ├── main.js               # Mobile menu drawer, tab filter, search, scroll handler, lazy load
│   │   ├── whatsapp.js           # Logika tombol WhatsApp mengambang
│   │   └── admin.js              # Konfirmasi hapus, preview upload, validasi form admin, rich text
│   ├── uploads/                  # Folder penyimpanan berkas media terkelola (jika storage = local)
│   │   ├── banners/              # Gambar WebP dan video banner MP4
│   │   ├── products/             # Foto produk manufaktur
│   │   ├── posts/                # Gambar sampul artikel berita
│   │   ├── brands/               # Logo merek terdaftar
│   │   ├── pages/                # Gambar halaman statis
│   │   └── media/                # Media library umum
│   └── favicon.ico
├── routes/
│   ├── adminRoutes.js            # Definisi rute area manajemen admin (dengan role guard)
│   └── publicRoutes.js           # Definisi rute pengunjung publik
├── utils/
│   ├── helpers.js                # Format tanggal, format nomor telepon, sanitasi slug
│   ├── csvExporter.js            # Generator CSV untuk inquiry dan produk
│   ├── sitemapGenerator.js       # Generator sitemap.xml dari data published
│   └── logger.js                 # Pencatatan aktivitas sistem dan error log
├── views/
│   ├── layouts/
│   │   ├── main.ejs              # Shell HTML utama halaman publik (SEO head, navbar, footer, WA btn)
│   │   └── admin.ejs             # Shell HTML dashboard admin (sidebar, topbar)
│   ├── partials/
│   │   ├── head.ejs              # Meta tags SEO, OG, canonical, hreflang, JSON-LD, CSS
│   │   ├── navbar.ejs            # Navigasi utama: Homepage, About Us, Produk, News, Kontak, switch EN/ID
│   │   ├── footer.ejs            # Alamat kantor, alamat pabrik, Google Maps, menu, CTA kontak
│   │   ├── whatsapp-btn.ejs      # Tombol melayang WhatsApp dinamis (tema dari settings)
│   │   └── alert.ejs             # Komponen notifikasi flash pesan
│   ├── public/
│   │   ├── index.ejs             # Homepage: hero slider 90vh, intro, 4 produk, 3 keunggulan, brands, news, CTA
│   │   ├── about.ejs             # About Us: hero, profil, visi misi, core values, ajakan kerja sama
│   │   ├── products.ejs          # Katalog produk: hero, grid + filter kategori + search
│   │   ├── product-detail.ejs    # Detail produk: galeri, varian, spesifikasi, tombol WA penawaran
│   │   ├── news.ejs              # News: headline slider, 3 tab (berita, pers, blog), pagination
│   │   ├── news-detail.ejs       # Halaman baca artikel lengkap
│   │   ├── contact.ejs           # Kontak: form (kiri) + alamat + Google Maps (kanan)
│   │   └── 404.ejs               # Halaman kustom error not found
│   └── admin/
│       ├── login.ejs             # Halaman login admin
│       ├── dashboard.ejs         # Ringkasan metrik, shortcut, status sistem
│       ├── banners/              # Tampilan kelola banner hero
│       ├── pages/                # Tampilan kelola halaman statis
│       ├── products/             # Tampilan kelola produk, kategori, varian, galeri
│       ├── posts/                # Tampilan kelola artikel (berita, pers, blog), kategori
│       ├── brands/               # Tampilan kelola merek terdaftar
│       ├── inquiries/            # Tampilan tabel inquiry, detail, status, export
│       ├── media/                # Tampilan media library (browse, upload, delete)
│       ├── settings/             # Tampilan form pengaturan situs, kontak, WA, floating button
│       └── users/                # Tampilan manajemen user dan role (superadmin only)
├── app.js                        # Konfigurasi Express app, middleware, rute
├── server.js                     # Entry point server (kompatibel dengan Passenger cPanel)
├── package.json
└── .env.example
```

### 1.4 Justifikasi Pilihan Teknis

- **Node.js (Express.js) & EJS:** Sangat ringan, cepat, dan kompatibel langsung dengan CloudLinux Node.js Selector (Phusion Passenger) di Jagoanhosting cPanel tanpa memerlukan container Docker yang berat. Server-Side Rendering (SSR) memastikan seluruh halaman ramah crawler SEO dan memungkinkan injeksi meta tags, JSON-LD, dan hreflang secara server-side.
- **MySQL 8 (`mysql2/promise`):** Database relasional native cPanel dengan performa tinggi. Penggunaan `mysql2/promise` murni JavaScript menghindari kendala kompilasi binary C++ yang kerap bermasalah di shared hosting.
- **Vanilla CSS (Design System tokens):** Mengikuti panduan `Design/DESIGN.md` secara presisi tanpa ketergantungan build-tool runtime, menghasilkan ukuran aset yang sangat kecil dan loading di bawah 2 detik.
- **Multer & Sharp + Storage Abstraction:** Memproses kompresi WebP otomatis di server. Storage driver diabstraksikan sehingga bisa beralih dari local filesystem ke S3/CDN hanya dengan mengubah variabel `.env` tanpa modifikasi kode.

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
| **`users`** | Kredensial admin sistem: `id`, `email`, `password_hash`, `full_name`, `role` (`superadmin`/`admin`/`editor`), `failed_attempts`, `locked_until`, `created_at`, `updated_at`. | Mandiri (pengelola CMS) |
| **`banners`** | Media hero slider (gambar/video): `id`, `title_id`, `title_en`, `media_type` (`image`/`video`), `file_url`, `poster_url`, `link_url`, `caption_id`, `caption_en`, `cta_text_id`, `cta_text_en`, `cta_url`, `cta_secondary_text_id` (v1.1), `cta_secondary_text_en` (v1.1), `cta_secondary_url` (v1.1), `sort_order`, `is_active`, `created_at`, `updated_at`. | Mandiri |
| **`pages`** | Halaman statis terkelola (About Us): `id`, `slug`, `title_id`, `title_en`, `content_id`, `content_en`, `hero_image`, `meta_title_id`, `meta_title_en`, `meta_description_id`, `meta_description_en`, `og_image`, `canonical_url`, `robots` (`index`/`noindex`), `jsonld`, `created_at`, `updated_at`. | Mandiri |
| **`product_categories`** | Kategori lini produk manufaktur: `id`, `name_id`, `name_en`, `slug`, `sort_order`, `created_at`. | `1 : N` ke `products` |
| **`products`** | Katalog produk dan spesifikasi teknis: `id`, `category_id`, `name_id`, `name_en`, `slug`, `description_id`, `description_en`, `material_specs`, `technical_specs`, `main_image`, `gallery_images` (JSON array), `status` (`draft`/`published`/`archived`), `meta_title_id`, `meta_title_en`, `meta_description_id`, `meta_description_en`, `og_image`, `canonical_url`, `robots`, `jsonld`, `created_at`, `updated_at`. | `N : 1` ke `product_categories`, `1 : N` ke `product_variants`, `1 : N` ke `inquiries` |
| **`product_variants`** | Varian produk (ukuran, warna, material): `id`, `product_id`, `name_id`, `name_en`, `sku`, `specs` (JSON), `sort_order`, `created_at`. | `N : 1` ke `products` |
| **`post_categories`** | Kategori artikel (berita dan blog): `id`, `name_id`, `name_en`, `slug`, `type` (`berita`/`blog`), `sort_order`, `created_at`. | `1 : N` ke `posts` |
| **`posts`** | Artikel berita, siaran pers, dan blog: `id`, `category_id` (nullable, tidak untuk pers), `type` (`berita`/`pers`/`blog`), `title_id`, `title_en`, `slug`, `content_id`, `content_en`, `cover_image`, `is_headline` (boolean, untuk headline slider), `status` (`draft`/`scheduled`/`published`), `published_at`, `scheduled_at`, `meta_title_id`, `meta_title_en`, `meta_description_id`, `meta_description_en`, `og_image`, `canonical_url`, `robots`, `jsonld`, `created_at`, `updated_at`. | `N : 1` ke `post_categories` (opsional) |
| **`brands`** | Merek terdaftar milik perusahaan: `id`, `name`, `logo_url`, `description_id`, `description_en`, `sort_order`, `is_active`, `created_at`, `updated_at`. | Mandiri |
| **`inquiries`** | Formulir kontak dan permintaan penawaran: `id`, `name`, `company`, `email`, `phone`, `product_id` (nullable), `message`, `source` (`contact_form`/`wa_product`), `status` (`baru`/`dibaca`/`ditindaklanjuti`), `admin_notes`, `ip_address`, `created_at`, `updated_at`. | `N : 1` ke `products` (opsional) |
| **`media`** | Media library terpusat: `id`, `filename`, `original_name`, `file_url`, `mime_type`, `file_size`, `storage_driver` (`local`/`s3`), `alt_text`, `created_at`. | Mandiri |
| **`settings`** | Pengaturan dinamis situs: `id`, `key` (unik), `value` (teks), `updated_at`. Key meliputi: `company_name`, `office_address`, `factory_address`, `company_phone`, `company_email`, `whatsapp_number`, `whatsapp_message`, `whatsapp_button_theme`, `google_maps_embed`, `social_facebook`, `social_instagram`, `social_linkedin`. | Mandiri (Key-Value) |

### 2.3 Index Strategy

Penerapan index difokuskan pada query publik dan pencarian admin:
- **`products`**:
  - `idx_products_slug` pada `(slug)`: pencarian cepat halaman detail.
  - `idx_products_status_category` pada `(status, category_id)`: filter katalog published per kategori.
- **`product_variants`**:
  - `idx_variants_product` pada `(product_id)`: query varian per produk.
- **`posts`**:
  - `idx_posts_slug` pada `(slug)`: query detail artikel.
  - `idx_posts_type_status_published` pada `(type, status, published_at)`: listing per tab (berita/pers/blog) terurut tanggal.
  - `idx_posts_category` pada `(category_id)`: filter per kategori artikel.
  - `idx_posts_headline` pada `(is_headline, status)`: query headline slider.
- **`post_categories`**:
  - `idx_post_categories_type` pada `(type)`: filter kategori per tipe.
- **`banners`**:
  - `idx_banners_active_sort` pada `(is_active, sort_order)`: urutan render hero beranda.
- **`brands`**:
  - `idx_brands_active_sort` pada `(is_active, sort_order)`: urutan render showcase merek.
- **`inquiries`**:
  - `idx_inquiries_status` pada `(status, created_at)`: filter dashboard admin dan monitoring sales.
- **`settings`**:
  - `idx_settings_key` pada `(key)`: pembacaan instan key-value.
- **`media`**:
  - `idx_media_mime` pada `(mime_type)`: filter media library per tipe file.
- **`pages`**:
  - `idx_pages_slug` pada `(slug)`: pencarian cepat halaman statis.

### 2.4 Data Flow

1. **Alur Hero Slider Beranda:** Pengunjung memuat beranda -> Sistem query tabel `banners` (`WHERE is_active = 1 ORDER BY sort_order ASC`) -> EJS merender slider 90vh dengan gambar/video, caption di kiri, dan dual CTA terkonfigurasi per slide (tombol utama dan tombol kedua).
2. **Alur Katalog & Permintaan Penawaran via WhatsApp:** Pengunjung melihat katalog `products` (filter kategori + search) -> Memilih produk -> Halaman `product-detail` membaca spesifikasi, varian, dan galeri -> Pengunjung klik "Minta Penawaran" -> Browser membuka `wa.me/<nomor>` dengan pesan otomatis berisi nama produk + URL halaman -> Percakapan dimulai di WhatsApp.
3. **Alur Form Kontak & Inquiry:** Pengunjung mengisi form di `/contact` -> Validasi + CSRF + honeypot -> Simpan ke tabel `inquiries` dengan status `baru` -> Notifikasi SMTP ke email sales -> Konfirmasi di halaman.
4. **Alur News 3 Tab:** Pengunjung membuka `/news` -> Sistem query `posts` per `type` (berita/pers/blog) `WHERE status = 'published'` -> Tab Berita & Blog: filter `post_categories`, 9 per halaman + pagination -> Tab Pers: search query -> Headline slider: `WHERE is_headline = 1 AND status = 'published'` LIMIT 3.
5. **Alur Scheduled Publishing:** Cron job atau middleware check pada setiap request: query `posts` `WHERE status = 'scheduled' AND scheduled_at <= NOW()` -> Update status ke `published`.
6. **Alur Pengaturan WhatsApp Dinamis:** Admin memperbarui nomor WhatsApp dan tema floating button di `/admin/settings` -> Tersimpan di tabel `settings` -> `settingsMiddleware` menginjeksi ke `res.locals` -> Template `whatsapp-btn.ejs` merender tombol mengambang dengan tema dan nomor yang dikonfigurasi.
7. **Alur Storage Media:** Admin upload file -> `uploadMiddleware` validasi MIME & size -> Sharp konversi WebP (untuk gambar) -> `storage.js` routing ke driver (`local` atau `s3`) berdasarkan `STORAGE_DRIVER` di `.env` -> Metadata dicatat ke tabel `media` -> File tersedia untuk dipakai di produk, artikel, banner, dll.
8. **Alur Sitemap & Robots:** Saat ada perubahan konten published -> `sitemapGenerator.js` regenerate `sitemap.xml` dari semua halaman publik, produk published, dan artikel published -> `robots.txt` menunjuk ke sitemap -> Halaman dengan `robots = 'noindex'` dieksklusi dari sitemap.

---

## BAGIAN 3: Interface Design

Arsitektur aplikasi berbasis Monolith Server-Side Rendering (Express.js + EJS). Seluruh interaksi antarmuka ditangani melalui HTTP route, controller MVC, dan form action standar.

### 3.1 Public Interface Routes

| Method | Path / Action | Handler / Controller | Description | Auth |
|---|---|---|---|---|
| `GET` | `/` | `homeController.index` | Render Homepage: hero slider 90vh, company intro, 4 produk unggulan, 3 keunggulan, brands, news terbaru, CTA kontak | No |
| `GET` | `/about` | `pageController.about` | Render About Us: hero, profil perusahaan, visi misi, core values, ajakan kerja sama | No |
| `GET` | `/products` | `productController.list` | Render Katalog Produk: hero, grid produk + filter kategori + search | No |
| `GET` | `/products/:slug` | `productController.detail` | Render Detail Produk: galeri foto, varian, spesifikasi teknis, tombol WA penawaran (tanpa harga) | No |
| `GET` | `/news` | `postController.list` | Render News: headline slider + 3 tab (berita, pers, blog) + filter kategori + search pers + pagination | No |
| `GET` | `/news/:slug` | `postController.detail` | Render Artikel Lengkap: isi, tanggal terbit, cover image, meta SEO | No |
| `GET` | `/contact` | `contactController.index` | Render Kontak: form (kiri) + alamat kantor & pabrik + Google Maps (kanan) | No |
| `POST` | `/contact/submit` | `inquiryController.submit` | Submit form kontak (validasi input + CSRF + honeypot + rate limit + email notif) | No |
| `GET` | `/lang/:lang` | `i18nController.switchLang` | Pengalihan bahasa (ID/EN), menetapkan cookie `lang`, redirect ke halaman sebelumnya | No |
| `GET` | `/sitemap.xml` | `seoController.sitemap` | Generate sitemap.xml dinamis dari konten published | No |
| `GET` | `/robots.txt` | `seoController.robots` | Serve robots.txt dengan pointer ke sitemap | No |

### 3.2 Admin Interface Routes (CMS)

#### Autentikasi

| Method | Path / Action | Handler / Controller | Description | Auth |
|---|---|---|---|---|
| `GET` | `/admin/login` | `authController.loginView` | Render halaman form login admin | No |
| `POST` | `/admin/login` | `authController.login` | Autentikasi kredensial admin, verifikasi bcrypt, generate JWT cookie (1 jam) | No |
| `POST` | `/admin/logout` | `authController.logout` | Hapus JWT cookie, invalidate sesi, redirect ke login | Yes |
| `GET` | `/admin/change-password` | `authController.changePasswordView` | Render form ganti kata sandi admin | Yes |
| `POST` | `/admin/change-password` | `authController.changePassword` | Update hash password baru ke tabel `users` | Yes |

#### Dashboard

| Method | Path / Action | Handler / Controller | Description | Auth |
|---|---|---|---|---|
| `GET` | `/admin` | `dashboardController.index` | Render dashboard: jumlah artikel/berita/pers published, jumlah inquiry, jumlah produk, shortcut menu, status sistem | Yes |

#### Banner / Slider

| Method | Path / Action | Handler / Controller | Description | Auth (Role) |
|---|---|---|---|---|
| `GET` | `/admin/banners` | `bannerController.index` | Render daftar kelola banner hero | Admin+ |
| `GET` | `/admin/banners/create` | `bannerController.createView` | Render form tambah banner | Admin+ |
| `POST` | `/admin/banners` | `bannerController.store` | Upload banner baru (gambar/video), validasi MIME & ukuran file | Admin+ |
| `GET` | `/admin/banners/:id/edit` | `bannerController.editView` | Render form edit banner | Admin+ |
| `POST` | `/admin/banners/:id/update` | `bannerController.update` | Perbarui judul, caption, CTA, tautan, dan urutan banner | Admin+ |
| `POST` | `/admin/banners/:id/status` | `bannerController.toggleStatus` | Toggle status aktif atau nonaktif banner | Admin+ |
| `POST` | `/admin/banners/:id/delete` | `bannerController.destroy` | Hapus file banner dari storage dan hapus record dari database | Admin+ |

#### Halaman Statis

| Method | Path / Action | Handler / Controller | Description | Auth (Role) |
|---|---|---|---|---|
| `GET` | `/admin/pages` | `pageController.index` | Render daftar halaman statis terkelola | Admin+ |
| `GET` | `/admin/pages/:id/edit` | `pageController.editView` | Render form edit halaman statis (konten + SEO fields) | Admin+ |
| `POST` | `/admin/pages/:id` | `pageController.update` | Perbarui konten dan meta SEO halaman statis | Admin+ |

#### Produk

| Method | Path / Action | Handler / Controller | Description | Auth (Role) |
|---|---|---|---|---|
| `GET` | `/admin/products` | `productController.index` | Render daftar produk, filter kategori dan status | Admin+ |
| `GET` | `/admin/products/create` | `productController.createView` | Render form tambah produk (info, spek, varian, galeri, SEO) | Admin+ |
| `POST` | `/admin/products` | `productController.store` | Simpan produk baru, kompresi foto via Sharp ke WebP | Admin+ |
| `GET` | `/admin/products/:id/edit` | `productController.editView` | Render form edit produk lengkap | Admin+ |
| `POST` | `/admin/products/:id` | `productController.update` | Perbarui informasi produk, varian, galeri, dan SEO | Admin+ |
| `POST` | `/admin/products/:id/status` | `productController.updateStatus` | Ubah status produk (draft/published/archived) | Admin+ |
| `POST` | `/admin/products/:id/delete` | `productController.destroy` | Hapus produk beserta file gambar terkait | Admin+ |
| `GET` | `/admin/products/export` | `productController.exportCsv` | Unduh file CSV data produk | Admin+ |
| `GET` | `/admin/product-categories` | `productCategoryController.index` | Render daftar kategori produk | Admin+ |
| `POST` | `/admin/product-categories` | `productCategoryController.store` | Tambah kategori produk baru | Admin+ |
| `POST` | `/admin/product-categories/:id/update` | `productCategoryController.update` | Perbarui kategori produk | Admin+ |
| `POST` | `/admin/product-categories/:id/delete` | `productCategoryController.destroy` | Hapus kategori produk | Admin+ |

#### News (Berita, Siaran Pers, Blog)

| Method | Path / Action | Handler / Controller | Description | Auth (Role) |
|---|---|---|---|---|
| `GET` | `/admin/posts` | `postController.index` | Render daftar artikel, filter tipe (berita/pers/blog) dan status | Editor+ |
| `GET` | `/admin/posts/create` | `postController.createView` | Render form tambah artikel (konten, tipe, kategori, status, SEO) | Editor+ |
| `POST` | `/admin/posts` | `postController.store` | Simpan artikel (draft / scheduled / published) | Editor+ |
| `GET` | `/admin/posts/:id/edit` | `postController.editView` | Render form edit artikel | Editor+ |
| `POST` | `/admin/posts/:id` | `postController.update` | Perbarui artikel | Editor+ |
| `POST` | `/admin/posts/:id/delete` | `postController.destroy` | Hapus artikel dan sampul foto | Editor+ |
| `GET` | `/admin/post-categories` | `postCategoryController.index` | Render daftar kategori artikel (per tipe berita/blog) | Editor+ |
| `POST` | `/admin/post-categories` | `postCategoryController.store` | Tambah kategori artikel | Editor+ |
| `POST` | `/admin/post-categories/:id/update` | `postCategoryController.update` | Perbarui kategori artikel | Editor+ |
| `POST` | `/admin/post-categories/:id/delete` | `postCategoryController.destroy` | Hapus kategori artikel | Editor+ |

#### Brands

| Method | Path / Action | Handler / Controller | Description | Auth (Role) |
|---|---|---|---|---|
| `GET` | `/admin/brands` | `brandController.index` | Render daftar merek terdaftar | Admin+ |
| `GET` | `/admin/brands/create` | `brandController.createView` | Render form tambah merek | Admin+ |
| `POST` | `/admin/brands` | `brandController.store` | Simpan merek baru, kompresi logo ke WebP | Admin+ |
| `GET` | `/admin/brands/:id/edit` | `brandController.editView` | Render form edit merek | Admin+ |
| `POST` | `/admin/brands/:id` | `brandController.update` | Perbarui informasi merek | Admin+ |
| `POST` | `/admin/brands/:id/delete` | `brandController.destroy` | Hapus merek dan file logo | Admin+ |

#### Inquiry

| Method | Path / Action | Handler / Controller | Description | Auth (Role) |
|---|---|---|---|---|
| `GET` | `/admin/inquiries` | `inquiryController.index` | Render tabel inquiry, filter status (baru/dibaca/ditindaklanjuti) | Admin+ |
| `GET` | `/admin/inquiries/:id` | `inquiryController.detail` | Render detail inquiry dan riwayat status | Admin+ |
| `POST` | `/admin/inquiries/:id/status` | `inquiryController.updateStatus` | Perbarui status inquiry (baru → dibaca → ditindaklanjuti) + catatan | Admin+ |
| `GET` | `/admin/inquiries/export` | `inquiryController.exportCsv` | Unduh file CSV data inquiry | Admin+ |

#### Media Library

| Method | Path / Action | Handler / Controller | Description | Auth (Role) |
|---|---|---|---|---|
| `GET` | `/admin/media` | `mediaController.index` | Render media library (browse, filter tipe) | Editor+ |
| `POST` | `/admin/media` | `mediaController.upload` | Upload file ke storage, konversi WebP, simpan metadata | Editor+ |
| `POST` | `/admin/media/:id/delete` | `mediaController.destroy` | Hapus file dari storage dan metadata dari database | Admin+ |

#### Pengaturan Situs

| Method | Path / Action | Handler / Controller | Description | Auth (Role) |
|---|---|---|---|---|
| `GET` | `/admin/settings` | `settingController.index` | Render form pengaturan: kontak, alamat, WA, floating button theme, sosmed | Superadmin |
| `POST` | `/admin/settings` | `settingController.update` | Simpan konfigurasi key-value tabel `settings` | Superadmin |

#### Users

| Method | Path / Action | Handler / Controller | Description | Auth (Role) |
|---|---|---|---|---|
| `GET` | `/admin/users` | `userController.index` | Render daftar user admin | Superadmin |
| `GET` | `/admin/users/create` | `userController.createView` | Render form tambah user | Superadmin |
| `POST` | `/admin/users` | `userController.store` | Simpan user baru, hash password bcrypt, assign role | Superadmin |
| `GET` | `/admin/users/:id/edit` | `userController.editView` | Render form edit user dan role | Superadmin |
| `POST` | `/admin/users/:id` | `userController.update` | Perbarui informasi user dan role | Superadmin |
| `POST` | `/admin/users/:id/delete` | `userController.destroy` | Hapus user (tidak boleh hapus superadmin terakhir) | Superadmin |

### 3.3 Role Access Matrix

| Menu / Modul | Superadmin | Admin | Editor |
|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ |
| Banner / Slider | ✅ | ✅ | ❌ |
| Halaman | ✅ | ✅ | ❌ |
| Produk | ✅ | ✅ | ❌ |
| News (Berita, Pers, Blog) | ✅ | ✅ | ✅ |
| Brands | ✅ | ✅ | ❌ |
| Inquiry | ✅ | ✅ | ❌ |
| Media Library | ✅ | ✅ | ✅ (upload & browse) |
| Pengaturan Situs | ✅ | ❌ | ❌ |
| Users | ✅ | ❌ | ❌ |
| Export CSV (Inquiry) | ✅ | ✅ | ❌ |
| Export CSV (Produk) | ✅ | ✅ | ❌ |

---

## BAGIAN 4: Alur Logika & Business Rules

### 4.1 Alur Logika Utama

#### Alur 1: Autentikasi dan Keamanan Sesi Admin (FR-01, FR-02, FR-03, FR-04)
1. **User Request:** Admin membuka `/admin/login`, memasukkan email dan password.
2. **Rate Limit & Brute-Force Check:** Middleware memeriksa IP dan tabel `users` (`failed_attempts` dan `locked_until`). Jika gagal 5 kali berturut-turut, akun terkunci selama 15 menit.
3. **Verifikasi Kredensial:** Controller memanggil `userModel.findByEmail()`, memvalidasi hash dengan `bcrypt.compare()`.
4. **Penerbitan Sesi:** Jika valid, reset `failed_attempts`, buat JSON Web Token (JWT) berdurasi 1 jam berisi `{ id, email, role }`, simpan token ke HTTP-Only, Secure, SameSite Cookie.
5. **Akses Dashboard:** Admin diarahkan ke `/admin`. Setiap request ke rute admin diverifikasi oleh `authMiddleware` (token valid?) lalu `roleMiddleware` (role cukup?). Jika token tidak valid atau expired, cookie dihapus dan diarahkan ke login.

#### Alur 2: Pengalihan Bahasa Dwibahasa ID/EN (FR-06)
1. **Pilihan Bahasa:** Pengunjung mengklik switch bahasa (ID atau EN) pada navbar, mengarah ke `/lang/:lang`.
2. **Penyimpanan Preferensi:** `i18nController` menetapkan cookie `lang` dengan nilai `id` atau `en` (durasi 1 tahun), lalu mengarahkan kembali pengunjung ke URL asal (`Referer`).
3. **Penyajian Konten:** `i18nMiddleware` membaca cookie `lang`. Jika cookie kosong, default ditetapkan ke `id`.
4. **Seleksi Field Database:** Controller memilih kolom bahasa yang sesuai (misal: `name_id` vs `name_en`). Jika konten bahasa Inggris belum terisi, sistem otomatis melakukan fallback menampilkan versi bahasa Indonesia.
5. **Hreflang Tags:** `seoMiddleware` menginjeksi tag `<link rel="alternate" hreflang="id">` dan `<link rel="alternate" hreflang="en">` ke head halaman.

#### Alur 3: Homepage Rendering (FR-05, FR-10, FR-17)
1. **Hero Slider:** Query `banners` aktif, render slider 90vh dengan gambar/video, caption di kiri, serta tombol dual CTA (tombol utama dan tombol kedua yang dapat dikonfigurasi dinamis).
2. **Company Intro:** Render section pengenalan singkat perusahaan.
3. **Produk Unggulan (4 Kategori Primer):** [DIPERBARUI per 2026-10-19] Query 4 kategori primer beranda beserta penghitungan otomatis jumlah produk terbit (`status = 'published'`), render 4 panel vertikal selebar kontainer tanpa jarak (0 gap) berprefix `.hcat-*`, klik panel membuka deep link `/products?category=:slug`. Menggantikan query 4 produk bento grid 2x2 lama.
4. **Why Choose Us / Kenapa Memilih Kami:** [DIPERBARUI per 2026-10-19] Query konfigurasi teks Why Choose Us dari model `homeContentModel.js`, render layout editorial asimetris 2-kolom berprefix `.wcu-*` dengan kartu artbox SVG ramah lingkungan statis dan seluruh konten tampil terbuka tanpa accordion. Menggantikan 3 kartu pilar keunggulan lama.
5. **Our Brands (Revisi v4 [DEPRECATED] -> Marquee Kontinu v1 per 2026-10-20):** Query `brands` aktif (`is_active = 1`), render marquee strip kontinu berprefix `.brand-strip-*` dengan logo berseragam, ujung memudar (gradient mask), pause saat hover/fokus, tanpa kartu kotak, tanpa nama merek di bawah logo (hanya via alt/aria-label), dengan fitur interaktif modal zoom preview logo dan zoom hint icon dipertahankan aktif.
6. **News Terbaru:** Query 3 `posts` published terbaru.
7. **CTA Kontak:** Render ajakan menghubungi perusahaan.

#### Alur 4: Katalog Produk & Penawaran via WhatsApp (FR-07, FR-08)
1. **Halaman Katalog:** Pengunjung membuka `/products` -> Query `products` `WHERE status = 'published'` + filter `category_id` + search `LIKE '%keyword%'` -> Render grid produk.
2. **Halaman Detail:** Pengunjung memilih produk -> Query produk + `product_variants` + galeri -> Render halaman detail (galeri, varian, spesifikasi teknis) tanpa harga.
3. **Minta Penawaran:** Pengunjung klik "Minta Penawaran" -> Browser membuka `wa.me/<whatsapp_number>?text=<pesan>` dengan pesan otomatis: `Halo, saya tertarik dengan [nama_produk]. Detail: [URL halaman]`.

#### Alur 5: News 3 Tab (FR-12)
1. **Headline Slider:** Query `posts` `WHERE is_headline = 1 AND status = 'published'` LIMIT 3 -> Render slider berita utama.
2. **Tab Berita:** Query `posts` `WHERE type = 'berita' AND status = 'published'` + filter `category_id` -> 9 per halaman + pagination.
3. **Tab Siaran Pers:** Query `posts` `WHERE type = 'pers' AND status = 'published'` + search query `LIKE '%keyword%'`.
4. **Tab Blog:** Query `posts` `WHERE type = 'blog' AND status = 'published'` + filter `category_id` -> 9 per halaman + pagination.

#### Alur 6: Form Kontak & Inquiry (FR-14)
1. **Pengisian Form:** Pengunjung mengisi form di `/contact`.
2. **Validasi & Proteksi Spam:** `csrfMiddleware` memverifikasi token anti-CSRF, honeypot field divalidasi (harus kosong), format email diverifikasi.
3. **Penyimpanan Database:** Controller memanggil `inquiryModel.create()` dengan status awal `baru`.
4. **Notifikasi Otomatis:** Sistem memanggil `mailer.sendInquiryNotification()` via SMTP cPanel untuk mengirim ringkasan ke email tim sales.
5. **Respon Pengguna:** Halaman merender pesan konfirmasi.

#### Alur 7: Scheduled Publishing (FR-13)
1. **Admin membuat artikel:** Memilih status `scheduled` dan mengisi `scheduled_at` (tanggal & waktu publikasi).
2. **Pengecekan Otomatis:** Pada setiap request publik ke `/news`, middleware atau controller memeriksa: `WHERE status = 'scheduled' AND scheduled_at <= NOW()`.
3. **Auto-Publish:** Artikel yang memenuhi kondisi diubah statusnya menjadi `published`.

#### Alur 8: Pengaturan Dinamis WhatsApp Floating Button (FR-15, FR-22)
1. **Pembaruan Nomor:** Admin membuka `/admin/settings`, mengisi nomor WhatsApp resmi dengan kode negara (contoh: 6281234567890), pesan awal, dan tema tombol.
2. **Validasi Format:** Controller memastikan nomor hanya mengandung karakter numerik yang valid dan diawali kode negara.
3. **Injeksi Parsial Global:** `settingsMiddleware` memuat `whatsapp_number`, `whatsapp_message`, dan `whatsapp_button_theme` ke `res.locals.settings` di setiap request.
4. **Render Komponen:** Template `whatsapp-btn.ejs` merender tombol mengambang di kanan bawah layar pada seluruh halaman publik. Tema visual mengikuti konfigurasi admin. Jika nomor kosong, tombol disembunyikan.

#### Alur 9: Media Library & Storage Driver (FR-19)
1. **Upload:** Admin atau editor upload file via `/admin/media`.
2. **Validasi:** `uploadMiddleware` memeriksa MIME type dan ukuran file.
3. **Pemrosesan Gambar:** Sharp konversi ke WebP, resize proporsional.
4. **Storage Routing:** `storage.js` membaca `STORAGE_DRIVER` dari `.env`:
   - `local`: simpan ke `public/uploads/media/`, URL relatif.
   - `s3`: upload ke S3 bucket via `@aws-sdk/client-s3`, URL absolute CDN.
5. **YouTube Embed:** Untuk YouTube, admin cukup memasukkan URL -> sistem extract video ID dan simpan sebagai embed reference di tabel `media`.
6. **Metadata:** Filename, MIME type, size, driver, dan URL dicatat ke tabel `media`.

### 4.2 Business Rules

1. **Integritas Banner Hero:** Minimal harus ada 1 banner yang berstatus aktif di dalam database agar hero slider beranda tidak kosong.
2. **Slug Unik Otomatis:** Setiap penambahan produk, artikel, atau halaman baru harus menghasilkan slug yang unik (sanitasi teks URL-friendly). Jika terjadi duplikasi nama, sistem otomatis menambahkan akhiran angka unik (contoh: `kantong-plastik-hdpe-1`).
3. **Pemisahan Visibilitas Publik:** Data produk berstatus `draft` atau `archived`, artikel berstatus `draft` atau `scheduled` (belum waktunya), dan brand nonaktif tidak boleh muncul di rute publik dalam kondisi apa pun.
4. **Harga Tidak Ditampilkan:** Tidak ada field harga di database dan tidak ada tampilan harga di halaman publik. Semua permintaan harga melalui WhatsApp atau form kontak.
5. **Audit Status Inquiry:** Setiap perubahan status inquiry (dari `baru` → `dibaca` → `ditindaklanjuti`) mencatat waktu pembaruan dan catatan admin (`admin_notes`).
6. **Role Enforcement:** `roleMiddleware` menegakkan akses berdasarkan role di setiap rute admin. Editor hanya bisa mengelola artikel dan media. Admin tidak bisa mengubah settings dan mengelola users. Superadmin memiliki akses penuh.
7. **Proteksi Superadmin Terakhir:** Sistem mencegah penghapusan user superadmin terakhir agar akses penuh ke CMS tidak hilang.
8. **Sanitasi & Keamanan Input:** Semua input formulir wajib disanitasi dari tag HTML berbahaya guna mencegah XSS, dan seluruh query database wajib menggunakan parameterized statements.
9. **SEO Auto-Generate:** Jika admin tidak mengisi meta title atau meta description, sistem generate otomatis dari judul dan paragraf pertama konten.
10. **Lazy Loading Global:** Semua gambar di halaman publik menggunakan atribut `loading="lazy"` kecuali gambar di above-the-fold (hero banner).

---

## BAGIAN 5: Keamanan, Performa, & Deployment

### 5.1 Keamanan (Security)

- **HTTP Headers Protection:** Middleware `helmet` diterapkan pada Express.js untuk menyematkan header keamanan HTTP (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`, `Content-Security-Policy` yang mengizinkan resource lokal, Google Fonts, Google Maps embed, dan YouTube embed).
- **Anti-Brute-Force & Rate Limiting:**
  - Login endpoint (`/admin/login`): dibatasi maksimal 5 kali percobaan per IP per 15 menit menggunakan `express-rate-limit`.
  - Formulir Inquiry (`/contact/submit`): dibatasi maksimal 3 submit per IP per 10 menit guna mencegah bot spamming.
  - Honeypot form field tersembunyi untuk mendeteksi bot pengisi form otomatis.
- **CSRF Protection:** Seluruh form HTTP POST (admin dan publik) diverifikasi menggunakan token CSRF (`double-csrf` atau `csurf`).
- **SQL Injection Prevention:** 100% interaksi database menggunakan parameterized query dengan `mysql2/promise` (`db.execute('SELECT ... WHERE id = ?', [id])`).
- **XSS & Output Sanitization:** Semua input teks disanitasi sebelum disimpan dan EJS secara default melakukan HTML entity encoding (`<%= %>`) saat merender konten ke template.
- **File Upload Safeguards:**
  - Validasi ketat MIME type (`image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/webm`).
  - Pembersihan nama file (random UUID/timestamp) untuk mencegah directory traversal.
  - File executable seperti `.php`, `.js`, `.sh` diblokir secara mutlak.
- **Cookie Security:** Cookie JWT dikonfigurasi dengan flag `httpOnly: true`, `secure: true` (pada HTTPS), dan `sameSite: 'strict'`.
- **JWT Expiry:** Token kedaluwarsa 1 jam. Payload berisi `id`, `email`, dan `role`.
- **RBAC (Role-Based Access Control):** 3 tingkat role (`superadmin`, `admin`, `editor`) diperiksa di `roleMiddleware` pada setiap rute admin yang terproteksi.

### 5.2 Performa (Performance)

- **Optimasi Gambar Otomatis:** File gambar yang diunggah diproses menggunakan pustaka `sharp`, di-convert ke WebP dengan target kompresi 80% dan ukuran maksimal yang disesuaikan (Hero: 1920px lebar, Produk: 800px lebar, Logo Brand: 400px lebar).
- **Lazy Loading:** Semua gambar di bawah fold menggunakan `loading="lazy"` native browser.
- **Video Preload Optimization:** Video hero slider menggunakan atribut `preload="metadata"` dan menyertakan `poster` image WebP agar tidak memblokir rendering awal (First Contentful Paint < 1.2 detik).
- **Caching Static Assets:** Middleware `express.static` menyematkan header `Cache-Control: public, max-age=604800` (7 hari) untuk berkas CSS, client JS, font Plus Jakarta Sans, dan gambar statis.
- **Database Connection Pooling:** Menggunakan pool koneksi berkapasitas 10 koneksi simultan yang dapat digunakan kembali, menghindari overhead pembukaan socket baru di setiap request.
- **Gzip / Deflate Compression:** Menggunakan middleware `compression` untuk memadatkan payload respons HTML dan CSS hingga 70%.
- **Target Lighthouse ≥ 90:** Performance, SEO, Accessibility, dan Best Practices keempatnya ditargetkan skor 90 atau lebih.

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
   JWT_SECRET=super_secret_jwt_key_here
   JWT_EXPIRY=1h

   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=cpanel_dbuser
   DB_PASSWORD=cpanel_dbpassword
   DB_NAME=cpanel_dbname

   # Storage driver: 'local' atau 's3'
   STORAGE_DRIVER=local
   # Jika STORAGE_DRIVER=s3:
   S3_BUCKET=
   S3_REGION=
   S3_ACCESS_KEY=
   S3_SECRET_KEY=
   S3_CDN_URL=

   SMTP_HOST=mail.euodoo.co.id
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=no-reply@euodoo.co.id
   SMTP_PASS=smtp_password
   NOTIFICATION_EMAIL=sales@euodoo.co.id
   ```

4. **Direktori Berkas Upload & Hak Akses:**
   Pastikan folder `public/uploads/` (dan subdirektori) memiliki izin tulis (permission `755`) bagi user web server.

### 5.4 Development & Local Setup

1. **Instalasi Dependensi:**
   ```bash
   npm install
   ```

2. **Konfigurasi Lingkungan:**
   ```bash
   cp .env.example .env
   # Edit konfigurasi database MySQL lokal dan JWT secret pada .env
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

## BAGIAN 6: Spesifikasi Teknis Revisi Admin v1 (Item 1 & Item 3 s/d 8)

Bagian ini memuat pembaruan arsitektur teknis, analisis mendalam bug kritis, skema database baru, settings key, endpoint, dan environment variable untuk implementasi paket Revisi Admin v1.

### 6.1 Analisis Akar Masalah & Solusi Bug Kritis Item 1 (Error CSRF 403 pada Form CRUD)

#### A. Investigasi Akar Masalah (Root Cause Analysis)
1. **Urutan Middleware & Karakteristik Multipart:**
   Pada arsitektur [app.js](file:///home/itpc/Euodoo/app.js), middleware `csrfProtection` dipasang secara global sebelum router `/admin` (`adminRoutes.js`). Middleware body-parser bawaan Express (`express.urlencoded()` dan `express.json()`) secara sengaja mengabaikan request dengan header `Content-Type: multipart/form-data`.
2. **Keterlambatan Eksekusi Multer:**
   Parser berkas `multer` (`uploadMedia.single(...)`) dipasang di tingkat route handler spesifik di [routes/adminRoutes.js](file:///home/itpc/Euodoo/routes/adminRoutes.js). Akibatnya, saat request form upload (seperti tambah/edit produk, artikel, banner, brand, media, about) tiba di server:
   - `csrfProtection` dieksekusi lebih dulu saat `req.body` masih berupa object kosong `{}`.
   - Pengecekan token pada `req.body._csrf` menghasilkan `undefined`.
   - Karena form HTML biasa tidak menyertakan custom header `X-CSRF-Token`, variabel `incomingToken` bernilai `undefined`.
   - `csrfProtection` langsung memutus aliran request dan melempar status HTTP 403: *"Sesi pengiriman formulir tidak valid atau telah kedaluwarsa demi keamanan sistem."* sebelum `multer` atau controller sempat membaca payload request.
3. **Anomali Parsial pada Modul Tertentu:**
   Pada [views/admin/capabilities/index.ejs](file:///home/itpc/Euodoo/views/admin/capabilities/index.ejs), form berhasil disubmit karena sebelumnya telah ditambahkan workaround manual `action="/admin/capabilities?_csrf=<%= csrfToken %>"` pada query string URL. Sebaliknya, form produk, artikel, banner, merek, media, dan about hanya menaruh `<input type="hidden" name="_csrf" value="...">` di dalam body multipart yang belum di-parse.

#### B. Solusi Arsitektur (Tanpa Menonaktifkan Proteksi CSRF)
1. **Multi-Source Token Extraction & Query String Uniformity:**
   - Pertahankan validasi ketat CSRF pada [middleware/csrfMiddleware.js](file:///home/itpc/Euodoo/middleware/csrfMiddleware.js) yang mendukung ekstraksi dari:
     - `req.body?._csrf` (untuk request form standar `application/x-www-form-urlencoded` dan `application/json`)
     - `req.query?._csrf` (untuk request `multipart/form-data` melalui action URL)
     - `req.headers['x-csrf-token']` dan `req.headers['csrf-token']` (untuk request AJAX/Fetch)
   - Seragamkan seluruh action URL pada tag `<form method="POST" enctype="multipart/form-data">` di admin panel agar menyertakan query parameter `?_csrf=<%= csrfToken %>` (misal: `action="/admin/products?_csrf=<%= csrfToken %>"` dan `action="/admin/products/<%= product.id %>?_csrf=<%= csrfToken %>"`).
2. **Global AJAX CSRF Injection:**
   - Pada [public/js/admin.js](file:///home/itpc/Euodoo/public/js/admin.js), tambahkan interceptor / default header helper untuk memastikan setiap panggilan `fetch()` yang mengubah state (POST/PUT/DELETE) otomatis menyertakan header `X-CSRF-Token` yang diambil dari tag `<meta name="csrf-token" content="...">`.
3. **Verifikasi End-to-End:**
   - Pengujian otomatis dan manual untuk operasi Create & Update di seluruh modul CRUD admin (Products, Posts, Banners, Brands, Media, About, Categories, Users, Settings) memastikan tidak ada request valid yang terblokir 403.

---

### 6.2 Perubahan Skema Database & Rencana Migrasi (Item 6 & Item 8)

Pembaruan skema database dikelola melalui file migrasi versi:
`database/migrations/004_revisi_admin_v1.sql`

#### A. Tabel Baru: `slug_redirects` (Item 6 - Artikel Custom URL & 301 Redirect)
Mencatat riwayat perubahan slug agar URL lama tidak menghasilkan 404 bagi mesin pencari (SEO) maupun pengunjung.
```sql
CREATE TABLE IF NOT EXISTS slug_redirects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL DEFAULT 'post', -- 'post', 'product', 'page'
  entity_id INT NOT NULL,
  old_slug VARCHAR(191) NOT NULL,
  new_slug VARCHAR(191) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slug_redirects_lookup (entity_type, old_slug),
  INDEX idx_slug_redirects_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### B. Tabel Baru: `page_hero_banners` (Item 8 - Hero Banner Per Halaman Publik)
Menyimpan konfigurasi gambar latar, judul, caption, overlay, dan CTA opsional untuk 4 halaman publik utama (`about`, `news`, `products`, `contact`).
```sql
CREATE TABLE IF NOT EXISTS page_hero_banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_key VARCHAR(50) NOT NULL UNIQUE, -- 'about', 'news', 'products', 'contact'
  title_id VARCHAR(255) NULL,
  title_en VARCHAR(255) NULL,
  subtitle_id TEXT NULL,
  subtitle_en TEXT NULL,
  image_url VARCHAR(500) NULL,
  overlay_opacity DECIMAL(3,2) DEFAULT 0.60,
  cta_text_id VARCHAR(100) NULL,
  cta_text_en VARCHAR(100) NULL,
  cta_url VARCHAR(500) NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_page_hero_key (page_key, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Seed Default untuk 4 Halaman
INSERT INTO page_hero_banners (page_key, title_id, title_en, subtitle_id, subtitle_en, image_url, overlay_opacity)
VALUES
  ('about', 'Tentang PT Euodoo', 'About PT Euodoo', 'Perjalanan dedikasi manufaktur plastik ramah lingkungan terpercaya sejak 1990.', 'A dedicated journey in eco-friendly plastic manufacturing since 1990.', '/images/hero-factory-precision.webp', 0.65),
  ('news', 'Berita & Wawasan Industri', 'News & Industry Insights', 'Pembaruan terkini inovasi kemasan, keberlanjutan lingkungan, dan kegiatan korporasi.', 'Latest updates on packaging innovation, environmental sustainability, and corporate activities.', '/images/hero-factory.jpg', 0.60),
  ('products', 'Katalog Produk Kemasan Plastik', 'Plastic Packaging Product Catalog', 'Rangkaian solusi kantong plastik HDPE & LLDPE berstandar SNI dan ramah lingkungan.', 'Comprehensive SNI-certified and eco-friendly HDPE & LLDPE plastic bag solutions.', '/images/hero-factory-precision.webp', 0.60),
  ('contact', 'Hubungi Kami & Permintaan Penawaran', 'Contact Us & Request a Quote', 'Konsultasikan spesifikasi kebutuhan cetakan dan kemasan plastik industri Anda bersama tim ahli kami.', 'Consult your industrial plastic molding and packaging specifications with our expert team.', '/images/hero-factory.jpg', 0.60)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
```

#### C. Rencana Eksekusi Migrasi
1. Skrip SQL `004_revisi_admin_v1.sql` dijalankan melalui skrip runner database `database/migrate.js` (`npm run migrate`).
2. Migration runner otomatis mencatat `004_revisi_admin_v1.sql` ke tabel `migrations` untuk mencegah eksekusi ulang.

---

### 6.3 Settings Key Baru (Item 3, Item 4, Item 5)

Data konfigurasi disimpan dalam tabel `settings` (format pasangan `setting_key` dan `setting_value`), diinjeksi secara global ke seluruh template SSR melalui [middleware/settingsMiddleware.js](file:///home/itpc/Euodoo/middleware/settingsMiddleware.js):

| Setting Key | Tipe Data | Keterangan & Nilai Default / Fallback | Terkait Item |
|---|---|---|---|
| `site_favicon` | String (Path) | Path berkas favicon kustom. Fallback: `/favicon.ico` | Item 4 |
| `site_logo_header` | String (Path) | Path berkas logo header. Fallback: `/images/brands/brand-euodoo.webp` | Item 5 |
| `site_logo_footer` | String (Path) | Path berkas logo footer. Fallback: `/images/brands/brand-euodoo.webp` | Item 5 |
| `contact_address_id` | Text | Alamat fisik kantor/pabrik (Bahasa Indonesia) | Item 3 |
| `contact_address_en` | Text | Alamat fisik kantor/pabrik (Bahasa Inggris) | Item 3 |
| `contact_email` | String | Email resmi korespondensi/sales (misal: `sales@euodoo.co.id`) | Item 3 |
| `contact_phone` | String | Nomor telepon / hotline resmi (misal: `+62 22 1234567`) | Item 3 |
| `contact_working_hours_id` | String | Jam operasional kerja (ID) (misal: `Senin - Jumat: 08.00 - 17.00 WIB`) | Item 3 |
| `contact_working_hours_en` | String | Jam operasional kerja (EN) (misal: `Mon - Fri: 08:00 - 17:00 WIB`) | Item 3 |
| `contact_maps_embed_url` | Text | URL embed iframe Google Maps lokasi kantor/pabrik | Item 3 |
| `contact_form_title_id` | String | Judul seksi formulir inquiry (ID) | Item 3 |
| `contact_form_title_en` | String | Judul seksi formulir inquiry (EN) | Item 3 |
| `contact_form_subtitle_id`| Text | Subjudul/deskripsi pengantar formulir inquiry (ID) | Item 3 |
| `contact_form_subtitle_en`| Text | Subjudul/deskripsi pengantar formulir inquiry (EN) | Item 3 |

---

### 6.4 Spesifikasi Endpoint Baru & Pembaruan Controller

#### A. Menu CMS Halaman Kontak (Item 3)
- `GET /admin/contact`
  - Controller: `contactCmsController.index`
  - Akses: Role `superadmin` dan `admin`
  - View: `views/admin/contact/index.ejs`
  - Membaca seluruh setting kontak dwibahasa dan menampilkannya pada form terstruktur.
- `POST /admin/contact?_csrf=...`
  - Controller: `contactCmsController.update`
  - Akses: Role `superadmin` dan `admin`
  - Validasi & simpan pembaruan setting kontak ke tabel `settings`.

#### B. Pengaturan Favicon & Logo Terpisah (Item 4 & 5)
- `POST /admin/settings?_csrf=...`
  - Controller: `settingController.update`
  - Multipart Upload via Multer:
    - `uploadSettings.fields([{ name: 'favicon_file', maxCount: 1 }, { name: 'logo_header_file', maxCount: 1 }, { name: 'logo_footer_file', maxCount: 1 }])`
  - Memproses berkas gambar, mengonversi/menyimpan ke `public/uploads/settings/`, dan memperbarui key `site_favicon`, `site_logo_header`, `site_logo_footer` pada tabel `settings`.

#### C. Custom Slug & 301 Permanent Redirect Artikel (Item 6)
- `POST /admin/posts?_csrf=...` & `POST /admin/posts/:id?_csrf=...`
  - Controller: `postController.store` dan `postController.update`
  - Validasi: Sanitasi format slug (`slugify(req.body.slug || req.body.title_id)`). Validasi regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
  - Keunikan: Cek `SELECT id FROM posts WHERE slug = ? AND id != ?`. Jika duplikat, tambahkan counter `-1`, `-2` atau kembalikan error validasi yang ramah.
  - Redirect Logger: Pada saat update, jika `old_slug !== new_slug`:
    - Insert ke `slug_redirects (entity_type, entity_id, old_slug, new_slug) VALUES ('post', id, old_slug, new_slug)`.
    - Perbarui relasi sirkular jika `old_slug` sebelumnya sudah pernah mengarah ke entitas ini.
- `GET /news/:slug`
  - Controller: `public/postController.detail`
  - Jika `postModel.findBySlug(slug)` bernilai `null`:
    - Query `SELECT new_slug FROM slug_redirects WHERE entity_type = 'post' AND old_slug = ? LIMIT 1`.
    - Jika ditemukan: `return res.redirect(301, '/news/' + redirect.new_slug);`
    - Jika tidak ditemukan: tampilkan halaman 404.

#### D. Verifikasi Cloudflare Turnstile pada Form Inquiry (Item 7)
- `POST /contact` & `POST /leads`
  - Controller: `contactController.submit`
  - Ekstraksi token dari body: `const turnstileToken = req.body['cf-turnstile-response'];`
  - Validasi Server-Side:
    - Panggil endpoint Cloudflare: `https://challenges.cloudflare.com/turnstile/v0/siteverify` via `fetch` POST dengan payload:
      - `secret`: `process.env.TURNSTILE_SECRET_KEY`
      - `response`: `turnstileToken`
      - `remoteip`: `req.ip`
    - Jika verifikasi gagal (`!data.success`):
      - Kembalikan response error HTTP 400 (atau flash error) dengan pesan dwibahasa: *"Verifikasi keamanan Turnstile gagal atau kedaluwarsa. Silakan coba lagi."*
      - Inquiry **tidak disimpan** ke database.
    - Jika sukses: lanjutkan penyimpanan ke tabel `inquiries` dan pengiriman notifikasi email.

#### E. CMS Hero Banner Per Halaman Publik (Item 8)
- `GET /admin/hero-banners`
  - Controller: `heroBannerController.index`
  - Akses: Role `superadmin` dan `admin`
  - View: `views/admin/hero-banners/index.ejs`
- `POST /admin/hero-banners/:pageKey?_csrf=...`
  - Controller: `heroBannerController.update`
  - Middleware: `uploadMedia.single('hero_image')`
  - Simpan pembaruan ke tabel `page_hero_banners` untuk `page_key` yang bersangkutan (`about`, `news`, `products`, `contact`).
- Public Rendering:
  - `pageController.about`, `productController.index`, `postController.index`, `contactController.index` meng-query `page_hero_banners` dan mengoper objek `heroBanner` ke template EJS dengan fallback default yang aman.

---

### 6.5 Konfigurasi Environment Baru: Cloudflare Turnstile (Item 7)

Penambahan variabel pada berkas `.env` dan `.env.example`:

```env
# ========================================================
# Cloudflare Turnstile Bot Protection
# ========================================================
# Kunci Publik untuk Widget Client-side di EJS
TURNSTILE_SITE_KEY=1x00000000000000000000AA

# Kunci Rahasia Server untuk Verifikasi Siteverify API (JANGAN diekspos ke publik)
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```
*Catatan:* Kunci berawalan `1x000000...` di atas adalah official dummy keys dari Cloudflare yang selalu mengembalikan status valid/sukses untuk lingkungan lokal development dan automated testing.

---

## BAGIAN 7: Revisi Admin v2 (Analisis Bug Interaktivitas UI & Arsitektur Teknis TinyMCE)

### 7.1 Analisis Investigasi & Akar Masalah Bug Interaktivitas UI (Item A)

#### A. Akar Masalah Bug A1 (Alert Sukses Muncul Dua Kali)
- **Gejala:** Saat memperbarui konten pada halaman CMS Tentang Kami (`/admin/about`), kotak pesan sukses (alert hijau) tampil dobel / dua kali.
- **Hasil Investigasi Kode:**
  - File partial layout `views/partials/admin-header.ejs` (baris 275-290) sudah memiliki penanganan flash alert global:
    ```ejs
    <div class="admin-alerts-container">
      <% if (typeof success !== 'undefined' && success) { %>
        <div class="alert alert-success" role="alert">...</div>
      <% } %>
    </div>
    ```
  - Beberapa template view lokal merender ulang variabel `success` di dalam konten halaman:
    - `views/admin/about/index.ejs` (baris 17-21)
    - `views/admin/hero-banners/index.ejs` (baris 17-21)
    - `views/admin/contact/index.ejs` (baris 17-21)
    - `views/admin/change-password.ejs` (baris 27-31)
  - Karena kedua komponen (header global dan template lokal) sama-sama membaca `res.locals.success`, alert muncul 2 kali bertumpuk.
- **Solusi Teknis:**
  - Hapus blok render alert lokal dari seluruh file template view admin.
  - Percayakan seluruh rendering notifikasi flash (sukses dan error) secara tunggal dan terpusat pada `views/partials/admin-header.ejs`.

#### B. Akar Masalah Bug A2, A3, dan A4 (Tombol Interaktif Tidak Berfungsi)
- **Gejala:**
  - Tombol "Tinjau" pada daftar Inquiry & RFQ (`views/admin/inquiries/index.ejs`) dan widget dashboard (`views/admin/dashboard.ejs`) tidak merespons klik.
  - Tombol "+ Tambah Baris Parameter" dan "+ Tambah Baris Varian" pada form produk (`create.ejs` & `edit.ejs`) tidak menambahkan baris baru.
  - Tombol aksi hapus `(x)` pada baris spesifikasi dan varian tidak menghapus elemen.
- **Hasil Investigasi Console & Security Headers:**
  - **Akar Masalah Utama: Content Security Policy (CSP) Helmet Directive `script-src-attr 'none'`.**
    Di `app.js`, middleware `helmet` dikonfigurasi dengan:
    ```javascript
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        ...
      }
    }
    ```
    Secara default, Helmet v7+ otomatis menyetel directive `script-src-attr` menjadi `'none'`.
    Ketika `script-src-attr: 'none'`, browser modern (Chrome, Firefox, Safari, Edge) **secara ketat menolak dan memblokir eksekusi setiap event handler inline HTML**, seperti:
    - `onclick="viewInquiryDetail(...)"` (Dashboard)
    - `onclick="openInquiryById(...)"` (Inquiries)
    - `onclick="addSpecRow()"` (Produk)
    - `onclick="addVariantRow()"` (Produk)
    - `onclick="this.closest('tr').remove()"` (Produk Hapus Baris)
    Browser memunculkan error pada console:
    `Refused to execute inline event handler because it violates the following Content Security Policy directive: "script-src-attr 'none'".`
  - **Kekurangan pada Template View Produk:**
    - Pada `views/admin/products/create.ejs`, baris bawaan spesifikasi teknis (baris 97-108) bahkan belum memiliki elemen tombol hapus `(x)`.
    - Tidak ada boundary condition (proteksi baris minimal), sehingga jika seluruh baris terhapus, form kehilangan konteks input.
- **Solusi Teknis Terpadu:**
  1. *Perbaikan CSP:* Di `app.js`, tambahkan directive eksplisit `scriptSrcAttr: ["'unsafe-inline'"]` pada konfigurasi Helmet CSP sebagai lapisan kompatibilitas aman.
  2. *Event Delegation & Event Listeners:* Di `public/js/admin.js`, pasang event listener dan event delegation modern (misal via atribut `data-action="view-inquiry"`, `data-action="add-spec-row"`, `data-action="add-variant-row"`, `data-action="remove-row"`) sehingga interaktivitas tidak semata-mata bergantung pada inline handler string.
  3. *Lengkapi UI Hapus Baris & Boundary:* Tambahkan tombol `(x)` pada setiap baris di `create.ejs` dan `edit.ejs`, serta pastikan tombol hapus memeriksa batas minimal 1 baris aktif atau menampilkan fallback visual yang bersih.

---

### 7.2 Arsitektur Teknis Editor Artikel TinyMCE (Item B1)

#### A. Keputusan Lisensi & Self-Host vs Cloud
- **Pilihan Arsitektur:** **Self-Hosted** via package npm `tinymce` (bukan CDN Cloud `cdn.tiny.cloud`).
- **Analisis Perbandingan:**
  | Aspek | TinyMCE Cloud (`cdn.tiny.cloud`) | TinyMCE Self-Hosted (`npm install tinymce`) |
  |---|---|---|
  | **Kemandirian** | Tergantung koneksi CDN luar & server TinyMCE | 100% mandiri di server lokal / intranet |
  | **API Key & Biaya** | Wajib API key. Free tier limit 1.000 load/bln + watermark | Bebas API key, kuota tak terbatas, tanpa watermark |
  | **Keamanan CSP** | Wajib melonggarkan CSP (`connect-src`, `script-src` eksternal) | Cukup `'self'` pada CSP Helmet internal |
  | **Lisensi** | Proprietary SaaS Terms | Open-Source Community (LGPL v2.1) |
- **Penyajian Berkas Statis di Express:**
  - Tambahkan rute static pada `app.js`:
    ```javascript
    app.use('/tinymce', express.static(path.join(__dirname, 'node_modules/tinymce')));
    ```
  - Template admin memuat script inti:
    ```html
    <script src="/tinymce/tinymce.min.js"></script>
    ```

#### B. Integrasi UI, Skin & Content CSS (Harmonisasi DESIGN.md)
- **Tema Desain:** Mengikuti design token *Pacific Corporate & Energy* di `Design/DESIGN.md`.
- **Konfigurasi Inisialisasi TinyMCE (`public/js/admin-editor.js`):**
  ```javascript
  tinymce.init({
    selector: '#content_id, #content_en',
    height: 480,
    menubar: false,
    branding: false,
    promotion: false,
    skin: 'oxide',
    content_css: 'default',
    content_style: `
      body {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 15px;
        line-height: 1.65;
        color: #0F172A;
        padding: 16px;
      }
      h2 { font-size: 1.5rem; font-weight: 700; color: #0A192F; margin-top: 1.5rem; margin-bottom: 0.75rem; }
      h3 { font-size: 1.25rem; font-weight: 600; color: #0A192F; margin-top: 1.25rem; margin-bottom: 0.5rem; }
      p { margin-bottom: 1rem; }
      a { color: #00755A; text-decoration: underline; }
      img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th, td { border: 1px solid #E2E8F0; padding: 8px 12px; }
      th { background-color: #F8FAFC; font-weight: 600; }
    `,
    plugins: 'lists link image table code wordcount',
    toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | link image table | code',
    images_upload_handler: uploadArticleImageHandler
  });
  ```

#### C. Endpoint Backend Upload Gambar TinyMCE & Otomasi WebP
- **Endpoint:** `POST /admin/posts/upload-image?_csrf=...`
- **Controller:** `postController.uploadEditorImage`
- **Middleware:** `requireAuth`, `requireAdmin`, `csrfProtection`, Multer single file upload (`uploadMedia.single('file')`).
- **Alur Pemrosesan Gambar (Sharp):**
  1. Validasi ekstensi dan MIME-type (hanya gambar `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`).
  2. Sharp membaca buffer gambar: resize proporsional (maksimal lebar 1600px, tanpa memperbesar gambar kecil).
  3. Konversi format menjadi **WebP** dengan tingkat kompresi kualitas 82.
  4. Simpan ke direktori `public/uploads/posts/post-editor-[timestamp]-[random].webp`.
  5. Kirim response JSON standar TinyMCE:
     ```json
     {
       "location": "/uploads/posts/post-editor-1791269999-abc123.webp"
     }
     ```
  6. Jika terjadi error atau validasi gagal, kembalikan HTTP 400 dengan response JSON: `{ "error": "Pesan error" }`.

#### D. Sanitasi HTML Server-Side (Pencegahan Stored XSS)
- **Library:** `sanitize-html` (instal via `npm install sanitize-html`).
- **Titik Eksekusi:** Pada `postController.store` dan `postController.update` sebelum nilai `req.body.content_id` dan `req.body.content_en` di-persist ke database.
- **Konfigurasi Sanitasi (`utils/sanitizer.js`):**
  ```javascript
  import sanitizeHtml from 'sanitize-html';

  export const sanitizeArticleHtml = (dirtyHtml) => {
    if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';
    return sanitizeHtml(dirtyHtml, {
      allowedTags: [
        'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'em', 'u', 's', 'strike',
        'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'table', 'thead', 'tbody',
        'tr', 'th', 'td', 'code', 'pre', 'hr', 'br', 'span', 'sub', 'sup'
      ],
      allowedAttributes: {
        'a': ['href', 'target', 'rel', 'title'],
        'img': ['src', 'alt', 'width', 'height', 'loading'],
        'table': ['border', 'cellpadding', 'cellspacing', 'class'],
        'th': ['scope', 'colspan', 'rowspan'],
        'td': ['colspan', 'rowspan'],
        '*': ['style', 'class']
      },
      allowedSchemes: ['http', 'https', 'mailto', 'tel'],
      allowedStyles: {
        '*': {
          'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
          'color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/],
          'background-color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/]
        }
      },
      transformTags: {
        'a': sanitizeHtml.simpleTransform('a', {
          rel: 'noopener noreferrer'
        })
      }
    });
  };
  ```

#### E. Penyimpanan Konten & Backward Compatibility Artikel Lama
- Kolom tabel `posts.content_id` dan `posts.content_en` saat ini bertipe `LONGTEXT`, mampu menampung kode HTML panjang.
- Konten artikel lama (teks biasa tanpa tag HTML atau dengan newline `\n\n`) tetap valid dan otomatis dirender dengan baik oleh TinyMCE dan halaman publik `news-detail.ejs`.
- Tidak ada breaking change terhadap skema database MySQL.

---

## BAGIAN 11: Spesifikasi Teknis Revisi Home & Admin v3 (Kelompok B)

### 11.1 Integrasi Media Library Terpadu (Universal Media Picker Modal di Semua Form)

#### A. Arsitektur Komponen Reusable
- **Partial Template:** `views/partials/media-picker-modal.ejs`
- **Client Script:** `public/js/media-picker.js`
- **Markup Field Form:**
  ```html
  <div class="media-picker-field" data-target-input="field_id">
    <input type="hidden" id="field_id" name="field_name" value="<%= currentValue || '' %>">
    <div class="media-picker-preview">
      <img src="<%= currentValue || '' %>" alt="Pratinjau" style="<%= currentValue ? '' : 'display:none;' %>">
      <div class="preview-empty" style="<%= currentValue ? 'display:none;' : '' %>">
        <svg width="24" height="24" ...></svg>
        <span>Belum ada aset dipilih</span>
      </div>
    </div>
    <div class="media-picker-actions">
      <button type="button" class="btn btn-secondary btn-sm btn-open-media-picker" data-picker-type="image">
        Pilih dari Media Library
      </button>
      <button type="button" class="btn btn-ghost btn-sm btn-clear-media" style="<%= currentValue ? '' : 'display:none;' %>">
        Hapus
      </button>
    </div>
  </div>
  ```

#### B. API Endpoints Media Picker
1. **Daftar Aset:** `GET /admin/api/media`
   - **Query Params:** `type` (`all` | `image` | `video` | `document` | `youtube`), `search` (string), `page` (number, default 1), `limit` (default 24).
   - **Response Format:**
     ```json
     {
       "success": true,
       "data": [
         {
           "id": 12,
           "filename": "factory-plant.webp",
           "file_url": "/uploads/media/media-1791234567.webp",
           "media_type": "image",
           "mime_type": "image/webp",
           "file_size": 204850,
           "created_at": "2026-10-09T08:00:00Z"
         }
       ],
       "pagination": { "page": 1, "limit": 24, "total": 45, "totalPages": 2 }
     }
     ```
2. **Unggah Langsung via Picker:** `POST /admin/api/media/upload`
   - **Form Data:** `file` (binary), `_csrf` (token).
   - **Middleware:** `requireAuth`, `roleMiddleware(['superadmin', 'admin', 'editor'])`, `uploadMedia.single('file')`.
   - **Pemrosesan:** Sharp konversi WebP (gambar) / storage driver (video/dokumen).
   - **Response:** JSON entitas media baru yang siap langsung di-select oleh form.

#### C. Keputusan Penyimpanan Referensi (URL vs ID)
- **Keputusan Teknis: Menyimpan String URL (`file_url`).**
- **Rasional:**
  1. *Zero Schema Disruption:* Tidak memerlukan `ALTER TABLE` pada 8 tabel database (`banners`, `page_hero_banners`, `settings`, `products`, `brands`, `posts`, `capabilities`).
  2. *Kompatibilitas Template Publik:* Seluruh view EJS publik telah siap me-render variabel URL secara langsung (`<img src="<%= item.image_url %>">`).
  3. *Mendukung URL Eksternal / Video YouTube:* Format URL fleksibel menampung path lokal (`/uploads/...`) maupun ID/URL video eksternal.

#### D. Pencegahan Hapus Aset yang Sedang Digunakan (Dependency Checker)
- **Method:** `mediaModel.checkUsage(fileUrl)`
- **Query Aggregator:**
  ```sql
  SELECT 'Banner' as source, title_id as label FROM banners WHERE file_url = ? OR poster_url = ?
  UNION ALL
  SELECT 'Hero Banner' as source, page_key as label FROM page_hero_banners WHERE image_url = ?
  UNION ALL
  SELECT 'Katalog Produk' as source, name_id as label FROM products WHERE image_url = ?
  UNION ALL
  SELECT 'Artikel Berita' as source, title_id as label FROM posts WHERE cover_image = ?
  UNION ALL
  SELECT 'Merek' as source, name as label FROM brands WHERE logo_url = ?
  UNION ALL
  SELECT 'Kapabilitas' as source, title_id as label FROM capabilities WHERE image_url = ?
  UNION ALL
  SELECT 'Pengaturan' as source, 'Logo / Favicon / Dokumentasi' as label FROM settings
  WHERE site_logo_header = ? OR site_logo_footer = ? OR site_favicon = ? OR about_image_url = ?
  ```
- **Alur Validasi Hapus (Sesuai Pilihan B - Soft Warning dengan Force Delete):**
  1. Frontend mengirim request `DELETE /admin/api/media/:id`.
  2. Endpoint memanggil `mediaModel.checkUsage(fileUrl)`.
  3. Jika tidak ada relasi penggunaan: media langsung dihapus dari disk dan database.
  4. Jika aset sedang digunakan oleh entitas lain: endpoint mengembalikan status HTTP 409 Conflict dengan daftar entitas pengguna (`{ success: false, inUse: true, usages: [...] }`).
  5. Frontend SweetAlert2 menampilkan dialog modal peringatan rincian entitas pengguna dengan dua opsi tombol:
     - "Batal": Mengurungkan tindakan hapus.
     - "Tetap Hapus (Paksa Hapus)": Mengirimkan request ulang `DELETE /admin/api/media/:id?force=true`.
  6. Saat menerima `force=true`, backend melanjutkan eksekusi pemusnahan berkas fisik dan record database.

---

### 11.2 Banner Video Homepage Multi-Sumber (Media Library, Upload Berkas, & YouTube Embed)

#### A. Ekstraksi ID YouTube
- **Regex Universal:**
  ```javascript
  export function extractYouTubeId(url) {
    if (!url || typeof url !== 'string') return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.trim().match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
  }
  ```
- **Penyimpanan:** Database tabel `banners` menyimpan `media_type = 'youtube'` dan `file_url = youtubeId` (11 karakter).

#### B. Penyematan youtube-nocookie di Homepage EJS
- **Iframe Markup:**
  ```html
  <% if (banner.media_type === 'youtube') { %>
    <div class="hero-video-wrapper">
      <iframe
        src="https://www.youtube-nocookie.com/embed/<%= banner.file_url %>?autoplay=1&mute=1&loop=1&playlist=<%= banner.file_url %>&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1"
        title="<%= bannerTitle %>"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        loading="lazy"
        tabindex="-1">
      </iframe>
    </div>
  <% } else if (isVideo) { %>
    <video autoplay muted loop playsinline preload="metadata" poster="<%= banner.poster_url || '/images/hero-factory.jpg' %>">
      <source src="<%= bannerMediaUrl %>" type="video/mp4">
    </video>
  <% } else { %>
    <img src="<%= bannerMediaUrl %>" alt="<%= bannerTitle %>" ...>
  <% } %>
  ```
- **CSS Video Background:**
  ```css
  .hero-video-wrapper {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
  }
  .hero-video-wrapper iframe {
    width: 100vw;
    height: 56.25vw; /* 16:9 ratio */
    min-height: 100vh;
    min-width: 177.77vh; /* 16:9 ratio */
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  ```

#### C. Penyesuaian Helmet Content Security Policy (CSP)
- **File:** `app.js`
- **Perubahan Direktif:**
  ```javascript
  frameSrc: [
    "'self'",
    'https://www.google.com',
    'https://www.youtube.com',
    'https://www.youtube-nocookie.com'
  ]
  ```

---

### 11.3 Sistem Notifikasi & Dialog Konfirmasi Modern Admin (SweetAlert2 Self-Hosted)

#### A. Distribusi Aset Lokal (Zero CDN Dependency)
- **Instalasi:** `npm install sweetalert2`
- **Penyalinan Aset Statis:**
  - `public/vendor/sweetalert2/sweetalert2.min.js`
  - `public/vendor/sweetalert2/sweetalert2.min.css`
- **Pemuatan di `views/partials/admin-header.ejs`:**
  ```html
  <link rel="stylesheet" href="/vendor/sweetalert2/sweetalert2.min.css">
  <script src="/vendor/sweetalert2/sweetalert2.min.js"></script>
  ```

#### B. Helper JavaScript Terpusat (`public/js/admin.js`)
```javascript
// 1. Toast Notification Helper
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

window.adminToast = (type, message) => {
  Toast.fire({
    icon: type, // 'success' | 'error' | 'warning' | 'info'
    title: message
  });
};

// 2. Global Delete Confirmation Interceptor
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form[data-confirm-delete]').forEach(form => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const entityName = this.getAttribute('data-entity-name') || 'data ini';
      
      Swal.fire({
        title: 'Konfirmasi Hapus',
        text: `Apakah Anda yakin ingin menghapus ${entityName}? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DC2626',
        cancelButtonColor: '#0D2040',
        confirmButtonText: 'Ya, Hapus Data',
        cancelButtonText: 'Batal',
        reverseButtons: true,
        focusCancel: true
      }).then((result) => {
        if (result.isConfirmed) {
          form.submit();
        }
      });
    });
  });

  // 3. Server Flash Messages Bridge
  const urlParams = new URLSearchParams(window.location.search);
  const successMsg = urlParams.get('success');
  const errorMsg = urlParams.get('error');

  if (successMsg) {
    adminToast('success', decodeURIComponent(successMsg));
  } else if (errorMsg) {
    adminToast('error', decodeURIComponent(errorMsg));
  }
});
```

#### C. Kepatuhan Keamanan & CSP
- Aset 100% tersaji dari domain origin lokal (`'self'`), tidak memerlukan penambahan domain pihak ketiga pada `scriptSrc` maupun `styleSrc` Helmet CSP.
- Kompatibel dengan mode strict browser dan sistem otentikasi sesi cookie.

---

## 🚀 REVISI V4 (2026-10-12): SPESIFIKASI TEKNIS KELOMPOK B

### B.1 Redesain Kartu & Section Portofolio Merek Homepage (Public View)

#### 1. Latar Belakang & Perubahan Perilaku (Behavior Change)
Berdasarkan evaluasi tampilan homepage v4, komponen portofolio merek disederhanakan secara terfokus:
- **Tampilan Publik Minimalis & Tegas:** Kartu portofolio merek di beranda publik hanya menyajikan dua elemen visual esensial: **logo resmi merek** (`brand.logo_url`) dan **nama merek** (`brand.name`).
- **Eliminasi Deskripsi Publik & Fallback Statis:** Seluruh teks deskripsi (`description_id`, `description_en`) dihapus dari template kartu beranda. Tidak boleh ada teks pengganti default statis (seperti *"Merek Terdaftar PT Euodoo"* atau *"Standar mutu presisi manufaktur sejak 1990"*) yang ditampilkan bila deskripsi kosong.
- **Pembersihan Kartu Statis Duplikat:** Blok kartu statis hardcoded lama ("PB", "BERKAH", "OXIUM") di template publik dihilangkan seluruhnya, memastikan hanya data merek aktif dari database yang dirender.

#### 2. Arsitektur Rendering & Template EJS (`views/public/index.ejs`)
- **Query Controller (`controllers/public/homeController.js`):**
  Mengambil entitas aktif menggunakan model:
  ```javascript
  const brands = await brandModel.findAll({ activeOnly: true });
  ```
  Data dikirimkan ke view context sebagai array `brands`.
- **Struktur Kartu Baru (Semantic Markup):**
  ```html
  <div class="brand-showcase-card" data-brand-id="<%= brand.id %>">
    <div class="brand-logo-container">
      <% if (brand.logo_url) { %>
        <img src="<%= brand.logo_url %>" alt="<%= brand.name %>" class="brand-logo-img" loading="lazy" width="160" height="60">
      <% } else { %>
        <div class="brand-logo-fallback" aria-label="<%= brand.name %>">
          <span class="brand-fallback-text"><%= brand.name %></span>
        </div>
      <% } %>
    </div>
    <div class="brand-meta-container">
      <span class="brand-display-name"><%= brand.name %></span>
    </div>
  </div>
  ```
- **Ketahanan Rendering (Resilience C-4):**
  Jika data `brands` kosong di database, section menampilkan empty state bernuansa korporat yang rapi tanpa merusak tata letak halaman.

#### 3. Styling & Tata Letak Responsif (Keputusan Terkunci: Opsi II - Continuous Seamless Logo Ribbon)
- **Estetika B2B Non-Generik (Sesuai `Design/DESIGN.md`):**
  - Mengadopsi **Continuous Seamless Logo Ribbon** (marquee halus terkalibrasi) dengan kecepatan geser yang tenang, transisi stabil, dan fitur *pause on hover / touch* agar logo mudah dicermati.
  - Sisi kiri dan kanan pita slider dilengkapi gradien *fading edge* halus yang menyatu dengan latar belakang section, mengeliminasi potongan tajam di tepi layar.
  - Setiap kartu merek (`.brand-showcase-card`) memiliki rasio aspek proporsional, latar belakang netral bersih (`#FFFFFF`), border terkalibrasi `1px solid var(--border, #E2E8F0)`, sudut kelengkungan `var(--r-md, 0.375rem)`, dan hover elevation `level-1` tanpa efek banting atau glow berlebihan.
  - Logo disajikan dengan `object-fit: contain` menjamin logo orientasi lanskap maupun bujur sangkar tetap presisi dan tajam.
  - Tipografi nama merek: Plus Jakarta Sans `font-weight: 600`, ukuran `13px–14px`, warna `text-main` (`#0F172A`).
- **Mobile Reflow (`antislop-layoutmobile`):**
  - Desktop (>1024px): Continuous smooth ribbon track dengan padding longgar dan dimensi kartu 200px × 110px.
  - Tablet (768px–1023px): Skala dimensi kartu 170px × 95px dengan kecepatan putaran yang disesuaikan.
  - Mobile (320px–480px): Dimensi kartu kompak 150px × 85px, touch-friendly, tanpa horizontal scroll leak ke bodi halaman utama.

#### 4. Arsitektur Form Admin & Database (Keputusan Terkunci: Opsi B - Sembunyikan Field di Form, DB Preserved)
- **Form Admin CMS (`views/admin/brands/create.ejs` & `edit.ejs`):**
  - Field textarea deskripsi (`description_id` dan `description_en`) **disembunyikan/dihapus dari form antarmuka admin**. Form admin kini fokus hanya pada 4 data esensial: **Nama Merek**, **Nomor Urutan Tampil**, **Logo Merek (Universal Media Picker)**, dan **Status Aktif**.
  - Hal ini mempercepat waktu pengisian oleh admin dan mencegah kebingungan karena deskripsi tidak lagi dipakai di beranda.
- **Integritas Skema Database MySQL (`brands`):**
  - Kolom `description_id` dan `description_en` **tetap dipertahankan di database** (status nullable) tanpa migrasi DDL `ALTER TABLE`, menjamin integritas data historis tidak terganggu dan kompatibilitas controller tetap utuh (zero schema disruption).

---

## 🚀 REVISI V5 (2026-10-12): SPESIFIKASI TEKNIS KELOMPOK B

### B.1 Sistem Dual-Token Background Publik, Ritme Section, Separasi Kartu & Transisi Antar-Section

#### 1. Arsitektur Dual-Token Background Halaman Publik
Halaman publik PT Euodoo menyederhanakan palet latar belakang dari multi-surface lavender/ungu (`#FAF8FF`, `#EAEDFF`, `#F2F3FF`) menjadi **Sistem Dual-Token Neutral** yang bersih, stabil, dan berwibawa:
- **Token CSS Utama (`public/css/tokens.css`):**
  ```css
  :root {
    /* Dual-Token Background Halaman Publik (Revisi v5: #FFFFFF & #F8FAFC) */
    --bg-base: #ffffff;             /* Latar belakang putih bersih */
    --bg-subtle: #f8fafc;           /* Latar belakang slate neutral lembut */

    /* Token Semantik & Alias Kompatibilitas Background */
    --surface-white: #ffffff;
    --workspace: #f8fafc;
    --color-workspace-bg: #f8fafc;
    --surface: var(--bg-base);

    /* Brand Primary Foundations (Rebrand Palet Hijau v1) */
    --color-primary: #00755a;              /* Signature Forest Green - CTA & Brand Mark */
    --color-primary-dark: #00573f;         /* Deep Forest Green - Hover Link & Dark Heading */
    --color-primary-hover: #009476;        /* Rich Emerald Hover - State Transisi */
    --color-primary-bright: #00906e;       /* Vibrant Emerald Accent - Non-Text & Focus */
    --color-leaf: #7cbe38;                 /* Fresh Leaf Green - Aksen Dekoratif & Ikon */

    /* Surfaces Gelap & Transparan (Keputusan Terkunci 2026-10-17) */
    --surface-dark-footer: #00573f;        /* Latar Footer .site-footer (kontras teks putih 8.62:1 AAA) */
    --topbar-bg: rgba(0, 87, 63, 0.35);    /* Top bar transparan sangat tipis, compact padding 4-5px, blur ringan 4px */
    --hero-grad: linear-gradient(105deg, rgba(0, 87, 63, .45) 0%, rgba(0, 87, 63, .22) 50%, rgba(0, 87, 63, .08) 100%);

    /* Turunan Semantik Resmi & Status Semantik */
    --primary-subtle: #e6f7f2;             /* Tint hijau lembut (badge, tab aktif) */
    --primary-border: #a3e0d0;             /* Border hijau terkalibrasi */
    --color-on-primary: #ffffff;           /* Teks putih kontras di atas primary (5.69:1 AA) */
    --status-info: #334155;                /* Slate Neutral berwibawa (pengganti biru) */
    --status-info-bg: #f1f5f9;
    --status-info-border: #cbd5e1;
    --focus-ring: 0 0 0 3px rgba(0, 117, 90, 0.25);
    --shadow-primary: 0 2px 6px rgba(0, 117, 90, 0.20);
    --trans-cta-gradient: linear-gradient(135deg, #00573f 0%, #00755a 60%, #009476 100%);
  }
  ```
- **Eliminasi Total `#FAF8FF` & Seluruh Rona Biru (Rebrand Palet Hijau v1):**
  - Seluruh referensi heksadesimal warna biru lama (`#0055B8`, `#003F8B`, `#1D4ED8`, `#2563EB`, `#38BDF8`, `#0284C7`, `#EFF6FF`, `#BFDBFE`, dll.) pada `tokens.css`, `components.css`, `layout.css`, `admin.css`, view EJS, dan middleware digantikan tuntas oleh palet hijau v1.
  - Acceptance criteria gate: Pencarian string heksadesimal biru lama di seluruh direktori project wajib bernilai **nol temuan (0 matches)**.
- **Kebijakan Ketat Proteksi Copywriting (Strict Copywriting Preservation):**
  - Seluruh teks, salinan (*copywriting*), label, dan konten yang telah disesuaikan oleh pemilik situs (user) pada view template EJS maupun file locale JSON **DILARANG KERAS** diubah, ditimpa, atau di-reset ke nilai default. Rebrand HANYA mengubah warna dan presentasi visual.

#### 2. Aturan Ritme Section (Alternating Cadence)
Untuk menciptakan ritme visual yang seimbang, nyaman di mata, dan tidak monoton, section pada halaman publik diatur berselang-seling secara terstruktur:
- **Homepage (`views/public/index.ejs`):**
  1. `hero` (Hero Slider): Media Visual Video/Foto + Gradient Overlay Tipis `#00573F` (`linear-gradient(105deg, rgba(0, 87, 63, .45) 0%, rgba(0, 87, 63, .22) 50%, rgba(0, 87, 63, .08) 100%)`)
  2. `.sec-intro` (Company Intro): `--bg-base` (`#FFFFFF`)
  3. `.sec-products` (Katalog Produk Unggulan): `--bg-subtle` (`#F8FAFC`)
  4. `.sec-pillars` (Tiga Pilar Keunggulan): `--bg-base` (`#FFFFFF`)
  5. `.sec-evidence` (Sertifikasi & Bukti Mutu): `--bg-subtle` (`#F8FAFC`)
  6. `.sec-brands` (Portofolio Merek Terdaftar): `--bg-base` (`#FFFFFF`)
  7. `.sec-news` (Artikel Berita & Blog): `--bg-subtle` (`#F8FAFC`)
  8. `.sec-cta` (Banner Kontak): Gradient Hijau Industri (`#00573F` &rarr; `#00755A` &rarr; `#009476`)
  9. `footer`: `#00573F` (Primary-Dark, kontras teks putih 8.62:1 AAA)
- **Halaman Turunan / Inner Pages:**
  - Halaman Katalog Produk, Detail Produk, Berita, Detail Berita, Kontak, dan 404 menerapkan pola kontras selang-seling antara bodi halaman (`#F8FAFC`) dan kartu konten putih (`#FFFFFF`).

#### 3. Aturan Pemisahan Kartu dari Background (Card Separation - Keputusan Terkunci)
Kontras antara kartu dan section latar belakang dijamin memenuhi batas keterbacaan yang tegas:
- **Kartu di atas Section Subtle (`#F8FAFC`):**
  - Kartu wajib menggunakan latar `#FFFFFF` murni dengan border terkalibrasi `1px solid var(--border, #E2E8F0)` dan bayangan lembut elevasi `level-1` (`0 1px 3px rgba(10, 25, 47, 0.05)`).
- **Kartu di atas Section Putih (`#FFFFFF`) — Keputusan Terkunci Opsi 2A:**
  - Kartu section `#sec-pillars` saat diam menggunakan latar `#F8FAFC` dengan border `1px solid var(--border, #E2E8F0)`.
  - Saat hover/active, kartu bertransformasi ke background putih `#FFFFFF` dengan elevasi bayangan halus yang terangkat melalui pseudo-element `::after`.
- **Halaman Inner & Bacaan Detail — Keputusan Terkunci Opsi 3X:**
  - Halaman bacaan artikel (`/news/:slug`), spesifikasi produk (`/products/:slug`), formulir kontak (`/contact`), dan halaman error 404 menerapkan pola **Full Card Container**: bodi halaman berlatar `#F8FAFC`, dan konten utama dibungkus dalam kartu putih `#FFFFFF` ber-border halus dengan padding luas dan bayangan lembut.

#### 4. Aturan Transisi Antar-Section (Keputusan Terkunci: Opsi 1A - Soft Vertical Gradient Blend)
- Dilarang menambahkan warna ketiga.
- Mengadopsi **Soft Vertical Gradient Blend**: batas pertemuan antar-section yang berbeda warna (`#FFFFFF` &harr; `#F8FAFC`) dilengkapi gradien vertikal tipis (tinggi 36px–48px) dari `#F8FAFC` ke `#FFFFFF` atau sebaliknya (`linear-gradient(to bottom, #F8FAFC, #FFFFFF)` / `linear-gradient(to bottom, #FFFFFF, #F8FAFC)`).
- Menghasilkan efek visual yang mengalir, cair, modern, dan bebas dari patahan garis kaku.

#### 5. Arsitektur Animasi GPU & Aksesibilitas Kartu Section `#sec-pillars` (T-97)
- **Komposisi GPU 60fps via Pseudo-Element `::after`:**
  - Properti transisi dibatasi pada `transform` dan `opacity` untuk menghindari layout repaint.
  - Efek bayangan hover dialihkan ke `.pillar-card::after` dengan transisi `opacity: 0 &rarr; 1`.
  - Pergeseran warna latar dari `#F8FAFC` ke `#FFFFFF` berjalan mulus dengan transisi `background-color 250ms ease`.
  - Aturan hover dibungkus dalam `@media (hover: hover)` untuk mengeliminasi isu "sticky hover" pada layar sentuh ponsel/tablet.
  - Diberikan feedback sentuh `:active` (`transform: scale(0.98) translateY(-1px)`).
  - Dilengkapi fokus keyboard `:focus-visible` dan kepatuhan penuh pada `@media (prefers-reduced-motion: reduce)`.

---

## 🚀 REVISI V6 (2026-10-12): SPESIFIKASI TEKNIS CMS KONTEN HOMEPAGE V1 (KELOMPOK B & C)

### B.1 Fondasi Arsitektur Data, Migrasi Database & Komparasi Skema

#### 1. Komparasi Arsitektur Penyimpanan: Tabel Dedicated vs JSON di Tabel `settings`
Untuk menyimpan konten dinamis 4 section homepage (Intro, Pilar, Sertifikasi, CTA), terdapat dua opsi implementasi teknis:

| Parameter Evaluasi | Opsi A: Tabel Dedicated Khusus (Relasional) | Opsi B: Pola JSON Payload di Tabel `settings` (Terbukti Stabil) |
|---|---|---|
| **Struktur Skema** | Membuat tabel-tabel baru: `home_intro`, `home_pillars`, `home_certifications`, `global_cta`. | Memanfaatkan tabel `settings` eksisting key-value (`setting_key`, `setting_value`) dengan key terstandarisasi dan kolom JSON untuk daftar array. |
| **Integritas Tipe Data** | Sangat ketat, tipe data per kolom divalidasi langsung oleh mesin database MySQL (`VARCHAR`, `TEXT`, `INT`, `TINYINT`). | Fleksibel, struktur array divalidasi di level schema backend Node.js sebelum disimpan ke database. |
| **Kemudahan Query & Performa** | Memerlukan multi-table join atau 4 query terpisah per render homepage. | **Nol query tambahan di level controller publik**: data otomatis terambil dalam 1 query dictionary `settingModel.getAll()` yang sudah di-cache oleh `settingsMiddleware.js` (TTL 30s). |
| **Pola Konsistensi Codebase** | Menyerupai modul katalog produk (`products`) dan banner (`banners`). | **Identik dengan modul CMS Tentang Kami (`aboutModel.js`)**: `about_values_json`, `about_certifications_json`. Pola ini telah terbukti stabil di produksi. |
| **Kompleksitas Migrasi** | Memerlukan DDL `CREATE TABLE` baru, indeks, dan alter schema. | DDL migrasi sangat aman: hanya menjalankan `INSERT INTO settings ... ON DUPLICATE KEY UPDATE` tanpa risiko lock table. |
| **Rekomendasi Arsitektur** | Cocok jika di masa depan pilar/sertifikasi membutuhkan ratusan baris dan relasi many-to-many. | **Sangat direkomendasikan untuk v1**: ringan, cepat, selaras dengan arsitektur middleware cache, dan minim overhead. |

#### 2. Definisi Kunci Pengaturan & Skema Data (Format Opsi B & Mapping Opsi A)
Struktur field yang dikelola untuk 4 section:

```javascript
// Struktur Data Konten Homepage (homeContentModel.js)
{
  intro: {
    eyebrow_id: String,          // default: "TENTANG PT EUODOO"
    eyebrow_en: String,          // default: "ABOUT PT EUODOO"
    title_id: String,            // default: "Dedikasi Manufaktur Plastik Berkualitas Sejak 1990"
    title_en: String,            // default: "Over Three Decades of Plastic Film Manufacturing Excellence"
    paragraph_1_id: String,      // default: "Sejak berdiri pada tahun 1990 di Bandung..."
    paragraph_1_en: String,      // default: "Since our founding in 1990 in Bandung..."
    paragraph_2_id: String,      // default: "Dengan fasilitas produksi berkapasitas tinggi..."
    paragraph_2_en: String,      // default: "With high-capacity production facilities..."
    image_url: String,           // opsional via Media Library (default: "")
    is_active: Number            // 1 = aktif, 0 = nonaktif (default: 1)
  // [DEPRECATED / USANG per 2026-10-19: Digantikan oleh skema why_choose_us di Bagian 15]
  pillars: {
    title_id: String,            // default: "Tiga Pilar Keunggulan Kami"
    title_en: String,            // default: "Three Pillars of Manufacturing Excellence"
    subtitle_id: String,         // default: "Komitmen menyeluruh dalam menghadirkan standar mutu plastik terdepan bagi mitra B2B."
    subtitle_en: String,         // default: "Our unwavering commitment to precision, production capacity, and environmental sustainability."
    is_active: Number,           // 1 = aktif, 0 = nonaktif (default: 1)
    items: [                     // Array of Pillar Objects
      {
        icon: String,            // "factory" | "shield" | "leaf" | "gear" | "award"
        title_id: String,
        title_en: String,
        desc_id: String,
        desc_en: String,
        sort_order: Number,
        is_active: Number
      }
    ]
  },
  certifications: {
    title_id: String,            // default: "Sertifikasi Mutu & Komitmen Lingkungan"
    title_en: String,            // default: "Verified Quality & Eco-Certifications"
    body_id: String,             // default: "Standar produksi kami didukung sertifikasi resmi nasional..."
    body_en: String,             // default: "Our manufacturing processes strictly comply..."
    btn_text_id: String,         // default: "Pelajari Detail Sertifikasi"
    btn_text_en: String,         // default: "Learn More About Certifications"
    btn_url: String,             // default: "/about#sertifikasi"
    show_btn: Number,            // 1 = tampil, 0 = sembunyikan (default: 1)
    is_active: Number,           // 1 = aktif, 0 = nonaktif (default: 1)
    items: [                     // Array of Certification Objects
      {
        name: String,            // mis. "SNI 7188.7:2011"
        desc_id: String,
        desc_en: String,
        logo_url: String,        // opsional via Media Library (default: "")
        sort_order: Number,
        is_active: Number
      }
    ]
  },
  cta: {
    title_id: String,            // default: "Mulai Kemitraan Manufaktur Bersama PT. EUODOO"
    title_en: String,            // default: "Start Your Manufacturing Partnership with PT. EUODOO"
    subtitle_id: String,         // default: "Konsultasikan kebutuhan spesifikasi kantong plastik..."
    subtitle_en: String,         // default: "Consult with our experienced production..."
    btn1_title_id: String,       // default: "Hubungi Tim Pemasaran"
    btn1_title_en: String,       // default: "Contact Sales & Engineering"
    btn1_sub_id: String,         // default: "Formulir penawaran harga dan konsultasi"
    btn1_sub_en: String,         // default: "Submit RFQ form and technical inquiries"
    btn1_url: String,            // default: "/contact"
    btn2_title_id: String,       // default: "Kirim Pesan WhatsApp"
    btn2_title_en: String,       // default: "Direct WhatsApp Consultation"
    btn2_sub_id: String,         // default: "Respon cepat dari tim sales kami"
    btn2_sub_en: String,         // default: "Fast response from our customer support"
    btn2_url: String,            // default: "" (fallback otomatis ke settings.whatsapp_url)
    is_active: Number            // 1 = aktif, 0 = nonaktif (default: 1)
  }
}
```

#### 3. Naskah SQL Migrasi & Seed Default Identik (`006_create_home_content_settings.sql`)
File migrasi `database/migrations/006_create_home_content_settings.sql` menyematkan data awal yang **100% SAMA PERSIS** dengan tampilan statis publik saat ini:

```sql
-- ========================================================
-- MIGRATION: 006_create_home_content_settings.sql
-- PT Euodoo - Default Data CMS Konten Homepage v1
-- Sumber Acuan: views/public/index.ejs eksisting
-- ========================================================

INSERT INTO settings (setting_key, setting_value)
VALUES
  -- 1. SECTION INTRO
  ('home_intro_eyebrow_id', 'TENTANG PT EUODOO'),
  ('home_intro_eyebrow_en', 'ABOUT PT EUODOO'),
  ('home_intro_title_id', 'Dedikasi Manufaktur Plastik Berkualitas Sejak 1990'),
  ('home_intro_title_en', 'Over Three Decades of Plastic Film Manufacturing Excellence'),
  ('home_intro_paragraph_1_id', 'Sejak berdiri pada tahun 1990 di Bandung, Jawa Barat (bermula dari PT Sahabat Baru dan PT Pelita Baru), PT EUODOO telah memproduksi kantong plastik HDPE dan LLDPE berkualitas tinggi untuk jaringan ritel modern, pasar grosir tradisional, dan sektor industri nasional.'),
  ('home_intro_paragraph_1_en', 'Since our founding in 1990 in Bandung, West Java (originating from PT Sahabat Baru and PT Pelita Baru), PT EUODOO has been producing high-grade HDPE and LLDPE plastic bags for modern retail chains, traditional wholesale hubs, and industrial sectors.'),
  ('home_intro_paragraph_2_id', 'Dengan fasilitas produksi berkapasitas tinggi di Cigondewah dan kantor manajemen di Palmerah Jakarta, kami menggabungkan teknologi ekstrusi film mutakhir, formula ramah lingkungan 100% degradable berstandar SNI, serta ketelitian presisi demi kepuasan mitra usaha di seluruh Indonesia.'),
  ('home_intro_paragraph_2_en', 'With high-capacity production facilities in Cigondewah and corporate offices in Palmerah Jakarta, we integrate advanced blown film extrusion lines, certified 100% degradable formulations under SNI standards, and strict quality control for partners across Indonesia.'),
  ('home_intro_image_url', ''),
  ('home_intro_is_active', '1'),

  -- 2. SECTION 3 PILAR KEUNGGULAN
  ('home_pillars_title_id', 'Tiga Pilar Keunggulan Kami'),
  ('home_pillars_title_en', 'Three Pillars of Manufacturing Excellence'),
  ('home_pillars_subtitle_id', 'Komitmen menyeluruh dalam menghadirkan standar mutu plastik terdepan bagi mitra B2B.'),
  ('home_pillars_subtitle_en', 'Our unwavering commitment to precision, production capacity, and environmental sustainability.'),
  ('home_pillars_is_active', '1'),
  ('home_pillars_json', '[{"icon":"factory","title_id":"Teknologi & Kapasitas Produksi","title_en":"High-Volume Production Capacity","desc_id":"Didukung deretan mesin ekstrusi multi-layer modern dan converting line berkecepatan tinggi di Cigondewah untuk menjamin ketepatan jadwal pasokan skala besar.","desc_en":"Equipped with multi-layer blown film extruders, automated precision bag-making lines, and multi-color flexographic printing machines.","sort_order":1,"is_active":1},{"icon":"shield","title_id":"Standar Mutu & Presisi Konsisten","title_en":"Consistent Quality & Precision","desc_id":"Penerapan kontrol kualitas berkala meliputi uji ketahanan jatuh (drop-test), segel anti-bocor star-seal, dan ketebalan mikron yang konsisten di setiap batch.","desc_en":"Rigorous quality control protocols verifying tensile elongation, drop-impact resistance, seal integrity, and micron uniformity.","sort_order":2,"is_active":1},{"icon":"leaf","title_id":"Solusi Ramah Lingkungan OXIUM","title_en":"Sustainable OXIUM® Degradable","desc_id":"Pionir penerapan aditif OXIUM teruji 100% terdegradasi menjadi biomassa dan air tanpa menyisakan mikroplastik berbahaya, berstandar resmi SNI.","desc_en":"Certified 100% degradable technology tested under US ASTM D6954 standards and Indonesian Green Label SNI 7188.7:2011.","sort_order":3,"is_active":1}]'),

  -- 3. SECTION SERTIFIKASI MUTU
  ('home_cert_title_id', 'Sertifikasi Mutu & Komitmen Lingkungan'),
  ('home_cert_title_en', 'Verified Quality & Eco-Certifications'),
  ('home_cert_body_id', 'Standar produksi kami didukung sertifikasi resmi nasional dan pengujian laboratorium terakreditasi, memastikan setiap produk aman digunakan, kuat, dan memenuhi regulasi ramah lingkungan.'),
  ('home_cert_body_en', 'Our manufacturing processes strictly comply with national standards and certified laboratory testing, ensuring packaging safety, durability, and full regulatory compliance.'),
  ('home_cert_btn_text_id', 'Pelajari Detail Sertifikasi'),
  ('home_cert_btn_text_en', 'Learn More About Certifications'),
  ('home_cert_btn_url', '/about#sertifikasi'),
  ('home_cert_show_btn', '1'),
  ('home_cert_is_active', '1'),
  ('home_cert_items_json', '[{"name":"SNI 7188.7:2011","desc_id":"Standar Nasional Indonesia untuk kantong belanja mudah terurai","desc_en":"Indonesian National Standard for degradable shopping bags","logo_url":"","sort_order":1,"is_active":1},{"name":"OXIUM® Technology","desc_id":"Formula degradasi alami berstandar internasional ASTM D6954","desc_en":"US ASTM D6954 certified oxo-biodegradable formulation","logo_url":"","sort_order":2,"is_active":1},{"name":"InSWA Eco Label","desc_id":"Sertifikasi Resmi Asosiasi Pengelolaan Sampah Indonesia","desc_en":"Endorsed by Indonesia Solid Waste Association","logo_url":"","sort_order":3,"is_active":1},{"name":"Virgin Food-Grade Contact","desc_id":"Bahan baku murni higienis aman untuk produk pangan dan retail","desc_en":"Pure non-recycled polymers safe for food contact","logo_url":"","sort_order":4,"is_active":1}]'),

  -- 4. SECTION CTA GLOBAL
  ('global_cta_title_id', 'Mulai Kemitraan Manufaktur Bersama PT. EUODOO'),
  ('global_cta_title_en', 'Start Your Manufacturing Partnership with PT. EUODOO'),
  ('global_cta_subtitle_id', 'Konsultasikan kebutuhan spesifikasi kantong plastik, ukuran kustom, dan volume pesanan bisnis Anda bersama tim teknis dan pemasaran kami.'),
  ('global_cta_subtitle_en', 'Consult with our experienced production and engineering team to develop custom plastic bag packaging tailored to your brand, strength parameters, and delivery schedules.'),
  ('global_cta_btn1_title_id', 'Hubungi Tim Pemasaran'),
  ('global_cta_btn1_title_en', 'Contact Sales & Engineering'),
  ('global_cta_btn1_sub_id', 'Formulir penawaran harga dan konsultasi'),
  ('global_cta_btn1_sub_en', 'Submit RFQ form and technical inquiries'),
  ('global_cta_btn1_url', '/contact'),
  ('global_cta_btn2_title_id', 'Kirim Pesan WhatsApp'),
  ('global_cta_btn2_title_en', 'Direct WhatsApp Consultation'),
  ('global_cta_btn2_sub_id', 'Respon cepat dari tim sales kami'),
  ('global_cta_btn2_sub_en', 'Fast response from our customer support'),
  ('global_cta_btn2_url', ''),
  ('global_cta_pages_json', '{"home":1,"about":1,"products":1,"product_detail":1,"capabilities":1,"news":1,"news_detail":1,"contact":0,"404":0}'),
  ('global_cta_is_active', '1')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
```

#### 4. Lapisan Model Data & Fallback Runtime (`models/homeContentModel.js`)
Model backend menyediakan metode getter yang tahan banting (*defensive programming*):
- Menggabungkan data dari database dengan struktur default `getDefaults()`.
- Jika salah satu kunci bernilai null/undefined atau string JSON tidak valid, fungsi otomatis menyajikan fallback default teks statis tanpa melempar error.
- Menyediakan metode `updateHomeContent(payload)` yang menyimpan seluruh kunci secara atomik dan langsung mengeksekusi `clearSettingsCache()` untuk membatalkan cache in-memory.

---

### B.2 Spesifikasi Teknis Section Intro Homepage (`.sec-intro`)

1. **Rendering Dinamis di Template EJS (`views/public/index.ejs`):**
   ```ejs
   <% if (homeContent && homeContent.intro && homeContent.intro.is_active !== 0) { 
     const intro = homeContent.intro;
     const introTitle = currentLang === 'en' ? (intro.title_en || intro.title_id) : intro.title_id;
     const introP1 = currentLang === 'en' ? (intro.paragraph_1_en || intro.paragraph_1_id) : intro.paragraph_1_id;
     const introP2 = currentLang === 'en' ? (intro.paragraph_2_en || intro.paragraph_2_id) : intro.paragraph_2_id;
     const introEyebrow = currentLang === 'en' ? (intro.eyebrow_en || intro.eyebrow_id) : intro.eyebrow_id;
   %>
   <section class="sec-intro" id="intro">
     <div class="container">
       <div class="intro-layout reveal <%= intro.image_url ? 'has-media' : '' %>">
         <div>
           <% if (introEyebrow) { %>
             <span class="intro-eyebrow"><%= introEyebrow %></span>
           <% } %>
           <h2><%= introTitle %></h2>
           <% if (intro.image_url) { %>
             <div class="intro-media-wrap">
               <img src="<%= intro.image_url %>" alt="<%= introTitle %>" loading="lazy" class="intro-media-img">
             </div>
           <% } %>
         </div>
         <div class="intro-body-wrap">
           <p style="margin-bottom: 16px;"><%= introP1 %></p>
           <p><%= introP2 %></p>
         </div>
       </div>
     </div>
   </section>
   <% } %>
   ```
2. **Pola Desain Responsif & Media Split:**
   - Bila `intro.image_url` tidak diisi (kondisi default saat ini), kelas `.has-media` tidak aktif, mempertahankan layout grid 2 kolom asli berlatar `--bg-base` (`#FFFFFF`).
   - Bila `intro.image_url` diisi, gambar terpasang secara proporsional dengan aspect-ratio 16:10, sudut lengkung `var(--r-xl)`, border halus, dan bayangan elevasi `level-1`.

---

### B.3 Spesifikasi Teknis Section 3 Pilar Keunggulan (`.sec-pillars`)

1. **Preset Ikon Semantik SVG:**
   Untuk mencegah injeksi kode SVG sembarangan dari textarea admin dan menjamin ketajaman visual, sistem menyediakan pemetaan preset ikon terkurasi:
   - `'factory'`: Representasi fasilitas ekstrusi dan converting line modern.
   - `'shield'`: Representasi jaminan mutu drop-test dan toleransi mikron presisi.
   - `'leaf'`: Representasi formula aditif ramah lingkungan OXIUM® SNI.
   - `'gear'`: Representasi otomatisasi mesin dan rekayasa formulasi polimer.
   - `'award'`: Representasi kepatuhan sertifikasi dan standar ekspor.
2. **Rendering Kartu & Kepatuhan Revisi v5:**
   ```ejs
   <% if (homeContent && homeContent.pillars && homeContent.pillars.is_active !== 0) { 
     const pData = homeContent.pillars;
     const pTitle = currentLang === 'en' ? (pData.title_en || pData.title_id) : pData.title_id;
     const pSub = currentLang === 'en' ? (pData.subtitle_en || pData.subtitle_id) : pData.subtitle_id;
     const items = (pData.items || []).filter(item => item.is_active !== 0).sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0));
   %>
   <section class="sec-pillars" id="pilar">
     <div class="container">
       <div class="pillars-header reveal">
         <h2><%= pTitle %></h2>
         <p><%= pSub %></p>
       </div>
       <div class="pillars-grid reveal">
         <% items.forEach(item => { 
           const itemTitle = currentLang === 'en' ? (item.title_en || item.title_id) : item.title_id;
           const itemDesc = currentLang === 'en' ? (item.desc_en || item.desc_id) : item.desc_id;
         %>
           <div class="pillar-card" tabindex="0" role="region" aria-label="<%= itemTitle %>">
             <div class="pillar-icon">
               <%- getPillarIconSvg(item.icon) %>
             </div>
             <h3 class="pillar-title"><%= itemTitle %></h3>
             <p class="pillar-desc"><%= itemDesc %></p>
           </div>
         <% }); %>
       </div>
     </div>
   </section>
   <% } %>
   ```
   - Seluruh aturan CSS animasi GPU `::after`, `@media (hover: hover)`, feedback sentuh `:active`, dan `@media (prefers-reduced-motion: reduce)` bekerja utuh tanpa modifikasi stylesheet.

---

### B.4 Spesifikasi Teknis Section Sertifikasi Mutu (`.sec-evidence`)

1. **Rendering Dinamis & Logo/Centang Fallback:**
   ```ejs
   <% if (homeContent && homeContent.certifications && homeContent.certifications.is_active !== 0) { 
     const cert = homeContent.certifications;
     const certTitle = currentLang === 'en' ? (cert.title_en || cert.title_id) : cert.title_id;
     const certBody = currentLang === 'en' ? (cert.body_en || cert.body_id) : cert.body_id;
     const certBtnText = currentLang === 'en' ? (cert.btn_text_en || cert.btn_text_id) : cert.btn_text_id;
     const certItems = (cert.items || []).filter(i => i.is_active !== 0).sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0));
   %>
   <section class="sec-evidence" id="sertifikasi">
     <div class="container">
       <div class="ev-layout">
         <div class="reveal">
           <h2><%= certTitle %></h2>
           <p class="ev-body"><%= certBody %></p>
           <% if (cert.show_btn !== 0 && certBtnText) { %>
             <a href="<%= cert.btn_url || '/about#sertifikasi' %>" class="btn btn-primary">
               <span><%= certBtnText %></span>
               <span aria-hidden="true">&rarr;</span>
             </a>
           <% } %>
         </div>
         <div class="cert-grid reveal">
           <% certItems.forEach(item => { 
             const itemDesc = currentLang === 'en' ? (item.desc_en || item.desc_id) : item.desc_id;
           %>
             <div class="cert-item">
               <% if (item.logo_url) { %>
                 <img src="<%= item.logo_url %>" alt="<%= item.name %>" class="cert-logo-img" loading="lazy">
               <% } else { %>
                 <span class="cert-chk">&#10003;</span>
               <% } %>
               <div>
                 <div class="cert-name"><%= item.name %></div>
                 <div class="cert-desc"><%= itemDesc %></div>
               </div>
             </div>
           <% }); %>
         </div>
       </div>
     </div>
   </section>
   <% } %>
   ```
2. **Analisis Relasi dengan CMS Tentang Kami:**
   - Disimpulkan bahwa sumber data **HARUS TERPISAH (DECOUPLED)** antara homepage dan halaman Tentang Kami:
     - Homepage membutuhkan 4 butir penegasan mutu cepat yang berorientasi meyakinkan buyer dalam waktu 3 detik pertama.
     - Halaman Tentang Kami menyajikan 3 sertifikasi berformat lembaga penerbit (`issuer`), nama badge (`badge`), dan narasi kebijakan mutu menyeluruh.
     - Menggabungkan keduanya akan memaksa struktur yang tidak kompatibel dan membatasi fleksibilitas copywriting marketing di beranda.

---

### B.5 Spesifikasi Teknis Section CTA Global Pre-Footer (`views/partials/cta-global.ejs`)

1. **Pembuatan File Partial Reusable:**
   File baru `views/partials/cta-global.ejs` dibuat untuk menggantikan salinan statis di `views/public/index.ejs` dan `views/public/about.ejs`:
   ```ejs
   <% 
     // Visibilitas Halaman Terkendali Admin (Keputusan Terkunci Opsi 4B)
     const currentPath = typeof path !== 'undefined' ? path : '';
     const ctaData = (typeof settings !== 'undefined' && settings?.globalCta) ? settings.globalCta : null;
     
     // Mapping halaman saat ini
     let pageKey = 'home';
     if (currentPath === '/' || currentPath === '') pageKey = 'home';
     else if (currentPath.startsWith('/about')) pageKey = 'about';
     else if (currentPath === '/products') pageKey = 'products';
     else if (currentPath.startsWith('/products/')) pageKey = 'product_detail';
     else if (currentPath.startsWith('/capabilities')) pageKey = 'capabilities';
     else if (currentPath === '/news') pageKey = 'news';
     else if (currentPath.startsWith('/news/')) pageKey = 'news_detail';
     else if (currentPath.startsWith('/contact')) pageKey = 'contact';
     else if (currentPath === '/404') pageKey = '404';

     const pagesConfig = (ctaData && ctaData.pages) ? ctaData.pages : {
       home: 1, about: 1, products: 1, product_detail: 1, capabilities: 1, news: 1, news_detail: 1, contact: 0, '404': 0
     };

     const isPageEnabled = pagesConfig[pageKey] === 1 || pagesConfig[pageKey] === true || pagesConfig[pageKey] === '1';
     const isCtaActive = ctaData ? (ctaData.is_active !== 0 && ctaData.is_active !== '0') : true;
     const shouldShowCta = isCtaActive && isPageEnabled && !(typeof hideGlobalCta !== 'undefined' && hideGlobalCta);
   %>
   <% if (shouldShowCta) { 
     const ctaTitle = ctaData ? (currentLang === 'en' ? (ctaData.title_en || ctaData.title_id) : ctaData.title_id) : (currentLang === 'en' ? 'Start Your Manufacturing Partnership with PT. EUODOO' : 'Mulai Kemitraan Manufaktur Bersama PT. EUODOO');
     const ctaSub = ctaData ? (currentLang === 'en' ? (ctaData.subtitle_en || ctaData.subtitle_id) : ctaData.subtitle_id) : (currentLang === 'en' ? 'Consult with our experienced production and engineering team to develop custom plastic bag packaging tailored to your brand, strength parameters, and delivery schedules.' : 'Konsultasikan kebutuhan spesifikasi kantong plastik, ukuran kustom, dan volume pesanan bisnis Anda bersama tim teknis dan pemasaran kami.');
     
     const btn1Title = ctaData ? (currentLang === 'en' ? (ctaData.btn1_title_en || ctaData.btn1_title_id) : ctaData.btn1_title_id) : (currentLang === 'en' ? 'Contact Sales & Engineering' : 'Hubungi Tim Pemasaran');
     const btn1Sub = ctaData ? (currentLang === 'en' ? (ctaData.btn1_sub_en || ctaData.btn1_sub_id) : ctaData.btn1_sub_id) : (currentLang === 'en' ? 'Submit RFQ form and technical inquiries' : 'Formulir penawaran harga dan konsultasi');
     const btn1Url = (ctaData && ctaData.btn1_url) ? ctaData.btn1_url : '/contact';

     const btn2Title = ctaData ? (currentLang === 'en' ? (ctaData.btn2_title_en || ctaData.btn2_title_id) : ctaData.btn2_title_id) : (currentLang === 'en' ? 'Direct WhatsApp Consultation' : 'Kirim Pesan WhatsApp');
     const btn2Sub = ctaData ? (currentLang === 'en' ? (ctaData.btn2_sub_en || ctaData.btn2_sub_id) : ctaData.btn2_sub_id) : (currentLang === 'en' ? 'Fast response from our customer support' : 'Respon cepat dari tim sales kami');
     const btn2Url = (ctaData && ctaData.btn2_url) ? ctaData.btn2_url : (settings?.whatsapp_url || 'https://wa.me/628123456789');
   %>
   <section class="sec-cta" id="global-cta">
     <div class="container">
       <div class="cta-layout reveal">
         <div>
           <h2><%= ctaTitle %></h2>
           <p><%= ctaSub %></p>
         </div>
         <div class="cta-actions">
           <a href="<%= btn1Url %>" class="cta-card">
             <div>
               <div class="cta-card-title"><%= btn1Title %></div>
               <div class="cta-card-sub"><%= btn1Sub %></div>
             </div>
             <span class="cta-card-arrow">&#8594;</span>
           </a>
           <a href="<%= btn2Url %>" class="cta-card" <%= btn2Url.includes('wa.me') || btn2Url.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : '' %>>
             <div>
               <div class="cta-card-title"><%= btn2Title %></div>
               <div class="cta-card-sub"><%= btn2Sub %></div>
             </div>
             <span class="cta-card-arrow">&#8594;</span>
           </a>
         </div>
       </div>
     </div>
   </section>
   <% } %>
   ```
2. **Penyisipan Terpusat di Layout:**
   Partial ini disematkan tepat sebelum `<%- include('../partials/footer') %>` pada layout atau di seluruh template halaman publik, menjamin ketersediaan global tanpa mengulang markup.

---

### B.6 Spesifikasi Teknis Menu Admin "Konten Homepage" & Keamanan

1. **Tabel Routing Admin (`routes/adminRoutes.js`):**
   ```javascript
   // Menu CMS Konten Homepage
   router.get('/home-content', requireAuth, requireRole(['superadmin', 'admin']), homeContentController.index);
   router.post('/home-content', requireAuth, requireRole(['superadmin', 'admin']), homeContentController.update);
   ```
2. **Controller (`controllers/admin/homeContentController.js`):**
   - Mengambil data melalui `homeContentModel.getHomeContentData()`.
   - Mengirim data ke tampilan `views/admin/home-content/index.ejs`.
   - Menangani update formulir POST:
     - Melakukan trim dan sanitasi string.
     - Memvalidasi batas panjang karakter:
       - Eyebrow: maks 100 karakter.
       - Judul: maks 255 karakter.
       - Narasi/Paragraf: maks 2.000 karakter.
       - Tautan URL: maks 500 karakter.
     - Menyusun payload dan mengeksekusi `homeContentModel.updateHomeContent(payload)`.
     - Mengarahkan kembali ke `/admin/home-content?success=Konten+homepage+berhasil+diperbarui.`
3. **Pencegahan Keamanan:**
   - **CSRF Token:** Input tersembunyi `<input type="hidden" name="_csrf" value="<%= csrfToken %>">` dan parameter aksi form `action="/admin/home-content?_csrf=<%= csrfToken %>"`.
   - **XSS Sanitasi:** Menolak tag executable (`<script>`, inline javascript) pada seluruh input teks.
   - **Escape Output EJS:** Menggunakan escape tag standar (`<%= %>`) pada seluruh output teks di antarmuka publik.

---

### C.1 Spesifikasi Reusable UI Admin (Gaya Liquid Glass & Navigasi Tab)

1. **Penggunaan Ulang Kelas Desain CMS Tentang Kami:**
   - Menghindari pembuatan stylesheet paralel. Form admin Konten Homepage memanfaatkan token yang sudah ada:
     - `.about-tabs-nav`: Kontainer tab responsif dengan border halus `var(--border-main)` dan layout flex horizontal.
     - `.about-tab-btn`: Tombol tab interaktif dengan ikon SVG, label teks semantik, active indicator line hijau `--primary` (`#00755A`), dan transisi `var(--trans-fast)`.
     - `.about-tab-pane`: Panel konten tab yang ditampilkan/disembunyikan via JavaScript client-side tanpa reload halaman.
     - `.about-glass-card`: Kartu pembungkus form dengan efek Liquid Glass (background `#ffffff` dengan border halus `1px solid var(--border-main)`, border-radius `var(--r-xl)`, bayangan lembut `var(--shadow-xs)`).
     - `.about-sticky-actions`: Bilah aksi mengambang di bawah halaman berisi status indikator dot hijau dan tombol submit primer berkontras tinggi.
2. **Integrasi Universal Media Picker Modal:**
   - Field gambar intro dan logo sertifikasi menggunakan komponen standar picker:
     ```html
     <div class="media-picker-component">
       <input type="hidden" id="intro_image_url" name="intro_image_url" value="<%= intro.image_url || '' %>">
       <div class="media-picker-preview-box">
         <img src="<%= intro.image_url || '' %>" alt="Pratinjau" style="<%= intro.image_url ? 'display: block;' : 'display: none;' %>">
         <div class="media-picker-empty" style="<%= intro.image_url ? 'display: none;' : '' %>">
           <span>Belum ada gambar dipilih</span>
         </div>
       </div>
       <div class="media-picker-ctrls">
         <button type="button" class="btn btn-secondary btn-sm btn-open-media-picker" data-target="intro_image_url" data-picker-type="image">Pilih dari Media Library</button>
         <button type="button" class="btn btn-ghost btn-sm btn-clear-media" style="<%= intro.image_url ? '' : 'display: none;' %>">Hapus</button>
       </div>
     </div>
     ```

---

### C.2 Checklist Regresi Admin, Penegakan Dual-Token Background & Uji Responsif

1. **Checklist Regresi 13 Menu Admin (Zero Regression Guarantee):**
   Pengujian wajib mencakup verifikasi fungsi CRUD dan tampilan visual 13 modul admin:
   - [ ] 1. Dashboard (`/admin/dashboard`)
   - [ ] 2. Inquiry & RFQ (`/admin/inquiries`)
   - [ ] 3. Banner Hero Slider (`/admin/banners`)
   - [ ] 4. Kategori Produk (`/admin/product-categories`)
   - [ ] 5. Katalog Produk (`/admin/products`)
   - [ ] 6. Merek Terdaftar (`/admin/brands`)
   - [ ] 7. Kategori Berita (`/admin/post-categories`)
   - [ ] 8. Berita & Artikel (`/admin/posts`)
   - [ ] 9. Media Library (`/admin/media`)
   - [ ] 10. Tentang Kami (`/admin/about`)
   - [ ] 11. Halaman Kontak (`/admin/contact`)
   - [ ] 12. Hero Banner Halaman (`/admin/hero-banners`)
   - [ ] 13. Pengaturan Situs (`/admin/settings`)
2. **Penegakan Ritme Dual-Token Background Publik & Palet Hijau:**
   - Seluruh section publik wajib berselang-seling patuh pada aturan revisi v5:
     - Hero Slider: Dark Overlay Media (`rgba(0, 87, 63, .48)`)
     - Section Intro: `--bg-base` (`#FFFFFF`)
     - Section Produk: `--bg-subtle` (`#F8FAFC`)
     - Section Pilar Keunggulan: `--bg-base` (`#FFFFFF`)
     - Section Sertifikasi Mutu: `--bg-subtle` (`#F8FAFC`)
     - Section Merek: `--bg-base` (`#FFFFFF`)
     - Section Berita: `--bg-subtle` (`#F8FAFC`)
     - Section CTA Global: Corporate Green Gradient (`#00573F` &rarr; `#00755A` &rarr; `#009476`)
     - Footer: Corporate Dark Surface (`#071F17` / `#0F172A`)
   - Tidak ada kode warna lavender `#FAF8FF` maupun rona biru yang kembali muncul.
3. **Uji Multi-Breakpoint Bebas Horizontal Overflow (320px s/d Desktop):**
   - Layar ponsel 320px–375px: Kartu pilar, sertifikasi, dan tombol CTA melipat rapi menjadi single column dengan padding minimal 16px, bebas layout breaking, dan target sentuh tombol minimal 44×44px.

---

## 🔄 Finalisasi & Alur Lanjutan
Dokumen Tech Spec v2.0 telah diperbarui mencakup spesifikasi arsitektur teknis lengkap untuk Fitur Baru Kelompok B (B.1 s/d B.6) dan Kelompok C (C.1 & C.2). Seluruh dokumen siap ditinjau dan divalidasi oleh User sebelum tahap pengerjaan kode.

---

## BAGIAN 8: Revisi Halaman Tentang Kami & Gallery v1

### 8.1 Skema Database Baru

#### Tabel `about_gallery_slides`

```sql
CREATE TABLE IF NOT EXISTS about_gallery_slides (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  image_url VARCHAR(500) NOT NULL COMMENT 'URL WebP dari media library (Wajib)',
  category_id VARCHAR(100) DEFAULT '' COMMENT 'Tag/kategori slide (ID, Opsional)',
  category_en VARCHAR(100) DEFAULT '' COMMENT 'Tag/kategori slide (EN, Opsional)',
  title_id VARCHAR(255) NULL DEFAULT '' COMMENT 'Judul slide (ID, Opsional - Revisi v3 B1)',
  title_en VARCHAR(255) DEFAULT '' COMMENT 'Judul slide (EN, Opsional)',
  subtitle_id VARCHAR(500) DEFAULT '' COMMENT 'Subjudul slide (ID, Opsional)',
  subtitle_en VARCHAR(500) DEFAULT '' COMMENT 'Subjudul slide (EN, Opsional)',
  sort_order INT UNSIGNED DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_gallery_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrasi Revisi v3 (B1): 008_make_about_gallery_title_nullable.sql
ALTER TABLE about_gallery_slides MODIFY COLUMN title_id VARCHAR(255) NULL DEFAULT '';
```

#### Tabel `about_stats`

```sql
CREATE TABLE IF NOT EXISTS about_stats (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  stat_value VARCHAR(50) NOT NULL COMMENT 'Angka/teks statistik (mis. 30+)',
  label_id VARCHAR(255) NOT NULL COMMENT 'Label statistik (ID)',
  label_en VARCHAR(255) DEFAULT '' COMMENT 'Label statistik (EN)',
  sort_order INT UNSIGNED DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_stats_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Tabel `about_timeline`

```sql
CREATE TABLE IF NOT EXISTS about_timeline (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  year_label_id VARCHAR(100) NOT NULL COMMENT 'Label tahun (ID, mis. 1990 — Awal Berdiri)',
  year_label_en VARCHAR(100) DEFAULT '' COMMENT 'Label tahun (EN)',
  title_id VARCHAR(255) NOT NULL COMMENT 'Judul item timeline (ID)',
  title_en VARCHAR(255) DEFAULT '' COMMENT 'Judul item timeline (EN)',
  description_id TEXT COMMENT 'Deskripsi item timeline (ID)',
  description_en TEXT COMMENT 'Deskripsi item timeline (EN)',
  sort_order INT UNSIGNED DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_timeline_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Key Baru di Tabel `settings`

| Key | Deskripsi | Default |
|---|---|---|
| `about_gallery_kicker_id` | Kicker label gallery (ID) | `Galeri Kami` |
| `about_gallery_kicker_en` | Kicker label gallery (EN) | `Our Gallery` |
| `about_gallery_title_id` | Judul section gallery (ID) | `Di Dalam Operasional Kami` |
| `about_gallery_title_en` | Judul section gallery (EN) | `Inside Our Operations` |
| `about_gallery_body_id` | Paragraf deskripsi gallery (ID) | `Sepintas aktivitas produksi...` |
| `about_gallery_body_en` | Paragraf deskripsi gallery (EN) | `A glimpse of production...` |
| `about_story_kicker_id` | Kicker label sejarah (ID) | `Kisah Kami` |
| `about_story_kicker_en` | Kicker label sejarah (EN) | `Our Story` |
| `vision_image_url` | URL gambar foto Visi | `''` (kosong) |
| `mission_image_url` | URL gambar foto Misi | `''` (kosong) |

### 8.2 Model Layer

#### `models/aboutGalleryModel.js` (File Baru)

```javascript
// Fungsi: getAll(activeOnly), getById(id), create(data), update(id, data), delete(id), reorder(items)
// Query pattern: parameterized mysql2/promise, ORDER BY sort_order ASC
// activeOnly filter: WHERE is_active = 1
```

#### `models/aboutStatsModel.js` (File Baru)

```javascript
// Fungsi: getAll(activeOnly), getById(id), create(data), update(id, data), delete(id), reorder(items)
// Maks 8 item validasi di controller
```

#### `models/aboutTimelineModel.js` (File Baru)

```javascript
// Fungsi: getAll(activeOnly), getById(id), create(data), update(id, data), delete(id), reorder(items)
// Tanpa batas jumlah
```

#### `models/aboutModel.js` (Extend)

```javascript
// Tambah getter: getGalleryHeader(), getStoryHeader()
// Tambah getter: getVisionImage(), getMissionImage()
// Pattern: baca dari settings via settingModel.getByKey()
// Backward compatibility: biarkan defaults dan getter lokasi tetap ada agar footer/kontak tidak terganggu (Opsi A)
```

### 8.3 Route Baru (Admin)

| Method | Path | Handler | Deskripsi |
|---|---|---|---|
| `POST` | `/admin/about/gallery` | `aboutController.storeGallerySlide` | Tambah slide gallery |
| `POST` | `/admin/about/gallery/:id/update` | `aboutController.updateGallerySlide` | Edit slide |
| `POST` | `/admin/about/gallery/:id/delete` | `aboutController.deleteGallerySlide` | Hapus slide |
| `POST` | `/admin/about/stats` | `aboutController.storeStats` | Tambah item statistik |
| `POST` | `/admin/about/stats/:id/update` | `aboutController.updateStats` | Edit statistik |
| `POST` | `/admin/about/stats/:id/delete` | `aboutController.deleteStats` | Hapus statistik |
| `POST` | `/admin/about/timeline` | `aboutController.storeTimeline` | Tambah item timeline |
| `POST` | `/admin/about/timeline/:id/update` | `aboutController.updateTimeline` | Edit timeline |
| `POST` | `/admin/about/timeline/:id/delete` | `aboutController.deleteTimeline` | Hapus timeline |

### 8.4 Controller Publik (Extend `pageController.about`)

```javascript
// Data baru yang di-query dan dikirim ke view:
// - gallerySlides: aboutGalleryModel.getAll(true)
// - galleryHeader: aboutModel.getGalleryHeader()
// - stats: aboutStatsModel.getAll(true)
// - timeline: aboutTimelineModel.getAll(true)
// - storyHeader: aboutModel.getStoryHeader()
// - visionImage: aboutModel.getVisionImage()
// - missionImage: aboutModel.getMissionImage()
```

### 8.5 CSS Baru di `components.css` (Revisi v3: Isolasi Prefix `.abt-gal-*` & Fixed Height)

Kelas CSS gallery lama dimigrasikan sepenuhnya ke prefix unik `.abt-gal-*` dan di-scope ketat di bawah `.sec-gallery` / `#galeri` untuk mencegah tabrakan dengan `.bento-grid` homepage:

- `.abt-gal-container` (container section galeri, min-height ~662px desktop, ~372px mobile agar CLS = 0)
- `.abt-gal-viewport` (wrapper viewport bertumpuk untuk transisi halaman ganda, `position: relative; overflow: hidden`)
- `.abt-gal-grid` (CSS Grid: `grid-template-columns: repeat(3, 1fr); grid-auto-rows: 210px; gap: 16px`)
- `.abt-gal-tile` (default tile, `border-radius: var(--r-xl)`, `overflow: hidden`, `position: relative`)
- `.abt-gal-tile--tall` (tile posisi 1: `grid-column: 1; grid-row: 1 / span 2`)
- `.abt-gal-tile--wide` (tile posisi 2, 5: `grid-column: span 2`)
- `.abt-gal-tile img` (`width: 100%; height: 100%; object-fit: cover; transition: transform 400ms ease`)
- `.abt-gal-cap` (overlay caption: `position: absolute; bottom: 0; left: 0; right: 0; padding: 16px 18px; background: linear-gradient(transparent 0%, rgba(10,25,47,0.65) 100%)`)
- `.abt-gal-cat` (pill kategori: `font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #ffffff; background: rgba(255,255,255,0.18); padding: 3px 8px; border-radius: var(--r-sm)`)
- `.abt-gal-title` (judul: `font-size: 15px; font-weight: 600; color: #ffffff; margin-top: 6px`)
- `.abt-gal-pager` (container paginasi: `display: flex; align-items: center; justify-content: flex-start; gap: 20px; margin-top: 32px`)
- `.abt-gal-pager-count` (`font-variant-numeric: tabular-nums; font-size: 14px; font-weight: 600; color: var(--text-main)`)
- `.abt-gal-pager-btn` (tombol panah: min-width 44px, min-height 44px, bulat)

Pola Adaptive Balanced Grid dengan tinggi kontainer tetap (Keputusan Terkunci Opsi 1A untuk sisa tile halaman terakhir):
- `.abt-gal-grid--5`: 1 tall (span 2 baris) di kiri + 4 tile seimbang di 2 kolom kanan (2 baris x 2 tile).
- `.abt-gal-grid--4`: `grid-template-columns: repeat(2, 1fr);` (4 tile simetris).
- `.abt-gal-grid--3`: 1 tall di kiri + 2 tile bertumpuk vertikal di kanan.
- `.abt-gal-grid--2`: `grid-template-columns: repeat(2, 1fr);` (2 tile berdampingan sama lebar).
- `.abt-gal-grid--1`: 1 tile menempati slot standar di kiri atas (Opsi 1A Terkunci - Fixed Bento Slot). Sisa grid dibiarkan kosong alami dengan container min-height tetap sehingga CLS = 0 mutlak dan tidak ada loncatan layout.

Animasi transisi halaman (Keputusan Terkunci Opsi 2A - Shutter Curtain Wipe Simetris Anime.js v3):
- Dikelola via `anime.timeline({...})` dengan target `.abt-gal-tile`.
- Properti yang dianimasikan HANYA: `opacity`, `transform` (scale: `[0.96, 1]`), dan `clip-path: [inset(0 50% 0 50% round 12px), inset(0 0% 0 0% round 12px)]`. DILARANG keras menganimasikan width/height.
- Stagger simetris searah navigasi (cermin):
  - Next: gelombang bergerak dari kiri-atas ke kanan-bawah (`delay: anime.stagger(60)`).
  - Prev: gelombang bergerak dari kanan-bawah ke kiri-atas (`delay: anime.stagger(60, { from: 'last' })`).
- Pre-decode gambar sebelum timeline dipicu via `img.decode()`.
- Tombol navigasi dikunci selama transisi berlangsung.
- `will-change` dipasang hanya selama transisi dan dihapus setelah selesai.

Hover (dibungkus `@media (hover: hover)`):
- `.abt-gal-tile:hover img` (`transform: scale(1.04)`)
- `.abt-gal-tile:hover .abt-gal-cap` (`background: linear-gradient(transparent 0%, rgba(10,25,47,0.8) 100%)`)
- Tile tanpa teks: hover hanya melakukan zoom gambar, tanpa overlay gradien hitam.

Focus (Keputusan Terkunci Opsi 3A: Display-Only tanpa lightbox modal popup):
- `.abt-gal-tile:focus-visible` (`outline: 2px solid var(--sky, #38BDF8); outline-offset: 2px`)

`@media (prefers-reduced-motion: reduce)`:
- Animasi transisi dilewati langsung, pergantian halaman instan tanpa stagger/transform.
- `.abt-gal-tile:hover img` (`transform: none`)

Mobile `@media (max-width: 768px)` (Keputusan Terkunci Opsi 1A & 4A):
- `.abt-gal-grid`: `grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: 180px; gap: 12px;` (4 tile per halaman)
- `.abt-gal-tile--tall, .abt-gal-tile--wide`: dinonaktifkan di mobile (`grid-row: auto; grid-column: auto`)
- `.abt-gal-title`: `font-size: 13px`
- `.abt-gal-cat`: `font-size: 10px`

Kelas gallery header yang tetap dipertahankan: `.gal-header`, `.gal-header-text`, `.gal-kicker`.

Statistik: tambah `font-variant-numeric: tabular-nums` pada `.story-stat-num`.

### 8.6 JavaScript Baru di `main.js` (Revisi v3: Engine Anime.js v3)

Gallery slider logic lama dihapus. Engine baru bento gallery:

- Versi Anime.js: v3 (`animejs: ^3.2.2`), menggunakan API `anime({...})` dan `anime.timeline({...})`.
- Inisialisasi: hitung total halaman (`Math.ceil(slides.length / 6)` desktop, `Math.ceil(slides.length / 4)` mobile).
- Render Bertumpuk (Layered Stacking):
  1. Halaman keluar (*outgoing layer*) dan halaman masuk (*incoming layer*) dirender bersamaan dalam container berviewport tetap.
  2. Kondisional Caption: jika slide tidak memiliki teks judul dan kategori, elemen `.abt-gal-cap` DITIADAKAN.
  3. Fallback Aksesibilitas (Opsi 3A Terkunci): tag `<img>` dan tile `aria-label` diisi teks berpenomoran urut dinamis jika teks kosong (`"Fasilitas Manufaktur & Operasional PT Euodoo (Foto " + pad2(idx + 1) + ")"` untuk ID dan `"PT Euodoo Manufacturing & Operations Facility (Photo " + pad2(idx + 1) + ")"` untuk EN).
  4. Pre-decode gambar via `img.decode()` sebelum trigger animasi.
- Timeline Transisi:
  1. Buat single timeline Anime.js v3 per transisi.
  2. Kunci tombol Prev/Next (`disabled = true`, `pointer-events = none`).
  3. Jalankan stagger simetris cermin Shutter Curtain Wipe (Next vs Prev).
  4. Callback `complete`: hapus outgoing layer dari DOM, bersihkan inline style pada tile incoming, buka kunci tombol navigasi.
- Keyboard: `ArrowLeft`/`ArrowRight` pada container galeri.
- Touch swipe: gesture sentuh dengan threshold 50px.
- `prefers-reduced-motion`: transisi instan tanpa timeline animasi.

### 8.7 Audit Dampak Data Lokasi

| Lokasi Pemakaian | Field | Status |
|---|---|---|
| `views/partials/footer.ejs` | `settings.factory_address`, `settings.office_address` | Tetap berfungsi dari `settings` |
| `views/public/contact.ejs` | `settings.contact_address_id/en`, fallback `settings.factory_address` | Tetap berfungsi |
| `views/admin/settings/index.ejs` | `settings.office_address`, `settings.factory_address` | Tetap berfungsi |
| `views/public/about.ejs` (`#facilities`) | `data.factory_address`, `data.office_address` | **DIHAPUS** (section dihapus) |

### 8.8 Restrukturisasi Flexbox Modal Admin (Header/Footer Tetap & dvh Scrollable)

Perbaikan menyeluruh pada kontainer modal admin (`public/css/admin.css` dan `views/admin/about/index.ejs`):
1. **Container Modal Card:**
   - `.admin-modal-card`: `max-height: min(92dvh, 760px); display: flex; flex-direction: column; overflow: hidden;`
   - `.admin-modal-card > form`: `display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: hidden; margin: 0;`
2. **Komponen Modal:**
   - `.admin-modal-header`: `flex-shrink: 0; border-bottom: 1px solid var(--border-main);`
   - `.admin-modal-body`: `flex: 1 1 auto; overflow-y: auto; padding: 1.15rem 1.25rem; overscroll-behavior: contain;`
   - `.admin-modal-footer`: `flex-shrink: 0; border-top: 1px solid var(--border-main); position: sticky; bottom: 0; background: var(--bg-subtle); z-index: 2;`
3. **Form Slide Galeri Lebih Ramping:**
   - Media upload box diringkas tingginya menjadi 95-110px.
   - Kolom yang dapat disandingkan menggunakan grid `form-row-2`.
   - Hapus tanda (*) pada label judul, dan ubah istilah "Slider" menjadi "Galeri".
| `views/admin/about/index.ejs` (card lokasi) | `about.factory_address`, `about.office_address` | **DIHAPUS** dari CMS About |
| `models/aboutModel.js` | `about_factory_address` dsb. | Field tetap di getter, tidak dihapus |
| `controllers/admin/aboutController.js` | `factory_address` dsb. dari body | Handler update dibuang untuk field lokasi |
| `middleware/settingsMiddleware.js` | `settings.factory_address` | Tetap berfungsi |

**Kesimpulan:** Data lokasi aman dihapus dari halaman About dan CMS About saja. Semua pemakaian lain (footer, Kontak, Pengaturan Situs) mengambil dari tabel `settings` langsung, bukan dari model About.

---

## BAGIAN 12: Revisi Footer & Pengaturan Situs v1 (Spesifikasi Teknis Kelompok B)

### Keputusan Terkunci User (2026-10-15)
- **Keputusan 1 - Opsi 1A (Terkunci):** Sentralisasi Master di Pengaturan Situs (`/admin/settings`). Menu CMS Kontak (`/admin/contact`) difokuskan murni untuk mengelola teks formulir penawaran (RFQ) dan jam kerja operasional.
- **Keputusan 2 - Opsi 2A (Terkunci):** Peta Google Maps tetap 1 kolom terpadu (`google_maps_embed`) untuk fasilitas utama Pabrik Manufaktur Bandung.
- **Keputusan 3 - Opsi 3A (Terkunci):** Desain Monokrom Murni / Putih Solid (`#FFFFFF`) untuk seluruh teks footer, label lokasi (`.ft-office-label`), dan titik penanda (`.ft-office-dot`) berdiameter 6px (100% Zero Blue).
- **Keputusan 4 - Opsi 4B (Terkunci):** Standarisasi Prefix Seragam Kunci Media Sosial di database (`social_<platform>_url` & `social_<platform>_visible`) dengan fallback mapping dua arah di middleware.

### 12.1 Arsitektur Data Single Source of Truth Alamat, Kontak & Penyatuan CMS

#### 1. Audit Redundansi Data Saat Ini
| Kebutuhan Data | Sumber di Pengaturan Situs (`/admin/settings`) | Sumber di CMS Kontak (`/admin/contact`) | Kondisi di Halaman Publik |
|---|---|---|---|
| **Alamat Kantor Jakarta** | `settings.office_address` | *Tidak ada* | Hardcoded di `contact.ejs` ("Karindra Building..."), dibaca di `footer.ejs` |
| **Telepon Kantor Jakarta** | `settings.company_phone` | *Tidak ada* | Hardcoded di `contact.ejs` ("+6221-53668626"), dibaca di `footer.ejs` |
| **Alamat Pabrik Bandung** | `settings.factory_address` | `settings.contact_address_id`, `settings.contact_address_en` | Dibaca di `contact.ejs` (`contact_address_id`), dibaca di `footer.ejs` (`factory_address`) |
| **Telepon Pabrik Bandung** | *Tidak ada (hanya telepon global)* | `settings.contact_phone` | Dibaca di `contact.ejs` (`contact_phone`), hardcoded di `footer.ejs` (`(022) 6012519`) |
| **Google Maps Embed** | `settings.google_maps_embed` | `settings.contact_maps_embed_url` | `contact.ejs` membaca `contact_maps_embed_url || google_maps_embed` |

#### 2. Kamus Data Master Terpadu (Tabel `settings`)
Untuk menghentikan duplikasi dan inkonsistensi, seluruh data kontak & alamat fisik disatukan pengelolaannya ke dalam tabel `settings`:

| Key Setting | Tipe | Default / Nilai Awal | Keterangan & Penggunaan |
|---|---|---|---|
| `office_name_id` | `VARCHAR(100)` | `"Kantor Pusat (Jakarta)"` | Label resmi lokasi kantor (Bahasa Indonesia) |
| `office_name_en` | `VARCHAR(100)` | `"Head Office (Jakarta)"` | Label resmi lokasi kantor (English) |
| `office_address` | `TEXT` | `"Karindra Building Jl. Palmerah Selatan 30 A Suite 02-07, Jakarta Pusat 10270"` | Alamat fisik kantor Jakarta (Footer & Kontak) |
| `company_phone` / `office_phone` | `VARCHAR(50)` | `"(021) 53668626"` | Telepon kantor Jakarta (Link `tel:02153668626`) |
| `office_fax` | `VARCHAR(50)` | `"+6221-53668648"` | Nomor fax kantor Jakarta (opsional) |
| `company_email` | `VARCHAR(100)` | `"info@euodoo.com"` | Email resmi korespondensi korporat |
| `factory_name_id` | `VARCHAR(100)` | `"Pabrik Manufaktur (Bandung)"` | Label resmi lokasi pabrik (Bahasa Indonesia) |
| `factory_name_en` | `VARCHAR(100)` | `"Manufacturing Plant (Bandung)"` | Label resmi lokasi pabrik (English) |
| `factory_address` | `TEXT` | `"Jl. Paralon II No. 21 Cijerah, Bandung 40214"` | Alamat fisik pabrik manufaktur Bandung (Footer & Kontak) |
| `factory_phone` | `VARCHAR(50)` | `"(022) 6012519"` | Telepon pabrik Bandung (Link `tel:0226012519`) |
| `factory_working_hours_id` | `VARCHAR(150)` | `"Senin - Jumat: 08.00 - 17.00 WIB \| Sabtu: 08.00 - 13.00 WIB"` | Jam operasional pabrik (Bahasa Indonesia) |
| `factory_working_hours_en` | `VARCHAR(150)` | `"Monday - Friday: 08:00 - 17:00 WIB \| Saturday: 08:00 - 13:00 WIB"` | Jam operasional pabrik (English) |
| `google_maps_embed` | `TEXT` | `https://www.google.com/maps/embed?pb=...` | URL bersih iframe Google Maps resmi |

#### 3. Logika Sanitasi Tautan Telepon (`tel:`)
Helper pembersih nomor telepon diterapkan saat render EJS:
```javascript
// Sanitasi karakter non-angka dan non-plus untuk atribut href="tel:..."
const cleanTel = (phoneStr) => String(phoneStr || '').replace(/[^0-9+]/g, '');
```

---

### 12.2 Parser Iframe, Sanitasi, & Validasi Domain Google Maps

#### 1. Algoritma Ekstraksi & Validasi Server-Side
Pada `controllers/admin/settingController.js` (dan controller terkait):
```javascript
export function parseAndValidateGoogleMapsUrl(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return '';
  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  let extractedUrl = trimmed;

  // Jika input berupa tag iframe HTML utuh, ekstrak hanya nilai atribut src
  if (trimmed.startsWith('<iframe') || trimmed.includes('<iframe')) {
    const srcMatch = trimmed.match(/src=["'](https:\/\/[^"']+)["']/i);
    if (!srcMatch || !srcMatch[1]) {
      throw new Error('Kode embed iframe Google Maps tidak memiliki atribut src yang valid.');
    }
    extractedUrl = srcMatch[1];
  }

  // Validasi URL dan Domain Whitelist
  try {
    const parsed = new URL(extractedUrl);
    if (parsed.protocol !== 'https:') {
      throw new Error('URL Google Maps wajib menggunakan protokol aman HTTPS.');
    }

    const hostname = parsed.hostname.toLowerCase();
    const isGoogleDomain = (
      hostname === 'www.google.com' ||
      hostname === 'google.com' ||
      hostname === 'maps.google.com'
    );

    const isMapsPath = parsed.pathname.startsWith('/maps/embed') || parsed.pathname.startsWith('/maps');

    if (!isGoogleDomain || !isMapsPath) {
      throw new Error('URL wajib berasal dari domain sematan resmi Google Maps (google.com/maps/embed).');
    }

    return extractedUrl;
  } catch (err) {
    throw new Error('Format URL Google Maps tidak valid: ' + err.message);
  }
}
```

#### 2. Template Rendering EJS Aman
Pada `views/public/contact.ejs`:
```html
<iframe
  src="<%= settings.google_maps_embed %>"
  width="100%"
  height="100%"
  style="border:0;"
  allowfullscreen=""
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
  sandbox="allow-scripts allow-same-origin allow-popups"
  title="<%= currentLang === 'en' ? 'PT Euodoo Facility Location Map' : 'Peta Lokasi Fasilitas Pabrik PT Euodoo' %>">
</iframe>
```

---

### 12.3 Arsitektur Visibilitas & Standarisasi Kunci Media Sosial (Opsi 4B Terkunci)

#### 1. Skema Pengaturan Seragam (Prefix `social_*`)
Di tabel `settings`:
- **Toggle Visibilitas:**
  - `social_linkedin_visible`: `'1'` (tampil) / `'0'` (sembunyikan)
  - `social_instagram_visible`: `'1'` (tampil) / `'0'` (sembunyikan)
  - `social_facebook_visible`: `'1'` (tampil) / `'0'` (sembunyikan)
  - `social_youtube_visible`: `'1'` (tampil) / `'0'` (sembunyikan)
- **URL Akun Resmi:**
  - `social_linkedin_url`: URL profil LinkedIn (`https://linkedin.com/...`)
  - `social_instagram_url`: URL profil Instagram (`https://instagram.com/...`)
  - `social_facebook_url`: URL profil Facebook (`https://facebook.com/...`)
  - `social_youtube_url`: URL channel YouTube (`https://youtube.com/...`)

#### 2. Migrasi Database & Fallback Middleware
- **Query Migrasi Data (Opsi 4B):**
  ```sql
  UPDATE settings SET setting_key = 'social_linkedin_url' WHERE setting_key = 'linkedin_url';
  UPDATE settings SET setting_key = 'social_instagram_url' WHERE setting_key = 'instagram_url';
  UPDATE settings SET setting_key = 'social_facebook_url' WHERE setting_key = 'facebook_url';
  UPDATE settings SET setting_key = 'social_youtube_url' WHERE setting_key = 'youtube_url';
  ```
- **Fallback Alias Dua Arah di `settingsMiddleware.js`:**
  ```javascript
  // Standarisasi Opsi 4B dengan dukungan backward-compatibility
  settings.social_linkedin_url = settings.social_linkedin_url || settings.linkedin_url || '';
  settings.social_instagram_url = settings.social_instagram_url || settings.instagram_url || '';
  settings.social_facebook_url = settings.social_facebook_url || settings.facebook_url || '';
  settings.social_youtube_url = settings.social_youtube_url || settings.youtube_url || '';
  // Alias lama untuk kompatibilitas kode lain jika ada
  settings.linkedin_url = settings.social_linkedin_url;
  settings.instagram_url = settings.social_instagram_url;
  settings.facebook_url = settings.social_facebook_url;
  settings.youtube_url = settings.social_youtube_url;
  ```

#### 3. Logika Pemrosesan di `settingController.js`
1. Kolom checkbox/toggle disanitasi:
   `updates['social_' + platform + '_visible'] = req.body['social_' + platform + '_visible'] === '1' ? '1' : '0';`
2. Kolom URL divalidasi:
   `updates['social_' + platform + '_url'] = req.body['social_' + platform + '_url'] ? req.body['social_' + platform + '_url'].trim() : '';`
   Wajib string kosong ATAU berawalan `https://`. Jika tidak berawalan `https://`, ditolak atau dinormalisasi otomatis.

#### 4. Logika Rendering Kondisional di `views/partials/footer.ejs`
```ejs
<%
  const socials = [
    {
      id: 'linkedin',
      name: 'LinkedIn',
      url: settings?.social_linkedin_url,
      visible: settings?.social_linkedin_visible !== '0' && settings?.social_linkedin_visible !== 0,
      svg: '<path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.27a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z"/>'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      url: settings?.social_instagram_url,
      visible: settings?.social_instagram_visible !== '0' && settings?.social_instagram_visible !== 0,
      svg: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      url: settings?.social_facebook_url,
      visible: settings?.social_facebook_visible !== '0' && settings?.social_facebook_visible !== 0,
      svg: '<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      url: settings?.social_youtube_url,
      visible: settings?.social_youtube_visible !== '0' && settings?.social_youtube_visible !== 0,
      svg: '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>'
    }
  ];

  const activeSocials = socials.filter(s => s.visible && s.url && s.url.startsWith('https://'));
%>

<% if (activeSocials.length > 0) { %>
  <div class="social-row" aria-label="<%= currentLang === 'en' ? 'Official Social Media Channels' : 'Media Sosial Resmi PT Euodoo' %>">
    <% activeSocials.forEach(s => { %>
      <a href="<%= s.url %>"
         class="social-btn"
         aria-label="<%= s.name %> PT Euodoo"
         target="_blank"
         rel="noopener noreferrer">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <%- s.svg %>
        </svg>
      </a>
    <% }); %>
  </div>
<% } %>
```
Dengan struktur di atas:
- Jika `activeSocials.length === 0`, tag `.social-row` sama sekali tidak dirender ke HTML.
- Tidak ada string URL hardcode generic.
- Keamanan `rel="noopener noreferrer"` dan aksesibilitas `aria-label` terjamin 100%.

---

## BAGIAN 13: Revisi Kontak & Footer v1 (Kelompok B: Perubahan Spesifikasi Teknis)

### 13.1 Migrasi Basis Data & Skema Settings Dual Lokasi

#### A. File Migrasi SQL (`database/migrations/010_revisi_kontak_footer_v1.sql`)
Tabel `settings` beroperasi dengan pola pasangan key-value (`key` VARCHAR(100) PRIMARY KEY, `value` TEXT). Kunci baru ditambahkan dengan skrip idempotensi (`INSERT IGNORE INTO settings ...`):

```sql
-- Migrasi Kunci Pengaturan Baru untuk Fax & Email Dual Lokasi
-- Lokasi 1 (Jakarta): office_fax sudah ada di DB dari putaran sebelumnya.
INSERT IGNORE INTO settings (`key`, `value`) VALUES 
('office_email', 'info@euodoo.com'),
('factory_fax', ''),
('factory_email', '');
```

#### B. Pembaruan File Seeder (`database/seeds/v2_seed.js`)
Menambahkan pasangan key-value default ke array seeder `settings`:
```javascript
{ key: 'office_email', value: 'info@euodoo.com' },
{ key: 'factory_fax', value: '' },
{ key: 'factory_email', value: '' },
```

---

### 13.2 Backend Controller & Middleware Architecture

#### A. Pengendali Admin (`controllers/admin/settingController.js`)
1. **Whitelist Field Update:**
   Menambahkan `office_email`, `factory_fax`, dan `factory_email` ke dalam array whitelist field kontak di method `updateSettings`:
   ```javascript
   const contactKeys = [
     'company_address', 'company_phone', 'company_email',
     'office_address_id', 'office_address_en', 'office_phone', 'office_fax', 'office_email',
     'factory_address_id', 'factory_address_en', 'factory_phone', 'factory_fax', 'factory_email',
     'google_maps_embed', 'whatsapp_number', 'whatsapp_message'
   ];
   ```
2. **Validasi & Sanitasi Server-Side:**
   - Validasi format email menggunakan regex standar:
     ```javascript
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (req.body.office_email && !emailRegex.test(req.body.office_email.trim())) {
       // Tolak atau lemparkan flash error
     }
     if (req.body.factory_email && !emailRegex.test(req.body.factory_email.trim())) {
       // Tolak atau lemparkan flash error
     }
     ```
   - Validasi format fax/telepon: hanya mengizinkan digit, spasi, `+`, `-`, `(`, `)`:
     ```javascript
     const phoneSanitizeRegex = /^[0-9\s+\-()]*$/;
     if (req.body.factory_fax && !phoneSanitizeRegex.test(req.body.factory_fax.trim())) {
       // Tolak karakter berbahaya/skrip
     }
     ```

#### B. Middleware Pengaturan Global (`middleware/settingsMiddleware.js`)
Menginjeksi nilai default yang konsisten ke dalam `res.locals.settings`:
```javascript
res.locals.settings.office_email = settingsMap.office_email || settingsMap.company_email || 'info@euodoo.com';
res.locals.settings.factory_fax = settingsMap.factory_fax || '';
res.locals.settings.factory_email = settingsMap.factory_email || '';
```

#### C. Pengendali Publik Form Kontak (`controllers/public/contactController.js`)
Memperketat method `submitContact` dengan validasi pertahanan mendalam (*defense-in-depth*):
1. **Sanitasi String & Trim:**
   ```javascript
   const name = (req.body.name || '').trim();
   const company = (req.body.company || '').trim();
   const email = (req.body.email || '').trim().toLowerCase();
   const phone = (req.body.phone || '').trim();
   const type = (req.body.type || 'inquiry').trim();
   const product_id = req.body.product_id ? parseInt(req.body.product_id, 10) : null;
   const quantity = (req.body.quantity || '').trim();
   const message = (req.body.message || '').trim();
   ```
2. **Validasi Batasan Panjang & Format:**
   - `name`: 2 - 100 karakter.
   - `company`: maksimal 150 karakter.
   - `email`: 5 - 100 karakter, lolos `emailRegex`.
   - `phone`: 7 - 30 karakter, lolos `phoneSanitizeRegex`.
   - `quantity`: maksimal 100 karakter.
   - `message`: 10 - 3000 karakter.
   - `type`: wajib salah satu dari `['inquiry', 'partnership', 'general']`.
   - `product_id`: jika ada, wajib `!isNaN(product_id) && product_id > 0`.
3. **Penyembunyian Rincian Database (Anti-Leak Error Handling):**
   ```javascript
   try {
     // Eksekusi insert model inquiry
     await inquiryModel.create({ ... });
     return res.json({ success: true, message: req.__('contact.success_message') });
   } catch (err) {
     console.error('Contact Form Submit Error:', err);
     // Kembalikan pesan umum aman tanpa mengekspos error SQL
     return res.status(500).json({ 
       success: false, 
       message: req.__('contact.error_server_generic') 
     });
   }
   ```

---

### 13.3 Audit Dependensi & Pembersihan Modul WhatsApp Kontak

#### A. Matriks Dependensi
| Fitur / File | Menggunakan `settings.whatsapp_number` | Dampak Perubahan |
|---|---|---|
| `views/partials/whatsapp-btn.ejs` | Ya (floating action button) | **TIDAK DIUBAH** (tetap aktif) |
| `views/public/product-detail.ejs` | Ya (tombol WA RFQ) | **TIDAK DIUBAH** (tetap aktif) |
| `views/partials/cta-global.ejs` | Ya (tombol konsultasi) | **TIDAK DIUBAH** (tetap aktif) |
| `views/admin/settings/index.ejs` | Ya (input nomor & pesan WA) | **TIDAK DIUBAH** (tetap ada) |
| `views/public/contact.ejs` (Baris 328-354) | Ya (kartu navy gradient WA) | **DIHAPUS TOTAL** |

#### B. Prosedur Pembersihan Kode Mati
1. Hapus elemen `<div class="office-info-card" style="background: linear-gradient(...)">...</div>` pada `views/public/contact.ejs`.
2. Hapus class animation/styling di `public/css/components.css` yang khusus melayani kartu WA tersebut jika tidak dipakai di partial lain (seperti selector `.wa-pulse-*`).

---

### 13.4 Arsitektur Komponen Form Kontak Publik & Aturan Isolasi CSS (`.cf-*`)

#### A. Nomenklatur Class CSS Terisolasi
Mengikuti aturan ketat isolasi desain BEM/namespace (`DESIGN.md`):
- Kontainer utama: `.cf-card-box`
- Header: `.cf-header`, `.cf-kicker`, `.cf-title`, `.cf-subtitle`
- Alert: `.cf-alert-box`, `.cf-alert-success`, `.cf-alert-error`, `.cf-alert-title`, `.cf-alert-desc`
- Field form: `.cf-form-group`, `.cf-form-row`, `.cf-label`, `.cf-required`
- Kontrol input: `.cf-input`, `.cf-select`, `.cf-textarea`
- Dropdown wrapper: `.cf-select-wrap` (dengan SVG chevron kustom via CSS background)
- Tombol aksi: `.cf-submit-btn`, `.cf-submit-spinner`, `.cf-btn-text`
- Kartu informasi lokasi: `.cf-office-card`, `.cf-office-header`, `.cf-office-icon`, `.cf-office-badge`, `.cf-office-name`, `.cf-office-addr`, `.cf-office-detail`, `.cf-office-item`
- Kontainer peta: `.cf-maps-container`

#### B. Eliminasi Inline Style
- Seluruh 35+ atribut `style=""` pada `views/public/contact.ejs` dialihkan ke blok class `.cf-*` di `public/css/components.css`.
- Pengecualian satu-satunya: field proteksi honeypot anti-spam (`<div style="display:none!important;" aria-hidden="true">...</div>`) yang sengaja diinjeksi inline agar tidak dibatalkan oleh stylesheet eksternal atau scraper otomatis.

---

### 13.5 Integrasi Single Source of Truth Fax/Email pada Footer Publik

#### A. Logika Sanitasi Dialer vs Tampilan Teks
Di dalam `views/partials/footer.ejs`, helper sanitasi dialer seluler diterapkan secara tepat guna:
```ejs
<%
  function cleanTel(val) {
    if (!val || typeof val !== 'string') return '';
    return val.replace(/[^0-9+]/g, '');
  }
%>
```

#### B. Skema Conditional Rendering Dual Lokasi pada Footer
```ejs
<!-- Kantor Jakarta -->
<% if (settings?.office_fax) { %>
  <div class="ft-contact-item">
    <span class="ft-phone-label">Fax:</span>
    <a href="tel:<%= cleanTel(settings.office_fax) %>" class="ft-phone-val"><%= settings.office_fax %></a>
  </div>
<% } %>
<% if (settings?.office_email) { %>
  <div class="ft-contact-item">
    <span class="ft-phone-label">Email:</span>
    <a href="mailto:<%= settings.office_email %>" class="ft-phone-val"><%= settings.office_email %></a>
  </div>
<% } %>

<!-- Pabrik Bandung -->
<% if (settings?.factory_fax) { %>
  <div class="ft-contact-item">
    <span class="ft-phone-label">Fax:</span>
    <a href="tel:<%= cleanTel(settings.factory_fax) %>" class="ft-phone-val"><%= settings.factory_fax %></a>
  </div>
<% } %>
<% if (settings?.factory_email) { %>
  <div class="ft-contact-item">
    <span class="ft-phone-label">Email:</span>
    <a href="mailto:<%= settings.factory_email %>" class="ft-phone-val"><%= settings.factory_email %></a>
  </div>
<% } %>
```
- **Karakter Tampilan:** String `<%= settings.office_fax %>` ditampilkan apa adanya (menjaga format tanda hubung asli seperti `+6221–53668626`).
- **Atribut Dialer:** Atribut `href="tel:..."` menggunakan `cleanTel(...)` murni angka dan tanda plus.
- **Baris Kosong:** Tidak ada tag DOM yang dirender jika variabel bernilai kosong/undefined.

---

## BAGIAN 15: Spesifikasi Teknis Homepage Major Update v1 (2026-10-19)

### 15.1 Arsitektur Data & Model 4 Kategori Primer Homepage
Untuk mengelola dan merender 4 panel kategori primer beranda (`.hcat-*`), arsitektur sistem menyediakan dua alternatif penyimpanan data:

```javascript
// Struktur Data Kategori Beranda (home_categories_json di tabel settings atau model productCategoryModel)
[
  {
    category_id: 1,             // Relasi ke product_categories.id
    name_id: "Kantong Belanja", // Cache nama kategori ID
    name_en: "Shopping Bags",   // Cache nama kategori EN
    slug: "kantong-belanja",    // Slug URL untuk deep link
    image_url: "/images/products/cat-shopping.webp", // Gambar cover panel via Media Library
    sort_order: 1               // Urutan panel (1 s/d 4)
  },
  // ... maks 4 item primer
]
```

- **Mekanisme Fallback Runtime:**
  - Jika admin belum mengatur 4 kategori beranda secara manual: Model backend otomatis mengambil 4 kategori teratas dari tabel `product_categories` yang memiliki urutan `sort_order ASC, name_id ASC`.
  - Jika total kategori yang ada di sistem kurang dari 4: Kontainer grid `.hcat-grid` secara dinamis membagi lebar kolom secara proporsional (`grid-template-columns: repeat(N, 1fr)`) atau menggunakan gambar placeholder pabrik yang sudah ada agar panel tidak kosong.

---

### 15.2 Query SQL Komputasi Jumlah Produk Terbit per Kategori
Jumlah produk pada tiap panel kategori wajib dihitung secara dinamis dan akurat hanya dari produk yang berstatus aktif dan terbit (`published`):

```sql
-- Query Penghitungan Produk Terbit per Kategori (models/productCategoryModel.js)
SELECT 
  c.id,
  c.name_id,
  c.name_en,
  c.slug,
  c.description_id,
  c.description_en,
  c.sort_order,
  COUNT(p.id) AS published_product_count
FROM product_categories c
LEFT JOIN products p 
  ON c.id = p.category_id 
  AND p.status = 'published' 
  AND (p.is_active = 1 OR p.is_active IS NULL)
GROUP BY c.id
ORDER BY c.sort_order ASC, c.name_id ASC;
```
- **Karakteristik Query:**
  - Menggunakan `LEFT JOIN` agar kategori yang belum memiliki produk tetap terambil dengan nilai `published_product_count = 0`.
  - Filter `p.status = 'published'` memastikan produk berstatus `draft` atau `archived` tidak ikut terhitung ke dalam total publik.

---

### 15.3 Arsitektur Skema Data `homeContentModel.js` untuk Why Choose Us (`why_choose_us`)
Section "Why Choose Us / Kenapa Memilih Kami" menggantikan data `home_pillars_*` pada tabel `settings` dengan skema terstruktur:

```javascript
// Skema Data Baru Why Choose Us (models/homeContentModel.js)
why_choose_us: {
  is_active: Number,             // 1 = aktif, 0 = nonaktif (default: 1)
  eyebrow_id: String,            // default: "Inovasi untuk masa depan"
  eyebrow_en: String,            // default: "Innovation for the future"
  title_id: String,              // default: "Why choose us?" (dengan aksen tanda tanya)
  title_en: String,              // default: "Why choose us?"
  chip_label_id: String,         // default: "Solusi ramah lingkungan"
  chip_label_en: String,         // default: "Eco-friendly solutions"
  chip_icon: String,             // default: "asterisk" / "leaf"
  headline_id: String,           // default: "Inovasi material, dengan [mark]dampak yang lebih baik.[/mark]"
  headline_en: String,           // default: "Material innovation, with [mark]better impact.[/mark]"
  desc_id: String,               // Paragraf utama ID dengan kata tebal [strong]...[/strong]
  desc_en: String,               // Paragraf utama EN
  callout_lead_id: String,       // default: "Dirancang dengan kepedulian."
  callout_lead_en: String,       // default: "Designed with care."
  callout_body_id: String,       // Penjelasan callout ID
  callout_body_en: String,       // Penjelasan callout EN
  note_id: String,               // Catatan kaki ID (komitmen mutu)
  note_en: String,               // Catatan kaki EN
  art_label_id: String,          // default: "Material · Alam · Masa depan"
  art_label_en: String,          // default: "Material · Nature · Future"
  float_eyebrow_id: String,      // default: "Berorientasi masa depan"
  float_eyebrow_en: String,      // default: "Future-oriented"
  float_title_id: String,        // default: "Better by design."
  float_title_en: String,        // default: "Better by design."
  float_desc_id: String,         // default: "Inovasi material untuk langkah yang lebih bertanggung jawab."
  float_desc_en: String          // default: "Material innovation for a more responsible path."
}
```

- **Nilai Teks Bawaan Pabrik (Seed Data) Tanpa Catatan Internal (Sesuai Keputusan Terkunci 6 - Opsi 6B):**
  - `desc_id`: `"Sebagai [strong]pionir penerapan aditif ramah lingkungan[/strong], kami menghadirkan solusi yang dirancang untuk membantu mengurangi dampak sampah plastik. Didukung formula aditif degradable yang telah teruji serta mengacu pada standar resmi [strong]SNI[/strong] untuk kemasan ramah lingkungan."`
  - `callout_lead_id`: `"Dirancang dengan kepedulian."`
  - `callout_body_id`: `"Kami mengedepankan inovasi aditif ramah lingkungan sebagai bagian dari pendekatan untuk membantu mengurangi dampak lingkungan."`
  - `note_id`: `"Komitmen kami: inovasi yang berpijak pada pengujian dan tanggung jawab lingkungan."`
  - **Catatan Redaksi Dihapus 100%:** Kalimat internal *"Untuk publikasi, lengkapi klaim teknis dan penyebutan SNI dengan laporan pengujian atau sertifikat yang relevan"* TIDAK DISERTAKAN pada database atau kode publik.

---

### 15.4 Arsitektur Parser Penanda Teks Aman (Server-Side Escaped Token Parser)
Untuk mencegah serangan Cross-Site Scripting (XSS) dan menghindari kerusakan layout akibat tag HTML yang tidak valid, admin CMS tidak menerima input HTML mentah. Sistem menggunakan parser server-side sederhana yang mengonversi penanda aman ke tag semantik:

```javascript
// utils/textFormatter.js
import escapeHtml from 'escape-html';

export function formatInlineText(rawText) {
  if (!rawText) return '';
  
  // 1. Sanitasi penuh seluruh karakter input (mengonversi <, >, &, ", ' menjadi entitas aman)
  let safe = escapeHtml(String(rawText).trim());
  
  // 2. Ganti penanda terkurasi menjadi tag semantik yang diizinkan saja
  safe = safe
    // Penanda bold: [strong]teks[/strong] atau **teks**
    .replace(/\[strong\](.*?)\[\/strong\]/gi, '<strong>$1</strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Penanda highlight: [mark]frasa[/mark] atau ==frasa==
    .replace(/\[mark\](.*?)\[\/mark\]/gi, '<mark>$1</mark>')
    .replace(/==(.*?)==/g, '<mark>$1</mark>')
    // Penanda aksen tanda tanya/karakter: [accent]?[/accent]
    .replace(/\[accent\](.*?)\[\/accent\]/gi, '<span class="wcu-accent">$1</span>');
    
  return safe;
}
```
- **Kelebihan Pendekatan:**
  - 100% kebal terhadap injeksi skrip berbahaya (`<script>`, `onerror=`, `onload=`, iframe).
  - Admin tetap dapat dengan leluasa menentukan kata mana yang ingin ditebalkan atau di-highlight.
  - Template EJS merender menggunakan tag unescaped terisolasi `<%- formatInlineText(wcu.headline) %>` yang telah dijamin bersih.

---

### 15.5 Audit Ketergantungan Flag Unggulan (`is_featured` / `featured`)
Audit komprehensif terhadap seluruh kemunculan flag unggulan di proyek:

| Komponen | Lokasi File | Fungsi Saat Ini | Rencana Transisi |
|---|---|---|---|
| **Database Schema** | `products.is_featured` (`TINYINT(1) DEFAULT 0`) | Menyimpan penanda produk unggulan | **Hard Deprecation (Disetujui User - Opsi B)**. Menjalankan migrasi database SQL resmi `database/migrations/011_drop_product_is_featured.sql` (`ALTER TABLE products DROP COLUMN is_featured;`). |
| **Model Publik** | `models/productModel.js` (`isFeatured: true`) | Menyaring 4 produk unggulan beranda | **Hentikan Query**. Controller beranda tidak lagi memanggil filter `isFeatured`. |
| **Controller Beranda** | `controllers/public/homeController.js` | Memanggil `productModel.findAll({ isFeatured: true })` | **Ganti Pemanggilan**. Beralih ke `productCategoryModel.getHomepageCategories()` |
| **Admin View Form** | `views/admin/products/create.ejs` & `edit.ejs` | Checkbox "Jadikan Produk Unggulan" | **Sembunyikan / Hapus Checkbox UI**. Admin tidak lagi menampilkan opsi ini. |
| **Admin View Tabel** | `views/admin/products/index.ejs` | Badge status "Unggulan" dan filter | **Hapus Badge & Filter Kolom**. Tabel produk menjadi lebih ringkas dan terfokus. |
| **Admin Controller** | `controllers/admin/productController.js` | Membaca req.body.featured | **Abaikan Payload**. Controller tidak lagi memvalidasi atau memutasi nilai featured baru. |

---

### 15.6 Arsitektur Deep Link Filter Kategori, Routing & Canonical SEO
- **Pola URL Deep Link:**
  `/products?category=:slug` (contoh: `/products?category=kantong-belanja-hdpe`).
- **Resolusi di Controller Publik (`controllers/public/productController.js`):**
  - Parameter `req.query.category` dibaca: jika numerik, dicari berdasarkan `id`; jika string, dicari berdasarkan `slug`.
  - Jika ditemukan: `categoryId` dipasang pada filter query produk, dan data kategori dioper sebagai `selectedCategory`.
- **Perilaku Template Katalog (`views/public/products.ejs`):**
  - Pill filter kategori yang sesuai secara otomatis menyandang class `.active` (`selectedCategory && selectedCategory.id === cat.id`).
  - Bar status filter menampilkan nama kategori aktif beserta tautan "Reset Filter" (`/products`).
- **Penanganan State Kosong (Empty State):**
  - Jika kategori belum memiliki produk terbit (`products.length === 0`):
    - Komponen empty state menampilkan ikon pencarian ramah, judul "Produk Tidak Ditemukan", pesan *"Kategori ini belum memiliki produk terbit atau sedang dalam pembaruan"*, dan tombol CTA utama "Reset Filter / Tampilkan Semua Produk".
- **Spesifikasi Canonical URL & Tag Alternatif:**
  - Halaman katalog berfilter mempertahankan canonical URL dasar `<link rel="canonical" href="https://euodoo.com/products">` untuk mencegah kanibalisasi SEO dan duplicate content akibat variasi query parameter.
  - Tag alternatif bahasa hreflang mempertahankan query parameter:
    - ID: `<link rel="alternate" hreflang="id" href="/products?category=:slug&lang=id">`
    - EN: `<link rel="alternate" hreflang="en" href="/products?category=:slug&lang=en">`

---

## BAGIAN 16: Spesifikasi Teknis Revisi Homepage: CTA Hero & Merek v1 (2026-10-20)

### 16.1 Arsitektur Data Banner Hero & Migrasi Database Dual CTA
Untuk mendukung konfigurasi dua tombol per slide banner (tombol utama dan tombol kedua) secara dinamis dari admin:

#### 1. DDL Migrasi Database (`database/migrations/014_add_secondary_cta_to_banners.sql`)
```sql
-- Migrasi 014: Tambah kolom tombol kedua (secondary CTA) ke tabel banners
ALTER TABLE `banners`
  ADD COLUMN `cta_secondary_text_id` VARCHAR(100) NULL AFTER `cta_url`,
  ADD COLUMN `cta_secondary_text_en` VARCHAR(100) NULL AFTER `cta_secondary_text_id`,
  ADD COLUMN `cta_secondary_url` VARCHAR(500) NULL AFTER `cta_secondary_text_en`;
```

#### 2. Kamus Data Kolom CTA Banners
| Kolom | Tipe | Nullable | Batas | Deskripsi & Validasi |
|---|---|---|---|---|
| `cta_text_id` | VARCHAR(100) | YES | 100 char | Teks tombol utama versi ID. Default fallback: "Hubungi Kami" |
| `cta_text_en` | VARCHAR(100) | YES | 100 char | Teks tombol utama versi EN. Default fallback: "Contact Us" |
| `cta_url` | VARCHAR(500) | YES | 500 char | URL tujuan tombol utama. Validasi: internal (`/`, `#`) atau eksternal (`http://`, `https://`). Fallback legacy: `/contact` |
| `cta_secondary_text_id` | VARCHAR(100) | YES | 100 char | Teks tombol kedua versi ID. Jika kosong, tombol kedua TIDAK dirender |
| `cta_secondary_text_en` | VARCHAR(100) | YES | 100 char | Teks tombol kedua versi EN. Jika kosong, tombol kedua TIDAK dirender |
| `cta_secondary_url` | VARCHAR(500) | YES | 500 char | URL tujuan tombol kedua. Validasi: internal (`/`, `#`) atau eksternal (`http://`, `https://`) |

#### 3. Logika Backward Compatibility & Fallback Banner Lama
- Untuk baris banner yang sudah ada dengan `cta_url` kosong/null: fallback runtime EJS tetap mengarah ke `/contact` (`banner.cta_url || '/contact'`).
- Untuk tombol kedua: jika `cta_secondary_text_id` atau `cta_secondary_text_en` kosong atau hanya spasi, elemen tombol kedua tidak dirender ke DOM.

---

### 16.2 Validasi Keamanan URL & Atribut Tautan Tombol Hero

#### 1. Aturan Validasi URL (Regex Whitelist)
URL pada kedua tombol hero (`cta_url` dan `cta_secondary_url`) divalidasi ketat di sisi klien dan server:
```javascript
// Validasi URL tombol hero
function isValidCtaUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length > 500) return false;
  
  // 1. Blokir skema berbahaya secara eksplisit
  const dangerousPatterns = /^(javascript:|data:|vbscript:|\/\/)/i;
  if (dangerousPatterns.test(trimmed)) {
    return false;
  }
  
  // 2. Izinkan internal path (diawali /) atau anchor hash (diawali #)
  const isInternal = /^\/([a-zA-Z0-9\-_./?#=&%~]*)$/.test(trimmed) || /^#[a-zA-Z0-9\-_]+$/.test(trimmed);
  if (isInternal) return true;
  
  // 3. Izinkan URL web absolut valid (http:// atau https://)
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}
```

#### 2. Penentuan Otomatis Target & Rel Keamanan
Template publik secara otomatis mendeteksi apakah tautan mengarah ke eksternal atau internal:
- **Tautan Eksternal:** Jika URL diawali dengan `http://` atau `https://`, template menambahkan atribut `target="_blank" rel="noopener noreferrer"`.
- **Tautan Internal:** Jika URL diawali dengan `/` atau `#`, tautan dibuka di tab yang sama tanpa atribut `target` atau `rel`.

#### 3. Tata Letak Tombol Hero di Layar Mobile (Keputusan Terkunci 3 - Opsi A)
Pada viewport mobile (< 640px), kontainer tombol `.hero-cta-wrap` / `.hero-actions` beralih ke stack vertikal:
```css
@media (max-width: 639.98px) {
  .hero-slider .hero-cta-wrap,
  .hero-slider .hero-actions {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 0.75rem;
  }
  .hero-slider .hero-cta-btn,
  .hero-slider .hero-cta-wrap .btn {
    width: 100%;
    min-height: 44px;
    justify-content: center;
    text-align: center;
  }
}
```

---

### 16.3 Arsitektur Section Merek Marquee (`.brand-strip-*`)

#### 1. Markup & Semantik DOM
Menggantikan komponen carousel kartu merek lama (`.sec-brands .brand-card`) dengan strip marquee logo kontinu:
```html
<section class="brand-strip-sec" id="merek" aria-label="Merek Paten & Terdaftar">
  <div class="brand-strip-container">
    <div class="brand-strip-header">
      <h2 class="brand-strip-title">
        <%= (currentLang === 'en' ? settings?.home_brand_title_en : settings?.home_brand_title_id) 
            || (currentLang === 'en' ? 'Registered Trademarks' : 'Merek Paten & Terdaftar') %>
      </h2>
    </div>
    
    <div class="brand-strip-wrapper" tabindex="0" role="region" aria-label="Daftar logo merek terdaftar yang bergulir">
      <!-- Track Asli (Accessible) -->
      <div class="brand-strip-track">
        <% marqueeBrands.forEach(brand => { %>
          <div class="brand-strip-item">
            <img src="<%= brand.logo_url %>" 
                 alt="Logo <%= brand.name %>" 
                 title="<%= brand.name %>"
                 class="brand-strip-logo" 
                 loading="lazy" 
                 decoding="async" />
          </div>
        <% }) %>
      </div>
      
      <!-- Track Duplikat (Seamless Loop, Hidden from Screen Reader) -->
      <div class="brand-strip-track" aria-hidden="true">
        <% marqueeBrands.forEach(brand => { %>
          <div class="brand-strip-item">
            <img src="<%= brand.logo_url %>" 
                 alt="" 
                 class="brand-strip-logo" 
                 loading="lazy" 
                 decoding="async" />
          </div>
        <% }) %>
      </div>
    </div>
  </div>
</section>
```

#### 2. Spesifikasi Animasi CSS & Transformasi GPU murni
- **GPU Accelerated:** Animasi hanya menggunakan `transform: translate3d(-100%, 0, 0)` atau `translateX(-100%)`. Dilarang menggerakkan properti layout seperti `left`, `margin`, atau `padding`.
- **Kecepatan & Ritme:** Durasi animasi linier antara 25s - 35s per siklus loop (`animation: brandMarquee 30s linear infinite`).
- **Interaksi Hover & Focus Pause:**
  ```css
  .brand-strip-wrapper:hover .brand-strip-track,
  .brand-strip-wrapper:focus-within .brand-strip-track {
    animation-play-state: paused;
  }
  ```
- **Mask Gradien Tepi (Edge Gradient Mask):**
  Menggunakan CSS masking untuk menghasilkan efek memudar di sisi kiri dan kanan:
  ```css
  .brand-strip-wrapper {
    overflow: hidden;
    mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
  }
  ```
- **Ukuran Logo Responsif:**
  - Desktop (>= 1024px): `max-height: 52px; max-width: 160px; object-fit: contain;`
  - Mobile (< 768px): `max-height: 38px; max-width: 120px; object-fit: contain;`
- **Fallback Aksesibilitas (`prefers-reduced-motion: reduce`):**
  Jika pengguna mengaktifkan pengurangan gerakan di sistem operasi:
  - Animasi marquee dinonaktifkan (`animation: none !important;`).
  - Track duplikat disembunyikan (`display: none;`).
  - Track asli disusun sebagai flexbox wrap terpusat atau overflow horizontal statis yang rapi dan mudah dibaca tanpa gerakan terus menerus.

#### 3. Logika Penanganan Jumlah Merek Sedikit & Duplikasi Track (Keputusan Terkunci 2 - Opsi A)
Jika jumlah merek yang aktif di database kurang dari 8 item:
- Di sisi server/template SSR, array merek diduplikasi secara berulang (misal 2x atau 3x) hingga mencapai minimal 8 s/d 12 item sebelum membentuk track asli dan track duplikat (`marqueeBrands`).
- Hal ini mencegah track terputus sebelum mencapai ujung viewport pada layar ultra-wide (1920px+).

#### 4. Pengelolaan Judul Section di Menu Admin Merek Terdaftar (Keputusan Terkunci 1 - Opsi B)
- **Halaman Admin:** `views/admin/brands/index.ejs` memuat form kartu untuk konfigurasi judul beranda.
- **Route Admin:** `POST /admin/brands/section-title` di `routes/adminRoutes.js`.
- **Controller Admin:** `brandController.updateSectionTitle` memvalidasi input `home_brand_title_id` dan `home_brand_title_en` lalu menyimpannya ke tabel `settings`.
- **Injeksi Data:** `settingsMiddleware.js` memastikan `settings.home_brand_title_id` dan `settings.home_brand_title_en` tersedia pada `res.locals.settings`.

---

### 16.4 Pembersihan Kode Mati (Dead Code Removal)
Implementasi revisi ini disertai pembersihan kode mati:
1. **Modal Lightbox Zoom Merek:** FITUR MODAL ZOOM PREVIEW TETAP DIPERTAHANKAN aktif pada markup `views/public/index.ejs`, skrip `public/js/main.js`, dan CSS `public/css/components.css` sesuai permintaan pengguna.
2. **Script Carousel & Lightbox:** Logika modal zoom preview dipertahankan utuh; hanya fungsi/skrip usang yang tidak terpakai yang dibersihkan.
3. **CSS Kartu Merek Lama:** Hapus selektor kartu lama usang `.brand-card`, `.brand-logo-wrap`, `.brand-meta-wrap`, `.brand-name-text` dari `public/css/components.css`. Style `.brand-preview-modal`, `.brand-modal-*`, dan `.brand-zoom-hint` dipertahankan.
4. **Key Lokalisasi Usang:** Hapus teks atau key lokalisasi usang yang tidak terpakai (seperti deskripsi 3 dekade).

---

### 16.5 Penandaan Spesifikasi Usang [DEPRECATED per 2026-10-20]
- **[DEPRECATED] Kartu Portofolio Merek Lama (`.brand-card`, `.brand-logo-wrap`, `.brand-meta-wrap`, `.brand-name-text`):** Digantikan oleh strip marquee kontinu berprefix `.brand-strip-*` (modal zoom preview `#brandPreviewModal` dan zoom hint `.brand-zoom-hint` tetap dipertahankan).
- **[DEPRECATED] Hero Banner Single CTA / Hardcoded Secondary Button:** Digantikan oleh arsitektur dual CTA dinamis berbasis kolom database `cta_*` dan `cta_secondary_*`.




