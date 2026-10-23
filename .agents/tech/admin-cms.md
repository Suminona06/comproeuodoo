Status: ACTIVE | Terakhir diverifikasi: 2026-10-21 | Kode: routes/adminRoutes.js, controllers/admin/, middleware/authMiddleware.js

# Tech Spec: Modul Admin & CMS (Admin CMS & Users)

## 1. Arsitektur & Keamanan Autentikasi
Modul Admin CMS mengamankan akses backoffice melalui JWT (JSON Web Token) yang disimpan dalam Cookie HttpOnly, validasi peran RBAC, pembatasan serangan brute-force, serta pengelolaan data pengguna dan formulir penawaran.

---

## 2. Rute & Controller

| Method | Path | Controller / Handler | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET/POST`| `/admin/login` | `authController.loginView` / `login` | `loginLimiter`, `optionalAuth` | Form & autentikasi login |
| `GET/POST`| `/admin/logout` | `authController.logout` | `requireAuth` | Mengakhiri sesi pengguna |
| `GET/POST`| `/admin/change-password` | `authController.*` | `requireAuth` | Perbarui kata sandi mandiri |
| `GET` | `/admin` / `/admin/dashboard`| `dashboardController.index` | `requireAuth` | Tinjauan metrik operasional |
| `GET/POST`| `/admin/users` | `userController.*` | `requireAuth`, `roleMiddleware(['superadmin'])` | CRUD akun pengguna |
| `GET` | `/admin/inquiries` | `inquiryController.index` | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | Tinjauan data RFQ prospek |
| `GET` | `/admin/inquiries/export` | `inquiryController.exportCsv` | `requireAuth`, `roleMiddleware` | Ekspor data prospek CSV |
| `POST` | `/admin/inquiries/:id/status`| `inquiryController.updateStatus` | `requireAuth`, `roleMiddleware` | Update status & catatan sales |
| `POST` | `/admin/inquiries/:id/delete`| `inquiryController.destroy` | `requireAuth`, `roleMiddleware` | Hapus rekaman RFQ |

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

## 5. Spesifikasi Formulir Produk CMS & Multi-Picker Gallery [PENDING T-202]

1. **Komponen Form Produk (`views/admin/products/create.ejs` & `edit.ejs`):**
   - **Thumbnail Utama:** Input hidden `image_url` terhubung ke single-select Universal Media Picker (dipertahankan).
   - **Galeri Foto Produk (Multi-Picker):** Input hidden `gallery_images` menyimpan JSON array string URL. Tombol pemilih memanggil modal via `openMediaPicker({ multiple: true, type: 'image', onSelect: (items) => ... })`.
   - **Pengurutan (Reorder) & Hapus Galeri:** Setiap kartu thumbnail memiliki tombol panah geser (`btn-move-left` / `btn-move-right`) dan tombol silang (×) untuk menghapus. Setiap aksi memicu re-index array URL ke input hidden.
   - **Short Description ID & EN:** Textarea dengan atribut `maxlength="200"` dan elemen counter `.char-counter` yang ter-update via event `input`.
   - **Deskripsi Lengkap TinyMCE:** Memuat script `/tinymce/tinymce.min.js` dan inisialisasi pada `#description_id` dan `#description_en` konsisten dengan modul artikel/posts.
   - **Varian Ukuran Dinamis:** Kontainer `#variantsContainer`, tombol `#btnAddVariant` menyisipkan baris `<input name="variant_labels[]">`, tombol `.btn-remove-variant` menghapus baris. Serialisasi ke JSON array string di controller.
   - **Tabel Ukuran Dinamis:** Kontainer `#sizeTableContainer`, tombol `#btnAddSizeRow` menyisipkan baris dengan 6 input: `size_code[]`, `size_width[]`, `size_length[]`, `size_thickness[]`, `size_capacity[]`, `size_material[]`. Serialisasi ke JSON array of objects di controller.
   - **Layout Responsif Modal & Form:** Header form sticky, area form scrollable, action buttons (Batal/Simpan) selalu terlihat di viewport pada zoom 100%, 125%, 150%.

2. **Validasi Server-Side Controller (`controllers/admin/productController.js`) [PENDING T-200]:**
   - Sanitasi input dan batas maksimal 500 karakter untuk `short_description_id` dan `short_description_en`.
   - Validasi struktur JSON array of strings untuk `variants`.
   - Validasi whitelist keys: `['product_code', 'width', 'length', 'thickness', 'capacity', 'material']` untuk setiap objek pada `size_table`.
   - Validasi format URL untuk `gallery_images`.
