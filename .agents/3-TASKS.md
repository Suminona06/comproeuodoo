# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 5 Task (T-313 s/d T-317)
- **Total Task Selesai:** 312 Task (T-01 s/d T-312)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-318**.

---

## Task Aktif / Terbuka (Open Tasks)

### [ ] T-313: Refaktor Partial Counter Statistik 2x2 Ber-Notch (`.abt-cnt-*`) & Perbaikan Count-Up
- **Modul Spesifikasi:** [prd/public-about.md](prd/public-about.md) (`FR-05`, `FR-33`), [tech/public-about-timeline.md](tech/public-about-timeline.md)
- **Deskripsi:**
  - Buat partial modular `views/partials/about/story-counter.ejs` (`<= 100` baris) untuk blok pertama di `<section class="sec-story" id="sejarah">` tanpa panel pembungkus (`var(--bg-soft-green)`).
  - Kolom kiri menampilkan kicker, `h2`, dan paragraf sejarah; kolom kanan merender `<dl class="abt-cnt-grid">` dengan `stats.slice(0, 4)` (kelas `abt-cnt-grid--quad` dipasang saat tepat 4 stat aktif untuk mengaktifkan potongan sudut cekung `radial-gradient` CSS mask dan 4 lencana panah diagonal pusat `.abt-cnt-badge`; bila `< 4` stat aktif, kartu kosong tidak dirender dan *notch*/lencana disembunyikan). Tanpa penambahan catatan di halaman Admin.
  - Buat `public/js/about-story.js` (dimuat hanya di `/about`) untuk menjalankan *count-up* satu kali via `IntersectionObserver` + Anime.js (mendukung format `1990`, `1500+`, `1.500+`, `30+`, serta fallback nilai akhir statis untuk tanpa JS dan `prefers-reduced-motion: reduce`) dan mikro-interaksi hover kartu yang menggeser panah lencana kuadran terkait ke pusat via Anime.js; hapus blok count-up `.story-stat-num` lama di `public/js/main.js`.
- **Acceptance Criteria:**
  - [ ] Struktur, proporsi, potongan sudut (*notch*), dan 4 lencana panah pusat identik Gambar 2 saat terdapat 4 stat aktif; bila `< 4` stat aktif, kartu kosong tidak dirender dan *notch*/lencana disembunyikan; tanpa panel pembungkus; seluruh warna menggunakan token CSS.
  - [ ] Maksimal 4 stat aktif pertama tampil; tidak ada catatan tambahan di halaman Admin.
  - [ ] Animasi *count-up* berjalan satu kali saat terlihat, mendukung pemisah ribuan & sufiks, dan nilai akhir langsung tampil saat JS mati atau `prefers-reduced-motion: reduce`.
  - [ ] Hover kartu pada perangkat pointer (`@media (hover: hover)`) menggeser panah lencana kuadran terkait ke pusat via Anime.js dan mengubah warna lencana ke token primer.
  - [ ] Mobile (`320px-767px`) tampil rapi, profesional, bersih, jelas, dan elegan: teks di atas, grid 2x2 tetap ber-notch di bawah, angka tidak terpotong, dan kontras memenuhi WCAG AA.
- **File Terdampak:** `views/public/about.ejs`, `views/partials/about/story-counter.ejs`, `public/css/components.css`, `public/js/about-story.js`, `public/js/main.js`, `views/partials/footer.ejs`.

### [ ] T-314: Pengelolaan Header Timeline Editable di Admin CMS (`FR-34`)
- **Modul Spesifikasi:** [prd/public-about.md](prd/public-about.md) (`FR-34`), [tech/public-about.md](tech/public-about.md), [tech/public-about-timeline.md](tech/public-about-timeline.md)
- **Deskripsi:**
  - Tambahkan 6 kunci `settings`: `about_timeline_tagline_id`, `about_timeline_tagline_en`, `about_timeline_title_id`, `about_timeline_title_en`, `about_timeline_desc_id`, `about_timeline_desc_en`.
  - Tambahkan `aboutModel.getTimelineHeader()` dengan fallback teks bawaan dwibahasa dan daftarkan ke-6 kunci pada `directSettingKeys` di `aboutModel.updateAboutData()`.
  - Perbarui `aboutController.index`, `aboutController.update` (sanitasi panjang maks `50`/`120`/`300`), dan `pageController.about` untuk meneruskan `timelineHeader`.
  - Buat partial `views/admin/about/partials/tab-sejarah-timeline-header.ejs` dan sertakan di `views/admin/about/partials/tab-sejarah.ejs` di dalam form utama `/admin/about` (mengikuti pola `.form-row-2` yang sudah ada).
- **Acceptance Criteria:**
  - [ ] Ke-6 field header timeline (Tagline, Judul, Deskripsi ID/EN) dapat disimpan dari `/admin/about`, bertahan setelah muat ulang, dan tampil ter-escape (`<%= %>`) di halaman publik `/about`.
  - [ ] Bila field dikosongkan, sistem menggunakan fallback teks bawaan dwibahasa.
  - [ ] Setiap berkas partial admin tetap `<= 100` baris tanpa catatan tambahan pada bagian statistik.
- **File Terdampak:** `models/aboutModel.js`, `controllers/admin/aboutController.js`, `controllers/public/pageController.js`, `views/admin/about/partials/tab-sejarah-timeline-header.ejs`, `views/admin/about/partials/tab-sejarah.ejs`.

### [ ] T-315: Implementasi Komponen Horizontal Timeline Slider (`.abt-htl-*`) & Kamus i18n
- **Modul Spesifikasi:** [prd/public-about.md](prd/public-about.md) (`FR-05`, `FR-33`), [tech/public-about-timeline.md](tech/public-about-timeline.md)
- **Deskripsi:**
  - Buat partial `views/partials/about/history-timeline.ejs` (`<= 100` baris) langsung di atas latar section `.sec-story#sejarah` tanpa panel putih pembungkus.
  - Render header dari `timelineHeader` beserta tombol persegi bergaris *prev/next* (`>= 44x44px`, `aria-controls`, `aria-disabled`) dan track `<ol class="abt-htl-track" id="abt-htl-track">` berbasis `scroll-snap-type: x mandatory`.
  - Terapkan geometri garis horizontal dari tepi kiri track yang **berhenti tepat di pusat bulatan item terakhir**, efek hover/fokus (bulatan membesar + ring hijau, tahun hijau), serta pengisian segmen garis progres hijau tua (`var(--color-primary-dark)`, `.is-filled` + `scaleX` Anime.js) dari awal hingga item aktif.
  - Tambahkan kunci i18n aksesibilitas (`about.timeline_region_label`, `about.timeline_prev`, `about.timeline_next`, `about.timeline_position`) di `locales/id.json` dan `locales/en.json`, serta pertahankan `t('about.timeline_empty')`.
- **Acceptance Criteria:**
  - [ ] Tampilan desktop (`>= 1024px`, 3 kolom) identik Gambar 1 (awal) dan Gambar 3 (ujung: garis berhenti tepat di bulatan item terakhir).
  - [ ] Tampilan tablet (`768px-1023px`, 2 kolom) dan mobile (`< 768px`, 1 kolom + *peek* ~15% item berikutnya, tombol *prev/next* pindah ke bawah deskripsi rata kiri sesuai Gambar 4, langsung di atas latar section tanpa panel putih).
  - [ ] Geser per 1 item, berhenti di ujung (`aria-disabled="true"`), tanpa autoplay, tombol disembunyikan bila total item `<=` kolom terlihat.
  - [ ] Hover/fokus item dan item aktif menampilkan ring hijau pada bulatan, tahun berwarna hijau primer, dan segmen garis sampai item aktif terisi hijau tua (`var(--color-primary-dark)`).
  - [ ] Swipe sentuh, navigasi papan ketik (`Tab`, `ArrowLeft`, `ArrowRight`), dan pengumuman `aria-live` berfungsi; tanpa *horizontal overflow* di `320px`.
- **File Terdampak:** `views/partials/about/history-timeline.ejs`, `views/public/about.ejs`, `public/css/components.css`, `public/js/about-story.js`, `locales/id.json`, `locales/en.json`.

### [ ] T-316: Pembersihan CSS/JS Legacy & Polish Lintas Breakpoint
- **Modul Spesifikasi:** [tech/public-about.md](tech/public-about.md), [tech/public-about-timeline.md](tech/public-about-timeline.md)
- **Deskripsi:**
  - Hapus aturan CSS legacy `.story-layout`, `.story-sticky`, `.story-kicker`, `.story-stats`, `.story-stat`, `.story-stat-num`, `.story-stat-label`, `.timeline`, `.tl-*`, dan `.abt-tl-empty` dari `public/css/components.css`.
  - Lakukan audit *Impeccable* (`polish`, `adapt`, `animate`) pada breakpoint `320px`, `375px`, `480px`, `768px`, `1024px`, `1440px`, dengan perhatian khusus pada kerapian, kejelasan, dan keanggunan tampilan mobile.
  - Pastikan seluruh `:hover` berada di dalam `@media (hover: hover)`, `:active` tersedia untuk layar sentuh, dan `@media (prefers-reduced-motion: reduce)` menonaktifkan transisi gerak.
- **Acceptance Criteria:**
  - [ ] Tidak ada CSS/JS mati peninggalan `.story-*` / `.tl-*` yang tersisa di `public/css/components.css` dan `public/js/main.js`.
  - [ ] `npm run lint`, `npm run lint:views`, dan `npm run lint:i18n` hijau tanpa error.
  - [ ] Seluruh section lain di `/about` (Visi Misi, Budaya Kerja T-I-C-K-E-T, Galeri Bento + Lightbox, CTA) dan navigasi anchor `#sejarah` bebas regresi.
- **File Terdampak:** `public/css/components.css`, `public/js/main.js`, `views/public/about.ejs`.

### [ ] T-317: Verifikasi E2E Playwright Counter 2x2 & Horizontal Timeline Slider
- **Modul Spesifikasi:** [prd/public-about.md](prd/public-about.md), [tech/public-about-timeline.md](tech/public-about-timeline.md)
- **Deskripsi:**
  - Buat skrip pengujian otomatis `tests/test-t313-about-story-htimeline.js` menggunakan `node:test` dan `playwright` (`chromium`) yang menguji 12 skenario end-to-end:
    1. Viewport `320`, `375`, `768`, `1024`, `1440`: bebas *horizontal overflow* (`scrollWidth <= clientWidth`), grid stat 2x2, kolom timeline 1/2/3 sesuai breakpoint.
    2. Data 6 stat -> hanya 4 kartu dirender (`abt-cnt-grid--quad`); data `< 4` stat (3 stat) -> hanya 3 kartu dirender tanpa *notch* dan tanpa lencana pusat.
    3. Animasi *count-up* mencapai nilai akhir (`stat_value`, termasuk `'1.500+'`) dan langsung menampilkan nilai akhir pada `reducedMotion: 'reduce'`.
    4. Kartu kuadran memiliki CSS `mask-image` aktif dan 4 lencana pusat beratribut `aria-hidden="true"`.
    5. Hover kartu di desktop memicu transformasi panah lencana pusat via Anime.js lalu kembali saat `mouseleave`.
    6. Slider 5 item: tombol prev `aria-disabled="true"` di awal, klik next bergeser per 1 item hingga ujung (`next` menjadi `aria-disabled="true"`), garis horizontal berhenti tepat di pusat bulatan item terakhir, `ArrowRight` menggeser 1 item, dan segmen `.is-filled` bertambah.
    7. Slider `<= 3` item di desktop menyembunyikan tombol navigasi.
    8. Mobile `375px`: tombol prev/next berada di bawah deskripsi rata kiri dan item berikutnya terlihat sebagian (*peek*).
    9. Bahasa ID & EN menampilkan header timeline dari `settings` serta fallback bawaan bila kosong.
    10. Bebas *console error* dan anchor `#sejarah` berfungsi.
    11. Penyimpanan 6 field header timeline dari form Admin memperbarui tampilan publik.
    12. Tangkapan layar bukti visual pada viewport `320px`, `768px`, dan `1440px`.
- **Acceptance Criteria:**
  - [ ] Seluruh pengujian di `tests/test-t313-about-story-htimeline.js` lulus 100% bersama `npm run lint`, `npm run lint:views`, dan `npm run lint:i18n`.
- **File Terdampak:** `tests/test-t313-about-story-htimeline.js`.
