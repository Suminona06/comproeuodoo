Status: ACTIVE | Terakhir diverifikasi: 2026-11-09 | Kode: eslint.config.js, scripts/lint-views.js, scripts/lint-i18n.js, views/

# Tech Spec: Konvensi Kode & Standar Kualitas (Code Conventions & Standards)

## 1. Arsitektur & Prinsip Umum
Dokumen ini mendefinisikan standar mutu teknis terukur dan terverifikasi mesin untuk Express.js backend, template frontend EJS, lembar gaya CSS, dan tooling linting otomatis PT Euodoo.

---

## 2. Standar Template Frontend (EJS)

### A. Pemisahan Perhatian (Separation of Concerns)
- Template EJS hanya berfungsi sebagai lapisan presentasi murni.
- Dilarang keras query database, manipulasi struktur data mentah, kalkulasi bisnis kompleks, atau mutasi data di template. Data wajib disiapkan siap konsumsi oleh Controller/Service sebelum ke `res.render()`.

### B. Halaman Ramping & Partial Modular
- Template utama wajib berkas ramping (*thin page*) yang mengorkestrasikan partial per section.
- Konvensi path: `views/partials/<halaman>/<section>.ejs` atau `views/admin/<modul>/partials/<section>.ejs`.
- Batas ukuran file partial: maksimal **~100 baris**.
- Blok berulang (baris media picker, form group, baris dinamis) wajib diekstraksi ke partial dengan `locals` eksplisit.

### C. Larangan Keras Gaya, Warna & Skrip Inline
- **Dilarang Inline Style Baru:** Atribut `style="..."` dilarang pada elemen baru atau yang direfaktor.
- **Dilarang Warna Hex Langsung:** Dilarang warna hex mentah di `.ejs` maupun CSS komponen. Seluruh pewarnaan wajib merujuk ke token desain CSS resmi (`var(--color-primary)`, `var(--color-border)`, dll.).
- **Dilarang Skrip Inline:** Seluruh JS perilaku wajib di berkas `.js` eksternal di `public/js/`. Tag `<script>` inline dilarang.
- **Dilarang Handler Inline:** Dilarang event handler inline HTML (`onclick=`, `onchange=`, `onsubmit=`, `onerror=`). Seluruh interaksi wajib melalui `addEventListener` di JS eksternal.
- **Eliminasi Komentar HTML Frontend:** Dilarang menyisakan komentar HTML `<!-- ... -->`. Gunakan penamaan semantik elemen sebagai pengganti dokumentasi.

### D. Nesting, Helper, & Batas Lokalisasi (i18n)
- **Nesting Maksimal 2 Level:** Kedalaman percabangan (`<% if %>`) dan loop dibatasi maksimal 2 tingkat. Jika lebih, pecah ke partial atau olah di controller.
- **Helper Formatting:** Format tanggal, mata uang, normalisasi URL wajib via helper `res.locals`.
- **Teks Publik (Keputusan 4):** Seluruh teks publik wajib menggunakan helper `t('key')` / `__('key')` di `locales/*.json`. Konten dwibahasa DB dipilih via helper terpusat.
- **Teks Admin (Keputusan 4):** Antarmuka Admin CMS tetap menggunakan teks literal Bahasa Indonesia baku (tanpa `t()`).
- **Style Dinamis Database (Keputusan 2):** Pada view yang direfaktor, status dinamis (mis. preview media picker) dikendalikan class status semantik (`.is-empty`, `.has-preview`, `.adm-d-none`, `.adm-d-block`) dan CSS statis tanpa inline style.

---

## 3. Standar Backend (Express.js)

### A. Alur Arsitektur Berlapis
- Alur pemrosesan: `Route` &rarr; `Controller` &rarr; `Service` &rarr; `Model`.
- Controller hanya mem-parsing & validasi request (`req.params`, `req.query`, `req.body`), mendelegasikan logika ke Service, merender view, atau mengembalikan JSON.
- Model bertugas mengelola interaksi query basis data dan skema.

### B. Batasan Metrik & Kompleksitas Kode
- **Panjang Fungsi:** Maksimal **40 baris kode** (tanpa komentar).
- **Panjang Berkas:** Maksimal **300 baris kode**.
- **Kedalaman Bersarang (Nesting Depth):** Maksimal **2 level**.
- **Kompleksitas Siklomatis:** Maksimal **8** per fungsi.
- **Pola Penulisan:** Wajib *early return* (guard clauses) tanpa percabangan bersarang, tanpa *magic numbers*, dan tanpa *dead code*.

---

## 4. Tooling Linting & Skrip Otomasi

### A. Flat ESLint (`eslint.config.js`)
- ESLint v9 Flat Config native ESM terpisah untuk Node backend dan browser frontend (`public/js/`).
- Terpasang eksklusif pada `devDependencies` (`eslint`, `@eslint/js`, `globals`). Dijalankan via `npm run lint`.

### B. Skrip Pemeriksa Template (`scripts/lint-views.js`)
- Memindai `views/**/*.ejs` dan CSS komponen terhadap: (1) `style="..."`, (2) warna hex mentah (kecuali `tokens.css`), (3) `<script>` inline tanpa `src`, (4) komentar HTML `<!-- ... -->`, (5) handler inline `on*=`, (6) peringatan teks literal publik.
- Format: `file:baris:kolom - pesan`. Dijalankan via `npm run lint:views`.

### C. Skrip Audit Kamus Bahasa (`scripts/lint-i18n.js`)
- Memverifikasi simetri rekursif kunci antara `locales/id.json` dan `locales/en.json`, serta validasi `t('...')`. Dijalankan via `npm run lint:i18n`.

### D. Strategi Penegakan Baseline Lint (Keputusan 1)
- **File Legacy:** Ditandai *warning* (non-blocking).
- **File Baru & Refaktor:** Ditandai *error* ketat (blocking). Wajib lolos hijau sebelum task *Close*.

---

## 5. Hierarki Aturan & Isolasi Komponen

### A. Hierarki terhadap Skill Otomasi
- Aturan modularitas view **MENANG MUTLAK** atas saran perampingan berbasis skill penghemat (`ponytail`). Memecah template besar ke partial <=100 baris adalah keharusan arsitektur.

### B. Isolasi Styling & Konvensi Class (Keputusan 3)
- Class baru wajib berprefix unik yang di-scope ke modul (mis. `.stg-*` untuk Settings).
- Dilarang modifikasi class bersama (`.form-card`, `.form-group`, `.form-row-2`, `.adm-btn-*`, `.eu-dd-*`).
- Nilai spasi/ukuran diekstraksi ke class komponen di `public/css/admin.css` bernilai tetap piksel tanpa token spasi baru di `tokens.css`.

### C. Refaktor Massal View Admin & Pembersihan Skrip/CSS
- **Cakupan Bersamaan (Keputusan Opsi B):** Pada setiap modul admin yang direfaktor, selain template `.ejs`, berkas CSS (`public/css/admin.css`) dan skrip (`public/js/admin-*.js`) yang disentuh wajib sekaligus dibersihkan dari komentar tak perlu (`antislop-code`) dan warna hex lama (wajib dipetakan ke token CSS).
- **Status Tampilan Dinamis:** Seluruh logika toggle tampilan berbasis database menggunakan class status semantik statis (`.adm-d-none` / `.adm-d-block`, `.is-empty` / `.has-preview`) tanpa atribut `style="..."`.
- **Prefix Unik per Modul:** Auth: `.err403-*`, `.adm-login-*`, `.chpwd-*` | Kategori: `.adm-pcat-*`, `.adm-postcat-*` | Pengguna: `.adm-usr-*` | Merek: `.adm-brd-*` | Kapabilitas & Kontak: `.adm-cap-*`, `.adm-ctc-*` | Hero & Leads: `.adm-hbn-*`, `.adm-leads-*` | Inquiries & Dashboard: `.adm-inq-*`, `.adm-dash-*` | Shell & Partials: `.adm-shell-*`, `.adm-picker-*` | Paginasi Bersama: `.pgn-*` | Media & Banner: `.adm-media-*`, `.adm-banner-*` | Artikel & Produk: `.adm-post-*`, `.adm-prod-*` | Home & About: `.adm-home-*`, `.adm-abt-*`.
- **Strategi Eksekusi:** Satu batch per siklus dengan 5 gerbang verifikasi (lint views zero error/warning, npm run lint hijau, unit tests pass, bukti visual Playwright sebelum vs sesudah, CRUD tanpa error konsol).

