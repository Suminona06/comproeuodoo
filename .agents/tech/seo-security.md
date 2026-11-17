Status: ACTIVE | Terakhir diverifikasi: 2026-11-17 | Kode: controllers/public/seoController.js, middleware/seoMiddleware.js, utils/turnstileVerifier.js

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
Middleware dieksekusi pada setiap permintaan dan mengisi variabel `res.locals.seo` dengan atribut:
- `title` / fallback merek (`views/partials/head.ejs` & controller publik): Judul halaman digabungkan dengan `settings.company_name` (`PT Euodoo Plastic`); seluruh fallback default di `head.ejs` (`resolvedTitle`, `author`, `og:site_name`), `seoMiddleware.js` (`Organization.name` & `author`), controller publik, `errorHandler.js`, dan `csrfMiddleware.js` diseragamkan ke `PT Euodoo Plastic`.
- `metaDescription`: Deskripsi konten spesifik atau fallback ke pengaturan situs umum.
- `canonicalUrl`: URL kanonikal lengkap berbasis `process.env.APP_URL`.
- `alternateUrls`: Tautan dwibahasa eksplisit (`?lang=id`, `?lang=en`, dan `x-default`).
- `ogImage`: URL absolut gambar Open Graph pratinjau media sosial (fallback ke logo atau banner default).
- `robots`: Nilai direktif robots (`'index, follow'` secara default; otomatis menjadi `'noindex, nofollow'` bila `currentPath === '/admin' || currentPath.startsWith('/admin/')`).
- `jsonld`: String JSON-LD skema Schema.org yang disesuaikan dengan jenis halaman (Organization pada `/` saja, Product, Article); dilewati pada rute `/admin*`.

---

## 4. Generator Sitemap & Robots
1. **`sitemap.xml` (`utils/sitemapGenerator.js`):**
   - Mengambil seluruh rute statis publik (`/`, `/about`, `/products`, `/capabilities`, `/news`, `/contact`) tanpa URL `/admin`.
   - Melakukan query paralel ke `products (WHERE status = 'published' AND is_active = 1)` dan `posts (WHERE status = 'published')`.
   - Menghasilkan markup XML standar dengan `<loc>`, `<lastmod>`, `<changefreq>`, dan `<priority>`.
2. **`robots.txt`:**
   - Mengembalikan aturan crawling:
     ```
     User-agent: *
     Allow: /
     Disallow: /admin
     Disallow: /admin/*
     Disallow: /api/*
     Sitemap: <APP_URL>/sitemap.xml
     ```

---

## 5. Parameter Keamanan, Noindex Admin (`FR-35`), & Verifikasi Turnstile
- **HTTP Security Headers (Helmet):** Mengaktifkan `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, dan `Strict-Transport-Security` (HSTS pada produksi).
- **Header & Meta Noindex Rute Admin (`FR-35`):**
  - `app.js` memasang middleware `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` pada mount `/admin` **sebelum** `csrfProtection`, `loginLimiter`, `requireAuth`, `roleMiddleware`, `notFoundHandler`, dan `errorHandler`, sehingga berlaku pada seluruh status kode (`200`, `302`, `400`, `401`, `403`, `429`, `404`, `500`), HTML, JSON API, maupun ekspor CSV di `/admin` dan `/admin/*`.
  - Tag `<meta name="robots" content="noindex, nofollow">` wajib hadir pada `views/admin/login.ejs`, `views/partials/admin-header.ejs`, `views/admin/403.ejs`, serta HTML fallback di `csrfMiddleware.js`, `roleMiddleware.js`, dan `errorHandler.js`.
- **Verifikasi Cloudflare Turnstile (`utils/turnstileVerifier.js`):**
  - Mengirimkan token `cf-turnstile-response` dari formulir POST publik ke endpoint Cloudflare: `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
  - Menggunakan `TURNSTILE_SECRET_KEY` dari environment. Jika token tidak valid, request ditolak dengan pesan peringatan bot.
- **CSRF Token:** Token di-generate menggunakan `crypto.randomBytes(32)` dan diverifikasi pada seluruh rute mutasi state (`POST`, `PUT`, `DELETE`).
- **Rate Limiting:**
  - `loginLimiter`: Max 5 request per 15 menit untuk `/admin/login`.
  - `leadLimiter`: Max 10 request per 15 menit untuk `/contact` dan `/leads`.
