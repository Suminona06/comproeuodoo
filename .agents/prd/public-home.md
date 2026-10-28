Status: ACTIVE | Terakhir diverifikasi: 2026-10-21 | Kode: views/public/index.ejs, controllers/public/homeController.js

# PRD: Modul Beranda Publik (Public Home)

## 1. Ringkasan & Ruang Lingkup
Modul Beranda adalah etalase digital B2B utama PT Euodoo yang menampilkan identitas korporat, katalog manufaktur unggulan, inovasi material ramah lingkungan, sertifikasi mutu, dan portofolio merek resmi.

---

## 2. Functional Requirements

### FR-05: Render Halaman Publik Beranda
- Sistem merender beranda secara Server-Side Rendering (SSR) berbasis EJS dengan 8 seksi berurutan:
  1. Hero Banner Slider (`.hero.hero-slider`)
  2. Company Introduction (`.sec-intro`)
  3. 4 Panel Kategori Manufaktur (`.sec-products`, `.hcat-*`)
  4. Why Choose Us (`.sec-why-us`, `.wcu-*`)
  5. Certifications & Accreditations (`.sec-evidence`)
  6. Registered Brands Marquee Strip (`.brand-strip-sec`, `.brand-strip-*`)
  7. Latest News Highlights (`.sec-news`)
  8. Global Pre-Footer CTA (`.sec-cta`)

### FR-06: Dukungan Dwibahasa (i18n)
- Setiap komponen beranda mendukung teks dwibahasa (Bahasa Indonesia `id` default & Bahasa Inggris `en`).
- Deteksi bahasa membaca cookie `euodoo_lang` atau query string `?lang=<id|en>` via route `/lang/:code`.

### FR-10: Hero Banner Slider Dual CTA
- Menampilkan carousel slider banner berukuran penuh dengan auto-slide dan navigasi dot/arrow.
- Setiap slide mendukung tombol utama (Primary CTA: `.hero-cta-btn--primary.btn-pill-solid-white`) dan tombol kedua (Secondary CTA: `.hero-cta-btn--secondary.btn-pill-white`).
- Format media banner mendukung gambar WebP, file video lokal MP4/WebM, dan embed video YouTube (`media_type`).
- Di layar mobile (`< 768px`), tata letak tombol CTA bertransisi otomatis ke susunan vertikal (stack 100% width).

### FR-11: Pengelolaan Banner Hero (CMS)
- Admin dapat mengelola slide banner (judul, subtitle, caption, media upload/URL, tombol utama, tombol kedua, status aktif, urutan tampilan).
- Validasi URL tombol CTA mengizinkan format aman: tautan relatif (`/products`, `/contact`), URL absolut HTTPS, `tel:`, `mailto:`, dan `https://wa.me/...`.

### 4 Panel Kategori Manufaktur Primer (`.hcat-*`)
- Menampilkan 4 panel kategori produk berukuran besar dalam grid responsif CSS Variable `--hcat-cols`.
- Setiap panel memuat gambar segmen, scrim overlay gelap, nama kategori, dan jumlah produk terpublikasi.
- Klik panel mengarahkan pengguna ke katalog dengan deep-link filter: `/products?category=<slug>`.
- Header seksi menampilkan judul dan deskripsi dengan pemisahan margin vertikal adaptif berbasis token; navigasi katalog tunggal dipusatkan pada tombol bawah seksi (`.prod-more-wrap .btn-see-more`), tanpa tombol redundan di kanan header [PENDING T-233].

### Why Choose Us (`.wcu-*`)
- Seksi editorial B2B yang menonjolkan inovasi aditif ramah lingkungan (*100% degradable*) dan kepatuhan standar SNI.
- Terdiri atas header (`.wcu-header`), kicker status chip (`.wcu-kicker`), teks editorial (`.wcu-headline`, `.wcu-desc`), serta ilustrasi SVG statis (`.wcu-artbox`) dengan floating badge (`.wcu-float-card`).
- Khusus pada viewport mobile (`< 768px`), elemen floating badge (`.wcu-float-card`) dan chip label (`.wcu-art-label`) disembunyikan sehingga ilustrasi daun botani SVG tampil 100% utuh dan leluasa tanpa elemen penutup [PENDING T-235]. Desktop tetap mempertahankan kartu melayang dan chip label.
- Batas atas dan bawah seksi Why Choose Us menggunakan transisi gradasi lembut berbasis token semantik tanpa garis batas kaku (*hard edge*) [PENDING T-234].
- Anchor `#pilar` dipertahankan sebagai alias navigasi backward-compatible.

### Certifications & Accreditations (`.sec-evidence`)
- Menampilkan daftar logo sertifikasi mutu dan akreditasi resmi (mis. SNI 7188.7:2011, OXIUM Technology, InSWA).
- Seksi ini bersifat kondisional: tampil pada public view jika toggle CMS `home_cert_is_active` bernilai `1`.

### FR-17: Registered Brands Marquee Strip (`.brand-strip-*`)
- Menampilkan portofolio merek dagang resmi perusahaan dalam bentuk strip horizontal berjalan kontinu (*continuous marquee*).
- Menggunakan struktur 2 track identik (`.brand-strip-track`) untuk efek looping mulus tanpa celah (*gapless*).
- Dimensi logo merek pada viewport mobile (`< 768px`) ditingkatkan proporsional (`height: clamp(70px, 13vw, 88px)`) untuk meningkatkan keterbacaan legalitas merek tanpa menyebabkan overflow di 320px [PENDING T-236].
- Berhenti bergulir (*pause on hover/focus*) saat kursor diarahkan ke area strip atau logo difokuskan keyboard.
- Mendukung preferensi aksesibilitas `prefers-reduced-motion` (animasi dinonaktifkan, logo disusun flex-wrap statis rapi).
- **Modal Zoom Preview Retained:** Klik logo atau tekan Space/Enter membuka dialog modal lightbox preview (`#brandPreviewModal`) untuk melihat logo resolusi tinggi.

### FR-18: Pengelolaan Merek Terdaftar di CMS (CRUD Brands)
- Admin dapat menambah, menyunting, mengunggah file logo, mengaktifkan/menonaktifkan, dan menghapus data merek dagang di `/admin/brands`.
- Admin dapat memperbarui judul seksi merek beranda dwibahasa secara dinamis melalui endpoint `/admin/brands/section-title` (disimpan ke `home_brand_title_id` dan `home_brand_title_en`).


---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Dual CTA Hero Banner** | Memungkinkan pengunjung memilih langsung antara jelajahi katalog produk atau konsultasi langsung tanpa harus memilih salah satu. | 2026-10-20 |
| **Marquee Strip Merek Minimalis** | Menghemat ruang vertikal beranda dan menampilkan portofolio merek dagang secara elegan dibanding grid kartu statis. | 2026-10-20 |
| **Retensi Modal Zoom Preview Merek** | Mempertahankan bukti legalitas resolusi tinggi bagi mitra B2B yang ingin memeriksa detail logo merek terdaftar. | 2026-10-20 |
| **4 Panel Kategori Primer** | Menggantikan kartu featured produk acak agar calon pembeli B2B dapat langsung memfilter segmen manufaktur yang relevan. | 2026-10-19 |
| **Why Choose Us menggantikan 3 Pilar** | Memperkuat diferensiasi korporat sebagai pionir aditif plastik ramah lingkungan dengan narasi editorial terarah. | 2026-10-19 |
| **Pembersihan Rona Biru ke Palet Hijau** | Menyelaraskan seluruh elemen visual beranda dengan identitas merek manufaktur ramah lingkungan di `Design/DESIGN.md`. | 2026-10-17 |
| **Header Produk Single CTA & Spasi Adaptif** | Menghilangkan duplikasi tombol katalog di header dan merapikan hierarki jarak vertikal judul-deskripsi [PENDING T-233]. | 2026-10-28 |
| **Why Choose Us Mobile Bersih Tanpa Floating Card & Chip** | Menjaga agar ilustrasi daun botani tampil utuh tanpa tertutup elemen floating card maupun chip label di mobile [PENDING T-235]. | 2026-10-28 |
| **Transisi Gradasi Halus Latar Seksi Why Choose Us** | Menghilangkan garis batas tegas (hard edge) pada peralihan latar abu-muda dan hijau botani menggunakan token semantik [PENDING T-234]. | 2026-10-28 |
| **Penskalaan Logo Marquee Mobile** | Memastikan logo merek dagang terdaftar terbaca jelas pada layar ponsel kecil tanpa overflow [PENDING T-236]. | 2026-10-28 |
