Status: ACTIVE | Terakhir diverifikasi: 2026-11-21 | Kode: controllers/admin/mediaController.js, views/admin/media/, views/partials/media-picker-modal.ejs

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
- Hint format pada tab Upload diselaraskan dengan aturan server: gambar (JPG, PNG, WebP, GIF, ICO), video (MP4, WebM), atau PDF maksimal 30 MB per berkas; berkas SVG diblokir demi keamanan.

### Audit Penggunaan Media (`check-usage`)

- Sebelum berkas media dihapus permanen, sistem memeriksa apakah berkas tersebut sedang ditautkan pada produk (`products.main_image` dan `products.gallery_images` baik format ID media maupun URL), banner, artikel, galeri tentang kami, kapabilitas, atau logo/pengaturan perusahaan.
- Jika berkas masih digunakan, sistem menampilkan peringatan lokasi penggunaan untuk mencegah rusaknya tampilan visual publik.

### Fleksibilitas Storage Driver

- Mendukung penyimpanan berkas lokal (`public/uploads/`) untuk lingkungan pengembangan dan penyimpanan awan (Amazon S3 / kompatibel S3) melalui konfigurasi environment `STORAGE_DRIVER`.
- Aset media baseline (gambar, video MP4, favicon) yang digunakan oleh konten awal disimpan terpisah di `database/seed-assets/uploads/` (terlacak Git) dan disalin otomatis ke `public/uploads/` tanpa menimpa unggahan CMS produksi.

### FR-27: Dukungan Mode Multi-Select pada Universal Media Picker

- Universal Media Picker Modal (`views/partials/media-picker-modal.ejs`) mendukung mode seleksi ganda (_multi-select_).
- Form pemanggil dapat mengaktifkan mode ini melalui konfigurasi opsi: `{ multiple: true }`.
- Fitur interaksi mode multi-select:
  1. Klik kartu media menambah/menghapus item dari daftar pilihan aktif tanpa menutup modal secara instan.
  2. Kartu terpilih ditandai dengan border hijau brand `var(--color-primary)` dan badge indikator centang atau nomor urut pilihan.
  3. Bagian footer menampilkan ringkasan jumlah ("N media dipilih") dan tombol konfirmasi mengembalikan seluruh array item yang dipilih ke callback form pemanggil.
  4. Kompatibilitas mundur penuh (_backward compatible_): mode default tanpa flag `multiple` tetap berfungsi sebagai single-select untuk Banner, Merek, dan Tentang Kami.

### FR-28: Unggah Banyak Berkas Sekaligus (`Multi-Upload`) dengan Progres & Ringkasan

- Tab **Upload** pada Universal Media Picker Modal dan modal unggah di halaman `/admin/media` mendukung pemilihan banyak berkas sekaligus melalui dialog file (`multiple`) maupun _drag & drop_, tanpa batas jumlah berkas per sesi unggahan.
- Setiap berkas dikirim secara berurutan ke pipa validasi & optimasi yang sama (`uploadAndCreateMedia`: batas 30 MB per berkas, blokir SVG, transformasi Sharp WebP untuk gambar raster).
- Antarmuka menampilkan progres per berkas (`"x dari N"`) dengan wilayah `aria-live="polite"` dan status sukses/gagal masing-masing item; berkas yang gagal tidak membatalkan berkas lain dan diakhiri ringkasan jumlah berhasil/gagal.
- Perilaku seleksi pasca-unggah pada Universal Media Picker:
  1. **Mode Single-Select:** Berkas sukses **terakhir** otomatis terpilih di pratinjau footer, dan admin tetap mengklik tombol konfirmasi (`Gunakan Media Ini`) sebelum modal tertutup.
  2. **Mode Multi-Select:** Seluruh berkas baru yang berhasil diunggah otomatis tercentang dan ditambahkan ke daftar pilihan yang sudah ada pada `selectedMediaList`.
- Seluruh kontrol baru mematuhi token desain, kontras WCAG AA, focus ring `:focus-visible`, target sentuh minimal `44px`, serta label dwibahasa ID dan EN.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan                                             | Alasan 1 Kalimat                                                                                             | Tanggal    |
| :---------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- | :--------- |
| **Mode Multi-Select Universal Picker**                | Mengizinkan kurasi galeri multi-foto produk yang efisien dalam satu dialog tanpa perulangan buka modal.      | 2026-10-23 |
| **Kompresi Otomatis ke Format WebP**                  | Menghasilkan ukuran berkas gambar 30-50% lebih ringan tanpa mengorbankan ketajaman detail produk manufaktur. | 2026-10-05 |
| **Universal Media Picker Modal**                      | Mengurangi duplikasi upload berkas yang sama dan mempermudah alur kerja editor konten.                       | 2026-10-09 |
| **Pencegahan Penghapusan Berkas Aktif (Check Usage)** | Mencegah terjadinya gambar rusak (broken image) di halaman publik akibat ketidaksengajaan admin.             | 2026-10-09 |
