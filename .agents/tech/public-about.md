Status: ACTIVE | Terakhir diverifikasi: 2026-11-16 | Kode: views/public/about.ejs, views/partials/about/story-counter.ejs, views/partials/about/history-timeline.ejs, views/partials/about/vision-mission.ejs, views/partials/about/ticket-accordion.ejs, views/partials/about/gallery-bento.ejs, controllers/public/pageController.js, controllers/admin/aboutController.js, services/aboutService.js, services/aboutCrudService.js [PENDING T-349], public/js/about-story.js, public/js/ticket-accordion.js, public/js/main.js, public/js/lightbox.js, public/css/lightbox.css

# Tech Spec: Modul Tentang Kami (Public About)

## 1. Arsitektur & Komponen
Halaman Tentang Kami (`/about`) memadukan profil korporat dari tabel `settings` dengan data relasional `about_gallery_slides`, `about_stats`, dan `about_timeline` (`models/aboutModel.js`), dirender SSR melalui *thin page* dan partial modular serta dilengkapi paginasi galeri bento + Lightbox PhotoSwipe v5 (`.lbx-*`).
- **Arsitektur CMS Admin About (`Route -> Controller -> Service -> Model`) `[PENDING T-349]`:** `controllers/admin/aboutController.js` bertindak sebagai *thin controller* (`<= 40` baris/fungsi, `max-depth <= 2`, `complexity <= 8`) pengelola HTTP request/response (`res.render`, `res.redirect`, `sendTabSuccess`, `sendTabError` untuk form redirect & JSON XHR) tanpa mengimpor model maupun `processAndSaveWebP`. `services/aboutService.js` menangani orkestrasi halaman utama (`getAdminAboutPageData`, `updateAdminAboutContent` via `aboutModel.updateAboutData`), parser profil/T-I-C-K-E-T/header, dan re-export parser sub-item; `services/aboutCrudService.js` menangani parser & CRUD sub-item Gallery/Stats/Timeline dengan status terstruktur (`ok` | `validation_error` | `not_found`).

---

## 2. Rute & Controller

| Method | Path | Controller | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/about` | `pageController.about` | `seoMiddleware`, `settingsMiddleware`, `i18nMiddleware` | Render SSR `/about` (`<= 40` baris/fungsi, fallback `t('about.*')`) |
| `GET` | `/admin/about` | `aboutController.index` | `requireAuth`, `roleMiddleware(['superadmin', 'admin'])` | CMS Tentang Kami via `aboutService.getAdminAboutPageData` `[PENDING T-349]` |
| `POST` | `/admin/about` | `aboutController.update` | `requireAuth`, `roleMiddleware`, `uploadMedia` | Update profil, visi misi, T-I-C-K-E-T, & foto WebP via `aboutService.updateAdminAboutContent` `[PENDING T-349]` |
| `POST` | `/admin/about/gallery` & `/:id/{update,delete}` | `aboutController.{store,update,delete}GallerySlide` | `requireAuth`, `roleMiddleware` | CRUD slide galeri bento via `aboutCrudService` (HTML redirect / XHR JSON `200/400/404/500`) `[PENDING T-349]` |
| `POST` | `/admin/about/stats` & `/:id/{update,delete}` | `aboutController.{store,update,delete}Stats` | `requireAuth`, `roleMiddleware` | CRUD angka statistik (maks 8) via `aboutCrudService` (HTML redirect / XHR JSON `200/400/404/500`) `[PENDING T-349]` |
| `POST` | `/admin/about/timeline` & `/:id/{update,delete}` | `aboutController.{store,update,delete}Timeline` | `requireAuth`, `roleMiddleware` | CRUD simpul sejarah via `aboutCrudService` (HTML redirect / XHR JSON `200/400/404/500`) `[PENDING T-349]` |

---

## 3. Skema Data Terkait

### A. Tabel `about_gallery_slides`
*Migrasi:* `007_create_about_gallery_stats_timeline.sql`, `008_make_about_gallery_title_nullable.sql`

| Kolom | Tipe | Nullable | Default | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Inc | Primary Key |
| `image_url` | `VARCHAR(500)` | NO | - | Path gambar WebP |
| `title_id` / `title_en` | `VARCHAR(255)` | YES | NULL | Judul foto opsional |
| `caption_id` / `caption_en` | `TEXT` | YES | NULL | Keterangan foto |
| `tag` | `VARCHAR(100)` | YES | NULL | Kategori foto |
| `sort_order` | `INT` | YES | `0` | Urutan tile |
| `is_active` | `TINYINT(1)` | YES | `1` | Status penayangan |

### B. Tabel `about_stats`, `about_timeline` & Pengaturan `settings`
*Migrasi:* `007_create_about_gallery_stats_timeline.sql`
- `about_stats`: `id`, `stat_value` (`VARCHAR(50)`), `label_id`, `label_en`, `sort_order`, `is_active`, timestamps.
- `about_timeline`: `id`, `year_label_id/en` (`VARCHAR(100)`), `title_id/en` (`VARCHAR(255)`), `description_id/en` (`TEXT`), `sort_order`, `is_active`, timestamps.
- Kunci `settings`: `about_founded_year`, `about_former_names`, `about_history_*`, `about_vision_*`, `about_mission_*`, `vision_image_url`, `mission_image_url`, `about_story_kicker_*`, `about_gallery_kicker_*`, `about_gallery_title_*`, `about_values_*` (lihat [tech/public-about-ticket.md](public-about-ticket.md)), serta `about_timeline_{tagline,title,desc}_{id,en}` (lihat [tech/public-about-timeline.md](public-about-timeline.md)).

---

## 4. Komponen Antarmuka & Prefix CSS
- **Thin Page & Hero (`views/public/about.ejs`):** `<= 100` baris, nesting `<= 2`, bebas komentar HTML, inline style, dan string fallback literal (`t('about.*')`). `.page-hero` menggunakan `<img class="page-hero-bg-img" fetchpriority="high" decoding="async">` + `.page-hero-scrim[data-scrim-level]` di CSS.
- **Visi & Misi (`views/partials/about/vision-mission.ejs`):** Partial `<= 100` baris dengan `.sec-vm`, `.vm-*`, `.abt-vm-*`, dan fallback `t('about.*')`.
- **Galeri Bento (`views/partials/about/gallery-bento.ejs`) & Lightbox:**
  - Partial `<= 100` baris; indeks animasi stagger dipetakan di CSS (`.abt-gal-tile--pos-1..6`) tanpa `style="--tile-i: ..."`.
  - Prefix `.sec-gallery`, `.abt-gal-{container,viewport,grid,tile,pager,pager-count,pager-btn}`, `.bento-*`, serta varian `.abt-gal-grid--1..6`.
  - Event delegation `#bentoGallery` / `#bentoGrid` memicu `window.EuodooLightbox.open(slidesData, globalIndex, tileEl)` atas array `#bentoGalleryData` (detail Lightbox `.lbx-*` di `tech/products-detail.md`).
- **Story Counter & Timeline:** Didelegasikan ke [tech/public-about-timeline.md](public-about-timeline.md) (`.abt-cnt-*`, `.abt-htl-*`).
- **Budaya Kerja T-I-C-K-E-T:** Didelegasikan ke [tech/public-about-ticket.md](public-about-ticket.md) (`.abt-tkt-*`).
- **Latar Selang-Seling & Token:** `.sec-story` & fallback `.abt-tkt-section` memakai `var(--bg-soft-green)`; `.sec-vm` & `.sec-gallery` memakai `var(--bg-subtle)` dengan pseudo-element gradasi tepi `48px` (mobile) / `80px` (desktop) dari token `--trans-*`. Seluruh selektor `.page-hero*`, `.abt-*`, `.sec-vm / .vm-*`, `.sec-gallery` merujuk penuh ke `public/css/tokens.css` tanpa hex mentah dan lulus strict `lint:views`.

---

## 5. Performa Galeri
- **Zero CLS:** `.abt-gal-viewport` menjaga tinggi kontainer tetap selama pergantian halaman.
- **Image Pre-Decode:** `public/js/main.js` menjalankan `img.decode()` sebelum animasi Anime.js Shutter Wipe.
