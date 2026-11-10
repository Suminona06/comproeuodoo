Status: ACTIVE | Terakhir diverifikasi: 2026-11-07 | Kode: views/public/about.ejs, controllers/public/pageController.js

# PRD: Modul Tentang Kami (Public About)

## 1. Ringkasan & Ruang Lingkup
Modul Tentang Kami (`/about`) memuat rekam jejak, visi misi, nilai budaya kerja, pencapaian statistik manufaktur, lini masa sejarah perusahaan sejak 1990, dan dokumentasi visual pabrik Cigondewah melalui galeri bento interaktif.

---

## 2. Functional Requirements

### FR-05 (Sub-fitur: Tentang Kami): Render Halaman Profil Perusahaan
- Sistem merender halaman Tentang Kami secara Server-Side Rendering (SSR) berbasis EJS dengan komponen:
  1. Header Halaman & Breadcrumb navigasi (`nav.breadcrumbs`).
  2. Profil Perusahaan & Latar Belakang (nama terdahulu: PT Sahabat Baru & PT Pelita Baru).
  3. Nilai-Nilai Inti Budaya Perusahaan: 6 Pilar Budaya Kerja Interaktif (Default T-I-C-K-E-T: Takut Tuhan, Integritas, Komunikasi, Kasih, Luar Biasa, Taat; huruf dan konten dapat disunting fleksibel di CMS).
  4. Visi & Misi Korporat dengan media foto representatif pabrik/tim.
  5. Galeri Mosaik Bento Berhalaman (`.sec-gallery`, `.abt-gal-*`).
  6. Statistik Kunci Pencapaian (Tahun Berdiri, Kapasitas Produksi, Luas Fasilitas, Mitra B2B) dengan animasi count-up.
  7. Lini Masa Sejarah Interaktif (Timeline 1990 hingga era modern) dengan efek transisi hover.

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
  - **Pemicu Interaksi:** Hanya via klik mouse dan fokus keyboard (`Enter`/`Space`) — tanpa hover (*calm UI*).
  - **Panel Aktif:** Melebar (rasio ~2.5x - 3x) menampilkan highlight border hijau (*soft glow*), judul pilar, dan deskripsi 2-3 baris di atas gradien gelap.
  - **Tanpa Tombol & Kicker:** Tombol "Pelajari Lebih Lanjut" dan kicker ditiadakan.
  - **Indikator Dots:** 6 indikator (1 pill aktif hijau + 5 dot bulat) sebagai kontrol navigasi.
- **Tata Letak Mobile (`< 768px`):**
  - *Vertical Accordion* 6 baris kartu horizontal bertumpuk (tinggi ~70-76px, target sentuh >=44px). Baris aktif melebar ke bawah menampilkan judul, deskripsi, dan glow hijau tanpa horizontal overflow di 320px.
- **Aksesibilitas & Semantik:** Semantik `role="tablist"` / `role="tab"` / `role="tabpanel"`, atribut `aria-expanded` & `aria-controls`, panah keyboard (`ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown`), dan kontras WCAG AA (>=4.5:1).

### Angka Statistik Pencapaian & Animasi Count-Up
- Menampilkan metrik numerik operasional manufaktur.
- Skrip pengamat viewport (`IntersectionObserver`) memicu animasi count-up angka secara otomatis ketika seksi memasuki layar.

### Timeline Sejarah Interaktif
- Visualisasi perjalanan ekspansi pabrik Cigondewah sejak 1990 dari pasar tradisional hingga modern supermarket dan retail nasional.
- Setiap simpul tahun memiliki kartu detail yang merespons fokus kursor dan interaksi sentuh.

### FR-26: Sistem Latar Selang-Seling & Transisi Tepi Halus Halaman Tentang Kami `[PENDING T-307, T-308]`
- Seluruh section konten non-hero pada halaman `/about` menggunakan dua token permukaan terang secara bergantian dimulai dari `var(--bg-soft-green)` pada section pertama setelah hero (`.sec-story#sejarah`), diikuti `var(--bg-subtle)` pada `.sec-vm#visi-misi`, fallback `var(--bg-soft-green)` pada `.abt-tkt-section#core-values` (bila tanpa foto latar), dan `var(--bg-subtle)` pada `.sec-gallery#galeri`.
- Hero berlatar gambar (`.page-hero`), section Budaya Kerja T-I-C-K-E-T saat berfoto latar, CTA pra-footer (`.sec-cta`), serta footer (`.site-footer`) dikecualikan dari selang-seling latar terang.
- Perbatasan antar-section menggunakan gradasi transisi pendek di tepi section (`48px` pada layar mobile `< 768px` dan `80px` pada layar desktop `>= 768px`) berbasis token `var(--trans-soft-green-to-subtle)` dan `var(--trans-subtle-to-soft-green)` sehingga bebas garis batas keras dari lebar 320px hingga desktop.
- Seluruh teks utama (`var(--color-text-main)`), teks varian (`var(--color-text-variant)`), teks sekunder (`var(--color-text-muted-on-soft)`), serta kartu permukaan (`var(--color-surface)`) dengan border `var(--color-border)` dan elevasi `var(--shadow-level-1)` di atas kedua latar wajib memenuhi rasio kontras WCAG AA (minimal 4.5:1 untuk teks normal dan batas kartu tetap jelas).

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Latar Selang-Seling `--bg-soft-green` & `--bg-subtle` Bertransisi Tepi Halus `[PENDING T-307, T-308]`** | Memberikan ritme visual organik antar-section di halaman Tentang Kami tanpa garis batas keras sekaligus menjaga Homepage tetap dibekukan. | 2026-11-10 |
| **Lightbox Bento Mencakup Seluruh Slide (`#bentoGalleryData`)** | Memungkinkan penjelajahan seluruh dokumentasi pabrik tanpa harus menutup lightbox untuk mengganti halaman pager bento. | 2026-10-30 |
| **Interactive Expanding Accordion Menggantikan Grid Kartu Statis** | Memberikan pengalaman interaktif menjelajahi 6 pilar budaya kerja dengan kedalaman visual industrial dan fokus simetris pada panel ke-3. | 2026-11-05 |
| **Bento Mosaic Grid Menggantikan Slider Horizontal** | Memberikan kesan tata letak industrial yang kaya dan kokoh serta menampilkan variasi dokumentasi operasional pabrik lebih baik dibanding carousel slider biasa. | 2026-10-14 |
| **Kontainer Galeri Ber-Tinggi Tetap & Image Pre-Decode** | Mengeliminasi lonjakan layout (zero CLS) saat transisi halaman galeri berpindah. | 2026-10-14 |
| **Judul Galeri Bersifat Nullable** | Memberikan keleluasaan bagi kurator foto untuk menampilkan gambar murni tanpa teks judul yang mengganggu komposisi visual. | 2026-10-14 |
| **Pembersihan Lokasi Operasional Lama** | Menghapus data lokasi usang di body Tentang Kami dan memusatkan alamat resmi hanya pada Palmerah dan Cigondewah. | 2026-10-13 |
| **Foto Dokumentasi Nyata pada Visi & Misi** | Meningkatkan kredibilitas manufaktur bagi calon mitra korporat dibanding hanya menggunakan teks polos. | 2026-10-13 |
