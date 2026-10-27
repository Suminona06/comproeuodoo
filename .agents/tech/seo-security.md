Status: ACTIVE | Terakhir diverifikasi: 2026-10-21 | Kode: controllers/public/seoController.js, middleware/seoMiddleware.js, utils/turnstileVerifier.js

# Tech Spec: Modul SEO & Keamanan (SEO & Security)

## 1. Arsitektur & Komponen
Modul ini mengelola visibilitas mesin pencari dan integritas keamanan platform melalui middleware injeksi metadata otomatis, generator sitemap/robots dinamis, serta lapisan pengaman Helmet, CSRF, dan Turnstile.

---

## 2. Rute & Controller

| Method | Path | Controller / Handler | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/robots.txt` | `seoController.robots` | - | Generator robots.txt dinamis |
| `GET` | `/sitemap.xml` | `seoController.sitemap` | - | Generator sitemap.xml dinamis |

---

## 3. Middleware SEO & Metadata Injeksi (`seoMiddleware.js`)
Middleware dieksekusi pada setiap permintaan rute publik dan mengisi variabel `res.locals.seo` dengan atribut:
- `title`: Judul halaman digabungkan dengan nama perusahaan (`PT Euodoo`).
- `metaDescription`: Deskripsi konten spesifik atau fallback ke pengaturan situs umum.
- `canonicalUrl`: URL kanonikal lengkap berbasis `process.env.APP_URL`.
- `alternateUrls`: Tautan dwibahasa eksplisit (`?lang=id`, `?lang=en`, dan `x-default`).
- `ogImage`: URL absolut gambar Open Graph pratinjau media sosial (fallback ke logo atau banner default).
- `robots`: Nilai direktif robots (`index, follow` secara default).
- `jsonld`: String JSON-LD skema Schema.org yang disesuaikan dengan jenis halaman (Organization, Product, Article).

---

## 4. Generator Sitemap & Robots
1. **`sitemap.xml` (`utils/sitemapGenerator.js`):**
   - Mengambil seluruh rute statis publik (`/`, `/about`, `/products`, `/capabilities`, `/news`, `/contact`).
   - Melakukan query paralel ke `products (WHERE status = 'published' AND is_active = 1)` dan `posts (WHERE status = 'published')`.
   - Menghasilkan markup XML standar dengan `<loc>`, `<lastmod>`, `<changefreq>`, dan `<priority>`.
2. **`robots.txt`:**
   - Mengembalikan aturan crawling:
     ```
     User-agent: *
     Allow: /
     Disallow: /admin/
     Disallow: /api/
     Sitemap: <APP_URL>/sitemap.xml
     ```

---

## 5. Parameter Keamanan & Verifikasi Turnstile
- **HTTP Security Headers (Helmet):** Mengaktifkan `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, dan `Strict-Transport-Security` (HSTS pada produksi).
- **Verifikasi Cloudflare Turnstile (`utils/turnstileVerifier.js`):**
  - Mengirimkan token `cf-turnstile-response` dari formulir POST publik ke endpoint Cloudflare: `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
  - Menggunakan `TURNSTILE_SECRET_KEY` dari environment. Jika token tidak valid, request ditolak dengan pesan peringatan bot.
- **CSRF Token:** Token di-generate menggunakan `crypto.randomBytes(32)` dan diverifikasi pada seluruh rute mutasi state (`POST`, `PUT`, `DELETE`).
- **Rate Limiting:**
  - `loginLimiter`: Max 5 request per 15 menit untuk `/admin/login`.
  - `leadLimiter`: Max 10 request per 15 menit untuk `/contact` dan `/leads`.
