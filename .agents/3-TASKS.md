# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 7 Task (`T-380` s/d `T-386`)
- **Total Task Selesai:** 379 Task (T-01 s/d T-379)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-387**.

---

## Task Aktif / Terbuka (Open Tasks)

*Proposal acuan:* [changes/2026-11-21_produk-galeri-tab-search.md](changes/2026-11-21_produk-galeri-tab-search.md)

- [x] **T-380** `[Bug Fix / adapt]` **Perbaikan Toolbar Katalog Mobile 2 Baris (`/products`)**
  - **File:** `public/css/components.css`, `views/partials/products/toolbar.ejs` (bila perlu atribut semantik tanpa ubah ID/kontrak JS)
  - **AC:** Hanya pada `<= 767px`: baris 1 `.plp-search-wrap` lebar penuh (`width: 100%`), baris 2 `.plp-drawer-trigger` dan `.plp-sort-wrap` berdampingan 50/50 (`.plp-sort-wrap .eu-dd { width: 100%; min-width: 0; }`). Tablet (`>= 768px`) & desktop tetap 1 baris. Di 320/375/480px teks panjang dengan spasi dapat diketik & terbaca penuh; zero horizontal overflow; state URL & deep link tetap berfungsi; focus ring jelas; target sentuh >= 44px; `:hover` di `@media (hover: hover)`; nol raw hex.

- [x] **T-381** `[Fitur / backend]` **Inklusi Otomatis `main_image` di Indeks 0 Galeri Detail Produk + Deduplikasi**
  - **File:** `services/publicProductService.js`, `tests/test-public-services.js`
  - **AC:** `resolveProductGallery` menyelesaikan semua ID media numerik via `mediaModel.findUrlsByIds` dulu, lalu menyisipkan `main_image` di posisi pertama (indeks 0) dan membuang duplikat URL eksak. Disuntik hanya saat render publik tanpa mengubah `gallery_images` di DB maupun daftar galeri admin. Produk tanpa `main_image` dan tanpa galeri tetap aman.

- [x] **T-382** `[Fitur / adapt, animate]` **Galeri Detail Produk — CSS Scroll-Snap Swipe/Drag, Panah Prev/Next Non-Overlapping & Strip Thumbnail Geser**
  - **File:** `views/partials/products/gallery.ejs`, `public/css/components.css`, `public/js/product-detail.js`, `locales/id.json`, `locales/en.json`
  - **AC:** Track `.pd-gallery-track` berbasis CSS `scroll-snap-type: x mandatory` + `scroll-behavior: smooth` + sinkronisasi JS & drag mouse ringan desktop. Bilah kontrol `.pd-gallery-controls` di bawah bingkai foto utama berisi penghitung `1 / N` + tombol Prev/Next (>= 44x44px, `disabled` di ujung, tanpa loop, styling token tema website) sehingga tidak menutupi gambar atau judul; sembunyi jika 1 foto. Strip thumbnail `.pd-thumbs` tetap di desktop & mobile, sinkron (`aria-pressed` + auto-scroll), dan dapat di-slide horizontal (sentuh + drag mouse) saat foto banyak (mis. 10+) tanpa tombol panah tambahan. Ketuk/klik tanpa geser (< ~10px) tetap membuka Lightbox `.lbx-*` pada indeks aktif. Keyboard `ArrowLeft`/`ArrowRight`, `touch-action: pan-y`, rasio `4 / 3.4` (CLS = 0), `prefers-reduced-motion`, `:hover` di `@media (hover: hover)`, live region `.sr-only` `"Foto X dari N"` / `"Photo X of N"` dwibahasa.

- [x] **T-383** `[Fitur / backend]` **Migrasi DB `022`, Model & Validasi Server `show_description_tab` (`DEFAULT 0`)**
  - **File:** `database/migrations/022_add_show_description_tab_to_products.sql`, `models/productModel.js`, `services/productService.js`, `services/productCrudService.js`, `tests/test-t356-t360-admin-services.js`
  - **AC:** Migrasi `022` menambah `show_description_tab TINYINT(1) NOT NULL DEFAULT 0`. Validasi server whitelist `0`/`1` (`parseShowDescriptionTab`, unchecked/absen = `0`). Tersimpan & terbaca benar pada create, update, `findById`, dan `findBySlug`.

- [x] **T-384** `[Fitur / polish]` **Toggle Admin Tampil/Sembunyi Tab Deskripsi Lengkap di Form Produk**
  - **File:** `views/admin/products/partials/basic-info.ejs`, `public/css/admin.css` (bila perlu wrapper spacing `.adm-prod-*`), `locales/id.json`, `locales/en.json`
  - **AC:** Hanya di form Create & Edit (`basic-info.ejs`), tepat di atas field Deskripsi Lengkap (ID & EN), memakai ulang `.admin-toggle-switch` / `.admin-toggle-slider` / `.admin-toggle-label` tanpa style paralel. Default unchecked (`0`) di create, mengikuti nilai DB di edit. Label ID & EN, target sentuh >= 44px, focus-visible jelas, CSRF utuh, nol inline style/handler.

- [x] **T-385** `[Fitur / polish]` **Tab "Deskripsi Lengkap" & "Tabel Ukuran" di Detail Produk Publik**
  - **File:** `services/publicProductService.js`, `views/public/product-detail.ejs`, `views/partials/products/spec-tabs.ejs` (baru), `views/partials/products/size-table.ejs`, `public/css/components.css`, `public/js/product-detail.js`, `locales/id.json`, `locales/en.json`
  - **AC:** `show_description_tab = 0`: tanpa tab bar, hanya section Tabel Ukuran biasa (hilang jika kosong). `show_description_tab = 1` & keduanya terisi: 2 tab aksesibel (`role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, panah + `Home`/`End`), urutan Deskripsi Lengkap dulu & aktif awal lalu Tabel Ukuran; mobile tetap komponen tab yang sama. Kasus tepi: jika hanya 1 konten terisi tampil sebagai section biasa tanpa tab bar; jika keduanya kosong section disembunyikan. HTML `description_id/en` disanitasi via `sanitizeArticleHtml`. Progressive enhancement tanpa JS tetap terbaca; fallback SEO `meta_description` tetap utuh.

- [x] **T-386** `[QA & Regresi]` **Verifikasi Regresi End-to-End (320px–1440px, ID/EN, Lint & Test)**
  - **File:** Seluruh berkas terdampak `T-380` s/d `T-385`
  - **AC:** Regresi katalog, detail produk (1 foto & 10+ foto), tab deskripsi/tabel ukuran & kasus tepi, serta admin create/edit produk lulus tanpa error console pada 320px–1440px di ID & EN; `npm run lint`, `npm run lint:views`, `npm run lint:i18n`, dan `npm test` hijau.
