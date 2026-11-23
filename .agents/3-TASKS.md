# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 5 Task (T-403 s/d T-407)
- **Total Task Selesai:** 402 Task (T-01 s/d T-402)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-408**.

---

## Task Aktif / Terbuka (Open Tasks)

### [DONE] T-403: Backend Settings, Sanitasi & View-Model Gambar Dinamis Why Choose Us `[Tier: Argon Medium]`
- **Proposal:** [2026-11-23_wcu-dynamic-media-and-admin-dropdown-sizing.md](../changes/2026-11-23_wcu-dynamic-media-and-admin-dropdown-sizing.md)
- **File Terdampak (3 file):** `models/homeContentModel.js`, `services/homeContentService.js`, `services/homeService.js`.
- **Langkah Kerja:**
  1. Di `models/homeContentModel.js`: tambahkan `image_url: ''` pada `getDefaults().why_choose_us`; baca `allSettings.home_wcu_image_url ?? ''` di `getHomeContentData()`; simpan `w.image_url` ke `home_wcu_image_url` di `updateHomeContent()`.
  2. Di `services/homeContentService.js`: tambahkan `image_url: cleanOptPath(b.wcu_image_url)` pada `buildWcuSection()` agar path disanitasi `sanitizeSafePath` dan nilai kosong tetap tersimpan `''`.
  3. Di `services/homeService.js`: definisikan `DEFAULT_WCU_IMAGE = '/images/wcu-botanical.svg'`, lalu pada `buildWcuViewModel()` kembalikan `imageUrl` (`wcu.image_url || DEFAULT_WCU_IMAGE`) dan `hasCustomImage` (`Boolean(wcu.image_url)`) dengan menjaga batas ESLint (`<= 40` baris/fungsi, `max-depth <= 2`, `complexity <= 8`).
- **Kontrak Data Eksplisit:**
  - Key tabel `settings`: `home_wcu_image_url`.
  - Payload `POST /admin/home-content`: `wcu_image_url` -> `why_choose_us.image_url`.
  - View-model `whyChooseUs`: `{ ..., imageUrl: string (default '/images/wcu-botanical.svg'), hasCustomImage: boolean }`.
- **Referensi Pola:** `buildIntroSection()` + `cleanOptPath()` di `services/homeContentService.js` dan `buildIntroViewModel()` di `services/homeService.js`.
- **Batasan Negatif:** Dilarang menyentuh `.ejs`, `.css`, JS klien, section beranda selain `why_choose_us`, atau `database/seeds/snapshot.json`.
- **Skill:** `incremental-implementation`.
- **Verifikasi Deterministik:** `npm run lint` dan `npm run test:seed`.

### [OPEN] T-404: Form Media Picker Tab 2 Why Choose Us CMS Admin `[Tier: Hydrogen Medium]`
- **Proposal:** [2026-11-23_wcu-dynamic-media-and-admin-dropdown-sizing.md](../changes/2026-11-23_wcu-dynamic-media-and-admin-dropdown-sizing.md)
- **File Terdampak (2 file):** `views/admin/home-content/partials/tab-wcu.ejs`, `views/admin/home-content/partials/wcu-media-card.ejs` (partial baru agar kedua file `<= 100` baris sesuai `conventions.md`).
- **Langkah Kerja:**
  1. Ekstrak blok kartu kolom kanan (`Artbox Ilustrasi & Kartu Mengambang`) beserta 1 kontrol Media Picker gambar utama WCU ke `views/admin/home-content/partials/wcu-media-card.ejs` (`<= 100` baris, nesting `<= 2`), lalu include dari `views/admin/home-content/partials/tab-wcu.ejs`.
  2. Di `wcu-media-card.ejs`, tambahkan komponen `.media-picker-component` untuk gambar WCU:
     - `input[type="hidden"]#home_wcu_image_url[name="wcu_image_url"]` (`value="<%= wcu.image_url || '' %>"`).
     - `.media-picker-preview-box` berisi `<img class="media-picker-preview-img ...">` dan `.media-picker-empty` (info bahwa saat kosong otomatis kembali ke ilustrasi SVG bawaan + gradasi hijau).
     - `.media-picker-ctrls` berisi `.btn-open-media-picker` (`data-target="home_wcu_image_url"`, `data-picker-type="image"`) dan `.btn-clear-media` (ditampilkan bila `wcu.image_url` terisi).
  3. Perbarui hint label pita artbox bila masih menyebut SVG secara kaku, dan pastikan kedua file bebas inline `style="..."`, bebas raw hex, bebas komentar HTML, serta memakai Bahasa Indonesia baku (tanpa `t()`).
- **Kontrak Data Eksplisit:**
  - `input#home_wcu_image_url[name="wcu_image_url"]` (`data-target="home_wcu_image_url"`, `data-picker-type="image"`).
- **Referensi Pola:** Komponen `.media-picker-component` di `views/admin/home-content/partials/tab-intro.ejs` (baris 57-79).
- **Batasan Negatif:** Dilarang memodifikasi `public/js/media-picker.js`, `tab-intro.ejs`, tab home-content lainnya, atau file CSS.
- **Skill:** `frontend-ui-engineering`, `antislop-ui`.
- **Verifikasi Deterministik:** `npm run lint:views` dan `npm run lint`.

### [OPEN] T-405: Render Gambar Penuh Dinamis WCU Bebas Inline Style di Beranda Publik `[Tier: Argon Medium]`
- **Proposal:** [2026-11-23_wcu-dynamic-media-and-admin-dropdown-sizing.md](../changes/2026-11-23_wcu-dynamic-media-and-admin-dropdown-sizing.md)
- **File Terdampak (2 file):** `views/partials/home/why-choose-us.ejs`, `public/css/components.css`.
- **Langkah Kerja:**
  1. Di `views/partials/home/why-choose-us.ejs`: tambahkan modifier `.wcu-artbox--custom` pada `<div class="wcu-artbox <%= whyChooseUs.hasCustomImage ? 'wcu-artbox--custom' : '' %>" ...>` dan ubah elemen gambar menjadi `<img src="<%= whyChooseUs.imageUrl %>" alt="" class="wcu-art <%= whyChooseUs.hasCustomImage ? 'wcu-art--custom' : '' %>" aria-hidden="true" loading="lazy" decoding="async">` tanpa inline `style="..."`.
  2. Di `public/css/components.css` seksi `.sec-why-us`:
     - Tambahkan `.sec-why-us .wcu-artbox--custom { background: var(--bg-subtle); }` dan `.sec-why-us .wcu-artbox--custom::before, .sec-why-us .wcu-artbox--custom::after { display: none; }` agar gradasi hijau dan lingkaran dekoratif tidak muncul di belakang gambar kustom.
     - Tambahkan `.sec-why-us .wcu-art--custom { object-fit: cover; z-index: 1; }` agar gambar kustom mengisi penuh `.wcu-artbox` (sementara `.wcu-art` bawaan tetap `object-fit: contain`).
     - Pada `@media (hover: hover)`, pastikan `.sec-why-us .wcu-artbox--custom:hover .wcu-art--custom { transform: scale(1.045); }` (tanpa `rotate(-0.4deg)` agar tepi foto penuh tidak menyisakan celah sudut).
  3. Pastikan `.wcu-art-label` (`z-index: 2`) dan `.wcu-float-card` (`z-index: 3`) tetap berada di atas `.wcu-art--custom`, serta mobile (`<= 860px`) tetap menyembunyikan keduanya.
- **Kontrak Data Eksplisit:**
  - Properti view-model: `whyChooseUs.imageUrl`, `whyChooseUs.hasCustomImage`.
  - Class CSS baru berprefix unik: `.sec-why-us .wcu-artbox--custom`, `.sec-why-us .wcu-art--custom`.
- **Referensi Pola:** `.sec-why-us .wcu-artbox` dan `.sec-why-us .wcu-art` di `public/css/components.css` (baris 3347-3426).
- **Batasan Negatif:** Dilarang menyentuh 7 section homepage lainnya (`hero-slider`, `intro`, `categories`, `certifications`, `brands-marquee`, `news`, `cta-global`); dilarang menulis `style="..."` atau warna hex di `why-choose-us.ejs`.
- **Skill:** `frontend-ui-engineering`, `antislop-ui`.
- **Verifikasi Deterministik:** `npm run lint:views`, `npm run lint:i18n`, `npm run lint`.

### [OPEN] T-406: Penyeragaman Dimensi Dropdown Admin (`.eu-dd`) 38px Sejajar `.form-input` di `public/css/admin.css` `[Tier: Hydrogen Medium]`
- **Proposal:** [2026-11-23_wcu-dynamic-media-and-admin-dropdown-sizing.md](../changes/2026-11-23_wcu-dynamic-media-and-admin-dropdown-sizing.md)
- **File Terdampak (1 file):** `public/css/admin.css`.
- **Langkah Kerja:**
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
- **Batasan Negatif:** Dilarang mengubah `public/css/tokens.css` maupun `public/css/components.css`; dilarang mengubah JS `public/js/admin-dropdown.js` atau `views/admin/products/partials/basic-info.ejs`.
- **Skill:** `antislop-ui`, `frontend-ui-engineering`.
- **Verifikasi Deterministik:** `npm run lint`, inspeksi visual & pengukuran bounding box Playwright di `/admin/products/create`, `/admin/home-content`, dan halaman admin lainnya.

### [OPEN] T-407: Unit Test (`homeService` & `homeContentService`) dan Verifikasi Regresi Visual Playwright Multi-Viewport `[Tier: Argon Medium]`
- **Proposal:** [2026-11-23_wcu-dynamic-media-and-admin-dropdown-sizing.md](../changes/2026-11-23_wcu-dynamic-media-and-admin-dropdown-sizing.md)
- **File Terdampak (1 file):** `tests/test-wcu-dynamic-media.js`.
- **Langkah Kerja:**
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
