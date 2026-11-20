Status: ACTIVE | Terakhir diverifikasi: 2026-11-19 | Kode: routes/adminRoutes.js, controllers/admin/, services/, middleware/authMiddleware.js

# Tech Spec: Modul Admin & CMS (Admin CMS & Users)

## 1. Arsitektur & Keamanan Autentikasi
Modul Admin CMS mengamankan akses backoffice melalui JWT (JSON Web Token) yang disimpan dalam Cookie HttpOnly, validasi peran RBAC, pembatasan serangan brute-force, serta pengelolaan data pengguna, katalog produk admin, dan formulir penawaran (RFQ).

- **Arsitektur Berlapis Controller & Service:** Modul CMS refaktor Batch 1–3 (`about`, `homeContent`, `media`, `auth`, `banner`, `brand`, `inquiry`, `product`, `productCategory`, `lead`, `post`, `postCategory`, `user`, `setting`, `contactCms`, `pageHeroBanner`, `capability`) mengikuti `Route -> Controller -> Service -> Model` dan blok strict `error` `eslint.config.js` ([tech/conventions.md](conventions.md)).

---

## 2. Rute & Controller

| Method | Path | Controller / Handler | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET/POST`| `/admin/login` | `authController.loginView` / `login` (`authService`) | `loginLimiter`, `optionalAuth` | Form & autentikasi login |
| `GET/POST`| `/admin/logout` | `authController.logout` | `requireAuth` | Mengakhiri sesi pengguna |
| `GET/POST`| `/admin/change-password` | `authController.*` (`authService`) | `requireAuth` | Perbarui kata sandi mandiri |
| `GET` | `/admin` / `/admin/dashboard`| `dashboardController.index` | `requireAuth` | Metrik operasional & 10 RFQ terbaru (`LIMIT 10`) |
| `GET/POST`| `/admin/users` | `userController.*` (`userService`) | `requireAuth`, `roleMiddleware(['superadmin'])` | CRUD pengguna (ID positif, whitelist role, email unik, anti self-delete, password setara `authService`) |
| `GET/POST`| `/admin/hero-banners*` | `pageHeroBannerController.*` (`pageHeroBannerService`) | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | Hero banner halaman (clamp `overlay_opacity` `0..1`/fallback `0.60`, URL aman, error generik DB) |
| `GET/POST`| `/admin/inquiries*` | `inquiryController.*` (`inquiryService`) | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | Daftar RFQ (SSR+Fetch), detail, status, hapus & CSV ([tech/admin-products-rfq.md](admin-products-rfq.md)) |
| `GET/POST`| `/admin/products*` | `productController.*` (`product*Service`) | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | Produk, Fetch & CSV ([tech/admin-products-rfq.md](admin-products-rfq.md)) |
| `GET/POST`| `/admin/product-categories*` | `productCategoryController.*` (`productCategoryService`, `slugHelper`) | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | CRUD Kategori Produk & toggle aktif (`NaN` & `not_found`) |
| `GET/POST`| `/admin/leads*` | `leadController.*` (`leadService`) | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | Leads B2B (whitelist `status` & `type`), update & CSV |
| `GET/POST`| `/admin/posts*`, `/admin/post-categories*` | `postController.*`, `postCategoryController.*` (`post*Service`) | `requireAuth`, `roleMiddleware` | Artikel, TinyMCE, slug 301 & Kategori ([tech/news.md](news.md)) |
| `GET/POST`| `/admin/banners*` | `bannerController.*` (`bannerService`) | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | CRUD Hero Banner & toggle aktif ([tech/public-home.md](public-home.md)) |
| `GET/POST`| `/admin/brands*` | `brandController.*` (`brandService`) | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | CRUD Merek & judul seksi merek ([tech/public-home.md](public-home.md)) |
| `GET/POST`| `/admin/about*` | `aboutController.*` (`aboutService`, `aboutCrudService`) | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | CMS Tentang Kami & sub-item ([tech/public-about.md](public-about.md)) |
| `GET/POST`| `/admin/home-content` | `homeContentController.*` (`homeContentService`) | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | CMS Konten Homepage ([tech/public-home.md](public-home.md)) |
| `GET/POST/DELETE`| `/admin/media*`, `/admin/api/media*` | `mediaController.*` (`mediaService`) | `requireAuth`, `roleMiddleware` | Media Library & Picker API ([tech/media-library.md](media-library.md)) |

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

1. **Penerbitan Token JWT & `services/authService.js`:**
   - Saat login sukses, `services/authService.js` menerbitkan token JWT yang memuat payload `{ id, email, name, role }` serta opsi cookie sesi (`httpOnly: true`, `sameSite: 'lax'`, `secure: process.env.NODE_ENV === 'production'`, `maxAge: 3600000` / 1 jam), dan `controllers/admin/authController.js` memasangnya pada cookie `token`.
   - Pada pergantian kata sandi (`authService.changeAdminPassword`), nilai `new_password` divalidasi secara konsisten dengan nilai yang di-hash (menolak input kosong/hanya spasi, `< 8` karakter tanpa memotong spasi valid secara diam-diam, ketidaksesuaian konfirmasi, serta kata sandi baru yang sama persis dengan kata sandi lama).
2. **Middleware Verifikasi (`authMiddleware.js`):**
   - Membaca token dari cookie. Jika valid, payload didekode dan disimpan ke `req.user` serta `res.locals.currentUser`.
   - Jika token tidak valid atau kedaluwarsa, pengguna diarahkan ke `/admin/login`.
3. **Middleware Peran (`roleMiddleware.js`):**
   - Menerima parameter array peran yang diizinkan (misal `roleMiddleware(['superadmin'])`).
   - Jika `req.user.role` tidak memenuhi syarat, server langsung merespons dengan HTTP 403 Forbidden (`views/admin/403.ejs`).
4. **Proteksi Brute-Force & Reset Counter Kedaluwarsa:**
   - Setelah 5 kali gagal memasukkan kata sandi, kolom `locked_until` diisi `NOW() + INTERVAL 15 MINUTE`.
   - Selama masa terkunci, sistem menolak seluruh upaya login untuk akun tersebut dan mengembalikan pesan error countdown sisa menit.
   - Apabila masa `locked_until` telah lewat (`!userModel.isAccountLocked(user)`) namun `user.locked_until !== null` atau `user.failed_attempts >= 5`, `authService` mereset counter kesalahan sebelumnya ke `0` terlebih dahulu sehingga kegagalan baru dihitung mulai dari percobaan ke-1 (`attemptsLeft: 4`).
5. **Proteksi Noindex Total (`FR-35`):**
   - `app.js` memasang header `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` di `/admin` sebelum `csrfProtection`, sehingga mencakup seluruh rute admin, `loginLimiter`, `requireAuth`, `roleMiddleware`, CSRF HTML/JSON, API JSON, ekspor CSV, serta error 401/403/429/404/500.
   - `views/admin/login.ejs`, `views/partials/admin-header.ejs`, `views/admin/403.ejs`, serta fallback HTML `csrfMiddleware.js`/`roleMiddleware.js`/`errorHandler.js` wajib menyertakan `<meta name="robots" content="noindex, nofollow">` (detail pada [tech/seo-security.md](seo-security.md)).

---

## 5. Dashboard RFQ, Paginasi & Produk CMS
Tabel RFQ dashboard (`LIMIT 10`), paginasi Fetch (`/admin/inquiries`, `/admin/products`), serta form produk & tabel ukuran lihat [tech/admin-products-rfq.md](admin-products-rfq.md).

---

## 6. Standar UI, Tombol, Paginasi & Validasi Admin
Sistem tombol (`.adm-btn-*`), slug 1 baris (`.adm-slug-text`), validasi form (`public/js/admin-form-validation.js`), SweetAlert2, serta paginasi `.pgn-*` lihat [tech/admin-ui.md](admin-ui.md).
