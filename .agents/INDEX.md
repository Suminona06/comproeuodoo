# Peta Dokumen Spesifikasi PT Euodoo

*Panduan Agent: Baca berkas ini terlebih dahulu. Pilih modul spesifik yang relevan dengan tugas. Dilarang membaca seluruh arsip sekaligus.*

## 1. Dokumen Utama & Alur Kerja
- [WORKFLOW.md](WORKFLOW.md): Panduan alur pengajuan perubahan & penulisan task (<=40 baris).
- [CHANGELOG.md](CHANGELOG.md): Riwayat stempel waktu perubahan selesai per tanggal.
- [3-TASKS.md](3-TASKS.md): Daftar task aktif terbuka (0 Task aktif; 467 task selesai T-01..T-467).
- [1-PRD.md](1-PRD.md): Entry point visi, persona, NFR, dan batasan produk.
- [2-TECH-SPEC.md](2-TECH-SPEC.md): Entry point arsitektur stack, standar database, dan token desain.

## 2. Modul Spesifikasi Fungsional & Teknis (Kondisi Aktif)

| Modul | Status | Verifikasi | Spesifikasi PRD | Spesifikasi Teknis | Path Kode Utama |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Public Home** | ACTIVE | 2026-11-24 | [prd/public-home.md](prd/public-home.md) | [tech/public-home.md](tech/public-home.md) | `views/public/index.ejs`, `controllers/public/homeController.js`, `services/homeService.js`, `controllers/admin/homeContentController.js`, `services/homeContentService.js` |
| **Public Home Sections** | ACTIVE | 2026-11-24 | [prd/public-home-sections.md](prd/public-home-sections.md) | [tech/public-home-sections.md](tech/public-home-sections.md) | `views/partials/home/*.ejs`, `public/js/home.js`, `public/images/wcu-botanical.svg` |
| **Public Home News Carousel** | ACTIVE | 2026-11-24 | [prd/public-home-sections.md](prd/public-home-sections.md) | [tech/public-home-news-carousel.md](tech/public-home-news-carousel.md) | `views/partials/home/news.ejs`, `services/homeService.js`, `public/js/home-news-carousel.js` |
| **Public Header & Motion** | ACTIVE | 2026-11-21 | [prd/public-home-sections.md](prd/public-home-sections.md) | [tech/public-header-motion.md](tech/public-header-motion.md) | `views/partials/navbar.ejs`, `public/js/main.js`, `public/css/layout.css` |
| **Public About** | ACTIVE | 2026-11-20 | [prd/public-about.md](prd/public-about.md) | [tech/public-about.md](tech/public-about.md) | `views/public/about.ejs`, `views/partials/about/vision-mission.ejs`, `views/partials/about/gallery-bento.ejs`, `controllers/public/pageController.js`, `services/publicPageService.js`, `controllers/admin/aboutController.js`, `services/aboutService.js`, `services/aboutCrudService.js` |
| **Public About Story & Timeline** | ACTIVE | 2026-11-23 | [prd/public-about-timeline.md](prd/public-about-timeline.md) | [tech/public-about-timeline.md](tech/public-about-timeline.md) | `views/partials/about/story-counter.ejs`, `views/partials/about/history-timeline.ejs`, `public/js/about-story.js` |
| **Public About Ticket Accordion** | ACTIVE | 2026-11-16 | [prd/public-about.md](prd/public-about.md) | [tech/public-about-ticket.md](tech/public-about-ticket.md) | `views/partials/about/ticket-accordion.ejs`, `public/js/ticket-accordion.js` |
| **Products Catalog** | ACTIVE | 2026-11-21 | [prd/products.md](prd/products.md) | [tech/products.md](tech/products.md) | `views/public/products.ejs`, `controllers/public/productController.js`, `services/publicProductService.js` |
| **Products Detail** | ACTIVE | 2026-11-21 | [prd/products-detail.md](prd/products-detail.md) | [tech/products-detail.md](tech/products-detail.md) | `views/public/product-detail.ejs`, `views/partials/products/spec-tabs.ejs`, `views/partials/products/size-table.ejs`, `controllers/public/productController.js`, `services/publicProductService.js` |
| **Products Detail Gallery** | ACTIVE | 2026-11-21 | [prd/products-detail.md](prd/products-detail.md) | [tech/products-detail-gallery.md](tech/products-detail-gallery.md) | `views/partials/products/gallery.ejs`, `services/publicProductService.js`, `public/js/product-detail.js`, `public/js/lightbox.js`, `public/css/lightbox.css` |
| **Products Variants (PDP, WA & RFQ)** | ACTIVE | 2026-11-21 | [prd/products-detail.md](prd/products-detail.md) | [tech/products-variants.md](tech/products-variants.md) | `services/productVariantService.js`, `public/js/product-variants.js`, `public/js/admin-product-variants.js`, `views/admin/products/partials/variants.ejs` |
| **Manufacturing Capabilities** | ACTIVE | 2026-11-20 | [prd/capabilities.md](prd/capabilities.md) | [tech/capabilities.md](tech/capabilities.md) | `views/public/capabilities.ejs`, `controllers/public/pageController.js`, `services/publicPageService.js`, `controllers/admin/capabilityController.js`, `services/capabilityService.js` |
| **News & Articles** | ACTIVE | 2026-11-24 | [prd/news.md](prd/news.md) | [tech/news.md](tech/news.md) | `views/public/news.ejs`, `controllers/public/postController.js`, `services/publicPostService.js` |
| **News Card & Arrows** | ACTIVE | 2026-11-24 | [prd/news.md](prd/news.md) | [tech/news-card.md](tech/news-card.md) | `views/partials/news-card.ejs`, `views/partials/news/headline-section.ejs`, `public/js/news-filter.js` |
| **News Detail** | ACTIVE | 2026-11-20 | [prd/news-detail.md](prd/news-detail.md) | [tech/news-detail.md](tech/news-detail.md) | `views/public/news-detail.ejs`, `public/js/news-detail.js`, `controllers/public/postController.js`, `services/publicPostService.js` |
| **Contact, Footer & WA** | ACTIVE | 2026-11-21 | [prd/contact-footer.md](prd/contact-footer.md) | [tech/contact-footer.md](tech/contact-footer.md) | `views/public/contact.ejs`, `views/partials/contact/*.ejs`, `public/js/contact.js`, `controllers/public/contactController.js`, `services/publicContactService.js` |
| **Public Footer** | ACTIVE | 2026-11-16 | [prd/footer.md](prd/footer.md) | [tech/footer.md](tech/footer.md) | `views/partials/footer.ejs`, `public/css/layout.css` |
| **Public UI — Modular CSS Architecture** | ACTIVE | 2026-11-26 | - | [tech/public-ui-css.md](tech/public-ui-css.md) | `public/css/components/*.css`, `public/css/tokens.css`, `views/partials/head.ejs` |
| **Admin CMS & Users** | ACTIVE | 2026-11-19 | [prd/admin-cms.md](prd/admin-cms.md) | [tech/admin-cms.md](tech/admin-cms.md) | `controllers/admin/` |
| **Admin Products & RFQ** | ACTIVE | 2026-11-21 | [prd/admin-products-rfq.md](prd/admin-products-rfq.md) | [tech/admin-products-rfq.md](tech/admin-products-rfq.md) | `controllers/admin/productController.js`, `controllers/admin/inquiryController.js`, `services/inquiryService.js` |
| **Admin UI, Buttons, Pagination & Validation** | ACTIVE | 2026-11-26 | [prd/admin-ui.md](prd/admin-ui.md) | [tech/admin-ui.md](tech/admin-ui.md) | `public/css/admin/buttons.css`, `public/css/admin/pagination.css`, `public/js/pagination.js`, `public/js/admin-form-validation.js` |
| **Admin UI — Modular CSS Architecture** | ACTIVE | 2026-11-26 | [prd/admin-ui.md](prd/admin-ui.md) | [tech/admin-ui-css.md](tech/admin-ui-css.md) | `public/css/admin/*.css`, `views/partials/admin-header.ejs`, `views/admin/login.ejs`, `views/admin/403.ejs` |
| **Admin UI Dropdown Component** | ACTIVE | 2026-11-26 | [prd/admin-ui.md](prd/admin-ui.md) | [tech/admin-ui-dropdown.md](tech/admin-ui-dropdown.md) | `public/css/admin/dropdown.css`, `public/js/admin-dropdown.js` |
| **Admin UI: Tabs & Bulk Actions** | ACTIVE | 2026-11-27 | [prd/admin-ui-tabs-bulk.md](prd/admin-ui-tabs-bulk.md) | [tech/admin-ui-tabs-bulk.md](tech/admin-ui-tabs-bulk.md) | `public/css/admin/tabs-toggles.css`, `public/css/admin/tables-badges.css`, `public/js/admin-bulk-delete.js`, `utils/bulkIdsHelper.js` |
| **Media Library** | ACTIVE | 2026-11-21 | [prd/media-library.md](prd/media-library.md) | [tech/media-library.md](tech/media-library.md) | `views/admin/media/`, `controllers/admin/mediaController.js`, `services/mediaService.js` |
| **Media Library — Universal Picker** | ACTIVE | 2026-11-21 | [prd/media-library.md](prd/media-library.md) | [tech/media-picker.md](tech/media-picker.md) | `views/partials/media-picker-modal.ejs`, `public/js/media-picker.js`, `public/js/admin-media.js` |
| **SEO & Security** | ACTIVE | 2026-11-17 | [prd/seo-security.md](prd/seo-security.md) | [tech/seo-security.md](tech/seo-security.md) | `middleware/seoMiddleware.js` |
| **Site Settings** | ACTIVE | 2026-11-19 | [prd/settings.md](prd/settings.md) | [tech/settings.md](tech/settings.md) | `controllers/admin/settingController.js`, `controllers/admin/contactCmsController.js`, `services/settingService.js` |
| **Site Settings Footer** | ACTIVE | 2026-11-16 | [prd/settings.md](prd/settings.md) | [tech/settings-footer.md](tech/settings-footer.md) | `services/settingService.js`, `views/admin/settings/partials/footer-content-card.ejs`, `public/js/admin-settings.js` |
| **Site Settings Branding Assets** | ACTIVE | 2026-11-03 | [prd/settings.md](prd/settings.md) | [tech/settings-assets.md](tech/settings-assets.md) | `middleware/uploadMiddleware.js`, `views/admin/settings/partials/visual-identity-card.ejs` |
| **Code Conventions & Standards** | ACTIVE | 2026-11-26 | - | [tech/conventions.md](tech/conventions.md) | `views/`, `controllers/`, `services/` |
| **Code Conventions — Linting & Strict** | ACTIVE | 2026-11-26 | - | [tech/conventions-lint.md](tech/conventions-lint.md) | `eslint.config.js`, `scripts/lint-views.js`, `scripts/lint-i18n.js` |
| **CI/CD & Seed Snapshot** | ACTIVE | 2026-11-16 | - | [tech/ci-cd-seeding.md](tech/ci-cd-seeding.md) | `database/migrate.js`, `database/seeds/`, `.github/workflows/ci.yml` |

## 3. Direktori Pendukung
- `changes/`: Proposal perubahan berjalan (dihapus/dipindah ke archive saat close).
- `archive/`: Dokumen historis, RCA bug lama, dan arsip task lengkap [archive/tasks-index-full.md](archive/tasks-index-full.md).
