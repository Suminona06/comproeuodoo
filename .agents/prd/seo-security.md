Status: ACTIVE | Terakhir diverifikasi: 2026-10-21 | Kode: controllers/public/seoController.js, middleware/seoMiddleware.js, middleware/rateLimiter.js

# PRD: Modul SEO & Keamanan (SEO & Security)

## 1. Ringkasan & Ruang Lingkup
Modul SEO & Keamanan menjamin keterindeksan optimal situs pada mesin pencari internasional/lokal, penegakan metadata terstruktur, serta perlindungan aplikasi dari serangan spam, brute-force, dan injeksi data.

---

## 2. Functional Requirements

### FR-20: Pengelolaan Metadata SEO per Entitas Konten
- Setiap entitas publik (Produk, Artikel Berita, Halaman Statis) memiliki field konfigurasi SEO mandiri di CMS:
  - Meta Title (ID/EN, max 70 karakter).
  - Meta Description (ID/EN, max 160 karakter).
  - Open Graph Image (URL gambar pratinjau media sosial 1200x630).
  - Canonical URL untuk mencegah duplikasi konten.
  - Petunjuk Robots (`index, follow` atau `noindex, nofollow`).
- Middleware SEO menginjeksi tag `<title>`, `<meta name="description">`, Open Graph (`og:title`, `og:image`, `og:url`), Twitter Card, serta tag alternat dwibahasa (`hreflang="id"`, `hreflang="en"`, `hreflang="x-default"`) secara otomatis ke setiap halaman.

### FR-21: Generator Otomatis Sitemap.xml & Robots.txt
- Endpoint `/sitemap.xml`: menghasilkan dokumen XML dinamis yang mengindeks seluruh URL aktif produk, artikel, dan halaman statis lengkap dengan stempel waktu pembaruan terakhir (`lastmod`).
- Endpoint `/robots.txt`: menghasilkan instruksi dinamis bagi web crawler mesin pencari, mengizinkan akses ke rute publik, memblokir pengindeksan direktori internal `/admin/`, dan merujuk lokasi peta situs sitemap.

### JSON-LD Structured Data
- Menginjeksi skema data terstruktur Schema.org berbasis JSON-LD pada setiap template view:
  - Beranda: Skema `Organization` & `WebSite`.
  - Halaman Produk: Skema `Product` (nama, deskripsi, merek, gambar, spesifikasi).
  - Halaman Berita: Skema `Article` (judul, tanggal publikasi, penulis, gambar).

### Proteksi Keamanan Aplikasi
- **Cross-Site Request Forgery (CSRF):** Validasi token CSRF pada seluruh permintaan metode mutasi (`POST`, `PUT`, `DELETE`).
- **Rate Limiting:**
  - Login Admin: maksimal 5 percobaan gagal per IP/akun dalam 15 menit.
  - Pengiriman Formulir Kontak/RFQ: maksimal 10 submisi per IP dalam 15 menit guna mencegah spam bot.
- **Cloudflare Turnstile CAPTCHA:** Verifikasi token interaktif tak kasat mata (*invisible CAPTCHA*) pada pengiriman formulir kontak publik.
- **Sanitasi HTML Anti-XSS:** Pembersihan kode berbahaya pada seluruh input teks dan konten rich text editor TinyMCE.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Sitemap XML Dinamis Terkoneksi Database** | Memastikan setiap produk dan artikel baru langsung terindeks mesin pencari tanpa perlu pembaruan file manual. | 2026-09-29 |
| **Proteksi Cloudflare Turnstile** | Melindungi tim penjualan dari serangan spam formulir RFQ tanpa membebani pengalaman pengguna seperti CAPTCHA gambar tradisional. | 2026-10-06 |
| **Penegakan Tag Hreflang Dwibahasa** | Mencegah penalti mesin pencari atas halaman berstruktur serupa dalam dua bahasa (ID & EN). | 2026-09-29 |
