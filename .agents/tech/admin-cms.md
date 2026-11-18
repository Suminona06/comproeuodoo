Status: ACTIVE | Terakhir diverifikasi: 2026-11-17 | Kode: routes/adminRoutes.js, controllers/admin/, middleware/authMiddleware.js

# Tech Spec: Modul Admin & CMS (Admin CMS & Users)

## 1. Arsitektur & Keamanan Autentikasi
Modul Admin CMS mengamankan akses backoffice melalui JWT (JSON Web Token) yang disimpan dalam Cookie HttpOnly, validasi peran RBAC, pembatasan serangan brute-force, serta pengelolaan data pengguna, katalog produk admin, dan formulir penawaran (RFQ).

---

## 2. Rute & Controller

| Method | Path | Controller / Handler | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET/POST`| `/admin/login` | `authController.loginView` / `login` | `loginLimiter`, `optionalAuth` | Form & autentikasi login |
| `GET/POST`| `/admin/logout` | `authController.logout` | `requireAuth` | Mengakhiri sesi pengguna |
| `GET/POST`| `/admin/change-password` | `authController.*` | `requireAuth` | Perbarui kata sandi mandiri |
| `GET` | `/admin` / `/admin/dashboard`| `dashboardController.index` | `requireAuth` | Metrik operasional & 10 RFQ terbaru (`LIMIT 10`) |
| `GET/POST`| `/admin/users` | `userController.*` | `requireAuth`, `roleMiddleware(['superadmin'])` | CRUD akun pengguna |
| `GET` | `/admin/inquiries` | `inquiryController.index` | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | Daftar RFQ (SSR + JSON Fetch tanpa reload) |
| `GET` | `/admin/inquiries/export` | `inquiryController.exportCsv` | `requireAuth`, `roleMiddleware` | Ekspor data prospek CSV |
| `POST` | `/admin/inquiries/:id/status`| `inquiryController.updateStatus` | `requireAuth`, `roleMiddleware` | Update status & catatan sales |
| `POST` | `/admin/inquiries/:id/delete`| `inquiryController.destroy` | `requireAuth`, `roleMiddleware` | Hapus rekaman RFQ |
| `GET` | `/admin/products` | `productController.index` | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | Katalog Produk Admin (SSR + JSON Fetch tanpa reload) |

---

## 3. Skema Data Terkait

### Tabel `users`
*File Migrasi:* `database/migrations/001_create_initial_schema.sql`, `003_upgrade_v2_schema.sql`

| Kolom | Tipe | Nullable | Default | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Inc | Primary Key |
| `name` | `VARCHAR(100)` | NO | - | Nama lengkap staf |
| `email` | `VARCHAR(150)` | NO | - | Unique email kredensial login |
| `password_hash` | `VARCHAR(255)` | NO | - | Hash kata sandi bcrypt |
| `role` | `ENUM('superadmin','admin','editor')` | YES | `'admin'` | Hak akses RBAC pengguna |
| `failed_attempts`| `INT` | YES | `0` | Counter kesalahan login berturut-turut |
| `locked_until` | `DATETIME` | YES | NULL | Stempel waktu kedaluwarsa akun terkunci |
| `created_at` | `TIMESTAMP` | YES | Current Time | Waktu pembuatan akun |
| `updated_at` | `TIMESTAMP` | YES | Current Time | Waktu update terakhir |

---

## 4. Mekanisme Keamanan Sesi & RBAC

1. **Penerbitan Token JWT:**
   - Saat login sukses, controller menerbitkan token JWT yang memuat payload: `{ id, email, name, role }`.
   - Token disimpan pada cookie bernama `token` dengan opsi: `httpOnly: true`, `sameSite: 'lax'`, `maxAge: 3600000` (1 jam).
2. **Middleware Verifikasi (`authMiddleware.js`):**
   - Membaca token dari cookie. Jika valid, payload didekode dan disimpan ke `req.user` serta `res.locals.currentUser`.
   - Jika token tidak valid atau kedaluwarsa, pengguna diarahkan ke `/admin/login`.
3. **Middleware Peran (`roleMiddleware.js`):**
   - Menerima parameter array peran yang diizinkan (misal `roleMiddleware(['superadmin'])`).
   - Jika `req.user.role` tidak memenuhi syarat, server langsung merespons dengan HTTP 403 Forbidden (`views/admin/403.ejs`).
4. **Proteksi Brute-Force:**
   - Setelah 5 kali gagal memasukkan kata sandi, kolom `locked_until` diisi `NOW() + INTERVAL 15 MINUTE`.
   - Selama masa terkunci, sistem menolak seluruh upaya login untuk akun tersebut dan mengembalikan pesan error countdown.
5. **Proteksi Noindex Total (`FR-35`):**
   - `app.js` memasang header `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` di `/admin` sebelum `csrfProtection`, sehingga mencakup seluruh rute admin, `loginLimiter`, `requireAuth`, `roleMiddleware`, CSRF HTML/JSON, API JSON, ekspor CSV, serta error 401/403/429/404/500.
   - `views/admin/login.ejs`, `views/partials/admin-header.ejs`, `views/admin/403.ejs`, serta fallback HTML `csrfMiddleware.js`/`roleMiddleware.js`/`errorHandler.js` wajib menyertakan `<meta name="robots" content="noindex, nofollow">` (detail pada [tech/seo-security.md](seo-security.md)).

---

## 5. Dashboard RFQ, Paginasi Dinamis & Formulir Produk CMS
Spesifikasi teknis tabel RFQ dashboard (`LIMIT 10`), validasi whitelist & kontrak Fetch paginasi tanpa reload (`/admin/inquiries`, `/admin/products`), serta builder formulir produk & tabel ukuran dinamis dipisahkan ke sub-modul [tech/admin-products-rfq.md](admin-products-rfq.md).

---

## 6. Standar Komponen UI, Tombol, Paginasi & Validasi Form Admin
Spesifikasi teknis sistem tombol (`.adm-btn-*`), tampilan slug 1 baris (`.adm-slug-text`), validasi form (`public/js/admin-form-validation.js`), SweetAlert2 bertema, serta komponen paginasi bersama Varian 1 (`.pgn-*`) didokumentasikan pada sub-modul [tech/admin-ui.md](admin-ui.md).
