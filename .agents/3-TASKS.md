# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 5 Task (T-375 s/d T-379)
- **Total Task Selesai:** 374 Task (T-01 s/d T-374)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-375**.

---

## Task Aktif / Terbuka (Open Tasks)

Proposal rujukan: [2026-11-20_product-gallery-multi-upload.md](changes/2026-11-20_product-gallery-multi-upload.md)

- [ ] **T-375** — Perbaikan Bug Galeri Foto Produk Admin (`/admin/products/create` & `edit`)
  - Buat `public/js/admin-product-form.js` (`<= 300` baris, dimuat di `create.ejs` & `edit.ejs`) untuk mengikat `#btnOpenGalleryPicker`, render `#prodGalleryStrip`, geser kiri/kanan, hapus, dan sinkronisasi `#gallery_images_input` (tanpa batas jumlah item sesuai `6a`), serta normalisasi `file_url`/`url` & `id`.
  - Perbaiki `renderGrid()` di `public/js/media-picker.js` agar tidak menimpa `.media-picker-checkbox` via `card.innerHTML += ...`, dan pastikan `productController.renderCreateFormError` me-resolve `gallery_items` pada error 400.
  - **Verifikasi:** Tambah 1 & banyak foto (>12) dari library dan upload baru, reorder/hapus tersimpan, tampil di `/products/:slug`, zero console/CSP error, `tests/test-task-202-admin-form.js`, `npm run lint`, `npm run lint:views`.
- [ ] **T-376** — Perbaikan Audit `check-usage` Media untuk `products.gallery_images`
  - Perbarui `mediaModel.checkUsage(fileUrl, mediaId)` serta `mediaService.checkMediaUsage` / `deleteMediaItem` agar mengecek `products.main_image` dan `products.gallery_images` baik format integer ID maupun URL string via `JSON_CONTAINS` terparameter (`7a`).
  - **Verifikasi:** Unit test di `tests/test-t347-t349-admin-services.js` untuk ID integer, URL string, dan non-usage; verifikasi peringatan SweetAlert2 & HTTP `409` di `/admin/media`.
- [ ] **T-377** — Fitur Baru (`FR-28`) Multi-Upload Media Berurutan dengan Progres & Ringkasan
  - Perbarui `views/partials/media-picker-modal.ejs` (`multiple`, hint JPG/PNG/WebP/GIF/ICO/MP4/WebM/PDF Maks 30 MB tanpa SVG, `.adm-picker-upload-queue`) dan `public/js/media-picker.js` untuk mengirim antrean tanpa batas jumlah (`4c`) secara berurutan ke `POST /admin/api/media/upload` (`5a`) dengan header `X-CSRF-Token`.
  - Terapkan progres `"x dari N"` (`aria-live="polite"`), isolasi gagal parsial + ringkasan sukses/gagal, seleksi semua item baru pada mode *multiple* (`2a`), dan pilih item sukses terakhir menunggu konfirmasi pada mode *single* (`3a`).
  - Perluas modal upload halaman `/admin/media` (`views/admin/media/index.ejs`, `public/js/admin-media.js`, `public/js/admin.js`) agar mendukung multi-upload berurutan yang sama (`1b`).
  - **Verifikasi:** Uji upload multi-berkas (dialog & drag-drop) pada picker single/multiple & `/admin/media`, validasi MIME/SVG/30 MB per berkas, CSRF, serta unit/E2E test.
- [ ] **T-378** — UI Polish, Tokenisasi, Aksesibilitas & Label ID/EN (Picker, Upload `/admin/media` & Galeri Produk)
  - Hapus seluruh `style="..."` & `onerror="..."` inline di `public/js/media-picker.js`; pindahkan ke class ter-scope `.adm-picker-*` / `.adm-media-*` / `.adm-d-none` di `public/css/admin.css` menggunakan token `tokens.css` (tanpa hex mentah).
  - Terapkan `:focus-visible` ring, `aria-live="polite"`, target sentuh min `44px`, kontras WCAG AA, dan label ID/EN simetris di `locales/id.json` & `locales/en.json` serta kamus JS (Skill: `impeccable` `polish`/`adapt`, `antislop` mode `during`).
  - **Verifikasi:** `npm run lint`, `npm run lint:views`, `npm run lint:i18n`, audit kontras & navigasi keyboard Playwright.
- [ ] **T-379** — Audit Regresi Single-Select, Halaman Publik, Responsif `320px`–Desktop & Gerbang Kualitas
  - Verifikasi seluruh pemakai picker single-select (produk main image, banner, hero banner, home-content, berita & TinyMCE, about gallery/tabs, settings logo/favicon, brand, capabilities), `/admin/media`, `/products/:slug`, viewport `320px`–`1440px`, mode ID & EN, homepage tetap beku, dan zero console/CSP error.
  - **Verifikasi:** `npm run lint`, `npm run lint:views`, `npm run lint:i18n`, `npm run test:seed`, `npm test`, serta Playwright E2E regresi.
