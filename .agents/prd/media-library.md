Status: ACTIVE | Terakhir diverifikasi: 2026-10-21 | Kode: controllers/admin/mediaController.js, views/admin/media/, views/partials/media-picker-modal.ejs

# PRD: Modul Media Library (Media & Storage)

## 1. Ringkasan & Ruang Lingkup
Modul Media Library mengelola penyimpanan, optimasi, dan penggunaan aset visual (gambar WebP, video lokal, integrasi YouTube) yang digunakan di seluruh modul CMS.

---

## 2. Functional Requirements

### FR-19: Kelola Media Terpusat
- Sistem menyediakan antarmuka galeri berkas di `/admin/media` dengan fungsi:
  1. Pengunggahan berkas gambar (JPEG, PNG, WebP, GIF, SVG) dan video (MP4, WebM) dengan batas ukuran maksimal 30 MB.
  2. Penambahan media video YouTube melalui input URL atau video ID.
  3. Pencarian berkas berdasarkan nama dan filter tipe berkas (semua, gambar, video, youtube).
  4. Penyalinan tautan publik URL berkas dalam satu klik.
  5. Penghapusan berkas media (khusus Superadmin dan Admin).

### Pipa Pemrosesan Gambar Otomatis (Sharp WebP Pipeline)
- Setiap gambar raster yang diunggah secara otomatis dikonversi ke format WebP berkualitas tinggi dengan kompresi teroptimasi.
- Pembuatan thumbnail otomatis (`thumbnail_url`) untuk pratinjau cepat di dashboard admin guna menghemat konsumsi bandwidth.

### Universal Media Picker Modal (`views/partials/media-picker-modal.ejs`)
- Komponen antarmuka yang dapat dipanggil dari formulir modul lain (Banner Hero, Produk, Artikel, Tentang Kami, Pengaturan Situs).
- Memungkinkan admin memilih gambar dari pustaka media yang sudah ada atau mengunggah berkas baru langsung dari modal tanpa meninggalkan halaman yang sedang disunting.

### Audit Penggunaan Media (`check-usage`)
- Sebelum berkas media dihapus permanen, sistem memeriksa apakah berkas tersebut sedang ditautkan pada produk, banner, artikel, galeri tentang kami, atau logo perusahaan.
- Jika berkas masih digunakan, sistem menampilkan peringatan lokasi penggunaan untuk mencegah rusaknya tampilan visual publik.

### Fleksibilitas Storage Driver
- Mendukung penyimpanan berkas lokal (`public/uploads/`) untuk lingkungan pengembangan dan penyimpanan awan (Amazon S3 / kompatibel S3) melalui konfigurasi environment `STORAGE_DRIVER`.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Kompresi Otomatis ke Format WebP** | Menghasilkan ukuran berkas gambar 30-50% lebih ringan tanpa mengorbankan ketajaman detail produk manufaktur. | 2026-10-05 |
| **Universal Media Picker Modal** | Mengurangi duplikasi upload berkas yang sama dan mempermudah alur kerja editor konten. | 2026-10-09 |
| **Pencegahan Penghapusan Berkas Aktif (Check Usage)** | Mencegah terjadinya gambar rusak (broken image) di halaman publik akibat ketidaksengajaan admin. | 2026-10-09 |
