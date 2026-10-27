# PRD: Website Company Profile & CMS PT Euodoo

Dokumen ini adalah spesifikasi produk utama (*Product Requirement Document*) PT Euodoo Presisi Indonesia. Rincian kebutuhan fungsional telah dimodularisasi ke dalam direktori [`prd/`](prd/) untuk efisiensi pembacaan dan pemeliharaan.

---

## 1. Visi, Tujuan & Value Proposition

### Visi Produk
Membangun platform company profile dan katalog manufaktur digital modern yang memposisikan PT Euodoo sebagai produsen kantong plastik terkemuka, terpercaya, dan berwawasan lingkungan (*100% degradable*) sejak 1990 di Indonesia.

### Tujuan Utama
1. **Konversi Penjualan B2B:** Menyediakan alur permintaan penawaran harga (*Request for Quotation* / RFQ) yang cepat, terstruktur, dan terintegrasi langsung ke WhatsApp dan email penjualan.
2. **Kredibilitas Korporat:** Menyajikan transparansi kapasitas manufaktur di Cigondewah Bandung, standar mutu resmi SNI, portofolio merek terdaftar, dan sertifikasi lingkungan.
3. **Kemandirian Pengelolaan Konten (CMS):** Memberikan akses bagi staf non-teknis untuk memperbarui katalog produk, mempublikasikan artikel edukasi, mengelola banner, dan meninjau pesan calon pembeli secara berkala.

### Value Proposition
- **Pionir Aditif Degradable:** Menghadirkan solusi kemasan kantong plastik HDPE dan LLDPE ramah lingkungan yang teruji terdegradasi tanpa mencemari tanah.
- **Standar Mutu Konsisten:** Menjaga presisi ketebalan mikron, segel anti-bocor (*bottom seal / star seal*), dan daya tahan beban tinggi untuk retail modern dan industri nasional.

---

## 2. User Persona

### Persona 1: Rian (38) &mdash; Manajer Pengadaan di Perusahaan Retail & Consumer Goods
- **Kebutuhan:** Mencari supplier kantong belanja berskala besar dengan kapasitas pasokan stabil, kepatuhan legalitas regulasi plastik ramah lingkungan, dan respon cepat terhadap spesifikasi custom.
- **Tindakan Kunci:** Memeriksa spesifikasi mikron produk, meninjau sertifikasi SNI, dan mengirimkan form RFQ dengan rincian kuantitas pesanan.

### Persona 2: Sari (42) &mdash; Mitra Distributor & Reseller Plastik
- **Kebutuhan:** Memeriksa ketersediaan varian produk reguler, katalog ukuran kemasan, dan menghubungi sales representative via WhatsApp untuk negosiasi kuota distributor.
- **Tindakan Kunci:** Mengunduh atau membaca katalog varian produk dan mengklik tombol WhatsApp mengambang.

---

## 3. Peta Modul Spesifikasi Fungsional (PRD)

Detail setiap kebutuhan fungsional (FR-01 s/d FR-23) didefinisikan secara terpisah pada masing-masing dokumen modul:

| Modul | Cakupan Fungsional | ID Terkait | Dokumen Spesifikasi |
| :--- | :--- | :--- | :--- |
| **Public Home** | Hero banner slider Dual CTA, Company Intro, 4 Panel Kategori Primer, Why Choose Us, Bukti Sertifikasi Mutu, Marquee Merek Terdaftar | FR-05, FR-06, FR-10, FR-11, FR-17, FR-18 | [prd/public-home.md](prd/public-home.md) |
| **Public About** | Profil pabrik Cigondewah, Nilai-nilai Inti TIKET, Visi Misi berfoto, Galeri Bento Mosaik berhalaman, Angka Statistik, Timeline Sejarah | FR-05 | [prd/public-about.md](prd/public-about.md) |
| **Products & Capabilities** | Katalog produk, filter kategori deep-link, detail produk, spesifikasi material, varian ukuran, ekspor CSV, kapabilitas mesin | FR-07, FR-08, FR-09 | [prd/products.md](prd/products.md) |
| **News & Articles** | Portal berita, headline carousel slider, 3 tab kategori, pencarian, detail artikel rich text, custom editable slug & auto redirect 301 | FR-12, FR-13 | [prd/news.md](prd/news.md) |
| **Contact, Footer & WA** | Formulir RFQ terisolasi `.cf-*`, dual lokasi Head Office & Factory, embed peta Google Maps, floating button WA, pre-footer CTA | FR-14, FR-15 | [prd/contact-footer.md](prd/contact-footer.md) |
| **Admin CMS & Users** | Autentikasi login/logout/ganti password, RBAC (Superadmin/Admin/Editor), dashboard metrik operasional, kelola data inquiry | FR-01, FR-02, FR-03, FR-04, FR-16, FR-23 | [prd/admin-cms.md](prd/admin-cms.md) |
| **Media Library** | Galeri pustaka media terpusat, konversi Sharp WebP, Universal Media Picker Modal, integrasi video YouTube, audit check usage | FR-19 | [prd/media-library.md](prd/media-library.md) |
| **SEO & Security** | Metadata SEO per entitas, sitemap.xml & robots.txt otomatis, JSON-LD Schema.org, proteksi CSRF, rate limiter, Cloudflare Turnstile | FR-20, FR-21 | [prd/seo-security.md](prd/seo-security.md) |
| **Site Settings** | Pengaturan identitas korporat, upload favicon & dual logo, single source of truth alamat kontak, visibilitas medsos, nomor WA | FR-22 | [prd/settings.md](prd/settings.md) |

---

## 4. Non-Functional Requirements (NFR)

### Performa
- Kecepatan muat halaman publik (First Contentful Paint) berada di bawah 1.5 detik pada jaringan 4G standar.
- Pengoptimalan seluruh aset visual melalui kompresi otomatis WebP dan penerapan atribut `loading="lazy"` (kecuali slide banner hero pertama yang memakai `fetchpriority="high"`).
- Tata letak stabil tanpa pergeseran layout mendadak (Cumulative Layout Shift < 0.1).

### Keamanan
- Penegakan transmisi terenkripsi penuh HTTPS di lingkungan produksi.
- Seluruh formulir mutasi dilindungi token CSRF dan sanitasi input terhadap Cross-Site Scripting (XSS).
- Kredensial pengguna di-hash menggunakan algoritma `bcrypt` (salt rounds >= 10).
- Session admin disimpan di Cookie dengan atribut `HttpOnly`, `SameSite=Lax`, dan `Secure` (saat produksi).
- Proteksi anti-brute force dan pembatasan spam (rate limiter).

### Aksesibilitas & Kompatibilitas Tampilan
- Seluruh antarmuka publik wajib lolos kriteria kontras warna WCAG 2.1 Level AA (kontras minimal 4.5:1 untuk teks normal dan 3:1 untuk teks besar/komponen interaktif).
- Dukungan responsif multi-breakpoint: Ponsel Ringkas (320px–375px), Ponsel Standar (375px–480px), Tablet (768px), Laptop (1024px), dan Desktop Luas (1440px).
- Penanganan preferensi pengguna terhadap pengurangan gerakan (`prefers-reduced-motion: reduce`) pada seluruh elemen animasi (marquee, bento slider, transisi hover).

---

## 5. Out of Scope & Batasan Rilis
- **Transaksi E-Commerce / Payment Gateway:** Tidak menyediakan keranjang belanja checkout instan atau integrasi payment gateway perbankan. Seluruh transaksi B2B diproses melalui formulir RFQ dan korespondensi tim penjualan.
- **Portal Karyawan / Payroll Internal:** Sistem ini murni company profile dan CMS publik, bukan sistem ERP/HRIS.
- **Aplikasi Mobile Native (iOS/Android):** Seluruh akses perangkat mobile dilayani melalui antarmuka responsif mobile web berbasis browser.
