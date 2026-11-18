Status: ACTIVE | Terakhir diverifikasi: 2026-11-16 | Kode: controllers/admin/mediaController.js, services/mediaService.js [PENDING T-348], middleware/uploadMiddleware.js, models/mediaModel.js, utils/seedAssetsSync.js

# Tech Spec: Modul Media Library (Media & Storage)

## 1. Arsitektur & Pipa Pemrosesan Berkas
Modul Media Library mengelola alur unggah berkas, kompresi gambar otomatis ke format WebP menggunakan library Sharp, pembuatan thumbnail, integrasi YouTube, serta antarmuka pemilih berkas terpadu (Universal Media Picker) mengikuti pola `Route -> Controller -> Service -> Model`:
- **Controller (`controllers/admin/mediaController.js`) `[PENDING T-348]`:** Bertindak sebagai *thin controller* (`<= 40` baris/fungsi, `max-depth <= 2`, `complexity <= 8`) yang mem-parsing request, menjaga `cleanupTempFile(req.file)` pada blok `finally`, serta mengirim respons HTML redirect atau JSON (`200/400/404/409/500`).
- **Service (`services/mediaService.js`) `[PENDING T-348]`:** Mengorkestrasi `getMediaLibraryViewData`, `buildEmptyMediaLibraryViewData`, `getMediaPickerList`, `uploadAndCreateMedia` (pipa tunggal image/video/PDF dipakai bersama oleh `upload` & `apiUpload`), `registerYoutubeMedia`, `checkMediaUsage`, dan `deleteMediaItem` (mengembalikan status terstruktur `{ status: 'not_found' | 'in_use' | 'deleted', usages }`).

---

## 2. Rute & Controller

| Method | Path | Controller / Handler | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/admin/media` | `mediaController.index` | `requireAuth`, `roleMiddleware(['superadmin','admin','editor'])` | Antarmuka galeri berkas via `mediaService.getMediaLibraryViewData` `[PENDING T-348]` |
| `GET` | `/admin/media/api`, `/admin/api/media` | `mediaController.apiList` | `requireAuth`, `roleMiddleware` | API JSON daftar berkas untuk picker via `mediaService.getMediaPickerList` `[PENDING T-348]` |
| `POST` | `/admin/media/upload` | `mediaController.upload` | `requireAuth`, `roleMiddleware`, `uploadLargeMedia.single('file')` | Upload form via `mediaService.uploadAndCreateMedia` + `cleanupTempFile` `[PENDING T-348]` |
| `POST` | `/admin/api/media/upload`| `mediaController.apiUpload`| `requireAuth`, `roleMiddleware`, `uploadLargeMedia.single('file')` | Upload asinkron picker via `mediaService.uploadAndCreateMedia` + `cleanupTempFile` `[PENDING T-348]` |
| `POST` | `/admin/media/youtube` | `mediaController.addYoutube`| `requireAuth`, `roleMiddleware` | Daftarkan video YouTube via `mediaService.registerYoutubeMedia` `[PENDING T-348]` |
| `POST` | `/admin/api/media/check-usage`| `mediaController.apiCheckUsage`| `requireAuth`, `roleMiddleware` | Audit penggunaan via `mediaService.checkMediaUsage` `[PENDING T-348]` |
| `POST` / `DELETE` | `/admin/media/:id/delete`, `/admin/api/media/:id` | `mediaController.destroy` | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | Hapus berkas via `mediaService.deleteMediaItem` (`200/404/409/500`, dukung `force=true`) `[PENDING T-348]` |

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
4. **Aset Baseline Terlacak Git (`database/seed-assets/uploads/`):**
   - Berkas `public/uploads/*` tetap di-gitignore agar upload CMS produksi tidak menimbulkan konflik `git pull`.
   - Salinan aset media aktif (gambar, video MP4, dan favicon settings) disimpan di `database/seed-assets/uploads/` dan disalin non-destruktif (hanya jika berkas tujuan belum ada) ke `public/uploads/` oleh `utils/seedAssetsSync.js` saat `npm run migrate` maupun `npm run seed`.

---

## 5. Audit Ketergantungan Media (`check-usage`)
Fungsi `mediaController.apiCheckUsage` dan `mediaController.destroy` mendelegasikan audit penggunaan ke `mediaService.checkMediaUsage` / `mediaService.deleteMediaItem` -> `mediaModel.checkUsage` `[PENDING T-348]`, yang menjalankan query agregasi ke 7 tabel database:
`banners (file_url)`, `page_hero_banners (image_url)`, `settings (site_logo_*, site_favicon)`, `products (main_image)`, `brands (logo_url)`, `posts (cover_image)`, dan `capabilities (image_url)`.
Jika ditemukan referensi aktif, sistem mengembalikan daftar lokasi keterkaitan dan mencegah penghapusan tanpa konfirmasi eksplisit dari admin.

---

## 6. Integrasi Multi-Select Universal Media Picker
1. **Konfigurasi Klien (`public/js/media-picker.js`):**
   - Fungsi `openModal(options)` menerima opsi `multiple: true` (default `false`).
   - Variabel state seleksi:
     - `selectedMedia` (mode single): menyimpan objek item tunggal.
     - `selectedMediaList` (mode multiple): array menyimpan objek item terpilih `[{ id, file_url, filename, thumbnail_url }, ...]`.
   - Interaksi Kartu Media `.media-picker-card`:
     - Pada klik mode multiple: toggle keberadaan item di dalam `selectedMediaList` dan toggle kelas `.selected`.
     - Memperbarui counter footer: `pickerSelectedInfo.innerHTML = "<span>N media dipilih</span>"`.
     - Tombol konfirmasi `#btnConfirmSelectMedia`: aktif jika `selectedMediaList.length > 0` dengan label "Gunakan N Media Ini".
2. **Callback Kembalian:**
   - Eksekusi `currentTargetCallback(selectedMediaList)` mengembalikan array objek media lengkap ke form pemanggil (misal form galeri produk admin).
   - Mode single-select tetap mengembalikan single URL string ke input target (backward compatible).
