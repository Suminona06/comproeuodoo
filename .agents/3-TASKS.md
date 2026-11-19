# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 1 Task (`T-355`)
- **Task Selesai pada Batch Ini:** 4 Task (`T-351` s/d `T-354`)
- **Total Task Selesai:** 354 Task (`T-01` s/d `T-354`)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-356**.

---

## Task Aktif / Terbuka (Open Tasks)

### [x] T-351: Ekstraksi `services/authService.js`, Perampingan `controllers/admin/authController.js`, & Perbaikan Bug Brute-Force Lock / `changePassword` (A1, B1)
- **Modul:** `prd/admin-cms.md`, `tech/admin-cms.md`
- **Prioritas:** High | **Status:** Done | **Dependensi:** - | **Tanggal:** 2026-11-19
- **Skill:** `antislop-code`
- **File Terdampak:** `services/authService.js` (baru), `controllers/admin/authController.js`, `models/userModel.js`
- **Deskripsi & Acceptance Criteria:**
  1. Ekstraksi `services/authService.js` dengan return status terstruktur (`{ status: 'ok' | 'validation_error' | 'unauthorized' | 'locked' | 'not_found', ... }`) untuk autentikasi login (`authenticateAdmin`), perhitungan sisa menit lock, pembentukan JWT + opsi cookie sesi (`buildSessionCookieOptions`), serta validasi & pembaruan kata sandi (`changeAdminPassword`).
  2. Reset otomatis counter brute-force (`failed_attempts = 0, locked_until = NULL`) saat masa `locked_until` sudah lewat (`!userModel.isAccountLocked(user)`) namun `user.locked_until !== null` atau `user.failed_attempts >= 5`, sehingga kegagalan login baru dihitung mulai dari percobaan ke-1 (`attemptsLeft: 4`).
  3. Penegakan Keputusan 3 (Opsi a) pada `changeAdminPassword`: menolak input kosong/hanya spasi atau `< 8` karakter tanpa memotong spasi valid secara diam-diam saat komparasi maupun `bcrypt.hash(new_password, 10)`, menolak ketidaksesuaian konfirmasi, serta menolak kata sandi baru yang sama persis dengan kata sandi lama.
  4. `controllers/admin/authController.js` menjadi *thin controller* (`<= 40` baris/fungsi, `<= 300` baris/berkas, `max-depth <= 2`, `complexity <= 8`) dan bebas komentar AI-slop (`antislop-code`).

### [x] T-352: Ekstraksi `services/bannerService.js`, Perampingan `controllers/admin/bannerController.js`, & Perbaikan Bug `toggleStatus`, Validasi YouTube/CTA URL, serta Proteksi Aset (A2, B2)
- **Modul:** `prd/public-home.md`, `tech/public-home.md`, `tech/admin-cms.md`
- **Prioritas:** High | **Status:** Done | **Dependensi:** - | **Tanggal:** 2026-11-19
- **Skill:** `antislop-code`
- **File Terdampak:** `services/bannerService.js` (baru), `controllers/admin/bannerController.js`, `models/bannerModel.js`, `models/mediaModel.js`
- **Deskripsi & Acceptance Criteria:**
  1. Penegakan Keputusan 2 (Opsi a) pada `isValidCtaUrl` di `services/bannerService.js`: menolak pola berbahaya (`javascript:`, `data:`, `vbscript:`, `//`) dan mengizinkan string kosong, path internal (`/`, `#`), serta URL berprotokol `http:`, `https:`, `mailto:`, dan `tel:` (`<= 500` karakter, selaras dengan `resolveSafeHref` di `services/homeService.js`).
  2. Ekstraksi `isValidCtaText` (`<= 100` karakter), sanitasi `file_url`/`poster_url` lokal dengan `sanitizeSafePath`, fallback numerik bebas `NaN` untuk `sort_order`, resolusi upload media (`image` WebP, `video`, `youtube`), serta operasi CRUD (`listBanners`, `getBannerById`, `createBanner`, `updateBanner`, `toggleBannerStatus`, `deleteBanner`) ke `services/bannerService.js`.
  3. `toggleBannerStatus` menangani ID tidak ditemukan dengan `{ status: 'not_found', error: 'Banner tidak ditemukan.' }` tanpa `TypeError`.
  4. `updateBanner` memvalidasi `media_type === 'youtube'` secara ketat dan mengembalikan `{ status: 'validation_error' }` (HTTP 400 di controller) bila `extractYouTubeId` gagal.
  5. Penegakan Keputusan 1 (Opsi a): penghapusan file fisik via `storage.delete` pada `updateBanner` dan `deleteBanner` hanya dijalankan apabila path adalah berkas lokal (`/uploads/...`, bukan YouTube ID), tidak terdaftar di tabel `media` (`!await mediaModel.isRegisteredByUrl(url)`), dan tidak sedang direferensikan di `mediaModel.checkUsage(url)`.
  6. `controllers/admin/bannerController.js` menjadi *thin controller* sesuai batas metrik `tech/conventions.md` dan tetap menjamin `await cleanupTempFile(req.file)` di blok `finally`.

### [x] T-353: Ekstraksi `services/brandService.js`, Perampingan `controllers/admin/brandController.js`, & Perbaikan Bug `toggleStatus`, Sanitasi `logo_url`, serta Normalisasi `sort_order` (A3, B3)
- **Modul:** `prd/public-home.md`, `tech/public-home.md`, `tech/admin-cms.md`
- **Prioritas:** High | **Status:** Done | **Dependensi:** `T-352` (helper `mediaModel.isRegisteredByUrl`) | **Tanggal:** 2026-11-19
- **Skill:** `antislop-code`
- **File Terdampak:** `services/brandService.js` (baru), `controllers/admin/brandController.js`, `models/mediaModel.js`
- **Deskripsi & Acceptance Criteria:**
  1. Ekstraksi validasi & pembaruan `updateBrandSectionTitle` (`<= 150` karakter, `settingModel.updateMany`, `clearSettingsCache`), pemrosesan logo (`processAndSaveWebP` atau `sanitizeSafePath` untuk path Media Picker), normalisasi `sort_order` bebas `NaN` & `is_active`, serta operasi CRUD dan `toggleBrandStatus` ke `services/brandService.js`.
  2. `toggleBrandStatus` dan `deleteBrand` mengembalikan `{ status: 'not_found', error: 'Merek tidak ditemukan.' }` bila ID tidak ditemukan; `brandController.toggleStatus` merespons HTTP 404 JSON `{ success: false, message: 'Merek tidak ditemukan.' }` atau redirect error.
  3. Penegakan Keputusan 1 (Opsi a): penghapusan file fisik logo lama pada `updateBrand` dan `deleteBrand` hanya memanggil `storage.delete(oldLogoUrl)` bila merupakan berkas lokal (`/uploads/...`), tidak terdaftar di tabel `media` (`!await mediaModel.isRegisteredByUrl(oldLogoUrl)`), dan tidak lagi direferensikan di `mediaModel.checkUsage(oldLogoUrl)`.
  4. `controllers/admin/brandController.js` mematuhi seluruh batas metrik `tech/conventions.md` (`<= 40` baris/fungsi, `<= 300` baris/berkas, `max-depth <= 2`, `complexity <= 8`) dan standar komentar `antislop-code`.

### [x] T-354: Ekstraksi `services/inquiryService.js`, Perampingan `controllers/admin/inquiryController.js`, Helper `renderPartialAsync`, & Validasi Whitelist Status Inquiry (A4, B4)
- **Modul:** `prd/admin-cms.md`, `tech/admin-cms.md`, `prd/admin-products-rfq.md`, `tech/admin-products-rfq.md`
- **Prioritas:** High | **Status:** Done | **Dependensi:** - | **Tanggal:** 2026-11-19
- **Skill:** `antislop-code`
- **File Terdampak:** `services/inquiryService.js` (baru), `controllers/admin/inquiryController.js`, `models/inquiryModel.js`
- **Deskripsi & Acceptance Criteria:**
  1. Penegakan Keputusan 4 (Opsi a): penyeragaman konstanta whitelist status `INQUIRY_STATUSES = ['baru', 'dibaca', 'ditindaklanjuti', 'ditolak']` di `services/inquiryService.js` dan `models/inquiryModel.js` (untuk `create`, `getStats`, `updateStatus`, filter `index` + `'all'`, dan `exportCsv`).
  2. Ekstraksi normalisasi filter & paginasi (`status`, `search`, `page`, `per_page` whitelist `[10, 25, 50, 100]`), `getInquiryListData`, `getInquiryDetailAndMarkRead` (auto-mark `'baru' -> 'dibaca'`), `updateInquiryStatus`, `deleteInquiry`, serta `getInquiryCsvExportPayload` ke `services/inquiryService.js`.
  3. `updateInquiryStatus` menolak nilai `status` di luar `INQUIRY_STATUSES` dengan `{ status: 'validation_error', error: 'Status inquiry tidak valid.' }` (HTTP 400 JSON / redirect error), dan `deleteInquiry` menangani ID tidak ditemukan dengan `{ status: 'not_found', error: 'Inquiry tidak ditemukan.' }`.
  4. `controllers/admin/inquiryController.js` membungkus `req.app.render` dengan helper Promise `renderPartialAsync` sehingga bebas callback bersarang (`max-depth <= 2`) dan setiap fungsi `<= 40` baris (`<= 300` baris/berkas, `complexity <= 8`).

### [ ] T-355: Penegakan Blok Strict ESLint di `eslint.config.js`, Unit Test 4 Service Baru, & Verifikasi Regresi Menyeluruh (B5, C1, C2)
- **Modul:** `tech/conventions.md`, `tech/admin-cms.md`
- **Prioritas:** High | **Status:** Todo | **Dependensi:** `T-351`, `T-352`, `T-353`, `T-354` | **Tanggal:** 2026-11-19
- **Skill:** `antislop-code`
- **File Terdampak:** `eslint.config.js`, `tests/test-admin-batch2-services.js` (baru), `package.json`
- **Deskripsi & Acceptance Criteria:**
  1. Menambahkan `controllers/admin/{auth,banner,brand,inquiry}Controller.js` dan `services/{auth,banner,brand,inquiry}Service.js` ke blok rules `error` (`max-lines: 300`, `max-lines-per-function: 40`, `max-depth: 2`, `complexity: 8`, `no-unused-vars: error`) di `eslint.config.js`.
  2. Menulis suite unit test `tests/test-admin-batch2-services.js` untuk `authService`, `bannerService`, `brandService`, dan `inquiryService` yang menguji seluruh validator/builder murni, skenario bug A1–A4, serta aturan Keputusan 1–4.
  3. Memastikan `npm run lint`, `npm run lint:views`, `npm run lint:i18n`, `npm test`, dan `npm run test:seed` lulus hijau (exit code 0).
  4. Verifikasi regresi menyeluruh pada `/admin/login`, `/admin/change-password`, `/admin/banners`, `/admin/brands`, dan `/admin/inquiries` (termasuk Fetch paginasi/filter tanpa reload dan ekspor CSV) serta halaman publik terkait (320px–desktop, ID & EN, zero console error, tanpa mengubah isi data CMS di database).
