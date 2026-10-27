Status: ACTIVE | Terakhir diverifikasi: 2026-10-21 | Kode: controllers/public/postController.js, views/public/news.ejs, views/admin/posts/edit.ejs

# PRD: Modul Berita & Publikasi (News & Articles)

## 1. Ringkasan & Ruang Lingkup
Modul Berita mengelola publikasi konten editorial perusahaan yang mencakup berita terkini, siaran pers resmi, pembaruan kepatuhan regulasi lingkungan, dan artikel edukasi material plastik mudah terurai.

---

## 2. Functional Requirements

### FR-12: Tampilan Halaman News Publik
- Sistem merender portal berita di `/news` dan detail artikel di `/news/:slug`.
- Komponen halaman portal berita:
  1. Headline Carousel Slider: menampilkan hingga 3 artikel utama berpictorial besar.
  2. Sistem Tab Kategori: membagi artikel ke dalam 3 segmen (Berita Perusahaan, Siaran Pers, Edukasi & Blog).
  3. Grid Artikel Terkini: menampilkan kartu artikel dengan gambar sampul, tag kategori, judul, ringkasan, tanggal publikasi, dan estimasi waktu baca.
  4. Pencarian Artikel: input pencarian berbasis judul dan isi konten.
- Halaman detail artikel `/news/:slug`:
  1. Breadcrumb navigasi, judul artikel, meta informasi penulis/tanggal.
  2. Gambar sampul beresolusi tinggi dengan caption legal.
  3. Konten artikel berbasis rich text HTML yang disanitasi.
  4. Seksi Artikel Terkait (Related Posts) berdasarkan kesamaan kategori.

### FR-13: Pengelolaan Artikel di CMS (CRUD)
- Admin dan Editor dapat membuat, membaca, mengedit, dan menghapus artikel di menu `/admin/posts`.
- Status artikel: `draft` (tersimpan belum publik), `published` (aktif tayang), `archived` (diarsipkan dari publik).
- Rich Text Editor TinyMCE: integrasi editor visual self-hosted dengan toolbar pemformatan lengkap, embedding tabel, kutipan, dan pengunggahan gambar langsung di dalam teks.
- Pengunggahan gambar sampul mandiri dengan kompresi WebP otomatis.
- **Custom Slug & Redirect 301 Otomatis:** Admin dapat menyesuaikan URL slug artikel. Jika slug yang sudah terpublikasi diubah, sistem secara otomatis mencatat riwayat ke tabel `slug_redirects` dan menjalankan HTTP 301 Permanent Redirect dari slug lama ke slug baru untuk menjaga SEO rank.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Integrasi Editor TinyMCE Self-Hosted** | Menghindari ketergantungan API key cloud berbayar dan menjamin stabilitas pemformatan artikel teknis. | 2026-10-06 |
| **Sistem Redirect 301 Otomatis pada Perubahan Slug** | Mencegah broken link (error 404) dan menjaga integritas backlink mesin pencari saat editor memperbaiki judul URL artikel. | 2026-10-06 |
| **3 Tab Kategori Berita Terstruktur** | Memisahkan komunikasi korporat resmi (press release) dari artikel edukatif industri untuk kenyamanan pembaca. | 2026-10-09 |
