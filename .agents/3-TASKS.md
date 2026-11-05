# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 7 Task (T-294 s/d T-300)
- **Total Task Selesai:** 289 Task (T-01 s/d T-293)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-301**.

---

## Task Aktif / Terbuka (Open Tasks)

### T-294: Persiapan Whitelist Ikon SVG Identik Desain & Normalizer Data Model
- **Deskripsi**: Menyiapkan 6 aset SVG garis stroke seragam yang presisi identik dengan gambar desain (`praying-hands`, `shield-check`, `chat-dots`, `heart`, `star`, `handshake`) sebagai partial server-side / helper dictionary, serta memperbarui defaults dan parser fallback `about_values_json` pada `models/aboutModel.js` agar data lama tetap valid dan aman dengan dukungan huruf pilar dinamis.
- **Acceptance Criteria**:
  - [ ] 6 SVG garis outline tersimpan rapi tanpa inline style/handler dan tanpa warna hex mentah (`stroke="currentColor"`, `viewBox="0 0 24 24"`), 100% identik dengan motif pada gambar referensi.
  - [ ] `aboutModel.js` memuat defaults lengkap 6 pilar dengan properti `letter`, `title_id`, `title_en`, `desc_id`, `desc_en`, `image_url`, `icon_key`, dan `sort_order`.
  - [ ] Fungsi `aboutModel.getAboutData()` melakukan fallback graceful jika ada properti yang belum didefinisikan pada data database lama, serta membaca pengaturan baru `about_values_bg_image`, `about_values_pill_*`, dan `about_values_subtitle_*`.
- **File Terdampak**: `views/partials/icons/ticket/*.ejs` (atau helper icon dictionary), `models/aboutModel.js`
- **Skill**: `antislop-code` + `ponytail`
- **Verifikasi**: Unit test pemanggilan `aboutModel.getAboutData()` mengembalikan 6 pilar lengkap dengan fallback aman dan key header/latar baru.

### T-295: Penyesuaian Antarmuka Admin CMS Tab Nilai Budaya & Validasi Controller
- **Deskripsi**: Memperbarui form `views/admin/about/partials/tab-nilai.ejs` untuk mendukung pengelolaan foto latar section, input pill dan subjudul dwibahasa ID/EN, serta 6 kartu pilar yang memuat input huruf fleksibel (1 karakter), judul ID/EN, deskripsi ID/EN, foto latar kartu via Universal Media Picker, dan dropdown kustom admin (`.eu-dd-*`) dengan pratinjau SVG untuk 6 pilihan icon whitelist. Memperbarui `aboutController.update` dengan validasi server-side ketat.
- **Acceptance Criteria**:
  - [ ] Tab 3 ("Nilai Budaya") menampilkan form konfigurasi header seksi (pill ID/EN, subjudul ID/EN, foto latar seksi).
  - [ ] 6 kartu pilar dapat disunting hurufnya (input `maxlength="1"`, auto-uppercase), judul, deskripsi, foto kartu, dan ikonnya.
  - [ ] Media picker bekerja mulus untuk memilih foto dari media library lokal tanpa inline style.
  - [ ] Dropdown ikon menampilkan preview SVG dari whitelist 6 ikon resmi identik gambar.
  - [ ] Controller memvalidasi whitelist `icon_key`, URL lokal media library, dan batas panjang karakter (huruf 1 char, judul max 50, deskripsi max 250, pill max 50, subjudul max 150).
  - [ ] Penyimpanan data berhasil memperbarui `about_values_json` dan pengaturan baru tanpa menghapus field lain.
- **File Terdampak**: `views/admin/about/partials/tab-nilai.ejs`, `controllers/admin/aboutController.js`, `public/css/admin.css`
- **Skill**: `antislop-code` + `code-review-and-quality`
- **Verifikasi**: Uji submit form admin, cek integritas JSON di tabel settings, dan verifikasi validasi tolak input di luar whitelist.

### T-296: Pembersihan Legacy Inline Styles & Implementasi Markup Accordion Publik
- **Deskripsi**: Membersihkan seluruh inline `style="..."` dan hex code dari section `#core-values` di `views/public/about.ejs`, mengekstrak komponen ke partial modular `views/partials/about/ticket-accordion.ejs`, mengintegrasikan latar foto seksi dengan overlay gradien token, merangkai judul akronim otomatis dari huruf 6 pilar aktif, dan menetapkan panel ke-3 aktif secara default saat render SSR.
- **Acceptance Criteria**:
  - [ ] Zero inline style dan zero hex color di section pilar budaya kerja.
  - [ ] Partial berukuran <= 100 baris sesuai konvensi modularitas EJS.
  - [ ] Judul section otomatis dirangkai dari gabungan `letter` ke-6 pilar aktif (mis. `T - I - C - K - E - T`).
  - [ ] Panel ke-3 (indeks 2) otomatis dirender dengan status aktif (`is-active`, `aria-expanded="true"`).
  - [ ] Markup semantik menggunakan `role="tablist"`, `role="tab"`, `role="tabpanel"`, serta `aria-controls`.
  - [ ] Tombol "Pelajari Lebih Lanjut", kicker, dan teks note ditiadakan sepenuhnya.
  - [ ] Foto dimuat menggunakan elemen `<img>` semantik dengan `loading="lazy"` (atau eager untuk panel awal) dan class `.abt-tkt-img` (`object-fit: cover`).
  - [ ] Kamus bahasa `locales/id.json` dan `locales/en.json` disinkronkan untuk seluruh teks statis.
- **File Terdampak**: `views/public/about.ejs`, `views/partials/about/ticket-accordion.ejs`, `locales/id.json`, `locales/en.json`
- **Skill**: `impeccable` (polish) + `antislop-human` + `antislop-code`
- **Verifikasi**: `npm run lint:views` dan `npm run lint:i18n` lulus hijau tanpa peringatan pada berkas terkait.

### T-297: Penataan Styling Desktop & Mobile Accordion Berbasis Token Desain
- **Deskripsi**: Mengimplementasikan styling CSS lengkap untuk `.abt-tkt-*` di `public/css/components.css`: latar section dengan foto pabrik + scrim overlay gradien token, tata letak desktop 6 panel berdampingan dengan border glow lembut, tipografi vertikal diapit garis aksen tipis, styling panel aktif, indikator dots di bawah, serta tata letak mobile bertumpuk vertikal pada breakpoint konsisten `@media (max-width: 768px)` dengan target sentuh min 44px.
- **Acceptance Criteria**:
  - [ ] Seluruh warna, radius sudut, shadow, dan spasi merujuk 100% ke token CSS (`tokens.css`).
  - [ ] Latar section memadukan foto dan scrim overlay token dengan rasio kontras teks header >= 4.5:1 (WCAG AA).
  - [ ] Status fokus keyboard (`:focus-visible`) tampak jelas dan kontras.
  - [ ] Tampilan mobile pada `@media (max-width: 768px)` bertumpuk vertikal rapi, panel aktif membuka ke bawah tanpa overflow scrollbar di 320px.
  - [ ] Seluruh teks putih di atas overlay foto memenuhi kontras WCAG AA (>= 4.5:1 untuk teks body, >= 3:1 untuk teks besar).
- **File Terdampak**: `public/css/components.css`
- **Skill**: `antislop-layoutmobile` + `antislop-human` + `impeccable` (adapt)
- **Verifikasi**: Uji inspeksi DOM dan verifikasi visual responsif pada 320px, 375px, 768px, 1024px, 1440px.

### T-298: Orkestrasi Animasi Anime.js v3 & Logika Interaksi Klien (Klik & Fokus Saja)
- **Deskripsi**: Membangun skrip eksternal `public/js/ticket-accordion.js` untuk mengelola interaksi klik mouse dan navigasi keyboard saja (tanpa hover), sinkronisasi dots, inisialisasi panel ke-3 aktif saat load, animasi pelebaran `flex-grow` (1 ke 3) via Anime.js v3, pembatalan animasi berjalan saat klik cepat, pre-decode gambar, serta penanganan `prefers-reduced-motion`.
- **Acceptance Criteria**:
  - [ ] Pemicu interaksi hanya event `click` dan `keydown` (`Enter`, `Space`, `ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown`). Event hover kursor mouse tidak memicu perpindahan panel.
  - [ ] State awal saat load mengaktifkan panel ke-3 (indeks 2) secara mulus.
  - [ ] Transisi pelebaran panel mengorkestrasikan proxy `flex-grow` (1 ke 3) dan kemunculan teks secara halus via Anime.js v3 (`anime({})`).
  - [ ] Animasi berjalan dibatalkan seketika (`anime.remove()`) saat pengguna mengklik panel lain secara cepat untuk mencegah glitch layout.
  - [ ] Pada `prefers-reduced-motion: reduce`, transisi berlangsung instan tanpa animasi interpolasi JS.
  - [ ] Zero CLS: Tinggi kontainer accordion tetap stabil (510px di desktop) tanpa pergeseran elemen sekitarnya.
- **File Terdampak**: `public/js/ticket-accordion.js`, `views/public/about.ejs`
- **Skill**: `impeccable` (animate) + `antislop-code`
- **Verifikasi**: Uji interaksi klik cepat mouse dan navigasi keyboard di browser; verifikasi ketiadaan error console JavaScript.

### T-299: Uji Regresi, Audit Aksesibilitas WCAG & Gerbang Kualitas Lint
- **Deskripsi**: Menjalankan pengujian regresi komprehensif pada halaman Tentang Kami dan panel admin CMS, melakukan audit rasio kontras teks menggunakan `antislop-human` contrast-checker (terutama teks header di atas foto latar ber-scrim), memverifikasi ketiadaan error console, dan memastikan kepatuhan penuh terhadap gerbang linting.
- **Acceptance Criteria**:
  - [ ] Section lain di `/about` (Galeri Bento + Lightbox PhotoSwipe, Statistik, Timeline, Visi Misi) tetap berfungsi normal tanpa regresi.
  - [ ] Tab admin lain di CMS Tentang Kami tetap dapat disimpan dengan normal.
  - [ ] `npm run lint` menghasilkan 0 error.
  - [ ] `npm run lint:views` menghasilkan 0 error pada seluruh file yang disentuh.
  - [ ] Seluruh teks dwibahasa (ID dan EN) tampil benar saat pergantian bahasa.
- **File Terdampak**: Test suite automatisasi / Playwright QA script
- **Skill**: `antislop-human` + `code-review-and-quality`
- **Verifikasi**: Eksekusi skrip verifikasi otomatis dan bukti visual Playwright sebelum vs sesudah.

### T-300: Verifikasi Komparasi Screenshot 1440px vs Desain Asli & Finalisasi Dokumentasi
- **Deskripsi**: Mengambil screenshot tampilan desktop pada viewport 1440px dengan panel ke-3 terbuka, membandingkan secara berdampingan dengan gambar referensi desain asli, mendokumentasikan setiap selisih visual mikro yang tersisa, serta mempersiapkan artefak untuk tahap Close.
- **Acceptance Criteria**:
  - [ ] Screenshot 1440px desktop mereplikasi proporsi, kontur, glow hijau, dan tipografi gambar desain secara presisi dengan panel ke-3 terbuka.
  - [ ] Tabel deviasi visual (jika ada selisih mikro) didokumentasikan secara transparan.
  - [ ] Seluruh kriteria penerimaan siap diverifikasi oleh Azis.
- **File Terdampak**: Dokumentasi QA & artifact screenshot
- **Skill**: `impeccable` (polish)
- **Verifikasi**: Laporan komparasi visual berdampingan siap disajikan.
