Status: ACTIVE | Terakhir diverifikasi: 2026-10-27 | Kode: controllers/public/productController.js, views/public/products.ejs, views/public/product-detail.ejs

# PRD: Modul Produk & Katalog Manufaktur (Products Catalog)

## 1. Ringkasan & Ruang Lingkup
Modul Produk mengelola etalase katalog publik manufaktur plastik (HDPE, LLDPE, PP Woven, oxo-biodegradable), navigasi kategori kolom kiri, toolbar pencarian dan pengurutan, kartu produk potret minimalis, pemuatan bertahap (*load more*), rincian spesifikasi teknis, serta ekspor CSV via CMS.

---

## 2. Functional Requirements

### FR-07: Tata Letak Katalog Produk Publik (PLP) & Navigasi Kategori [COMPLETED T-192-T-197]
- **Struktur 2 Kolom:** Katalog di `/products` berstruktur 2 kolom: Sidebar Kiri (kategori) dan Konten Utama (toolbar & grid). Paginasi default: 9 produk per muatan (`limit = 9`).
- **Sidebar Kategori Dinamis [COMPLETED T-194]:** Sidebar kiri menyajikan kategori aktif dari database (`is_active = 1`), opsi "Semua Produk", dan badge jumlah produk aktif. Kategori terpilih sinkron dengan query URL (`/products?category=<slug>`) dan deep link 4 panel beranda.
- **Kartu Produk Potret Minimalis [COMPLETED T-193]:** Rasio aspek potret vertikal tetap 3:4 dengan `object-fit: cover` (CLS = 0), garis pemisah tipis `border-bottom: 1px solid var(--color-border)`, nama produk kapital kecil rata kiri, tombol selebar kartu outline hijau brand `var(--color-primary)` menuju `/products/:slug`, bebas harga (zero-price B2B).
- **Toolbar Atas, Pencarian Debounced & Pengurutan [COMPLETED T-195]:** Pencarian debounced 350ms, 4 opsi urutan (Terbaru, A-Z, Z-A, Katalog), live region aksesibel (`.sr-only`, `aria-live="polite"`), pesan hasil kosong dwibahasa.
- **Progressive Enhancement Muat Lebih Banyak [COMPLETED T-196]:** Tombol "Muat Lebih Banyak" tampil jika total > 9, memuat 9 kartu via AJAX tanpa reload, animasi transisi opacity & transform (menghormati `prefers-reduced-motion`).
- **Tata Letak Mobile & Filter Drawer [COMPLETED T-197]:** Mobile (< 768px) reflow 2 kolom kompak; filter kategori disajikan via drawer samping (*offcanvas*) dengan target sentuh minimal 44 x 44 px.

### FR-09: Ekspor Data Produk ke Format CSV (CMS)
- Admin dapat mengunduh seluruh data katalog ke file spreadsheet `.csv` via `/admin/products/export`.
- Kolom CSV: ID, SKU/Slug, Nama Produk (ID/EN), Kategori, Status Publikasi, Tanggal Dibuat.

### FR-24: Redesain Layout Halaman Detail Produk (PDP)
- Akses detail melalui URL ramah SEO: `/products/:slug` dengan isolasi gaya prefix `.pd-*`.
- **Layout Grid 5:6:** 2 kolom berimbang (`minmax(0, 5fr) minmax(0, 6fr)` gap 34px) di desktop (>= 901px), reflow 1 kolom di mobile/tablet (<= 900px).
- **Galeri Foto Sticky & Thumbnail:** Kolom galeri sticky di desktop (`position: sticky; top: 24px`); foto utama rasio `4 / 3.4`, radius `var(--r-xl)`, border `var(--color-border)`; strip thumbnail `76 x 64 px` border hijau brand `var(--color-primary)` saat aktif (`aria-pressed="true"`) dari array JSON `gallery_images`. Klik thumbnail memicu pergantian gambar dengan transisi opacity 200ms tanpa layout shift.
- **Breadcrumb Semantik:** Beranda (`/`) > Produk (`/products`) > [Kategori] (`/products?category=:slug`) > [Nama Produk].
- **Judul & Short Description:** Judul responsif `clamp(26px, 3.6vw, 38px)` bobot 800 `var(--color-text-main)`; deskripsi singkat tepat di bawah judul max `56ch`, ukuran 15.5px, warna `var(--color-text-muted)` dari kolom `short_description_id/en`.
- **Pil Varian Ukuran:** Tombol pil border netral, radius penuh `999px` (`var(--r-full)`), terpilih berganti latar `var(--color-primary)` teks putih `var(--color-on-primary)` (`aria-pressed="true"`), data dari array JSON `variants`. Sembunyi jika kolom kosong/null.
- **Baris Aksi CTA (52px):** Tombol WhatsApp latar `var(--color-primary)` dengan label dinamis dari `cta_text_id` (ID) / `cta_text_en` (EN) atau fallback ke teks default dwibahasa ("Minta Penawaran via WhatsApp" / "Request Quote via WhatsApp"). Nomor tujuan terhubung otomatis ke nomor telepon resmi perusahaan dari Pengaturan Situs (`settings.whatsapp_number`). Tombol "Submit RFQ Form" outline latar putih `var(--color-surface)` border `var(--color-border)`. Mobile <= 560px full-width.
- **Bilah Tab & Panel Konten:** Tab "Deskripsi" dan "Tabel Ukuran" dengan underline aktif hijau brand `var(--color-primary)`. Default tab: Deskripsi.
  - Panel Deskripsi: teks kaya TinyMCE (`description_id/en`) max `75ch` warna `var(--color-text-variant)`.
  - Panel Tabel Ukuran: tabel 6 kolom (Kode Produk, Lebar, Panjang, Tebal, Kapasitas, Bahan) dari array JSON `size_table`. Mobile <= 600px: thead sembunyi, setiap baris tampil sebagai card dengan label `data-l`. Jika `size_table` kosong, tab tabel ukuran disembunyikan.
- **Aksesibilitas & Animasi:** Animasi hanya GPU transform/opacity, `prefers-reduced-motion` statis.

### FR-25: Skema Kolom Baru Database Produk
- Pembaruan skema tabel `products` via migrasi terpisah:
  - Migrasi `016_drop_unused_product_specs.sql`: DROP kolom legacy `material_specs` dan `technical_specs`.
  - Migrasi `017_add_product_cta_fields.sql`: ADD kolom baru `cta_text_id` (VARCHAR(100) NULL) dan `cta_text_en` (VARCHAR(100) NULL).
  - Kolom sebelumnya (migrasi `015`): `short_description_id`, `short_description_en`, `variants`, `size_table`, `gallery_images`.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Layout Grid 5:6 & Galeri Sticky** | Menyajikan informasi produk B2B dengan proporsi visual seimbang dan ergonomis persis prototipe. | 2026-10-23 |
| **Penyimpanan Varian & Tabel Ukuran JSON** | Memberikan fleksibilitas struktur spesifikasi produk manufaktur tanpa kompleksitas multi-tabel relasional. | 2026-10-23 |
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
