# Proposal: Gambar Dinamis Why Choose Us Beranda serta Penyeragaman Dimensi Dropdown Admin CMS

Tanggal: 2026-11-23 | Status: READY FOR FINAL APPROVAL (Keputusan 1c, 2a, 3a Terkunci)

---

## 1. Konteks
1. Seksi *Why Choose Us* (`.sec-why-us`) di beranda masih me-hardcode ilustrasi `/images/wcu-botanical.svg` di atas gradasi `--wcu-artbox-gradient` tanpa kontrol gambar dari CMS `/admin/home-content`.
2. Di Dashboard Admin (`public/css/admin.css`), dimensi dropdown `.eu-dd-trigger` (`--eu-dd-height: 52px`, `font-size: 14px`, `padding: 0 16px`) tidak seragam dengan `.form-input` (`~38px`, `font-size: 12.5px`, `padding: 8px 11px`) pada form Produk dan form Admin lainnya.
3. Proposal ini merinci pembaruan spek dan rencana task atomik berdasarkan keputusan terkunci Azis (**1c, 2a, 3a**): 1 gambar kustom penuh pada `.wcu-artbox` (`object-fit: cover`, bebas inline `style`), fallback SVG default (`object-fit: contain`), dan penyeragaman dropdown `38px` khusus Dashboard Admin (`>= 44px` di mobile).

---

## 2. Delta Spesifikasi per Modul

### A. `prd/public-home.md`
- **FR-05 (Kebijakan Konten Fallback & Kepatuhan CSP):**
  - *Kondisi Lama:* Menyajikan ilustrasi botani *Why Choose Us* secara statis sebagai aset eksternal `public/images/wcu-botanical.svg` tanpa kontrol media CMS.
  - *Kondisi Baru:* Admin dapat memilih 1 gambar utama/visual WCU (`home_wcu_image_url`) melalui Media Picker di `/admin/home-content` Tab 2; bila diisi, gambar mengisi penuh kotak artbox kanan (`.wcu-artbox`), dan bila kosong/dihapus, sistem otomatis kembali menampilkan `public/images/wcu-botanical.svg` di atas gradasi token default (`--wcu-artbox-gradient`) tanpa inline `style="..."` maupun warna hex langsung.

### B. `prd/public-home-sections.md`
- **Seksi 3: Why Choose Us (`.sec-why-us`, `.wcu-*`):**
  - *Kondisi Lama:* `.wcu-art` selalu menampilkan `/images/wcu-botanical.svg` dengan `object-fit: contain` di atas latar gradasi `--wcu-artbox-gradient`.
  - *Kondisi Baru:* Jika admin memilih gambar kustom di CMS, gambar tersebut mengisi penuh `.wcu-artbox` (`object-fit: cover`) menggantikan ilustrasi SVG beserta latar gradasi hijaunya sekaligus; jika kosong, kembali ke `/images/wcu-botanical.svg` (`object-fit: contain`) + `--wcu-artbox-gradient`. Kartu mengambang (`.wcu-float-card`) dan chip label (`.wcu-art-label`) tetap tampil rapi di atas gambar pada desktop dan tersembunyi di mobile (`<= 860px` / `< 768px`).

### C. `tech/public-home.md`
- **Seksi 3B (Kunci Pengaturan `settings`):**
  - *Kondisi Lama:* Daftar kunci `home_wcu_*` hanya mencakup teks editorial, `home_wcu_chip_icon`, `home_wcu_art_label_*`, `home_wcu_float_*`, dan `home_wcu_is_active`.
  - *Kondisi Baru:* Menambahkan kunci `home_wcu_image_url` di `models/homeContentModel.js` serta sanitasi path via `cleanOptPath` (`sanitizeSafePath`) pada `buildWcuSection()` di `services/homeContentService.js`.
- **Seksi 4 (Kontrak View-Model `whyChooseUs`):**
  - *Kondisi Lama:* `buildWcuViewModel` di `services/homeService.js` hanya mengembalikan field teks terformat, `chipIcon`, `artLabel`, dan `float*`.
  - *Kondisi Baru:* `buildWcuViewModel` turut mengembalikan `imageUrl` (path kustom atau fallback `/images/wcu-botanical.svg`) dan `hasCustomImage` (boolean) dengan menjaga batas ESLint (`<= 40` baris/fungsi, `complexity <= 8`).

### D. `tech/public-home-sections.md`
- **Seksi 1 (`why-choose-us.ejs`) & Seksi 2 (`.sec-why-us`, `.wcu-*`):**
  - *Kondisi Lama:* `views/partials/home/why-choose-us.ejs` merender `<img class="wcu-art" src="/images/wcu-botanical.svg">` secara statis dan `.sec-why-us .wcu-art` hanya memakai `object-fit: contain`.
  - *Kondisi Baru:* `why-choose-us.ejs` merender `.wcu-artbox` (dengan class modifier `.wcu-artbox--custom` saat `whyChooseUs.hasCustomImage` bernilai `true`) serta `<img src="<%= whyChooseUs.imageUrl %>" alt="" class="wcu-art <%= whyChooseUs.hasCustomImage ? 'wcu-art--custom' : '' %>">` 100% bebas inline `style="..."` dan lulus strict `npm run lint:views`. Di `public/css/components.css`, `.wcu-artbox--custom` mengganti latar gradasi dengan `var(--bg-subtle)` dan menyembunyikan lingkaran dekoratif `::before`/`::after`, sementara `.wcu-art--custom` memakai `object-fit: cover` (dan hover scale tanpa rotasi agar tidak menyisakan celah sudut).

### E. `prd/admin-ui.md`
- **FR-24 Poin 2 (Anatomi Komponen: Trigger Box):**
  - *Kondisi Lama:* Trigger Box dinyatakan memiliki tinggi standar 52-56px secara umum tanpa membedakan form Admin vs Publik.
  - *Kondisi Baru:* Khusus ruang lingkup Dashboard Admin, ukuran trigger dropdown standar diselaraskan menjadi `38px` (`font-size: 12.5px`, `padding: 0 11px`, `border-radius: var(--r-md)`) agar sejajar 1:1 dengan `.form-input` pada form admin (target sentuh mobile `<= 768px` tetap `>= 44px`), sementara form halaman publik mempertahankan ukuran input publiknya.

### F. `tech/admin-ui-dropdown.md`
- **Seksi 3B (Token Turunan & Cakupan `public/css/admin.css`):**
  - *Kondisi Lama:* `public/css/admin.css` memakai `--eu-dd-height: 52px;`, `padding: 0 16px`, `font-size: 14px` (`.eu-dd-trigger` & `.eu-dd-value`), dan `border-radius: var(--radius-lg, var(--r-md, 8px))` sehingga tidak sejajar dengan `.form-input` (`12.5px`, `padding: 8px 11px`, `border-radius: var(--r-md)`).
  - *Kondisi Baru:* Khusus `public/css/admin.css`: `--eu-dd-height` disesuaikan menjadi `38px`, `.form-input` / `.form-select` / `.form-control` dikunci `min-height: 38px;`, `.eu-dd-trigger` memakai `padding: 0 11px`, `font-size: 12.5px`, `border-radius: var(--r-md)`, `.eu-dd-value` memakai `font-size: 12.5px`, dan `@media (max-width: 768px)` tetap menjaga `min-height: 44px` pada `.eu-dd-trigger` dan `.eu-dd--sm .eu-dd-trigger`. Token dan CSS publik (`public/css/tokens.css`, `public/css/components.css`) tidak diubah.

---

## 3. Keputusan Terkunci (Hasil Konfirmasi Azis)

| No | Topik | Keputusan Terkunci | Dampak Implementasi |
| :--- | :--- | :--- | :--- |
| **1** | **Target Area Visual Dinamis WCU** | **Opsi 1c:** Satu Gambar Penuh di `.wcu-artbox` | Cukup 1 field Media Picker (`wcu_image_url` -> `home_wcu_image_url`). Saat terisi, gambar mengisi penuh `.wcu-artbox` menggantikan SVG dan gradasi `--wcu-artbox-gradient`; saat kosong, kembali ke `/images/wcu-botanical.svg` + `--wcu-artbox-gradient`. |
| **2** | **Perilaku `object-fit` Gambar Utama WCU** | **Opsi 2a:** Default `contain`, Kustom `cover` | `.wcu-art` tetap `object-fit: contain` untuk `/images/wcu-botanical.svg`, sedangkan `.wcu-art--custom` memakai `object-fit: cover` (dan hover tanpa rotasi) agar foto kustom menutup penuh `.wcu-artbox`. |
| **3** | **Cakupan Penyeragaman Dropdown `38px`** | **Opsi 3a:** Khusus Dashboard Admin (`public/css/admin.css`) | `--eu-dd-height: 38px` dan penyelarasan `.form-input` hanya diterapkan pada `public/css/admin.css` (`min-height: 44px` di `<= 768px`); `tokens.css` & `components.css` publik tetap utuh. |

---

## 4. Rencana Task (Medium-Ready, Mulai dari T-403)

### T-403: Backend Settings, Sanitasi & View-Model Gambar Dinamis Why Choose Us `[Tier: Argon Medium]`
- **File Terdampak (3 file):** `models/homeContentModel.js`, `services/homeContentService.js`, `services/homeService.js`.
- **Langkah Bernomor:**
  1. Di `models/homeContentModel.js`: tambahkan `image_url: ''` pada `getDefaults().why_choose_us`; baca `allSettings.home_wcu_image_url ?? ''` di `getHomeContentData()`; simpan `w.image_url` ke `home_wcu_image_url` di `updateHomeContent()`.
  2. Di `services/homeContentService.js`: tambahkan `image_url: cleanOptPath(b.wcu_image_url)` pada `buildWcuSection()` (memastikan nilai kosong tetap tersimpan `''` agar kembali ke SVG bawaan, serta path berbahaya diblokir `sanitizeSafePath`).
  3. Di `services/homeService.js`: definisikan `DEFAULT_WCU_IMAGE = '/images/wcu-botanical.svg'`, lalu pada `buildWcuViewModel()` kembalikan `imageUrl` (`wcu.image_url || DEFAULT_WCU_IMAGE`) dan `hasCustomImage` (`Boolean(wcu.image_url)`) dengan menjaga batas ESLint (`<= 40` baris/fungsi, `max-depth <= 2`, `complexity <= 8`).
- **Kontrak Data Eksplisit:**
  - Key tabel `settings`: `home_wcu_image_url`.
  - Field `req.body` pada `POST /admin/home-content`: `wcu_image_url` -> `why_choose_us.image_url`.
  - View-model `whyChooseUs`: `{ ..., imageUrl: string (default '/images/wcu-botanical.svg'), hasCustomImage: boolean }`.
- **Referensi Pola:** `buildIntroSection()` + `cleanOptPath()` di `services/homeContentService.js` dan `buildIntroViewModel()` di `services/homeService.js`.
- **Batasan Negatif:** Dilarang menyentuh file `.ejs`, `.css`, JS klien, atau section home selain `why_choose_us`; dilarang mengubah `database/seeds/snapshot.json`.
- **Skill:** `incremental-implementation`.
- **Verifikasi Deterministik:** `npm run lint` dan `npm run test:seed`.

### T-404: Form Media Picker Tab 2 Why Choose Us CMS Admin `[Tier: Hydrogen Medium]`
- **File Terdampak (2 file):** `views/admin/home-content/partials/tab-wcu.ejs`, `views/admin/home-content/partials/wcu-media-card.ejs` (ekstraksi partial baru agar kedua berkas `<= 100` baris sesuai `conventions.md`; `tab-wcu.ejs` saat ini 99 baris).
- **Langkah Bernomor:**
  1. Ekstrak blok kartu kolom kanan (`Artbox Ilustrasi & Kartu Mengambang`) beserta 1 kontrol Media Picker gambar utama WCU ke `views/admin/home-content/partials/wcu-media-card.ejs` (`<= 100` baris, nesting `<= 2`), lalu include dari `views/admin/home-content/partials/tab-wcu.ejs`.
  2. Di `wcu-media-card.ejs`, tambahkan komponen `.media-picker-component` untuk gambar WCU:
     - `input[type="hidden"]#home_wcu_image_url[name="wcu_image_url"]` (`value="<%= wcu.image_url || '' %>"`).
     - `.media-picker-preview-box` berisi `<img class="media-picker-preview-img ...">` dan `.media-picker-empty` (teks info bahwa saat kosong sistem otomatis menampilkan ilustrasi SVG bawaan + gradasi hijau).
     - `.media-picker-ctrls` berisi tombol `.btn-open-media-picker` (`data-target="home_wcu_image_url"`, `data-picker-type="image"`) dan `.btn-clear-media` (ditampilkan bila `wcu.image_url` ada).
  3. Perbarui teks hint label pita artbox di `wcu-media-card.ejs` bila masih menyebut "SVG" secara kaku, dan pastikan kedua file bebas inline `style="..."`, bebas raw hex, bebas komentar HTML, serta memakai Bahasa Indonesia baku (tanpa `t()`).
- **Kontrak Data Eksplisit:**
  - `input#home_wcu_image_url[name="wcu_image_url"]` (`data-target="home_wcu_image_url"`, `data-picker-type="image"`).
- **Referensi Pola:** Blok `.media-picker-component` di `views/admin/home-content/partials/tab-intro.ejs` (baris 57-79).
- **Batasan Negatif:** Dilarang memodifikasi `public/js/media-picker.js`, `tab-intro.ejs`, tab home-content lainnya, atau file CSS di task ini.
- **Skill:** `frontend-ui-engineering`, `antislop-ui`.
- **Verifikasi Deterministik:** `npm run lint:views` dan `npm run lint`.

### T-405: Render Gambar Penuh Dinamis WCU Bebas Inline Style di Beranda Publik `[Tier: Argon Medium]`
- **File Terdampak (2 file):** `views/partials/home/why-choose-us.ejs`, `public/css/components.css`.
- **Langkah Bernomor:**
  1. Di `views/partials/home/why-choose-us.ejs`: tambahkan modifier `.wcu-artbox--custom` pada `<div class="wcu-artbox <%= whyChooseUs.hasCustomImage ? 'wcu-artbox--custom' : '' %>" ...>` dan ubah elemen gambar menjadi `<img src="<%= whyChooseUs.imageUrl %>" alt="" class="wcu-art <%= whyChooseUs.hasCustomImage ? 'wcu-art--custom' : '' %>" aria-hidden="true" loading="lazy" decoding="async">` tanpa atribut `style="..."` inline.
  2. Di `public/css/components.css` seksi `.sec-why-us`:
     - Tambahkan `.sec-why-us .wcu-artbox--custom { background: var(--bg-subtle); }` dan `.sec-why-us .wcu-artbox--custom::before, .sec-why-us .wcu-artbox--custom::after { display: none; }` agar gradasi hijau dan lingkaran dekoratif tidak muncul di belakang gambar kustom.
     - Tambahkan `.sec-why-us .wcu-art--custom { object-fit: cover; z-index: 1; }` agar gambar kustom mengisi penuh `.wcu-artbox` (sementara `.wcu-art` bawaan tetap `object-fit: contain`).
     - Pada `@media (hover: hover)`, pastikan `.sec-why-us .wcu-artbox--custom:hover .wcu-art--custom { transform: scale(1.045); }` (tanpa `rotate(-0.4deg)` agar tepi foto full-bleed tidak menyisakan celah sudut).
  3. Pastikan `.wcu-art-label` (`z-index: 2`) dan `.wcu-float-card` (`z-index: 3`) tetap berada di atas `.wcu-art--custom`, serta viewport mobile (`<= 860px`) tetap menyembunyikan keduanya agar gambar tampil utuh.
- **Kontrak Data Eksplisit:**
  - Properti view-model: `whyChooseUs.imageUrl`, `whyChooseUs.hasCustomImage`.
  - Class CSS baru berprefix unik: `.sec-why-us .wcu-artbox--custom`, `.sec-why-us .wcu-art--custom`.
- **Referensi Pola:** `.sec-why-us .wcu-artbox` dan `.sec-why-us .wcu-art` di `public/css/components.css` (baris 3347-3426).
- **Batasan Negatif:** Dilarang menyentuh 7 section homepage lainnya (`hero-slider`, `intro`, `categories`, `certifications`, `brands-marquee`, `news`, `cta-global`); dilarang menggunakan `style="..."` atau warna hex di `why-choose-us.ejs`.
- **Skill:** `frontend-ui-engineering`, `antislop-ui`.
- **Verifikasi Deterministik:** `npm run lint:views`, `npm run lint:i18n`, `npm run lint`.

### T-406: Penyeragaman Dimensi Dropdown Admin (`.eu-dd`) 38px Sejajar `.form-input` di `public/css/admin.css` `[Tier: Hydrogen Medium]`
- **File Terdampak (1 file):** `public/css/admin.css`.
- **Langkah Bernomor:**
  1. Di `:root` `public/css/admin.css`, ubah `--eu-dd-height: 52px;` menjadi `--eu-dd-height: 38px;` (pertahankan `--eu-dd-height-sm: 36px;`).
  2. Pada selektor `.form-input, .form-select, .form-control` di `public/css/admin.css`, tetapkan `min-height: 38px;` dan `line-height: 1.4;` (tanpa mengubah `min-height: 90px` pada `.form-textarea`).
  3. Pada `.eu-dd-trigger` di `public/css/admin.css`, sesuaikan `min-height: var(--eu-dd-height, 38px);`, `padding: 0 11px;`, `font-size: 12.5px;`, dan `border-radius: var(--r-md, 8px);`; selaraskan `.eu-dd-value` menjadi `font-size: 12.5px;`, `.eu-dd-floating-label` `left: 10px;`, dan `.eu-dd-caret` `margin-left: 8px;`.
  4. Rapikan override lokal `.adm-var-group-header .eu-dd--sm .eu-dd-trigger` / `.eu-dd-value` agar konsisten, serta verifikasi `@media (max-width: 768px)` tetap mempertahankan `min-height: 44px;` untuk `.eu-dd-trigger` dan `.eu-dd--sm .eu-dd-trigger`.
- **Kontrak Data Eksplisit:**
  - Token `admin.css`: `--eu-dd-height: 38px;`
  - Class CSS terdampak: `.form-input`, `.form-select`, `.form-control`, `.eu-dd-trigger`, `.eu-dd-value`, `.eu-dd-floating-label`, `.eu-dd-caret`.
  - Dimensi desktop (`> 768px`): tinggi `38px`, `padding: 0 11px`, `font-size: 12.5px`, `border-radius: var(--r-md)`.
  - Dimensi mobile (`<= 768px`): `min-height: 44px` (target sentuh R-03).
- **Referensi Pola:** `.form-input` di `public/css/admin.css` (baris 1543-1554) dan `.adm-var-group-header .eu-dd--sm .eu-dd-trigger` di `public/css/admin.css` (baris 7701-7717).
- **Batasan Negatif:** Dilarang mengubah `public/css/tokens.css` maupun `public/css/components.css` (Keputusan 3 Opsi a agar form publik `/contact` tidak berubah); dilarang mengubah JS `public/js/admin-dropdown.js` atau `views/admin/products/partials/basic-info.ejs`.
- **Skill:** `antislop-ui`, `frontend-ui-engineering`.
- **Verifikasi Deterministik:** `npm run lint`, inspeksi visual & pengukuran bounding box Playwright di `/admin/products/create`, `/admin/home-content`, dan halaman admin lainnya.

### T-407: Unit Test (`homeService` & `homeContentService`) dan Verifikasi Regresi Visual Playwright Multi-Viewport `[Tier: Argon Medium]`
- **File Terdampak (1 file):** `tests/test-wcu-dynamic-media.js` (plus penyesuaian skrip `package.json` bila diinginkan agar ikut berjalan di `npm test`).
- **Langkah Bernomor:**
  1. Buat `tests/test-wcu-dynamic-media.js` memakai `node:test` dan `node:assert/strict` untuk menguji:
     - `buildWcuSection` di `services/homeContentService.js` (sanitasi path via `cleanOptPath`, penolakan `javascript:` / `//evil`, penyimpanan string kosong `''` saat gambar dihapus).
     - `homeContentModel.getHomeContentData` & `updateHomeContent` (mapping `home_wcu_image_url`).
     - `buildWcuViewModel` di `services/homeService.js` (fallback `/images/wcu-botanical.svg` + `hasCustomImage: false` saat kosong vs path kustom + `hasCustomImage: true` saat terisi).
  2. Jalankan gerbang kualitas lengkap: `npm run lint && npm run lint:views && npm run lint:i18n && node --test tests/test-wcu-dynamic-media.js && npm test`.
  3. Jalankan verifikasi Playwright lintas viewport (`320px`, `375px`, `768px`, `1280px`, `1440px`) pada:
     - Beranda publik (`/` bahasa `ID` & `EN`): verifikasi gambar default SVG (`object-fit: contain`) vs gambar kustom penuh (`object-fit: cover`), 0 inline `style`, 0 console/page error, 0 horizontal overflow, dan kontras WCAG AA.
     - Dashboard Admin (`/admin/products/create`, `/admin/home-content` Tab 2): verifikasi tinggi & perataan sejajar `.eu-dd-trigger` vs `.form-input` (`38px` desktop, `>= 44px` mobile `<= 768px`), serta fungsi pilih & hapus media WCU end-to-end.
- **Kontrak Data Eksplisit:**
  - Seluruh unit test & linter lulus (`exit code 0`).
  - Selisih tinggi terukur `.eu-dd-trigger` vs `.form-input` di desktop `<= 1px` (`38px`), dan di mobile `<= 768px` minimal `44px`.
- **Referensi Pola:** `tests/test-public-services.js` dan `tests/test-t356-t360-admin-services.js`.
- **Batasan Negatif:** Dilarang memodifikasi file produksi di luar temuan bug terverifikasi dalam scope T-403..T-406; patuhi batas maksimal 2 iterasi perbaikan jika ada verifikasi gagal.
- **Skill:** `test-driven-development`, `browser-testing-with-devtools`.
- **Verifikasi Deterministik:** `npm run lint && npm run lint:views && npm run lint:i18n && node --test tests/test-wcu-dynamic-media.js && npm test`.

---

## 5. Dampak Ukuran Modul
- Seluruh 6 berkas spek terdampak (`prd/public-home.md` 61 baris, `tech/public-home.md` 79 baris, `prd/public-home-sections.md` 63 baris, `tech/public-home-sections.md` 54 baris, `prd/admin-ui.md` 67 baris, `tech/admin-ui-dropdown.md` 130 baris) masing-masing berukuran jauh di bawah batas `~8KB` dan `INDEX.md` tetap `47` baris (`<= 60` baris), sehingga **tidak perlu pemecahan dokumen spek**.
- Pada template kode, `views/admin/home-content/partials/tab-wcu.ejs` saat ini tepat `99` baris, sehingga T-404 memisahkan kartu Media Picker ke partial baru `wcu-media-card.ejs` agar seluruh partial tetap mematuhi batas `<= 100` baris (`conventions.md`).

---

## 6. Rencana CLOSE
- **Modul yang tanggal verifikasinya diperbarui di `.agents/INDEX.md` & header modul:**
  - `prd/public-home.md` & `tech/public-home.md` (**Public Home**)
  - `prd/public-home-sections.md` & `tech/public-home-sections.md` (**Public Home Sections**)
  - `prd/admin-ui.md` & `tech/admin-ui-dropdown.md` (**Admin UI Dropdown Component** & **Admin UI**)
- **Draf 1 baris `CHANGELOG.md`:**
  `- 2026-11-23 | Gambar dinamis penuh Why Choose Us via Media Picker (bebas inline style) serta penyeragaman tinggi dropdown admin 38px | T-403..T-407`
