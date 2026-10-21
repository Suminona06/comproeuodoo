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
| **Bento Mosaic Grid Menggantikan Slider Horizontal** | Memberikan kesan tata letak industrial yang kaya dan kokoh serta menampilkan variasi dokumentasi operasional pabrik lebih baik dibanding carousel slider biasa. | 2026-10-14 |
| **Kontainer Galeri Ber-Tinggi Tetap & Image Pre-Decode** | Mengeliminasi lonjakan layout (zero CLS) saat transisi halaman galeri berpindah. | 2026-10-14 |
| **Judul Galeri Bersifat Nullable** | Memberikan keleluasaan bagi kurator foto untuk menampilkan gambar murni tanpa teks judul yang mengganggu komposisi visual. | 2026-10-14 |
| **Pembersihan Lokasi Operasional Lama** | Menghapus data lokasi usang di body Tentang Kami dan memusatkan alamat resmi hanya pada Palmerah dan Cigondewah. | 2026-10-13 |
| **Foto Dokumentasi Nyata pada Visi & Misi** | Meningkatkan kredibilitas manufaktur bagi calon mitra korporat dibanding hanya menggunakan teks polos. | 2026-10-13 |
