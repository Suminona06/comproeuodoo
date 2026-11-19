# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 0 Task (`T-363` s/d `T-368` selesai, siap tahap **CLOSE**)
- **Total Task Selesai:** 362 Task (T-01 s/d T-362) + 6 Task Batch 3 selesai (`T-363` s/d `T-368`)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-369**.

---

## Task Aktif / Terbuka (Open Tasks)

*Proposal rujukan:* [changes/2026-11-19_refactor-admin-controllers-batch3.md](changes/2026-11-19_refactor-admin-controllers-batch3.md) (Keputusan terkunci: `1a, 2b, 3a, 4a, 5a`).

- [x] **T-363:** Ekstraksi `services/userService.js` & refaktor `controllers/admin/userController.js` (guard ID positif, trim & format/duplikasi email pada store/update, whitelist role `['superadmin','admin','editor']`, proteksi self-delete & superadmin terakhir, `currentUser` pada error fallback `index`, aturan password setara `authService.changeAdminPassword` tanpa trim spasi valid, pembersihan komentar `antislop-code`).
- [x] **T-364:** Modularisasi `services/settingService.js` menjadi 3 berkas (`settingService.js` + `settingMediaService.js` + `settingFooterService.js` dengan re-export penuh) & refaktor `controllers/admin/settingController.js` murni via service (`getSettingsMap`, `updateSettings` + `clearSettingsCache()`), pemisahan pesan error validasi vs error sistem generik, dan pembersihan komentar `antislop-code`.
- [x] **T-365:** Ekstraksi `services/pageHeroBannerService.js` & refaktor `controllers/admin/pageHeroBannerController.js` (clamp `overlay_opacity` `0..1`/fallback `0.60`, perbaikan guard nilai `0` pada `models/pageHeroBannerModel.js:60`, sanitasi protokol aman `cta_url` & `image_url`, pemisahan pesan error validasi vs error sistem generik, pembersihan komentar `antislop-code`).
- [x] **T-366:** Ekstraksi `services/capabilityService.js` & refaktor `controllers/admin/capabilityController.js` (hapus 6 baris dead code, guard ID positif & `not_found` pada `update`/`destroy`, trim wajib `title_id` & `machine_type`, guard `NaN` `sort_order`, sanitasi `image_url`, pemisahan pesan error validasi vs error sistem generik, pembersihan komentar `antislop-code`).
- [x] **T-367:** Penegakan blok strict `error` ESLint untuk seluruh 4 controller & 6 service Batch 3 di `eslint.config.js` (`max-lines: 300`, `max-lines-per-function: 40`, `max-depth: 2`, `complexity: 8`, `no-unused-vars`) + audit komentar `antislop-code`.
- [x] **T-368:** Tambah unit test `tests/test-admin-batch3-services.js` (`node --test`) untuk seluruh service Batch 3 + verifikasi test kompatibilitas eksisting (`test-kelompok-b-specs`, `test-t142-t143-specs`, `test-t239-backend-validation`, `test-t323-setting-footer-service`), lint (`lint`, `lint:views`, `lint:i18n`), `npm test`, dan regresi rute admin & publik terkait.
