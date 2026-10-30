Status: ACTIVE | Terakhir diverifikasi: 2026-10-21 | Kode: views/public/about.ejs, controllers/public/pageController.js

# PRD: Modul Tentang Kami (Public About)

## 1. Ringkasan & Ruang Lingkup
Modul Tentang Kami (`/about`) memuat rekam jejak, visi misi, nilai budaya kerja, pencapaian statistik manufaktur, lini masa sejarah perusahaan sejak 1990, dan dokumentasi visual pabrik Cigondewah melalui galeri bento interaktif.

---

## 2. Functional Requirements

### FR-05 (Sub-fitur: Tentang Kami): Render Halaman Profil Perusahaan
- Sistem merender halaman Tentang Kami secara Server-Side Rendering (SSR) berbasis EJS dengan komponen:
  1. Header Halaman & Breadcrumb navigasi (`nav.breadcrumbs`).
  2. Profil Perusahaan & Latar Belakang (nama terdahulu: PT Sahabat Baru & PT Pelita Baru).
  3. Nilai-Nilai Inti Budaya Perusahaan (Akronim TIKET: Takut Tuhan, Integritas, Keterbukaan, Empati, Tanggung Jawab).
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
- Setiap tile bento bersifat interaktif (klik maupun aktivasi keyboard `Enter`/`Space`) untuk membuka foto dalam mode Lightbox layar penuh `[PENDING T-253]`.

### FR-24: Lightbox Zoom Galeri Tentang Kami [PENDING T-253, T-254]
- **Pemicu & Cakupan Seluruh Slide:** Mengklik atau menekan `Enter`/`Space` pada tile mana pun di Bento Gallery (`.abt-gal-tile`, baik hasil render awal SSR maupun tile hasil paginasi JS) membuka komponen **Lightbox Layar Penuh** bersama (`.lbx-*`, berbagi spesifikasi dengan `FR-31` pada `prd/products.md`) tepat pada foto tersebut. Navigasi di dalam lightbox mencakup **seluruh foto galeri** dari dataset `#bentoGalleryData` (mis. `"3 / 12"`), bukan hanya 6 tile pada halaman bento aktif.
- **Zoom, Pan & Navigasi:** Menggunakan komponen bersama berbasis PhotoSwipe v5 *self-hosted* di atas backdrop `var(--surface-dark-deep)` dengan teks/ikon `var(--color-on-primary)`. Di desktop mendukung klik/*double-click* untuk *zoom* ke titik klik + *drag* untuk geser (*pan*) serta tombol `+`/`-` pada toolbar; di perangkat sentuh mendukung *double-tap* zoom, *pinch-to-zoom* 2 jari, *pan*, dan *swipe* kiri/kanan antar-foto termasuk saat sedang di-zoom.
- **Aksesibilitas & i18n:** Dialog modal (`role="dialog"`, `aria-modal="true"`) dengan fokus terkunci (*focus trap*), tutup via tombol atau `Escape`, pengembalian fokus ke tile pemicu, penguncian scroll body saat terbuka, penghitung posisi `"3 / 12"`, *caption* kategori dan judul foto sesuai bahasa aktif (`ID`/`EN`), serta label tombol dwibahasa. Animasi hanya `transform` dan `opacity` (`prefers-reduced-motion` tanpa animasi; hover di dalam `@media (hover: hover)`).

### Angka Statistik Pencapaian & Animasi Count-Up
- Menampilkan metrik numerik operasional manufaktur.
- Skrip pengamat viewport (`IntersectionObserver`) memicu animasi count-up angka secara otomatis ketika seksi memasuki layar.

### Timeline Sejarah Interaktif
- Visualisasi perjalanan ekspansi pabrik Cigondewah sejak 1990 dari pasar tradisional hingga modern supermarket dan retail nasional.
- Setiap simpul tahun memiliki kartu detail yang merespons fokus kursor dan interaksi sentuh.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Lightbox Bento Mencakup Seluruh Slide (`#bentoGalleryData`)** | Memungkinkan penjelajahan seluruh dokumentasi pabrik tanpa harus menutup lightbox untuk mengganti halaman pager bento. | 2026-10-30 |
| **Bento Mosaic Grid Menggantikan Slider Horizontal** | Memberikan kesan tata letak industrial yang kaya dan kokoh serta menampilkan variasi dokumentasi operasional pabrik lebih baik dibanding carousel slider biasa. | 2026-10-14 |
| **Kontainer Galeri Ber-Tinggi Tetap & Image Pre-Decode** | Mengeliminasi lonjakan layout (zero CLS) saat transisi halaman galeri berpindah. | 2026-10-14 |
| **Judul Galeri Bersifat Nullable** | Memberikan keleluasaan bagi kurator foto untuk menampilkan gambar murni tanpa teks judul yang mengganggu komposisi visual. | 2026-10-14 |
| **Pembersihan Lokasi Operasional Lama** | Menghapus data lokasi usang di body Tentang Kami dan memusatkan alamat resmi hanya pada Palmerah dan Cigondewah. | 2026-10-13 |
| **Foto Dokumentasi Nyata pada Visi & Misi** | Meningkatkan kredibilitas manufaktur bagi calon mitra korporat dibanding hanya menggunakan teks polos. | 2026-10-13 |
