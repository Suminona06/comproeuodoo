# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 7 Task (T-262 s/d T-268)
- **Total Task Selesai:** 261 Task (T-01 s/d T-261)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-269**.

---

## Task Aktif / Terbuka (Open Tasks)

### [ ] T-262: Fondasi Komponen Dropdown Terpadu (.eu-dd-*) & Arsitektur WAI-ARIA *(diperbarui sesuai jawaban Q2, Q4, Q5, Q8)*
- **Ukuran:** M | **Skill Terkait:** `polish`, `adapt`
- **Deskripsi:** Membangun modul CSS terisolasi `.eu-dd-*` di `public/css/admin.css` dan `public/css/components.css` yang mencakup 3 varian (*outlined*, *filled*, *elevated*), label mengambang (pada filter/standalone), trigger box, caret SVG padat rotasi 180°, panel popup berbayangan lembut, dan slot skeleton/ikon seidentik Gambar 1 dan Gambar 2 referensi.
- **File Terdampak:** `public/css/tokens.css`, `public/css/admin.css`, `public/css/components.css`.
- **Acceptance Criteria (AC):**
  1. Komponen `.eu-dd` mendukung modifier varian `.eu-dd--outlined` (border abu tipis, latar putih), `.eu-dd--filled` (latar abu muda tanpa border), dan `.eu-dd--elevated` (latar putih + bayangan lembut). *(sesuai Q4)*
  2. Dimensi trigger berukuran tinggi 52-56px dengan target sentuh mobile minimal 44px.
  3. Menggunakan 100% token resmi (`var(--bg-base)`, `var(--color-surface-container)`, `var(--color-outline-variant)`, `var(--shadow-level-2)`, dll.) tanpa nilai hex hardcoded. *(sesuai Q8)*
  4. Caret indikator berbentuk segitiga padat abu gelap (`var(--color-text-muted)`), berputar halus 180° saat terbuka.
  5. Atribut ARIA (`role="combobox"`, `role="listbox"`, `role="option"`, `aria-expanded`, `aria-activedescendant`) tersusun sesuai spesifikasi WAI-ARIA 1.2. *(sesuai Q2)*

### [ ] T-263: Interaktivitas Keyboard, Type-ahead, Flip Viewport, Auto-Search & Integrasi Validasi T-259 *(diperbarui sesuai jawaban Q2, Q3, Q7)*
- **Ukuran:** M | **Skill Terkait:** `polish`, `adapt`
- **Deskripsi:** Mengembangkan controller JavaScript terpusat `public/js/admin-dropdown.js` untuk mengelola event buka/tutup, navigasi keyboard lengkap (Arrow, Enter, Space, Escape, Tab, Home, End, type-ahead), flip panel vertikal saat ruang bawah sempit, kotak pencarian otomatis jika opsi > 10, pembatasan max-height pada mobile <=480px, klik di luar, serta integrasi dengan `admin-form-validation.js` (T-259).
- **File Terdampak:** `public/js/admin-dropdown.js`, `public/js/admin-form-validation.js`, `views/admin/layout.ejs`.
- **Acceptance Criteria (AC):**
  1. Dropdown dapat dibuka, dinavigasi, dan dipilih sepenuhnya hanya menggunakan keyboard.
  2. Kotak pencarian otomatis dirender di bagian atas panel jika opsi > 10 item. *(sesuai Q7)*
  3. Pada viewport mobile <= 480px, panel tampil mengambang biasa dengan `max-height: 240px` dan scroll vertikal. *(sesuai Q3)*
  4. Saat ruang bawah layar kurang dari tinggi panel, class `.eu-dd-panel--top` otomatis diaktifkan (flip ke atas).
  5. Membuka satu dropdown otomatis menutup dropdown lainnya di dokumen; klik di luar menutup panel.
  6. Pemilihan opsi kustom memperbarui elemen `<select>` native dan memicu event `change`. *(sesuai Q2)*
  7. State error validasi form admin menampilkan border merah token, pesan inline, dan trigger dapat difokuskan otomatis saat form submit gagal (integrasi T-259).

### [ ] T-264: Animasi Mikro, State Lengkap & Variasi Skeleton/Ikon *(diperbarui sesuai jawaban Q2, Q6, Q8)*
- **Ukuran:** S | **Skill Terkait:** `animate`, `polish`
- **Deskripsi:** Menyempurnakan transisi mikro panel (hanya menggunakan properti `transform` dan `opacity`), rotasi caret 180 derajat, state shimmer skeleton loading (lingkaran + baris abu seidentik Gambar 1), slot ikon/thumbnail opsional saat data tersedia, skema warna hijau token untuk fokus dan terpilih, serta fallback instan pada `prefers-reduced-motion: reduce`.
- **File Terdampak:** `public/css/admin.css`, `public/css/components.css`.
- **Acceptance Criteria (AC):**
  1. Panel muncul dan menghilang dengan transisi halus `opacity` dan `transform: translateY()`.
  2. Caret berputar halus 180 derajat saat status `aria-expanded="true"`.
  3. Slot lingkaran kiri berfungsi ganda: skeleton shimmer saat loading (identik Gambar 1), dan slot ikon/thumbnail saat data ada; jika tanpa ikon, teks merapat rapi ke kiri. *(sesuai Q6)*
  4. State fokus menggunakan focus ring hijau token (`var(--focus-ring)`: `0 0 0 3px rgba(0, 117, 90, 0.25)`), item terpilih menggunakan latar hijau lembut `var(--primary-subtle)` dan teks hijau `var(--color-primary-dark)`. *(sesuai Q8)*
  5. Efek hover dibungkus dalam `@media (hover: hover)`.
  6. Pada preferensi `prefers-reduced-motion: reduce`, transisi dan animasi berjalan instan tanpa motion.

### [ ] T-265: Migrasi Dropdown Admin CMS (Form Tambah/Edit, Toolbar Table & Modal) *(diperbarui sesuai jawaban Q1, Q4, Q5, Q7)*
- **Ukuran:** M | **Skill Terkait:** `polish`, `adapt`
- **Deskripsi:** Menerapkan komponen `.eu-dd` pada 29 titik dropdown di area Admin CMS: form produk (`views/admin/products/{create,edit}.ejs`), form artikel/berita (`views/admin/posts/{create,edit}.ejs`), modal salin struktur kolom tabel ukuran, banner media type, dan filter toolbar katalog/leads sesuai pemetaan varian.
- **File Terdampak:** `views/admin/products/create.ejs`, `views/admin/products/edit.ejs`, `views/admin/posts/create.ejs`, `views/admin/posts/edit.ejs`, `views/admin/banners/create.ejs`, `views/admin/banners/edit.ejs`, `views/admin/products/index.ejs`, `views/admin/leads/index.ejs`, `views/admin/inquiries/index.ejs`.
- **Acceptance Criteria (AC):**
  1. Seluruh `<select>` pada form admin termigrasi ke `.eu-dd` varian `outlined` dengan label statis di atas. *(sesuai Q4, Q5)*
  2. Toolbar filter leads dan status tabel admin menggunakan varian `filled`. *(sesuai Q4)*
  3. Toolbar kategori produk admin menggunakan varian `elevated`. *(sesuai Q4)*
  4. Modal salin tabel ukuran produk (`#selectCopyProduct`) bekerja normal dan mendukung pencarian produk otomatis (opsi > 10). *(sesuai Q7)*
  5. Filter toolbar tabel admin dengan `data-auto-submit="true"` tetap otomatis mengirim form saat opsi dipilih.
  6. Kompatibel dengan tingkat zoom admin 100%, 125%, 150% pada resolusi 1366x768 hingga 1920x1080.

### [ ] T-266: Migrasi Dropdown Halaman Publik: Filter Urutan PLP & Form Kontak RFQ *(diperbarui sesuai jawaban Q1, Q4)*
- **Ukuran:** S | **Skill Terkait:** `polish`, `adapt`
- **Deskripsi:** Mengintegrasikan komponen `.eu-dd` varian `elevated` pada dropdown urutan katalog produk (`views/public/products.ejs`) dan varian `outlined` pada form kontak RFQ (`views/public/contact.ejs`) sesuai cakupan semua page.
- **File Terdampak:** `views/public/products.ejs`, `public/js/products.js`, `views/public/contact.ejs`, `public/js/contact.js`.
- **Acceptance Criteria (AC):**
  1. Dropdown urutan produk menampilkan format "Urutkan: **Terpopuler**" (dwibahasa ID: "Urutkan:", EN: "Sort by:") varian `elevated` seidentik Gambar 2 dan memicu AJAX update katalog secara seketika melalui `public/js/products.js`. *(sesuai Q1, Q4)*
  2. Dropdown produk dan tipe inquiry di form kontak menerapkan varian `outlined` dan terhubung rapi dengan validasi client-side, CSRF token, dan Cloudflare Turnstile tanpa konflik. *(sesuai Q1, Q4)*
  3. Aksesibilitas keyboard dan mobile drawer filter katalog tetap berfungsi 100%.

### [ ] T-267: Penskalaan 2x & Harmonisasi Spasi Marquee Section Merek Kami Homepage *(diperbarui sesuai jawaban Q9, Q10)*
- **Ukuran:** S | **Skill Terkait:** `polish`, `adapt`, `animate`
- **Deskripsi:** Menyesuaikan ukuran logo merek pada `.brand-strip-*` menjadi 2x di desktop (`clamp(168px, 16vw, 220px)`), ~1.5x di mobile (`clamp(90px, 20vw, 120px)`), merapatkan spasi `--brand-gap` menjadi `clamp(1.5rem, 3.5vw, 3rem)`, dan mengkalibrasi durasi animasi marquee dari 32s ke 48s agar kecepatan linier per piksel konstan.
- **File Terdampak:** `public/css/components.css`.
- **Acceptance Criteria (AC):**
  1. Logo merek di desktop tampil 2x lebih besar (`clamp(168px, 16vw, 220px)`), tampak proporsional, tajam, dan tidak buram.
  2. Logo merek di mobile tampil ~1.5x (`clamp(90px, 20vw, 120px)`), setidaknya 2 logo terlihat sekaligus pada viewport 320px-375px. *(sesuai Q9)*
  3. Jarak antar-logo seimbang dan rapat via `--brand-gap: clamp(1.5rem, 3.5vw, 3rem)`. *(sesuai Q10)*
  4. Durasi animasi marquee dikalibrasi menjadi 48s, pergerakan linier halus dan stabil.
  5. Pada viewport mobile 320px, 375px, 480px, dan 768px tidak terjadi horizontal scrollbar (overflow-x bebas bocor).
  6. Modal lightbox zoom preview (`#brandPreviewModal`) dan `prefers-reduced-motion` tetap berfungsi normal.

### [ ] T-268: Pengujian Komprehensif Lintas Browser, Zoom Admin, dan Audit Kontras WCAG AA *(diperbarui sesuai jawaban Q1, Q8)*
- **Ukuran:** M | **Skill Terkait:** `polish`
- **Deskripsi:** Melakukan regresi pengujian menyeluruh pada seluruh form admin dan halaman publik ber-dropdown, marquee beranda, navigasi keyboard-only, emulasi pembaca layar, pengujian zoom antarmuka admin 100%, 125%, 150%, dan verifikasi rasio kontras WCAG AA/AAA.
- **File Terdampak:** Berkas tes / skrip verifikasi.
- **Acceptance Criteria (AC):**
  1. Nol error console pada browser saat membuka, menutup, memfilter, atau mengirimkan form ber-dropdown di admin maupun publik. *(sesuai Q1)*
  2. Seluruh pasangan teks dan latar pada komponen `.eu-dd` memenuhi ambang batas kontras WCAG AA (>= 4.5:1 untuk teks biasa, >= 3:1 untuk non-teks). *(sesuai Q8)*
  3. Tidak ada regresi pada fungsionalitas CRUD admin dan form kontak RFQ.
