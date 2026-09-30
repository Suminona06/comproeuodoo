# PT Euodoo Presisi Indonesia — Website Company Profile & CMS

Website profil perusahaan manufaktur plastik presisi dan sistem Content Management System (CMS) terintegrasi berbasis Node.js, Express, EJS, dan MySQL.

---

## 🛠️ Tech Stack & Arsitektur

- **Runtime:** Node.js (>= 20.0.0 LTS)
- **Web Framework:** Express 4.19 (ES Modules)
- **Templating Engine:** EJS (Server-Side Rendering)
- **Database:** MySQL 8.0+ / MariaDB 10.5+ dengan Connection Pooling (`mysql2/promise`)
- **Autentikasi CMS:** JSON Web Token (JWT) tersimpan di HttpOnly Cookie + Double-Submit Cookie CSRF Protection
- **Media Processing:** Multer + Sharp (otomatis konversi ke format WebP terkompresi)
- **Email Service:** Nodemailer (SMTP terintegrasi untuk notifikasi RFQ)
- **Styling:** Vanilla CSS murni dengan Design System Tokens ([Design/DESIGN.md](file:///home/itpc/Euodoo/Design/DESIGN.md))
- **Lokalisasi:** Sistem dwibahasa ID & EN berbasis kamus JSON dan cookie 1 tahun.

---

## 🚀 Panduan Menjalankan di Lokal (Local Development)

### 1. Kloning & Instalasi Dependensi
```bash
git clone <repository-url>
cd Euodoo
npm install
```

### 2. Konfigurasi Lingkungan (`.env`)
Salin file konfigurasi environment dan sesuaikan kredensial MySQL lokal Anda:
```bash
cp .env.example .env # atau edit langsung file .env
```
Pastikan variabel `DB_HOST`, `DB_USER`, `DB_PASSWORD`, dan `DB_NAME` terisi dengan benar.

### 3. Migrasi & Seeder Database
Jalankan migrasi tabel dan data awal (seeder akun administrator, pengaturan situs, kategori, dan kapabilitas awal):
```bash
npm run migrate
npm run seed
```

Kredensial Default Admin:
- **URL Login:** `http://localhost:3000/admin/login`
- **Email:** `admin@euodoo.com`
- **Kata Sandi:** `AdminEuodoo2026!`

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Akses website melalui peramban pada `http://localhost:3000`.

---

## 🧪 Menjalankan Rangkaian Pengujian Otomatis

Project ini dilengkapi dengan test suite otomatis yang mencakup pengujian keamanan, alur CMS, dan antarmuka publik SSR:

```bash
# Uji Fitur Publik SSR, Lokalisasi, Katalog Produk, dan Alur RFQ
node tests/test-public-ssr.js

# Uji Autentikasi Admin, Keamanan CSRF, CRUD CMS, dan Ekspor CSV
node tests/test-admin-crud.js
```

---

## ☁️ Panduan Deployment cPanel Jagoanhosting (CloudLinux Node.js Selector)

1. **Unggah Berkas ke Hosting:**
   Unggah seluruh berkas project ke direktori aplikasi (misal: `/home/username/public_html` atau direktori sub-domain). Pastikan direktori `node_modules` tidak diikutsertakan (akan diinstal via cPanel).
2. **Setup Node.js App di cPanel:**
   - Buka menu **Setup Node.js App** di cPanel.
   - Klik **Create Application**.
   - Pilih versi Node.js: **20.x** (LTS).
   - Masukkan **Application root** (lokasi folder berkas Anda).
   - Masukkan **Application startup file**: `server.js`.
   - Klik **Create**.
3. **Konfigurasi Environment Variable:**
   Di halaman Node.js Selector, tambahkan variabel lingkungan berikut:
   - `NODE_ENV` = `production`
   - `DB_HOST` = `localhost`
   - `DB_PORT` = `3306`
   - `DB_USER` = `username_cpanel`
   - `DB_PASSWORD` = `password_database_cpanel`
   - `DB_NAME` = `username_euodoo_db`
   - `JWT_SECRET` = `(string acak minimal 32 karakter)`
   - `COOKIE_SECRET` = `(string acak)`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` untuk notifikasi email.
4. **Instal Dependensi & Migrasi di Terminal cPanel:**
   ```bash
   source /home/username/nodevenv/public_html/20/bin/activate
   cd /home/username/public_html
   npm install --production
   npm run migrate
   npm run seed
   ```
5. **Restart Aplikasi:**
   Klik tombol **Restart** pada panel Node.js Selector di cPanel.
   File [.htaccess](file:///home/itpc/Euodoo/.htaccess) yang sudah disediakan akan otomatis mengarahkan lalu lintas HTTPS dan menangani caching aset statis.

---

## 📁 Struktur Direktori Utama

```
Euodoo/
├── .agents/              # Dokumentasi PRD, Tech Spec, dan Task Tracker
├── config/               # Koneksi Database MySQL & Konfigurasi Mailer
├── controllers/
│   ├── admin/            # Controller Dashboard, Banner, Produk, Lead, dsb.
│   └── public/           # Controller Beranda, Produk, SEO, dan Kontak
├── database/             # Skrip Migrasi SQL dan Data Seeder
├── locales/              # Kamus Dwibahasa id.json dan en.json
├── middleware/           # Auth JWT, Rate Limiting, CSRF, Multer & i18n
├── models/               # Model Database Abstraksi CRUD (MySQL2)
├── public/               # Asset Statis (CSS Tokens, JS, Images, Uploads)
├── routes/               # Deklarasi Rute Admin dan Publik
├── tests/                # Test Suite Otomatis
├── views/                # Template Tampilan EJS (Admin & Public)
├── app.js                # Inisialisasi Express & Konfigurasi Middleware
├── server.js             # Entry Point HTTP Server & Passenger Support
└── .htaccess             # Konfigurasi Apache & CloudLinux Passenger
```

---

## 🛡️ Standar Kepatuhan Antislop
- Bebas karakter em dash (`—`) pada seluruh teks antarmuka dan basis data.
- Ukuran target interaksi minimal 44 x 44 px untuk kenyamanan peranti layar sentuh.
- Kontras warna teks memenuhi kriteria minimum WCAG AA (rasio kontras > 4.5:1).
- Navigasi keyboard penuh (`:focus-visible` dan tombol `Escape` untuk menutup drawer/modal).
