Status: ACTIVE | Terakhir diverifikasi: 2026-10-21 | Kode: views/public/about.ejs, controllers/public/pageController.js

# Tech Spec: Modul Tentang Kami (Public About)

## 1. Arsitektur & Komponen
Halaman Tentang Kami (`/about`) memadukan data profil statis korporat dari tabel `settings` bersama data relasional galeri, statistik, dan lini masa sejarah dari tabel-tabel terdedikasi (`about_*`).

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
- `about_stats`: `id`, `number_value` (VARCHAR 50, mis. "1990", "1500+"), `suffix` (VARCHAR 20, mis. "Ton"), `label_id`, `label_en`, `sort_order`, `is_active`.
- `about_timeline`: `id`, `year` (VARCHAR 20, mis. "1990"), `title_id`, `title_en`, `desc_id`, `desc_en`, `image_url`, `sort_order`, `is_active`.

### C. Kunci Pengaturan Tentang Kami (`settings`)
- `about_founded_year`, `about_former_names`, `about_history_title_*`, `about_history_*`.
- `about_vision_*`, `about_mission_*`, `about_values_json` (Nilai TIKET).
- `vision_image_url`, `mission_image_url`.
- `about_gallery_kicker_*`, `about_gallery_title_*`, `about_story_kicker_*`.

---

## 4. Komponen Antarmuka & Prefix CSS

- **Galeri Mosaik Bento:**
  - Prefix Class: `.sec-gallery`, `.abt-gal-container`, `.abt-gal-viewport`, `.abt-gal-grid`, `.abt-gal-tile`.
  - Varian Posisi Tile: `.abt-gal-tile--pos-1` s/d `.abt-gal-tile--pos-6`, `.abt-gal-tile--tall`, `.abt-gal-tile--wide`.
  - Varian Grid Dinamis Halaman: `.abt-gal-grid--6`, `.abt-gal-grid--5`, `.abt-gal-grid--4`, `.abt-gal-grid--3`, `.abt-gal-grid--2`, `.abt-gal-grid--1`.
  - Kontrol Paginasi: `.abt-gal-pager`, `.abt-gal-pager-count`, `.abt-gal-pager-btn`.
  - Animasi Engine: Anime.js v3 Shutter Wipe di `public/js/main.js:469-580`.
- **Nilai Inti Perusahaan:** `.sec-values`, `.value-card.pillar-card`, `.value-letter`.
- **Statistik & Timeline:** `.sec-stats`, `.stat-num` (count-up target), `.timeline-card`, `.timeline-node`.

---

## 5. Keamanan & Performa
- **Zero CLS Galeri:** Kontainer `.abt-gal-viewport` menggunakan tinggi terhitung tetap dan penumpukan layer posisi absolut selama transisi antar halaman.
- **Image Pre-Decode:** Sebelum slide baru dianimasikan ke dalam viewport, gambar di-decode via JavaScript `img.decode()` untuk memastikan bebas kedipan (*zero flicker*).
