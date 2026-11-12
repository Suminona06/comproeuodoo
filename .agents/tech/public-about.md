Status: ACTIVE | Terakhir diverifikasi: 2026-11-12 | Kode: views/public/about.ejs, views/partials/about/story-counter.ejs, views/partials/about/history-timeline.ejs, controllers/public/pageController.js, public/js/about-story.js, public/js/main.js, public/js/lightbox.js, public/css/lightbox.css

# Tech Spec: Modul Tentang Kami (Public About)

## 1. Arsitektur & Komponen
Halaman Tentang Kami (`/about`) memadukan data profil statis korporat dari tabel `settings` bersama data relasional galeri (dengan paginasi sisi klien dan Lightbox Zoom layar penuh bersama `.lbx-*`), statistik, dan lini masa sejarah dari tabel-tabel terdedikasi (`about_*`).

---

## 2. Rute & Controller

| Method | Path | Controller / Handler | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/about` | `pageController.about` | `seoMiddleware`, `settingsMiddleware`, `i18nMiddleware` | Render SSR halaman Tentang Kami |
| `GET` | `/admin/about` | `aboutController.index` | `requireAuth`, `roleMiddleware(['superadmin', 'admin'])` | CMS kelola konten Tentang Kami |
| `POST` | `/admin/about` | `aboutController.update` | `requireAuth`, `roleMiddleware`, `uploadMedia` | Update profil umum & foto visi misi |
| `POST` | `/admin/about/gallery` | `aboutController.storeGallerySlide` | `requireAuth`, `roleMiddleware` | Tambah slide galeri bento |
| `POST` | `/admin/about/stats` | `aboutController.storeStats` | `requireAuth`, `roleMiddleware` | Tambah angka statistik |
| `POST` | `/admin/about/timeline`| `aboutController.storeTimeline` | `requireAuth`, `roleMiddleware` | Tambah simpul sejarah |

---

## 3. Skema Data Terkait

### A. Tabel `about_gallery_slides`
*File Migrasi:* `database/migrations/007_create_about_gallery_stats_timeline.sql`, `008_make_about_gallery_title_nullable.sql`

| Kolom | Tipe | Nullable | Default | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Inc | Primary Key |
| `image_url` | `VARCHAR(500)` | NO | - | Path berkas gambar WebP |
| `title_id` | `VARCHAR(255)` | YES | NULL | Judul foto (ID, bersifat opsional) |
| `title_en` | `VARCHAR(255)` | YES | NULL | Judul foto (EN, bersifat opsional) |
| `caption_id` | `TEXT` | YES | NULL | Keterangan foto (ID) |
| `caption_en` | `TEXT` | YES | NULL | Keterangan foto (EN) |
| `tag` | `VARCHAR(100)` | YES | NULL | Kategori foto (misal: Pabrik, Mesin, Tim) |
| `sort_order` | `INT` | YES | `0` | Urutan penataan tile |
| `is_active` | `TINYINT(1)` | YES | `1` | Status penayangan |

### B. Tabel `about_stats` & `about_timeline`
*File Migrasi:* `database/migrations/007_create_about_gallery_stats_timeline.sql`
- `about_stats`: `id` (INT PK), `stat_value` (VARCHAR 50, menyimpan nilai gabungan angka dan sufiks seperti `'30+'`, `'1990'`, `'1.500+'`), `label_id` (VARCHAR 255), `label_en` (VARCHAR 255), `sort_order` (INT), `is_active` (TINYINT 1), `created_at`, `updated_at`.
- `about_timeline`: `id` (INT PK), `year_label_id` (VARCHAR 100), `year_label_en` (VARCHAR 100), `title_id` (VARCHAR 255), `title_en` (VARCHAR 255), `description_id` (TEXT), `description_en` (TEXT), `sort_order` (INT), `is_active` (TINYINT 1), `created_at`, `updated_at`.

### C. Kunci Pengaturan Tentang Kami (`settings`)
- `about_founded_year`, `about_former_names`, `about_history_title_*`, `about_history_*`.
- `about_vision_*`, `about_mission_*`.
- `about_values_bg_image`, `about_values_pill_*`, `about_values_subtitle_*`, `about_values_json` (6 Pilar Budaya Kerja Interaktif, spesifikasi teknis lengkap didelegasikan ke [tech/public-about-ticket.md](public-about-ticket.md)).
- `vision_image_url`, `mission_image_url`.
- `about_gallery_kicker_*`, `about_gallery_title_*`, `about_story_kicker_*`.
- `about_timeline_tagline_id`, `about_timeline_tagline_en`, `about_timeline_title_id`, `about_timeline_title_en`, `about_timeline_desc_id`, `about_timeline_desc_en` (6 kunci header Timeline Sejarah yang dikelola di `/admin/about` melalui `aboutModel.getTimelineHeader()` dan `aboutModel.updateAboutData()`, spesifikasi teknis lengkap didelegasikan ke [tech/public-about-timeline.md](public-about-timeline.md)).

---

## 4. Komponen Antarmuka & Prefix CSS

- **Sistem Latar Selang-Seling & Transisi Tepi (`.sec-story`, `.sec-vm`, `.abt-tkt-section`, `.sec-gallery`, `.abt-*`):**
  - `.sec-story#sejarah` menggunakan `background-color: var(--bg-soft-green)`.
  - `.sec-vm#visi-misi` menggunakan `background-color: var(--bg-subtle)` dengan pseudo-element `::before` bertinggi `48px` (mobile `< 768px`) dan `80px` (desktop `>= 768px`) memakai `background: var(--trans-soft-green-to-subtle)`.
  - `.abt-tkt-section#core-values` mempertahankan foto latar operasional beserta `.abt-tkt-bg-scrim` yang menyatu mulus di tepi atas/bawah; apabila tanpa foto latar, fallback menggunakan `var(--bg-soft-green)` dengan transisi tepi `var(--trans-subtle-to-soft-green)`.
  - `.sec-gallery#galeri` menggunakan `background-color: var(--bg-subtle)` dengan pseudo-element gradasi tepi atas yang menyatu dari section sebelumnya, sementara kartu `.abt-cnt-card` dan `.vm-card` mempertahankan `background: var(--color-surface)` dan elevasi token.
  - Seluruh atribut `style="..."` inline pada `views/public/about.ejs` dipindahkan ke class CSS ter-scope berprefix `.abt-*` (`.abt-hero-content`, `.abt-vm-point-text`, serta atribut `hidden` pada `#bentoPager`) dan teks menggunakan kamus `t('about.*')`.
- **Nilai Inti Budaya Kerja (.abt-tkt-*):** Interactive Expanding Accordion 6 pilar menggantikan `.sec-values` legacy (spesifikasi arsitektur DOM, kontrak SVG whitelist, lifecycle anime.js, dan form admin didelegasikan ke [tech/public-about-ticket.md](public-about-ticket.md)).
- **Galeri Mosaik Bento & Integrasi Lightbox (`.abt-gal-*` & `.lbx-*`):**
  - Prefix Class: `.sec-gallery`, `.abt-gal-container`, `.abt-gal-viewport`, `.abt-gal-grid`, `.abt-gal-tile`, serta `.bento-grid` dan `.sec-gallery .bento-*`.
  - Varian Posisi Tile: `.abt-gal-tile--pos-1` s/d `.abt-gal-tile--pos-6`, `.abt-gal-tile--tall`, `.abt-gal-tile--wide`.
  - Varian Grid Dinamis Halaman: `.abt-gal-grid--6`, `.abt-gal-grid--5`, `.abt-gal-grid--4`, `.abt-gal-grid--3`, `.abt-gal-grid--2`, `.abt-gal-grid--1`.
  - Kontrol Paginasi: `.abt-gal-pager`, `.abt-gal-pager-count`, `.abt-gal-pager-btn`.
  - Animasi Engine: Anime.js v3 Shutter Wipe di `public/js/main.js`.
  - **Integrasi Lightbox Lintas Halaman Pager:**
    - Baik render awal SSR di `views/public/about.ejs` maupun fungsi `createSingleTile(item, idx, globalIdx)` di `public/js/main.js` menyematkan atribut `data-slide-index="<globalIndex>"`, `tabindex="0"`, `role="button"`, dan `aria-label` dwibahasa (ID/EN) pada setiap `.abt-gal-tile`.
    - Listener menggunakan *event delegation* pada kontainer `#bentoGalleryGrid` untuk menangkap klik dan `keydown` (`Enter`/`Space`) pada `.abt-gal-tile`, lalu memanggil `window.EuodooLightbox.open(slidesData, globalIndex, tileEl)` menggunakan array penuh dari `#bentoGalleryData` (bukan hanya 6 tile halaman aktif).
    - Komponen bersama Lightbox dimuat dari PhotoSwipe v5 *self-hosted* (`public/vendor/photoswipe/`) bersama `public/css/lightbox.css` dan `public/js/lightbox.js` berprefix `.lbx-*` (detail penuh pada `tech/products-detail.md` Bagian 6.2), menampilkan *caption* kategori (`category`) dan judul (`title`), penghitung `"3 / 12"`, kontrol *zoom* klik + tombol `+`/`-` di desktop, serta *double-tap* + *pinch-to-zoom* + *swipe* di perangkat sentuh.
- **Counter Statistik 2x2 Ber-Notch & Horizontal Timeline Slider (`.abt-cnt-*` & `.abt-htl-*`):**
  - Menggantikan class legacy `.story-layout`, `.story-sticky`, `.story-stats`, `.story-stat*`, `.timeline`, `.tl-*`, dan `.abt-tl-empty` di dalam `<section class="sec-story" id="sejarah">`.
  - Dimodularisasi menjadi partial `views/partials/about/story-counter.ejs` (`.abt-cnt-*`) dan `views/partials/about/history-timeline.ejs` (`.abt-htl-*`) beserta script ter-scope `public/js/about-story.js`.
  - Spesifikasi teknis lengkap (struktur DOM, CSS `radial-gradient` *inverted corner mask*, mikro-interaksi lencana pusat Anime.js, parser *count-up*, mekanik slider `scroll-snap` + garis progres `is-filled`, dan kontrak form admin header timeline) didelegasikan ke [tech/public-about-timeline.md](public-about-timeline.md).

---

## 5. Keamanan & Performa
- **Zero CLS Galeri:** Kontainer `.abt-gal-viewport` menggunakan tinggi terhitung tetap dan penumpukan layer posisi absolut selama transisi antar halaman.
- **Image Pre-Decode:** Sebelum slide baru dianimasikan ke dalam viewport, gambar di-decode via JavaScript `img.decode()` untuk memastikan bebas kedipan (*zero flicker*).
