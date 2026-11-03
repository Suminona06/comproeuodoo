# PROPOSAL PERUBAHAN: Konvensi Kode, Tooling Linting, dan Refaktor Percontohan View Admin Settings

Tanggal: 2026-11-03  
Penulis: Antigravity (AI Pair Programmer)  
Target File Dokumen: `changes/2026-11-03_konvensi-kode-lint-refaktor.md`  
Status: TAHAP 2: APPROVED (Keputusan Terkunci oleh Azis, Menunggu Perintah Tahap 3: MERGE KE SPEC)

---

## 1. Konteks
Proposal ini menetapkan standar konvensi kode terukur berbasis mesin untuk view EJS dan JavaScript Express, menambahkan tooling linting (`eslint`, `lint:views`, `lint:i18n`), memperbaiki cacat markup HTML pada form pengaturan, serta melakukan refaktor percontohan pada `views/admin/settings/index.ejs` secara modular tanpa mengubah visual maupun fungsionalitas.

---

## 2. Temuan Awal Berdasarkan Pemeriksaan Kode (Read-Only)

### A. Tabel Metrik View EJS & Pelanggaran per Kategori
Pemeriksaan dilakukan secara otomatis terhadap seluruh 57 file `.ejs` pada direktori `views/` (total 10.447 baris kode) dan CSS komponen pada `public/css/`:

| Kategori Pelanggaran | Total Temuan | Admin (`views/admin/`, 35 file) | Publik (`views/public/`, 10 file) | Partials (`views/partials/`, 10 file) | Layouts (`views/layouts/`, 2 file) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Atribut `style="..."` Inline | **805** | 697 | 70 | 38 | 0 |
| Nilai Warna Hex di View | **183** | 112 | 44 | 27 | 0 |
| Tag `<script>` Inline (tanpa `src`) | **16** | 10 | 5 | 1 | 0 |
| Komentar HTML `<!-- ... -->` | **182** | 103 | 44 | 35 | 0 |
| Inline Event Handler `on*=` | **2** | 0 | 1 | 1 | 0 |

*Catatan Warna Hex pada CSS Komponen (`public/css/`):*
- `components.css`: 704 kemunculan hex
- `admin.css`: 322 kemunculan hex
- `layout.css`: 71 kemunculan hex
- `admin-tinymce.css`: 30 kemunculan hex
- `base.css`: 5 kemunculan hex
- `lightbox.css`: 0 kemunculan hex
- *(Sebagai pembanding, `tokens.css` mendefinisikan 113 variabel warna token resmi).* Total hex di luar file token: **1.132 kemunculan**.

### B. 10 File View EJS Terpanjang di Repositori
1. `views/admin/about/index.ejs` — **960 baris** (178 inline styles, 30 komentar HTML, 5 hex)
2. `views/admin/home-content/index.ejs` — **681 baris** (131 inline styles, 15 komentar HTML, 22 hex)
3. `views/public/index.ejs` — **582 baris** *(Status: DIBEKUKAN / Homepage freeze, tidak disentuh)*
4. `views/admin/products/edit.ejs` — **484 baris** (4 hex, 1 script inline)
5. `views/public/news.ejs` — **440 baris** (4 inline styles, 2 komentar HTML, 1 script inline, 1 hex)
6. `views/admin/products/create.ejs` — **432 baris** (2 hex, 1 script inline)
7. `views/public/contact.ejs` — **426 baris** (17 komentar HTML, 3 inline styles, 1 script inline)
8. `views/admin/settings/index.ejs` — **406 baris** *(Target Pilot Refaktor: 54 inline styles, 36 hex, 17 komentar HTML)*
9. `views/admin/inquiries/index.ejs` — **320 baris** (20 inline styles, 2 komentar HTML, 1 script inline, 1 hex)
10. `views/admin/dashboard.ejs` — **317 baris** (18 inline styles, 3 komentar HTML, 1 script inline, 1 hex)

### C. Lingkungan Eksekusi Node.js & Rencana Dependensi ESLint
- Versi aktif lingkungan: `node -v` &rarr; **`v24.20.0`**.
- Spesifikasi `package.json`: `"type": "module"`, field engines `"node": ">=20.0.0"`.
- Kompatibilitas ESLint: Versi stabil terbaru ESLint (v9.x) mensyaratkan Node.js `^18.18.0`, `^20.9.0`, atau `>=21.1.0`. Lingkungan aktif dan batas engine proyek sepenuhnya kompatibel untuk format Flat Config (`eslint.config.js`) native ESM.
- Isolasi Produksi: Paket linter (`eslint`, `@eslint/js`, `globals`) akan diinstal murni pada `devDependencies`. Deployment produksi berbasis cPanel / CloudLinux Passenger yang mengeksekusi `npm install --omit=dev` tidak akan membebani server produksi dengan paket linter.

### D. Mekanisme Lokalisasi & i18n Saat Ini
- **Penyimpanan Teks Statis:** Menggunakan kamus JSON berbasis dot-notation di `locales/id.json` dan `locales/en.json`.
- **Helper & Middleware:** Dikelola oleh `middleware/i18nMiddleware.js` yang menyuntikkan `res.locals.t` dan alias `res.locals.__` (fungsi `t(key, params)`).
- **Bahasa Cadangan (Fallback):** Bahasa Indonesia (`id`) adalah bahasa default dan cadangan jika terjemahan bahasa Inggris (`en`) tidak ditemukan; jika pada kamus `id` juga kosong, helper mengembalikan string key itu sendiri. Pilihan bahasa tersimpan di cookie `lang` selama 30 hari.
- **Konten Database:** Disimpan dalam kolom berpasangan dengan akhiran `_id` dan `_en` (contoh: `company_tagline_id` / `company_tagline_en`, `office_name_id` / `office_name_en`).
- **Pola di View Publik:** Konten database saat ini dipilih secara manual di dalam template melalui percabangan inline berulang: `currentLang === 'en' ? (item.field_en || item.field_id) : item.field_id` tanpa helper terpusat.
- **Pola di View Admin:** Area admin 100% menggunakan literal Bahasa Indonesia langsung (tercatat 0 pemanggilan helper `t()` di seluruh `views/admin/`).

### E. Kebijakan Keamanan Konten (CSP)
- Berdasarkan konfigurasi Helmet pada `app.js` (baris 42–55):
  - `style-src`: `["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com']`
  - `script-src`: `["'self'", "'unsafe-inline'", 'https://challenges.cloudflare.com']`
  - `scriptSrcAttr`: `["'self'", "'unsafe-inline'"]`
- Evaluasi: Atribut `style=""` inline saat ini masih ditoleransi oleh peramban karena keberadaan `'unsafe-inline'`. Namun, penghapusan style inline secara bertahap merupakan langkah penting untuk pemisahan presentasi-struktur serta mempersiapkan eliminasi `'unsafe-inline'` di masa mendatang.

### F. Pemilahan Diagnostik Editor pada `views/admin/settings/index.ejs`
Pemeriksaan kode terhadap indikator error "9+" pada file target pilot menghasilkan temuan konkret:
1. **Error Sintaks Nyata (Bug Markup):**
   - Ditemukan pada baris 233:
     ```html
     <input type="text" id="google_maps_embed" name="google_maps_embed" class="form-input" value="<%= settings.google_maps_embed || '' %>" placeholder="https://www.google.com/maps/embed?pb=... atau <iframe src='...'></iframe>">
     ```
   - Karakter `<iframe src='...'></iframe>` ditulis mentah di dalam atribut `placeholder` tanpa escape entitas HTML. Karakter `>` menutup tag `<input>` secara prematur bagi parser HTML dan membuat tag `</iframe>` dianggap sebagai penutup tag yang tidak pernah dibuka, merusak hierarki parsing untuk elemen `</div>` dan `</form>` di bawahnya.
   - Solusi: Ubah menjadi entitas aman: `&lt;iframe src='...'&gt;&lt;/iframe&gt;` (selaras dengan petunjuk hint di baris 234).
2. **False Positive Validator HTML terhadap Syntax EJS:**
   - Interpolasi atribut boolean checkbox tanpa nama atribut (baris 134, 180, 332, 346, 360, 373): `<input type="checkbox" ... <%= condition ? 'checked' : '' %>>` dianggap tidak valid oleh validator atribut HTML murni.
   - Interpolasi opsi select (baris 256–259): `<option value="..." <%= condition ? 'selected' : '' %>>`.
   - Penyisipan EJS di dalam nilai atribut style (baris 24, 25, 35, 49, 50, 60, 74, 75, 86) seperti `style="<%= condition ? '...' : '' %> color: #94a3b8;"` yang memicu kegagalan parser CSS editor.
   - Blok kontrol alur `<% if (...) { %>` di antara elemen tabel dan div.

---

## 3. Delta Spesifikasi per Modul

### A. Modul Baru: `tech/conventions.md` (Dokumen Baru &lt;= 8KB)
*Kondisi Lama:* Belum ada aturan konvensi kode tertulis yang terstandarisasi untuk template EJS dan JavaScript Express. Pembatasan hanya bergantung pada memori dan ulasan manual.  
*Kondisi Baru:* Dokumen acuan teknis `tech/conventions.md` mendefinisikan batasan terukur:
- View EJS murni presentasi, pemecahan partial section maksimal ~100 baris per file, larangan `style=""` inline, larangan warna hex mentah (wajib variabel token `var(--...)`), larangan skrip inline, larangan handler event inline `on*=`, eliminasi komentar HTML frontend, nesting maksimal 2 level, dan helper formatting.
- Backend Express arsitektur berlapis, batas fungsi maksimal 40 baris, batas file maksimal 300 baris, kompleksitas siklomatis &lt;= 8, nesting &lt;= 2, serta penerapan early return.

### B. Tautan & Instruksi Singkat di `AGENTS.md` (Maksimal 5 Baris)
*Kondisi Lama:*
```markdown
## Aturan Spesifikasi & Dokumentasi (.agents)
- **Baca `.agents/INDEX.md` dulu**, lalu **hanya** baca modul `prd/<modul>.md` dan `tech/<modul>.md` yang relevan dengan tugas. Dilarang membaca seluruh PRD/Tech Spec secara bersamaan.
- **Dilarang membaca direktori `.agents/archive/`** kecuali diminta secara eksplisit oleh pengguna.
- **Baca `.agents/3-TASKS.md` hanya saat mengerjakan atau menutup task.**
- **Wajib mengikuti alur kerja pada `.agents/WORKFLOW.md`** untuk setiap revisi perilaku, perubahan spek, atau penambahan fitur baru.
- **Dilarang menambah bagian "Revisi vN"** atau menyimpan narasi riwayat di dalam dokumen modul spek. Seluruh perubahan wajib menimpa kondisi lama di tempat (*current state only*).
- **Batas Ukuran:** Setiap berkas modul maksimal ~8KB, `.agents/INDEX.md` maksimal 60 baris. Jika melebihi batas, wajib dipecah menjadi sub-modul yang lebih spesifik.
```
*Kondisi Baru (Penambahan 3 baris instruksi tanpa menyalin isi aturan):*
```markdown
- **Wajib baca `.agents/tech/conventions.md`** sebelum menulis atau merefaktor kode template EJS, CSS, maupun backend JavaScript.
- **Gerbang Kualitas Lint:** Perintah `npm run lint` dan `npm run lint:views` wajib lolos (hijau tanpa error pada berkas yang disentuh) sebelum tugas dapat dinyatakan Close.
```

### C. Pembaruan `INDEX.md`
*Kondisi Lama (Baris 28):*
```markdown
| **Site Settings** | ACTIVE | 2026-11-02 | [prd/settings.md](prd/settings.md) | [tech/settings.md](tech/settings.md) | `controllers/admin/settingController.js` |
```
*Kondisi Baru (Penambahan 1 baris modul konvensi, total baris file menjadi 33 baris, jauh di bawah batas 60 baris):*
```markdown
| **Site Settings** | ACTIVE | 2026-11-02 | [prd/settings.md](prd/settings.md) | [tech/settings.md](tech/settings.md) | `controllers/admin/settingController.js` |
| **Code Conventions & Standards** | ACTIVE | 2026-11-03 | - | [tech/conventions.md](tech/conventions.md) | `eslint.config.js`, `scripts/lint-*.js` |
```

### D. Pembaruan `WORKFLOW.md` (Definition of Done)
*Kondisi Lama:*
```markdown
4. **IMPLEMENT:** Baru boleh implement setelah konfirmasi dan persetujuan Azis. Kerjakan kode aplikasi dan centang task yang tuntas.
5. **CLOSE (Sesi yang Sama):**
   - Hapus penanda `[PENDING T-xxx]` di modul terkait.
   - Pindahkan berkas proposal dari `changes/` ke `archive/`.
   - Pindahkan task selesai dari `3-TASKS.md` ke `archive/tasks-index-full.md`.
   - Perbarui tanggal verifikasi di modul terkait dan `INDEX.md`.
   - Tambahkan 1 baris entri di `CHANGELOG.md` (`tanggal | ringkas | T-xxx`).
```
*Kondisi Baru:*
```markdown
4. **IMPLEMENT:** Baru boleh implement setelah konfirmasi dan persetujuan Azis. Kerjakan kode aplikasi, pastikan `npm run lint` dan `npm run lint:views` hijau pada berkas terdampak, serta centang task yang tuntas.
5. **CLOSE (Sesi yang Sama):**
   - Verifikasi seluruh checklist pengujian dan linting hijau (zero error pada file baru/refaktor).
   - Hapus penanda `[PENDING T-xxx]` di modul terkait.
   - Pindahkan berkas proposal dari `changes/` ke `archive/`.
   - Pindahkan task selesai dari `3-TASKS.md` ke `archive/tasks-index-full.md`.
   - Perbarui tanggal verifikasi di modul terkait dan `INDEX.md`.
   - Tambahkan 1 baris entri di `CHANGELOG.md` (`tanggal | ringkas | T-xxx`).
```

---

## 4. Rancangan Isi Dokumen `tech/conventions.md` (Draft Konkret)

*(Catatan: Bagian ini merupakan rancangan aturan teknis yang akan dituangkan ke `tech/conventions.md` pada tahap Merge, tidak dibuat sebagai file terpisah saat ini).*

### A. Standar Template Frontend (EJS)
1. **Pemisahan Perhatian (Separation of Concerns):**
   - Template EJS hanya bertindak sebagai lapisan presentasi murni. Dilarang melakukan query database, kalkulasi bisnis rumit, manipulasi data mentah, atau parsing objek kompleks di dalam template.
   - Seluruh data wajib dipersiapkan dalam bentuk siap pakai oleh Controller atau Service sebelum dikirim ke `res.render()`.
2. **Arsitektur Halaman Ramping & Partial Modular:**
   - Template halaman utama wajib berupa berkas ramping (*thin page*) yang mengorkestrasi partial per section.
   - Konvensi path: `views/partials/<nama-halaman>/<nama-section>.ejs` atau `views/admin/<modul>/partials/<nama-section>.ejs`.
   - Batas ukuran satu file partial: maksimal **~100 baris**.
   - Blok berulang (seperti baris input media picker, form field dinamis, kartu entitas) wajib diekstraksi menjadi reusable partial dengan variabel `locals` yang eksplisit.
3. **Larangan Keras Gaya & Skrip:**
   - DILARANG menambahkan atribut `style="..."` inline baru.
   - DILARANG menuliskan kode warna hex (misal `#f8fafc`, `#00755a`) secara langsung di file `.ejs` maupun di file CSS komponen. Seluruh warna wajib merujuk ke token desain CSS resmi (`var(--bg-subtle)`, `var(--color-primary)`, dsb.).
   - DILARANG menambahkan tag `<script>` inline di tengah atau akhir file view. Seluruh JavaScript perilaku wajib diletakkan pada berkas `.js` terpisah di `public/js/`.
   - DILARANG menggunakan inline event handler HTML (seperti `onclick=`, `onchange=`, `onsubmit=`, `onerror=`). Seluruh penanganan interaksi wajib menggunakan `addEventListener` di file JS terpisah.
   - DILARANG menyisakan komentar HTML `<!-- ... -->` pada template frontend; gunakan penamaan file, id, class, dan struktur elemen yang semantik sebagai pengganti dokumentasi.
4. **Nesting & Alur Logika:**
   - Kedalaman percabangan (`<% if %>`) dan perulangan (`<% for %>` / `<% forEach %>`) di dalam satu template dibatasi maksimal **2 tingkat (level)**. Jika membutuhkan nesting lebih dalam, wajib dipecah menjadi sub-partial atau disederhanakan pada controller.
5. **Helper Formatting & URL:**
   - Pemformatan tanggal, pemformatan angka/mata uang, serta normalisasi URL gambar wajib memanfaatkan helper aplikasi (`res.locals` / `app.locals`), bukan ekspresi inline berulang di template.
6. **Standar Teks & Lokalisasi (i18n):**
   - Halaman publik (pengunjung): Dilarang menuliskan teks literal di template. Seluruh teks antarmuka wajib melalui helper `t('nav.home')` atau `__('key')` yang terdaftar pada kamus `locales/id.json` dan `locales/en.json`.
   - Pemilihan konten database dwibahasa di view publik wajib menggunakan satu helper terpadu (misal `pickLang(entity, fieldName)` atau disiapkan di controller), menghilangkan penulisan inline ternary `currentLang === 'en' ? ... : ...` yang berulang.
   - Halaman admin: Menggunakan teks literal Bahasa Indonesia yang konsisten dan baku (sesuai pola eksisting).

### B. Standar Backend (Express.js)
1. **Alur Arsitektur Berlapis:**
   - Alur permintaan: `Route` &rarr; `Controller` &rarr; `Service` &rarr; `Model`.
   - Controller hanya bertugas: membaca & memvalidasi parameter permintaan (`req.params`, `req.query`, `req.body`), memanggil service bisnis yang relevan, dan mengirimkan respons HTTP (`res.render` atau `res.json`).
   - Logika bisnis dan orkestrasi transaksi ditempatkan pada lapisan service; query SQL dan definisi skema ditempatkan pada model.
2. **Batasan Ukuran & Kompleksitas:**
   - Batas panjang fungsi: maksimal **40 baris kode** (tidak termasuk komentar).
   - Batas panjang berkas: maksimal **300 baris kode**.
   - Batas kedalaman bersarang (*nesting depth*): maksimal **2 level**.
   - Batas kompleksitas siklomatis (*cyclomatic complexity*): maksimal **8** per fungsi.
   - *Catatan Penyesuaian Realistis:* Untuk 9 file legacy yang saat ini melampaui 300 baris (seperti `productController.js` 846 baris), aturan ini ditegakkan sebagai *error* pada kode baru dan fungsi yang dimodifikasi, sedangkan file lama ditandai sebagai *warning* hingga jadwal refaktor modul bersangkutan tiba.
3. **Kualitas & Kebersihan Kode:**
   - Terapkan pola *early return* (guard clauses) untuk mengeliminasi blok `if-else` bersarang.
   - Dilarang menggunakan angka ajaib (*magic numbers*) atau konstanta string berulang; definisikan pada file konstanta (`config/constants.js`).
   - Dilarang membiarkan kode mati (*dead code*), impor yang tidak terpakai, atau fungsi tanpa pemanggil. Wajib mencari dan memanfaatkan helper/komponen yang sudah ada sebelum membuat utilitas baru.

### C. Ketentuan Umum & Hierarki Aturan
1. **Hierarki terhadap Skill Otomasi:**
   - Aturan modularitas dan pemecahan view di `tech/conventions.md` **MENANG MUTLAK** atas saran perampingan kode berbasis skill penghemat (seperti `ponytail`). Memecah view menjadi partial per section bukanlah "kode berlebih" (*bloat*), melainkan arsitektur yang diwajibkan untuk keterbacaan dan pemeliharaan.
2. **Isolasi Styling Komponen:**
   - Setiap class CSS baru wajib menggunakan prefix unik yang di-scope ke modul/halaman bersangkutan (contoh: `.stg-*` untuk Site Settings). Class bersama (`.form-card`, `.form-group`, `.form-row-2`, `.adm-btn-*`, `.eu-dd-*`) tidak boleh diubah strukturnya agar tidak memicu regresi visual pada halaman lain.

---

## 5. Keputusan Terkunci Azis (Tahap 2: APPROVE)

Seluruh 4 pertanyaan wajib telah dijawab dan dikunci secara definitif oleh Azis pada 2026-11-03:

1. **Strategi Penegakan Lint pada Kode Lama (Pertanyaan 1): Opsi A.**
   - Level *warn* untuk file lama/legacy yang belum direfaktor.
   - Level *error* ketat hanya untuk file baru dan file yang sedang direfaktor.
   - Cakupan penegakan level error diperluas secara bertahap seiring berjalannya refaktor modul berikutnya, menjaga build harian tetap stabil tanpa terhambat oleh hutang teknis lama.

2. **Penanganan Nilai Style Dinamis dari Database (Pertanyaan 2): Opsi C.**
   - Tidak ada kebutuhan style dinamis numerik di halaman percontohan `views/admin/settings/index.ejs`.
   - Pratinjau media picker dan toggle ditangani murni menggunakan class status (`.is-empty`, `.has-preview`) pada markup dan CSS statis.
   - Keputusan penggunaan inline CSS variable `style="--var:..."` ditunda hingga ditemukan modul yang benar-benar membutuhkan warna dinamis runtime dari database.

3. **Nilai Spasi & Ukuran Hardcode pada Refaktor Komponen (Pertanyaan 3): Opsi A.**
   - Seluruh nilai spasi, gap, lebar, dan tinggi pada komponen settings diekstraksi ke class CSS berprefix unik `.stg-*` di `public/css/admin.css` dengan nilai tetap identik piksel.
   - Tidak menambah token spasi baru ke `tokens.css` global.
   - Toleransi visual ditetapkan **identik piksel** untuk menjamin zero regresi tampilan.

4. **Batas Lokalisasi Antarmuka Admin (Pertanyaan 4): Opsi A.**
   - Antarmuka Admin CMS tetap menggunakan teks literal Bahasa Indonesia baku (literal diizinkan di admin).
   - Penggunaan helper terjemahan `t()` dan kewajiban sinkronisasi kamus dwibahasa (ID/EN) hanya berlaku mutlak untuk halaman publik (`views/public/`).

---

## 6. Rencana Task Implementasi (Mulai dari T-270)

Penomoran resmi melanjutkan dari urutan aktif `3-TASKS.md` (terakhir T-269, tanpa konflik di direktori `changes/`):

### [T-270] [Bug Fix] Perbaikan Sintaks HTML Unescaped Iframe Placeholder pada `views/admin/settings/index.ejs`
- **Kelompok:** A.1 (Bug Fix tanpa ubah spek)
- **Deskripsi:** Memperbaiki karakter mentah `<iframe src='...'></iframe>` pada atribut `placeholder` input `#google_maps_embed` di baris 233 menjadi entitas aman `&lt;iframe src='...'&gt;&lt;/iframe&gt;` agar parser HTML dan validator editor tidak mengalami kerusakaan hierarki tag penutup.
- **Acceptance Criteria:**
  - Karakter di atribut placeholder di-escape dengan benar.
  - Tag balance parser untuk `views/admin/settings/index.ejs` menghasilkan 0 error sintaks.
  - Tidak ada perubahan visual pada form; placeholder tetap terbaca jelas oleh admin.
- **File Terdampak:** `views/admin/settings/index.ejs`.
- **Skill Terkait:** `code-simplification`, `debugging-and-error-recovery`.
- **Verifikasi:** Script validasi parsing HTML lokal dan rendering halaman `/admin/settings`.

### [T-271] [Spek B.1 & B.5] Dokumentasi Spesifikasi `tech/conventions.md` & Integrasi Proses
- **Kelompok:** B.1 & B.5 (Perubahan Spesifikasi)
- **Deskripsi:** Membuat berkas spesifikasi teknis `tech/conventions.md` (ukuran &lt;= 8KB) sesuai butir 4, menambahkan tautan pada `INDEX.md`, menambahkan 2 butir instruksi gerbang kualitas pada `AGENTS.md` (&lt;= 5 baris), serta memperbarui Definition of Done pada `WORKFLOW.md`.
- **Acceptance Criteria:**
  - Berkas `tech/conventions.md` terbit dengan aturan terukur untuk EJS, Express, dan hierarki tooling.
  - `INDEX.md` bertambah tepat 1 baris (total 33 baris &lt;= 60 baris).
  - `AGENTS.md` bertambah &lt;= 5 baris tanpa duplikasi aturan rinci.
  - `WORKFLOW.md` memuat klausul lint hijau pada DoD tahap Implement dan Close.
- **File Terdampak:** `.agents/tech/conventions.md`, `.agents/INDEX.md`, `AGENTS.md`, `.agents/WORKFLOW.md`.
- **Skill Terkait:** `spec-driven-development`.
- **Verifikasi:** Validasi ukuran file (&lt;=8KB) dan jumlah baris `INDEX.md` (&lt;=60).

### [T-272] [Spek B.2] Setup Tooling Flat ESLint Backend & Frontend Script
- **Kelompok:** B.2 (Tooling)
- **Deskripsi:** Memasang paket linter ke `devDependencies` (`eslint`, `@eslint/js`, `globals`), membuat konfigurasi flat `eslint.config.js` berbasis ESM, mengonfigurasi aturan ukuran/kompleksitas (`max-lines: 300`, `max-lines-per-function: 40`, `max-depth: 2`, `complexity: 8`) dengan level penegakan sesuai Keputusan Pertanyaan 1, serta mendaftarkan script `"lint": "eslint ."` pada `package.json`.
- **Acceptance Criteria:**
  - Paket linter terpasang eksklusif pada `devDependencies`.
  - Berkas `eslint.config.js` memisahkan konfigurasi Node backend (`controllers/`, `models/`, `routes/`, `middleware/`, `utils/`) dan browser frontend (`public/js/`).
  - Menjalankan `npm run lint` menghasilkan eksekusi valid tanpa crash.
- **File Terdampak:** `package.json`, `package-lock.json`, `eslint.config.js`.
- **Skill Terkait:** `ci-cd-and-automation`.
- **Verifikasi:** Eksekusi `npm run lint`.

### [T-273] [Spek B.3] Pembuatan Skrip Pemeriksa Kepatuhan Template `scripts/lint-views.js`
- **Kelompok:** B.3 (Tooling)
- **Deskripsi:** Membuat skrip pemeriksa mandiri ringan tanpa dependensi berat pada `scripts/lint-views.js` untuk memindai berkas `views/**/*.ejs` dan file CSS komponen. Skrip memeriksa: keberadaan `style="..."`, kode warna hex mentah (kecuali pada `tokens.css`), `<script>` inline tanpa atribut `src`, komentar HTML `<!-- -->`, dan handler inline `on*=`.
- **Acceptance Criteria:**
  - Output skrip menampilkan format `file:baris:kolom - pesan pelanggaran`.
  - Tingkat keparahan (error vs warning) dikonfigurasi modular (file baru/refaktor berstatus error; file legacy berstatus warning sesuai Pertanyaan 1).
  - Skrip heuristik mendeteksi teks literal pada view publik sebagai peringatan lunak (*warning* non-blocking).
  - Skrip didaftarkan pada `package.json` sebagai `"lint:views": "node scripts/lint-views.js"`.
- **File Terdampak:** `scripts/lint-views.js`, `package.json`.
- **Skill Terkait:** `test-driven-development`.
- **Verifikasi:** Eksekusi `npm run lint:views` terhadap file uji dan repositori.

### [T-274] [Spek B.4] Pembuatan Skrip Audit Kamus Bahasa `scripts/lint-i18n.js`
- **Kelompok:** B.4 (Tooling)
- **Deskripsi:** Membuat skrip validasi integritas kamus bahasa pada `scripts/lint-i18n.js` yang membandingkan keselarasan kunci secara rekursif antara `locales/id.json` dan `locales/en.json`, serta memverifikasi bahwa seluruh pemanggilan `t('...')` di `views/public/` memiliki entri terdaftar di kedua kamus.
- **Acceptance Criteria:**
  - Skrip mendeteksi kunci yang ada di ID tetapi hilang di EN (atau sebaliknya).
  - Gagal (*exit code 1*) jika ditemukan asimetri kunci antara kamus bahasa resmi.
  - Didaftarkan pada `package.json` sebagai `"lint:i18n": "node scripts/lint-i18n.js"`.
- **File Terdampak:** `scripts/lint-i18n.js`, `package.json`.
- **Skill Terkait:** `test-driven-development`.
- **Verifikasi:** Eksekusi `npm run lint:i18n` (terverifikasi hijau).

### [T-275] [Spek B.6] Refaktor Modular Percontohan `views/admin/settings/index.ejs`
- **Kelompok:** B.6 (Refaktor Percontohan View)
- **Deskripsi:** Merefaktor berkas `views/admin/settings/index.ejs` tanpa mengubah visual dan fungsionalitas sedikit pun:
  - Memecah halaman menjadi 5 partial modular per card:
    1. `views/admin/settings/partials/visual-identity-card.ejs` (Favicon, Logo Header, Logo Footer)
    2. `views/admin/settings/partials/corporate-identity-card.ejs` (Nama, Tagline, Email, Telepon)
    3. `views/admin/settings/partials/dual-location-card.ejs` (Kantor Jakarta, Pabrik Bandung, Embed Peta)
    4. `views/admin/settings/partials/whatsapp-service-card.ejs` (Nomor Utama, Tema Tombol, Pesan Pembuka, Repeater)
    5. `views/admin/settings/partials/social-media-card.ejs` (LinkedIn, Instagram, Facebook, YouTube)
  - Membuat partial pembantu untuk blok media picker dan toggle alamat agar tidak ada duplikasi form-group berulang.
  - Memindahkan seluruh 54 `style=""` inline dan 36 warna hex mentah ke class CSS berprefix unik `.stg-*` pada `public/css/admin.css` dengan nilai berbasis token resmi.
  - Membersihkan seluruh 17 komentar HTML frontend.
  - Memastikan setiap partial memiliki panjang &lt;= 100 baris.
- **Acceptance Criteria:**
  - `views/admin/settings/index.ejs` menjadi template ramping orkestrator (panjang &lt; 50 baris).
  - 100% style inline, warna hex, dan komentar HTML lenyap dari template settings.
  - File target lulus sempurna (*zero error / zero warning*) pada `npm run lint:views`.
- **File Terdampak:** `views/admin/settings/index.ejs`, `views/admin/settings/partials/*.ejs`, `public/css/admin.css`.
- **Skill Terkait:** `frontend-ui-engineering`, `code-simplification`, `impeccable`.
- **Verifikasi:** Render test suite, audit `lint:views`, dan verifikasi layout browser.

### [T-276] [Verifikasi & UI Polish] Uji Regresi Visual, Fungsionalitas Setting, dan Pemeriksaan Lintas Halaman
- **Kelompok:** C.1 s/d C.4 (Verifikasi, UI Polish & Regresi)
- **Deskripsi:** Menjalankan verifikasi komprehensif pada antarmuka Pengaturan Situs dan sistem secara keseluruhan:
  1. *Visual Check (C.1):* Membandingkan visual sebelum vs sesudah refaktor pada breakpoint desktop, tablet, dan mobile. Hasil visual terbukti 100% identik tanpa pergeseran layout.
  2. *Uji Fungsional Form (C.2):* Pengujian simpan form POST, upload/clear favicon dan logo, penyimpanan alamat dual lokasi, toggle switch visibilitas, dynamic repeater WhatsApp rolling 100%, sanitasi input server, CSRF token utuh, dan validasi form berjalan lancar tanpa error di console browser.
  3. *Uji Regresi Lintas Halaman (C.3 & C.4):* Menjalankan seluruh test suite terkait modul settings dan admin (`node tests/test-t240-admin-ui.js`, `node tests/test-t242-wa-rolling.js`, `node tests/test-i18n-keys.js`). Memastikan halaman admin lain, halaman publik, serta Homepage (yang dibekukan) tidak mengalami perubahan atau efek samping.
- **Acceptance Criteria:**
  - Seluruh test suite yang ada di repositori lulus hijau (100% PASS).
  - Perintah `npm run lint` dan `npm run lint:views` hijau tanpa error pada berkas yang disentuh.
  - Zero browser console errors pada `/admin/settings`.
- **File Terdampak:** Berkas pengujian dan laporan verifikasi.
- **Skill Terkait:** `impeccable`, `browser-testing-with-devtools`, `test-driven-development`.
- **Verifikasi:** Eksekusi test runner Node.js dan audit Playwright.

---

### Kandidat Refaktor Berikutnya (5 File View Terburuk Non-Homepage)
*(Daftar ini adalah backlog temuan untuk refaktor di masa depan, BUKAN task yang dikerjakan pada sesi ini)*:
1. `views/admin/about/index.ejs` — 960 baris, 178 inline styles, 30 komentar HTML, 5 hex (Total pelanggaran: 213).
2. `views/admin/home-content/index.ejs` — 681 baris, 131 inline styles, 15 komentar HTML, 22 hex (Total pelanggaran: 168).
3. `views/partials/media-picker-modal.ejs` — 106 baris, 28 inline styles, 17 hex mentah, 9 komentar HTML (Total pelanggaran: 54).
4. `views/public/capabilities.ejs` — 132 baris, 30 inline styles, 5 komentar HTML, 4 hex mentah (Total pelanggaran: 39).
5. `views/admin/banners/edit.ejs` — 257 baris, 30 inline styles, 5 komentar HTML, 1 script inline, 1 hex (Total pelanggaran: 37).

---

## 7. Dampak Ukuran Modul Spesifikasi
- **`.agents/INDEX.md`:** Saat ini 32 baris. Penambahan entri `tech/conventions.md` menambah 1 baris menjadi **33 baris** (jauh di bawah batas aman maksimal 60 baris).
- **`AGENTS.md`:** Saat ini 21 baris. Penambahan pointer 2 butir konvensi kode menambah 3 baris menjadi **24 baris** (singkat, padat, di bawah 5 baris penambahan).
- **`.agents/WORKFLOW.md`:** Saat ini 27 baris. Penambahan kriteria lint pada Definition of Done menambah 3 baris menjadi **30 baris** (jauh di bawah batas aman maksimal 40 baris).
- **`.agents/tech/conventions.md`:** Berkas spesifikasi baru dirancang memiliki ukuran sekitar **~5,5 KB s/d 6,5 KB** (berada di bawah batas maksimal 8 KB per file spesifikasi). Tidak diperlukan pemecahan sub-modul saat ini.

---

## 8. Rencana CLOSE
Setelah implementasi seluruh task (T-270 s/d T-276) disetujui, diuji, dan tuntas:
1. Menghapus penanda `[PENDING T-xxx]` pada modul `tech/conventions.md`.
2. Memindahkan berkas proposal ini dari `changes/2026-11-03_konvensi-kode-lint-refaktor.md` ke direktori arsip: `archive/2026-11-03_konvensi-kode-lint-refaktor.md`.
3. Memindahkan task T-270 s/d T-276 yang selesai dari `3-TASKS.md` ke `archive/tasks-index-full.md`.
4. Memperbarui tanggal verifikasi pada modul `INDEX.md`, `tech/conventions.md`, `tech/settings.md`, `prd/settings.md`, dan `tech/admin-cms.md` menjadi `2026-11-03`.
5. Menambahkan 1 baris entri pada `CHANGELOG.md`:
   ```markdown
   2026-11-03 | Konvensi kode terstandarisasi, flat ESLint, skrip lint-views & lint-i18n, perbaikan sintaks HTML, serta refaktor modular view admin settings | T-270 s/d T-276
   ```

