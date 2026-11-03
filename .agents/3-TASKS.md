# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 1 Task (T-277)
- **Total Task Selesai:** 276 Task (T-01 s/d T-276)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-278**.

---

## Task Aktif / Terbuka (Open Tasks)

### T-277: Refaktor View Admin Batch 1 - Auth & Error (403, Login, Change Password) [TODO]
- **Deskripsi**: Merefaktor berkas view admin auth dan error (`views/admin/403.ejs`, `views/admin/login.ejs`, `views/admin/change-password.ejs`) agar patuh `tech/conventions.md`: eliminasi 27 style inline, 6 warna hex mentah, 1 tag `<script>` inline, dan 1 komentar HTML. Style diekstraksi ke class berprefix `.err403-*`, `.adm-login-*`, dan `.chpwd-*` di `public/css/admin.css`. Script inline fallback logo login dipindahkan ke `public/js/admin-login.js`. Bersihkan komentar tak perlu dan hex lama pada CSS/JS terkait sesuai Keputusan 1 Opsi B.
- **Acceptance Criteria**:
  - [ ] 0 error & 0 warning pada `node scripts/lint-views.js --strict views/admin/403.ejs,views/admin/login.ejs,views/admin/change-password.ejs`.
  - [ ] `npm run lint` hijau (0 error).
  - [ ] Test suites eksisting lulus (`npm run test:storage && npm run test:security && npm run test:cms`).
  - [ ] Bukti perbandingan visual Playwright sebelum vs sesudah identik pada resolusi mobile (375px), tablet (768px), laptop (1280px), dan desktop (1440px).
  - [ ] Fungsionalitas login, validasi CSRF, feedback error kredensial, fallback logo, dan submit form ganti password berfungsi normal tanpa error konsol.
  - [ ] Berkas `views/admin/403.ejs`, `views/admin/login.ejs`, dan `views/admin/change-password.ejs` ditambahkan ke `DEFAULT_STRICT_PATHS` pada `scripts/lint-views.js`.
- **File Terdampak**: `views/admin/403.ejs`, `views/admin/login.ejs`, `views/admin/change-password.ejs`, `public/css/admin.css`, `public/js/admin-login.js`, `scripts/lint-views.js`, `tests/test-t277-auth-views-refactor-qa.js`
- **Skill**: `antislop-code` + `frontend-ui-engineering` + `test-driven-development`
- **Verifikasi**: Laporan gerbang kualitas (lint, tests, visual diff Playwright, browser console).
