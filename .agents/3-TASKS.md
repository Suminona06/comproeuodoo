# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 5 Task (T-194 s/d T-198) &mdash; 2 Selesai (T-192, T-193)
- **Total Task Selesai:** 191 Task (T-01 s/d T-191) &mdash; Selesai 100%
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-192**.

---

## Task Aktif / Terbuka (Open Tasks)

### T-192: Kontrak Server, Validasi Query, Sanitasi & Endpoint Fragmen Parsial

- **Modul:** Products Catalog
- **Prioritas:** High
- **Status:** Done
- **Deskripsi:** Menambahkan parameter query URL (`category`, `search`, `sort`, `page`, `format`), validasi whitelist ketat, sanitasi string pencarian, klausul sorting dinamis di `productModel.js`, serta logika render respons parsial (`format=fragment`) di `productController.js` untuk melayani request AJAX pemuatan produk bertahap.
- **Acceptance Criteria:**
  - Query parameter divalidasi ketat (slug kategori aktif, panjang search max 100 karakter, sort whitelist, page integer positif).
  - SQL injection dicegah menggunakan parameter binding database.
  - Request dengan `format=fragment` atau header AJAX mengembalikan fragmen HTML kartu ter-escape via `views/public/partials/product-card-fragment.ejs`.
  - Tag meta `noindex, follow` aktif otomatis untuk halaman terfilter atau berhalaman `page > 1`.
- **File yang Diubah:**
  - `controllers/public/productController.js`
  - `models/productModel.js`
  - `views/public/partials/product-card-fragment.ejs` (baru)
- **Verifikasi:** Uji kueri database dengan variasi parameter `sort` dan `search`, serta uji HTTP GET `/products?format=fragment&page=2`.

### T-193: Desain Sistem Token, Prefix Isolasi `.plp-*` & Komponen Kartu Produk Potret

- **Modul:** Products Catalog
- **Prioritas:** High
- **Status:** Done
- **Deskripsi:** Merancang struktur markup dan style kartu produk potret minimalis identik referensi dengan rasio potret 9:10 (desktop) dan 1:1 (mobile 2 kolom) menggunakan `object-fit: cover` (CLS = 0), garis pemisah horizontal individual presisi selebar foto kartu (.plp-card-line, width 100%), nama produk kapital ramping (font 9px/8.5px, letter-spacing 0.06em), tombol ultra-kompak outline "Detail Produk" (tinggi 26px, font 8.5px/8px, warna teks hijau brand `var(--color-primary)`, hit-target 44px WCAG AA), serta adaptasi mobile rapi, clean, profesional tanpa overflow/clipping menggunakan namespace CSS `.plp-*`.
- **Acceptance Criteria:**
  - Menggunakan token resmi (`var(--color-border)`, `var(--color-text-main)`, `var(--color-primary)`, `var(--color-surface)`).
  - Rasio aspek gambar 9:10 di desktop dan 1:1 di mobile konsisten tanpa layout shift atau konten terpotong.
  - Garis sehabis foto produk (`.plp-card-line`) individual presisi selebar foto (width 100%) dan tidak menyambung antar kolom kartu.
  - Warna font tombol "Detail Produk" hijau brand (`var(--color-primary)`) dengan tinggi 26px.
  - Tampilan mobile 2 kolom rapi dan pas tanpa horizontal scroll leak atau teks terpotong di tepi kanan.

  - Tidak ada konflik atau perubahan terhadap class `.prod-*` di beranda.

- **File yang Diubah:**
  - `public/css/components.css`
  - `views/public/products.ejs`
  - `views/public/partials/product-card-fragment.ejs`
- **Skill:** `impeccable` ($polish)
- **Verifikasi:** Uji render kartu pada peramban, ukur kontras warna WCAG AA, dan verifikasi tampilan tanpa layout shift.

### T-194: Sidebar Navigasi Filter Kategori Dinamis & Deep Link URL

- **Modul:** Products Catalog
- **Prioritas:** High
- **Status:** Done
- **Deskripsi:** Membangun kolom kiri ("Filter By" > Kategori) yang merender seluruh kategori produk aktif secara dinamis dari database, mendukung status aktif visual, opsi "Semua Produk" dengan badge jumlah produk, dan tersinkronisasi dua arah dengan parameter URL (`?category=<slug>`) serta tombol navigasi back/forward peramban.
- **Acceptance Criteria:**
  - Seluruh kategori aktif muncul otomatis; kategori baru dari CMS langsung tampil tanpa ubah kode.
  - Deep link dari 4 panel beranda (`/products?category=<slug>`) berfungsi sempurna tanpa mengubah kode beranda.
  - Terdapat opsi "Semua Produk" untuk mereset filter kategori.
  - Sinkronisasi URL berfungsi dan dapat dibagikan (_shareable URL_).
- **File yang Diubah:**
  - `views/public/products.ejs`
  - `models/productCategoryModel.js`
  - `public/js/products.js` (baru)
- **Skill:** `impeccable` ($polish)
- **Verifikasi:** Klik tiap kategori, periksa URL dan hasil filter, navigasikan tombol back browser, dan klik link dari beranda.

### T-195: Toolbar Atas: Pencarian Debounced, Kontrol Pengurutan & Live Region Aksesibel

- **Modul:** Products Catalog
- **Prioritas:** High
- **Status:** Todo
- **Deskripsi:** Mengimplementasikan toolbar atas dengan kolom pencarian di sebelah kanan (menggantikan teks "Showing N products") dan dropdown pengurutan ("Urutkan"). Mengatur mekanisme pencarian debounced 350ms, pengumuman status hasil ke screen reader (`.sr-only`, `aria-live="polite"`), serta tampilan empty state dwibahasa.
- **Acceptance Criteria:**
  - Pencarian merespons ketikan dengan debounce 350ms tanpa reload halaman penuh.
  - Pengurutan berfungsi akurat (Terbaru default, A-Z, Z-A, Katalog) tanpa opsi harga.
  - Jumlah produk diumumkan secara aksesibel ke pembaca layar tanpa tampilan angka visual yang mengganggu toolbar.
  - Tampilan ketika produk tidak ditemukan menyajikan pesan ramah dwibahasa dan tombol reset filter.
- **File yang Diubah:**
  - `views/public/products.ejs`
  - `public/js/products.js`
  - `locales/id.json`
  - `locales/en.json`
- **Skill:** `impeccable` ($polish), `antislop-human`
- **Verifikasi:** Uji pengetikan pencarian, ubah opsi urutan, periksa DOM element `aria-live`, dan verifikasi tampilan hasil kosong.

### T-196: Tombol "Muat Lebih Banyak" (Progressive Enhancement AJAX & Transisi Halus)

- **Modul:** Products Catalog
- **Prioritas:** High
- **Status:** Todo
- **Deskripsi:** Membangun tombol "Muat Lebih Banyak" yang hanya tampil jika total produk > 9, dilengkapi tautan semantik fallback dan skrip AJAX append tanpa reload, animasi pemuatan halus, serta penanganan fokus aksesibilitas.
- **Acceptance Criteria:**
  - Tombol tampil hanya jika `totalProducts > 9` dan masih ada halaman lanjutan.
  - Klik tombol melakukan fetch fragmen produk berikutnya dan menyisipkannya ke grid tanpa refresh.
  - Kartu baru muncul dengan transisi opacity dan transform halus (menghormati `prefers-reduced-motion`).
  - Fokus keyboard dipindahkan ke kartu baru pertama dan status diumumkan ke teknologi asistif.
  - Tombol otomatis hilang saat produk terakhir telah termuat.
  - Mengubah filter kategori, pencarian, atau urutan mereset daftar ke halaman pertama.
- **File yang Diubah:**
  - `views/public/products.ejs`
  - `public/js/products.js`
  - `public/css/components.css`
- **Skill:** `impeccable` ($animate)
- **Verifikasi:** Uji muat lebih banyak hingga seluruh data habis, periksa transisi visual, perpindahan fokus keyboard, dan fallback tanpa JS.

### T-197: Tata Letak Responsif Multi-Breakpoint & Adaptasi Mobile

- **Modul:** Products Catalog
- **Prioritas:** High
- **Status:** Todo
- **Deskripsi:** Mengadaptasi seluruh tata letak halaman listing produk untuk berbagai ukuran viewport: mobile (320-480px) dengan reflow grid 2 kolom dan filter drawer offcanvas, tablet (768px), dan desktop (1024-1440px), memastikan target sentuh minimal 44px dan nihil overflow horizontal.
- **Acceptance Criteria:**
  - Layout reflow secara terencana di breakpoint mobile (2 kolom kartu), tablet, dan desktop tanpa clipping.
  - Target sentuh semua tombol dan link minimal 44 x 44 px.
  - Tidak ada scroll horizontal (overflow-x: hidden / 0 horizontal scroll).
  - Filter di mobile disajikan via drawer geser yang nyaman disentuh dan dapat ditutup via tombol silang atau tombol Escape.
- **File yang Diubah:**
  - `public/css/components.css`
  - `views/public/products.ejs`
  - `public/js/products.js`
- **Skill:** `impeccable` ($adapt), `antislop-layoutmobile`
- **Verifikasi:** Uji layout pada resolusi 320px, 375px, 425px, 768px, 1024px, dan 1440px menggunakan devtools responsif.

### T-198: Audit Aksesibilitas WCAG AA, Kepatuhan CSP & Uji Regresi Menyeluruh

- **Modul:** Products Catalog
- **Prioritas:** High
- **Status:** Todo
- **Deskripsi:** Menjalankan audit menyeluruh untuk memverifikasi kontras warna AA, navigasi keyboard (Tab, Enter, Escape), visibilitas focus ring, kepatuhan CSP (nol inline script/event handler), serta pengujian regresi untuk memastikan homepage, detail produk, dan admin CMS tetap berfungsi normal 100%.
- **Acceptance Criteria:**
  - Seluruh elemen teks dan tombol lolos kontras WCAG AA (>= 4.5:1 untuk teks, >= 3:1 untuk outline).
  - Navigasi keyboard penuh berfungsi logis dari atas hingga bawah halaman.
  - Bebas dari error console browser dan nol pelanggaran CSP Helmet.
  - Deep link beranda 4 panel, halaman detail produk (`/products/:slug`), dan CMS admin produk (`/admin/products`) terverifikasi utuh tanpa gangguan.
- **File yang Diubah:**
  - `tests/test-product-listing-redesign-qa.js` (baru)
  - `public/css/components.css`
- **Skill:** `antislop-human`, `antislop-code`
- **Verifikasi:** Eksekusi test suite otomatis `node tests/test-product-listing-redesign-qa.js` dan click-through audit manual.
