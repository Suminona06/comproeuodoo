Status: ACTIVE | Terakhir diverifikasi: 2026-11-13 | Kode: controllers/public/postController.js, views/public/news.ejs, views/public/news-detail.ejs, views/admin/posts/edit.ejs

# PRD: Modul Berita & Publikasi (News & Articles)

## 1. Ringkasan & Ruang Lingkup
Modul Berita mengelola publikasi konten editorial perusahaan (berita terkini, siaran pers resmi, artikel blog material plastik mudah terurai) pada portal `/news` dan CMS `/admin/posts`. Spesifikasi halaman detail artikel (`/news/:slug`) berada pada sub-modul [prd/news-detail.md](news-detail.md).

---

## 2. Functional Requirements

### FR-12: Tampilan Halaman Portal Berita Publik (`/news`)
- Sistem merender portal berita di `/news` dengan dua `<section>` mandiri berlatar selang-seling di bawah `.page-hero` (`FR-26`):
  1. **Section Headline (`.nwl-sec-headline`, `FR-24`, `FR-29`):** Berlatar `var(--bg-soft-green)`, menampilkan judul dinamis sesuai jenis artikel slide aktif (`berita`, `pers`, `blog`) dan Headline Carousel Slider interaktif.
  2. **Section Direktori Artikel (`.nwl-sec-directory`, `FR-25`, `FR-27`, `FR-28`):** Berlatar `var(--bg-subtle)` dengan gradasi transisi tepi halus (`48px` mobile, `80px` desktop) dari Section Headline, memuat Tab Navigasi Tipe Publikasi, Baris Pill Kategori Geser Horizontal di Mobile, Form Pencarian Artikel, Grid Kartu Berita Bersama (`limit = 9` per halaman), serta Komponen Paginasi Bersama (`.pgn-bar--public`).
- Teks empty state dan reset pada `/news` menggunakan `t('news.empty_desc')` dan `t('news.empty_reset')`.
- Untuk spesifikasi lengkap tampilan detail artikel (`/news/:slug`), tombol bagikan, serta SweetAlert2 Toast salin tautan (`FR-30 [PENDING T-326]`), lihat [prd/news-detail.md](news-detail.md).

### FR-13: Pengelolaan Artikel di CMS (CRUD)
- Admin dan Editor dapat membuat, membaca, mengedit, dan menghapus artikel di menu `/admin/posts`.
- Status artikel: `draft` (tersimpan belum publik), `published` (aktif tayang), `archived` (diarsipkan dari publik).
- Rich Text Editor TinyMCE: editor visual self-hosted dengan toolbar pemformatan lengkap, embedding tabel, kutipan, dan unggah gambar di dalam teks.
- Pengunggahan gambar sampul mandiri dengan kompresi WebP otomatis.
- **Custom Slug & Redirect 301 Otomatis:** Admin dapat menyesuaikan URL slug artikel. Perubahan slug artikel `published` otomatis dicatat ke tabel `slug_redirects` untuk menjalankan HTTP 301 Permanent Redirect dari slug lama ke baru.

### FR-24 & FR-29: Headline Slider & Judul Dinamis Mengikuti Slide Aktif
- Komposisi asimetris 2 kolom di desktop (`1440x900`, tinggi maksimal ~420-450px: gambar 16:9 `var(--r-2xl)` di kiri, tanggal, judul tebal, ringkasan 2-3 baris, tautan "Baca Selengkapnya", indikator garis kiri bawah, panah sirkular kanan bawah) dan tumpukan vertikal terpusat di mobile (`<768px`).
- **Perilaku Data & Judul Dinamis per Slide (`FR-29`):**
  - Slider selalu menampilkan artikel `published` dengan `is_headline = 1` dan tidak terpengaruh filter direktori di bawahnya.
  - `.nwl-headline-sec-title` dan `aria-label` `#nwlHeadlineSec` menampilkan salah satu label jenis sesuai atribut `type` pada **slide yang sedang aktif** (tidak pernah `"Semua Publikasi"`): `berita` (**"Berita"** / **"News"**), `pers` (**"Siaran Pers"** / **"Press Releases"**), `blog` (**"Blog"** / **"Blog"**).
  - Saat SSR awal, menampilkan jenis `headlinePosts[0].type`; saat slide berpindah (panah, indikator garis, swipe sentuh, atau autoplay 6 detik), judul langsung ikut berubah.
  - 1 headline: statis tanpa kontrol; > 1 headline: autoplay 6 detik, pause saat hover/fokus keyboard, mati saat `prefers-reduced-motion` aktif.

### FR-25, FR-27, & FR-28: Filter Fetch API, Kategori Geser Mobile, & Paginasi Bersama
- **Tab Tipe & Filter Fetch API (`FR-25`):** Tab navigasi tipe konten bergaya G4 dengan garis bawah aktif hijau token (`var(--color-primary)`). Pergantian tipe konten, kategori, pencarian, dan halaman mengeksekusi `fetch()` ke `/news` tanpa reload (reset ke halaman 1 saat filter/cari berubah), menyinkronkan URL via `window.history.pushState` & `popstate`, mempertahankan hyperlink SSR nyata untuk SEO, serta validasi whitelist ketat di server.
- **Baris Pill Kategori Geser Horizontal di Mobile (`FR-27`, `.nwl-cat-pills`):** Pada viewport `< 768px`, ditampilkan dalam 1 baris geser horizontal (`overflow-x: auto`, `flex-wrap: nowrap`, `scroll-snap-type: x proximity`, `scrollbar-width: none`) dengan target sentuh minimal `44x44px`, fokus keyboard jelas, dan auto-scroll pill aktif (`scrollIntoView`). `.nwl-search-form` berada di bawah baris pill selebar 100%.
- **Paginasi Bersama Publik (`FR-28`, `.pgn-bar--public`):** Komponen `views/partials/pagination.ejs` (`limit = 9`), menyatu langsung dengan latar section tanpa card luar, selalu tampil selama `totalPosts > 0` (tombol `disabled` bila `totalPages === 1`). Desktop (`>= 768px`) menampilkan `«`, `‹`, deret nomor + `...`, `›`, `»`; Mobile (`< 768px`) menampilkan 4 tombol ikon `>= 44x44px` mengapit indikator `currentPage / totalPages`. Atribut `aria-label` memakai `t('pagination.*')` dan halaman aktif `aria-current="page"`.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Pemecahan 2 Section Berlatar `--bg-soft-green` & `--bg-subtle`** | Memisahkan secara visual area Headline utama dan Direktori pencarian dengan transisi gradasi halus tanpa menyentuh Homepage. | 2026-11-10 |
| **Judul Headline Mengikuti Tipe Artikel pada Slide Aktif** | Menjaga slider tetap menayangkan seluruh berita utama (`is_headline = 1`) sembari menampilkan label jenis akurat untuk slide aktif. | 2026-11-10 |
| **Filter Kategori 1 Baris Geser & Unifikasi Paginasi `.pgn-*`** | Menghemat ruang vertikal mobile dan menyatukan komponen paginasi publik/admin dengan tampilan ringkas mobile (`« ‹ 1/2 › »`). | 2026-11-10 |
| **Integrasi Editor TinyMCE Self-Hosted** | Menghindari ketergantungan API key cloud berbayar dan menjaga stabilitas pemformatan artikel teknis. | 2026-10-06 |
| **Sistem Redirect 301 Otomatis pada Perubahan Slug** | Mencegah broken link (404) dan menjaga integritas backlink mesin pencari saat editor mengubah slug artikel. | 2026-10-06 |
| **3 Tab Kategori Berita Terstruktur** | Memisahkan komunikasi korporat resmi (`pers`) dari berita utama dan artikel edukatif (`blog`). | 2026-10-09 |
| **Komponen Kartu Bersama Identik G4** | Menjamin konsistensi visual 100% antara listing berita dan artikel terkait dengan rasio 16:9 dan line-clamp 3 baris. | 2026-10-27 |
| **Headline Slider Desktop & Mobile Reference** | Membatasi tinggi desktop proporsional dan menyajikan kontrol terpusat ramah sentuh pada layar mobile. | 2026-10-27 |
| **Filter In-Page Berbasis Fetch API** | Menghilangkan reload halaman saat menyaring berita tanpa library eksternal baru sekaligus menjaga SEO lewat fallback SSR. | 2026-10-27 |
