# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 7 Task (T-226 s/d T-232)
- **Total Task Selesai:** 225 Task (T-01 s/d T-225)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-233**.

---

## Task Aktif / Terbuka (Open Tasks)

### [x] T-226: [Bug Fix] Perbaikan Breadcrumb Detail Berita & Reset List Style
- **Modul:** News & Articles (Public Interface)
- **Deskripsi:** Memperbaiki tampilan breadcrumb pada halaman `/news/:slug` agar tidak muncul sebagai daftar bernomor tegak dan pemisah slash tidak dirender sebagai `<li>` tersendiri. Mengimplementasikan `<nav aria-label="Breadcrumb">` dengan `<ol class="nwd-breadcrumb">`, reset style CSS lengkap, pemisah chevron via pseudo-element CSS (`::after`), teks item terakhir berekor elipsis satu baris jika panjang (`aria-current="page"`), sejajar kolom artikel.
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** -
- **Tanggal:** 2026-10-27
- **Estimasi:** 1 jam
- **File yang diubah:** `views/public/news-detail.ejs`, `public/css/components.css`

---

### [x] T-227: [Bug Fix] Penanganan Gambar Pecah & Fallback Placeholder Kartu Artikel
- **Modul:** News & Articles (Public Interface)
- **Deskripsi:** Mengatasi bug gambar pecah pada kartu publikasi terkait dan kartu listing berita ketika file thumbnail fisik tidak ditemukan di server atau field `cover_image` bernilai `null` di database. Menerapkan sistem placeholder netral berbasis token tanpa error 404, tanpa inline handler `onerror`, dan tanpa layout shift (CLS = 0).
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** -
- **Tanggal:** 2026-10-27
- **Estimasi:** 1 jam
- **File yang diubah:** `views/public/news-detail.ejs`, `views/public/news.ejs`, `public/css/components.css`

---

### [x] T-228: [Spek B.1] Restrukturisasi Layout Halaman Detail Berita Identik G2
- **Modul:** News & Articles (Public Interface)
- **Deskripsi:** Menyusun ulang markup dan tata letak halaman detail berita `/news/:slug` mengikuti hierarki editorial Chandra Asri (G2): Breadcrumb -> Gambar Sampul Utama Rounded selebar kolom artikel -> Tanggal Publikasi Abu-abu -> H1 Judul Artikel -> Atribusi "Oleh Redaksi PT Euodoo" / "By PT Euodoo Editorial Team" -> Isi Artikel Editorial Polos (tanpa kartu pembungkus, tanpa border/shadow) -> Garis Pemisah -> Baris "Bagikan:" dengan 4 tombol ikon sirkular token hijau (WhatsApp, Facebook, X, Salin Tautan) -> Seksi "Baca Berita Lainnya" berlatar abu muda token (`var(--bg-subtle)`). Menghapus seluruh elemen G1 yang tidak ada di G2 dari tampilan publik.
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-226
- **Tanggal:** 2026-10-27
- **Estimasi:** 2 jam
- **File yang diubah:** `views/public/news-detail.ejs`, `public/css/components.css`, `locales/id.json`, `locales/en.json`

---

### [x] T-229: [Spek B.2] Standarisasi Komponen Kartu Berita Bersama Identik G4
- **Modul:** News & Articles (Public Interface)
- **Deskripsi:** Membangun komponen kartu berita tunggal bersama (`.nwl-card` / `.nwd-card`) yang digunakan secara konsisten pada grid listing `/news` dan seksi "Baca Berita Lainnya" pada `/news/:slug`. Mengikuti visual G4: media gambar rasio 16:9 sudut membulat (`var(--r-xl)`), tanggal kecil abu-abu, judul tebal maksimal 3 baris (line-clamp 3), dan tautan aksi "Baca Selengkapnya" / "Read More" hijau brand `var(--color-primary)`. Target sentuh minimal 44x44px. Grid responsif: 3 kolom desktop, 2 kolom tablet, 1 kolom mobile.
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-227
- **Tanggal:** 2026-10-27
- **Estimasi:** 1.5 jam
- **File yang diubah:** `views/public/news.ejs`, `views/public/news-detail.ejs`, `public/css/components.css`, `tests/test-modul12-public.js`

---

### [x] T-230: [Spek B.3 / FR-24] Headline Slider Halaman Listing Berita Desktop G3 & Mobile Reference
- **Modul:** News & Articles (Public Interface)
- **Deskripsi:** Mengimplementasikan seksi headline artikel utama pada `/news` mengacu pada G3 di desktop (asimetris 2 kolom, tinggi maks ~setengah viewport) dan referensi gambar mobile Azis pada layar ponsel (<768px: judul "News", gambar 16:9 rounded, tanggal, judul, ringkasan, link aksi, indikator garis di tengah, tombol panah sirkular di tengah bawah). Controller mengambil hingga 5 artikel headline aktif (`is_headline = 1`). Autoplay per 6 detik dengan pause saat hover/fokus, mati saat `prefers-reduced-motion`. Navigasi keyboard dan touch swipe.
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** -
- **Tanggal:** 2026-10-27
- **Estimasi:** 2 jam
- **File yang diubah:** `controllers/public/postController.js`, `views/public/news.ejs`, `public/css/components.css`, `public/js/news-slider.js`

---

### [x] T-231: [Spek B.4 / FR-25] Filter Tipe Tab G4, Kategori, & Pencarian Berbasis Fetch API Tanpa Reload Halaman
- **Modul:** News & Articles (Public Interface)
- **Deskripsi:** Mengubah gaya tab filter tipe menjadi format underline hijau aktif mengacu pada G4. Mengimplementasikan penyaringan artikel, kategori, dan pencarian menggunakan `fetch()` API ke endpoint data berita di controller tanpa me-reload halaman. Sinkronisasi URL dua arah via History API (`window.history.pushState`), fallback tautan reguler untuk non-JS/SEO crawler, membersihkan dependensi htmx pada halaman news, validasi parameter whitelist di server, dan UI Empty State rapi berbasis token.
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-229
- **Tanggal:** 2026-10-27
- **Estimasi:** 2.5 jam
- **File yang diubah:** `controllers/public/postController.js`, `views/public/news.ejs`, `public/css/components.css`, `public/js/news-filter.js`

---

### [ ] T-232: [Verifikasi & UI Polish] Audit Responsif, Aksesibilitas, dan Regresi Publik
- **Modul:** News & Articles (Public Interface)
- **Deskripsi:** Melakukan audit komprehensif pada breakpoint 320px, 375px, 480px, 768px, 1024px, dan 1440px. Memastikan kepatuhan WCAG AA, target sentuh minimal 44px, tidak ada komentar pada kode frontend yang dibuat/diubah, tidak ada broken image, homepage dan halaman produk tetap utuh tidak mengalami regresi, serta seluruh suite pengujian otomatis (`test-modul12-public.js`) lulus 100%.
- **Prioritas:** High
- **Status:** Todo
- **Dependensi:** T-226, T-227, T-228, T-229, T-230, T-231
- **Tanggal:** 2026-10-27
- **Estimasi:** 1.5 jam
- **File yang diubah:** Seluruh file di atas & `tests/test-modul12-public.js`
