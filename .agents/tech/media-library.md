Status: ACTIVE | Terakhir diverifikasi: 2026-10-21 | Kode: controllers/admin/mediaController.js, middleware/uploadMiddleware.js, models/mediaModel.js

# Tech Spec: Modul Media Library (Media & Storage)

## 1. Arsitektur & Pipa Pemrosesan Berkas
Modul Media Library mengelola alur unggah berkas, kompresi gambar otomatis ke format WebP menggunakan library Sharp, pembuatan thumbnail, integrasi YouTube, serta antarmuka pemilih berkas terpadu (Universal Media Picker).

---

## 2. Rute & Controller

| Method | Path | Controller / Handler | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/admin/media` | `mediaController.index` | `requireAuth`, `roleMiddleware(['superadmin','admin','editor'])` | Antarmuka galeri berkas |
| `GET` | `/admin/media/api` | `mediaController.apiList` | `requireAuth`, `roleMiddleware` | API JSON daftar berkas untuk picker |
| `POST` | `/admin/media/upload` | `mediaController.upload` | `requireAuth`, `roleMiddleware`, `uploadMedia.single('file')` | Upload form konvensional |
| `POST` | `/admin/api/media/upload`| `mediaController.apiUpload`| `requireAuth`, `roleMiddleware`, `uploadMedia.single('file')` | Upload asinkron dari modal picker |
| `POST` | `/admin/media/youtube` | `mediaController.addYoutube`| `requireAuth`, `roleMiddleware` | Daftarkan tautan video YouTube |
| `POST` | `/admin/api/media/check-usage`| `mediaController.apiCheckUsage`| `requireAuth`, `roleMiddleware` | Audit penggunaan sebelum hapus |
| `POST` | `/admin/media/:id/delete`| `mediaController.destroy` | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | Hapus berkas dari DB & storage |

---

## 3. Skema Data Terkait

### Tabel `media`
*File Migrasi:* `database/migrations/001_create_initial_schema.sql`, `003_upgrade_v2_schema.sql`

| Kolom | Tipe | Nullable | Default | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Inc | Primary Key |
| `filename` | `VARCHAR(255)` | NO | - | Nama unik berkas tersimpan di storage |
| `original_name`| `VARCHAR(255)` | NO | - | Nama asli berkas saat diunggah |
| `file_url` | `VARCHAR(500)` | NO | - | Path URL publik berkas |
| `thumbnail_url`| `VARCHAR(500)` | YES | NULL | Path URL gambar thumbnail pratinjau |
| `mime_type` | `VARCHAR(100)` | NO | - | MIME type (image/webp, video/mp4, dsb) |
| `file_size` | `INT` | NO | - | Ukuran berkas dalam satuan bytes |
| `width` | `INT` | YES | NULL | Lebar piksel (khusus gambar) |
| `height` | `INT` | YES | NULL | Tinggi piksel (khusus gambar) |
| `storage_driver`| `ENUM('local','s3')` | YES | `'local'` | Lokasi penyimpanan fisik berkas |
| `created_at` | `TIMESTAMP` | YES | Current Time | Stempel waktu pengunggahan |

---

## 4. Pipeline Pemrosesan Sharp WebP & Driver Penyimpanan
1. **Validasi Multer (`uploadMiddleware.js`):**
   - Batas ukuran berkas maksimal: 30 MB (`UPLOAD_MAX_SIZE`).
   - MIME Whitelist: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`, `video/mp4`, `video/webm`.
   - File disimpan sementara di memori buffer (`multer.memoryStorage()`).
2. **Transformasi Sharp:**
   - Gambar raster otomatis dikonversi ke WebP kualitas 82% dengan metadata orientasi EXIF dipertahankan (`.rotate()`).
   - Dimensi gambar dibatasi maksimal lebar 1920px untuk gambar banner/konten.
   - Thumbnail di-generate dengan lebar 300px (`cover` mode) untuk katalog pratinjau cepat.
3. **Penyimpanan:**
   - Driver `local`: berkas disimpan di direktori `public/uploads/media/`.
   - Driver `s3`: berkas diunggah via AWS SDK ke bucket S3 yang ditentukan di `.env`.

---

## 5. Audit Ketergantungan Media (`check-usage`)
Fungsi `mediaController.apiCheckUsage` menjalankan query agregasi ke 7 tabel database:
`banners (file_url)`, `page_hero_banners (image_url)`, `settings (site_logo_*, site_favicon)`, `products (main_image)`, `brands (logo_url)`, `posts (cover_image)`, dan `capabilities (image_url)`.
Jika ditemukan referensi aktif, sistem mengembalikan daftar lokasi keterkaitan dan mencegah penghapusan tanpa konfirmasi eksplisit dari admin.
