# Proposal Perubahan: Refactor Frontend Halaman Produk, Detail Produk, Berita, dan Detail Berita PT Euodoo

**Tanggal Pengajuan:** 2026-11-12  
**Status Tahap:** TAHAP 2: PROPOSAL UPDATED (Keputusan Terkunci oleh Azis, Menunggu Persetujuan Final untuk Tahap 3: MERGE KE SPEC)  
**Dokumen Terdampak:** `prd/products.md`, `tech/products.md`, `tech/products-detail.md`, `prd/news.md`, `tech/news.md`  
**Penomoran Task Resmi:** `T-318` s/d `T-322` (Melanjutkan urutan aktif `3-TASKS.md`)  
**Skill Acuan:** `antislop-code` (Clean Comment Hygiene & Zero Frontend Comments) + `antislop-ui` + `adapt` (Responsive Multi-Breakpoint) + `impeccable polish`  

---

## 1. Konteks

Empat halaman publik (`/products`, `/products/:slug`, `/news`, `/news/:slug`) direfaktor pada lapisan frontend view (EJS, CSS komponen, JS eksternal) agar 100% patuh pada `tech/conventions.md` (modularitas partial <= 100 baris, zero inline style, zero raw hex, zero inline script/handler, zero HTML comments, lokalisasi penuh via `t()`). Refaktor ini tidak mengubah rute, controller, skema database, maupun isi data CMS, serta menjaga homepage tetap dibekukan.

---

## 2. Keputusan Terkunci Azis (Tahap 2: APPROVE)

Seluruh 4 keputusan terbuka telah dijawab dan dikunci secara definitif oleh Azis pada 2026-11-12:

1. **Pemecahan Partial `products.ejs` — Hero Banner Section: Opsi b.**
   - Hero banner section dipertahankan di dalam template utama `views/public/products.ejs` (tidak dibuat file partial terpisah `hero.ejs`).
   - Seluruh inline style (`max-width: 840px`, `margin-top: 20px`) dan teks literal dwibahasa di area hero dibersihkan ke class komponen scoped `.plp-hero-content` dan `.plp-hero-cta-wrap` di `public/css/components.css` serta fungsi `t()`.
2. **Scope Refactor `product-detail.ejs` — Jumlah Partial: Opsi a (Granular 4 Partial).**
   - Template `views/public/product-detail.ejs` dipecah secara modular ke dalam 4 partial mandiri:
     1. `views/partials/products/gallery.ejs` (media galeri sticky, pemicu PhotoSwipe lightbox, zoom hint SVG, thumbnail strip).
     2. `views/partials/products/info-cta.ejs` (judul produk, deskripsi singkat, pil varian ukuran, tombol WhatsApp quote, tombol formulir RFQ).
     3. `views/partials/products/size-table.ejs` (kontainer scroll horizontal `.pd-size-scroll` dan tabel ukuran responsif scoped `data-cols`).
     4. `views/partials/products/related-section.ejs` (header seksi dan grid kartu produk katalog bersama).
3. **Penempatan Skrip Eksternal `news-detail.ejs`: Opsi a (File Baru).**
   - Dibuat file JavaScript eksternal baru terdedikasi `public/js/news-detail.js`.
   - Logika tombol salin tautan (`#copyLinkBtn`) dan notifikasi clipboard dipindahkan dari inline `<script>` ke berkas baru ini, dimuat via `<script src="/js/news-detail.js" defer></script>`.
   - File `public/js/news-filter.js` tetap fokus melayani katalog berita `/news`.
4. **Empty-State di `products.ejs`: Opsi a (Partial Terpisah).**
   - Komponen empty state pada katalog produk diekstraksi ke file partial terpisah `views/partials/products/empty-state.ejs`.
   - Seluruh inline style dan warna hex mentah dibersihkan ke class scoped `.plp-empty-*` di `public/css/components.css` menggunakan token desain.

---

## 3. Delta Spesifikasi per Modul

### A. Delta `prd/products.md`

#### Perubahan FR-07: Tata Letak Katalog Produk Publik (PLP) & Navigasi Kategori
- **Kondisi Lama:** Template `views/public/products.ejs` (242 baris) berbentuk monolitik dengan inline style, hardcoded hex, komentar HTML, dan teks publik literal tercampur logika EJS.
- **Kondisi Baru:** Template `views/public/products.ejs` mempertahankan section hero banner yang bersih di halaman induk, dan mengorkestrasi 3 partial modular di `views/partials/products/`:
  1. `views/partials/products/sidebar.ejs` (filter kategori dinamis & mobile drawer offcanvas).
  2. `views/partials/products/toolbar.ejs` (drawer trigger button, search form input debounced, dan dropdown sorting).
  3. `views/partials/products/empty-state.ejs` (tampilan pesan kosong dan tombol reset).
  Masing-masing file berukuran <= 100 baris. Seluruh elemen visual menggunakan styling berbasis token desain CSS tanpa inline style dan tanpa nilai hex langsung.

#### Perubahan FR-24: Redesain Layout Halaman Detail Produk (PDP)
- **Kondisi Lama:** Template `views/public/product-detail.ejs` (187 baris) memuat seluruh hierarki (breadcrumb, galeri sticky, info produk, varian ukuran, CTA baris, tabel ukuran responsif, dan produk terkait) dalam satu berkas monolitik dengan teks hardcoded dwibahasa.
- **Kondisi Baru:** `views/public/product-detail.ejs` menjadi orchestrator ramping (< 60 baris) mengimpor 4 partial modular di `views/partials/products/` (`gallery.ejs`, `info-cta.ejs`, `size-table.ejs`, `related-section.ejs`) masing-masing <= 100 baris. Seluruh teks antarmuka publik menggunakan fungsi lokalisasi `t('product_detail.*')` yang simetris di ID dan EN.

---

### B. Delta `tech/products.md`

#### Perubahan Bagian 4.C: Isolasi Namespace CSS `.plp-*` & Desain Sistem
- **Kondisi Lama:** Ditemukan 6 kemunculan `style="..."` inline (pada hero max-width, cta margin-top, wrapper load more `display: none`, dan empty state wrapper/heading/desc/btn) serta kode warna hex mentah (`#ffffff`, `#e2e8f0`, `#0f172a`, `#64748b`) di `views/public/products.ejs`. Tersisa 10 komentar HTML `<!-- ... -->`. Teks dwibahasa menggunakan percabangan literal `lang === 'en' ? ... : ...`.
- **Kondisi Baru:**
  - `views/public/products.ejs` direfaktor menjadi orchestrator ramping (~50-60 baris dengan hero banner bersih di tempat).
  - Seluruh inline style dan warna hex mentah diekstraksi ke class komponen berprefix `.plp-*` di `public/css/components.css` menggunakan token desain:
    - Wrapper & konten hero: `.plp-hero-content` (`max-width: 840px`), `.plp-hero-cta-wrap` (`margin-top: var(--space-4, 20px)`).
    - Toggle tampilan tombol load more: menggunakan class semantik `.is-hidden` / `.plp-d-none` tanpa atribut `style="display: none;"`.
    - Empty state (`views/partials/products/empty-state.ejs`): `.plp-empty-state` (latar `var(--color-surface)`, border `1px solid var(--color-border)`, padding spasi token), `.plp-empty-title` (warna `var(--color-text-main)`), `.plp-empty-desc` (warna `var(--color-text-variant)`), dan `.plp-empty-reset-btn`.
  - Seluruh komentar HTML `<!-- ... -->` dihapus tuntas.
  - Seluruh teks antarmuka publik memakai helper `t('products.*')` terpusat di `locales/id.json` dan `locales/en.json`.

---

### C. Delta `tech/products-detail.md`

#### Perubahan Bagian 5: Tata Letak Grid 5:6 & Namespace CSS `.pd-*`
- **Kondisi Lama:** `views/public/product-detail.ejs` (187 baris) mengelola markup breadcrumb, galeri, pill varian, tombol WhatsApp/RFQ, tabel ukuran dinamis, dan grid produk terkait dalam satu berkas monolitik. Teks label tombol, breadcrumb, dan varian masih berupa perbandingan literal `lang === 'en'`.
- **Kondisi Baru:**
  - `views/public/product-detail.ejs` dipecah menjadi file ramping (< 60 baris) yang meng-include 4 partial di `views/partials/products/`:
    1. `views/partials/products/gallery.ejs`: markup media galeri utama sticky, trigger PhotoSwipe lightbox bersama (`.lbx-*`), zoom hint SVG, dan deretan thumbnail.
    2. `views/partials/products/info-cta.ejs`: judul produk, deskripsi singkat, pil varian ukuran (`.pd-pill`), tombol WhatsApp quote (`.pd-btn-wa`), dan tombol formulir RFQ (`.pd-btn-outline`).
    3. `views/partials/products/size-table.ejs`: kontainer scroll horizontal `.pd-size-scroll` dan tabel ukuran responsif berskup kolom `data-cols` (hanya dirender bila `hasSizeTable === true`).
    4. `views/partials/products/related-section.ejs`: header seksi produk terkait dan grid kartu katalog bersama (`product-card-fragment.ejs`).
  - Seluruh teks antarmuka publik menggunakan fungsi lokalisasi `t('product_detail.*')` yang simetris di ID dan EN.

---

### D. Delta `prd/news.md`

#### Perubahan FR-12: Tampilan Halaman News Publik & Detail Artikel
- **Kondisi Lama:**
  - Area empty state direktori artikel di `/news` memuat teks deskripsi dan tombol reset secara hardcoded dengan ternary `currentLangCode === 'en'`.
  - Halaman detail artikel `/news/:slug` memuat tag inline `<script>` untuk menyalin URL ke clipboard dan class ganda `nwd-prose article-prose`.
- **Kondisi Baru:**
  - Area empty state di `/news` menggunakan kunci lokalisasi `t('news.empty_desc')` dan `t('news.empty_reset')`.
  - Halaman detail artikel `/news/:slug` 100% bebas dari tag `<script>` inline; seluruh interaksi interaktif dikelola oleh modul JS eksternal baru `public/js/news-detail.js`.
  - Class ganda disederhanakan menjadi satu class semantik `.nwd-prose`.

---

### E. Delta `tech/news.md`

#### Perubahan Bagian 6 & 7: Tata Letak Detail Artikel & Skrip Publik Berita
- **Kondisi Lama:**
  - `views/public/news.ejs` memuat teks hardcoded pada seksi empty state direktori berita (L131 & L134).
  - `views/public/news-detail.ejs` memiliki inline `<script>` (L123-137) yang menyematkan event listener tombol salin tautan `#copyLinkBtn` dengan pemanggilan `alert()`, class ganda `.nwd-prose.article-prose`, serta teks hardcoded literal pada breadcrumb, atribusi editorial redaksi, share label, empty prose, dan alert copy link.
  - Terdapat duplikasi styling `.article-prose` (L5169-5265 di `components.css`) yang memuat kode warna hex mentah (`#2d3748`, `#071f17`, `#00755a`, `#f8fafc`, `#f1f5f9`) di samping `.nwd-prose` (L8443 di `components.css`).
- **Kondisi Baru:**
  - Teks empty state `views/public/news.ejs` menggunakan `t('news.empty_desc')` dan `t('news.empty_reset')`.
  - Tag `<script>` inline pada `views/public/news-detail.ejs` dihapus tuntas. Logika penyalinan tautan ke clipboard dipindahkan ke berkas eksternal baru `public/js/news-detail.js` (dimuat via `<script src="/js/news-detail.js" defer></script>`), terikat via `addEventListener`, ramah CSP tanpa `unsafe-inline`.
  - Class ganda disederhanakan menjadi `<div class="nwd-prose">`.
  - Seluruh aturan CSS anak dari `.article-prose` (`a`, `table`, `th`, `td`, `code`, `pre`, `ul`, `ol`, `li`, `h4`) dimigrasikan dan diintegrasikan ke `.nwd-prose` di `public/css/components.css` dengan token resmi (`var(--color-text-main)`, `var(--color-primary)`, `var(--color-border)`, `var(--color-surface-container)`, dll.), mengeliminasi selektor `.article-prose` lama dan warna hex mentah.
  - Seluruh teks statis di `news-detail.ejs` dikonversi ke `t('news_detail.*')` yang terdaftar lengkap di `locales/id.json` dan `locales/en.json`.

---

## 4. Rencana Task Implementasi

Penomoran task melanjutkan urutan aktif dari `3-TASKS.md` (mulai dari **T-318**):

---

### [T-318] [Refactor Frontend] Ekstraksi Partial Modular & Pembersihan `views/public/products.ejs`
*(diperbarui sesuai jawaban Keputusan 1 dan Keputusan 4)*
- **Deskripsi:** Memecah `views/public/products.ejs` (242 baris) ke dalam partial modular di `views/partials/products/` (`sidebar.ejs`, `toolbar.ejs`, dan `empty-state.ejs`), sedangkan hero banner section tetap dipertahankan di file utama `products.ejs`. Menghapus seluruh 10 komentar HTML `<!-- ... -->`. Membersihkan 6 atribut `style="..."` inline dan 4 warna hex mentah (`#ffffff`, `#e2e8f0`, `#0f172a`, `#64748b`) ke dalam class scoped baru berprefix `.plp-*` di `public/css/components.css` (`.plp-hero-content`, `.plp-hero-cta-wrap`, `.plp-more-wrap.is-hidden`, `.plp-empty-state`, `.plp-empty-title`, `.plp-empty-desc`, `.plp-empty-reset-btn`) menggunakan token desain CSS resmi. Mengonversi seluruh teks literal antarmuka ke helper lokalisasi `t('products.*')` dan mendaftarkan kuncinya di `locales/id.json` serta `locales/en.json`.
- **Acceptance Criteria:**
  - Template utama `views/public/products.ejs` menjadi thin page ramping (~50-60 baris EJS) dan seluruh berkas partial baru di `views/partials/products/` berukuran <= 100 baris.
  - Zero inline `style="..."`, zero raw hex, dan zero komentar HTML `<!-- ... -->` pada berkas terkait.
  - Seluruh teks statis antarmuka katalog menggunakan fungsi `t('products.*')` terdaftar simetris di ID dan EN.
  - `npm run lint:views views/public/products.ejs views/partials/products/*.ejs` lolos dengan ZERO ERROR.
  - `npm run lint` dan `npm run lint:i18n` lolos hijau tanpa error.
  - Tampilan visual katalog `/products` IDENTIK 100% (pixel-perfect) sebelum vs sesudah refaktor pada breakpoint 320px, 375px, 768px, dan 1440px di ID dan EN.
  - Seluruh fungsionalitas interaktif katalog (drawer filter mobile, pencarian debounced, dropdown sorting, AJAX load more, dan paginasi fallback) tetap berfungsi normal tanpa error console.
- **File Terdampak:** `views/public/products.ejs`, `views/partials/products/sidebar.ejs`, `views/partials/products/toolbar.ejs`, `views/partials/products/empty-state.ejs`, `public/css/components.css`, `locales/id.json`, `locales/en.json`.
- **Skill:** `antislop-code`, `adapt`.
- **Verifikasi:** Jalankan `node scripts/lint-views.js`, `npm run lint`, `npm run lint:i18n`, verifikasi tampilan visual browser di 4 breakpoint, dan uji seluruh kontrol interaktif di konsol DevTools.

---

### [T-319] [Refactor Frontend] Ekstraksi 4 Partial Modular & Lokalisasi `views/public/product-detail.ejs`
*(diperbarui sesuai jawaban Keputusan 2)*
- **Deskripsi:** Memecah `views/public/product-detail.ejs` (187 baris) ke dalam 4 partial granular di `views/partials/products/`: `gallery.ejs`, `info-cta.ejs`, `size-table.ejs`, dan `related-section.ejs`. Mengonversi seluruh teks statis hardcoded (breadcrumb, label varian ukuran, tooltip/aria zoom galeri, header tabel ukuran, teks tombol CTA, dan judul produk terkait) ke fungsi lokalisasi `t('product_detail.*')` yang terdaftar lengkap dan simetris di `locales/id.json` dan `locales/en.json`.
- **Acceptance Criteria:**
  - Template utama `views/public/product-detail.ejs` menjadi orchestrator ramping (< 50 baris EJS) dan setiap partial (`gallery.ejs`, `info-cta.ejs`, `size-table.ejs`, `related-section.ejs`) berukuran <= 100 baris.
  - Seluruh string statis menggunakan fungsi `t('product_detail.*')` terdaftar simetris di `locales/id.json` dan `locales/en.json`.
  - Zero inline style, zero raw hex, zero HTML comments pada seluruh template EJS terkait.
  - `npm run lint:views views/public/product-detail.ejs views/partials/products/*.ejs` lolos dengan ZERO ERROR.
  - `npm run lint` dan `npm run lint:i18n` lolos hijau tanpa error.
  - Tampilan visual detail produk `/products/:slug` IDENTIK 100% (pixel-perfect) sebelum vs sesudah refaktor pada 320px, 375px, 768px, dan 1440px di ID dan EN.
  - Interaksi galeri sticky, thumbnail switching, PhotoSwipe lightbox zoom, seleksi pill varian, scroll tabel ukuran mobile card, dan tombol WhatsApp/RFQ tetap berfungsi normal tanpa error console.
- **File Terdampak:** `views/public/product-detail.ejs`, `views/partials/products/gallery.ejs`, `views/partials/products/info-cta.ejs`, `views/partials/products/size-table.ejs`, `views/partials/products/related-section.ejs`, `locales/id.json`, `locales/en.json`.
- **Skill:** `antislop-code`, `adapt`.
- **Verifikasi:** Jalankan `node scripts/lint-views.js`, `npm run lint`, `npm run lint:i18n`, verifikasi rendering tabel ukuran dinamis, uji pembukaan PhotoSwipe lightbox dan klik thumbnail di browser.

---

### [T-320] [Refactor Frontend] Pembersihan Minor & Lokalisasi `views/public/news.ejs`
- **Deskripsi:** Melakukan pembersihan minor pada `views/public/news.ejs` (144 baris) dengan mengonversi teks hardcoded empty state direktori artikel ("No articles match your selected filter criteria..." / "Tidak ditemukan artikel...") dan tombol reset ("View All Publications" / "Lihat Semua Publikasi") ke helper lokalisasi terpusat `t('news.empty_desc')` dan `t('news.empty_reset')` di `locales/id.json` dan `locales/en.json`.
- **Acceptance Criteria:**
  - Teks deskripsi empty state dan tombol reset di `news.ejs` menggunakan `t('news.empty_desc')` dan `t('news.empty_reset')`.
  - Kamus bahasa `locales/id.json` dan `locales/en.json` simetris 100% dan terverifikasi lolos via `npm run lint:i18n`.
  - `npm run lint:views views/public/news.ejs` lolos dengan ZERO ERROR.
  - `npm run lint` lolos hijau.
  - Tampilan visual portal berita `/news` IDENTIK 100% sebelum vs sesudah refaktor pada breakpoint 320px, 375px, 768px, dan 1440px di ID dan EN.
  - Headline carousel slider, filter Fetch API, pill kategori geser mobile, dan paginasi bersama tetap bekerja normal tanpa error console.
- **File Terdampak:** `views/public/news.ejs`, `locales/id.json`, `locales/en.json`.
- **Skill:** `antislop-code`.
- **Verifikasi:** Jalankan `npm run lint:views`, `npm run lint:i18n`, dan uji filter pencarian hingga memunculkan empty state di browser.

---

### [T-321] [Refactor Frontend] Refaktor `views/public/news-detail.ejs` & Ekstraksi Skrip `public/js/news-detail.js`
*(diperbarui sesuai jawaban Keputusan 3)*
- **Deskripsi:** Menghapus tag inline `<script>` (L123-137) dari `views/public/news-detail.ejs` dan memindahkan logikanya ke berkas JS eksternal baru `public/js/news-detail.js` (dimuat via defer `<script src="/js/news-detail.js" defer></script>`). Menghapus class ganda `article-prose` dari `<div class="nwd-prose article-prose">` sehingga menyisakan `.nwd-prose` saja. Memindahkan seluruh aturan styling pendukung dari `.article-prose` (link, table, th, td, blockquote, code, pre, ul, ol, li, h4) ke `.nwd-prose` di `public/css/components.css` dengan memetakan seluruh hex mentah ke token CSS resmi. Mengonversi seluruh teks hardcoded (breadcrumb, atribusi editorial redaksi, share label, empty prose, dan alert copy link) ke kunci lokalisasi `t('news_detail.*')` di `locales/id.json` dan `locales/en.json`.
- **Acceptance Criteria:**
  - Zero inline `<script>` di dalam `views/public/news-detail.ejs` (100% patuh CSP Helmet).
  - Berkas eksternal baru `public/js/news-detail.js` mengelola event klik tombol `#copyLinkBtn` via `addEventListener` dengan penanganan fallback clipboard yang aman dan pesan feedback dwibahasa.
  - Class ganda disederhanakan menjadi `<div class="nwd-prose">`.
  - Seluruh aturan CSS artikel terpusat di `.nwd-prose` tanpa sisa warna hex mentah (100% token CSS).
  - Seluruh string statis menggunakan `t('news_detail.*')` terdaftar simetris di `locales/id.json` & `locales/en.json`.
  - `npm run lint:views views/public/news-detail.ejs` lolos dengan ZERO ERROR.
  - `npm run lint` dan `npm run lint:i18n` lolos hijau tanpa error.
  - Tampilan visual detail berita `/news/:slug` IDENTIK 100% sebelum vs sesudah refaktor pada 320px, 375px, 768px, dan 1440px di ID dan EN.
  - Fungsionalitas share WhatsApp, Facebook, X, dan Salin Tautan berjalan mulus tanpa error console.
- **File Terdampak:** `views/public/news-detail.ejs`, `public/js/news-detail.js`, `public/css/components.css`, `locales/id.json`, `locales/en.json`.
- **Skill:** `antislop-code`.
- **Verifikasi:** Jalankan `node scripts/lint-views.js`, `npm run lint`, `npm run lint:i18n`, verifikasi penyalinan tautan ke clipboard pada browser, dan cek error console DevTools.

---

### [T-322] [Verifikasi & UI Polish] QA Audit, Visual Regression Test Lintas Viewport & Gerbang Kualitas Lint
*(diperbarui sesuai rincian final T-318 s/d T-321)*
- **Deskripsi:** Melakukan pengujian regresi komprehensif pada keempat halaman publik yang direfaktor (`/products`, `/products/:slug`, `/news`, `/news/:slug`) pada 4 ukuran viewport (320px, 375px, 768px, 1440px) dalam Bahasa Indonesia dan Bahasa Inggris. Memastikan tidak ada layout shift, tidak ada kebocoran horizontal (zero overflow leak), tampilan visual pixel-perfect identik dengan kondisi sebelum refaktor, seluruh interaktivitas klien berfungsi utuh, konsol browser bersih dari error/warning, dan seluruh gerbang kualitas otomatis lolos hijau.
- **Acceptance Criteria:**
  - Tampilan visual 4 halaman publik 100% identik sebelum vs sesudah refaktor di 320px, 375px, 768px, dan 1440px (ID dan EN).
  - Gerbang kualitas `npm run lint:views` lolos dengan ZERO ERROR pada seluruh file view EJS dan partial baru/refaktor (`views/public/products.ejs`, `views/partials/products/*.ejs`, `views/public/product-detail.ejs`, `views/public/news.ejs`, `views/public/news-detail.ejs`).
  - `npm run lint` (ESLint) hijau tanpa error.
  - `npm run lint:i18n` hijau tanpa error (100% simetris).
  - Seluruh interaktivitas (filter kategori, search debounce, sort dropdown, drawer mobile, load more ajax, thumbnail galeri, PhotoSwipe lightbox, pil varian, tabel ukuran, tombol WA/RFQ, headline slider, filter berita fetch API, pill geser mobile, paginasi bersama, copy link artikel) berfungsi 100% tanpa error console.
  - Halaman publik lain (terutama beranda/homepage `/`) terbukti 100% utuh tidak terpengaruh (dibekukan).
- **File Terdampak:** Seluruh berkas yang disentuh pada T-318 s/d T-321.
- **Skill:** `impeccable polish`, `adapt`.
- **Verifikasi:** Eksekusi seluruh skrip linting (`npm run lint:views`, `npm run lint`, `npm run lint:i18n`), inspeksi visual komparatif di berbagai ukuran layar, dan verifikasi konsol browser.

---

## 5. Dampak Ukuran Modul & Rencana Pemecahan Sub-Modul

Berikut evaluasi estimasi ukuran berkas modul spesifikasi saat ini dan setelah delta digabungkan (*Merge Spec*):

| Berkas Modul | Ukuran Saat Ini | Baris Saat Ini | Estimasi Tambahan Delta | Estimasi Ukuran Akhir | Status Batas ~8KB |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `prd/products.md` | ~3.9 KB | 79 baris | +0.4 KB | **~4.3 KB** | AMAN (< 8KB) |
| `tech/products.md` | ~5.8 KB | 99 baris | +0.7 KB | **~6.5 KB** | AMAN (< 8KB) |
| `tech/products-detail.md` | ~5.9 KB | 98 baris | +0.7 KB | **~6.6 KB** | AMAN (< 8KB) |
| `prd/news.md` | ~4.6 KB | 74 baris | +0.4 KB | **~5.0 KB** | AMAN (< 8KB) |
| `tech/news.md` | ~5.6 KB | 99 baris | +0.8 KB | **~6.4 KB** | AMAN (< 8KB) |

**Kesimpulan Evaluasi Ukuran:**
Seluruh berkas modul spesifikasi berada dalam rentang aman ~4.3 KB s/d ~6.6 KB, jauh di bawah batas maksimal ~8 KB. Oleh karena itu, **tidak diperlukan pemecahan sub-modul baru**. Modul `tech/products.md` dan `tech/products-detail.md` sudah terpisah secara modular sejak awal, dan `tech/news.md` tetap ringkas karena hanya mencatat penyesuaian arsitektur skrip dan unifikasi class prose.

---

## 6. Rencana CLOSE (Selesai Implementasi)

Setelah seluruh task T-318 s/d T-322 selesai diimplementasikan, diverifikasi, dan disetujui oleh Azis:

1. **Pembersihan Modul Spek:** Menghapus seluruh penanda `[PENDING T-318]` s/d `[PENDING T-322]` pada modul `prd/products.md`, `tech/products.md`, `tech/products-detail.md`, `prd/news.md`, dan `tech/news.md`.
2. **Pembaruan Tanggal Verifikasi:**
   - Memperbarui header `Terakhir diverifikasi: 2026-11-12` pada modul:
     - `prd/products.md`
     - `tech/products.md`
     - `tech/products-detail.md`
     - `prd/news.md`
     - `tech/news.md`
   - Memperbarui kolom `Verifikasi` pada baris **Products Catalog**, **Products Detail**, dan **News & Articles** di tabel `.agents/INDEX.md` menjadi `2026-11-12`.
3. **Arsip Proposal:** Memindahkan berkas proposal ini dari `changes/2026-11-12_refactor-frontend-products-news.md` ke direktori `archive/`.
4. **Arsip Task:** Memindahkan task selesai T-318 s/d T-322 dari `3-TASKS.md` ke berkas riwayat `archive/tasks-index-full.md` dan mengosongkan kembali daftar task aktif terbuka di `3-TASKS.md`.
5. **Entri CHANGELOG.md:** Menambahkan 1 baris entri resmi di `CHANGELOG.md`:  
   `2026-11-12 | Refactor frontend 4 halaman publik (products, product-detail, news, news-detail): modularisasi partial <= 100 baris, zero inline style/raw hex, zero inline script, eliminasi komentar HTML, lokalisasi t() penuh | T-318 s/d T-322`
