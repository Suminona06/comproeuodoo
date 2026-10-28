Status: ACTIVE | Terakhir diverifikasi: 2026-10-27 | Kode: views/public/index.ejs, controllers/public/homeController.js

# Tech Spec: Modul Beranda Publik (Public Home)

## 1. Arsitektur & Komponen
Modul Beranda memadukan data dari tabel `banners`, `product_categories`, `brands`, `posts`, dan `settings` melalui controller tunggal `controllers/public/homeController.js`.

---

## 2. Rute & Controller

| Method | Path | Controller / Handler | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | `homeController.index` | `seoMiddleware`, `settingsMiddleware`, `i18nMiddleware` | Render SSR beranda utama |
| `GET` | `/lang/:code` | Inline router handler di `routes/publicRoutes.js` | - | Mengubah cookie `euodoo_lang` (`id` atau `en`) lalu redirect |
| `POST` | `/admin/brands/section-title` | `brandController.updateSectionTitle` | `requireAuth`, `roleMiddleware(['superadmin', 'admin'])` | Mengubah judul seksi merek beranda |

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
- `home_cat_title_*`, `home_cat_subtitle_*`.
- `home_wcu_title_*`, `home_wcu_eyebrow_*`, `home_wcu_headline_*`, `home_wcu_desc_*`, `home_wcu_chip_label_*`, `home_wcu_chip_icon`, `home_wcu_art_label_*`, `home_wcu_float_title_*`, `home_wcu_float_desc_*`, `home_wcu_is_active`.
- `home_cert_title_*`, `home_cert_body_*`, `home_cert_btn_text_*`, `home_cert_btn_url`, `home_cert_show_btn`, `home_cert_is_active` (default `0`), `home_cert_items_json`.
- `home_brand_title_id`, `home_brand_title_en`.

---

## 4. Komponen Antarmuka & Prefix CSS

- **Header & Navigasi Publik:**
  - Top Bar & Transisi Blur: `.top-bar` menyertakan transisi `backdrop-filter 0.3s ease` dan `-webkit-backdrop-filter 0.3s ease`. Saat `.header-wrap.is-scrolled` aktif, filter memudar bertahap dari `blur(4px)` menuju `blur(0px)` beriringan dengan `opacity: 0` dan penciutan baris grid `.top-bar-wrap`.
  - Drawer Navigasi Mobile: Panel `.nav-menu` dan `.menu-backdrop` dikendalikan via tweening Anime.js v3.2.2. Buka: `translateY: [-12, 0]` dan `opacity: [0, 1]` dengan cascade staggered link navigasi. Tutup: `translateY: [0, -12]` dan `opacity: [1, 0]` diselesaikan tuntas sebelum status visibilitas dicabut. Mendukung fallback instan pada `prefers-reduced-motion: reduce`.
- **Hero Slider & Dual CTA:** `.hero.hero-slider`, `.hero-slide`, `.hero-content`, `.hero-actions.hero-cta-wrap`, `.hero-cta-btn--primary`, `.hero-cta-btn--secondary`.
  - Responsive rule: Desktop horizontal flex, Mobile (`< 768px`) stack vertikal 100% width.
- **4 Panel Kategori Primer:** `.sec-products`, `.prod-header`, `.prod-title`, `.prod-subtitle`, `.hcat-grid`, `.hcat-panel`, `.hcat-img`, `.hcat-scrim`, `.hcat-title`, `.hcat-count`, `.hcat-arrow`, `.prod-more-wrap`, `.btn-see-more`.
  - Grid rule: Menggunakan `--hcat-cols: 4;` responsif.
  - Spacing & CTA: `.prod-title` memiliki margin bawah berbasis token `--space-sm` hingga `--space-md` untuk memisahkan judul dan deskripsi [PENDING T-233]. Markup tombol kanan di `.prod-header` ditiadakan; CTA diarahkan tunggal via `.prod-more-wrap .btn-see-more` di bawah grid.
- **Why Choose Us:** `.sec-why-us.sec-pillars`, `.wcu-card`, `.wcu-header`, `.wcu-layout`, `.wcu-copy`, `.wcu-kicker`, `.wcu-headline`, `.wcu-desc`, `.wcu-artbox`, `.wcu-art`, `.wcu-art-label`, `.wcu-float-card`.
  - Anchor alias: `<span id="pilar" class="sec-pillars" aria-hidden="true"></span>`.
  - Mobile rule (`< 768px`): `.wcu-float-card { display: none; }` dan `.wcu-art-label { display: none; }` agar ilustrasi SVG daun botani bersih dan utuh [PENDING T-235]. Desktop tetap menampilkan floating card dan chip label.
  - Token transisi background: Batas atas dan bawah seksi menggunakan token gradasi semantik `--trans-subtle-to-wcu` dan `--trans-wcu-to-subtle` di `tokens.css` tanpa hardcode hex [PENDING T-234].
- **Certifications / Evidence:** `.sec-evidence`, `.ev-layout`, `.cert-grid`, `.cert-item`, `.cert-name`, `.cert-desc`.
- **Strip Marquee Merek & Modal Zoom:**
  - Strip Marquee: `.sec-brands.brand-strip-sec`, `.brand-strip-wrapper`, `.brand-strip-marquee`, `.brand-strip-track`, `.brand-strip-item`, `.brand-strip-logo-box`, `.brand-strip-logo`, `.brand-zoom-hint`.
  - Responsive mobile rule (`< 768px`): `.brand-strip-logo` berukuran `height: clamp(70px, 13vw, 88px); max-width: 170px;` dengan `.brand-strip-item` berukuran `min-width: clamp(130px, 20vw, 160px);` [PENDING T-236].
  - Lightbox Preview Modal: `#brandPreviewModal.brand-preview-modal`, `.brand-modal-backdrop`, `.brand-modal-dialog`, `.brand-modal-header`, `.brand-modal-close`, `.brand-modal-body`, `.brand-modal-img-wrap`.
  - Script interaktivitas: `public/js/main.js` mengikat `.js-brand-preview-trigger`, Escape key listener, dan backdrop click.

---

## 5. Keamanan & Sanitasi
- **Validasi URL CTA:** Fungsi `isValidCtaUrl()` di `controllers/admin/bannerController.js` hanya menerima path relatif (`/products`, `/contact`), URL absolut `https://`, serta protokol komunikasi aman `tel:`, `mailto:`, dan `https://wa.me/`. Skema berbahaya seperti `javascript:`, `data:`, `vbscript:` ditolak secara otomatis.
- **Aksesibilitas WCAG AA:** Warna dan kontras mengacu pada `Design/DESIGN.md` dan `public/css/tokens.css`. Fallback `prefers-reduced-motion` menonaktifkan animasi continuous translate pada marquee track.
