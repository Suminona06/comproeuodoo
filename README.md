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

Jalankan migrasi tabel, sinkronisasi konten terkini (`020_seed_current_content_v1.sql`), dan pemulihan aset gambar/video baseline dari `database/seed-assets/uploads/` ke `public/uploads/` (non-destruktif):

```bash
npm run migrate
npm run seed
```

Jika Anda menyunting konten, gambar, atau video melalui CMS lokal dan ingin memperbarui snapshot untuk disimpan ke GitHub:

```bash
# Memperbarui database/seeds/snapshot.json & database/seed-assets/uploads/
npm run seed:export

# Atau sekaligus menghasilkan/memperbarui file migrasi SQL
npm run seed:export -- --write-migration database/migrations/021_nama_snapshot.sql
```

Kredensial Default Admin:

- **URL Login:** `http://localhost:3000/admin/login`
- **Email:** `admin@euodoo.com`
- **Kata Sandi:** `AdminEuodoo2026!`

### 4. Menjalankan Server Pengembangan

```bash
npm run dev
```

Akses website melalui peramban:

- **Local (PC ini):** `http://localhost:3000`
- **Jaringan Lokal (Akses dari HP / Laptop lain via Wi-Fi/LAN):**
  Untuk mengakses server dari perangkat lain melalui IP Address PC Windows Anda:

  ```bash
  npm run port-forward
  ```

  _(Atau double-click file `port-forward.bat` dari Windows Explorer)._
  Perintah ini otomatis mengonfigurasi `netsh portproxy` dan Windows Firewall sehingga server dapat diakses melalui `http://<IP_PC_WINDOWS>:3000`.

  Untuk mengecek status port forwarding:

  ```bash
  npm run port-forward:status
  ```

  Untuk membersihkan rule port forwarding:

  ```bash
  npm run port-forward:clean
  ```

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
   git pull origin main
   npm install --production
   npm run migrate
   # Jalankan npm run seed hanya pada setup awal atau jika ingin mengisi ulang akun default
   ```
   Perintah `npm run migrate` otomatis mengeksekusi migrasi skema & konten sekali jalan serta menyalin aset gambar, video, dan favicon baseline yang belum ada dari `database/seed-assets/uploads/` ke `public/uploads/` tanpa menimpa unggahan CMS yang sudah berjalan di server.
5. **Restart Aplikasi:**
   Klik tombol **Restart** pada panel Node.js Selector di cPanel.
   File [.htaccess](.htaccess) yang sudah disediakan akan otomatis mengarahkan lalu lintas HTTPS dan menangani caching aset statis.

---

## 🤖 CI Quality Gate & Deploy Staging (GitHub Actions)

- **CI Quality Gate** ([.github/workflows/ci.yml](.github/workflows/ci.yml)) memvalidasi setiap PR/push ke `main`:
  - Lint kode JS (`npm run lint`), lint template EJS/CSS (`npm run lint:views`), dan audit kamus i18n (`npm run lint:i18n`).
  - Verifikasi integritas `snapshot.json`, kelengkapan 34 aset media baseline di `database/seed-assets/uploads/`, serta validasi urutan migrasi (`npm run test:seed`).
  - Uji integrasi MySQL dan SSR penuh (`npm test`) dijalankan di lokal sebelum merge/deploy.
- **Deploy Staging cPanel** ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) berjalan otomatis setelah `CI Quality Gate` sukses pada push ke `main` (atau manual lewat `workflow_dispatch` dengan opsi `run_seed`): menyinkronkan kode `origin/main`, menjaga blok Passenger `.htaccess`, menjalankan `npm install --omit=dev` & `npm run migrate`, lalu me-restart Passenger via `tmp/restart.txt`.

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
