# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 6 Task (T-369 s/d T-374)
- **Total Task Selesai:** 368 Task (T-01 s/d T-368)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-375**.

---

## Task Aktif / Terbuka (Open Tasks)

*Proposal Acuan:* [changes/2026-11-20_refactor-public-controllers.md](changes/2026-11-20_refactor-public-controllers.md) *(Keputusan: 1a, 2a, 3a, 4a, 5a, 6a; `conventions.md` §4 dipecah ke `tech/conventions-lint.md`)*.

- [x] **T-369** — Refaktor `controllers/public/postController.js` & ekstraksi `services/publicPostService.js` + perbaikan Bug A1 (fallback 500 simetris `headlinePosts: []`, `heroBanner: null`) & Bug A2 (`locales/{id,en}.json`: `news.not_found_title`, `common.error_title`, `news.page_title`). *(Skill: `antislop-code`)*
- [x] **T-370** — Refaktor `controllers/public/pageController.js` & ekstraksi `services/publicPageService.js` + tambah `listActiveCapabilities` di `services/capabilityService.js` untuk di-reuse `/capabilities`. *(Skill: `antislop-code`)*
- [x] **T-371** — Refaktor `controllers/public/productController.js` & ekstraksi `services/publicProductService.js` + tambah `mediaModel.findUrlsByIds(ids)` di `models/mediaModel.js` + ekspor `resolveBaseUrl` di `middleware/seoMiddleware.js` + perbaikan Bug A1/A2/A3 (`locales/{id,en}.json`: `products.catalog_title`, `product_detail.{not_found_title,not_found_message,load_error_message,whatsapp_quote_message}`) + konstanta `DEFAULT_WHATSAPP_NUMBER`. *(Skill: `antislop-code`)*
- [x] **T-372** — Refaktor `controllers/public/contactController.js` & ekstraksi `services/publicContactService.js` + pertahankan konstanta `DEFAULT_TURNSTILE_SITE_KEY` & proteksi honeypot/CSRF/Turnstile/mailer background. *(Skill: `antislop-code`)*
- [x] **T-373** — Penegakan blok strict ESLint di `eslint.config.js` untuk `controllers/public/{post,page,product,contact}Controller.js` & `services/public{Post,Page,Product,Contact}Service.js` + unit test `tests/test-public-services.js` (mock model/mailer). *(Skill: `antislop-code`)*
- [ ] **T-374** — Verifikasi regresi kontrak respons (JSON AJAX `/news`, fragment HTML/JSON + 5 header `X-*` `/products`, 301 slug lama, 404, `noindex, follow`, canonical URL tepercaya, submit `/contact` AJAX/non-AJAX), gerbang CI (`npm run lint`, `npm run lint:views`, `npm run lint:i18n`, `npm test`), & bukti visual Playwright (`320px`, `768px`, `1440px`, ID & EN, 0 console error). *(Skill: `antislop-code`)*
