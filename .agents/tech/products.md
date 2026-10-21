Status: ACTIVE | Terakhir diverifikasi: 2026-10-21 | Kode: controllers/public/productController.js, models/productModel.js, views/public/products.ejs

# Tech Spec: Modul Produk, Katalog & Kapabilitas Mesin (Products & Capabilities)

## 1. Arsitektur & Komponen
Modul ini mengelola katalog produk manufaktur, varian teknis kemasan plastik, pengelompokan kategori produk aktif, ekspor spreadsheet CSV, serta etalase mesin industri di pabrik Cigondewah.

---

## 2. Rute & Controller

| Method | Path | Controller / Handler | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/products` | `productController.index` | `seoMiddleware`, `i18nMiddleware` | Render katalog publik |
| `GET` | `/products/:slug` | `productController.detail` | `seoMiddleware`, `i18nMiddleware` | Render detail produk |
| `GET` | `/capabilities` | `pageController.capabilities` | `seoMiddleware`, `i18nMiddleware` | Render kapabilitas mesin |
| `GET` | `/admin/products` | `admin/productController.index` | `requireAuth`, `roleMiddleware(['superadmin', 'admin'])` | CMS daftar produk |
| `GET` | `/admin/products/export` | `admin/productController.exportCsv` | `requireAuth`, `roleMiddleware` | Ekspor CSV produk |
| `POST` | `/admin/products` | `admin/productController.store` | `requireAuth`, `roleMiddleware`, `uploadMedia` | Tambah produk baru |
| `POST` | `/admin/products/:id` | `admin/productController.update` | `requireAuth`, `roleMiddleware`, `uploadMedia` | Perbarui data produk |
| `GET/POST`| `/admin/product-categories`| `productCategoryController.*` | `requireAuth`, `roleMiddleware` | Kelola kategori produk |
| `GET/POST`| `/admin/capabilities` | `capabilityController.*` | `requireAuth`, `roleMiddleware`, `uploadMedia` | Kelola mesin industri |

---

## 3. Skema Data Terkait

### A. Tabel `product_categories`
*File Migrasi:* `database/migrations/003_upgrade_v2_schema.sql`, `013_add_is_active_to_product_categories.sql`

| Kolom | Tipe | Nullable | Default | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Inc | Primary Key |
| `name_id` | `VARCHAR(150)` | NO | - | Nama kategori (ID) |
| `name_en` | `VARCHAR(150)` | NO | - | Nama kategori (EN) |
| `slug` | `VARCHAR(191)` | NO | - | Unique slug URL |
| `description_id` | `TEXT` | YES | NULL | Deskripsi segmen (ID) |
| `description_en` | `TEXT` | YES | NULL | Deskripsi segmen (EN) |
| `image_url` | `VARCHAR(500)` | YES | NULL | Gambar representatif segmen panel |
| `sort_order` | `INT` | YES | `0` | Urutan penataan |
| `is_active` | `TINYINT(1)` | NO | `1` | Flag status aktif |

### B. Tabel `products`
*Catatan:* Kolom `is_featured` telah dihapus permanen oleh migrasi `011_drop_product_is_featured.sql`.

| Kolom | Tipe | Nullable | Default | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Inc | Primary Key |
| `category_id` | `INT` | NO | - | Foreign Key ke `product_categories.id` |
| `name_id` | `VARCHAR(255)` | NO | - | Nama produk (ID) |
| `name_en` | `VARCHAR(255)` | NO | - | Nama produk (EN) |
| `slug` | `VARCHAR(191)` | NO | - | Unique slug URL |
| `description_id` | `TEXT` | YES | NULL | Deskripsi detail (ID) |
| `description_en` | `TEXT` | YES | NULL | Deskripsi detail (EN) |
| `material_specs` | `JSON` | YES | NULL | Spesifikasi material JSON (ID/EN) |
| `technical_specs`| `JSON` | YES | NULL | Spesifikasi teknis JSON (ID/EN) |
| `main_image` | `VARCHAR(500)` | YES | NULL | Gambar utama produk |
| `gallery_images` | `JSON` | YES | NULL | Array string path gambar galeri |
| `status` | `ENUM('draft','published','archived')` | YES | `'published'` | Status publikasi |
| `is_active` | `TINYINT(1)` | YES | `1` | Status ketersediaan |
| `sort_order` | `INT` | YES | `0` | Urutan tampilan |
| `meta_*`, `og_image`, `canonical_url`, `robots`, `jsonld` | Berbagai | YES | - | Metadata SEO per produk |

### C. Tabel `product_variants` & `capabilities`
- `product_variants`: `id`, `product_id` (FK `products.id`), `name_id`, `name_en`, `sku`, `specs` (JSON: dimensi, ketebalan, warna, kapasitas), `sort_order`. Dikelola langsung di dalam `models/productModel.js`.
- `capabilities`: `id`, `name_id`, `name_en`, `category` (ekstrusi, bag-making, printing), `description_id`, `description_en`, `specs` (JSON: kecepatan, kapasitas bulanan), `image_url`, `sort_order`, `is_active`.

---

## 4. Komponen Antarmuka & Validasi
- **Deep Link Filter Kategori:** Controller membaca `req.query.category`. Jika parameter slug valid ditemukan, katalog memfilter produk berdasarkan kategori terkait dan menetapkan status tab aktif.
- **Ekspor CSV:** Utilitas `utils/csvExporter.js` menghasilkan stream response CSV dengan header `Content-Type: text/csv` dan `Content-Disposition: attachment; filename=products_export_<timestamp>.csv`.
