Status: ACTIVE | Terakhir diverifikasi: 2026-11-19 | Kode: views/public/index.ejs, controllers/public/homeController.js, services/homeService.js, controllers/admin/homeContentController.js, services/homeContentService.js

# Tech Spec: Modul Beranda Publik (Public Home)

## 1. Arsitektur & Komponen
Modul Beranda mengikuti arsitektur berlapis `Route -> Controller -> Service -> Model`:
- **Controller (`controllers/public/homeController.js`):** Menerima request `GET /`, mendelegasikan orkestrasi query paralel & penyusunan *view-model* ke `services/homeService.js`, menyiapkan judul meta terlokalisasi (`t('home.*')`), dan merender *thin page* `views/public/index.ejs` (termasuk fallback status 500 yang terlokalisasi). Import mati `productModel` dan properti mati `featuredProducts` dihapus.
- **Service (`services/homeService.js`):** Mengambil data paralel dari `bannerModel`, `brandModel`, `postModel`, `homeContentModel`, dan `productCategoryModel`, serta mengekspor *pure view-model builder* agar seluruh transformasi data berada di luar EJS dan dapat diuji terpisah oleh unit test (`<= 40` baris/fungsi, `<= 300` baris/berkas, `max-depth <= 2`, `complexity <= 8`).
- **CMS Admin:** `controllers/admin/homeContentController.js` (*thin controller* `index`/`update` via `services/homeContentService.js`), `controllers/admin/bannerController.js` (via `services/bannerService.js`), dan `controllers/admin/brandController.js` (via `services/brandService.js`) mendelegasikan seluruh validasi, sanitasi payload, resolusi media, dan operasi CRUD ke lapisan service sesuai metrik `conventions.md` (tanpa menyentuh `services/homeService.js`).
- **View & Skrip:** `views/public/index.ejs` (`<= 100` baris, nesting `<= 2`) hanya mengorkestrasikan partial di `views/partials/home/*.ejs` dan memuat `/js/home.js` (`defer`). Rincian partial, CSS, dan skrip klien dijabarkan di [tech/public-home-sections.md](public-home-sections.md).

---

## 2. Rute & Controller

| Method | Path | Controller / Handler | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | `homeController.index` | `seoMiddleware`, `settingsMiddleware`, `i18nMiddleware` | Render SSR beranda utama |
| `GET` | `/lang/:code` | Inline router handler di `routes/publicRoutes.js` | - | Mengubah cookie `euodoo_lang` (`id` atau `en`) lalu redirect aman |
| `GET/POST`| `/admin/banners*` | `bannerController.*` (`bannerService`) | `requireAuth`, `roleMiddleware(['superadmin', 'admin'])` | CRUD slide Hero Banner & toggle aktif |
| `GET/POST`| `/admin/brands*` | `brandController.*` (`brandService`) | `requireAuth`, `roleMiddleware(['superadmin', 'admin'])` | CRUD Merek Terdaftar & toggle aktif |
| `POST` | `/admin/brands/section-title` | `brandController.updateSectionTitle` (`brandService`) | `requireAuth`, `roleMiddleware(['superadmin', 'admin'])` | Mengubah judul seksi merek beranda |
| `GET` | `/admin/home-content` | `homeContentController.index` | `requireAuth`, `roleMiddleware(['superadmin', 'admin'])` | Form CMS via `homeContentService` |
| `POST` | `/admin/home-content` | `homeContentController.update` | `requireAuth`, `roleMiddleware(['superadmin', 'admin'])` | Simpan 6 seksi via `homeContentService` |

---

## 3. Skema Data Terkait

### A. Tabel `banners`
*File Migrasi:* `database/migrations/001_create_initial_schema.sql`, `005_support_youtube_banner_media_type.sql`, `014_add_secondary_cta_to_banners.sql`

| Kolom | Tipe | Nullable | Default | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Inc | Primary Key |
| `title_id` | `VARCHAR(255)` | NO | - | Judul banner (ID) |
| `title_en` | `VARCHAR(255)` | YES | NULL | Judul banner (EN) |
| `subtitle_id` | `TEXT` | YES | NULL | Subtitle banner (ID) |
| `subtitle_en` | `TEXT` | YES | NULL | Subtitle banner (EN) |
| `caption_id` | `TEXT` | YES | NULL | Deskripsi singkat (ID) |
| `caption_en` | `TEXT` | YES | NULL | Deskripsi singkat (EN) |
| `media_type` | `ENUM('image','video','youtube')` | YES | `'image'` | Tipe media slide |
| `file_url` | `VARCHAR(500)` | NO | - | Path berkas lokal atau YouTube URL |
| `poster_url` | `VARCHAR(500)` | YES | NULL | Gambar thumbnail fallback video |
| `cta_text_id` | `VARCHAR(100)` | YES | NULL | Teks tombol utama (ID) |
| `cta_text_en` | `VARCHAR(100)` | YES | NULL | Teks tombol utama (EN) |
| `cta_url` | `VARCHAR(500)` | YES | NULL | URL tautan tombol utama |
| `cta_secondary_text_id`| `VARCHAR(100)` | YES | NULL | Teks tombol kedua (ID) |
| `cta_secondary_text_en`| `VARCHAR(100)` | YES | NULL | Teks tombol kedua (EN) |
| `cta_secondary_url` | `VARCHAR(500)` | YES | NULL | URL tautan tombol kedua |
| `sort_order` | `INT` | YES | `0` | Urutan penayangan carousel |
| `is_active` | `TINYINT(1)` | YES | `1` | Flag status penayangan |

### B. Kunci Pengaturan Beranda (`settings`)
- `home_intro_title_*`, `home_intro_paragraph_1_*`, `home_intro_paragraph_2_*`, `home_intro_eyebrow_*`, `home_intro_image_url`, `home_intro_is_active`.
- `home_cat_title_*`, `home_cat_subtitle_*`, `home_categories_json`.
- `home_wcu_title_*`, `home_wcu_eyebrow_*`, `home_wcu_headline_*`, `home_wcu_desc_*`, `home_wcu_chip_label_*`, `home_wcu_chip_icon`, `home_wcu_art_label_*`, `home_wcu_float_eyebrow_*`, `home_wcu_float_title_*`, `home_wcu_float_desc_*`, `home_wcu_is_active`.
- `home_cert_title_*`, `home_cert_body_*`, `home_cert_btn_text_*`, `home_cert_btn_url`, `home_cert_show_btn`, `home_cert_is_active` (default `0`), `home_cert_items_json`.
- `home_brand_title_id`, `home_brand_title_en`.

---

## 4. Kontrak View-Model & Lokalisasi (`home.*`)
`services/homeService.js` membangun objek view-model terstruktur sebelum `res.render('public/index', ...)`:
- **`hero` (`banners`):** Menyaring banner aktif, menyediakan safety-net fallback jika kosong, mengekstrak `youtubeId` aman (`embed/`/`shorts/`/`youtu.be/`/`[?&]v=` atau ID `[a-zA-Z0-9_-]+`), memilih teks lokal, serta menormalkan `primaryCta` & `secondaryCta` melalui `resolveSafeHref` (`/`, `https?://`, `mailto:`, `tel:`, `#`) + flag `isExternal`.
- **`intro`:** Menentukan status aktif (`isActive`) dan konten terlokalisasi (`eyebrow`, `title`, `paragraph1`, `paragraph2`, `imageUrl`).
- **`categories`:** Menyiapkan header (`title`, `subtitle`), daftar maksimal 4 kategori dengan gambar fallback per segmen, label hitungan terlokalisasi (`t`), dan `colsClass` (`hcat-grid--1` s/d `hcat-grid--4`).
- **`whyChooseUs`:** Menormalkan seluruh field editorial & floating card, serta menerapkan `formatInlineText` di server untuk `titleHtml`, `headlineHtml`, dan `descHtml`.
- **`certifications`:** Menyaring item aktif, mengurutkan berdasarkan `sort_order`, dan menyiapkan tombol CTA opsional (`btnUrl` disanitasi via `resolveSafeHref`).
- **`brands`:** Menyaring merek aktif, menggandakan daftar hingga minimal 8 item per track marquee, menyiapkan `initials`, dan membaca `brandSectionTitle` sesuai bahasa.
- **`news`:** Membatasi maksimal 2 artikel terbaru, memilih `fallbackImage` aman (mengganti placeholder lama bila perlu), serta memformat tanggal publikasi sesuai locale (`id-ID`/`en-US`).
- **Kamus `locales/id.json` & `locales/en.json` (`home.*`):** Seluruh teks statis, judul meta (`meta_title_suffix`, `meta_title_fallback` serta `common.company_name` & `DEFAULT_COMPANY_NAME = 'PT Euodoo Plastic'` di `services/homeService.js`), ARIA/title kontrol slider, hitungan kategori, label WCU, marquee & modal merek, serta heading/CTA/empty-state berita didaftarkan simetris dan diaudit `npm run lint:i18n`.

---

## 5. Keamanan, CSP, & Sanitasi
- **Validasi URL CTA & Aset Banner/Merek:** `isValidCtaUrl()` dan `isValidCtaText()` di `services/bannerService.js` menerima path internal (`/products`, `/contact`, `#anchor`), URL `http://`, `https://` (`https://wa.me/`), `tel:`, dan `mailto:` (selaras dengan `resolveSafeHref` di `services/homeService.js`), serta menolak skema berbahaya (`javascript:`, `data:`, `vbscript:`, `//`). Path aset dari Media Picker disanitasi dengan `sanitizeSafePath`, dan `storage.delete` pada `bannerService`/`brandService` hanya menghapus berkas lokal (`/uploads/...`) yang bukan YouTube ID, tidak terdaftar di tabel `media` (`mediaModel.isRegisteredByUrl`), dan tidak sedang direferensikan di `mediaModel.checkUsage`.
- **Kepatuhan CSP & Anti-XSS Frontend:** Zero inline `style`, zero `<script>` inline, zero handler `on*=`, dan zero raw hex di `views/public/index.ejs` serta `views/partials/home/*.ejs` (`DEFAULT_STRICT_PATHS` di `scripts/lint-views.js`). Pada `public/js/home.js`, komunikasi `postMessage` YouTube memakai origin eksplisit (`getYoutubeOrigin`, memvalidasi `event.origin` `youtube.com`/`youtube-nocookie.com`) dan `#brandPreviewModal` membangun elemen DOM via `createElement` + `textContent` tanpa `innerHTML` interpolasi.
- **Aksesibilitas WCAG AA:** Warna mengacu pada `public/css/tokens.css`; `prefers-reduced-motion` menonaktifkan transisi & marquee continuous translate.
