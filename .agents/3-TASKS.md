# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 4 Task (T-328 s/d T-331)
- **Total Task Selesai:** 327 Task (T-01 s/d T-327)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-332**.

---

## Task Aktif / Terbuka (Open Tasks)

*Proposal acuan: [changes/2026-11-16_refaktor-frontend-about-contact.md](changes/2026-11-16_refaktor-frontend-about-contact.md)*

- [ ] **T-328** *(High | Modul: Contact & About Backend/i18n | Dep: -)*: Selaraskan batas input RFQ (`company` max 100, `message` 10..3000) di `contactController.submit`, tambahkan kamus terjemahan `about.*` & `contact.*` simetris ke `locales/id.json` & `locales/en.json`, dan refaktor `controllers/public/contactController.js` & `controllers/public/pageController.js` menjadi fungsi modular (`<= 40` baris, nesting `<= 2` level) tanpa ternary string literal.
  - **File:** `locales/id.json`, `locales/en.json`, `controllers/public/contactController.js`, `controllers/public/pageController.js`
  - **Verifikasi:** `npm run lint:i18n` & `npm run lint` (0 error).
- [ ] **T-329** *(High | Modul: Public About Frontend | Dep: T-328)*: Refaktor `views/public/about.ejs` menjadi *thin page* (`<= 100` baris, nesting `<= 2` level) dengan `.page-hero` langsung di *thin page* (`<img class="page-hero-bg-img" fetchpriority="high">` + `.page-hero-scrim[data-scrim-level]`), ekstrak `views/partials/about/vision-mission.ejs` & `views/partials/about/gallery-bento.ejs`, hapus `style="--tile-i: ..."` dari EJS & `public/js/main.js`, serta ganti seluruh fallback literal pada partial `/about` dengan `t('about.*')`.
  - **File:** `views/public/about.ejs`, `views/partials/about/vision-mission.ejs`, `views/partials/about/gallery-bento.ejs`, `views/partials/about/story-counter.ejs`, `views/partials/about/history-timeline.ejs`, `views/partials/about/ticket-accordion.ejs`, `public/js/main.js`, `public/css/components.css`
  - **Verifikasi:** `node scripts/lint-views.js views/public/about.ejs` & `node scripts/lint-views.js views/partials/about` (0 error, 0 warning).
- [ ] **T-330** *(High | Modul: Public Contact Frontend | Dep: T-328)*: Perbaiki bug penutup `</div>` `.page-hero-content` di `views/public/contact.ejs`, terapkan `<img class="page-hero-bg-img">` + `.page-hero-scrim[data-scrim-level]` + `.cf-hero-content`, rampingkan menjadi *thin page* (`<= 100` baris, tanpa komentar HTML & inline style) dengan mengekstrak `views/partials/contact/status-alerts.ejs`, `views/partials/contact/rfq-form.ejs` (`company` max 100, `message` 10..3000, `.cf-honeypot`, `data-loading-text`), dan `views/partials/contact/locations-map.ejs`, serta ekstrak validasi RFQ ke `public/js/contact.js` (`defer`, `textContent`).
  - **File:** `views/public/contact.ejs`, `views/partials/contact/status-alerts.ejs`, `views/partials/contact/rfq-form.ejs`, `views/partials/contact/locations-map.ejs`, `public/js/contact.js`, `public/css/components.css`
  - **Verifikasi:** `node scripts/lint-views.js views/public/contact.ejs`, `node scripts/lint-views.js views/partials/contact`, & `npm run lint` (0 error).
- [ ] **T-331** *(High | Modul: Quality Gate, CSS Tokens & Regresi | Dep: T-329, T-330)*: Daftarkan `views/public/about.ejs`, `views/partials/about/`, `views/public/contact.ejs`, dan `views/partials/contact/` ke `DEFAULT_STRICT_PATHS` di `scripts/lint-views.js`; bersihkan komentar AI-slop (`antislop-code`) dan warna hex mentah pada `.page-hero*`, `.abt-*`, `.sec-vm / .vm-*`, `.sec-gallery`, dan `.cf-*` di `public/css/components.css` ke token `public/css/tokens.css`; lakukan audit regresi visual, kontras WCAG AA, dan interaktivitas lengkap di viewport `320px`–`1440px` (ID & EN).
  - **File:** `scripts/lint-views.js`, `public/css/components.css`, `public/js/about-story.js`, `public/js/ticket-accordion.js`, `public/js/contact.js`
  - **Verifikasi:** `npm run lint && npm run lint:views && npm run lint:i18n` (0 error) + uji regresi browser lintas viewport (`320px`, `375px`, `768px`, `1024px`, `1440px`, ID & EN).
