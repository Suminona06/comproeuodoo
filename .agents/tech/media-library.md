Status: ACTIVE | Terakhir diverifikasi: 2026-11-21 | Kode: controllers/admin/mediaController.js, services/mediaService.js, middleware/uploadMiddleware.js, models/mediaModel.js, utils/seedAssetsSync.js

# Tech Spec: Modul Media Library (Media & Storage)

Dokumen ini adalah pasangan [prd/media-library.md](../prd/media-library.md) dan dipisahkan dengan sub-modul antarmuka picker di [tech/media-picker.md](media-picker.md).

## 1. Arsitektur & Pipa Pemrosesan Berkas
Modul Media Library mengelola alur unggah berkas, kompresi gambar otomatis ke format WebP menggunakan library Sharp, pembuatan thumbnail, integrasi YouTube, serta antarmuka pemilih berkas terpadu (Universal Media Picker) mengikuti pola `Route -> Controller -> Service -> Model`:
- **Controller (`controllers/admin/mediaController.js`):** Bertindak sebagai *thin controller* (`<= 40` baris/fungsi, `max-depth <= 2`, `complexity <= 8`) yang mem-parsing request, menjaga `cleanupTempFile(req.file)` pada blok `finally`, serta mengirim respons HTML redirect atau JSON (`200/400/404/409/500`).
- **Service (`services/mediaService.js`):** Mengorkestrasi `getMediaLibraryViewData`, `buildEmptyMediaLibraryViewData`, `getMediaPickerList`, `uploadAndCreateMedia` (pipa tunggal image/video/PDF dipakai bersama oleh `upload` & `apiUpload`), `registerYoutubeMedia`, `checkMediaUsage(fileUrl, mediaId)`, dan `deleteMediaItem` (mengembalikan status terstruktur `{ status: 'not_found' | 'in_use' | 'deleted', usages }`).

---

## 2. Rute & Controller

| Method | Path | Controller / Handler | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/admin/media` | `mediaController.index` | `requireAuth`, `roleMiddleware(['superadmin','admin','editor'])` | Antarmuka galeri berkas via `mediaService.getMediaLibraryViewData` |
| `GET` | `/admin/media/api`, `/admin/api/media` | `mediaController.apiList` | `requireAuth`, `roleMiddleware` | API JSON daftar berkas untuk picker via `mediaService.getMediaPickerList` |
| `POST` | `/admin/media/upload` | `mediaController.upload` | `requireAuth`, `roleMiddleware`, `uploadLargeMedia.single('file')` | Upload form via `mediaService.uploadAndCreateMedia` + `cleanupTempFile` |
| `POST` | `/admin/api/media/upload`| `mediaController.apiUpload`| `requireAuth`, `roleMiddleware`, `uploadLargeMedia.single('file')` | Upload asinkron picker via `mediaService.uploadAndCreateMedia` + `cleanupTempFile` |
| `POST` | `/admin/media/youtube` | `mediaController.addYoutube`| `requireAuth`, `roleMiddleware` | Daftarkan video YouTube via `mediaService.registerYoutubeMedia` |
| `POST` | `/admin/api/media/check-usage`| `mediaController.apiCheckUsage`| `requireAuth`, `roleMiddleware` | Audit penggunaan via `mediaService.checkMediaUsage` |
| `POST` / `DELETE` | `/admin/media/:id/delete`, `/admin/api/media/:id` | `mediaController.destroy` | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | Hapus berkas via `mediaService.deleteMediaItem` (`200/404/409/500`, dukung `force=true`) |

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
   - Batas ukuran berkas maksimal: 30 MB (`UPLOAD_CONFIG.MAX_MEDIA_STREAM_SIZE` pada `uploadLargeMedia`).
   - MIME Whitelist: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/x-icon`, `image/vnd.microsoft.icon`, `video/mp4`, `video/webm`, `application/pdf` (SVG ditolak oleh `isSvgUpload` demi mencegah stored XSS).
   - `uploadLargeMedia` menggunakan `tempDiskStorage` (`os.tmpdir()`) dan selalu dibersihkan via `cleanupTempFile(req.file)` di blok `finally`; unggah banyak (*multi-upload*) di Universal Media Picker maupun `/admin/media` mengirim antrean berkas **satu per satu secara berurutan** dari klien ke `POST /admin/api/media/upload` dengan header `X-CSRF-Token` dan `FormData` (`_csrf`, `file`) tanpa endpoint batch baru.
2. **Transformasi Sharp:**
   - Gambar raster otomatis dikonversi ke WebP kualitas 82% dengan metadata orientasi EXIF dipertahankan (`.rotate()`).
   - Dimensi gambar dibatasi maksimal lebar 1920px untuk gambar banner/konten.
   - Thumbnail di-generate dengan lebar 300px (`cover` mode) untuk katalog pratinjau cepat.
3. **Penyimpanan:**
   - Driver `local`: berkas disimpan di direktori `public/uploads/media/`.
   - Driver `s3`: berkas diunggah via AWS SDK ke bucket S3 yang ditentukan di `.env`.
4. **Aset Baseline Terlacak Git (`database/seed-assets/uploads/`):**
   - Berkas `public/uploads/*` tetap di-gitignore agar upload CMS produksi tidak menimbulkan konflik `git pull`.
   - Salinan aset media aktif (gambar, video MP4, dan favicon settings) disimpan di `database/seed-assets/uploads/` dan disalin non-destruktif (hanya jika berkas tujuan belum ada) ke `public/uploads/` oleh `utils/seedAssetsSync.js` saat `npm run migrate` maupun `npm run seed`.

---

## 5. Audit Ketergantungan Media (`check-usage`)
Fungsi `mediaController.apiCheckUsage` dan `mediaController.destroy` mendelegasikan audit penggunaan ke `mediaService.checkMediaUsage` / `mediaService.deleteMediaItem` -> `mediaModel.checkUsage(fileUrl, mediaId)`, yang menjalankan query agregasi ke 8 tabel database:
`banners (file_url, poster_url)`, `page_hero_banners (image_url)`, `settings (setting_value)`, `products (main_image, gallery_images)`, `brands (logo_url)`, `posts (cover_image)`, `capabilities (image_url)`, dan `about_gallery_slides (image_url)`.
- Untuk `products.gallery_images` (`JSON NULL`), query menggunakan `JSON_CONTAINS` terparameter untuk mencocokkan **URL string** (`JSON_CONTAINS(gallery_images, CAST(? AS JSON))` dengan `JSON.stringify(fileUrl)`) sekaligus **ID media integer** (`OR JSON_CONTAINS(gallery_images, CAST(? AS JSON))` dengan `String(mediaId)` bila `mediaId` tersedia via parameter atau lookup `media.file_url`), dengan guard `gallery_images IS NOT NULL`.
Jika ditemukan referensi aktif, sistem mengembalikan daftar lokasi keterkaitan dan mencegah penghapusan tanpa konfirmasi eksplisit (`force=true`) dari admin.

---

## 6. Antarmuka Picker & Multi-Upload Klien
- Kontrak klien Universal Media Picker (`public/js/media-picker.js`, `views/partials/media-picker-modal.ejs`) dan multi-upload modal `/admin/media` dirinci pada sub-modul [tech/media-picker.md](media-picker.md).
