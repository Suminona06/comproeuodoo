# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 0 Task (`T-336..T-341` selesai, menunggu TAHAP 5: CLOSE)
- **Total Task Selesai:** 335 Task (T-01 s/d T-335)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-342**.

---

## Task Aktif / Terbuka (Open Tasks)

*Proposal acuan:* [changes/2026-11-17_refactor-home-frontend-controller.md](changes/2026-11-17_refactor-home-frontend-controller.md)

### [x] T-336: Ekstraksi `services/homeService.js`, Perampingan `homeController.js`, & Kamus i18n `home.*`
- **Prioritas:** High | **Modul:** Public Home | **Dependensi:** - | **Skill:** `antislop-code`, `adapt`
- **File Terdampak:** `services/homeService.js` (baru), `controllers/public/homeController.js`, `locales/id.json`, `locales/en.json`
- **Temuan Teknis / Akar Masalah:** `homeController.js:2` mengimpor `productModel` tak terpakai (`no-unused-vars`), `L30,43` mengirim dead property `featuredProducts: []`, `L11` memiliki `complexity: 10` dengan judul meta hardcoded (`L21-24,40`), serta `views/public/index.ejs:6-65,162-168,194-223,253-270,363-368,410-421,538-556` menumpuk logika filter/sort/duplikasi/ekstraksi YouTube ID/format tanggal/resolusi CTA di template.
- **Acceptance Criteria:**
  1. `services/homeService.js` mengekspor *pure view-model builder* (dapat dipanggil controller dan unit test tanpa DB) serta loader paralel seluruh 8 seksi (banner aktif/safety-net + parsing ID YouTube aman + CTA; intro; 4 panel kategori + modifier `1..4` + hitungan; WCU + `formatInlineText`; sertifikasi aktif terurut `sort_order`; marquee brands terduplikasi min. 8; maks. 2 berita terformat tanggal & `fallbackImage`).
  2. `controllers/public/homeController.js` menghapus `productModel` & `featuredProducts`, memakai `res.locals.t('home.*')` untuk meta title normal/error 500, dan mendelegasikan orkestrasi ke `homeService`.
  3. Seluruh fungsi memenuhi ESLint ketat (`<= 40` baris/fungsi, `<= 300` baris/berkas, `max-depth <= 2`, `complexity <= 8`).
  4. Seluruh kunci `home.*` simetris di `locales/id.json` & `locales/en.json`.
- **Verifikasi:** `npx eslint services/homeService.js controllers/public/homeController.js` dan `npm run lint:i18n` (0 error/warning).

### [x] T-337: Modularisasi `views/public/index.ejs` ke `views/partials/home/*.ejs`, Ekstraksi `wcu-botanical.svg`, & Eliminasi Pelanggaran `lint:views` / CSP
- **Prioritas:** High | **Modul:** Public Home, Public Home Sections | **Dependensi:** `T-336` | **Skill:** `antislop-code`, `polish`
- **File Terdampak:** `views/public/index.ejs`, `views/partials/home/hero-slider.ejs` (+ `hero-slide.ejs` bila perlu), `views/partials/home/intro.ejs`, `views/partials/home/categories.ejs`, `views/partials/home/why-choose-us.ejs`, `views/partials/home/certifications.ejs`, `views/partials/home/brands-marquee.ejs` (+ `brand-preview-modal.ejs` bila perlu), `views/partials/home/news.ejs`, `public/images/wcu-botanical.svg` (baru)
- **Temuan Teknis / Akar Masalah:** `views/public/index.ejs` (582 baris) melanggar `lint:views` dengan 33 temuan: 6 inline `style` (`L175,179,180,185,216,392`), 23 baris raw hex (`L175,179` + 21 baris `<svg class="wcu-art">` `L315-341`), 3 komentar HTML (`L434,466,500`), dan 1 inline `onerror=` (`L560`), plus teks hardcoded tanpa `t('home.*')`.
- **Acceptance Criteria:**
  1. `views/public/index.ejs` dan seluruh partial di `views/partials/home/` berukuran `<= 100` baris dengan nesting `<= 2`, murni presentasi mengkonsumsi view-model `homeService`.
  2. Ilustrasi botani WCU diekstrak ke `public/images/wcu-botanical.svg` (SVG valid tanpa script/event inline) dan dirender di `why-choose-us.ejs` via `<img src="/images/wcu-botanical.svg" alt="" class="wcu-art" aria-hidden="true" loading="lazy" decoding="async">`.
  3. Zero inline `style`, zero komentar HTML, zero raw hex, dan zero inline `onerror=`; gambar kartu berita memakai `data-fallback-src`; `index.ejs` memuat `<script src="/js/home.js" defer></script>` sebelum footer.
  4. Seluruh teks statis, `aria-label`, `title`, modal `#brandPreviewModal` (`data-default-brand-name`), dan empty-state menggunakan `t('home.*')`; class scoped baru `.home-intro-*`, `.hcat-grid--1..4`, `.home-cert-logo` terpasang tanpa mengubah selektor eksisting.
- **Verifikasi:** `node scripts/lint-views.js views/public/index.ejs`, `node scripts/lint-views.js views/partials/home`, dan `npm run lint:i18n` (0 error, 0 warning).

### [x] T-338: Ekstraksi & Pengerasan Skrip Beranda ke `public/js/home.js`
- **Prioritas:** High | **Modul:** Public Home Sections | **Dependensi:** `T-337` | **Skill:** `antislop-code`, `polish`
- **File Terdampak:** `public/js/home.js` (baru), `public/js/main.js`
- **Temuan Teknis / Akar Masalah:** `public/js/main.js` (987 baris, `DOMContentLoaded` 833 baris) menampung `initHeroYouTube` (`L271-308`: empty catch `L283`, `complexity: 14`, `max-depth: 3`, tanpa cek `event.origin`), `initHeroSlider` (`L311-479`), dan `#brandPreviewModal` (`L482-546`: `innerHTML` interpolasi `L501,503` & fallback `'Merek Resmi'` hardcoded `L494`).
- **Acceptance Criteria:**
  1. `public/js/home.js` memuat penuh `initHeroYouTube`, `initHeroSlider`, `initBrandPreviewModal`, dan listener `error` `img[data-fallback-src]` (cek `complete && naturalWidth === 0` + guard satu kali swap agar tidak loop).
  2. Ketiga modul beranda tersebut dihapus bersih dari `public/js/main.js` tanpa merusak fitur global (`headerWrap`, mobile menu, scroll reveal, bento gallery, `.brand-logo-header`).
  3. `initHeroYouTube` memvalidasi `event.origin` (`https://www.youtube.com` / `https://www.youtube-nocookie.com`); `#brandPreviewModal` membangun elemen via `createElement` + `textContent` dengan fallback dari `data-default-brand-name`.
  4. `public/js/home.js` lulus ESLint ketat (`<= 40` baris/fungsi, `<= 300` baris/berkas, `max-depth <= 2`, `complexity <= 8`, 0 warning/error).
- **Verifikasi:** `npx eslint public/js/home.js` (0 error, 0 warning) dan pengecekan diff ESLint `public/js/main.js`.

### [x] T-339: Pembersihan CSS Beranda & Penyelarasan Token (`components.css` & `tokens.css`)
- **Prioritas:** High | **Modul:** Public Home Sections, Code Conventions | **Dependensi:** `T-337` | **Skill:** `polish`, `antislop-code`
- **File Terdampak:** `public/css/components.css`, `public/css/tokens.css`
- **Temuan Teknis / Akar Masalah:** Inline style intro (`index.ejs:179`) merujuk `--shadow-sm` yang tidak ada di `tokens.css`; `.sec-why-us .wcu-art` (`components.css:3350-3358`) memerlukan `object-fit: contain;` untuk `<img>`; ~103 baris deklarasi warna + 1 komentar (`L1352`) di blok selektor beranda `components.css` (`L1162-1935`, `L3065-4080`, `L4529`) masih mengandung raw hex / fallback hex dalam `var(--token, #hex)`.
- **Acceptance Criteria:**
  1. Tersedia class `.home-intro-eyebrow`, `.home-intro-media`, `.home-intro-img`, `.home-intro-lead`, `.hcat-grid--1..4` (tetap mempertahankan `grid-template-columns: repeat(var(--hcat-cols, 4), 1fr)`), `.home-cert-logo`, serta `object-fit: contain;` pada `.sec-why-us .wcu-art`.
  2. Seluruh raw hex, fallback hex dalam `var(--token, ...)`, dan komentar hex `L1352` pada selektor khusus beranda `public/css/components.css` dipetakan ke token `public/css/tokens.css` dengan warna terhitung yang identik.
  3. Selektor non-beranda tidak disentuh; perilaku class bersama (`.sec-products`, `.btn-secondary`, `.btn-pill-solid-white`, `.btn-primary`) dan seluruh aturan yang diaudit test (`test-homepage-major-update-qa.js`, `test-homepage-hero-cta-merek-qa.js`) tetap utuh.
- **Verifikasi:** Scan hex blok beranda `components.css` (0 temuan), cek diff selektor non-beranda, dan audit computed styles Playwright.

### [x] T-340: Penegakan Strict Path `lint:views` & Penyesuaian Test Suite Beranda
- **Prioritas:** High | **Modul:** Code Conventions, Public Home | **Dependensi:** `T-336`, `T-337`, `T-338`, `T-339` | **Skill:** `adapt`, `antislop-code`
- **File Terdampak:** `scripts/lint-views.js`, `tests/test-t187-hero-cta-public.js`, `tests/test-t188-brand-strip-marquee.js`, `tests/test-t189-dead-code-cleanup.js`, `tests/test-homepage-hero-cta-merek-qa.js`, `tests/test-brand-marquee-scaling.js`, `tests/test-t237-playwright-verification.js`, `tests/test-t193-card-component.js`, `tests/test-modul13-seo-audit.js`
- **Temuan Teknis / Akar Masalah:** `DEFAULT_STRICT_PATHS` belum mencakup `views/public/index.ejs` dan `views/partials/home/`; `test-t187` & `test-t188` merender `index.ejs` tanpa `homeService` & `t()` (dan `test-t188` cek fallback judul lama); `test-t189`, `test-homepage-hero-cta-merek-qa`, & `test-brand-marquee-scaling` menginspeksi/menginjeksi `main.js`/`index.ejs` langsung; `test-t237` perlu verifikasi `<img class="wcu-art" src="/images/wcu-botanical.svg">`; `test-t193` mencari `.prod-header`/`.prod-title` langsung di `index.ejs`.
- **Acceptance Criteria:**
  1. `DEFAULT_STRICT_PATHS` di `scripts/lint-views.js` memasukkan `'views/public/index.ejs'` dan `'views/partials/home/'`.
  2. `test-t187-hero-cta-public.js` & `test-t188-brand-strip-marquee.js` memanggil *view-model builder* `services/homeService.js` + helper `t()`, dan `test-t188` selaras dengan kebijakan zero-fallback judul seksi merek pada PRD.
  3. `test-t189-dead-code-cleanup.js`, `test-homepage-hero-cta-merek-qa.js`, `test-brand-marquee-scaling.js`, dan `test-t193-card-component.js` disesuaikan membaca `public/js/home.js` / `views/partials/home/*.ejs` / SSR HTML tanpa melonggarkan assertion fungsional.
  4. `test-t237-playwright-verification.js` memverifikasi `<img class="wcu-art">` mengarah ke `/images/wcu-botanical.svg`, `complete && naturalWidth > 0`, serta visibilitas desktop & mobile.
- **Verifikasi:** `npm run lint:views`, `npm run lint:i18n`, serta eksekusi seluruh berkas test di atas lulus.

### [x] T-341: Audit Visual Pra/Pasca Refaktor & Regresi End-to-End Penuh
- **Prioritas:** High | **Modul:** Public Home, Public Home Sections | **Dependensi:** `T-340` | **Skill:** `polish`, `antislop-code`
- **File Terdampak:** `public/css/components.css`, `views/partials/home/hero-slide.ejs`, `tests/test-homepage-major-update-qa.js` (beserta verifikasi runtime, screenshot/DOM audit, dan gerbang CI)
- **Acceptance Criteria:**
  1. Seluruh 8 seksi beranda identik secara visual dan fungsional pra vs pasca-refaktor (hero slider image/video/YouTube, dual CTA, keyboard & swipe; intro; 4 panel kategori; Why Choose Us + `wcu-botanical.svg` + mobile hide float/chip; sertifikasi; marquee merek + `#brandPreviewModal`; latest news + empty state + fallback gambar; global CTA/footer).
  2. Nol horizontal overflow dan tata letak tepat pada `320px`, `375px`, `768px`, `1024px`, `1440px` (serta `1536x720` dan `1280x650`) untuk ID & EN.
  3. Nol error console JavaScript, nol error CSP, dan nol failed network request (termasuk `/js/home.js` & `/images/wcu-botanical.svg` HTTP 200).
  4. Seluruh gerbang CI & suite test hijau (`npm run lint`, `npm run lint:views`, `npm run lint:i18n`, `npm test`, `test-homepage-major-update-qa.js`, `test-homepage-hero-cta-merek-qa.js`, `test-brand-marquee-scaling.js`, `test-t187-hero-cta-public.js`, `test-t188-brand-strip-marquee.js`, `test-t189-dead-code-cleanup.js`, `test-t237-playwright-verification.js`, `test-modul12-public.js`).
- **Verifikasi:** `npm run lint && npm run lint:views && npm run lint:i18n && npm test` + Playwright audit beranda ID/EN multi-viewport.
