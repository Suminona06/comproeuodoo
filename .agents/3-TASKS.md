# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 4 Task
- **Total Task Selesai:** 331 Task (T-01 s/d T-331)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-332**.

---

## Task Aktif / Terbuka (Open Tasks)

- [ ] **T-332:** Salin 34 aset media aktif ke `database/seed-assets/uploads/`, buat `utils/seedAssetsSync.js` non-destruktif, dan integrasikan ke `database/migrate.js` & `database/seeds/v2_seed.js`.
- [ ] **T-333:** Buat `database/seeds/exportSnapshot.js` (`npm run seed:export`), hasilkan `database/seeds/snapshot.json` + migrasi `database/migrations/020_seed_current_content_v1.sql`, dan perbarui `database/seeds/v2_seed.js` agar selaras skema terbaru.
- [ ] **T-334:** Buat workflow CI `.github/workflows/ci.yml` untuk quality gate (`lint`, `lint:views`, `lint:i18n`, `migrate`, `seed`, `npm test`).
- [ ] **T-335:** Perbarui `README.md` dan `AGENTS.md` (context engineering) dengan alur seed/migrate/CI, lalu verifikasi lint dan dry-run migrasi + seed + `npm test` pada database bersih.
