# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 8 Task (`T-387` s/d `T-394`)
- **Total Task Selesai:** 386 Task (T-01 s/d T-386)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-395**.

---

## Task Aktif / Terbuka (Open Tasks)

*Proposal rujukan:* [changes/2026-11-21_corner-wipe-header-dan-varian-dinamis.md](changes/2026-11-21_corner-wipe-header-dan-varian-dinamis.md)

- [x] **T-387** — Perbaikan akar masalah jitter/lag header & scroll mobile (hapus animasi `grid-template-rows`, `padding`, `backdrop-filter`; scroll listener `{ passive: true }` + `requestAnimationFrame` + guard state; drawer `100dvh`; lepas `will-change` permanen; Hero Slider & section beranda lain dibekukan). File: `public/css/layout.css`, `public/js/main.js`.
- [x] **T-388** — Implementasi animasi *corner wipe* drawer menu mobile (`FR-24`, prefix `.hdr-wipe-*`): `clip-path: circle(0% at 100% 0%)` <-> `circle(150% at 100% 0%)`, durasi `360ms` buka (`cubicBezier(0.22, 1, 0.36, 1)`) / `240ms` tutup (`cubicBezier(0.4, 0, 1, 1)`), satu `anime.timeline` (Anime.js v3.2.2), `anime.remove` saat tap cepat, kunci toggle, bersihkan `will-change` & inline style, `prefers-reduced-motion: reduce`. File: `public/js/main.js`, `public/css/layout.css`, `views/partials/navbar.ejs`.
- [x] **T-389** — Skema data, migrasi DB (`023_migrate_product_variants_to_groups.sql` & `024_add_selected_variants_to_inquiries.sql`), shared `services/productVariantService.js` (normalizer, validasi batas 5 grup / 20 opsi / 40 char / 50 char, whitelist matcher), pembaruan `models/productModel.js`, dan sinkronisasi `database/seeds/snapshot.json` (`npm run test:seed` hijau).
- [x] **T-390** — Admin CMS Builder Grup Varian Dinamis (`FR-40` bagian produk): ekstrak ke `views/admin/products/partials/variants.ejs` (`.adm-var-*`, `<= 100` baris) + `public/js/admin-product-variants.js` (`<= 300` baris), dropdown preset (Warna/Ukuran/Tipe/Jenis) + "Lainnya" teks bebas ID/EN, tambah/hapus/urutkan grup & opsi, konfirmasi SweetAlert2, validasi server di `services/productService.js` & `services/productCrudService.js`.
- [x] **T-391** — Publik PDP: multi-pilih opsional grup varian (`.pd-var-*`), polish state pil (default, `@media (hover: hover)`, `:active`, terpilih, `:focus-visible`, WCAG AA via token, target sentuh `>= 44px`, wrap `320px`), pembaruan tautan WA dinamis ID/EN (`encodeURIComponent`, fallback SSR tanpa JS), dan pembaruan href RFQ `/contact?product=<id>&variants=<encoded>` di `public/js/product-variants.js` (`<= 300` baris).
- [x] **T-392** — Konteks varian pada Form RFQ `/contact` (`FR-14` ekstensi, `.cf-var-*`): tampilkan chip varian terpilih yang bisa dihapus & pilih ulang opsi milik produk aktif, sinkron saat dropdown `#product_id` diubah, validasi whitelist server di `services/publicContactService.js`, simpan ke `inquiries.selected_variants` (`models/inquiryModel.js`), dan lampirkan di email mailer tanpa mengganggu CSRF/Turnstile/honeypot.
- [x] **T-393** — Tampilan varian terpilih pada Admin RFQ (`FR-40` bagian RFQ): render aman (auto-escape `<%= %>` / `textContent`) pada detail (`views/admin/inquiries/detail.ejs`), modal quick view (`views/admin/inquiries/index.ejs`, `public/js/admin-inquiries.js` termasuk paginasi tanpa reload), dan kolom `Varian Produk` pada ekspor CSV (`services/inquiryService.js`).
- [x] **T-394** — QA regresi menyeluruh (`320px`–`1440px`, ID & EN), verifikasi Hero Slider beranda tidak berubah, profiling Chrome DevTools 4x CPU throttling (`CLS = 0`, long task `<= 50ms`), zero console error, serta verifikasi gerbang kualitas (`npm run lint`, `npm run lint:views`, `npm run lint:i18n`, `npm run test:seed`, `npm test`).
