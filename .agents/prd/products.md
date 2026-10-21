Status: ACTIVE | Terakhir diverifikasi: 2026-10-21 | Kode: controllers/public/productController.js, views/public/products.ejs, views/public/capabilities.ejs

# PRD: Modul Produk, Katalog & Kapabilitas Mesin (Products & Capabilities)

## 1. Ringkasan & Ruang Lingkup
Modul Produk mencakup katalog penjelajahan produk manufaktur plastik (HDPE, LLDPE, PP Woven, degradable oxo-biodegradable), penyaringan berbasis kategori, pencarian kata kunci, spesifikasi teknis dan varian ukuran, ekspor CSV, serta etalase kapabilitas mesin manufaktur di pabrik Cigondewah.

---

## 2. Functional Requirements

### FR-07: Daftar Produk Publik dengan Filter & Pencarian
- Sistem merender katalog produk di `/products` dengan pagination, bilah pencarian, dan tombol filter kategori.
- Mendukung deep-linking filter melalui query parameter URL: `/products?category=<slug>` (misal dari 4 panel kategori beranda).
- Menampilkan kartu produk dengan gambar utama, nama produk, kategori, ringkasan spesifikasi, dan badge status ramah lingkungan.
- Produk yang tampil di publik hanya produk dengan status `published` dan `is_active = 1`.

### FR-08: Halaman Detail Produk & Spesifikasi Teknis
- Akses detail produk melalui URL ramah SEO: `/products/:slug`.
- Halaman detail menyajikan:
  1. Galeri foto produk beresolusi tinggi dengan thumbnail selector.
  2. Judul, kategori induk, dan deskripsi detail dwibahasa (ID/EN).
  3. Tabel Spesifikasi Material (Polymer Grade, Additives Degradable, Ketebalan Mikron, Tensile Strength).
  4. Tabel Varian Produk (`product_variants`) memuat SKU, ukuran dimensi (lebar x panjang x lipatan), warna, kapasitas beban, dan isi per kemasan/ball.
  5. Tombol aksi konversi B2B: "Minta Penawaran Harga / RFQ" yang mengarahkan pengguna ke `/contact` dengan auto-select produk bersangkutan.

### FR-09: Ekspor Data Produk ke Format CSV (CMS)
- Admin dapat mengunduh seluruh data katalog produk ke berkas spreadsheet `.csv` melalui menu CMS `/admin/products/export`.
- Kolom CSV mencakup: ID, SKU/Slug, Nama Produk (ID/EN), Kategori, Status Publikasi, Tanggal Dibuat.

### Kapabilitas Mesin & Fasilitas Manufaktur (`/capabilities`)
- Menampilkan fasilitas mesin industri pabrik Cigondewah di halaman publik `/capabilities` dan menu CMS `/admin/capabilities`.
- Setiap mesin menampilkan foto dokumentasi fasilitas, nama mesin (ekstrusi blown film multi-layer, automatic bag-making line, flexographic printing), kapasitas produksi per bulan, dan spesifikasi toleransi mikron presisi.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Penghapusan Flag `is_featured`** | Menghilangkan kompleksitas kurasi manual produk beranda demi arsitektur filter kategori 4 panel yang terstruktur. | 2026-10-19 |
| **Deep Link Filter Kategori Beranda** | Menghubungkan 4 panel beranda langsung ke halaman katalog `/products?category=<slug>` secara mulus. | 2026-10-19 |
| **Tabel Varian Terintegrasi di Model Produk** | Memudahkan pengelolaan SKU dan ukuran kantong plastik langsung di halaman edit produk tanpa navigasi terpisah. | 2026-10-05 |
| **Integrasi Modul Kapabilitas Mesin** | Memberikan bukti nyata kapasitas industri skala besar bagi pengadaan korporat B2B. | 2026-09-29 |
