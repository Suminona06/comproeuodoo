Status: ACTIVE | Terakhir diverifikasi: 2026-11-16 | Kode: views/public/about.ejs, views/partials/about/vision-mission.ejs, views/partials/about/gallery-bento.ejs, controllers/public/pageController.js

# PRD: Modul Tentang Kami (Public About)

## 1. Ringkasan & Ruang Lingkup
Modul Tentang Kami (`/about`) memuat rekam jejak perusahaan sejak 1990, angka statistik manufaktur, linimasa sejarah, visi misi, budaya kerja interaktif, dan galeri visual fasilitas produksi dalam format *thin page* dan partial modular dwibahasa (`ID`/`EN`).

---

## 2. Functional Requirements

### FR-05 (Sub-fitur: Tentang Kami): Render Halaman Profil Perusahaan
- Sistem merender halaman Tentang Kami (`/about`) secara SSR melalui *thin page* `views/public/about.ejs` yang mengorkestrasikan partial per section:
  1. **Hero & Breadcrumb:** `.page-hero` dan `nav.breadcrumbs` langsung di *thin page* dengan `<img class="page-hero-bg-img" fetchpriority="high">` dan `.page-hero-scrim[data-scrim-level]` (tanpa inline style).
  2. **Profil, Statistik & Linimasa (`.sec-story#sejarah`):** Partial `story-counter` dan `history-timeline` (detail PRD di [prd/public-about-timeline.md](public-about-timeline.md)).
  3. **Visi & Misi (`.sec-vm` / `.abt-vm-*`):** Partial `vision-mission` memuat pernyataan visi & misi korporat beserta foto pabrik/tim.
  4. **Budaya Kerja (`.abt-tkt-*`):** Partial `ticket-accordion` berisi 6 pilar budaya kerja interaktif.
  5. **Galeri Bento (`.sec-gallery` / `.abt-gal-*`):** Partial `gallery-bento` berisi mosaik berhalaman dengan lightbox.
- Seluruh teks UI statis dan teks fallback section wajib diambil dari kamus `t('about.*')` di `locales/id.json` dan `locales/en.json` tanpa string literal hardcoded di template maupun controller.

### Bento Mosaic Gallery Berhalaman (`.abt-gal-*`)
- Galeri foto disusun dalam pola tata letak asimetris tetap untuk menjaga *zero Cumulative Layout Shift* (CLS):
  - Desktop (`>= 769px`): 6 tile per halaman dengan variasi tile tinggi (`.abt-gal-tile--tall`) dan lebar (`.abt-gal-tile--wide`).
  - Mobile (`< 768px`): 4 tile per halaman.
- Navigasi paginasi: `.abt-gal-pager-btn` + indikator `.abt-gal-pager-count`; transisi menggunakan Anime.js *Shutter Wipe* dengan *image pre-decode*.
- Judul/caption foto bersifat nullable dengan fallback otomatis ke `alt` dan `aria-label`; klik atau `Enter`/`Space` pada tile mana pun membuka Lightbox.

### FR-24: Lightbox Zoom Galeri Tentang Kami
- Aktivasi pada `.abt-gal-tile` (SSR maupun hasil paginasi JS) membuka **Lightbox Layar Penuh** bersama (`.lbx-*`, berbagi kontrak dengan `FR-31` pada [prd/products.md](products.md)) yang mencakup **seluruh foto** dari `#bentoGalleryData` (bukan hanya halaman aktif).
- Berbasis PhotoSwipe v5 *self-hosted* di atas backdrop `var(--surface-dark-deep)` (`var(--color-on-primary)`), mendukung *zoom*, *pan*, toolbar `+`/`-`, pinch/swipe sentuh, focus trap `role="dialog"`, tutup `Escape`, pengembalian fokus ke pemicu, dan `prefers-reduced-motion`.

### FR-32: Interactive Expanding Accordion Budaya Kerja
- **Desktop (`>= 769px`):** Latar foto (`about_values_bg_image`) + scrim `var(--bg-overlay-dark)`, header pill `Budaya Kerja`, judul akronim otomatis (`T - I - C - K - E - T`), 6 panel vertikal, panel ke-3 aktif default, mengembang hanya saat klik/keyboard (tanpa hover, *calm UI*) ~2.5x–3x dengan glow hijau, tanpa tombol CTA/kicker, disertai 6 indikator dots.
- **Mobile (`< 768px`):** *Vertical Accordion* bertumpuk (~70–76px per baris, target sentuh `>= 44px`), bebas horizontal overflow pada lebar `320px`.
- **Aksesibilitas:** Semantik `role="tablist"`/`"tab"`/`"tabpanel"`, `aria-expanded` & `aria-controls`, navigasi panah keyboard, kontras WCAG AA (`>= 4.5:1`).

### FR-26: Sistem Latar Selang-Seling & Transisi Tepi Halus
- Section non-hero memakai permukaan terang bergantian: `var(--bg-soft-green)` pada `.sec-story#sejarah` dan fallback `.abt-tkt-section#core-values` (saat tanpa foto latar), serta `var(--bg-subtle)` pada `.sec-vm#visi-misi` dan `.sec-gallery#galeri`.
- Hero berfoto, section T-I-C-K-E-T berfoto, `.sec-cta`, dan `.site-footer` dikecualikan dari selang-seling terang.
- Perbatasan antar-section menggunakan gradasi `48px` (mobile `< 768px`) / `80px` (desktop `>= 768px`) berbasis `var(--trans-soft-green-to-subtle)` dan `var(--trans-subtle-to-soft-green)`; seluruh teks dan kartu (`var(--color-surface)` + `var(--color-border)`) memenuhi kontras WCAG AA.

### Sub-Fitur Terkait
- Angka Statistik 2x2 Ber-Notch, Timeline Sejarah Horizontal Slider, `FR-33`, dan `FR-34` didokumentasikan pada sub-modul [prd/public-about-timeline.md](public-about-timeline.md).

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Latar Selang-Seling & Transisi Halus** | Memberi ritme visual antar-section `/about` tanpa memodifikasi Homepage yang dibekukan. | 2026-11-10 |
| **Lightbox Mencakup Seluruh Slide** | Memungkinkan penjelajahan penuh dari `#bentoGalleryData` tanpa menutup modal. | 2026-10-30 |
| **Expanding Accordion 6 Pilar** | Menyajikan nilai budaya kerja secara interaktif dan simetris pada panel ke-3. | 2026-11-05 |
| **Bento Mosaic Grid Ber-Tinggi Tetap** | Menampilkan dokumentasi pabrik secara kokoh dengan nol CLS via pre-decode. | 2026-10-14 |
| **Judul Galeri Nullable & Lokasi Terpusat** | Memberi fleksibilitas kurasi foto serta memusatkan alamat ke Palmerah & Cigondewah. | 2026-10-14 |
| **Foto Dokumentasi pada Visi & Misi** | Meningkatkan kredibilitas manufaktur dibanding tampilan teks polos. | 2026-10-13 |
