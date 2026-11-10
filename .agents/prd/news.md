Status: ACTIVE | Terakhir diverifikasi: 2026-10-28 | Kode: controllers/public/postController.js, views/public/news.ejs, views/public/news-detail.ejs, views/admin/posts/edit.ejs

# PRD: Modul Berita & Publikasi (News & Articles)

## 1. Ringkasan & Ruang Lingkup
Modul Berita mengelola publikasi konten editorial perusahaan yang mencakup berita terkini, siaran pers resmi, pembaruan kepatuhan regulasi lingkungan, dan artikel edukasi material plastik mudah terurai.

---

## 2. Functional Requirements

### FR-12: Tampilan Halaman News Publik & Detail Artikel
- Sistem merender portal berita di `/news` dan detail artikel di `/news/:slug`.
- Area konten `/news` di bawah `.page-hero` dipisahkan menjadi dua `<section>` mandiri dengan latar selang-seling (`FR-26`) `[PENDING T-307, T-309]`:
  1. **Section Headline (`.nwl-sec-headline`, `FR-24`, `FR-29`):** Berlatar `var(--bg-soft-green)`, menampilkan judul dinamis sesuai jenis artikel slide aktif (`berita`, `pers`, `blog`) dan Headline Carousel Slider interaktif.
  2. **Section Direktori Artikel (`.nwl-sec-directory`, `FR-25`, `FR-27`, `FR-28`):** Berlatar `var(--bg-subtle)` dengan gradasi transisi tepi halus (`48px` mobile, `80px` desktop) dari Section Headline, memuat Tab Navigasi Tipe Publikasi, Baris Pill Kategori Geser Horizontal di Mobile, Form Pencarian Artikel, Grid Kartu Berita Bersama (`limit = 9` per halaman), serta Komponen Paginasi Bersama (`.pgn-bar--public`).
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

### FR-24 & FR-29: Headline Slider & Judul Dinamis Mengikuti Slide Aktif `[PENDING T-310]`
- Seksi headline pada `/news` menggunakan komposisi asimetris 2 kolom di desktop (mengacu G3) dan tumpukan vertikal berpusat kontrol di mobile:
  - **Desktop (1440x900):** Ketinggian maksimal ~setengah viewport (~420-450px). Sisi kiri gambar rounded 16:9 ber-radius token (`var(--r-2xl)`), sisi kanan tanggal, judul headline tebal, ringkasan (2-3 baris), dan tautan "Baca Selengkapnya →". Indikator garis di kiri bawah dan tombol panah melingkar di kanan bawah.
  - **Mobile (<768px):** Judul dinamis `.nwl-headline-sec-title`, gambar rounded 16:9, tanggal terbit, judul headline, ringkasan, tautan "Baca Selengkapnya →", indikator garis horizontal di posisi tengah, dan tombol panah sirkular di tengah bawah.
- **Perilaku Data & Judul Dinamis per Slide (`FR-29`) `[PENDING T-310]`:**
  - Slider headline selalu menampilkan artikel terpublikasi dengan `is_headline = 1` dan **tidak terpengaruh** oleh filter tab tipe, kategori, maupun pencarian pada direktori di bawahnya.
  - Judul `.nwl-headline-sec-title` (beserta `aria-label` pada `#nwlHeadlineSec`) menampilkan salah satu dari 3 jenis publikasi sesuai atribut `type` artikel pada **slide yang sedang tampil/aktif** (tidak pernah menampilkan `"Semua Publikasi"`):
    - `berita`: **"Berita"** (ID) / **"News"** (EN)
    - `pers`: **"Siaran Pers"** (ID) / **"Press Releases"** (EN)
    - `blog`: **"Blog"** (ID) / **"Blog"** (EN)
  - Saat halaman dimuat (SSR), `.nwl-headline-sec-title` menampilkan jenis dari slide pertama (`headlinePosts[0].type`). Setiap kali slide berganti (via tombol panah, indikator garis, swipe sentuh, atau autoplay 6 detik), judul `.nwl-headline-sec-title` otomatis berganti mengikuti `type` slide yang aktif.
  - Jika 1 headline: tampil statis tanpa kontrol navigasi dan tanpa indikator garis. Jika > 1 headline: autoplay bergulir setiap 6 detik, otomatis pause saat hover/fokus keyboard, mati saat `prefers-reduced-motion` aktif.

### FR-25, FR-27, & FR-28: Filter Fetch API, Kategori Geser Mobile, & Paginasi Bersama `[PENDING T-311, T-312]`
- **Tab Tipe & Filter Fetch API (`FR-25`):** Tab navigasi tipe konten bergaya G4 dengan garis bawah aktif hijau token (`var(--color-primary)`). Pergantian tipe konten, kategori topik, pencarian, dan halaman mengeksekusi `fetch()` ke `/news` tanpa reload halaman (mereset ke halaman 1 saat filter/pencarian berubah), menyinkronkan URL via `window.history.pushState` & `popstate`, menjaga canonical URL, menyediakan hyperlink SSR nyata untuk SEO, serta menerapkan validasi whitelist ketat di server.
- **Baris Pill Kategori Geser Horizontal di Mobile (`FR-27`, `.nwl-cat-pills`) `[PENDING T-311]`:** Pada viewport mobile (`< 768px`), `.nwl-cat-pills` ditampilkan dalam **satu baris horizontal yang digeser ke samping** (`overflow-x: auto`, `flex-wrap: nowrap`, `scroll-snap-type: x proximity`) sepola dengan `.nwl-tab-bar`, tanpa scrollbar kasar (`scrollbar-width: none`), dilengkapi petunjuk visual geser, target sentuh minimal `44x44px`, fokus keyboard jelas, serta otomatis menggulirkan pill aktif ke layar (`scrollIntoView`) saat halaman dimuat atau kategori dipilih. Form pencarian (`.nwl-search-form`) berada tepat di bawah baris pill dengan lebar 100%.
- **Paginasi Bersama Publik (`FR-28`, `.pgn-bar--public`) `[PENDING T-312]`:**
  - Menggunakan komponen bersama `views/partials/pagination.ejs` dengan batas `9` artikel per halaman (`limit = 9`). Bar paginasi **selalu ditampilkan** selama ada artikel (`totalPosts > 0`), termasuk saat `totalPages === 1` dengan tombol navigasi berstatus `disabled`.
  - **Desktop (`>= 768px`):** Menampilkan kontrol navigasi (`«`, `‹`), deret nomor halaman dengan elipsis (`...`), dan kontrol navigasi (`›`, `»`).
  - **Mobile (`< 768px`):** Nomor halaman disembunyikan; hanya menampilkan 4 tombol ikon persegi membulat (`[ « ]` Halaman Pertama, `[ ‹ ]` Halaman Sebelumnya, `[ › ]` Halaman Berikutnya, `[ » ]` Halaman Terakhir, ukuran minimal `44x44px`) yang mengapit indikator ringkas `1 / 2` (`currentPage / totalPages`) di tengah.
  - Seluruh atribut `aria-label` nav dan tombol terlokalisasi penuh dalam ID & EN (`t('pagination.*')`), serta halaman aktif menyandang `aria-current="page"`.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Pemecahan 2 Section Berlatar Selang-Seling `--bg-soft-green` & `--bg-subtle` `[PENDING T-307, T-309]`** | Memisahkan secara visual area Headline utama dan Direktori pencarian dengan transisi gradasi tepi halus tanpa menyentuh Homepage. | 2026-11-10 |
| **Judul Headline Mengikuti Tipe Artikel pada Slide Aktif `[PENDING T-310]`** | Menjaga slider headline tetap menayangkan seluruh berita utama (`is_headline = 1`) sembari menampilkan label jenis berita (`Berita`, `Siaran Pers`, `Blog`) yang akurat untuk slide yang sedang dilihat. | 2026-11-10 |
| **Filter Kategori 1 Baris Geser & Unifikasi Paginasi `.pgn-*` `[PENDING T-311, T-312]`** | Menghemat ruang vertikal di layar mobile serta menyatukan komponen paginasi publik dan admin dengan tampilan mobile ringkas (`« ‹ 1/2 › »`). | 2026-11-10 |
| **Integrasi Editor TinyMCE Self-Hosted** | Menghindari ketergantungan API key cloud berbayar dan menjamin stabilitas pemformatan artikel teknis. | 2026-10-06 |
| **Sistem Redirect 301 Otomatis pada Perubahan Slug** | Mencegah broken link (error 404) dan menjaga integritas backlink mesin pencari saat editor memperbaiki judul URL artikel. | 2026-10-06 |
| **3 Tab Kategori Berita Terstruktur** | Memisahkan komunikasi korporat resmi (press release) dari artikel edukatif industri untuk kenyamanan pembaca. | 2026-10-09 |
| **Detail Berita Identik G2** | Menghadirkan tampilan editorial yang bersih, lapang, dan profesional tanpa kartu pembungkus tebal yang membatasi konten. | 2026-10-27 |
| **Komponen Kartu Bersama Identik G4** | Menjamin konsistensi visual 100% antara listing berita dan seksi baca berita lainnya dengan rasio 16:9 dan line-clamp 3 baris. | 2026-10-27 |
| **Headline Slider Desktop & Mobile Reference** | Membatasi ketinggian desktop agar proporsional serta menyajikan layout mobile terpusat yang intuitif dan ramah gestur sentuh. | 2026-10-27 |
| **Filter In-Page Berbasis Fetch API** | Menghilangkan reload halaman saat menyaring berita tanpa dependensi library eksternal baru dengan tetap menjaga SEO rank lewat fallback SSR. | 2026-10-27 |
| **Tombol Bagikan Sirkular Monokrom Token Hijau** | Mempertahankan fungsionalitas share medsos populer dengan palet warna brand Euodoo tanpa menggunakan warna biru merek lain. | 2026-10-27 |
