# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 7 Task (T-270 s/d T-276)
- **Total Task Selesai:** 269 Task (T-01 s/d T-269)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-277**.

---

## Task Aktif / Terbuka (Open Tasks)

### [ ] T-270: [Bug Fix] Perbaikan Sintaks HTML Unescaped Iframe Placeholder pada `views/admin/settings/index.ejs`
- **Modul:** Site Settings (`views/admin/settings/`)
- **Prioritas:** High
- **Status:** Todo
- **Dependensi:** None
- **Tanggal:** 2026-11-03
- **File yang diubah:** `views/admin/settings/index.ejs`
- **Deskripsi:** Memperbaiki karakter tag mentah `<iframe src='...'></iframe>` pada atribut `placeholder` input `#google_maps_embed` di baris 233 menjadi entitas aman `&lt;iframe src='...'&gt;&lt;/iframe&gt;` agar parser HTML dan validator editor tidak mengalami kegagalan hierarki tag penutup.
- **Acceptance Criteria:**
  - Karakter di atribut placeholder di-escape dengan benar sebagai entitas HTML.
  - Tag balance parser untuk `views/admin/settings/index.ejs` menghasilkan 0 error sintaks.
  - Tampilan visual placeholder pada browser tetap terbaca jelas tanpa distorsi form.

### [ ] T-271: [PENDING T-271] [Spek B.1 & B.5] Dokumentasi Spesifikasi `tech/conventions.md` & Integrasi Proses
- **Modul:** Code Conventions & Standards (`.agents/tech/conventions.md`)
- **Prioritas:** High
- **Status:** Todo
- **Dependensi:** None
- **Tanggal:** 2026-11-03
- **File yang diubah:** `.agents/tech/conventions.md`, `.agents/INDEX.md`, `AGENTS.md`, `.agents/AGENTS.md`, `.agents/WORKFLOW.md`, `.agents/tech/settings.md`
- **Deskripsi:** Menyusun dokumen spesifikasi teknis `tech/conventions.md` (ukuran <= 8KB), menautkan dari `INDEX.md`, memperbarui instruksi ringkas pada `AGENTS.md` (<= 30 baris), serta menambahkan gerbang kualitas lint hijau pada Definition of Done di `WORKFLOW.md` sesuai Keputusan 1 s/d 4.
- **Acceptance Criteria:**
  - `tech/conventions.md` aktif dengan batas fungsi <= 40 baris, file <= 300 baris, nesting <= 2, cyclomatic complexity <= 8, partial view <= 100 baris, dan larangan style/hex inline.
  - `INDEX.md` bertambah tepat 1 baris (total 33 baris <= 60 baris).
  - `AGENTS.md` bertambah 2 baris (total 22 baris <= 30 baris).
  - `WORKFLOW.md` memuat klausul lint hijau pada DoD tahap Implement dan Close.

### [ ] T-272: [PENDING T-272] [Spek B.2] Setup Tooling Flat ESLint Backend & Frontend Script
- **Modul:** Code Conventions & Standards (`eslint.config.js`)
- **Prioritas:** High
- **Status:** Todo
- **Dependensi:** T-271
- **Tanggal:** 2026-11-03
- **File yang diubah:** `package.json`, `package-lock.json`, `eslint.config.js`
- **Deskripsi:** Memasang paket linter ke `devDependencies` (`eslint`, `@eslint/js`, `globals`), membuat konfigurasi flat `eslint.config.js` native ESM, mengonfigurasi aturan ukuran/kompleksitas dengan strategi baseline (warning untuk file lama, error untuk file baru/refaktor sesuai Keputusan 1), dan mendaftarkan script `"lint": "eslint ."` pada `package.json`.
- **Acceptance Criteria:**
  - Paket linter terpasang murni pada `devDependencies` (tidak terpasang di deploy produksi cPanel/Passenger).
  - Berkas `eslint.config.js` memisahkan konfigurasi Node backend dan browser frontend (`public/js/`).
  - Eksekusi `npm run lint` berjalan valid tanpa crash.

### [ ] T-273: [PENDING T-273] [Spek B.3] Pembuatan Skrip Pemeriksa Kepatuhan Template `scripts/lint-views.js`
- **Modul:** Code Conventions & Standards (`scripts/lint-views.js`)
- **Prioritas:** High
- **Status:** Todo
- **Dependensi:** T-271
- **Tanggal:** 2026-11-03
- **File yang diubah:** `scripts/lint-views.js`, `package.json`
- **Deskripsi:** Membuat skrip pemeriksa mandiri ringan tanpa dependensi berat pada `scripts/lint-views.js` untuk memindai berkas `views/**/*.ejs` dan file CSS komponen terhadap `style="..."` inline, warna hex mentah, tag `<script>` inline, komentar HTML `<!-- -->`, dan handler inline `on*=`.
- **Acceptance Criteria:**
  - Format output: `file:baris:kolom - pesan pelanggaran`.
  - Tingkat penegakan modular (file baru/refaktor berstatus error; file lama berstatus warning sesuai Keputusan 1).
  - Didaftarkan pada `package.json` sebagai `"lint:views": "node scripts/lint-views.js"`.

### [ ] T-274: [PENDING T-274] [Spek B.4] Pembuatan Skrip Audit Kamus Bahasa `scripts/lint-i18n.js`
- **Modul:** Code Conventions & Standards (`scripts/lint-i18n.js`)
- **Prioritas:** Mid
- **Status:** Todo
- **Dependensi:** T-271
- **Tanggal:** 2026-11-03
- **File yang diubah:** `scripts/lint-i18n.js`, `package.json`
- **Deskripsi:** Membuat skrip audit kamus bahasa pada `scripts/lint-i18n.js` yang memverifikasi keselarasan kunci secara rekursif antara `locales/id.json` dan `locales/en.json`, serta memvalidasi pemanggilan `t('...')` di view publik.
- **Acceptance Criteria:**
  - Skrip mendeteksi kunci yang ada di ID tetapi hilang di EN (atau sebaliknya).
  - Gagal (*exit code 1*) bila ada asimetri kunci antar kamus bahasa resmi.
  - Didaftarkan pada `package.json` sebagai `"lint:i18n": "node scripts/lint-i18n.js"`.

### [ ] T-275: [PENDING T-275] [Spek B.6] Refaktor Modular Percontohan `views/admin/settings/index.ejs`
- **Modul:** Site Settings (`views/admin/settings/`)
- **Prioritas:** High
- **Status:** Todo
- **Dependensi:** T-270, T-271, T-273
- **Tanggal:** 2026-11-03
- **File yang diubah:** `views/admin/settings/index.ejs`, `views/admin/settings/partials/*.ejs`, `public/css/admin.css`
- **Deskripsi:** Merefaktor berkas `views/admin/settings/index.ejs` tanpa mengubah visual dan fungsionalitas:
  - Memecah halaman menjadi 5 partial modular per kartu section (`visual-identity-card.ejs`, `corporate-identity-card.ejs`, `dual-location-card.ejs`, `whatsapp-service-card.ejs`, `social-media-card.ejs`) masing-masing <= 100 baris.
  - Memindahkan seluruh 54 `style=""` inline dan 36 warna hex ke class CSS berprefix unik `.stg-*` di `public/css/admin.css` dengan nilai berbasis token resmi dan identik piksel (Keputusan 3).
  - Menghapus seluruh 17 komentar HTML frontend.
  - Mengelola status pratinjau media via class semantik (`.is-empty`, `.has-preview`) tanpa inline style (Keputusan 2).
- **Acceptance Criteria:**
  - `views/admin/settings/index.ejs` menjadi template ramping orkestrator (< 50 baris).
  - 100% style inline, warna hex, dan komentar HTML bersih dari template settings.
  - Seluruh berkas target lulus sempurna (*zero error*) pada `npm run lint:views`.

### [ ] T-276: [PENDING T-276] [Verifikasi C.1–C.4] Uji Regresi Visual, Fungsionalitas Setting, dan Pemeriksaan Lintas Halaman
- **Modul:** Site Settings & QA (`tests/`)
- **Prioritas:** High
- **Status:** Todo
- **Dependensi:** T-272, T-273, T-274, T-275
- **Tanggal:** 2026-11-03
- **File yang diubah:** Berkas pengujian dan laporan verifikasi
- **Deskripsi:** Menjalankan verifikasi komprehensif pada antarmuka Pengaturan Situs dan sistem:
  1. *Visual Check:* Membandingkan visual sebelum vs sesudah refaktor pada desktop, tablet, dan mobile (identik piksel).
  2. *Uji Fungsional Form:* Simpan POST form, upload/reset media favicon & logo, dual lokasi, toggle visibilitas, WhatsApp multi-number rolling 100%, CSRF token, dan validasi form tanpa error console browser.
  3. *Uji Regresi Lintas Halaman:* Eksekusi test suite eksisting (`test-t240-admin-ui.js`, `test-t242-wa-rolling.js`, `test-i18n-keys.js`). Memastikan halaman publik, halaman admin lain, dan Homepage (yang dibekukan) tidak mengalami regresi.
- **Acceptance Criteria:**
  - Seluruh test suite eksisting lulus hijau (100% PASS).
  - `npm run lint` dan `npm run lint:views` hijau tanpa error pada berkas yang disentuh.
  - Zero browser console errors pada `/admin/settings`.
