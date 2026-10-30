Status: ACTIVE | Terakhir diverifikasi: 2026-10-27 | Kode: controllers/public/productController.js, views/public/products.ejs, views/public/product-detail.ejs

# PRD: Modul Produk & Katalog Manufaktur (Products Catalog)

## 1. Ringkasan & Ruang Lingkup
Modul Produk mengelola etalase katalog publik manufaktur plastik (HDPE, LLDPE, PP Woven, oxo-biodegradable), navigasi kategori kolom kiri, toolbar pencarian dan pengurutan, kartu produk potret minimalis, pemuatan bertahap (*load more*), rincian spesifikasi teknis, serta ekspor CSV via CMS.

---

## 2. Functional Requirements

### FR-07: Tata Letak Katalog Produk Publik (PLP) & Navigasi Kategori
- **Struktur 2 Kolom:** Katalog di `/products` berstruktur 2 kolom: Sidebar Kiri (kategori) dan Konten Utama (toolbar & grid). Paginasi default: 9 produk (`limit = 9`).
- **Sidebar Kategori Dinamis:** Menyajikan kategori aktif (`is_active = 1`), opsi "Semua Produk", dan badge jumlah produk aktif. Sinkron dengan query URL (`?category=<slug>`) dan deep link 4 panel beranda.
- **Kartu Produk Potret Minimalis:** Rasio potret tetap 3:4 dengan `object-fit: cover` (CLS = 0), garis tipis `border-bottom: 1px solid var(--color-border)`, nama produk kapital kecil rata kiri, tombol selebar kartu outline hijau brand `var(--color-primary)` menuju `/products/:slug`, bebas harga (zero-price B2B).
- **Toolbar Atas, Pencarian & Pengurutan:** Pencarian debounced 350ms, 4 opsi urutan (Terbaru, A-Z, Z-A, Katalog), live region aksesibel (`.sr-only`), pesan hasil kosong dwibahasa.
- **Progressive Enhancement Load More:** Tombol "Muat Lebih Banyak" tampil jika total > 9, memuat 9 kartu via AJAX tanpa reload, animasi transisi transform/opacity (`prefers-reduced-motion` statis).
- **Tata Letak Mobile & Filter Drawer:** Mobile (< 768px) reflow 2 kolom kompak; filter kategori disajikan via drawer samping (*offcanvas*) dengan target sentuh min 44 x 44 px.

### FR-09: Ekspor Data Produk ke Format CSV (CMS)
- Admin dapat mengunduh seluruh data katalog ke file spreadsheet `.csv` via `/admin/products/export`.
- Kolom CSV mencakup metadata produk (ID, SKU/Slug, Nama Produk ID/EN, Kategori, Teks CTA ID/EN, Status Publikasi, Tanggal Dibuat) serta penggabungan dinamis (*union of columns*) dari seluruh kolom tabel ukuran produk aktif. Produk tanpa tabel ukuran atau tanpa kolom tertentu diisi string kosong `""`.

### FR-24: Redesain Layout Halaman Detail Produk (PDP)
- Akses detail melalui URL ramah SEO: `/products/:slug` dengan isolasi gaya prefix `.pd-*`.
- **Layout Grid 5:6:** 2 kolom berimbang (`minmax(0, 5fr) minmax(0, 6fr)` gap 34px) di desktop (>= 901px), reflow 1 kolom di mobile (<= 900px).
- **Galeri Foto Sticky:** Sticky desktop (`top: 24px`); foto utama rasio 4:3.4, radius `var(--r-xl)`, border `var(--color-border)`; strip thumbnail 76x64px border hijau `var(--color-primary)` saat aktif (`gallery_images`). Transisi opacity 200ms tanpa CLS.
- **Breadcrumb:** Beranda > Produk > [Kategori] > [Nama Produk].
- **Judul & Deskripsi Singkat:** Judul fluida `clamp(26px, 3.6vw, 38px)` bobot 800 `var(--color-text-main)`; deskripsi singkat max 56ch 15.5px `var(--color-text-muted)` (`short_description_id/en`).
- **Pil Varian Ukuran:** Tombol pil border netral, radius penuh `var(--r-full)`, terpilih `var(--color-primary)` teks `var(--color-on-primary)` (`variants`). Sembunyi jika kosong.
- **Baris Aksi CTA (52px):** Tombol WhatsApp latar `var(--color-primary)` label dinamis dari `cta_text_id/en` atau fallback dwibahasa ("Minta Penawaran via WhatsApp" / "Request Quote via WhatsApp") ke nomor resmi `settings.whatsapp_number`. Tombol "Submit RFQ Form" outline putih `var(--color-surface)` border `var(--color-border)`. Mobile <= 560px full-width.
- **Bilah Tab & Panel Konten:** Tab "Deskripsi" dan "Tabel Ukuran" dengan underline aktif `var(--color-primary)`. Default: Deskripsi.
  - Panel Deskripsi: teks kaya TinyMCE (`description_id/en`) max 75ch warna `var(--color-text-variant)`.
  - Panel Tabel Ukuran: tabel ukuran dinamis per produk dari JSON `size_table`. Header dan kartu mobile merender label kolom produk (teks tunggal, di-escape aman). Desktop: kontainer scroll horizontal `.pd-size-scroll` (halaman bebas horizontal leak). Mobile <= 600px: thead sembunyi, setiap baris tampil sebagai card di mana kolom pertama menjadi judul kartu dan kolom berikutnya baris atribut dengan label `data-l` dinamis. Sembunyi jika baris data kosong.
- **Aksesibilitas & Animasi:** Animasi hanya GPU transform/opacity, `prefers-reduced-motion` statis.

### FR-25: Skema Kolom Database Produk
- Skema tabel `products`: `short_description_id/en`, `variants`, `size_table`, `gallery_images`, `cta_text_id/en`. Kolom legacy `material_specs` dan `technical_specs` telah di-drop. Kolom `size_table` (JSON) menyimpan objek dinamis `{ columns, rows }` yang dimigrasi dari format lama via migrasi `018`.

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
- Aksesibilitas: Navigasi keyboard penuh, label aria lengkap, target sentuh minimal 44 x 44 px. Seluruh sel input builder tabel ukuran (`.prod-size-cell`) mendukung navigasi tombol panah 4 arah serta shortcut Enter pada baris terakhir untuk menambah baris baru otomatis [PENDING T-248].

### FR-30: Tampilan Publik Tabel Ukuran Dinamis Responsif (PDP)
- Tampilan tabel publik di `/products/:slug` merender struktur kolom dinamis produk bersangkutan.
- Lebar minimum tabel dikendalikan oleh selector scoped berbasis atribut data (`data-cols="1"` s/d `data-cols="8"`), tanpa style inline.
- Indikator gradien bayangan visual halus pada tepi wadah `.pd-size-scroll` saat tabel meluap di desktop/tablet.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Tabel Ukuran Dinamis Per Produk** | Memberikan fleksibilitas spesifikasi dimensi tanpa batasan kolom kaku antar jenis produk. | 2026-10-27 |
| **Layout Grid 5:6 & Galeri Sticky** | Menyajikan informasi B2B dengan proporsi ergonomis persis prototipe. | 2026-10-23 |
| **Penyimpanan Varian & Ukuran JSON** | Fleksibilitas spesifikasi manufaktur tanpa kompleksitas multi-tabel relasional. | 2026-10-23 |
| **Grid 2 Kolom Mobile & Drawer** | Efisiensi ruang layar ponsel dengan drawer filter ergonomis. | 2026-10-21 |
| **Gambar Potret 3:4 Cover** | Keteraturan visual kartu produk tanpa variasi tinggi gambar. | 2026-10-21 |
| **Tombol Selebar Kartu** | Affordance klik jelas dengan aksen hijau brand. | 2026-10-21 |
| **Zero-Price B2B** | Mengarahkan model manufaktur kustom ke konversi penawaran RFQ. | 2026-10-21 |
| **Pencarian Debounced 350ms** | Umpan balik instan tanpa beban request server berlebih saat mengetik. | 2026-10-21 |
| **Deep Link Filter Beranda** | Menghubungkan 4 panel beranda ke `/products?category=<slug>` secara mulus. | 2026-10-19 |
