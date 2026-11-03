Status: ACTIVE | Terakhir diverifikasi: 2026-11-03 | Kode: eslint.config.js, scripts/lint-views.js, scripts/lint-i18n.js, views/

# Tech Spec: Konvensi Kode & Standar Kualitas (Code Conventions & Standards)

## 1. Arsitektur & Prinsip Umum
Dokumen ini mendefinisikan standar mutu teknis terukur dan dapat diverifikasi oleh mesin untuk arsitektur backend Express.js, template frontend EJS, lembar gaya CSS, dan tooling linting otomatis PT Euodoo.

---

## 2. Standar Template Frontend (EJS)

### A. Pemisahan Perhatian (Separation of Concerns)
- Template EJS hanya berfungsi sebagai lapisan presentasi murni.
- Dilarang keras memuat query basis data, manipulasi struktur data mentah, kalkulasi bisnis kompleks, atau mutasi data di dalam template. Seluruh data wajib dipersiapkan secara siap konsumsi oleh Controller atau Service sebelum dikirim ke `res.render()`.

### B. Halaman Ramping & Partial Modular
- Template halaman utama wajib berupa berkas ramping (*thin page*) yang mengorkestrasikan partial per section.
- Konvensi path partial: `views/partials/<nama-halaman>/<nama-section>.ejs` atau `views/admin/<modul>/partials/<nama-section>.ejs`.
- Batas ukuran file partial: maksimal **~100 baris**.
- Blok berulang (seperti baris media picker, form group, atau baris dinamis) wajib diekstraksi menjadi partial mandiri dengan variabel `locals` eksplisit.

### C. Larangan Keras Gaya, Warna & Skrip Inline
- **Dilarang Inline Style Baru:** Atribut `style="..."` dilarang ditambahkan pada elemen markup baru atau yang sedang direfaktor.
- **Dilarang Warna Hex Langsung:** Dilarang mencantumkan kode warna hex secara langsung pada berkas `.ejs` maupun berkas CSS komponen. Seluruh pewarnaan wajib merujuk ke token desain CSS resmi (`var(--bg-subtle)`, `var(--color-primary)`, `var(--color-border)`, `var(--surface-dark-deep)`, dsb.).
- **Dilarang Skrip Inline:** Seluruh JavaScript perilaku wajib diletakkan pada berkas `.js` eksternal terpisah di direktori `public/js/`. Tag `<script>` inline dilarang.
- **Dilarang Handler Event Inline:** Dilarang menggunakan atribut event handler inline HTML (`onclick=`, `onchange=`, `onsubmit=`, `onerror=`). Seluruh interaksi wajib didaftarkan melalui `addEventListener` di berkas JavaScript eksternal.
- **Eliminasi Komentar HTML Frontend:** Dilarang menyisakan komentar HTML `<!-- ... -->` pada template frontend. Gunakan penamaan class, id, file, dan struktur elemen semantik sebagai pengganti dokumentasi.

### D. Nesting, Helper, & Batas Lokalisasi (i18n)
- **Nesting Maksimal 2 Level:** Kedalaman percabangan (`<% if %>`) dan perulangan di template dibatasi maksimal 2 tingkat. Jika lebih, wajib dipecah menjadi partial atau diolah pada controller.
- **Helper Formatting:** Pemformatan tanggal, mata uang, dan normalisasi URL wajib melalui helper `res.locals` / `app.locals`.
- **Teks Publik (Keputusan 4):** Seluruh teks yang tampil ke pengunjung publik wajib menggunakan helper terjemahan `t('key')` atau `__('key')` yang terdaftar pada kamus `locales/id.json` dan `locales/en.json`. Konten dwibahasa database di publik wajib dipilih lewat helper terpusat (bukan percabangan inline ternary yang tersebar).
- **Teks Admin (Keputusan 4):** Antarmuka Admin CMS tetap menggunakan teks literal Bahasa Indonesia baku dan tidak diwajibkan menggunakan helper terjemahan `t()`.
- **Style Dinamis Database (Keputusan 2):** Pada halaman view yang direfaktor, status tampilan dinamis (seperti preview media picker) dikendalikan melalui penandaan class status semantik (`.is-empty`, `.has-preview`) pada markup dan CSS statis tanpa inline style.

---

## 3. Standar Backend (Express.js)

### A. Alur Arsitektur Berlapis
- Alur pemrosesan: `Route` &rarr; `Controller` &rarr; `Service` &rarr; `Model`.
- Controller hanya bertugas mem-parsing dan memvalidasi permintaan (`req.params`, `req.query`, `req.body`), mendelegasikan logika ke Service, serta merender tampilan atau mengembalikan respons JSON.
- Model bertugas mengelola interaksi query basis data dan skema.
- *Catatan Transisi:* Penerapan lapisan `Service` diimplementasikan secara bertahap pada fitur baru dan modul yang masuk siklus refaktor.

### B. Batasan Metrik & Kompleksitas Kode
- **Panjang Fungsi:** Maksimal **40 baris kode** (tidak termasuk baris komentar).
- **Panjang Berkas:** Maksimal **300 baris kode**.
- **Kedalaman Bersarang (Nesting Depth):** Maksimal **2 level**.
- **Kompleksitas Siklomatis:** Maksimal **8** per fungsi.
- **Pola Penulisan:** Wajib menerapkan *early return* (guard clauses) untuk mengeliminasi percabangan bersarang, tanpa angka ajaib (*magic numbers*), dan tanpa kode mati (*dead code*).

---

## 4. Tooling Linting & Skrip Otomasi

### A. Flat ESLint (`eslint.config.js`)
- Menggunakan ESLint v9 Flat Config native ESM (`"type": "module"`).
- Dikonfigurasi terpisah untuk lingkungan Node.js backend dan browser frontend (`public/js/`).
- Paket linter terpasang eksklusif pada `devDependencies` (`eslint`, `@eslint/js`, `globals`) sehingga tidak diinstal pada lingkungan produksi cPanel/Passenger.
- Dijalankan via `npm run lint`.

### B. Skrip Pemeriksa Template (`scripts/lint-views.js`)
- Memindai seluruh `views/**/*.ejs` dan berkas CSS komponen terhadap pelanggaran:
  1. Keberadaan atribut `style="..."`.
  2. Keberadaan warna hex mentah (kecuali pada `public/css/tokens.css`).
  3. Keberadaan tag `<script>` inline tanpa atribut `src`.
  4. Keberadaan komentar HTML `<!-- ... -->`.
  5. Keberadaan atribut handler inline `on*=`.
  6. Heuristik teks literal pada view publik (sebagai peringatan lunak / warning).
- Format pelaporan: `file:baris:kolom - pesan pelanggaran`. Dijalankan via `npm run lint:views`.

### C. Skrip Audit Kamus Bahasa (`scripts/lint-i18n.js`)
- Memverifikasi simetri rekursif pasangan kunci antara `locales/id.json` dan `locales/en.json`.
- Memverifikasi pemanggilan helper `t('...')` pada view publik terhadap kamus. Dijalankan via `npm run lint:i18n`.

### D. Strategi Penegakan Baseline Lint (Keputusan 1)
- **File Lama / Legacy:** Ditandai pada level *warning* (non-blocking) agar tidak menghentikan operasional repo.
- **File Baru & File Refaktor:** Ditandai pada level *error* ketat (blocking). Perintah `npm run lint` dan `npm run lint:views` wajib lolos hijau tanpa error pada berkas yang disentuh sebelum task dapat ditutup (*Close*).

---

## 5. Hierarki Aturan & Isolasi Komponen

### A. Hierarki terhadap Skill Otomasi
- Aturan modularitas struktur view pada dokumen ini **MENANG MUTLAK** atas saran perampingan kode berbasis skill penghemat (seperti `ponytail`). Memecah template besar menjadi partial per section maksimal ~100 baris bukanlah kode berlebih (*bloat*), melainkan keharusan arsitektur.

### B. Isolasi Styling & Konvensi Class (Keputusan 3)
- Class baru wajib diberi prefix unik yang di-scope ke modul terkait (contoh: `.stg-*` untuk modul Pengaturan Situs).
- Dilarang memodifikasi class bersama (`.form-card`, `.form-group`, `.form-row-2`, `.adm-btn-*`, `.eu-dd-*`) tanpa izin proposal tersendiri.
- Nilai spasi dan ukuran komponen diekstraksi ke class komponen berprefix di `public/css/admin.css` dengan nilai tetap identik piksel, tanpa menambah token spasi baru di `tokens.css`.

