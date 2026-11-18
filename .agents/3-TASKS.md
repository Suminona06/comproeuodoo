# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 4 Task (`T-347` s/d `T-350`)
- **Total Task Selesai:** 346 Task (T-01 s/d T-346)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-347**.

---

## Task Aktif / Terbuka (Open Tasks)

*Proposal Acuan:* [2026-11-18_refactor-admin-controllers-about-homecontent-media.md](changes/2026-11-18_refactor-admin-controllers-about-homecontent-media.md)

- [x] **T-347: Ekstraksi `services/homeContentService.js` & Perampingan `homeContentController`**
  - **Prioritas:** High | **Dependensi:** - | **Skill:** `antislop-code`
  - **Deskripsi:** Membuat `services/homeContentService.js` (`getAdminHomeContentData`, `buildHomeContentPayload` dipecah per seksi `intro`, `why_choose_us`, `categories`, `homepage_categories`, `certifications`, `cta`, dan `updateAdminHomeContent`) serta merampingkan `controllers/admin/homeContentController.js` tanpa menyentuh `services/homeService.js`.
  - **File:** `controllers/admin/homeContentController.js`, `services/homeContentService.js` *(baru)*, `tests/test-t347-t349-admin-services.js` *(baru)*
  - **Acceptance Criteria:** Controller bebas impor `homeContentModel` & `productCategoryModel`; `services/homeService.js` tetap 297 baris tanpa perubahan; tiap fungsi `<= 40` baris kode, `max-depth <= 2`, `complexity <= 8`, berkas `<= 300` baris kode; kontrak `ALLOWED_KICKER_ICONS`, default URL, locals render, dan redirect flash 100% identik; unit test builder 6 seksi lulus; 0 error & 0 warning ESLint; bebas komentar AI-slop.
  - **Verifikasi:** `npx eslint controllers/admin/homeContentController.js services/homeContentService.js`, `node --test tests/test-t347-t349-admin-services.js`, dan `npm run test:admin-http`.

- [x] **T-348: Pembuatan `services/mediaService.js` & Perampingan `mediaController`**
  - **Prioritas:** High | **Dependensi:** - | **Skill:** `antislop-code`
  - **Deskripsi:** Mengekstrak `getMediaLibraryViewData`, `buildEmptyMediaLibraryViewData`, `getMediaPickerList`, `uploadAndCreateMedia` (menyatukan `upload` & `apiUpload`), `registerYoutubeMedia`, `checkMediaUsage`, dan `deleteMediaItem` (`{ status: 'not_found' | 'in_use' | 'deleted', usages }`) ke `services/mediaService.js`, serta merampingkan `controllers/admin/mediaController.js` (`max-depth <= 2`).
  - **File:** `services/mediaService.js` *(baru)*, `controllers/admin/mediaController.js`, `tests/test-t347-t349-admin-services.js`
  - **Acceptance Criteria:** Controller bebas impor `mediaModel`, `storage`, processor upload, & `extractYouTubeId`, tetap memanggil `cleanupTempFile(req.file)` di `finally`, memakai guard `req.body?.force === 'true'` serta penanganan JSON/redirect konsisten (status `200/400/404/409/500`); `<= 40` baris/fungsi, `max-depth <= 2`, `complexity <= 8`, `<= 300` baris/berkas; unit test `mediaService` lengkap lulus; `test-audit-recommendations.js` poin 2 lulus; 0 error & 0 warning ESLint; bebas komentar AI-slop.
  - **Verifikasi:** `npx eslint controllers/admin/mediaController.js services/mediaService.js`, `node --test tests/test-t347-t349-admin-services.js`, serta uji HTTP `/admin/media*` & `/admin/api/media*` (termasuk 409 in-use & force delete).

- [x] **T-349: Pemecahan Layanan About (`aboutService.js` & `aboutCrudService.js`) & Perampingan `aboutController`**
  - **Prioritas:** High | **Dependensi:** - | **Skill:** `antislop-code`
  - **Deskripsi:** Memisahkan `services/aboutService.js` (orkestrasi `getAdminAboutPageData`, `updateAdminAboutContent`, parser utama & re-export parser sub-item) dan `services/aboutCrudService.js` (parser & CRUD Gallery/Stats/Timeline), lalu merampingkan `controllers/admin/aboutController.js` sebagai thin controller pengelola request/response (`sendTabSuccess`, `sendTabError`, `res.render`, `res.redirect`).
  - **File:** `controllers/admin/aboutController.js`, `services/aboutService.js`, `services/aboutCrudService.js` *(baru)*, `tests/test-t347-t349-admin-services.js`
  - **Acceptance Criteria:** `aboutController.js` bebas impor 4 model & `processAndSaveWebP` dengan seluruh 11 nama handler `routes/adminRoutes.js` utuh; `updateAboutContent` tetap memanggil `aboutModel.updateAboutData` (kompatibel dengan spy `test-t295` & `test-t299`); `aboutService.js` tetap mengekspor ulang parser sub-item untuk `test-audit-recommendations.js`; respons XHR/JSON (`200/400/404/500`) & redirect tab identik; unit test `aboutService` & `aboutCrudService` lulus; ketiga berkas `<= 300` baris kode, `<= 40` baris/fungsi, `max-depth <= 2`, `complexity <= 8`, 0 error & 0 warning ESLint; bebas komentar AI-slop.
  - **Verifikasi:** `npx eslint controllers/admin/aboutController.js services/aboutService.js services/aboutCrudService.js`, `node --test tests/test-t347-t349-admin-services.js`, `node tests/test-kelompok-b.js`, `node --test tests/test-t295-admin-ticket-form-qa.js`, `node --test tests/test-t299-about-ticket-regression-qa.js`, `node --test tests/test-audit-recommendations.js`, serta uji HTTP `GET/POST /admin/about*`.

- [x] **T-350: Penegakan ESLint Strict di `eslint.config.js` & Audit Regresi Terpadu**
  - **Prioritas:** High | **Dependensi:** `T-347`, `T-348`, `T-349` | **Skill:** `antislop-code`
  - **Deskripsi:** Mendaftarkan 7 berkas controller & service hasil refaktor ke blok rules ketat `error` (`max-lines`, `max-lines-per-function`, `max-depth`, `complexity`, `no-unused-vars`) di `eslint.config.js`, melengkapi unit test, dan menjalankan seluruh gerbang verifikasi CI serta regresi HTTP admin/publik.
  - **File:** `eslint.config.js`, `tests/test-t347-t349-admin-services.js`
  - **Acceptance Criteria:** Blok strict `'error'` di `eslint.config.js` mencakup tepat 7 berkas refaktor; `npm run lint`, `npm run lint:views`, dan `npm run lint:i18n` hijau (0 error, dan 0 warning pada berkas terkait); `npm test`, `npm run test:cms`, `npm run test:admin-http`, dan seluruh suite unit/regresi terkait lulus 100%; verifikasi endpoint About, Home Content, dan Media (termasuk 409 in-use & force delete) bebas error console/server.
  - **Verifikasi:** `npm run lint`, `npm run lint:views`, `npm run lint:i18n`, `npm test`, `npm run test:cms`, `npm run test:admin-http`.
