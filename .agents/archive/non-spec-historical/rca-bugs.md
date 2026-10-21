# ARSIP: Analisis Akar Masalah (RCA) Bug Historis
**Sumber Asli:** `2-TECH-SPEC.md` (Bagian 6.1, 7.1, 16.0)  
**Tanggal Diarsipkan:** 2026-10-21  

---

## 1. RCA Bug Error CSRF 403 pada Form Multipart CRUD (Tech Spec 6.1)
- **Gejala:** Seluruh formulir CRUD dengan file upload (`multipart/form-data`) gagal dengan status HTTP 403 Forbidden ("Invalid CSRF token").
- **Akar Masalah:** Middleware CSRF (`csrfMiddleware.js`) dieksekusi sebelum middleware upload (`uploadMiddleware.js`). Akibatnya, `req.body._csrf` belum di-parse oleh parser multipart ketika middleware CSRF berjalan. Form capabilities bekerja sebelumnya karena query string `?_csrf=...` ditambahkan secara manual.
- **Solusi:** Memperbaiki urutan parsing atau membaca CSRF token dari header HTTP/query parameter, dan memastikan middleware upload mem-parse body sebelum verifikasi token pada form multipart.

---

## 2. RCA Bug Interaktivitas UI & Konflik Eksekusi Script (Tech Spec 7.1)
- **Gejala:** Interaktivitas drawer mobile, modal, dan dropdown tidak merespons di beberapa halaman admin dan publik.
- **Akar Masalah:** Duplikasi pemuatan library CDN eksternal dan race condition antara inisialisasi DOM `DOMContentLoaded` dengan skrip inline.
- **Solusi:** Menghilangkan dependensi CDN yang saling tumpang tindih, memusatkan script handler pada `public/js/main.js` dan `public/js/admin.js`, serta membungkus listener di event handler tunggal yang idempotent.

---

## 3. RCA URL Tombol Hero CTA Mengarah ke Kontak (Tech Spec 16.0 / T-182)
- **Gejala:** Klik tombol CTA hero banner mengarahkan pengunjung ke halaman `/contact` meskipun banner ditujukan untuk produk.
- **Akar Masalah:** Nilai default field `cta_url` di seed dan fallback controller diisi statis `/contact` tanpa opsi konfigurasi tombol sekunder.
- **Solusi:** Implementasi Dual CTA (migrasi `014_add_secondary_cta_to_banners.sql`) dengan kolom sekunder mandiri `cta_secondary_text_id`, `cta_secondary_text_en`, `cta_secondary_url` dan validasi URL aman.
