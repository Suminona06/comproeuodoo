Status: ACTIVE | Terakhir diverifikasi: 2026-11-13 | Kode: controllers/public/productController.js, views/public/products.ejs, views/public/product-detail.ejs

# PRD: Modul Produk & Katalog Manufaktur (Products Catalog)

## 1. Ringkasan & Ruang Lingkup
Modul Produk mengelola etalase katalog publik manufaktur plastik (HDPE, LLDPE, PP Woven, oxo-biodegradable), navigasi kategori kolom kiri, toolbar pencarian dan pengurutan, kartu produk potret minimalis, pemuatan bertahap (*load more*), serta ekspor CSV via CMS. Spesifikasi detail produk publik (`/products/:slug`) dipisahkan ke [prd/products-detail.md](products-detail.md).

---

## 2. Functional Requirements

### FR-07: Tata Letak Katalog Produk Publik (PLP) & Navigasi Kategori
- **Struktur 2 Kolom:** Katalog di `/products` berstruktur 2 kolom: Sidebar Kiri (kategori) dan Konten Utama (toolbar & grid). Paginasi default: 9 produk (`limit = 9`).
- **Sidebar Kategori Dinamis:** Menyajikan kategori aktif (`is_active = 1`), opsi "Semua Produk", dan badge jumlah produk aktif. Sinkron dengan query URL (`?category=<slug>`) dan deep link 4 panel beranda.
- **Kartu Produk Potret Minimalis:** Rasio potret tetap 3:4 dengan `object-fit: cover` (CLS = 0), garis tipis `border-bottom: 1px solid var(--color-border)`, nama produk kapital kecil rata kiri, tombol selebar kartu outline hijau brand `var(--color-primary)` menuju `/products/:slug`, bebas harga (zero-price B2B).
- **Toolbar Atas, Pencarian & Pengurutan:** Pencarian debounced 350ms, 4 opsi urutan (Terbaru, A-Z, Z-A, Katalog), live region aksesibel (`.sr-only`), pesan hasil kosong dwibahasa.
- **Progressive Enhancement Load More:** Tombol "Muat Lebih Banyak" tampil jika total > 9, memuat 9 kartu via AJAX tanpa reload, animasi transisi transform/opacity (`prefers-reduced-motion` statis).
- **Tata Letak Mobile & Filter Drawer:** Mobile (<= 767px) reflow 2 kolom kompak; `[PENDING T-380]` toolbar atas 2 baris (baris 1 search lebar penuh, baris 2 Filter & Urutkan berdampingan 50/50); filter kategori disajikan via drawer samping (*offcanvas*) dengan target sentuh min 44 x 44 px.
- **Modularitas Template & Standar View:** Template `views/public/products.ejs` mempertahankan section hero banner di file utama dan mengorkestrasi 3 partial modular di `views/partials/products/` (`sidebar.ejs`, `toolbar.ejs`, `empty-state.ejs`) masing-masing <= 100 baris. Seluruh elemen visual menggunakan token desain CSS tanpa inline style, zero raw hex, zero komentar HTML, dan seluruh teks antarmuka menggunakan helper `t('products.*')`.

### FR-09: Ekspor Data Produk ke Format CSV (CMS)
- Admin dapat mengunduh seluruh data katalog ke file spreadsheet `.csv` via `/admin/products/export`.
- Kolom CSV mencakup metadata produk (ID, SKU/Slug, Nama Produk ID/EN, Kategori, Teks CTA ID/EN, Status Publikasi, Tanggal Dibuat) serta penggabungan dinamis (*union of columns*) dari seluruh kolom tabel ukuran produk aktif. Produk tanpa tabel ukuran atau tanpa kolom tertentu diisi string kosong `""`.

### FR-25: Skema Kolom Database Produk
- Skema tabel `products`: `short_description_id/en`, `variants`, `size_table`, `gallery_images`, `cta_text_id/en`, `[PENDING T-383]` `show_description_tab`. Kolom legacy `material_specs` dan `technical_specs` telah di-drop. Kolom `size_table` (JSON) menyimpan objek dinamis `{ columns, rows }` yang dimigrasi dari format lama via migrasi `018`.

### FR-29: Struktur Tabel Ukuran Dinamis Per Produk (Admin CMS)
- Setiap produk memiliki definisi struktur kolom dan baris sendiri (tanpa master kolom global, isolasi data 100%).
- Form Create (`/admin/products/create`) dan Edit (`/admin/products/:id/edit`) menyediakan builder tabel ukuran dinamis:
  - Form Create memuat 6 kolom default (Kode Produk, Lebar, Panjang, Tebal, Kapasitas, Bahan) sebagai titik awal yang bisa diedit/ditambah/dihapus.
  - Tambah kolom baru, ubah label kolom (teks tunggal maks 40 char), hapus kolom dengan konfirmasi SweetAlert2 jika ada data teks sel terisi.
  - Tambah baris baru, ubah isi sel (teks polos maks 80 char), hapus baris.
  - Tombol geser urutan kolom (kiri/kanan) dan baris (naik/turun) aksesibel via keyboard dan ramah sentuhan.
  - Modal "Salin Struktur Kolom": Tombol opsional yang memunculkan daftar produk aktif, menyalin susunan kolom produk terpilih tanpa data sel.
- Kolom memakai ID stabil buatan server (`col_1`, `col_2`, dst.) unik per produk agar rename label tidak merusak isi sel.
- Aturan batas: minimal 1 kolom, maks 8 kolom, maks 30 baris, label kolom maks 40 char, isi sel maks 80 char. Label kosong dilarang.
- Transisi penambahan/penghapusan kolom dan baris halus (transform & opacity, statis pada `prefers-reduced-motion`).
- Aksesibilitas: Navigasi keyboard penuh, label aria lengkap, target sentuh minimal 44 x 44 px. Seluruh sel input builder tabel ukuran (`.prod-size-cell`) mendukung navigasi tombol panah 4 arah serta shortcut Enter pada baris terakhir untuk menambah baris baru otomatis.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Toolbar Katalog Mobile 2 Baris (`<= 767px`) `[PENDING T-380]`** | Memberi lebar penuh pada kolom search di mobile sementara Filter dan Urutkan berbagi baris kedua 50/50. | 2026-11-21 |
| **Tabel Ukuran Dinamis Per Produk** | Memberikan fleksibilitas spesifikasi dimensi tanpa batasan kolom kaku antar jenis produk. | 2026-10-27 |
| **Grid 2 Kolom Mobile & Drawer** | Efisiensi ruang layar ponsel dengan drawer filter ergonomis. | 2026-10-21 |
| **Gambar Potret 3:4 Cover** | Keteraturan visual kartu produk tanpa variasi tinggi gambar. | 2026-10-21 |
| **Tombol Selebar Kartu** | Affordance klik jelas dengan aksen hijau brand. | 2026-10-21 |
| **Zero-Price B2B** | Mengarahkan model manufaktur kustom ke konversi penawaran RFQ. | 2026-10-21 |
| **Pencarian Debounced 350ms** | Umpan balik instan tanpa beban request server berlebih saat mengetik. | 2026-10-21 |
| **Deep Link Filter Beranda** | Menghubungkan 4 panel beranda ke `/products?category=<slug>` secara mulus. | 2026-10-19 |
