# Peta Dokumen Spesifikasi PT Euodoo

*Panduan Agent: Baca berkas ini terlebih dahulu. Pilih modul spesifik yang relevan dengan tugas. Dilarang membaca seluruh arsip sekaligus.*

## 1. Dokumen Utama & Alur Kerja
- [WORKFLOW.md](WORKFLOW.md): Panduan alur pengajuan perubahan & penulisan task (<=40 baris).
- [CHANGELOG.md](CHANGELOG.md): Riwayat stempel waktu perubahan selesai per tanggal.
- [3-TASKS.md](3-TASKS.md): Daftar task aktif terbuka (T-199 s/d T-203) & ringkasan task selesai.
- [1-PRD.md](1-PRD.md): Entry point visi, persona, NFR, dan batasan produk.
- [2-TECH-SPEC.md](2-TECH-SPEC.md): Entry point arsitektur stack, standar database, dan token desain.

## 2. Modul Spesifikasi Fungsional & Teknis (Kondisi Aktif)

| Modul | Status | Verifikasi | Spesifikasi PRD | Spesifikasi Teknis | Path Kode Utama |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Public Home** | ACTIVE | 2026-10-21 | [prd/public-home.md](prd/public-home.md) | [tech/public-home.md](tech/public-home.md) | `views/public/index.ejs` |
| **Public About** | ACTIVE | 2026-10-21 | [prd/public-about.md](prd/public-about.md) | [tech/public-about.md](tech/public-about.md) | `views/public/about.ejs` |
| **Products Catalog** | ACTIVE | 2026-10-23 | [prd/products.md](prd/products.md) | [tech/products.md](tech/products.md) | `views/public/products.ejs` |
| **Products Detail** | ACTIVE | 2026-10-23 | [prd/products.md](prd/products.md) | [tech/products-detail.md](tech/products-detail.md) | `views/public/product-detail.ejs` |
| **Manufacturing Capabilities** | ACTIVE | 2026-10-21 | [prd/capabilities.md](prd/capabilities.md) | [tech/capabilities.md](tech/capabilities.md) | `views/public/capabilities.ejs` |
| **News & Articles** | ACTIVE | 2026-10-21 | [prd/news.md](prd/news.md) | [tech/news.md](tech/news.md) | `views/public/news.ejs` |
| **Contact, Footer & WA** | ACTIVE | 2026-10-21 | [prd/contact-footer.md](prd/contact-footer.md) | [tech/contact-footer.md](tech/contact-footer.md) | `views/public/contact.ejs` |
| **Admin CMS & Users** | ACTIVE | 2026-10-21 | [prd/admin-cms.md](prd/admin-cms.md) | [tech/admin-cms.md](tech/admin-cms.md) | `controllers/admin/` |
| **Media Library** | ACTIVE | 2026-10-21 | [prd/media-library.md](prd/media-library.md) | [tech/media-library.md](tech/media-library.md) | `views/admin/media/` |
| **SEO & Security** | ACTIVE | 2026-10-21 | [prd/seo-security.md](prd/seo-security.md) | [tech/seo-security.md](tech/seo-security.md) | `middleware/seoMiddleware.js` |
| **Site Settings** | ACTIVE | 2026-10-21 | [prd/settings.md](prd/settings.md) | [tech/settings.md](tech/settings.md) | `controllers/admin/settingController.js` |

## 3. Direktori Pendukung
- `changes/`: Proposal perubahan berjalan (dihapus/dipindah ke archive saat close).
- `archive/`: Dokumen historis, RCA bug lama, dan arsip task lengkap [archive/tasks-index-full.md](archive/tasks-index-full.md).
