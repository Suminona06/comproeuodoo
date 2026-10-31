# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 1 Task (T-254)
- **Total Task Selesai:** 253 Task (T-01 s/d T-253)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-255**.

---

## Task Aktif / Terbuka (Open Tasks)

### [x] T-250: Seragamkan kartu "Produk Terkait Lainnya" (`.pd-related`) di Detail Produk dengan partial kartu katalog
- **Modul Spec:** `prd/products.md` (FR-24), `tech/products-detail.md`, `tech/products.md`
- **Deskripsi:** Mengganti markup kartu `.bento-*` pada section `.pd-related` di `views/public/product-detail.ejs` dengan memanggil partial `views/public/partials/product-card-fragment.ejs` di dalam grid `<div class="plp-grid pd-related-grid">`. Memperbarui query `relatedProducts` di `controllers/public/productController.js` dan `models/productModel.js` agar memfilter `is_active = 1` (`activeOnly: true`), mengambil `limit: 5`, lalu memotong `.slice(0, 4)` sehingga tampil maksimal **4 kartu dalam 4 kolom** di desktop dan **2 kolom** di mobile (`>= 360px`, 1 kolom di `< 360px`) sesuai grid katalog (Keputusan #3). Memperbaiki bug bahasa (badge kategori & fallback deskripsi hardcode ID) secara otomatis melalui reuse partial katalog, sambil mempertahankan header section (kicker, judul, tombol "Lihat Kategori").
- **Acceptance Criteria:**
  1. Section `.pd-related` me-reuse `views/public/partials/product-card-fragment.ejs` tanpa menduplikasi markup kartu `.plp-card`.
  2. Controller `productController.detail` mengambil `limit: 5` produk aktif (`status: 'published'`, `is_active = 1`) di kategori yang sama, mengeluarkan produk saat ini, dan memotong `.slice(0, 4)` untuk menampilkan maksimal 4 kartu.
  3. Grid `.plp-grid.pd-related-grid` menampilkan 4 kolom di desktop (`>= 1024px`), 2 kolom di tablet/mobile (`360px - 1023px`), dan 1 kolom di `< 360px`, dengan tampilan kartu (rasio gambar 1:1, permukaan `var(--color-surface-alt)`, tipografi nama produk 2 baris, tombol pill penuh `var(--color-primary)`, state `:hover` di dalam `@media (hover: hover)`, dan `:focus-visible`) 100% identik dengan halaman katalog `/products`.
  4. Teks nama produk dan tombol CTA mengikuti bahasa aktif (`ID` dan `EN`) tanpa teks Bahasa Indonesia yang bocor saat mode `EN`.
  5. Header section `.pd-related-header` (kicker, judul, tombol "Lihat Kategori") tetap tampil dan berfungsi.
  6. Aturan CSS `.bento-card`, `.bento-col-6`, `.bento-split*`, `.bento-badge*`, `.bento-card-*`, `.bento-specs`, `.bento-spec-tag`, `.bento-meta-badge`, dan `.pd-related .bento-badge` yang sudah tidak terpakai dihapus dari `public/css/components.css`; sedangkan `.bento-grid` dasar dan `.sec-gallery .bento-*` (milik halaman Tentang Kami) tetap utuh.
- **File Terdampak:** `controllers/public/productController.js`, `models/productModel.js`, `views/public/product-detail.ejs`, `public/css/components.css`
- **Skill:** `Impeccable polish` + `Impeccable adapt`
- **Verifikasi:** Buka `/products/<slug>` dalam bahasa ID dan EN di lebar `320px`, `375px`, `768px`, `1024px`, dan `1440px`; pastikan maksimal 4 kartu tampil dalam 4 kolom di desktop dan 2 kolom di `375px`; bandingkan visual `.plp-card` di `.pd-related` dengan `/products`; pastikan Bento Gallery di `/about` dan seluruh section Homepage (`/`) tidak berubah.

---

### [x] T-251: Sembunyikan tab Deskripsi, tampilkan Tabel Ukuran langsung dengan judul section biasa, & perkuat SEO meta description
- **Modul Spec:** `prd/products.md` (FR-24), `tech/products-detail.md`
- **Deskripsi:** Menghapus markup tab `Deskripsi` (`#pdTabDesc`, `#pdPanelDesc`) dan sistem `role="tablist"` dari `views/public/product-detail.ejs`. Membungkus seluruh section tabel ukuran dengan kondisi `<% if (hasSizeTable) { %>` sehingga bila produk tidak memiliki tabel ukuran, section dihilangkan seluruhnya (Keputusan #4). Saat produk memiliki tabel ukuran, tampilkan judul section biasa (`<h2 class="pd-size-heading">Tabel Ukuran</h2>` / `"Size Chart"`) tanpa tab (Keputusan #5) dan tampilkan `.pd-table-wrap` secara langsung tanpa atribut `hidden`. Menghapus kode JS pengendali tab (`[data-tabs]`) yang jadi mati di `public/js/product-detail.js`. Memastikan `controllers/public/productController.js` mengisi `res.locals.seo.description` dan `res.locals.seo.ogDescription` menggunakan rantai fallback `meta_description_<lang>` -> `short_description_<lang>` -> plain text `description_<lang>` agar SEO halaman produk tidak kosong. Membiarkan form Admin Produk apa adanya tanpa perubahan (Keputusan #6).
- **Acceptance Criteria:**
  1. Deskripsi panjang (`description_id` / `description_en`) tidak lagi tampil di halaman publik Detail Produk, sementara kolom database dan form Admin Produk (`views/admin/products/create.ejs` & `edit.ejs`) dibiarkan tetap apa adanya (Keputusan #6).
  2. Pada produk yang memiliki `size_table` (`hasSizeTable === true`), section Tabel Ukuran tampil langsung tanpa klik, diawali judul section biasa `"Tabel Ukuran"` (ID) / `"Size Chart"` (EN) tanpa `role="tablist"` atau tombol tab (Keputusan #5).
  3. Pada produk yang **tidak** memiliki `size_table` (`hasSizeTable === false`), section ukuran tidak dirender sama sekali di DOM (Keputusan #4).
  4. Tampilan responsif mobile pada tabel ukuran (`td[data-l]` dengan label kolom di sisi kiri) tetap rapi dan terbaca pada layar `320px` dan `375px` baik dalam bahasa ID maupun EN.
  5. `public/js/product-detail.js` bersih dari listener `[data-tabs]` yang tidak terpakai dan bebas dari error console pada produk dengan maupun tanpa tabel ukuran.
  6. Tag `<meta name="description">` dan `<meta property="og:description">` pada halaman Detail Produk selalu terisi teks yang relevan (mengambil `description_id`/`description_en` yang telah dibersihkan dari tag HTML bila `meta_description` dan `short_description` kosong).
- **File Terdampak:** `views/public/product-detail.ejs`, `public/js/product-detail.js`, `public/css/components.css`, `controllers/public/productController.js`
- **Skill:** `Impeccable polish` + `antislop-code`
- **Verifikasi:** Periksa halaman produk yang memiliki `size_table` (pastikan judul section biasa tampil langsung bersama tabel) dan produk tanpa `size_table` (pastikan section hilang bersih) di mode ID dan EN (`320px` s/d `1440px`); cek `<meta name="description">` via View Source; pastikan console browser bersih dari error.

---

### [x] T-252: Bangun komponen bersama Lightbox (`.lbx-*`) berbasis PhotoSwipe v5 self-hosted dan integrasikan ke galeri Detail Produk
- **Modul Spec:** `prd/products.md` (FR-31), `tech/products-detail.md`
- **Deskripsi:** Menyimpan aset PhotoSwipe v5 (lisensi MIT) secara lokal di `public/vendor/photoswipe/` (`photoswipe.umd.min.js`, `photoswipe-lightbox.umd.min.js`, dan `photoswipe.css`) sesuai Keputusan #1, lalu membangun komponen pembungkus bersama `public/css/lightbox.css` dan `public/js/lightbox.js` dengan prefix class unik `.lbx-*`. Mengonfigurasi cara zoom di desktop menggunakan kombinasi klik/*double-click* pada foto untuk *zoom* ke titik klik + *drag* untuk geser **serta** tombol kontrol `+` / `-` pada toolbar (Keputusan #2). Mengintegrasikan lightbox pada galeri Detail Produk (`views/public/product-detail.ejs` & `public/js/product-detail.js`) di mana klik/Enter pada **gambar utama** (`#pdMainImage` / wrapper `.pd-main-media`) membuka lightbox mulai dari foto yang sedang aktif, sedangkan klik pada **thumbnail** (`.pd-thumb-btn`) tetap hanya menukar gambar utama (Keputusan #7).
- **Acceptance Criteria:**
  1. File vendor PhotoSwipe v5 di-host secara lokal di `public/vendor/photoswipe/` tanpa CDN eksternal; seluruh kustomisasi UI dan toolbar menggunakan prefix class `.lbx-*` di `public/css/lightbox.css` dengan warna berbasis token (`var(--surface-dark-deep)`, `var(--color-on-primary)`, `var(--color-primary)`, `var(--r-full)`, `var(--z-modal)`), tanpa hardcode hex dan 100% patuh CSP.
  2. Pada Detail Produk, klik atau tekan `Enter`/`Space` pada **gambar utama** (`.pd-main-media` / `#pdMainImage`) membuka lightbox pada foto yang sedang aktif dengan urutan slide mengikuti urutan `.pd-thumb-btn` (tetap berfungsi untuk produk dengan 1 foto), sedangkan klik pada **thumbnail** (`.pd-thumb-btn`) tetap hanya menukar gambar utama di halaman (Keputusan #7).
  3. Di desktop, pengguna dapat melakukan *zoom* baik dengan mengklik/*double-click* foto ke titik klik lalu *drag* untuk menggeser (*pan*), maupun dengan menekan tombol `+` (Perbesar / *Zoom in*) dan `-` (Perkecil / *Zoom out*) pada toolbar `.lbx-*` (Keputusan #2).
  4. Di perangkat sentuh (mobile/tablet), mendukung *double-tap* zoom, *pinch-to-zoom* 2 jari, *pan* saat di-zoom, dan *swipe* kiri/kanan untuk berpindah foto termasuk saat sedang di-zoom (Keputusan #1).
  5. Memenuhi aksesibilitas: kontainer menggunakan `role="dialog"` dan `aria-modal="true"`, fokus keyboard terkunci (*focus trap*) di dalam lightbox saat terbuka, tombol `Escape` menutup lightbox, fokus dikembalikan ke elemen pemicu saat ditutup, scroll `document.body` terkunci saat terbuka, menampilkan penghitung `"1 / N"` dan *caption* nama produk, serta seluruh `aria-label` tombol (Zoom In, Zoom Out, Sebelumnya, Berikutnya, Tutup) tersedia dalam bahasa ID dan EN.
  6. Animasi buka/tutup dan transisi slide hanya menggunakan `transform` dan `opacity`, mematuhi `@media (prefers-reduced-motion: reduce)` (tanpa animasi), dan efek hover dibungkus dalam `@media (hover: hover)`.
- **File Terdampak:** `public/vendor/photoswipe/photoswipe.umd.min.js`, `public/vendor/photoswipe/photoswipe-lightbox.umd.min.js`, `public/vendor/photoswipe/photoswipe.css`, `public/css/lightbox.css`, `public/js/lightbox.js`, `views/partials/head.ejs`, `views/partials/footer.ejs`, `views/public/product-detail.ejs`, `public/js/product-detail.js`, `public/css/components.css`
- **Skill:** `Impeccable animate` + `Impeccable adapt` + `Impeccable polish` + `antislop-code`
- **Verifikasi:** Uji klik thumbnail (hanya menukar gambar utama), lalu klik/tekan `Enter` pada gambar utama untuk membuka lightbox; uji zoom klik + drag, tombol `+`/`-`, panah kiri/kanan, swipe mobile, focus trap (`Tab` / `Shift+Tab`), dan `Escape` pada produk 1 foto & multi-foto (`320px` s/d `1440px`, ID & EN), serta pastikan nol error CSP di console.

---

### [x] T-253: Integrasikan komponen bersama Lightbox (`.lbx-*`) ke Bento Gallery halaman Tentang Kami
- **Modul Spec:** `prd/public-about.md` (FR-24), `tech/public-about.md`
- **Deskripsi:** Mengintegrasikan komponen bersama Lightbox `.lbx-*` (`window.EuodooLightbox` berbasis PhotoSwipe v5 lokal dari T-252, dengan kontrol zoom klik + tombol `+`/`-` sesuai Keputusan #1 dan #2) ke section Bento Gallery (`#bentoGallery`) pada `views/public/about.ejs` dan `public/js/main.js`. Menyematkan atribut `data-slide-index` global, `role="button"`, `tabindex="0"`, dan `aria-label` dwibahasa pada setiap `.abt-gal-tile` baik saat render awal (SSR) maupun saat fungsi `createSingleTile` membangun ulang DOM ketika paginasi `Prev`/`Next` diklik. Menggunakan *event delegation* pada `#bentoGalleryGrid` sehingga navigasi di dalam lightbox mencakup **seluruh** foto dari `#bentoGalleryData` (bukan hanya 6 tile halaman aktif).
- **Acceptance Criteria:**
  1. Klik atau tekan `Enter`/`Space` pada tile mana pun di Bento Gallery membuka lightbox `.lbx-*` tepat pada urutan foto tersebut di dalam keseluruhan dataset `#bentoGalleryData`.
  2. Navigasi `Prev`/`Next`, tombol panah keyboard, atau *swipe* di dalam lightbox dapat menjelajahi **seluruh** foto galeri (mis. `"3 / 12"`), tidak terbatas pada 6 foto di halaman bento yang sedang aktif.
  3. Di dalam lightbox galeri Tentang Kami, fitur *zoom* (klik pada foto + *drag* dan tombol `+`/`-` di desktop; *double-tap* dan *pinch-zoom* di perangkat sentuh) berfungsi identik dengan galeri Detail Produk (Keputusan #1 & #2).
  4. Setelah pengguna menekan tombol paginasi bento (`#bentoPrev` / `#bentoNext`), tile baru yang dirender oleh JS (`createSingleTile`) tetap dapat diklik maupun diaktifkan dengan keyboard (`Enter`/`Space`) untuk membuka lightbox pada indeks global yang benar.
  5. Lightbox menampilkan *caption* kategori (`category`) dan judul foto (`title`) dari `#bentoGalleryData` sesuai bahasa aktif (`ID` dan `EN`), serta mengembalikan fokus ke tile pemicu saat ditutup.
  6. Paginasi bento (`01 / 03`) di halaman Tentang Kami tetap berjalan mulus tanpa regresi animasi atau konflik event.
- **File Terdampak:** `views/public/about.ejs`, `public/js/main.js`, `public/css/components.css`
- **Skill:** `Impeccable animate` + `Impeccable adapt` + `Impeccable polish` + `antislop-code`
- **Verifikasi:** Buka `/about` (ID & EN), klik tile pada halaman 1 (`01 / 03`), uji tombol `+`/`-` dan zoom klik, navigasikan lightbox melewati foto ke-6 hingga foto terakhir; tutup lightbox, klik tombol pager `#bentoNext` ke halaman 2 (`02 / 03`), lalu klik/tekan `Enter` pada tile halaman 2 dan pastikan lightbox terbuka pada indeks global yang tepat.

---

### [ ] T-254: Audit regresi lintas halaman, verifikasi responsif (320px-1440px), i18n, dan kepatuhan CSP
- **Modul Spec:** `prd/products.md`, `tech/products-detail.md`, `prd/public-about.md`, `tech/public-about.md`
- **Deskripsi:** Melakukan pengujian regresi menyeluruh dan polesan akhir pada halaman Katalog Produk (`/products`), Detail Produk (`/products/:slug`), dan Tentang Kami (`/about`), memastikan seluruh Keputusan #1 s/d #7 berjalan konsisten tanpa efek samping pada komponen bersama (navbar, modal brand preview `#brandPreviewModal` di About, tombol WhatsApp/RFQ, filter katalog, dan Homepage yang dibekukan).
- **Acceptance Criteria:**
  1. Halaman Katalog (`/products`): kartu produk, filter kategori, pencarian, dan tombol "Muat Lebih Banyak" berfungsi tanpa regresi.
  2. Halaman Detail Produk (`/products/:slug`): klik thumbnail menukar gambar utama, klik gambar utama membuka lightbox dengan zoom klik + tombol `+`/`-`, Tabel Ukuran tampil langsung dengan judul section biasa (atau section hilang bila produk tanpa tabel ukuran), tombol CTA WhatsApp/RFQ bekerja, dan Produk Terkait menampilkan maksimal 4 kartu dalam 4 kolom desktop / 2 kolom mobile yang identik dengan katalog di `320px`, `375px`, `768px`, `1024px`, dan `1440px` (ID & EN).
  3. Halaman Tentang Kami (`/about`): modal pratinjau brand (`#brandPreviewModal`), paginasi Bento Gallery, dan lightbox seluruh foto `#bentoGalleryData` berjalan berdampingan tanpa konflik state atau penguncian scroll yang tertinggal.
  4. Homepage (`/`) dan form Admin Produk tidak mengalami perubahan tampilan.
  5. Nol error pada browser console dan nol pelanggaran Content Security Policy (CSP).
- **File Terdampak:** `public/css/lightbox.css`, `public/css/components.css`
- **Skill:** `Impeccable polish` + `Impeccable adapt`
- **Verifikasi:** Pengujian menyeluruh pada viewport `320px`, `375px`, `768px`, `1024px`, dan `1440px` dalam mode bahasa `ID` dan `EN`, termasuk uji navigasi keyboard penuh (`Tab`, `Enter`, `ArrowLeft`, `ArrowRight`, `Escape`).
