Status: ACTIVE | Terakhir diverifikasi: 2026-10-27 | Kode: controllers/public/productController.js, models/productModel.js, views/public/products.ejs, views/public/partials/product-card-fragment.ejs

# Tech Spec: Modul Produk & Katalog Manufaktur (Products Catalog)

## 1. Arsitektur & Komponen
Modul ini mengelola katalog produk manufaktur di `/products`, detail spesifikasi teknis di `/products/:slug`, navigasi kategori dinamis, pencarian debounced, pengurutan multi-kriteria, pemuatan fragmen via AJAX, serta operasi CMS produk di `/admin/products`.

---

## 2. Rute & Controller

| Method | Path | Controller / Handler | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/products` | `productController.index` | `seoMiddleware`, `i18nMiddleware` | Render katalog SSR atau fragmen AJAX `[COMPLETED T-192]` |
| `GET` | `/products/:slug` | `productController.detail` | `seoMiddleware`, `i18nMiddleware` | Render detail spesifikasi produk (Rincian lengkap: `tech/products-detail.md`) |
| `GET` | `/admin/products` | `admin/productController.index` | `requireAuth`, `roleMiddleware(['superadmin', 'admin'])` | CMS daftar produk |
| `GET` | `/admin/products/export` | `admin/productController.exportCsv` | `requireAuth`, `roleMiddleware` | Ekspor CSV katalog (kolom gabungan dinamis) [COMPLETED T-216] |
| `GET` | `/admin/products/:id/size-table-columns` | `admin/productController.getSizeTableColumns` | `requireAuth`, `roleMiddleware` | API ambil kolom ukuran produk [COMPLETED T-216] |
| `POST` | `/admin/products` | `admin/productController.store` | `requireAuth`, `roleMiddleware`, `uploadMedia` | Tambah produk baru |
| `POST` | `/admin/products/:id` | `admin/productController.update` | `requireAuth`, `roleMiddleware`, `uploadMedia` | Perbarui data produk |
| `GET/POST`| `/admin/product-categories`| `productCategoryController.*` | `requireAuth`, `roleMiddleware` | Kelola kategori produk aktif |

---

## 3. Skema Data Terkait

### A. Tabel `product_categories`
*Migrasi:* `003_upgrade_v2_schema.sql`, `013_add_is_active_to_product_categories.sql`

| Kolom | Tipe | Nullable | Default | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Inc | Primary Key |
| `name_id` | `VARCHAR(150)` | NO | - | Nama kategori (ID) |
| `name_en` | `VARCHAR(150)` | NO | - | Nama kategori (EN) |
| `slug` | `VARCHAR(191)` | NO | - | Unique slug URL |
| `description_id`, `description_en` | `TEXT` | YES | NULL | Deskripsi segmen |
| `image_url` | `VARCHAR(500)` | YES | NULL | Gambar segmen panel |
| `sort_order` | `INT` | YES | `0` | Urutan penataan |
| `is_active` | `TINYINT(1)` | NO | `1` | Flag status penayangan |

### B. Tabel `products` & `product_variants`
*Catatan:* Kolom `is_featured` dihapus permanen oleh migrasi `011`. Kolom legacy `material_specs` dan `technical_specs` di-drop oleh migrasi `016`. Sistem bebas kolom harga (zero-price). Kolom `cta_text_id` dan `cta_text_en` ditambahkan oleh migrasi `017`. Kolom `size_table` (JSON) menyimpan objek dinamis `{ columns, rows }` yang dimigrasi dari format lama via migrasi `018` [COMPLETED T-213].
- `products`: `id`, `category_id` (FK), `name_id`, `name_en`, `slug`, `short_description_id/en`, `description_id/en`, `cta_text_id/en`, `variants` (JSON), `size_table` (JSON objek `{ columns, rows }` [COMPLETED T-214]), `main_image`, `gallery_images` (JSON), `status`, `is_active`, `sort_order`, field SEO.
- `product_variants`: `id`, `product_id` (FK), `name_id`, `name_en`, `sku`, `specs` (JSON dimensi, ketebalan, beban), `sort_order`.

---

## 4. Komponen Antarmuka, Server Contract & Validasi

### A. Kontrak Parameter URL & Validasi Server (`productController.js`) [COMPLETED T-192]
- Parameter Query:
  - `category` (string, opsional): Divalidasi terhadap slug pada `product_categories WHERE is_active = 1`.
  - `search` (string, opsional): Sanitasi input, dipangkas (trim), panjang maksimal 100 karakter.
  - `sort` (enum, opsional): Whitelist `['newest', 'alpha-asc', 'alpha-desc', 'catalog']`, default `'newest'`.
  - `page` (integer, opsional): Bilangan bulat positif >= 1, default `1`. Batas muatan default adalah 9 (`limit = 9`).
  - `format` (enum, opsional): Whitelist `['html', 'fragment']`, default `'html'`.
- Respons Parsial (Fragment Mode):
  - Jika `req.query.format === 'fragment'` atau request memiliki header `X-Requested-With: XMLHttpRequest`, controller merender partial EJS `views/public/partials/product-card-fragment.ejs`. Seluruh output variabel menggunakan escape EJS `<%= %>`.

### B. Kueri Data Dinamis (`productModel.js`) [COMPLETED T-192]
- Sorting dinamis berbasis whitelist pada `findAll()`:
  - `newest`: `ORDER BY p.id DESC`
  - `alpha-asc`: `ORDER BY p.name_id ASC`
  - `alpha-desc`: `ORDER BY p.name_id DESC`
  - `catalog`: `ORDER BY p.sort_order ASC, p.id DESC`
- Pencarian multi-kolom terparameter: `(p.name_id LIKE ? OR p.name_en LIKE ? OR p.slug LIKE ? OR p.description_id LIKE ? OR p.description_en LIKE ?)` dengan binding `%search%`.

### C. Isolasi Namespace CSS `.plp-*` & Desain Sistem [COMPLETED T-193]
- Elemen katalog memakai prefix unik `.plp-*` di `components.css` (`.plp-grid`, `.plp-card`, `.plp-sidebar`, `.plp-toolbar`, dll.).
- Rasio potret kartu: `9 / 10` (desktop), `1 / 1` (mobile) dengan `object-fit: cover` (CLS = 0) serta garis pembatas horizontal individual `.plp-card-line`.
- Tombol outline: border netral warna font `var(--color-primary)` (hover `var(--color-primary)` teks `var(--color-on-primary)`), hit-target 44px WCAG AA.

### D. Navigasi Kategori Dinamis & Deep Link Homepage [COMPLETED T-194]
- `productCategoryModel.findAll({ activeOnly: true })` mengambil kategori aktif dinamis beserta jumlah produk aktif.
- Status aktif filter sinkron dengan query URL `?category=<slug>` via `window.history.pushState`.
- Deep link dari 4 panel homepage (`/products?category=<slug>`) berfungsi normal tanpa perubahan file beranda.

### E. Toolbar Atas, Debounce Search & Live Region [COMPLETED T-195]
- Input pencarian di kanan toolbar mengeksekusi pencarian asinkron dengan debounce 350ms.
- Dropdown urutan memicu pengurutan seketika tanpa parameter harga.
- Pengumuman jumlah hasil dieksekusi via live region: `<div class="sr-only" aria-live="polite" role="status">`.

### F. Progressive Enhancement Load More [COMPLETED T-196]
- Tombol `<a href="/products?page=2..." class="plp-more-btn">` berfungsi sebagai fallback navigasi reguler.
- Skrip AJAX `public/js/products.js` menangani event klik, melakukan fetch fragmen EJS, dan menyisipkannya ke `.plp-grid`.
- Animasi transisi masuk: `opacity: 0; transform: translateY(12px)` ke `opacity: 1; transform: translateY(0)` dalam `var(--transition-normal)`. Menghormati `prefers-reduced-motion`. Tombol disembunyikan saat `offset + limit >= totalProducts`.

### G. Adaptasi Responsif Mobile & Filter Drawer [COMPLETED T-197]
- Desktop (>= 1024px): 2 kolom (sidebar 280px + grid 3 kolom). Tablet (768px - 1023px): grid 2 kolom + sidebar adaptif.
- Mobile (< 768px): grid 2 kolom kompak; filter kategori disajikan via tombol trigger yang memunculkan Drawer samping (*offcanvas*), dapat ditutup via overlay click atau tombol Escape. Target sentuh minimal 44 x 44 px.

### H. SEO Canonical, Pagination Noindex & Kepatuhan CSP [COMPLETED T-198]
- Tag canonical mengarah ke URL dasar `/products` (atau kategori valid).
- Paginasi `page > 1`, pencarian, atau pengurutan otomatis menginjeksi tag `<meta name="robots" content="noindex, follow">`.
- Seluruh event listener dikelola di `public/js/products.js` tanpa inline script/handler (`onclick`, `onchange`), 100% patuh pada CSP Helmet.
