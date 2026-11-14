# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 0 Task
- **Total Task Selesai:** 327 Task (T-01 s/d T-327)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-323** (berikutnya **T-328**).

---

## Task Aktif / Terbuka (Open Tasks)

*Rujukan Proposal Terkunci:* [changes/2026-11-13_footer-dinamis-dan-alert-news.md](changes/2026-11-13_footer-dinamis-dan-alert-news.md)

- [x] **T-323**: Skema Migrasi `019`, Ekstraksi `services/settingService.js`, & Normalisasi `middleware/settingsMiddleware.js`
  - **Modul:** [prd/settings.md](prd/settings.md), [tech/settings-footer.md](tech/settings-footer.md), [tech/footer.md](tech/footer.md)
  - **Skill:** `antislop-code`
  - **File Terdampak:** `database/migrations/019_footer_dynamic_content_v1.sql` *(baru)*, `services/settingService.js` *(baru)*, `controllers/admin/settingController.js`, `middleware/settingsMiddleware.js`
  - **Acceptance Criteria:**
    1. Migrasi `019_footer_dynamic_content_v1.sql` menggunakan `INSERT IGNORE INTO settings` (idempoten, tanpa menimpa data CMS eksisting) untuk mendaftarkan `footer_desc_id`, `footer_desc_en` (teks default saat ini, `<= 350` char), dan `footer_nav_links_json` (seed 4 menu default eksisting).
    2. `services/settingService.js` memvalidasi `footer_desc_id` & `footer_desc_en` (`<= 350` char, terpisah dari `meta_description_*` SEO), `footer_nav_links_json` (`0–4` item, `label_id`/`label_en` wajib `<= 80` char, `url` wajib `<= 255` char), serta whitelist URL ketat (`isAllowedFooterUrl`: hanya `https://`, `http://`, `/...` bukan `//`, atau `#...`; tolak `javascript:`, `data:`, `vbscript:`, `//`).
    3. `controllers/admin/settingController.js` (tetap di bawah `roleMiddleware(['superadmin'])` & CSRF `/admin/settings`) dan `services/settingService.js` masing-masing `<= 300` baris, tiap fungsi `<= 40` baris, kompleksitas `<= 8`.
    4. `middleware/settingsMiddleware.js` menormalisasi `footer_desc_*` dan mem-parse + sanitasi ulang `res.locals.footerNavLinks` (`0–4` item valid, flag `isExternal` untuk `http(s)://`, fallback aman bila JSON rusak), dengan `clearSettingsCache()` saat update.
  - **Verifikasi:** Uji helper `services/settingService.js` (0/4/5 item, 350/351 char, whitelist & penolakan URL berbahaya), uji idempotensi `node database/migrate.js`, dan `npm run lint`.

- [x] **T-324**: Antarmuka CMS Pengelolaan Deskripsi Footer & Repeater Menu Footer (`.stg-*`, `/admin/settings`)
  - **Modul:** [prd/settings.md](prd/settings.md), [tech/settings.md](tech/settings.md), [tech/settings-footer.md](tech/settings-footer.md)
  - **Skill:** `adapt`, `polish`, `antislop-code`
  - **File Terdampak:** `views/admin/settings/partials/footer-content-card.ejs` *(baru)*, `views/admin/settings/index.ejs`, `public/js/admin-settings.js`, `public/css/admin.css`
  - **Acceptance Criteria:**
    1. Partial `footer-content-card.ejs` (`<= 100` baris, EJS nesting `<= 2`, tanpa `style="..."`, tanpa komentar HTML, Bahasa Indonesia baku tanpa `t()`) menggunakan prefix `.stg-*` tanpa mengubah class bersama (`.form-card`, `.form-group`, `.form-row-2`, `.adm-btn-*`, `.eu-dd-*`).
    2. Menyediakan textarea `footer_desc_id` & `footer_desc_en` (`maxlength="350"` + counter karakter `.stg-char-count`) serta repeater `0–4` item menu (Label ID, Label EN, URL internal/eksternal, tombol Naik/Turun/Hapus, info state `0` item, tombol Tambah nonaktif saat `4` item).
    3. `public/js/admin-settings.js` memisahkan initializer WhatsApp & Footer repeater (`<= 40` baris/fungsi, tidak terhalang `if (!repeaterWrap) return;`), membangun DOM via `createElement` + `.value`/`.textContent` (tanpa injeksi HTML mentah, bebas `on*=`, CSP `script-src 'self'`).
    4. `public/css/admin.css` menata `.stg-footer-*` / `.stg-char-count` memakai token `tokens.css` (zero raw hex baru), kontras AA, kontrol ramah sentuh, responsif tanpa overflow.
  - **Verifikasi:** `npm run lint`, `npm run lint:views`; uji browser alur 0 item, tambah hingga 4 item, geser urutan, hapus, batas `350` char, penolakan URL tidak valid, simpan & reload tanpa error console.

- [x] **T-325**: Footer Publik Dinamis pada `views/partials/footer.ejs` (`.ft-*`) & Lokalisasi ID/EN tanpa Menyentuh Homepage
  - **Modul:** [prd/footer.md](prd/footer.md), [tech/footer.md](tech/footer.md)
  - **Skill:** `adapt`, `polish`, `antislop-code`
  - **File Terdampak:** `views/partials/footer.ejs`, `public/css/layout.css`, `locales/id.json`, `locales/en.json`
  - **Acceptance Criteria:**
    1. `views/public/index.ejs` dibekukan tanpa perubahan apa pun; tampilan footer eksisting (`var(--surface-dark-footer)` & kartu `.ft-nav-link`) dipertahankan.
    2. `.ft-desc` merender `settings.footer_desc_en`/`footer_desc_id` ter-escape (`<%= ... %>`) dengan fallback bersih ke `t('footer.default_desc')`; `meta_description_*` tetap khusus `<head>`.
    3. `.ft-nav` merender `0–4` item dari `footerNavLinks` ter-escape (`<%= ... %>`); URL eksternal (`item.isExternal`) otomatis mendapat `target="_blank" rel="noopener noreferrer"`; bila `0` item, `.ft-nav` tidak dirender.
    4. `public/css/layout.css` menambahkan `.ft-main:has(> :only-child) { grid-template-columns: 1fr; }` untuk state `0` item, menjamin `.ft-nav-link` minimal `44px`, `overflow-wrap: anywhere` di `320px`, `prefers-reduced-motion: reduce`, dan mempertahankan aturan `.ft-*` yang diawasi `test-t144`, `test-t145`, dan `test-t241`.
  - **Verifikasi:** `npm run lint`, `npm run lint:views`, `npm run lint:i18n`, `node tests/test-t144-ui-polish.js`, `node tests/test-t145-qa-regression.js`, `node tests/test-t241-public-ui.js`; cek state `0`, `1–3`, dan `4` menu + eksternal link pada viewport `320..1440`.

- [x] **T-326**: SweetAlert2 Toast 2 Detik Bertema Hijau Euodoo pada Detail Berita (`/news/:slug`)
  - **Modul:** [prd/news-detail.md](prd/news-detail.md), [tech/news-detail.md](tech/news-detail.md)
  - **Skill:** `polish`, `animate`, `antislop-code`
  - **File Terdampak:** `controllers/public/postController.js`, `views/partials/head.ejs`, `views/public/news-detail.ejs`, `public/js/news-detail.js`, `public/css/components.css`, `locales/id.json`, `locales/en.json`
  - **Acceptance Criteria:**
    1. `postController.detail` mengirim `useSweetAlert: true`; `views/partials/head.ejs` memuat `/vendor/sweetalert2/sweetalert2.min.css` secara kondisional sebelum `components.css` (homepage bebas overhead aset); `news-detail.ejs` memuat `/vendor/sweetalert2/sweetalert2.min.js` (`defer`) sebelum `news-detail.js`, menambah `data-copy-error-msg="<%= t('news_detail.copy_error') %>"`, serta `#nwdCopyStatus` (`aria-live="polite"`, tanpa `#copySuccessToast`).
    2. `public/js/news-detail.js` menghapus `window.alert`, memakai `Swal.mixin({ toast: true, position: 'top-end', timer: 2000, timerProgressBar: true, showConfirmButton: false, showCloseButton: true })` (jeda saat hover, fungsi `<= 40` baris), menampilkan varian sukses & gagal salin, serta fallback `#nwdCopyStatus`.
    3. `public/css/components.css` menata `.nwd-swal-*` memakai token `tokens.css` (palet hijau Euodoo & token error, zero biru/zero hex baru, tombol close `>= 44x44px`, focus ring jelas, `prefers-reduced-motion: reduce`).
    4. `locales/id.json` & `locales/en.json` simetris memiliki `news_detail.copy_success` & `news_detail.copy_error`.
  - **Verifikasi:** `npm run lint`, `npm run lint:views`, `npm run lint:i18n`, `node tests/test-t320-t321-news-regression.js`; uji klik `#copyLinkBtn` sukses (toast hijau 2 detik) & gagal salin di Playwright ID/EN, nol dialog native, homepage tidak memuat vendor SweetAlert2.

- [x] **T-327**: Uji Regresi Akhir Multi-Viewport, Aksesibilitas, & Gerbang Kualitas
  - **Modul:** [prd/news-detail.md](prd/news-detail.md), [prd/footer.md](prd/footer.md), [prd/settings.md](prd/settings.md)
  - **Skill:** `polish`, `adapt`, `antislop-code`
  - **File Terdampak:** `tests/test-t327-footer-news-alert-regression.js` *(baru)*
  - **Acceptance Criteria:**
    1. `npm run lint`, `npm run lint:views`, dan `npm run lint:i18n` hijau (`exit code 0`).
    2. Playwright memverifikasi 6 viewport (`320`, `375`, `480`, `768`, `1024`, `1440` px) pada ID & EN (`/`, `/news/:slug`, `/admin/settings`): nol horizontal overflow, kontras AA, target sentuh `>= 44px`, nol console/500/CSP error.
    3. Verifikasi end-to-end CMS `0/1–3/4` menu & `footer_desc_*` sinkron ke publik, `meta_description_*` tetap terpisah, penolakan input berbahaya di server, link eksternal `rel="noopener noreferrer"`, serta toast SweetAlert2 2 detik di `/news/:slug`.
    4. Tes regresi `test-t144`, `test-t145`, `test-t241`, `test-t320-t321` tetap lulus.
  - **Verifikasi:** Eksekusi penuh skrip regresi Playwright & perintah lint setelah edit final.
