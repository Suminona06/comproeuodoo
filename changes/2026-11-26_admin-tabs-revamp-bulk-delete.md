# Proposal Perubahan: Revamp Tabs Dashboard Admin (Growing Underline) & Fitur Bulk Delete 4 Modul Admin

Tanggal: 2026-11-26  
Status: **MERGED KE SPEC (Keputusan Terkunci: 1a, 2a, 3a, 4a, 5a - Siap Implementasi T-457..T-467)**  
Referensi Visual: `Design/Tabs design.png` (diadaptasi ke token hijau tema admin `public/css/admin/tokens.css`, nol warna biru)

---

## 1. Konteks

Menyeragamkan seluruh 3 jenis komponen tab di Dashboard Admin ke gaya kontainer putih membulat berindikator *growing underline* hijau Euodoo (selaras proporsi `Design/Tabs design.png` dengan aksesibilitas sentuh mobile >= 44px dan zero raw hex), sekaligus menambahkan fitur **Bulk Delete** tervalidasi server-side (RBAC, CSRF, whitelist ID) pada 4 tabel admin: Katalog Produk, Kategori Produk, Berita/Artikel, dan Kategori Berita. Seluruh halaman dan CSS publik (`public/css/tokens.css`, `public/css/components/*.css`, `views/public/`, `views/partials/products/spec-tabs.ejs`, `views/partials/news/filter-bar.ejs`) dibekukan total tanpa perubahan.

---

## 2. Delta Spesifikasi per Modul

### A. Hasil Audit Isolasi Class & Cakupan Tab Admin (Read-Only)
1. `.filter-tabs-wrap` + `.tab-btn`: dipakai di **6 halaman admin** (`views/admin/products/index.ejs`, `views/admin/posts/index.ejs`, `views/admin/post-categories/index.ejs`, `views/admin/inquiries/index.ejs`, `views/admin/dashboard.ejs`, `views/admin/media/index.ejs`).
2. `.about-tabs-nav` + `.about-tab-btn`: dipakai di **2 halaman CMS multi-tab** (`views/admin/about/index.ejs`, `views/admin/home-content/index.ejs`).
3. `.media-picker-tabs` + `.media-picker-tab-btn`: dipakai di **1 modal universal** (`views/partials/media-picker-modal.ejs`, dikendalikan `public/js/media-picker.js`).
4. **Isolasi Publik Terverifikasi:** Tidak satu pun dari 6 class tab admin di atas dipakai pada halaman publik (`views/partials/products/spec-tabs.ejs` memakai `.pd-tab-btn`, dan `public/css/admin/*.css` tidak dimuat di halaman publik).

### B. Modul `prd/admin-ui.md` -> Sub-Modul Baru `prd/admin-ui-tabs-bulk.md` & `tech/admin-ui-tabs-bulk.md`

| Aspek | Kondisi Lama | Kondisi Baru (Terkunci) |
| :--- | :--- | :--- |
| **Gaya Tabs Dashboard Admin (`FR-41`)** | 3 gaya tidak seragam: `.filter-tabs-wrap` memakai pill abu (`var(--bg-subtle)`) dengan `.tab-btn` kecil `11.5px` dan aktif box putih; `.about-tabs-nav` memakai gaya liquid-glass `backdrop-filter: blur(8px)` dengan kartu putih; `.media-picker-tabs` memakai bar abu datar ber-border bawah `2px` statis. | **Seluruh 3 jenis tab admin** (`.filter-tabs-wrap`, `.about-tabs-nav`, dan `.media-picker-tabs`) diseragamkan ke gaya **Growing Underline** memakai token hijau admin `var(--primary)` (nol warna biru). Kontainer tab memakai latar bersih (`var(--bg-surface)`), border halus (`var(--border-main)`), bayangan lembut (`var(--shadow-sm)`), radius membulat (`var(--r-xl)` pada `.about-tabs-nav`, `var(--r-lg)` pada `.filter-tabs-wrap`, dan kontainer terintegrasi rapi di header modal `.media-picker-tabs`). Proporsi tipografi seimbang (`13px` di toolbar & `13.5px` di tab halaman/modal), teks non-aktif `var(--text-slate-dark)` (rasio 7.58:1) / `var(--text-muted)` (rasio 4.76:1), teks aktif `var(--text-main)` `font-weight: 600` (rasio 19.43:1). |
| **Animasi, Hover, Aksesibilitas & Mobile Tabs (`FR-41`)** | Transisi memakai `transition: all var(--ease)`, tanpa pemisahan `@media (hover: hover)`, tanpa aturan `prefers-reduced-motion`, dan `.filter-tabs-wrap .tab-btn` di `<= 480px` menyusut ke `11px` dengan tinggi < 32px. | Indikator `::after` tumbuh dari tengah (`transform-origin: center`, `scaleX(0 -> 1)`, `opacity: 0 -> 1`) saat aktif, serta menampilkan pratinjau garis tipis/redup (`opacity: 0.35`, `scaleX(0.6)`) saat hover tab non-aktif di dalam `@media (hover: hover)`. Hanya menganimasikan `transform` dan `opacity`, state `:active` untuk layar sentuh, `:focus-visible` dengan `outline: 2px solid var(--primary)` + `var(--focus-ring)`, nonaktif pada `@media (prefers-reduced-motion: reduce)`. Mobile `<= 768px` memakai `min-height: 44px`, `flex-wrap: nowrap`, `overflow-x: auto`, `scroll-snap-type: x proximity`, dan label tidak terpotong di `320px-768px`. |
| **Komponen Seleksi Massal Tabel Admin (`FR-41`)** | Belum ada komponen checkbox seleksi baris maupun toolbar aksi bulk delete terstandarisasi pada tabel admin. | Komponen terstandarisasi berprefix `.adm-bulk-*` (`public/js/admin-bulk-delete.js`, gaya di `public/css/admin/tables-badges.css`) dengan kolom checkbox paling kiri (`40px`), checkbox header 3 state (`unchecked`, `checked`, `indeterminate`), highlight baris terpilih (`var(--primary-subtle)`), tombol aksi **kontekstual** `.adm-btn.adm-btn-danger.adm-bulk-delete-btn` di `.table-toolbar` (hanya muncul saat >= 1 item terpilih dengan counter jumlah terpilih), reset seleksi otomatis saat paginasi/filter/pencarian berubah, konfirmasi SweetAlert2 (`window.showAdminConfirm`), serta lokalisasi simetris `admin_bulk.*` di `locales/id.json` dan `locales/en.json`. |

### C. Modul `tech/admin-ui-css.md`

| Aspek | Kondisi Lama | Kondisi Baru (Terkunci) |
| :--- | :--- | :--- |
| **Kepemilikan Selector Tabs & Bulk (`tables-badges.css` vs `tabs-toggles.css`)** | `.filter-tabs-wrap` dan `.tab-btn` berada di `public/css/admin/tables-badges.css` (525 baris); `.about-tabs-nav` berada di `public/css/admin/tabs-toggles.css` (312 baris); `.media-picker-tabs` berada di `public/css/admin/media-picker.css` (379 baris). | `.filter-tabs-wrap` dan `.tab-btn` dipindahkan dari `tables-badges.css` ke `tabs-toggles.css` agar seluruh aturan tab halaman/toolbar terpusat (0 duplikat selector lintas 21 berkas CSS admin), sementara `.media-picker-tabs` diperbarui selaras di `media-picker.css`. Ruang yang terbuka di `tables-badges.css` menampung komponen `.adm-bulk-*` sehingga seluruh 21 berkas tetap berada di bawah batas <= 600 baris dan zero raw hex. |

### D. Modul `prd/admin-products-rfq.md` & `tech/admin-products-rfq.md`

| Aspek | Kondisi Lama | Kondisi Baru (Terkunci) |
| :--- | :--- | :--- |
| **Bulk Delete Katalog Produk & Kategori Produk (`FR-42`)** | `/admin/products` dan `/admin/product-categories` hanya mendukung hapus satuan (`POST /admin/products/:id/delete` dan `POST /admin/product-categories/:id/delete`). State kosong `/admin/products` memakai `colspan="5"` dan `/admin/product-categories` memakai `colspan="7"`. | Ditambahkan kolom checkbox seleksi massal paling kiri (update state kosong menjadi `colspan="6"` di `views/admin/products/partials/table-rows.ejs` dan `colspan="8"` di `views/admin/product-categories/index.ejs`), tombol bulk delete kontekstual di `.table-toolbar`, serta endpoint `POST /admin/products/bulk-delete` dan `POST /admin/product-categories/bulk-delete` (RBAC `['superadmin', 'admin']`, CSRF aktif, whitelist array ID integer positif unik maks 100 item). Pada Kategori Produk, kategori yang masih memiliki produk tetap diizinkan dihapus massal (`category_id = NULL` pada produk terkait) disertai peringatan jumlah produk terdampak di konfirmasi SweetAlert2. |
| **Sinkronisasi Paginasi & Filter `/admin/products`** | `public/js/admin-products.js` hanya me-render `rowsHtml` dan `paginationHtml` saat filter/paginasi berubah. | Setelah `tbody.innerHTML` diperbarui pada `loadProducts()`, modul memancarkan event `admin:products-loaded` untuk **mereset seleksi otomatis** dan menyinkronkan checkbox header. Eksekusi bulk delete pada `/admin/products` memanggil reload Fetch tanpa reload halaman penuh dan otomatis mundur ke halaman valid terakhir bila seluruh baris di halaman ujung terhapus. |

### E. Modul `prd/admin-cms.md`, `tech/admin-cms.md`, & `tech/news.md`

| Aspek | Kondisi Lama | Kondisi Baru (Terkunci) |
| :--- | :--- | :--- |
| **Bulk Delete Berita & Kategori Berita (`FR-42`)** | `/admin/posts` dan `/admin/post-categories` hanya mendukung hapus satuan (`POST /admin/posts/:id/delete` dan `POST /admin/post-categories/:id/delete`). State kosong keduanya memakai `colspan="7"`. | Ditambahkan kolom checkbox seleksi massal paling kiri (update state kosong menjadi `colspan="8"` di `views/admin/posts/index.ejs` dan `views/admin/post-categories/index.ejs`), tombol bulk delete kontekstual di `.table-toolbar`, serta endpoint `POST /admin/posts/bulk-delete` dan `POST /admin/post-categories/bulk-delete` (RBAC `['superadmin', 'admin', 'editor']`, CSRF aktif, whitelist array ID integer positif unik maks 100 item). Bulk delete artikel membersihkan `slug_redirects`, menghapus cover di storage, dan memanggil `invalidateSitemapCache()`. Pada Kategori Berita, kategori berisi artikel tetap diizinkan dihapus massal (`category_id = NULL`) dengan peringatan total artikel terdampak pada SweetAlert2. |
| **Sinkronisasi Live Search `/admin/posts`** | `filterRows()` di `public/js/admin.js` menyembunyikan baris dengan `row.style.display = 'none'` tanpa notifikasi ke komponen lain. | `filterRows()` memancarkan `CustomEvent('admin:table-filtered')` sehingga seleksi di-reset otomatis saat pencarian berubah dan aksi "Pilih Semua" / bulk delete hanya mencakup baris yang aktif tampil. |

---

## 3. Keputusan Terkunci (Disetujui Azis: 1a, 2a, 3a, 4a, 5a)

| # | Keputusan | Opsi Terpilih | Implikasi Teknis Terkunci |
| :-: | :--- | :--- | :--- |
| 1 | **Cakupan revamp style tabs Admin** | **1a** (Semua 3 jenis tab admin) | `.filter-tabs-wrap`, `.about-tabs-nav`, dan `.media-picker-tabs` seluruhnya memakai *growing underline* bertoken `var(--primary)` dengan kepadatan sesuai konteks. |
| 2 | **Arah animasi & hover *growing underline*** | **2a** (Tumbuh dari tengah + pratinjau hover redup) | `transform-origin: center`, `scaleX(0 -> 1)` aktif, pratinjau `scaleX(0.6)` & `opacity: 0.35` saat hover non-aktif dalam `@media (hover: hover)`, mati di `prefers-reduced-motion`. |
| 3 | **Perilaku seleksi saat paginasi/filter berubah** | **3a** (Reset seleksi otomatis) | Event `admin:products-loaded` & `admin:table-filtered` mengosongkan centang dan mereset checkbox header agar item terhapus selalu persis yang terlihat di layar saat ini. |
| 4 | **Visibilitas tombol Bulk Delete di toolbar** | **4a** (Kontekstual saat >= 1 terpilih) | Tombol `.adm-bulk-delete-btn` memakai `.adm-bulk-hidden` saat 0 item dipilih dan muncul dengan counter jumlah terpilih saat >= 1 item dipilih. |
| 5 | **Kategori Produk/Berita yang masih punya item** | **5a** (Izinkan hapus massal + peringatan SweetAlert2) | Transaksi `UPDATE ... SET category_id = NULL` lalu `DELETE`, dengan modal SweetAlert2 menampilkan total produk/artikel terdampak sebelum konfirmasi. |

---

## 4. Rencana Task Implementasi (Medium-Ready, Mulai dari `T-457`)

*Catatan: Nomor task melanjutkan nomor aktif terakhir di `.agents/3-TASKS.md` (`T-456` selesai -> mulai `T-457`). Seluruh keputusan 1a-5a telah dikunci di bawah ini.*

---

### `T-457` `[Tier: Argon Medium]`: Revamp CSS Tabs Dashboard Admin (Growing Underline Tema Hijau Euodoo)
- **File Terdampak (4 file):**
  1. `public/css/admin/tabs-toggles.css`
  2. `public/css/admin/tables-badges.css`
  3. `public/css/admin/responsive-viewport.css`
  4. `public/css/admin/media-picker.css`
- **Langkah Kerja:**
  1. Pindahkan aturan `.filter-tabs-wrap` dan `.tab-btn` dari `public/css/admin/tables-badges.css` ke `public/css/admin/tabs-toggles.css` (pastikan 0 duplikat selector lintas 21 file).
  2. Terapkan gaya kontainer putih membulat (`background: var(--bg-surface)`, `border: 1px solid var(--border-main)`, `box-shadow: var(--shadow-sm)`, `border-radius: var(--r-xl)` untuk `.about-tabs-nav` dan `var(--r-lg)` untuk `.filter-tabs-wrap`) serta hapus `backdrop-filter` liquid-glass pada `.about-tabs-nav`.
  3. Standarisasi proporsi tipografi & padding: `.filter-tabs-wrap .tab-btn` (`font-size: 13px`, `padding: 7px 14px`), `.about-tab-btn` (`font-size: 13.5px`, `padding: 9px 16px`), teks non-aktif `var(--text-slate-dark)` / `var(--text-muted)`, teks aktif `var(--text-main)` `font-weight: 600`, dan `cursor: pointer`.
  4. Implementasikan indikator *growing underline* melalui `::after` (`height: 2.5px`, `background-color: var(--primary)`, `border-radius: var(--r-pill)`, `transform-origin: center`) dengan animasi hanya pada `transform` dan `opacity`: default `scaleX(0); opacity: 0;`, hover non-aktif di dalam `@media (hover: hover)` `scaleX(0.6); opacity: 0.35;`, aktif `.active` / `[aria-selected="true"]` `scaleX(1); opacity: 1;`, state `:active` sentuh, `:focus-visible` (`outline: 2px solid var(--primary)` + `var(--focus-ring)`), serta `@media (prefers-reduced-motion: reduce)` (`transition: none`).
  5. Perbarui `.media-picker-tabs` dan `.media-picker-tab-btn` di `public/css/admin/media-picker.css` memakai pola *growing underline* `::after` identik (`transform-origin: center`, `var(--primary)`, pratinjau hover redup, `font-size: 13.5px`, teks aktif `var(--text-main)` `font-weight: 600`, tanpa border-bottom statis lama).
  6. Perbarui aturan mobile di `public/css/admin/responsive-viewport.css` (dan `tabs-toggles.css`) agar tab pada `<= 768px` memakai `min-height: 44px`, `flex-wrap: nowrap`, `overflow-x: auto`, `scroll-snap-type: x proximity`, tanpa memotong label di `320px-768px`.
- **Kontrak Data / Class CSS:**
  - Mempertahankan class existing `.filter-tabs-wrap`, `.tab-btn`, `.about-tabs-nav`, `.about-tab-btn`, `.media-picker-tabs`, `.media-picker-tab-btn` serta state `.active` dan `[aria-selected="true"]` agar 100% kompatibel dengan JS existing (`admin.js`, `admin-products.js`, `admin-inquiries.js`, `media-picker.js`).
  - Wajib hanya memakai token dari `public/css/admin/tokens.css` (zero raw hex, zero warna biru).
- **Referensi Pola:** `public/css/admin/tabs-toggles.css`, `public/css/admin/buttons.css` (pola `@media (hover: hover)` & `prefers-reduced-motion`), `Design/Tabs design.png`.
- **Batasan Negatif:** Dilarang menyentuh `public/css/tokens.css`, `public/css/components/*.css`, `views/partials/products/spec-tabs.ejs`, atau file JS/EJS. Dilarang menulis hex mentah di luar `public/css/admin/tokens.css`. Setiap berkas CSS wajib <= 600 baris dan 0 duplikat selector konteks `@media` sama.
- **Skill Relevan:** `antislop-ui`, `antislop-layoutmobile`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && npm run lint:views && node --test tests/test-admin-css-modular.js
  ```

---

### `T-458` `[Tier: Argon Medium]`: Backend Bulk Delete Katalog Produk (Helper Whitelist, Model, Service & Controller)
- **File Terdampak (4 file):**
  1. `utils/bulkIdsHelper.js` *(baru)*
  2. `models/productModel.js`
  3. `services/productCrudService.js`
  4. `controllers/admin/productController.js`
- **Langkah Kerja:**
  1. Buat `utils/bulkIdsHelper.js` yang mengekspor konstanta `MAX_BULK_DELETE_IDS = 100` dan fungsi murni `parseBulkIds(rawBody, { max = MAX_BULK_DELETE_IDS })` untuk menerima `rawBody?.ids ?? rawBody?.['ids[]']`, memvalidasi array tidak kosong, menolak nilai bukan integer positif (`<= 0`, desimal, NaN, huruf, objek), menduplikasi unik via `Set`, dan menolak jika jumlah ID > `max`.
  2. Tambahkan metode `findByIds(ids)` dan `deleteMany(ids)` di `models/productModel.js` memakai *prepared statement* terparameter (`IN (?, ...)`) dan transaksi DB (`DELETE FROM product_variants WHERE product_id IN (...)` lalu `DELETE FROM products WHERE id IN (...)`).
  3. Tambahkan `bulkDeleteAdminProducts(rawBody, deps = {})` di `services/productCrudService.js` mengikuti pola DI `useDeps(deps)` dari `deleteAdminProduct`: validasi via `parseBulkIds`, cek eksistensi via `findByIds`, hapus transaksi via `deleteMany`, cleanup `image_url` unik di `d.storage.delete`, panggil `d.invalidateSitemapCache()` sekali, dan kembalikan `{ status, deletedCount, requestedCount, skippedIds, message }`.
  4. Tambahkan handler `bulkDestroy(req, res)` di `controllers/admin/productController.js` dengan pemetaan HTTP `400` (`validation_error`), `404` (`not_found`), `200` (`ok`), `500` (error generik).
- **Kontrak Data Eksplisit:**
  - Input: `POST` JSON `{ ids: number[] }` (atau form `ids[]`), batas `1 <= ids.length <= 100`, integer positif unik.
  - Output `200`: `{ success: true, deletedCount: number, requestedCount: number, skippedIds: number[], message: string }`.
  - Output `400`: `{ success: false, message: string }` (kosong, non-integer, atau > 100 ID).
  - Output `404`: `{ success: false, message: string }` (tidak ada ID ditemukan di DB).
- **Referensi Pola:** `deleteAdminProduct` di `services/productCrudService.js`, `productModel.delete` di `models/productModel.js`, `respondDestroyResult` di `controllers/admin/productController.js`.
- **Batasan Negatif:** Dilarang menyentuh `routes/adminRoutes.js`, view EJS, file JS klien, atau tabel DB (tidak ada migrasi skema baru). Ikuti batas ESLint strict (`max-lines-per-function`, `max-depth`, `complexity`).
- **Skill Relevan:** `api-and-interface-design`, `security-and-hardening`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && node --test tests/test-admin-batch2-services.js
  ```

---

### `T-459` `[Tier: Hydrogen Medium]`: Backend Bulk Delete Kategori Produk & Registrasi Rute Katalog
- **File Terdampak (4 file):**
  1. `models/productCategoryModel.js`
  2. `services/productCategoryService.js`
  3. `controllers/admin/productCategoryController.js`
  4. `routes/adminRoutes.js`
- **Langkah Kerja:**
  1. Tambahkan `findByIdsWithProductCount(ids)` dan `deleteMany(ids)` di `models/productCategoryModel.js` menggunakan transaksi DB (`pool.getConnection()`): `UPDATE products SET category_id = NULL WHERE category_id IN (...)` lalu `DELETE FROM product_categories WHERE id IN (...)` (sesuai Keputusan 5a).
  2. Tambahkan `bulkDeleteProductCategories(rawBody, deps = {})` di `services/productCategoryService.js` dengan validasi `parseBulkIds`, hitung total produk terdampak (`affectedItemsCount`), eksekusi `deleteMany`, invalidasi sitemap (`invalidateSitemapCache()`), dan kembalikan `{ status, deletedCount, requestedCount, skippedIds, affectedItemsCount, message }`.
  3. Tambahkan handler `bulkDestroy(req, res)` di `controllers/admin/productCategoryController.js` yang merespons JSON `200`/`400`/`404`/`500` (serta fallback redirect bila bukan JSON).
  4. Daftarkan rute `POST /products/bulk-delete` dan `POST /product-categories/bulk-delete` di `routes/adminRoutes.js` dengan middleware `requireAuth, roleMiddleware(['superadmin', 'admin'])` tepat **sebelum** rute berparameter `/:id` agar tidak tertangkap oleh handler `/:id`.
- **Kontrak Data Eksplisit:**
  - Endpoint: `POST /admin/products/bulk-delete` & `POST /admin/product-categories/bulk-delete` (RBAC `['superadmin', 'admin']`, CSRF aktif).
  - Body: `{ ids: number[] }` (1..100 integer positif unik).
  - Response `200`: `{ success: true, deletedCount, requestedCount, skippedIds, affectedItemsCount, message }`; `400` invalid payload; `403` forbidden/CSRF; `404` tidak ditemukan.
- **Referensi Pola:** `deleteProductCategory` di `services/productCategoryService.js`, `productCategoryModel.delete` di `models/productCategoryModel.js`, rute T-46 di `routes/adminRoutes.js`.
- **Batasan Negatif:** Dilarang mengubah perilaku endpoint single delete `/:id/delete`, dilarang menyentuh rute berita/artikel (`posts`/`post-categories`), dan dilarang mengedit file frontend.
- **Skill Relevan:** `api-and-interface-design`, `security-and-hardening`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && node --test tests/test-admin-batch2-services.js
  ```

---

### `T-460` `[Tier: Argon Medium]`: Backend Bulk Delete Berita / Artikel (Model, Redirect Cleanup, Service & Controller)
- **File Terdampak (4 file):**
  1. `models/postModel.js`
  2. `models/slugRedirectModel.js`
  3. `services/postService.js`
  4. `controllers/admin/postController.js`
- **Langkah Kerja:**
  1. Tambahkan `findByIds(ids)` dan `deleteMany(ids)` di `models/postModel.js` menggunakan *prepared statement* terparameter (`IN (?, ...)`).
  2. Tambahkan `deleteByEntityIds(entityType, entityIds)` di `models/slugRedirectModel.js` (`DELETE FROM slug_redirects WHERE entity_type = ? AND entity_id IN (...)`).
  3. Tambahkan `bulkDeleteAdminPosts(rawBody, deps = {})` di `services/postService.js`: validasi `parseBulkIds`, ambil data existing via `findByIds`, hapus `posts` dan `slug_redirects` secara aman, hapus setiap file `display_image`/`image_url` di storage via `d.storage.delete`, panggil `d.invalidateSitemapCache()` sekali, dan kembalikan `{ status, deletedCount, requestedCount, skippedIds, message }`.
  4. Tambahkan handler `bulkDestroy(req, res)` di `controllers/admin/postController.js` dengan pemetaan HTTP `200`/`400`/`404`/`500`.
- **Kontrak Data Eksplisit:**
  - Body: `{ ids: number[] }` (1..100 integer positif unik).
  - Response `200`: `{ success: true, deletedCount, requestedCount, skippedIds, message }`; `400` invalid payload; `404` tidak ditemukan.
- **Referensi Pola:** `deleteAdminPost` di `services/postService.js`, `slugRedirectModel.deleteByEntity` di `models/slugRedirectModel.js`.
- **Batasan Negatif:** Dilarang menyentuh `routes/adminRoutes.js`, halaman publik `/news`, atau view admin. Ikuti aturan ESLint strict.
- **Skill Relevan:** `api-and-interface-design`, `security-and-hardening`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && node --test tests/test-admin-batch3-services.js
  ```

---

### `T-461` `[Tier: Hydrogen Medium]`: Backend Bulk Delete Kategori Berita & Registrasi Rute Berita
- **File Terdampak (4 file):**
  1. `models/postCategoryModel.js`
  2. `services/postCategoryService.js`
  3. `controllers/admin/postCategoryController.js`
  4. `routes/adminRoutes.js`
- **Langkah Kerja:**
  1. Tambahkan `findByIdsWithPostCount(ids)` dan `deleteMany(ids)` di `models/postCategoryModel.js` memakai transaksi DB (`UPDATE posts SET category_id = NULL WHERE category_id IN (...)` lalu `DELETE FROM post_categories WHERE id IN (...)`, sesuai Keputusan 5a).
  2. Tambahkan `bulkDeletePostCategories(rawBody, deps = {})` di `services/postCategoryService.js` menggunakan `parseBulkIds`, hitung `affectedItemsCount`, jalankan transaksi `deleteMany`, dan panggil `invalidateSitemapCache()`.
  3. Tambahkan handler `bulkDestroy(req, res)` di `controllers/admin/postCategoryController.js` (JSON `200`/`400`/`404`/`500`).
  4. Daftarkan rute `POST /posts/bulk-delete` dan `POST /post-categories/bulk-delete` di `routes/adminRoutes.js` dengan middleware `requireAuth, roleMiddleware(['superadmin', 'admin', 'editor'])` tepat **sebelum** rute berparameter `/:id`.
- **Kontrak Data Eksplisit:**
  - Endpoint: `POST /admin/posts/bulk-delete` & `POST /admin/post-categories/bulk-delete` (RBAC `['superadmin', 'admin', 'editor']`, CSRF aktif).
  - Response `200`: `{ success: true, deletedCount, requestedCount, skippedIds, affectedItemsCount, message }`; `400`/`403`/`404` konsisten.
- **Referensi Pola:** `deletePostCategory` di `services/postCategoryService.js`, `postCategoryModel.delete` di `models/postCategoryModel.js`, rute T-47 di `routes/adminRoutes.js`.
- **Batasan Negatif:** Dilarang mengubah rute produk/inquiry, dilarang mengedit view EJS atau CSS.
- **Skill Relevan:** `api-and-interface-design`, `security-and-hardening`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && node --test tests/test-admin-batch3-services.js
  ```

---

### `T-462` `[Tier: Argon Medium]`: Kamus i18n Simetris & Modul Shared JS Bulk Select (`admin-bulk-delete.js`)
- **File Terdampak (4 file):**
  1. `locales/id.json`
  2. `locales/en.json`
  3. `public/js/admin-bulk-delete.js` *(baru)*
  4. `views/partials/admin-footer.ejs`
- **Langkah Kerja:**
  1. Tambahkan namespace `admin_bulk` secara simetris 1:1 di `locales/id.json` dan `locales/en.json` dengan seluruh kunci teks UI, aria-label, konfirmasi SweetAlert2, peringatan item terkait kategori, dan pesan sukses/error.
  2. Buat `public/js/admin-bulk-delete.js` (CSP-safe, tanpa inline handler, event delegation pada kontainer `[data-bulk-table]`):
     - Mengelola checkbox header `[data-bulk-select-all]` dalam 3 state (`unchecked`, `checked`, `indeterminate`) hanya terhadap baris yang **aktif tampil** (`row.style.display !== 'none' && !row.hidden && !row.querySelector('td[colspan]')`).
     - Menambahkan/menghapus class `.is-bulk-selected` pada `<tr>` terpilih dan menampilkan/menyembunyikan tombol kontekstual `[data-bulk-delete-btn]` (memakai `.adm-bulk-hidden` saat 0 terpilih, tampil dengan counter saat >= 1 terpilih sesuai Keputusan 4a).
     - Mendengarkan event `admin:table-filtered` dan `admin:products-loaded` untuk **mereset seluruh centang & checkbox header secara otomatis** (sesuai Keputusan 3a).
     - Saat tombol bulk delete diklik: mengumpulkan ID terpilih dari baris aktif tampil, menjumlahkan `data-bulk-related-count` bila ada dan menyertakan kalimat peringatan item terkait (sesuai Keputusan 5a), menampilkan `window.showAdminConfirm({ title, text, isDanger: true })`, mengirim `fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ ids }) })` (header `X-CSRF-Token` otomatis disuntik wrapper `fetch` di `admin.js`), mengunci tombol dengan `.is-loading`, lalu menampilkan `window.adminToast('success'|'error', ...)` dan memuat ulang tabel (`window.reloadAdminProductsAfterBulkDelete` pada mode `fetch` atau `window.location.reload()` pada mode `reload`).
  3. Muat `<script src="/js/admin-bulk-delete.js?v=1.0" defer></script>` di `views/partials/admin-footer.ejs`.
- **Kontrak Data Eksplisit:**
  - Key i18n `admin_bulk.*` (wajib ada di ID & EN): `col_select`, `select_all`, `select_row`, `delete_selected`, `confirm_title`, `confirm_products`, `confirm_product_categories`, `confirm_posts`, `confirm_post_categories`, `confirm_related_products`, `confirm_related_posts`, `success_deleted`, `error_empty`, `error_failed`.
  - Atribut HTML: `data-bulk-table`, `data-bulk-endpoint`, `data-bulk-mode` (`fetch` | `reload`), `data-bulk-select-all`, `data-bulk-id`, `data-bulk-related-count`, `data-bulk-delete-btn`, `data-label-template`, `data-confirm-title`, `data-confirm-message`, `data-confirm-related-template`.
  - Custom Events: `admin:table-filtered`, `admin:products-loaded`, API global `window.AdminBulkSelect.reset(container)` & `window.AdminBulkSelect.sync(container)`.
- **Referensi Pola:** `window.showAdminConfirm` & `adminToast` di `public/js/admin.js`, pola modul di `public/js/pagination.js`.
- **Batasan Negatif:** Dilarang menyentuh file backend/CSS/EJS halaman tabel di task ini. Dilarang memakai `innerHTML` dengan data mentah (anti-XSS, gunakan `textContent`).
- **Skill Relevan:** `frontend-ui-engineering`, `antislop-human`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && npm run lint:views && npm run lint:i18n
  ```

---

### `T-463` `[Tier: Argon Medium]`: Integrasi Markup Bulk Delete & Sinkronisasi Paginasi Katalog Produk & Kategori Produk
- **File Terdampak (4 file):**
  1. `views/admin/products/index.ejs`
  2. `views/admin/products/partials/table-rows.ejs`
  3. `views/admin/product-categories/index.ejs`
  4. `public/js/admin-products.js`
- **Langkah Kerja:**
  1. Pada `views/admin/products/index.ejs`: tambahkan atribut `data-bulk-table="products" data-bulk-endpoint="/admin/products/bulk-delete" data-bulk-mode="fetch"` pada `.table-card`, sisipkan tombol kontekstual `.adm-btn.adm-btn-danger.adm-btn-sm.adm-bulk-delete-btn.adm-bulk-hidden` di `.table-toolbar` (muncul saat >= 1 item dipilih sesuai Keputusan 4a), dan tambahkan `th.adm-bulk-col` dengan checkbox "Pilih Semua" sebagai kolom paling kiri `<thead>`.
  2. Pada `views/admin/products/partials/table-rows.ejs`: tambahkan `td.adm-bulk-col` berisi checkbox baris (`data-bulk-id="<%= p.id %>"`, `aria-label` deskriptif dengan nama produk) di kolom paling kiri tiap `<tr>`, dan perbarui state kosong dari `colspan="5"` menjadi `colspan="6"`.
  3. Pada `views/admin/product-categories/index.ejs`: tambahkan atribut `data-bulk-table="product-categories" data-bulk-endpoint="/admin/product-categories/bulk-delete" data-bulk-mode="reload"`, tombol bulk delete kontekstual (`.adm-bulk-hidden`) di `.table-toolbar`, kolom checkbox paling kiri pada `<thead>` & `<tbody>` (menyertakan `data-bulk-related-count="<%= cat.product_count || 0 %>"`), dan perbarui state kosong dari `colspan="7"` menjadi `colspan="8"`.
  4. Pada `public/js/admin-products.js`: pancarkan `document.dispatchEvent(new CustomEvent('admin:products-loaded'))` setelah `tbody.innerHTML = data.rowsHtml` di `loadProducts()` (mereset seleksi otomatis sesuai Keputusan 3a), serta sediakan fungsi `window.reloadAdminProductsAfterBulkDelete()` yang memuat ulang URL aktif saat ini via `loadProducts()` (sehingga logika mundur halaman otomatis ke `prevPage` saat halaman ujung kosong ikut bekerja).
- **Kontrak Data Eksplisit:**
  - Menggunakan key `t('admin_bulk.*')` pada seluruh label/aria-label/konfirmasi.
  - Zero inline `style="..."`, zero inline event handler (`onclick`/`onchange`).
- **Referensi Pola:** `views/admin/products/index.ejs`, `views/admin/products/partials/table-rows.ejs`, `loadProducts` di `public/js/admin-products.js`.
- **Batasan Negatif:** Dilarang mengubah layout tombol hapus satuan per baris, dilarang menyentuh modul berita/post atau file CSS di task ini.
- **Skill Relevan:** `frontend-ui-engineering`, `antislop-human`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && npm run lint:views && npm run lint:i18n
  ```

---

### `T-464` `[Tier: Argon Medium]`: Integrasi Markup Bulk Delete & Sinkronisasi Live Search Berita & Kategori Berita
- **File Terdampak (3 file):**
  1. `views/admin/posts/index.ejs`
  2. `views/admin/post-categories/index.ejs`
  3. `public/js/admin.js`
- **Langkah Kerja:**
  1. Pada `views/admin/posts/index.ejs`: tambahkan `data-bulk-table="posts" data-bulk-endpoint="/admin/posts/bulk-delete" data-bulk-mode="reload"` pada `.table-card`, bungkus sisi kanan `.table-toolbar` bersama tombol kontekstual `.adm-btn.adm-btn-danger.adm-btn-sm.adm-bulk-delete-btn.adm-bulk-hidden` dan `#liveSearchInput` secara rapi anti-tabrakan, tambahkan kolom checkbox paling kiri pada `<thead>` & `<tbody>` (`data-bulk-id="<%= post.id %>"`), serta perbarui state kosong dari `colspan="7"` menjadi `colspan="8"`.
  2. Pada `views/admin/post-categories/index.ejs`: tambahkan `data-bulk-table="post-categories" data-bulk-endpoint="/admin/post-categories/bulk-delete" data-bulk-mode="reload"` pada `.table-card`, tambahkan tombol kontekstual `.adm-btn.adm-btn-danger.adm-btn-sm.adm-bulk-delete-btn.adm-bulk-hidden` di `.table-toolbar`, tambahkan kolom checkbox paling kiri pada `<thead>` & `<tbody>` (`data-bulk-id="<%= cat.id %>"` + `data-bulk-related-count="<%= cat.post_count || 0 %>"`), serta perbarui state kosong dari `colspan="7"` menjadi `colspan="8"`.
  3. Pada `public/js/admin.js`: di akhir `filterRows()`, pancarkan `document.dispatchEvent(new CustomEvent('admin:table-filtered'))` agar perubahan pencarian `#liveSearchInput` langsung mereset seleksi otomatis dan menyinkronkan checkbox header di `admin-bulk-delete.js` (sesuai Keputusan 3a).
- **Kontrak Data Eksplisit:**
  - Menggunakan key `t('admin_bulk.*')` pada seluruh label/aria-label/konfirmasi.
  - Zero inline `style="..."` dan zero inline handler.
- **Referensi Pola:** `filterRows()` di `public/js/admin.js`, `views/admin/posts/index.ejs`, `views/admin/post-categories/index.ejs`.
- **Batasan Negatif:** Dilarang mengubah perilaku modal, sidebar, atau SweetAlert2 interceptor existing di `public/js/admin.js`; dilarang menyentuh halaman publik `/news`.
- **Skill Relevan:** `frontend-ui-engineering`, `antislop-human`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && npm run lint:views && npm run lint:i18n
  ```

---

### `T-465` `[Tier: Argon Medium]`: Styling CSS Bulk Checkbox, Baris Terpilih & Toolbar Anti-Overflow Responsif
- **File Terdampak (3 file):**
  1. `public/css/admin/tables-badges.css`
  2. `public/css/admin/page-catalog.css`
  3. `public/css/admin/responsive-viewport.css`
- **Langkah Kerja:**
  1. Tambahkan aturan komponen `.adm-bulk-*` di `public/css/admin/tables-badges.css`:
     - `.adm-bulk-col` (`width: 40px; min-width: 40px; text-align: center; padding-left: 12px; padding-right: 6px;`),
     - `.adm-bulk-check` (native `accent-color: var(--primary)`, ukuran visual `17px x 17px`, `cursor: pointer`, border kontras >= 3:1 via `var(--text-muted)`, `:focus-visible` dengan `outline: 2px solid var(--primary)` + `var(--focus-ring)`),
     - `tr.is-bulk-selected` (`background-color: var(--primary-subtle)`),
     - `.adm-bulk-toolbar-group` (kontainer flex aman di `.table-toolbar`), `.adm-bulk-delete-btn`, `.adm-bulk-hidden` (`display: none`).
  2. Perbaiki tata letak `.table-toolbar` dan `.adm-prod-toolbar-left` di `public/css/admin/page-catalog.css` dan `tables-badges.css` agar judul, dropdown kategori, tab filter *growing underline*, kotak pencarian, dan tombol bulk delete kontekstual selalu reflow rapi (`flex-wrap: wrap`, `min-width: 0`, `gap: 8px-10px`) tanpa saling menimpa teks pada `1024px`, `1280px`, `1440px`, dan zoom `125%`.
  3. Tambahkan aturan responsif pada `public/css/admin/responsive-viewport.css`: target sentuh checkbox wrapper minimal `44x44px` di `@media (pointer: coarse), (max-width: 768px)`, tombol bulk delete full-width/rapi pada `<= 480px`, serta `overflow-x: auto` terkontrol pada `.table-scroll-wrapper` untuk tabel berkolom checkbox di viewport sempit (`320px-768px`) agar **0 page-level horizontal overflow**.
- **Kontrak Data / Class CSS:**
  - Prefix unik `.adm-bulk-*` (`adm-bulk-col`, `adm-bulk-check`, `adm-bulk-check-wrap`, `adm-bulk-toolbar-group`, `adm-bulk-delete-btn`, `adm-bulk-hidden`, `is-bulk-selected`).
  - Zero raw hex di seluruh berkas, 0 duplikat selector, batas <= 600 baris per berkas (cek total baris `tables-badges.css` <= 600).
- **Referensi Pola:** `public/css/admin/tables-badges.css`, `public/css/admin/buttons.css`, `public/css/admin/pagination.css`.
- **Batasan Negatif:** Dilarang menyentuh `public/css/admin/tokens.css`, CSS publik, atau menambah berkas CSS ke-22 kecuali `tables-badges.css` terancam melewati 600 baris (jika terjadi, berhenti dan laporkan ke Azis).
- **Skill Relevan:** `antislop-ui`, `antislop-layoutmobile`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && npm run lint:views && node --test tests/test-admin-css-modular.js
  ```

---

### `T-466` `[Tier: Argon Medium]`: Unit & HTTP Integration Test Bulk Delete (4 Service, Helper, RBAC & CSRF)
- **File Terdampak (2 file):**
  1. `tests/test-admin-bulk-delete-services.js` *(baru)*
  2. `tests/test-admin-bulk-delete-http.js` *(baru)*
- **Langkah Kerja:**
  1. Buat unit test `tests/test-admin-bulk-delete-services.js` (`node:test` + dependency injection `deps`) yang memverifikasi:
     - `parseBulkIds`: tolak array kosong, non-array, angka `0`/negatif/desimal/string huruf, duplikat di-deduplikasi, tolak > 100 ID.
     - `bulkDeleteAdminProducts`: hapus batch, cleanup `storage.delete` tiap `image_url`, panggil `invalidateSitemapCache()` 1x, handle `not_found` & parsial `skippedIds`.
     - `bulkDeleteProductCategories` & `bulkDeletePostCategories`: validasi, transaksi `category_id = NULL` + hapus batch (Keputusan 5a), `invalidateSitemapCache()`, dan perhitungan `affectedItemsCount`.
     - `bulkDeleteAdminPosts`: hapus batch + `slugRedirectModel.deleteByEntityIds('post', ...)` + cleanup cover storage + `invalidateSitemapCache()`.
  2. Buat tes integrasi HTTP `tests/test-admin-bulk-delete-http.js` yang memverifikasi:
     - Request tanpa CSRF ditolak `403`.
     - Role `editor` ditolak `403` pada `/admin/products/bulk-delete` & `/admin/product-categories/bulk-delete`, tetapi diizinkan pada `/admin/posts/bulk-delete` & `/admin/post-categories/bulk-delete`.
     - Payload invalid (`[]`, `['abc']`, `>100` ID) ditolak `400`.
- **Kontrak Data Eksplisit:** Semua assertion memeriksa status HTTP (`200`/`400`/`403`/`404`) dan struktur body `{ success, deletedCount, requestedCount, skippedIds, message }` (serta `affectedItemsCount` untuk kategori).
- **Referensi Pola:** `tests/test-admin-batch2-services.js`, `tests/test-admin-batch3-services.js`, `tests/test-admin-http.js`.
- **Batasan Negatif:** Dilarang memodifikasi data produksi/seed permanen tanpa cleanup; dilarang men-skip test.
- **Skill Relevan:** `test-driven-development`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && node --test tests/test-admin-bulk-delete-services.js tests/test-admin-bulk-delete-http.js
  ```

---

### `T-467` `[Tier: Argon Medium]`: QA E2E & Visual Playwright (Tabs Growing Underline + Bulk Delete 4 Modul + Regresi 16 Rute Admin)
- **File Terdampak (1 file):**
  1. `tests/test-admin-tabs-bulk-delete-qa.js` *(baru)*
- **Langkah Kerja:**
  1. Buat skrip QA Playwright `tests/test-admin-tabs-bulk-delete-qa.js` yang memverifikasi:
     - **Tabs Growing Underline (semua 3 jenis tab sesuai 1a & 2a):** warna underline pada tab aktif memakai warna token `--primary` (bukan biru), proporsi font >= 13px, `transform-origin: center` & `::after` aktif saat pindah tab di `/admin/products`, `/admin/posts`, `/admin/about`, `/admin/home-content`, dan modal Media Picker (`#universalMediaPickerModal`), `prefers-reduced-motion: reduce` menonaktifkan transisi, serta mobile `320px-768px` target sentuh >= 44px dan tidak memotong label.
     - **Bulk Delete 4 Modul (data dummy `QA-BULK-*` dibersihkan pada `finally`):**
       - Tombol bulk delete tersembunyi saat 0 item terpilih dan muncul dengan counter saat >= 1 item dipilih (Keputusan 4a).
       - Checkbox header 3 state (`unchecked` -> pilih 1 baris = `indeterminate` -> pilih semua = `checked`).
       - Sinkronisasi filter `#liveSearchInput` di `/admin/posts` (seleksi di-reset saat pencarian berubah & baris tersembunyi tidak ikut dipilih/terhapus sesuai Keputusan 3a).
       - Sinkronisasi filter kategori/status & paginasi Fetch `.pgn-*` di `/admin/products` (seleksi di-reset saat halaman/filter berubah, dan mundur halaman otomatis saat halaman ujung kosong pasca bulk delete).
       - Konfirmasi SweetAlert2 tampil dengan jumlah item akurat (plus peringatan produk/artikel terdampak pada kategori sesuai Keputusan 5a); batal tidak menghapus data; konfirmasi menghapus data & menampilkan toast sukses.
     - **Anti-Overflow & Zero Collision:** cek bounding-box toolbar (0 elemen saling tumpang tindih), 0 console error, 0 horizontal page overflow pada `320px`, `375px`, `768px`, `1024px`, `1280px`, `1440px`, dan zoom `125%`.
  2. Jalankan juga suite regresi CSS modular & visual 16 rute admin yang sudah ada (`tests/test-admin-css-modular.js`, `tests/test-admin-css-visual-qa.js`) + gerbang lint penuh.
- **Kontrak Data Eksplisit:** Setiap record dummy yang dibuat saat E2E wajib memakai prefix `QA-BULK-` dan dibersihkan total pada blok `finally`.
- **Referensi Pola:** `tests/test-admin-css-visual-qa.js`, `tests/test-admin-css-modular.js`.
- **Batasan Negatif:** Dilarang menyentuh kode aplikasi kecuali melaporkan bug bila ditemukan; dilarang meninggalkan data dummy di database lokal.
- **Skill Relevan:** `browser-testing-with-devtools`, `antislop-layoutmobile`.
- **Verifikasi Deterministik:**
  ```bash
  npm run lint && npm run lint:views && npm run lint:i18n && node --test tests/test-admin-css-modular.js && node tests/test-admin-tabs-bulk-delete-qa.js && node tests/test-admin-css-visual-qa.js
  ```

---

## 5. Dampak Ukuran Modul & Batas Arsitektur

| Berkas | Ukuran Saat Ini | Estimasi Pasca-Merge | Batas | Status & Rekomendasi |
| :--- | :---: | :---: | :---: | :--- |
| `.agents/prd/admin-ui.md` | 9.049 byte | ~9.100 byte | ~8KB | **Sudah > 8KB.** Saat Tahap Merge buat sub-modul baru `.agents/prd/admin-ui-tabs-bulk.md` (~2.5KB) untuk `FR-41` & `FR-42` lintas modul, dan tambahkan 1 baris tautan di `prd/admin-ui.md`. |
| `.agents/tech/admin-ui.md` | 7.066 byte | ~7.200 byte | ~8KB | Buat sub-modul pasangan `.agents/tech/admin-ui-tabs-bulk.md` (~3KB) agar `tech/admin-ui.md` tetap < 8KB. |
| `.agents/tech/admin-ui-css.md` | 7.751 byte | ~7.850 byte | ~8KB | Aman (update 2 baris peta `tables-badges.css` & `tabs-toggles.css`). |
| `.agents/prd/admin-products-rfq.md` | 7.682 byte | ~7.950 byte | ~8KB | Aman (tambahkan referensi ringkas `FR-42` ke `prd/admin-ui-tabs-bulk.md`). |
| `.agents/tech/admin-products-rfq.md` | 7.526 byte | ~7.950 byte | ~8KB | Aman (tambahkan endpoint bulk delete + tautan kontrak di `tech/admin-ui-tabs-bulk.md`). |
| `.agents/prd/admin-cms.md` | 6.867 byte | ~7.200 byte | ~8KB | Aman (tambahkan referensi ringkas `FR-42`). |
| `.agents/tech/admin-cms.md` | 8.049 byte | ~7.950 byte | ~8KB | Padatkan 2 baris keterangan tabel rute saat menambah endpoint bulk delete agar kembali <= 8KB. |
| `.agents/tech/news.md` | 7.827 byte | ~7.980 byte | ~8KB | Aman (tambahkan 2 baris rute bulk delete berita/kategori). |
| `.agents/INDEX.md` | 51 baris | 52 baris | 60 baris | Aman (+1 baris untuk modul `Admin UI: Tabs & Bulk Actions`). |
| `public/css/admin/tabs-toggles.css` | 312 baris | ~405 baris | <= 600 baris | Aman (menerima `.filter-tabs-wrap`/`.tab-btn` + revamp *growing underline*). |
| `public/css/admin/tables-badges.css` | 525 baris | ~575 baris | <= 600 baris | Aman (-30 baris tab dipindah + ~80 baris `.adm-bulk-*`). Jika saat implementasi mendekati 595 baris, pecah `.adm-bulk-*` ke berkas baru `public/css/admin/bulk-actions.css`. |
| `public/css/admin/page-catalog.css` | 412 baris | ~437 baris | <= 600 baris | Aman. |
| `public/css/admin/responsive-viewport.css` | 306 baris | ~336 baris | <= 600 baris | Aman. |
| `public/css/admin/media-picker.css` | 379 baris | ~404 baris | <= 600 baris | Aman (termasuk revamp `.media-picker-tabs` sesuai 1a). |

---

## 6. Rencana CLOSE (Setelah `T-457` s/d `T-467` `[DONE]`)

1. Jalankan gerbang kualitas penuh: `npm run lint`, `npm run lint:views`, `npm run lint:i18n`, `node --test tests/test-admin-css-modular.js tests/test-admin-bulk-delete-services.js tests/test-admin-bulk-delete-http.js`, `node tests/test-admin-tabs-bulk-delete-qa.js`, dan `node tests/test-admin-css-visual-qa.js`.
2. Hapus penanda `[PENDING T-xxx]` dan perbarui stempel tanggal verifikasi pada:
   - `.agents/prd/admin-ui-tabs-bulk.md`, `.agents/tech/admin-ui-tabs-bulk.md`
   - `.agents/prd/admin-ui.md`, `.agents/tech/admin-ui.md`, `.agents/tech/admin-ui-css.md`
   - `.agents/prd/admin-products-rfq.md`, `.agents/tech/admin-products-rfq.md`
   - `.agents/prd/admin-cms.md`, `.agents/tech/admin-cms.md`, `.agents/tech/news.md`
   - `.agents/INDEX.md`
3. Pindahkan `changes/2026-11-26_admin-tabs-revamp-bulk-delete.md` ke `.agents/archive/` dan arsipkan `T-457`..`T-467` dari `.agents/3-TASKS.md` ke `.agents/archive/tasks-index-full.md`.
4. Draf 1 baris `CHANGELOG.md`:
   ```markdown
   | 2026-11-26 | Revamp seluruh tabs dashboard admin (Growing Underline tema hijau Euodoo) & fitur Bulk Delete 4 modul admin (Produk, Kategori Produk, Berita, Kategori Berita) | T-457..T-467 |
   ```
