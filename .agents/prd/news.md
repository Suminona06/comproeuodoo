Status: ACTIVE | Terakhir diverifikasi: 2026-10-28 | Kode: controllers/public/postController.js, views/public/news.ejs, views/public/news-detail.ejs, views/admin/posts/edit.ejs

# PRD: Modul Berita & Publikasi (News & Articles)

## 1. Ringkasan & Ruang Lingkup
Modul Berita mengelola publikasi konten editorial perusahaan yang mencakup berita terkini, siaran pers resmi, pembaruan kepatuhan regulasi lingkungan, dan artikel edukasi material plastik mudah terurai.

---

## 2. Functional Requirements

### FR-12: Tampilan Halaman News Publik & Detail Artikel
- Sistem merender portal berita di `/news` dan detail artikel di `/news/:slug`.
- Komponen halaman portal berita:
  1. Headline Carousel Slider (FR-24): menampilkan artikel utama berpictorial proporsional dengan slider interaktif.
  2. Tab Navigasi Tipe Publikasi (FR-25): membagi artikel ke dalam segmen (Semua, Berita Perusahaan, Siaran Pers, Artikel & Blog) dengan gaya garis bawah aktif hijau.
  3. Filter Topik Kategori: baris pill filter topik artikel yang responsif.
  4. Komponen Kartu Berita Bersama (Shared News Card): rasio tetap 16:9 sudut membulat, tanggal kecil abu-abu, judul tebal maksimal 3 baris, dan tautan aksi "Baca Selengkapnya".
  5. Pencarian Artikel: input pencarian berbasis judul dan isi konten tanpa reload halaman.
- Halaman detail artikel `/news/:slug`:
  1. Breadcrumb unboxed mandiri sejajar kolom artikel dengan pemisah chevron CSS (Home > News > Judul).
  2. Gambar sampul utama sudut membulat token selebar kolom artikel berasio tetap tanpa kotak pembungkus gelap.
  3. Tanggal publikasi abu-abu netral.
  4. H1 Judul artikel tebal kontras tinggi.
  5. Atribusi teks redaksi bersih: "Oleh Redaksi PT Euodoo" (ID) / "By PT Euodoo Editorial Team" (EN) tanpa avatar dan tanpa divisi.
  6. Isi konten artikel HTML TinyMCE langsung di atas kanvas halaman tanpa kartu pembungkus (tanpa border, tanpa shadow).
  7. Garis pemisah horizontal halus.
  8. Seksi bagikan dengan label "Bagikan:" / "Share :" dan 4 tombol aksi sirkular (WhatsApp, Facebook, X, Salin Tautan) berbasis token hijau Euodoo.
  9. Seksi "Baca Berita Lainnya" berkontainer lebih lebar dengan latar abu-abu muda token (`var(--bg-subtle)`), menampilkan maksimal 3 kartu artikel terbaru selain artikel yang sedang dibaca (disembunyikan bila kosong).
  10. Seluruh elemen G1 yang tidak ada di G2 dihapus dari tampilan publik detail artikel.

### FR-13: Pengelolaan Artikel di CMS (CRUD)
- Admin dan Editor dapat membuat, membaca, mengedit, dan menghapus artikel di menu `/admin/posts`.
- Status artikel: `draft` (tersimpan belum publik), `published` (aktif tayang), `archived` (diarsipkan dari publik).
- Rich Text Editor TinyMCE: integrasi editor visual self-hosted dengan toolbar pemformatan lengkap, embedding tabel, kutipan, dan pengunggahan gambar langsung di dalam teks.
- Pengunggahan gambar sampul mandiri dengan kompresi WebP otomatis.
- **Custom Slug & Redirect 301 Otomatis:** Admin dapat menyesuaikan URL slug artikel. Jika slug yang sudah terpublikasi diubah, sistem secara otomatis mencatat riwayat ke tabel `slug_redirects` dan menjalankan HTTP 301 Permanent Redirect dari slug lama ke slug baru untuk menjaga SEO rank.

### FR-24: Headline Slider Halaman Listing Berita (Mengacu G3 & Mobile Reference)
- Seksi headline pada `/news` menggunakan komposisi asimetris 2 kolom di desktop (mengacu G3) dan tumpukan vertikal berpusat kontrol di mobile:
  - **Desktop (1440x900):** Ketinggian maksimal ~setengah viewport (~420-450px). Sisi kiri gambar rounded 16:9 ber-radius token (`var(--r-2xl)`), sisi kanan tanggal, judul headline tebal, ringkasan (2-3 baris), dan tautan "Baca Selengkapnya →". Indikator garis di kiri bawah dan tombol panah melingkar di kanan bawah.
  - **Mobile (<768px):** Judul "News", gambar rounded 16:9, tanggal terbit, judul headline, ringkasan, tautan "Baca Selengkapnya →", indikator garis horizontal di posisi tengah, dan tombol panah sirkular di tengah bawah.
- Perilaku data headline:
  - Mengambil artikel terpublikasi dengan `is_headline = 1` dari database.
  - Jika 1 headline: Tampil statis tanpa kontrol navigasi dan tanpa indikator garis.
  - Jika > 1 headline: Slider autoplay bergulir setiap 6 detik, otomatis pause saat hover/fokus keyboard, mati saat `prefers-reduced-motion` aktif.
  - Navigasi manual via tombol panah, indikator garis, keyboard (ArrowLeft/Right), dan swipe layar sentuh.

### FR-25: Sistem Filter Tipe, Kategori, & Pencarian Berbasis Fetch API
- Tab navigasi tipe konten bergaya G4 dengan garis bawah aktif hijau token (`var(--color-primary)`).
- Interaksi pergantian tipe konten, kategori topik, dan input pencarian mengeksekusi request `fetch()` ke endpoint `/news` di latar belakang tanpa reload halaman.
- Konten grid artikel dan paginasi diperbarui secara dinamis di sisi klien.
- Sinkronisasi URL otomatis via History API (`window.history.pushState`) menjaga query string (`?type=...&category=...&search=...&page=...`) agar tautan tetap shareable dan tombol Back/Forward browser berfungsi semestinya.
- Fallback SSR: Tautan hyperlink nyata tetap disediakan di markup HTML untuk aksesibilitas dan mesin perayap (SEO crawler).
- Validasi whitelist ketat di server terhadap seluruh parameter query yang diterima.
- Empty State: Pesan informatif berbasis token bersih jika tidak ada artikel yang cocok, dilengkapi tombol reset cepat.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Integrasi Editor TinyMCE Self-Hosted** | Menghindari ketergantungan API key cloud berbayar dan menjamin stabilitas pemformatan artikel teknis. | 2026-10-06 |
| **Sistem Redirect 301 Otomatis pada Perubahan Slug** | Mencegah broken link (error 404) dan menjaga integritas backlink mesin pencari saat editor memperbaiki judul URL artikel. | 2026-10-06 |
| **3 Tab Kategori Berita Terstruktur** | Memisahkan komunikasi korporat resmi (press release) dari artikel edukatif industri untuk kenyamanan pembaca. | 2026-10-09 |
| **Detail Berita Identik G2** | Menghadirkan tampilan editorial yang bersih, lapang, dan profesional tanpa kartu pembungkus tebal yang membatasi konten. | 2026-10-27 |
| **Komponen Kartu Bersama Identik G4** | Menjamin konsistensi visual 100% antara listing berita dan seksi baca berita lainnya dengan rasio 16:9 dan line-clamp 3 baris. | 2026-10-27 |
| **Headline Slider Desktop & Mobile Reference** | Membatasi ketinggian desktop agar proporsional serta menyajikan layout mobile terpusat yang intuitif dan ramah gestur sentuh. | 2026-10-27 |
| **Filter In-Page Berbasis Fetch API** | Menghilangkan reload halaman saat menyaring berita tanpa dependensi library eksternal baru dengan tetap menjaga SEO rank lewat fallback SSR. | 2026-10-27 |
| **Tombol Bagikan Sirkular Monokrom Token Hijau** | Mempertahankan fungsionalitas share medsos populer dengan palet warna brand Euodoo tanpa menggunakan warna biru merek lain. | 2026-10-27 |
