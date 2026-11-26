# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 18 Task (`T-415` s/d `T-432` — Audit Dead CSS & Refaktor Modular `public/css/admin.css`)
- **Total Task Selesai:** 414 Task (T-01 s/d T-414)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-433**.
- **Referensi Proposal & Spek:** [changes/2026-11-25_admin-css-modular-refactor.md](changes/2026-11-25_admin-css-modular-refactor.md) | [tech/admin-ui-css.md](tech/admin-ui-css.md) | [tech/conventions.md](tech/conventions.md) | [tech/conventions-lint.md](tech/conventions-lint.md).

---

## Task Aktif / Terbuka (Open Tasks)

### [x] T-415 `[Tier: Argon Medium]` — Pembersihan 18 Dead CSS Class, Konsolidasi 7 Duplikat & Komentar Usang di `public/css/admin.css`
- **File Terdampak (1 file):** `public/css/admin.css`.
- **Langkah & Kontrak Eksplisit:**
  1. Verifikasi baseline selector via skrip Node/`ctx_execute` sebelum edit (813 class, 1.128 blok rule).
  2. Hapus **13 class Pasti Mati**: `.alert-warning` (`L609–L613`), blok tombol legacy `.btn`/`.btn-primary`/`.btn-secondary`/`.btn-danger`/`.btn-sm` (`L659–L714`), `.swal2-custom-confirm-btn` & `.swal2-custom-cancel-btn` (`L2386–L2404`), `.char-counter.text-danger` & `.char-counter.counter-danger` (`L2735–L2738`), `.prod-variant-row-item` (`L2909–L2915`), `.table-responsive:has(.eu-dd.is-open)` (`L3645`), dan `.adm-inq-pagination` (`L5469–L5475`).
  3. Hapus **5 class Kategori (c)** (Keputusan 6b): `.adm-btn-ghost` (`L792, L800–L801, L806, L853, L861–L862` — pertahankan `.adm-btn-neutral`), `.adm-btn-lg` (`L927`), `.adm-btn-spinner` (`L956, L995` — pertahankan `.adm-btn.is-loading` & `@keyframes` aktif), `.eu-dd-trigger.is-focused` (`L3692` — pertahankan `:focus`/`:focus-visible`), dan `.eu-dd-error-msg` (`L4104`).
  4. Konsolidasikan 7 duplikat konteks sama tanpa mengubah cascade: `.admin-alerts-container` (`L578` + `L2411`, pastikan `display: none !important` tetap menang), `.form-input/.form-select/.form-textarea/.form-control` (`L1543–L1568`), `.app-content` di `@media (max-width: 480px)` (`L3513` + `L3549`), dan `.adm-var-btn-move` (`L7730` + `L7739`).
  5. Hapus 14 komentar historis/nomor task/AI (`T-94..T-378`, `Batch 1..13`, `Keputusan Q1/Q2/Q7`, `DESIGN.md Pacific Corporate`) dengan mempertahankan hanya penanda bagian semantik ringkas.
- **Referensi Pola:** `public/css/components.css` (penamaan seksi bersih tanpa komentar nomor task).
- **Batasan Negatif:** Dilarang menghapus class dinamis/vendor (`.swal2-*`, `.tox*`, `.eu-dd-*`, `.adm-picker-queue-*`, `.stg-footer-*`, `.badge-status-*`, `.is-*`, `.has-*`) maupun mengubah satu pun properti visual aktif; dilarang menyentuh CSS publik.
- **Skill Relevan:** `antislop-code`.
- **Verifikasi Deterministik:** `npm run lint && npm run lint:views && npm run lint:i18n` + verifikasi skrip Node bahwa 0 duplikat konteks sama tersisa, seluruh 18 class mati hilang, dan 795 class aktif tetap utuh.

### [x] T-416 `[Tier: Argon Medium]` — Ekstraksi Layer 1: `admin/tokens.css`, `admin/base-shell.css` & Pemuatan Modular Awal di `admin-header.ejs`
- **File Terdampak (4 file):** `public/css/admin/tokens.css` (baru), `public/css/admin/base-shell.css` (baru), `public/css/admin.css`, `views/partials/admin-header.ejs`.
- **Langkah & Kontrak Eksplisit:**
  1. Ekstrak blok `:root` dari `admin.css` (eks `L1–L81`) ke `public/css/admin/tokens.css` dan tambahkan ~14 token semantik baru sesuai `tech/admin-ui-css.md` Bagian 2 (permukaan netral `--bg-surface-alt`, `--bg-upload-tint`, `--border-strong`, `--text-heading/body-strong/slate-dark`; skala danger `--color-error`, `--danger-solid`, `--danger-hover-*`, `--danger-text-deep`; skala emerald `--emerald-*`; `--adm-btn-primary-hover-border`, `--role-superadmin-*`, `--warning-text-strong`) tanpa mengubah nilai 54 token existing.
  2. Ekstrak blok reset & shell (`admin.css` eks `L82–L658`, `L2127–L2138`, `L2411–L2414`, `L5698–L5710`, `L5890–L5905`, ~595 baris) ke `public/css/admin/base-shell.css` mencakup `.app-layout`, `.app-sidebar`, collapsed state, `.app-topbar`, `.admin-alerts-container` (`display: none !important`), `.app-content`, `.adm-shell-*`, dan `.adm-d-*`.
  3. Migrasikan seluruh 11 warna hex mentah di `base-shell.css` ke variabel token dari `admin/tokens.css` (0 hex mentah).
  4. Hapus blok sumber dari `public/css/admin.css` dan muat `<link href="/css/admin/tokens.css">` serta `<link href="/css/admin/base-shell.css">` tepat sebelum `/css/admin.css` di `views/partials/admin-header.ejs`.
- **Referensi Pola:** `public/css/tokens.css` (struktur pengelompokan token `:root`).
- **Batasan Negatif:** Dilarang mengubah `public/css/tokens.css` publik maupun nilai 8 token kontrak `test-rebrand-zero-blue.js`; dilarang menambah inline style/script di `admin-header.ejs`.
- **Skill Relevan:** `antislop-code`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/admin/base-shell.css && npm run lint && npm run lint:views && npm run lint:i18n`.

### [x] T-417 `[Tier: Hydrogen Medium]` — Ekstraksi `admin/buttons.css` & `admin/modals-overlays.css` + Migrasi 66 Hex
- **File Terdampak (4 file):** `public/css/admin/buttons.css` (baru), `public/css/admin/modals-overlays.css` (baru), `public/css/admin.css`, `views/partials/admin-header.ejs`.
- **Langkah & Kontrak Eksplisit:**
  1. Pindahkan blok `.adm-btn-*` (`admin.css` eks `L715–L999`, ~265 baris pasca T-415) ke `public/css/admin/buttons.css` (termasuk `@media (hover: hover)`, `@media (max-width: 768px)` `min-height: 44px`, dan `@media (prefers-reduced-motion: reduce)`) serta migrasikan seluruh 50 hex mentah ke token `admin/tokens.css`.
  2. Pindahkan blok modal, tombol tutup C4, toast, SweetAlert2, dan `.modal-copy-*` (`admin.css` eks `L1895–L2056`, `L2353–L2410`, `L3096–L3139`, ~245 baris) ke `public/css/admin/modals-overlays.css` serta migrasikan seluruh 16 hex mentah ke token.
  3. Hapus blok sumber dari `admin.css` dan daftarkan `<link>` di `views/partials/admin-header.ejs` pada urutan cascade #3 (`buttons.css`) dan #6 (`modals-overlays.css`).
- **Referensi Pola:** `public/css/admin/base-shell.css`.
- **Batasan Negatif:** Dilarang mengubah perilaku `.adm-btn-*`, animasi hover/reduced-motion, atau z-index `.swal2-container`; dilarang menyentuh `.btn-*` publik.
- **Skill Relevan:** `antislop-code`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/admin/buttons.css && node scripts/lint-views.js public/css/admin/modals-overlays.css && npm run lint:views`.

### [x] T-418 `[Tier: Hydrogen Medium]` — Ekstraksi `admin/tables-badges.css` + Migrasi 57 Hex
- **File Terdampak (3 file):** `public/css/admin/tables-badges.css` (baru), `public/css/admin.css`, `views/partials/admin-header.ejs`.
- **Langkah & Kontrak Eksplisit:**
  1. Pindahkan blok metrik dashboard, table card, data table, badge status, status selector, role badges, tombol aksi CRUD C2, dan footer tabel C5 (`admin.css` eks `L1000–L1496`, `L2139–L2169`, ~525 baris) ke `public/css/admin/tables-badges.css`.
  2. Migrasikan seluruh 57 warna hex mentah ke token `admin/tokens.css` (`--emerald-*`, `--role-superadmin-*`, `--st-*-*`, `--bg-surface-alt`, `--border-strong`, `--danger-hover-*`).
  3. Hapus blok sumber dari `admin.css` dan daftarkan `<link>` di `views/partials/admin-header.ejs` pada urutan cascade #4 (tepat setelah `buttons.css`).
- **Referensi Pola:** `public/css/admin/buttons.css`.
- **Batasan Negatif:** Dilarang mengubah spesifisitas `.badge-status-*`, `.status-select`, `.btn-action-*`, atau kontras WCAG AA badge.
- **Skill Relevan:** `antislop-code`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/admin/tables-badges.css && npm run lint:views`.

### [x] T-419 `[Tier: Hydrogen Medium]` — Ekstraksi `admin/forms-inputs.css` + Migrasi 53 Hex
- **File Terdampak (3 file):** `public/css/admin/forms-inputs.css` (baru), `public/css/admin.css`, `views/partials/admin-header.ejs`.
- **Langkah & Kontrak Eksplisit:**
  1. Pindahkan blok `.form-card`, `.form-group`, `.form-input/select/textarea/control`, `.adm-slug-text`, `.custom-file-*`, row actions, `.btn-add-row`, `.char-counter`, `.form-actions-sticky`, `.admin-card-*`, `.admin-field-*`, `.table-col-action`, `.btn-submit/clear-*`, dan form validation `.is-invalid`/`.adm-field-error`/`.tox-tinymce` (`admin.css` eks `L1497–L1894`, `L2726–L2740`, `L2869–L2903`, `L2916–L2933`, `L3364–L3412`, ~505 baris) ke `public/css/admin/forms-inputs.css`.
  2. Migrasikan seluruh 53 warna hex mentah ke token `admin/tokens.css`.
  3. Hapus blok sumber dari `admin.css` dan daftarkan `<link>` di `views/partials/admin-header.ejs` pada urutan cascade #5 (setelah `tables-badges.css`, sebelum `modals-overlays.css`).
- **Referensi Pola:** `public/css/admin/tables-badges.css`.
- **Batasan Negatif:** Dilarang mengubah `min-height: 38px` pada `.form-input`/`.form-select`/`.form-control` maupun perilaku `.form-card`/`.form-group`/`.form-row-2`.
- **Skill Relevan:** `antislop-code`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/admin/forms-inputs.css && npm run lint:views`.

### [x] T-420 `[Tier: Hydrogen Medium]` — Ekstraksi `admin/dropdown.css` + Migrasi 44 Hex
- **File Terdampak (3 file):** `public/css/admin/dropdown.css` (baru), `public/css/admin.css`, `views/partials/admin-header.ejs`.
- **Langkah & Kontrak Eksplisit:**
  1. Pindahkan seluruh blok komponen `.eu-dd-*` (`admin.css` eks `L3632–L4126`, ~485 baris pasca T-415) ke `public/css/admin/dropdown.css` (3 varian, `--sm`, floating label, caret, panel, `.eu-dd-panel--top`, search box, listbox items, skeleton shimmer, disabled/empty/invalid states, reduced-motion).
  2. Migrasikan seluruh 44 warna hex mentah ke token `admin/tokens.css`.
  3. Hapus blok sumber dari `admin.css` dan daftarkan `<link>` di `views/partials/admin-header.ejs` pada urutan cascade #8.
- **Referensi Pola:** `public/css/admin/forms-inputs.css` & `tech/admin-ui-dropdown.md`.
- **Batasan Negatif:** Dilarang menyentuh `.eu-dd-*` publik di `public/css/components.css`; dilarang mengubah `--eu-dd-height: 38px` desktop atau `min-height: 44px` mobile `<=768px`.
- **Skill Relevan:** `antislop-code`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/admin/dropdown.css && npm run lint:views`.

### [x] T-421 `[Tier: Hydrogen Medium]` — Ekstraksi `admin/tabs-toggles.css` & `admin/responsive-viewport.css` + Migrasi 32 Hex
- **File Terdampak (4 file):** `public/css/admin/tabs-toggles.css` (baru), `public/css/admin/responsive-viewport.css` (baru), `public/css/admin.css`, `views/partials/admin-header.ejs`.
- **Langkah & Kontrak Eksplisit:**
  1. Pindahkan C7 liquid glass tabs, `.adm-toggle-*`, dan WhatsApp repeater `.wa-*` (`admin.css` eks `L2170–L2262`, `L3140–L3363`, ~315 baris) ke `public/css/admin/tabs-toggles.css` dan migrasikan seluruh 32 hex mentah ke token.
  2. Pindahkan mobile shell responsive dan adaptasi viewport/zoom (`admin.css` eks `L2263–L2352`, `L3413–L3631`, ~300 baris, 0 hex) ke `public/css/admin/responsive-viewport.css`.
  3. Hapus blok sumber dari `admin.css` dan daftarkan `<link>` di `views/partials/admin-header.ejs`: `tabs-toggles.css` pada urutan #7 (sebelum `dropdown.css`), dan `responsive-viewport.css` pada urutan #10 (setelah slot `pagination.css` dan **sebelum** Media Picker/Pages).
- **Referensi Pola:** `public/css/admin/modals-overlays.css`.
- **Batasan Negatif:** Dilarang mengubah breakpoint (`768px`, `520px`, `480px`, `360px`) maupun urutan cascade `responsive-viewport.css` terhadap Media Picker.
- **Skill Relevan:** `antislop-code`, `antislop-layoutmobile`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/admin/tabs-toggles.css && node scripts/lint-views.js public/css/admin/responsive-viewport.css && npm run lint:views`.

### [x] T-422 `[Tier: Hydrogen Medium]` — Ekstraksi `admin/pagination.css` & `admin/page-auth.css` + Migrasi 1 Hex
- **File Terdampak (4 file):** `public/css/admin/pagination.css` (baru), `public/css/admin/page-auth.css` (baru), `public/css/admin.css`, `views/partials/admin-header.ejs`.
- **Langkah & Kontrak Eksplisit:**
  1. Pindahkan komponen paginasi Varian 1 `.pgn-*` (`admin.css` eks `L6951–L7330`, ~380 baris) ke `public/css/admin/pagination.css` dan migrasikan 1 hex mentah (`L7218`) ke `var(--bg-surface-alt)`.
  2. Pindahkan gaya auth & error `.loginForm`, `.err403-*`, `.adm-login-*`, `.chpwd-*` (`admin.css` eks `L2702–L2709`, `L4549–L4741`, ~200 baris, 0 hex) ke `public/css/admin/page-auth.css`.
  3. Hapus blok sumber dari `admin.css` dan daftarkan di `views/partials/admin-header.ejs`: `pagination.css` pada urutan #9 (sebelum `responsive-viewport.css`) serta inisialisasi peta kondisional `PAGE_STYLES` (`activeNav === 'password'` &rarr; `page-auth.css`, plus dukungan `extraAdminStyles`).
- **Referensi Pola:** `public/css/admin/dropdown.css`.
- **Batasan Negatif:** Dilarang mengubah `.pgn-bar--public` di `components.css` maupun struktur 2-baris mobile `>= 44px`; nesting EJS di `admin-header.ejs` maksimal 2 level.
- **Skill Relevan:** `antislop-code`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/admin/pagination.css && node scripts/lint-views.js public/css/admin/page-auth.css && npm run lint:views`.

### [x] T-423 `[Tier: Hydrogen Medium]` — Ekstraksi `admin/media-picker.css` + Migrasi 31 Hex
- **File Terdampak (3 file):** `public/css/admin/media-picker.css` (baru), `public/css/admin.css`, `views/partials/admin-header.ejs`.
- **Langkah & Kontrak Eksplisit:**
  1. Pindahkan `.media-grid`, `.media-picker-*`, `#btnMediaPickerPrev/Next`, `.media-picker-checkbox` (`admin.css` eks `L2057–L2126`, `L2415–L2701`, `L2710–L2725`, ~370 baris) ke `public/css/admin/media-picker.css`.
  2. Migrasikan seluruh 31 warna hex mentah ke token `admin/tokens.css`.
  3. Hapus blok sumber dari `admin.css` dan daftarkan `<link>` di `views/partials/admin-header.ejs` pada urutan cascade #11 (setelah `responsive-viewport.css`).
- **Referensi Pola:** `public/css/admin/modals-overlays.css`.
- **Batasan Negatif:** Dilarang mengubah `min-height: 240px` pada modal body media picker (kontrak `test-task-202-admin-form.js`) maupun `#btnMediaPickerPrev/Next`.
- **Skill Relevan:** `antislop-code`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/admin/media-picker.css && npm run lint:views`.

### [x] T-424 `[Tier: Hydrogen Medium]` — Ekstraksi `admin/media-picker-upload.css` (Multi-Upload Queue & Mobile Polish)
- **File Terdampak (3 file):** `public/css/admin/media-picker-upload.css` (baru), `public/css/admin.css`, `views/partials/admin-header.ejs`.
- **Langkah & Kontrak Eksplisit:**
  1. Pindahkan `.adm-picker-*` (search, dropzone, progress, upload queue, usage warning), `#uploadModal`, serta `@media (pointer: coarse), (max-width: 768px)` dan `@media (max-width: 480px)` khusus Media Picker (`admin.css` eks `L5711–L5889`, `L7331–L7456`, `L7478–L7556`, `L7571–L7642`, ~450 baris, 0 hex) ke `public/css/admin/media-picker-upload.css`.
  2. Pastikan aturan `@media` di `L7529–L7642` berada di bagian bawah berkas agar tetap menimpa `responsive-viewport.css` dan `media-picker.css`.
  3. Hapus blok sumber dari `admin.css` dan daftarkan `<link>` di `views/partials/admin-header.ejs` pada urutan cascade #12 (tepat setelah `media-picker.css`).
- **Referensi Pola:** `public/css/admin/media-picker.css`.
- **Batasan Negatif:** Dilarang menghapus `.adm-picker-queue-*` atau `.adm-picker-usage-*` (dipakai dinamis JS); dilarang menaruh berkas ini sebelum `responsive-viewport.css`.
- **Skill Relevan:** `antislop-code`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/admin/media-picker-upload.css && npm run lint:views`.

### [x] T-425 `[Tier: Hydrogen Medium]` — Ekstraksi `admin/page-dashboard-inquiries.css` & `admin/page-org-contact.css`
- **File Terdampak (4 file):** `public/css/admin/page-dashboard-inquiries.css` (baru), `public/css/admin/page-org-contact.css` (baru), `public/css/admin.css`, `views/partials/admin-header.ejs`.
- **Langkah & Kontrak Eksplisit:**
  1. Pindahkan `.adm-leads-*`, `.adm-inq-*`, dan `.adm-dash-*` (`admin.css` eks `L5315–L5697`, ~375 baris, 0 hex) ke `public/css/admin/page-dashboard-inquiries.css`.
  2. Pindahkan `.adm-usr-*`, `.adm-cap-*`, dan `.adm-ctc-*` (`admin.css` eks `L4850–L4909`, `L5030–L5182`, ~213 baris, 0 hex) ke `public/css/admin/page-org-contact.css`.
  3. Hapus blok sumber dari `admin.css` dan daftarkan di peta `PAGE_STYLES` pada `views/partials/admin-header.ejs` (`dashboard`/`inquiries`/`leads` &rarr; `page-dashboard-inquiries.css`; `users`/`capabilities`/`contact-cms` &rarr; `page-org-contact.css`).
- **Referensi Pola:** `public/css/admin/page-auth.css`.
- **Batasan Negatif:** Dilarang mengubah class bersama tabel/paginasi maupun sticky action Contact CMS.
- **Skill Relevan:** `antislop-code`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/admin/page-dashboard-inquiries.css && node scripts/lint-views.js public/css/admin/page-org-contact.css && npm run lint:views`.

### [x] T-426 `[Tier: Hydrogen Medium]` — Ekstraksi `admin/page-catalog.css` + Migrasi 23 Hex
- **File Terdampak (3 file):** `public/css/admin/page-catalog.css` (baru), `public/css/admin.css`, `views/partials/admin-header.ejs`.
- **Langkah & Kontrak Eksplisit:**
  1. Pindahkan `.prod-gallery-*`, `.adm-pcat-*`, `.adm-brd-*`, `.adm-prod-*`, serta responsive `.prod-gallery-*` (`admin.css` eks `L2741–L2868`, `L2904–L2908`, `L4742–L4799`, `L4910–L5029`, `L6237–L6304`, `L7557–L7570`, `L7643–L7647`, ~395 baris) ke `public/css/admin/page-catalog.css`.
  2. Migrasikan seluruh 23 warna hex mentah (blok `.prod-gallery-*`) ke token `admin/tokens.css`.
  3. Hapus blok sumber dari `admin.css` dan daftarkan di `PAGE_STYLES` pada `views/partials/admin-header.ejs` (`products`/`product-categories`/`brands` &rarr; `page-catalog.css`).
- **Referensi Pola:** `public/css/admin/page-dashboard-inquiries.css`.
- **Batasan Negatif:** Dilarang menghapus `.prod-gallery-wrap`, `.prod-gallery-thumb`, `.prod-gallery-btn-move` (kontrak `test-task-202-admin-form.js` & `test-product-detail-redesign-qa.js`).
- **Skill Relevan:** `antislop-code`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/admin/page-catalog.css && npm run lint:views`.

### [ ] T-427 `[Tier: Hydrogen Medium]` — Ekstraksi `admin/page-product-editors.css` & `admin/page-home.css`
- **File Terdampak (4 file):** `public/css/admin/page-product-editors.css` (baru), `public/css/admin/page-home.css` (baru), `public/css/admin.css`, `views/partials/admin-header.ejs`.
- **Langkah & Kontrak Eksplisit:**
  1. Pindahkan `.prod-size-*`, `.btn-col-*`, `.btn-row-*`, dan `.adm-var-*` (`admin.css` eks `L2934–L3095`, `L7648–L7845`, ~355 baris, 0 hex) ke `public/css/admin/page-product-editors.css`.
  2. Pindahkan `.adm-home-*` (`admin.css` eks `L6305–L6534`, ~230 baris, 0 hex) ke `public/css/admin/page-home.css`.
  3. Hapus blok sumber dari `admin.css` dan daftarkan di `PAGE_STYLES` pada `views/partials/admin-header.ejs` (`products` &rarr; tambah `page-product-editors.css` setelah `page-catalog.css`; `home-content` &rarr; `page-home.css`).
- **Referensi Pola:** `public/css/admin/page-catalog.css`.
- **Batasan Negatif:** Dilarang mengubah perilaku tombol `.adm-var-btn-move` atau responsif tabel ukuran produk.
- **Skill Relevan:** `antislop-code`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/admin/page-product-editors.css && node scripts/lint-views.js public/css/admin/page-home.css && npm run lint:views`.

### [ ] T-428 `[Tier: Hydrogen Medium]` — Ekstraksi `admin/page-content-cms.css`
- **File Terdampak (3 file):** `public/css/admin/page-content-cms.css` (baru), `public/css/admin.css`, `views/partials/admin-header.ejs`.
- **Langkah & Kontrak Eksplisit:**
  1. Pindahkan `.adm-postcat-*`, `.adm-hbn-*`, `.adm-media-*`, `.adm-banner-*`, dan `.adm-post-*` (`admin.css` eks `L4800–L4849`, `L5183–L5314`, `L5906–L6236`, `L7457–L7477`, ~530 baris, 0 hex) ke `public/css/admin/page-content-cms.css`.
  2. Hapus blok sumber dari `admin.css` dan daftarkan di `PAGE_STYLES` pada `views/partials/admin-header.ejs` (`posts`/`post-categories`/`media`/`banners`/`hero-banners` &rarr; `page-content-cms.css`).
- **Referensi Pola:** `public/css/admin/page-catalog.css`.
- **Batasan Negatif:** Dilarang mengubah gaya grid `.adm-media-*` atau pratinjau mockup `.adm-hbn-*`.
- **Skill Relevan:** `antislop-code`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/admin/page-content-cms.css && npm run lint:views`.

### [ ] T-429 `[Tier: Argon Medium]` — Ekstraksi `admin/page-about.css` & `admin/page-settings.css` + Penghapusan Monolit `public/css/admin.css`
- **File Terdampak (4 file):** `public/css/admin/page-about.css` (baru), `public/css/admin/page-settings.css` (baru), `public/css/admin.css` (dihapus), `views/partials/admin-header.ejs`.
- **Langkah & Kontrak Eksplisit:**
  1. Pindahkan `.adm-abt-*` (`admin.css` eks `L6535–L6950`, ~416 baris, 0 hex) ke `public/css/admin/page-about.css`.
  2. Pindahkan `.stg-*` (`admin.css` eks `L4127–L4548`, ~422 baris, 0 hex) ke `public/css/admin/page-settings.css`.
  3. Verifikasi `public/css/admin.css` telah kosong 100% (0 rule tersisa), lalu **hapus `public/css/admin.css`** serta hapus tag `<link href="/css/admin.css...">` dari `views/partials/admin-header.ejs`.
  4. Finalisasi peta `PAGE_STYLES` di `views/partials/admin-header.ejs` mencakup seluruh 9 berkas `page-*.css` (`about` &rarr; `page-about.css`, `settings` &rarr; `page-settings.css`) sesuai `tech/admin-ui-css.md` Bagian 4.
- **Referensi Pola:** `public/css/admin/page-home.css`.
- **Batasan Negatif:** Dilarang menghapus `.stg-footer-item*`, `.is-near-limit`, `.is-at-limit`, `.is-full`; nesting EJS maksimal 2 level.
- **Skill Relevan:** `antislop-code`.
- **Verifikasi Deterministik:** `node scripts/lint-views.js public/css/admin/page-about.css && node scripts/lint-views.js public/css/admin/page-settings.css && npm run lint:views`.

### [ ] T-430 `[Tier: Argon Medium]` — Finalisasi Entry `login.ejs` & `403.ejs`, Penegakan Strict Lint (`scripts/lint-views.js`) & Unit Test Modular
- **File Terdampak (4 file):** `views/admin/login.ejs`, `views/admin/403.ejs`, `scripts/lint-views.js`, `tests/test-admin-css-modular.js` (baru).
- **Langkah & Kontrak Eksplisit:**
  1. Perbarui `<link>` di `views/admin/login.ejs` (ganti `/css/admin.css` ke subset minimal: `/css/admin/tokens.css`, `/css/admin/buttons.css`, `/css/admin/forms-inputs.css`, `/css/admin/page-auth.css`) dan `views/admin/403.ejs` (`/css/admin/tokens.css`, `/css/admin/buttons.css`, `/css/admin/page-auth.css`).
  2. Perbarui `scripts/lint-views.js`: kecualikan secara eksplisit hanya `public/css/tokens.css` dan `public/css/admin/tokens.css`, lalu tambahkan `'public/css/admin/'` ke `DEFAULT_STRICT_PATHS` (blocking error untuk `no-raw-hex-css`).
  3. Buat `tests/test-admin-css-modular.js` (`node:test`) yang memverifikasi: (a) seluruh 21 file `public/css/admin/*.css` <= 620 baris, (b) 0 hex mentah di luar `admin/tokens.css`, (c) 0 duplikat selector konteks sama, (d) 8 token wajib zero-blue hadir di `admin/tokens.css`, (e) 0 dari 18 class mati hadir kembali, dan (f) seluruh `<link href="/css/admin/...">` di `admin-header.ejs`, `login.ejs`, dan `403.ejs` menunjuk berkas fisik valid.
- **Referensi Pola:** `scripts/lint-views.js` (`DEFAULT_STRICT_PATHS`) & `tests/test-seed-snapshot.js` (`node:test`).
- **Batasan Negatif:** Dilarang memodifikasi CSS/view publik atau menurunkan aturan strict lint existing.
- **Skill Relevan:** `antislop-code`.
- **Verifikasi Deterministik:** `npm run lint && npm run lint:views && npm run lint:i18n && node --test tests/test-admin-css-modular.js && npm run test:seed`.

### [ ] T-431 `[Tier: Hydrogen Medium]` — Helper Pembaca CSS Admin (`readAdminCss.js`) & Sinkronisasi 13 Skrip Tes QA Historis
- **File Terdampak:** `tests/helpers/readAdminCss.js` (baru) + pembaruan path pada 12 skrip tes `fs.readFileSync('public/css/admin.css')` & 1 skrip mock Playwright (`tests/test-t257-buttons-playwright.js`) di `tests/`.
- **Langkah & Kontrak Eksplisit:**
  1. Buat `tests/helpers/readAdminCss.js` mengekspor `readAllAdminCss()` (gabungan berurutan 21 berkas `public/css/admin/*.css`) dan `readAdminTokensCss()`.
  2. Arahkan pembacaan `admin.css` pada `test-rebrand-zero-blue.js`, `test-dropdown-css.js`, `test-dropdown-animations.js`, `test-dropdown-interactive.js`, `test-admin-dropdown-migration.js`, `test-product-admin-cta-qa.js`, `test-product-detail-redesign-qa.js`, `test-task-202-admin-form.js`, `test-t258..t260`, dan `test-rebrand-visual-functional.js` (cek HTML login terhadap `admin/page-auth.css`) ke helper bersama.
  3. Selaraskan 2 assertion tes lama terhadap Keputusan 6b & 1a: hapus `'.eu-dd-error-msg'` di `tests/test-dropdown-css.js:49` (ganti cek `.eu-dd.is-invalid`), dan perbarui `<link>` mock di `tests/test-t257-buttons-playwright.js:69` ke `/css/admin/tokens.css` + `/css/admin/buttons.css` serta ganti uji `.adm-btn-spinner` (`L112, L279`) ke `.adm-btn.is-loading`.
  4. Jalankan skrip tes non-browser untuk memastikan 100% lulus.
- **Referensi Pola:** `tests/test-rebrand-zero-blue.js`.
- **Batasan Negatif:** Dilarang melonggarkan assertion kontrak warna hijau, kontras WCAG, atau selector aktif pada skrip tes.
- **Skill Relevan:** `antislop-code`.
- **Verifikasi Deterministik:** `node tests/test-rebrand-zero-blue.js && node tests/test-dropdown-css.js && node tests/test-product-admin-cta-qa.js && node tests/test-task-202-admin-form.js && npm run lint`.

### [ ] T-432 `[Tier: Argon Medium]` — QA Regresi Visual & Fungsional Playwright End-to-End (16 Rute × 5 Viewport + Zoom 125%)
- **File Terdampak (1–2 file):** `tests/test-admin-css-visual-qa.js` (baru) + bukti screenshot sementara di direktori scratch (tidak di-commit).
- **Langkah & Kontrak Eksplisit:**
  1. Jalankan server lokal dan uji via Playwright headless pada seluruh 16 rute Admin CMS: `/admin/login`, `/admin/403` (simulasi role editor), `/admin/dashboard`, `/admin/inquiries`, `/admin/products` (+ create/edit), `/admin/product-categories`, `/admin/brands`, `/admin/posts` (+ create/edit TinyMCE), `/admin/media` (+ modal Media Picker & tab Upload), `/admin/banners`, `/admin/hero-banners`, `/admin/about`, `/admin/home-content`, `/admin/contact`, `/admin/settings`, `/admin/users`, `/admin/change-password`.
  2. Verifikasi pada **5 viewport** (`320px`, `375px`, `768px`, `1024px`, `1440px`) + **zoom 125% / tinggi pendek (`720px`)** saat modal Media Picker & modal Copy Size Table terbuka.
  3. Pastikan: (a) 0 console error & 0 uncaught pageerror, (b) 0 HTTP 404/500 pada `/css/admin/*.css`, (c) 0 horizontal overflow (`scrollWidth <= innerWidth + 1`), (d) tinggi `.eu-dd-trigger` == `38px` desktop & `>= 44px` mobile `<=768px`, (e) target sentuh `.adm-btn` `>= 44px` di mobile, (f) modal panjang tetap scrollable dengan footer terlihat, dan (g) halaman publik `/` & `/products` tidak terdampak.
- **Referensi Pola:** `tests/test-t259-form-validation-playwright.js` & `tests/test-t260-sweetalert-csp-playwright.js`.
- **Batasan Negatif:** Dilarang memodifikasi data DB produksi/snapshot, meninggalkan akun tes di DB, atau mengubah CSS publik.
- **Skill Relevan:** `browser-testing-with-devtools`, `antislop-layoutmobile`.
- **Verifikasi Deterministik:** `node tests/test-admin-css-visual-qa.js && npm run lint && npm run lint:views && npm run lint:i18n && npm test`.
