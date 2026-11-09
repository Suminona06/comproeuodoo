Status: ACTIVE | Terakhir diverifikasi: 2026-11-02 | Kode: routes/adminRoutes.js, controllers/admin/, middleware/authMiddleware.js

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
| `GET` | `/admin` / `/admin/dashboard`| `dashboardController.index` | `requireAuth` | Metrik operasional & 10 RFQ terbaru (`LIMIT 10`) `[PENDING T-302]` |
| `GET/POST`| `/admin/users` | `userController.*` | `requireAuth`, `roleMiddleware(['superadmin'])` | CRUD akun pengguna |
| `GET` | `/admin/inquiries` | `inquiryController.index` | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | Daftar RFQ (SSR + JSON Fetch tanpa reload) `[PENDING T-304]` |
| `GET` | `/admin/inquiries/export` | `inquiryController.exportCsv` | `requireAuth`, `roleMiddleware` | Ekspor data prospek CSV |
| `POST` | `/admin/inquiries/:id/status`| `inquiryController.updateStatus` | `requireAuth`, `roleMiddleware` | Update status & catatan sales |
| `POST` | `/admin/inquiries/:id/delete`| `inquiryController.destroy` | `requireAuth`, `roleMiddleware` | Hapus rekaman RFQ |
| `GET` | `/admin/products` | `productController.index` | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | Katalog Produk Admin (SSR + JSON Fetch tanpa reload) `[PENDING T-305]` |

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

---

## 5. Dashboard RFQ & Paginasi Tanpa Reload (`/admin/dashboard`, `/admin/inquiries`, `/admin/products`) `[PENDING T-302, T-304, T-305]`

1. **Tabel RFQ Dashboard (`/admin/dashboard`) `[PENDING T-302]`:**
   - `controllers/admin/dashboardController.js` memanggil `inquiryModel.findAll({ limit: 10 })` (`ORDER BY i.created_at DESC, i.id DESC LIMIT 10` di query SQL, tanpa paginasi).
   - Pada `views/admin/dashboard.ejs`, pembungkus `#rfqDataTable` menggunakan class `.table-scroll-wrapper--mobile-only` yang menonaktifkan scroll pada desktop (`> 768px`: `overflow: visible; max-height: none`) dan mempertahankan `overflow-x: auto` pada mobile (`<= 768px`).
2. **Validasi Whitelist Paginasi Server (`/admin/inquiries` & `/admin/products`) `[PENDING T-304, T-305]`:**
   - `per_page`: di-whitelist ke `[10, 25, 50, 100]` (default `10`, maksimal `100`); nilai di luar daftar (mis. `?per_page=1000`, `0`, negatif, huruf) dinormalkan ke `10`.
   - `page`: bilangan bulat `>= 1`; nilai tidak valid dinormalkan ke `1` dan dibatasi ke `totalPages = Math.max(1, Math.ceil(totalRows / perPage))`.
   - Query di `models/inquiryModel.js` dan `models/productModel.js` menggunakan *prepared statements* terparameter (`LIMIT ? OFFSET ?`, filter `status` / `category_id`, dan pencarian `q`).
3. **Kontrak Respons Fetch Tanpa Reload `[PENDING T-304, T-305]`:**
   - Saat menerima header `Accept: application/json` (atau `X-Requested-With: fetch`), `GET /admin/inquiries` dan `GET /admin/products` mengembalikan JSON `{ ok: true, rowsHtml, inquiriesData (khusus RFQ), pagination: { page, perPage, totalRows, totalPages } }`.
   - Klien (`public/js/pagination.js`, `public/js/admin-inquiries.js`, `public/js/admin-products.js`) memperbarui `<tbody>`, menyinkronkan URL via `history.pushState` (`?page=&per_page=`), re-init `window.initEuDropdowns()`, memperbarui `inquiriesData` modal `#inquiryQuickModal`, serta memundurkan halaman aktif bila penghapusan data membuat halaman terakhir kosong.

---

## 6. Spesifikasi Formulir Produk CMS & Multi-Picker Gallery

1. **Komponen Form Produk (`views/admin/products/create.ejs` & `edit.ejs`):**
   - **Thumbnail Utama & Galeri Multi-Picker:** Input hidden `image_url` (single-select) dan `gallery_images` (JSON array URL dengan tombol geser kiri/kanan dan hapus).
   - **Short & Full Description (ID & EN):** Textarea `maxlength="200"` dengan `.char-counter` serta editor TinyMCE (`#description_id`, `#description_en`).
   - **Kustomisasi Tombol CTA Produk:** Input `#cta_text_id` dan `#cta_text_en` (`maxlength="50"`, fallback ke teks default WhatsApp).
   - **Varian & Builder Tabel Ukuran Dinamis:** Kontainer `#variantsContainer` (`variant_labels[]`) dan `#dynamicSizeEditor` (`.prod-size-builder`, batas 1-8 kolom, 0-30 baris, label maks 40 char, sel maks 80 char, modal `#modalCopySizeColumns` via `GET /admin/products/:id/size-table-columns`, konfirmasi SweetAlert2, navigasi panah keyboard antar sel `.prod-size-cell`, dan serialisasi JSON `{ columns, rows }`).
   - **Layout Responsif Modal & Form:** Header form sticky, area form scrollable, tombol aksi selalu terlihat pada zoom 100%, 125%, 150%.
2. **Validasi Server-Side Controller (`controllers/admin/productController.js`):**
   - Sanitasi batas 200 karakter pada deskripsi singkat, 50 karakter pada teks CTA, validasi JSON array `variants` & `gallery_images`, serta verifikasi whitelist kunci sel terhadap daftar kolom aktif via `parseDynamicSizeTable`.

---

## 7. Standar Komponen UI, Tombol, Paginasi & Validasi Form Admin
Spesifikasi teknis sistem tombol (`.adm-btn-*`), tampilan slug 1 baris (`.adm-slug-text`), validasi form (`public/js/admin-form-validation.js`), SweetAlert2 bertema, serta komponen paginasi bersama Varian 1 (`.pgn-*`) didokumentasikan pada sub-modul [tech/admin-ui.md](admin-ui.md).
