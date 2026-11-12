Status: ACTIVE | Terakhir diverifikasi: 2026-11-12 | Kode: views/public/about.ejs, controllers/public/pageController.js

# PRD: Modul Tentang Kami (Public About)

## 1. Ringkasan & Ruang Lingkup
Modul Tentang Kami (`/about`) memuat rekam jejak, visi misi, nilai budaya kerja, pencapaian statistik manufaktur, lini masa sejarah perusahaan sejak 1990, dan dokumentasi visual pabrik Cigondewah melalui galeri bento interaktif.

---

## 2. Functional Requirements

### FR-05 (Sub-fitur: Tentang Kami): Render Halaman Profil Perusahaan
- Sistem merender halaman Tentang Kami secara Server-Side Rendering (SSR) berbasis EJS dengan komponen:
  1. Header Halaman & Breadcrumb navigasi (`nav.breadcrumbs`).
  2. Profil Perusahaan & Latar Belakang (kicker, judul `h2`, dan paragraf sejarah dari `settings`) di kolom kiri blok **Modern Counter Section** (`.abt-cnt-*`), berpasangan dengan grid statistik 2x2 di kolom kanan tanpa panel pembungkus (`var(--bg-soft-green)`).
  3. Nilai-Nilai Inti Budaya Perusahaan: 6 Pilar Budaya Kerja Interaktif (Default T-I-C-K-E-T: Takut Tuhan, Integritas, Komunikasi, Kasih, Luar Biasa, Taat; huruf dan konten dapat disunting fleksibel di CMS).
  4. Visi & Misi Korporat dengan media foto representatif pabrik/tim.
  5. Galeri Mosaik Bento Berhalaman (`.sec-gallery`, `.abt-gal-*`).
  6. Statistik Kunci Pencapaian dalam grid 2x2 ber-notch (`.abt-cnt-grid`) berisi maksimal 4 stat aktif pertama (`sort_order ASC`) dengan 4 lencana bulat panah diagonal di pusat, animasi count-up Anime.js, dan mikro-interaksi hover.
  7. Lini Masa Sejarah Interaktif dalam blok **Horizontal Timeline Slider** (`.abt-htl-*`) dengan header editable di Admin (ID/EN), tombol navigasi persegi bergaris, track 3/2/1 kolom, garis progres hijau tua sampai item aktif, dan garis yang berhenti tepat di bulatan item terakhir.

### Bento Mosaic Gallery Berhalaman (`.abt-gal-*`)
- Galeri foto pabrik disusun dalam pola tata letak asimetris (Bento Grid) berukuran tetap untuk mencegah Cumulative Layout Shift (CLS).
- Kapasitas tampilan:
  - Layar Desktop (`>= 769px`): 6 tile per halaman dengan variasi tile tinggi (`.abt-gal-tile--tall`) dan tile lebar (`.abt-gal-tile--wide`).
  - Layar Mobile (`< 768px`): 4 tile per halaman beradaptasi rapi.
- Navigasi paginasi interaktif: tombol panah sebelumnya/berikutnya (`.abt-gal-pager-btn`) dan indikator counter halaman aktif (`.abt-gal-pager-count`).
- Transisi antar halaman menggunakan engine animasi simetris Anime.js (Shutter Wipe) disertai mekanisme image pre-decode sebelum render.
- Caption dan judul foto bersifat opsional (kontrak `title_id` nullable), dengan fallback aksesibilitas otomatis ke `alt` dan `aria-label`.
- Setiap tile bento bersifat interaktif (klik maupun aktivasi keyboard `Enter`/`Space`) untuk membuka foto dalam mode Lightbox layar penuh.

### FR-24: Lightbox Zoom Galeri Tentang Kami
- **Pemicu & Cakupan Seluruh Slide:** Mengklik atau menekan `Enter`/`Space` pada tile mana pun di Bento Gallery (`.abt-gal-tile`, baik hasil render awal SSR maupun tile hasil paginasi JS) membuka komponen **Lightbox Layar Penuh** bersama (`.lbx-*`, berbagi spesifikasi dengan `FR-31` pada `prd/products.md`) tepat pada foto tersebut. Navigasi di dalam lightbox mencakup **seluruh foto galeri** dari dataset `#bentoGalleryData` (mis. `"3 / 12"`), bukan hanya 6 tile pada halaman bento aktif.
- **Zoom, Pan & Navigasi:** Menggunakan komponen bersama berbasis PhotoSwipe v5 *self-hosted* di atas backdrop `var(--surface-dark-deep)` dengan teks/ikon `var(--color-on-primary)`. Di desktop mendukung klik/*double-click* untuk *zoom* ke titik klik + *drag* untuk geser (*pan*) serta tombol `+`/`-` pada toolbar; di perangkat sentuh mendukung *double-tap* zoom, *pinch-to-zoom* 2 jari, *pan*, dan *swipe* kiri/kanan antar-foto termasuk saat sedang di-zoom.
- **Aksesibilitas & i18n:** Dialog modal (`role="dialog"`, `aria-modal="true"`) dengan fokus terkunci (*focus trap*), tutup via tombol atau `Escape`, pengembalian fokus ke tile pemicu, penguncian scroll body saat terbuka, penghitung posisi `"3 / 12"`, *caption* kategori dan judul foto sesuai bahasa aktif (`ID`/`EN`), serta label tombol dwibahasa. Animasi hanya `transform` dan `opacity` (`prefers-reduced-motion` tanpa animasi; hover di dalam `@media (hover: hover)`).

### FR-32: Interactive Expanding Accordion Budaya Kerja
- **Tata Letak Desktop (`>= 769px`):** 6 panel foto vertikal berdampingan (*Interactive Expanding Accordion*).
  - Latar section memadukan foto suasana pabrik (`about_values_bg_image`) dengan scrim gradien token resmi (`var(--bg-overlay-dark)`), kontras teks header/dots WCAG AA.
  - Header terpusat: Pill outline `Budaya Kerja` (editable admin) diapit garis horizontal tipis, judul akronim otomatis dari huruf 6 pilar aktif (mis. `T - I - C - K - E - T`), subjudul filosofis (editable admin).
  - 6 panel kartu vertikal berlatar foto operasional, overlay gradien hijau gelap, border tipis, ikon stroke seragam (6 whitelist), huruf pilar, dan nama vertikal.
  - **State Awal:** Panel ke-3 (Pilar "C" - Komunikasi) aktif secara default saat dimuat.
  - **Pemicu Interaksi:** Hanya via klik mouse dan fokus keyboard (`Enter`/`Space`) - tanpa hover (*calm UI*).
  - **Panel Aktif:** Melebar (rasio ~2.5x - 3x) menampilkan highlight border hijau (*soft glow*), judul pilar, dan deskripsi 2-3 baris di atas gradien gelap.
  - **Tanpa Tombol & Kicker:** Tombol "Pelajari Lebih Lanjut" dan kicker ditiadakan.
  - **Indikator Dots:** 6 indikator (1 pill aktif hijau + 5 dot bulat) sebagai kontrol navigasi.
- **Tata Letak Mobile (`< 768px`):**
  - *Vertical Accordion* 6 baris kartu horizontal bertumpuk (tinggi ~70-76px, target sentuh >=44px). Baris aktif melebar ke bawah menampilkan judul, deskripsi, dan glow hijau tanpa horizontal overflow di 320px.
- **Aksesibilitas & Semantik:** Semantik `role="tablist"` / `role="tab"` / `role="tabpanel"`, atribut `aria-expanded` & `aria-controls`, panah keyboard (`ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown`), dan kontras WCAG AA (>=4.5:1).

### Angka Statistik Pencapaian & Animasi Count-Up (`.abt-cnt-*`)
- Tata letak 2 kolom di desktop (narasi sejarah di kiri, grid statistik di kanan) dan bertumpuk di mobile (narasi di atas, grid **tetap 2x2 ber-notch** di bawah hingga lebar 320px), langsung di atas latar section `var(--bg-soft-green)` tanpa panel pembungkus.
- Merender maksimal **4 statistik aktif pertama** (`sort_order ASC`) dalam `<dl class="abt-cnt-grid">`. Kartu menggunakan permukaan `var(--color-surface)` dengan sudut luar membulat besar dan sudut dalam yang menghadap pusat grid dipotong cekung (*inverted corner*) disertai 4 lencana bulat panah diagonal (`↘`, `↙`, `↗`, `↖`) di titik pusat. Bila stat aktif `< 4`, kartu kosong tidak dirender dan *notch* serta lencana pusat disembunyikan.
- Angka besar tebal (`var(--color-primary)`) dan label kapital kecil (`var(--color-text-main)` / `var(--color-text-muted-on-soft)`) memenuhi kontras WCAG AA. Nilai akhir dirender di HTML SSR; `IntersectionObserver` + Anime.js menjalankan *count-up* satu kali saat terlihat (mendukung pemisah ribuan & sufiks) dan dilewati pada `prefers-reduced-motion: reduce`. Saat kartu di-*hover* (`@media (hover: hover)`), panah lencana kuadran terkait bergeser halus ke pusat via Anime.js.

### Timeline Sejarah Interaktif Horizontal Slider (`.abt-htl-*`)
- Berada di bawah blok Counter di dalam `.sec-story#sejarah` tanpa kartu/panel putih pembungkus. Header memuat tagline, judul `h2`, dan deskripsi (ketiganya editable di Admin ID/EN), serta tombol *prev/next* persegi bergaris (`>= 44x44px`, di kanan sejajar bawah deskripsi pada desktop/tablet; pindah ke bawah deskripsi rata kiri pada mobile `< 768px`).
- Track menampilkan 3 kolom di desktop (`>= 1024px`), 2 kolom di tablet (`768px-1023px`), dan 1 kolom + *peek* (~15% item berikutnya) di mobile (`< 768px`). Urutan vertikal per item: tahun besar tebal, garis horizontal dengan bulatan (`var(--color-primary)`) di awal kolom, judul, dan deskripsi. Garis dimulai dari tepi kiri dan **berhenti tepat di bulatan item terakhir**.
- Geser per 1 item (berhenti di ujung dengan `aria-disabled="true"`, tanpa autoplay; tombol disembunyikan bila total item `<=` kolom terlihat). Saat *hover*/fokus atau pada item aktif (item pertama yang terlihat): bulatan membesar dengan *ring* hijau (`var(--primary-subtle)` / `var(--focus-ring)`), tahun berubah ke `var(--color-primary)`, dan segmen garis dari awal hingga item aktif terisi hijau tua (`var(--color-primary-dark)`). Pertahankan *empty state* `t('about.timeline_empty')`.

### FR-33: Aksesibilitas & Interaksi Counter 2x2 dan Horizontal Timeline Slider
- Region slider memiliki `role="region"`, `aria-roledescription="carousel"`, `aria-label` dwibahasa, kontrol tombol `aria-controls` + `aria-disabled`, pengumuman posisi via `aria-live="polite"`, dukungan swipe sentuh native dan papan ketik (`Tab`, `ArrowLeft`, `ArrowRight`), bebas *horizontal overflow* di 320px, animasi hanya `transform`/`opacity`, dan statis tertata saat `prefers-reduced-motion: reduce`.

### FR-34: Pengelolaan Header Timeline di Admin CMS
- Halaman `/admin/about` (tab "1. Sejarah", kartu "Linimasa") menyediakan 6 field di dalam form utama: Tagline ID/EN (maks 50), Judul ID/EN (maks 120), dan Deskripsi ID/EN (maks 300), dengan fallback ke teks bawaan dwibahasa bila dikosongkan. Tanpa catatan tambahan pada bagian statistik di admin.

### FR-26: Sistem Latar Selang-Seling & Transisi Tepi Halus Halaman Tentang Kami
- Seluruh section konten non-hero pada halaman `/about` menggunakan dua token permukaan terang secara bergantian dimulai dari `var(--bg-soft-green)` pada section pertama setelah hero (`.sec-story#sejarah`), diikuti `var(--bg-subtle)` pada `.sec-vm#visi-misi`, fallback `var(--bg-soft-green)` pada `.abt-tkt-section#core-values` (bila tanpa foto latar), dan `var(--bg-subtle)` pada `.sec-gallery#galeri`.
- Hero berlatar gambar (`.page-hero`), section Budaya Kerja T-I-C-K-E-T saat berfoto latar, CTA pra-footer (`.sec-cta`), serta footer (`.site-footer`) dikecualikan dari selang-seling latar terang.
- Perbatasan antar-section menggunakan gradasi transisi pendek di tepi section (`48px` pada layar mobile `< 768px` dan `80px` pada layar desktop `>= 768px`) berbasis token `var(--trans-soft-green-to-subtle)` dan `var(--trans-subtle-to-soft-green)` sehingga bebas garis batas keras dari lebar 320px hingga desktop.
- Seluruh teks utama (`var(--color-text-main)`), teks varian (`var(--color-text-variant)`), teks sekunder (`var(--color-text-muted-on-soft)`), serta kartu permukaan (`var(--color-surface)`) dengan border `var(--color-border)` dan elevasi `var(--shadow-level-1)` di atas kedua latar wajib memenuhi rasio kontras WCAG AA (minimal 4.5:1 untuk teks normal dan batas kartu tetap jelas).

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Latar Selang-Seling `--bg-soft-green` & `--bg-subtle` Bertransisi Tepi Halus** | Memberikan ritme visual organik antar-section di halaman Tentang Kami tanpa garis batas keras sekaligus menjaga Homepage tetap dibekukan. | 2026-11-10 |
| **Lightbox Bento Mencakup Seluruh Slide (`#bentoGalleryData`)** | Memungkinkan penjelajahan seluruh dokumentasi pabrik tanpa harus menutup lightbox untuk mengganti halaman pager bento. | 2026-10-30 |
| **Interactive Expanding Accordion Menggantikan Grid Kartu Statis** | Memberikan pengalaman interaktif menjelajahi 6 pilar budaya kerja dengan kedalaman visual industrial dan fokus simetris pada panel ke-3. | 2026-11-05 |
| **Bento Mosaic Grid Menggantikan Slider Horizontal** | Memberikan kesan tata letak industrial yang kaya dan kokoh serta menampilkan variasi dokumentasi operasional pabrik lebih baik dibanding carousel slider biasa. | 2026-10-14 |
| **Kontainer Galeri Ber-Tinggi Tetap & Image Pre-Decode** | Mengeliminasi lonjakan layout (zero CLS) saat transisi halaman galeri berpindah. | 2026-10-14 |
| **Judul Galeri Bersifat Nullable** | Memberikan keleluasaan bagi kurator foto untuk menampilkan gambar murni tanpa teks judul yang mengganggu komposisi visual. | 2026-10-14 |
| **Pembersihan Lokasi Operasional Lama** | Menghapus data lokasi usang di body Tentang Kami dan memusatkan alamat resmi hanya pada Palmerah dan Cigondewah. | 2026-10-13 |
| **Foto Dokumentasi Nyata pada Visi & Misi** | Meningkatkan kredibilitas manufaktur bagi calon mitra korporat dibanding hanya menggunakan teks polos. | 2026-10-13 |
