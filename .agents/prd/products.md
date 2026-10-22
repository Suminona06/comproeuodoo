Status: ACTIVE | Terakhir diverifikasi: 2026-10-21 | Kode: controllers/public/productController.js, views/public/products.ejs, views/public/product-detail.ejs

# PRD: Modul Produk & Katalog Manufaktur (Products Catalog)

## 1. Ringkasan & Ruang Lingkup
Modul Produk mengelola etalase katalog publik manufaktur plastik (HDPE, LLDPE, PP Woven, oxo-biodegradable), navigasi kategori kolom kiri, toolbar pencarian dan pengurutan, kartu produk potret minimalis, pemuatan bertahap (*load more*), rincian spesifikasi teknis, serta ekspor CSV via CMS.

---

## 2. Functional Requirements

### FR-07: Tata Letak Katalog Produk Publik (PLP) & Navigasi Kategori [COMPLETED T-194]
- Katalog di `/products` berstruktur 2 kolom: Sidebar Kiri (kategori) dan Konten Utama (toolbar & grid).
- Hero banner dinamis CMS dipertahankan di atas; navigasi breadcrumb dan layout 2-kolom berada tepat di bawahnya.
- Sidebar kiri memuat "Filter By" > Kategori, menyajikan seluruh kategori aktif secara dinamis dari database (`is_active = 1`), opsi teratas "Semua Produk", dan badge jumlah produk aktif. Kategori baru dari CMS otomatis tampil.
- Kategori terpilih sinkron dengan query URL (`/products?category=<slug>`) sehingga *shareable* dan tombol back/forward browser berfungsi.
- Deep link dari 4 panel kategori beranda (`/products?category=<slug>`) langsung memfilter kategori terkait tanpa mengubah beranda.
- Produk yang tampil hanya yang berstatus `published` dan `is_active = 1`. Paginasi default: 9 produk per muatan (`limit = 9`).

### FR-08: Halaman Detail Produk & Spesifikasi Teknis
- Akses detail melalui URL ramah SEO: `/products/:slug`.
- Halaman detail menyajikan galeri foto beresolusi tinggi, judul/kategori dwibahasa (ID/EN), tabel spesifikasi material (grade polimer, aditif oxium, mikron), tabel varian ukuran (`product_variants`), dan tombol konversi B2B RFQ via WhatsApp/form (tanpa harga/zero-price).

### FR-09: Ekspor Data Produk ke Format CSV (CMS)
- Admin dapat mengunduh seluruh data katalog ke file spreadsheet `.csv` via `/admin/products/export`.
- Kolom CSV: ID, SKU/Slug, Nama Produk (ID/EN), Kategori, Status Publikasi, Tanggal Dibuat.

### FR-24: Kartu Produk Potret Minimalis & Tombol Selebar Kartu [PENDING T-193]
- **Rasio Potret Tetap:** Gambar produk berasio aspek vertikal tetap (3:4) dengan `object-fit: cover` untuk mencegah layout shift (CLS = 0).
- **Garis Pembatas Bawah:** Garis pemisah tipis horizontal (`border-bottom: 1px solid var(--color-border)`) membatasi media gambar dan metadata.
- **Tipografi Huruf Kapital Kecil:** Nama produk berhuruf kapital kecil rata kiri (`text-transform: uppercase`, ukuran `var(--font-size-label-md)`, bobot `var(--font-weight-bold)`, spasi `var(--letter-spacing-wide)`, warna `var(--color-text-main)`).
- **Sisi Kanan Bersih:** Sisi kanan nama produk dikosongkan bersih untuk menonjolkan tipografi minimalis.
- **Tombol Selebar Kartu:** Tombol selebar kartu (100% width) berlabel "Detail Produk" (ID) / "Product Details" (EN) menuju `/products/:slug`. Gaya outline border hijau `var(--color-primary)` dan teks `var(--color-text-main)`, hover terisi hijau `var(--color-primary)` teks putih `var(--color-on-primary)`.
- **Tanpa Harga:** Bebas total dari angka harga (kepatuhan model B2B custom RFQ).

### FR-25: Toolbar Atas, Pencarian Debounced, Pengurutan & Live Region [PENDING T-195]
- **Posisi Kontrol:** Kolom pencarian di kanan toolbar menggantikan teks statis produk, bersanding dengan dropdown "Urutkan".
- **Pencarian Debounced:** Eksekusi otomatis via AJAX (debounce 350ms) tanpa perlu menekan Enter, menelusuri nama (`name_id`, `name_en`) dan deskripsi (`description_id`, `description_en`).
- **Pilihan Urutan (Tanpa Harga):** Mendukung 4 opsi: "Terbaru" (Default - ID DESC), "Nama A-Z", "Nama Z-A", dan "Urutan Katalog" (sort_order ASC).
- **Pengumuman Aksesibel:** Jumlah hasil diumumkan dinamis ke pembaca layar (*screen reader*) via live region (`.sr-only`, `aria-live="polite"`, `role="status"`).
- **Empty State:** Menampilkan pesan informatif dwibahasa dan tombol reset jika produk tidak ditemukan.

### FR-26: Progressive Enhancement "Muat Lebih Banyak" AJAX [PENDING T-196]
- **Kondisi Tampil:** Tombol "Muat Lebih Banyak" tampil hanya jika total produk yang sesuai kriteria > 9 (`totalCount > 9`) dan masih ada halaman lanjutan.
- **Progressive Enhancement:** Elemen tautan semantik `<a href="/products?page=2&...">` sebagai fallback SEO/non-JS, ditingkatkan AJAX untuk memuat 9 kartu baru tanpa reload halaman.
- **Aksesibilitas & Animasi:** Kartu baru muncul halus dengan animasi transisi opacity dan transform (menghormati `prefers-reduced-motion`). Fokus keyboard diarahkan ke kartu baru pertama; tombol hilang jika seluruh data termuat.
- **Reset Paginasi:** Mengubah filter, search, atau urutan otomatis mereset paginasi ke halaman 1.

### FR-29: Tata Letak Responsif Mobile & Filter Drawer [PENDING T-197]
- Pada mobile (< 768px), grid kartu produk reflow menjadi 2 kolom kompak.
- Filter kategori disajikan via tombol trigger yang membuka Drawer samping (*offcanvas*), dapat ditutup via tombol silang atau Escape, dengan target sentuh minimal 44 x 44 px.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Grid 2 Kolom Mobile & Filter Drawer** | Memaksimalkan efisiensi ruang ponsel untuk menampilkan pilihan produk dengan drawer ergonomis. | 2026-10-21 |
| **Gambar Potret Object-Fit Cover** | Menjamin keteraturan visual seluruh kartu dalam grid 3 kolom tanpa variasi tinggi gambar. | 2026-10-21 |
| **Tombol Outline Selebar Kartu** | Memberikan affordance klik yang jelas dan modern persis referensi desain dengan aksen hijau brand. | 2026-10-21 |
| **Eliminasi Total Harga pada Kartu** | Menegaskan model manufaktur B2B kustom tanpa harga retail instan dan mengarahkan konversi ke RFQ. | 2026-10-21 |
| **Pemisahan Modul Kapabilitas Mesin** | Menjaga batas ukuran modularitas dokumen di bawah 8KB dan memisahkan konten pabrik dari katalog. | 2026-10-21 |
| **Retensi Hero Banner CMS** | Menjaga konsistensi kurasi banner promosi dari CMS dengan katalog referensi di bawahnya. | 2026-10-21 |
| **Pencarian Real-Time Debounced 350ms** | Memberikan umpan balik instan tanpa membebani server dengan request berlebih saat mengetik. | 2026-10-21 |
| **Penghapusan Flag `is_featured`** | Menghilangkan kompleksitas kurasi manual produk beranda demi arsitektur filter kategori 4 panel. | 2026-10-19 |
| **Deep Link Filter Kategori Beranda** | Menghubungkan 4 panel beranda langsung ke halaman katalog `/products?category=<slug>` secara mulus. | 2026-10-19 |
| **Tabel Varian Terintegrasi di Model Produk** | Memudahkan pengelolaan SKU dan ukuran kantong plastik langsung di halaman edit produk. | 2026-10-05 |
