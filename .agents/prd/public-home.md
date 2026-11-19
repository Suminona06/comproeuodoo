Status: ACTIVE | Terakhir diverifikasi: 2026-11-17 | Kode: views/public/index.ejs, controllers/public/homeController.js, services/homeService.js

# PRD: Modul Beranda Publik (Public Home)

## 1. Ringkasan & Ruang Lingkup
Modul Beranda adalah etalase digital B2B utama PT Euodoo yang menampilkan identitas korporat, katalog manufaktur unggulan, inovasi material ramah lingkungan, sertifikasi mutu, dan portofolio merek resmi. Rincian perilaku delapan seksi beranda dijabarkan pada sub-modul [prd/public-home-sections.md](public-home-sections.md).

---

## 2. Functional Requirements

### FR-05: Render Halaman Publik Beranda
- Sistem merender beranda secara Server-Side Rendering (SSR) berbasis EJS dengan 8 seksi berurutan melalui halaman ramping `views/public/index.ejs` yang mengorkestrasikan partial `views/partials/home/*.ejs`:
  1. Hero Banner Slider (`.hero.hero-slider`)
  2. Company Introduction (`.sec-intro`)
  3. 4 Panel Kategori Manufaktur (`.sec-products`, `.hcat-*`)
  4. Why Choose Us (`.sec-why-us`, `.wcu-*`)
  5. Certifications & Accreditations (`.sec-evidence`)
  6. Registered Brands Marquee Strip (`.brand-strip-sec`, `.brand-strip-*`)
  7. Latest News Highlights (`.sec-news`)
  8. Global Pre-Footer CTA (`.sec-cta` via `views/partials/cta-global.ejs`)
- **Kebijakan Konten Fallback & Kepatuhan CSP:** Seluruh konten fallback teks statis hardcoded dihilangkan; jika data CMS kosong, seksi bersangkutan tidak dirender ke DOM (zero-render), kecuali Hero Slider yang mempertahankan safety net fallback dan seksi News yang merender empty-state ramah dwibahasa. Template wajib bebas inline `style`, warna hex langsung, komentar HTML, dan inline event handler (`onerror=`), serta menyajikan ilustrasi botani Why Choose Us sebagai aset eksternal `public/images/wcu-botanical.svg`.

### FR-06: Dukungan Dwibahasa (i18n)
- Setiap komponen beranda mendukung teks dwibahasa (Bahasa Indonesia `id` default & Bahasa Inggris `en`).
- Deteksi bahasa membaca cookie `euodoo_lang` atau query string `?lang=<id|en>` via route `/lang/:code`.
- Seluruh teks statis antarmuka, judul meta (`PT Euodoo Plastic`), `aria-label`, `title`, empty-state berita, dan label modal preview merek wajib bersumber dari kamus simetris `locales/id.json` & `locales/en.json` via helper `t('home.*')`.

### FR-10: Hero Banner Slider Dual CTA
- Menampilkan carousel slider banner berukuran penuh dengan auto-slide, navigasi dot/arrow, keyboard arrow, dan touch swipe.
- Setiap slide mendukung tombol utama (`.hero-cta-btn--primary.btn-pill-solid-white`) dan tombol kedua (`.hero-cta-btn--secondary.btn-pill-white`).
- Format media banner mendukung gambar WebP, file video lokal MP4/WebM, dan embed video YouTube (`media_type`).
- Di layar mobile (`< 768px`), tata letak tombol CTA bertransisi otomatis ke susunan vertikal (stack 100% width).
- Kontrol navigasi slider (`.hero-slider-controls`) diposisikan terpusat secara horizontal di area bawah (`left: 50%; transform: translateX(-50%)`) untuk menjamin tata letak simetris tanpa tabrakan dengan tombol CTA pada berbagai viewport, termasuk laptop 14 inci (1920x1080 dengan scaling 125%/150%).

### FR-11: Pengelolaan Banner Hero (CMS)
- Admin dapat mengelola slide banner (judul, subtitle, caption, media upload/URL, tombol utama, tombol kedua, status aktif, urutan tampilan) dengan penjagaan minimal 1 banner aktif serta respons error yang akurat bila ID banner tidak ditemukan saat toggle/hapus. `[PENDING T-352]`
- Validasi URL tombol CTA mengizinkan tautan relatif (`/products`, `/contact`, `#anchor`), URL absolut `http://` / `https://` (`https://wa.me/...`), `tel:`, dan `mailto:`; validasi URL video YouTube ditegakkan konsisten baik saat tambah maupun edit banner; serta penghapusan file fisik lokal (`/uploads/...`) hanya dijalankan bila bukan YouTube ID dan tidak sedang terdaftar di tabel `media` atau dipakai entitas lain. `[PENDING T-352]`

### FR-18: Pengelolaan Merek Terdaftar di CMS (CRUD Brands)
- Admin dapat menambah, menyunting, mengunggah file logo (atau memilih dari Media Picker yang disanitasi), mengaktifkan/menonaktifkan (dengan respons 404/error akurat bila ID tidak ditemukan), dan menghapus data merek dagang di `/admin/brands`; penghapusan file fisik logo lokal hanya dilakukan bila tidak terdaftar di tabel `media` dan tidak dipakai entitas lain. `[PENDING T-353]`
- Admin dapat memperbarui judul seksi merek beranda dwibahasa melalui endpoint `/admin/brands/section-title` (disimpan ke `home_brand_title_id` dan `home_brand_title_en`).

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Penskalaan 2x Logo Merek Desktop & Harmonisasi Spasi** | Meningkatkan brand authority di desktop (2x) dan mobile (~1.5x) dengan gap rapat agar tampilan marquee padat dan seimbang. | 2026-11-02 |
| **Dual CTA Hero Banner** | Memungkinkan pengunjung memilih langsung antara jelajahi katalog produk atau konsultasi langsung tanpa harus memilih salah satu. | 2026-10-20 |
| **Marquee Strip Merek Minimalis** | Menghemat ruang vertikal beranda dan menampilkan portofolio merek dagang secara elegan dibanding grid kartu statis. | 2026-10-20 |
| **Retensi Modal Zoom Preview Merek** | Mempertahankan bukti legalitas resolusi tinggi bagi mitra B2B yang ingin memeriksa detail logo merek terdaftar. | 2026-10-20 |
| **4 Panel Kategori Primer** | Menggantikan kartu featured produk acak agar calon pembeli B2B dapat langsung memfilter segmen manufaktur yang relevan. | 2026-10-19 |
| **Why Choose Us menggantikan 3 Pilar** | Memperkuat diferensiasi korporat sebagai pionir aditif plastik ramah lingkungan dengan narasi editorial terarah. | 2026-10-19 |
| **Pembersihan Rona Biru ke Palet Hijau** | Menyelaraskan seluruh elemen visual beranda dengan identitas merek manufaktur ramah lingkungan di `Design/DESIGN.md`. | 2026-10-17 |
| **Header Produk Single CTA & Spasi Adaptif** | Menghilangkan duplikasi tombol katalog di header dan merapikan hierarki jarak vertikal judul-deskripsi. | 2026-10-28 |
| **Why Choose Us Mobile Bersih Tanpa Floating Card & Chip** | Menjaga agar ilustrasi daun botani tampil utuh tanpa tertutup elemen floating card maupun chip label di mobile. | 2026-10-28 |
| **Transisi Gradasi Halus Latar Seksi Why Choose Us** | Menghilangkan garis batas tegas (hard edge) pada peralihan latar abu-muda dan hijau botani menggunakan token semantik. | 2026-10-28 |
| **Penskalaan Logo Marquee Mobile** | Memastikan logo merek dagang terdaftar terbaca jelas pada layar ponsel kecil tanpa overflow. | 2026-10-28 |
| **Centering Kontrol Slider Hero Banner** | Menempatkan kontrol slider di tengah bawah layar agar bebas tabrakan dengan tombol CTA pada resolusi laptop 14 inci dan desktop. | 2026-10-28 |
