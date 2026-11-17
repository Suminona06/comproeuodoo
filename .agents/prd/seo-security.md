Status: ACTIVE | Terakhir diverifikasi: 2026-11-17 | Kode: controllers/public/seoController.js, middleware/seoMiddleware.js, middleware/rateLimiter.js

# PRD: Modul SEO & Keamanan (SEO & Security)

## 1. Ringkasan & Ruang Lingkup
Modul SEO & Keamanan menjamin keterindeksan optimal situs pada mesin pencari internasional/lokal, penegakan metadata terstruktur, serta perlindungan aplikasi dari serangan spam, brute-force, dan injeksi data.

---

## 2. Functional Requirements

### FR-20: Pengelolaan Metadata SEO per Entitas Konten
- Setiap entitas publik (Produk, Artikel Berita, Halaman Statis) memiliki field konfigurasi SEO mandiri di CMS:
  - Meta Title (ID/EN, max 70 karakter). Pembentukan `<title>` default, `home.meta_title_fallback`, `og:site_name`, `Organization.name`, serta halaman 404/error publik diseragamkan menggunakan merek `PT Euodoo Plastic` (tetap mempertahankan format `nama/judul | <company_name>` pada detail produk/berita tanpa membaca custom `meta_title_id`/`meta_title_en` per entitas).
  - Meta Description (ID/EN, max 160 karakter).
  - Open Graph Image (URL gambar pratinjau media sosial 1200x630).
  - Canonical URL untuk mencegah duplikasi konten.
  - Petunjuk Robots (`index, follow` atau `noindex, nofollow`).
- Middleware SEO menginjeksi tag `<title>`, `<meta name="description">`, Open Graph (`og:title`, `og:image`, `og:url`), Twitter Card, serta tag alternat dwibahasa (`hreflang="id"`, `hreflang="en"`, `hreflang="x-default"`) secara otomatis ke setiap halaman.

### FR-21: Generator Otomatis Sitemap.xml & Robots.txt
- Endpoint `/sitemap.xml`: menghasilkan dokumen XML dinamis yang mengindeks seluruh URL aktif produk, artikel, dan halaman statis lengkap dengan stempel waktu pembaruan terakhir (`lastmod`), tanpa menyertakan URL `/admin`.
- Endpoint `/robots.txt`: menghasilkan instruksi dinamis bagi web crawler mesin pencari, mengizinkan akses ke rute publik, mempertahankan `Disallow: /admin` dan `Disallow: /admin/*`, serta merujuk lokasi peta situs sitemap.

### FR-35: Proteksi Noindex Total Area Admin (`/admin`, `/admin/login`, `/admin/*`)
- Seluruh rute dan respons `/admin`, `/admin/login`, dan `/admin/*` (halaman login, dashboard, modul CMS, halaman 401/403/429/404/500, penolakan CSRF HTML/JSON pada `/admin/*`, JSON API admin, serta ekspor CSV) wajib mengirim HTTP header `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` agar tidak diindeks oleh mesin pencari mana pun.
- Seluruh template head admin (`views/admin/login.ejs`, `views/partials/admin-header.ejs`, `views/admin/403.ejs`) serta respons HTML fallback error/CSRF untuk jalur `/admin*` wajib menyertakan `<meta name="robots" content="noindex, nofollow">`.
- Middleware SEO otomatis menetapkan `res.locals.seo.robots = 'noindex, nofollow'` untuk seluruh path `/admin` dan `/admin/*` tanpa menyuntikkan skema JSON-LD publik.
- Aturan `Disallow: /admin` dan `Disallow: /admin/*` pada `/robots.txt` tetap dipertahankan, `/sitemap.xml` bebas rute `/admin`, dan seluruh template publik tidak memuat tautan `/admin`.

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
| **Penyeragaman Identitas Meta Title `PT Euodoo Plastic`** | Menyatukan konsistensi merek pada `<title>`, `og:site_name`, fallback error, dan `settings.company_name` tanpa mengubah perilaku custom `meta_title` produk/berita. | 2026-11-17 |
| **Proteksi Berlapis `X-Robots-Tag` + `Disallow: /admin` (FR-35)** | Menutup akses crawling (`robots.txt`) sekaligus menjamin seluruh respons `/admin/*` (termasuk error/CSRF/API/CSV) menolak pengindeksan mesin pencari. | 2026-11-17 |
