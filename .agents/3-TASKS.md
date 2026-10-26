# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 8 Task (T-204 s/d T-211)
- **Total Task Selesai:** 203 Task (T-01 s/d T-203)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-204**.

---

## Task Aktif / Terbuka (Open Tasks)

- [x] **T-204**: Migrasi database `database/migrations/016_drop_unused_product_specs.sql` untuk DROP kolom legacy `material_specs` dan `technical_specs` dari tabel `products`.
- [x] **T-205**: Migrasi database `database/migrations/017_add_product_cta_fields.sql` untuk ADD kolom baru `cta_text_id` (VARCHAR(100) NULL) dan `cta_text_en` (VARCHAR(100) NULL) pada tabel `products`.
- [x] **T-206**: Pembaruan model data produk `models/productModel.js` untuk mendukung skema baru (hapus pemetaan `material_specs` & `technical_specs`, integrasikan kolom CTA kustom `cta_text_id` & `cta_text_en`).
- [x] **T-207**: Pembersihan markup UI form admin `views/admin/products/create.ejs` & `edit.ejs` (hapus input `material_specs`, hapus card 3 dynamic technical specs `#specsContainer` & `#btnAddSpecRow`, dan bersihkan fungsi JS `createSpecRow`).
- [x] **T-208**: Pembersihan CSS spesifikasi usang di `public/css/admin.css` (`.spec-item-row`, `.spec-col-key`, `.spec-col-val` dihapus, pertahankan `.btn-add-row`).
- [x] **T-209**: Implementasi field input teks CTA dwibahasa pada form admin `create.ejs` & `edit.ejs`, serta validasi server-side di `controllers/admin/productController.js` (maks 50 char, sanitasi HTML, hapus `parseTechnicalSpecs`).
- [x] **T-210**: Integrasi teks CTA dinamis pada `controllers/public/productController.js` & `views/public/product-detail.ejs` (menggunakan nomor WhatsApp resmi dari `settings.whatsapp_number`, render teks kustom produk dengan fallback dwibahasa `product_detail.cta_whatsapp_default` di `locales/id.json` & `locales/en.json`).
- [x] **T-211**: Pengujian regresi otomatis end-to-end (`tests/test-product-admin-cta-qa.js`), penyesuaian unit test terdampak, dan verifikasi responsivitas & zero console error.

