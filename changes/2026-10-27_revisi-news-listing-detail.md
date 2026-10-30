# Proposal Perubahan: Revisi Halaman Listing & Detail Berita PT Euodoo

**Tanggal Pengajuan:** 2026-10-27  
**Status Tahap:** TAHAP 2: APPROVED (Keputusan Terkunci oleh Azis, Menunggu Perintah Tahap 3: MERGE KE SPEC)  
**Dokumen Terdampak:** `prd/news.md`, `tech/news.md`  
**Penomoran Task Resmi:** `T-226` s/d `T-232` (Melanjutkan urutan aktif `3-TASKS.md`)  
**Skill Acuan:** `ponytail` (Lazy Senior Dev Mode) + `antislop-code` (Clean Comment Hygiene & Zero Frontend Comments)  

---

## 1. Konteks

Halaman portal berita (`/news`) dan detail berita (`/news/:slug`) memerlukan perbaikan bug tampilan visual (breadcrumb yang tampil sebagai daftar bernomor tegak dan gambar kartu artikel terkait yang pecah) serta penataan ulang tata letak dan interaksi mengikuti referensi editorial Chandra Asri (G2, G3, G4, dan referensi mobile headline). Seluruh penyegaran visual diwajibkan menggunakan token desain hijau signature PT Euodoo tanpa warna biru, mempertahankan performa tanpa reload halaman menggunakan `fetch()` API ringan, serta mematuhi aturan baku isolasi class (`.nwl-*` dan `.nwd-*`) tanpa menyentuh homepage yang telah dibekukan.

---

## 2. Keputusan Terkunci Azis (Tahap 2: APPROVE)

Seluruh 5 keputusan terbuka telah dijawab dan dikunci secara definitif oleh Azis pada 2026-10-27:

1. **Mekanisme Filter (Pertanyaan 1): Opsi C (Pake `fetch`).**
   - Interaksi pergantian tipe konten, pemilihan kategori, dan pencarian artikel menggunakan `fetch()` API ringan di latar belakang ke endpoint data publik berita.
   - Konten grid artikel diperbarui secara dinamis tanpa me-reload halaman.
   - Sinkronisasi URL otomatis menggunakan History API (`window.history.pushState`), menjaga query string (`?type=...&category=...&search=...&page=...`), sehingga tautan tetap shareable dan tombol navigasi browser (*Back/Forward*) bekerja normal.
   - Fallback SSR: Tautan hyperlink nyata tetap tersedia di markup HTML untuk memastikan SEO crawler dan pengguna tanpa JavaScript tetap dapat mengakses seluruh konten berita.
2. **Elemen G1 pada Detail Berita (Pertanyaan 2): Opsi A.**
   - Seluruh elemen G1 yang tidak ada di G2 dihapus dari antarmuka detail berita publik: badge kategori/tipe di atas judul, subjudul/lead paragraph terpisah, estimasi waktu baca (*"2 min baca"*), avatar inisial bulat `"EU"` dan teks divisi, tombol *"Kembali ke Daftar Publikasi"*, tombol *"Konsultasi Kemitraan"*, serta kotak kartu pembungkus isi artikel.
   - Format detail berita 100% identik dengan hierarki G2. Data lead/excerpt dan kategori tetap tersimpan di database dan form CMS admin untuk kebutuhan ringkasan kartu listing, slider headline, dan SEO metadata.
3. **Perilaku Headline Slider (Pertanyaan 3): Opsi B.**
   - Autoplay terkendali: Slider berpindah otomatis setiap 6 detik dengan transisi halus.
   - Autoplay otomatis dijeda (*pause*) ketika kursor mouse berada di atas slider (*hover*) atau elemen slider menerima fokus keyboard.
   - Navigasi manual tetap tersedia penuh: tombol panah sirkular (`prev`/`next`), indikator garis, tombol panah keyboard (`ArrowLeft`/`ArrowRight`), dan gestur usap sentuh (*touch swipe*).
   - Animasi geser dinonaktifkan otomatis bila pengguna mengaktifkan preferensi `prefers-reduced-motion`.
4. **Varian Tombol Bagikan pada Detail Berita (Pertanyaan 4): Opsi A.**
   - Menyediakan 4 tombol aksi sirkular: WhatsApp, Facebook, X (Twitter), dan Salin Tautan.
   - Seluruh tombol mengadopsi gaya monokrom elegan berbasis token warna Euodoo (`var(--color-surface-container)`, saat hover menjadi `var(--color-primary)` dengan ikon putih), tanpa warna biru merek Chandra Asri.
5. **Layout Mobile Headline & Grid (Pertanyaan 5): Identik Referensi Gambar Mobile Azis.**
   - Layout mobile headline meniru persis struktur referensi gambar yang dilampirkan:
     - Judul seksi `"News"`.
     - Media visual gambar rounded dengan sudut membulat proporsional token (`var(--r-2xl)`).
     - Tanggal rilis abu-abu kecil (`var(--color-text-muted)`).
     - H1/H2 Judul headline tebal berjarak rapat dan elegan.
     - Ringkasan teks / excerpt (2-3 baris).
     - Tautan aksi `"Read more →"` / `"Baca Selengkapnya →"` berwarna hijau brand Euodoo.
     - Indikator garis horizontal di posisi tengah (*centered line indicators*): garis aktif hijau token (`var(--color-primary)`), garis inaktif abu-abu (`var(--color-border)`).
     - Tombol navigasi panah melingkar (`prev` dan `next`) berada di posisi tengah persis di bawah garis indikator dengan styling token hijau Euodoo.
   - Grid kartu artikel: 1 kolom di ponsel (<640px), 2 kolom di tablet (640-1023px), 3 kolom di desktop (>=1024px).
   - Rekomendasi terkait: Ditampilkan apa adanya jika < 3 artikel, dan disembunyikan sepenuhnya jika 0 artikel.

---

## 3. Delta Spesifikasi

### A. Delta `prd/news.md`

#### Perubahan FR-12: Tampilan Halaman News Publik & Detail Artikel
- **Kondisi Lama:**
  - Halaman portal berita menampilkan headline tunggal statis berukuran masif di desktop, tab kategori bergaya pill filter terpisah dengan reload tautan, dan grid artikel dengan estimasi waktu baca serta tag tipe.
  - Halaman detail artikel membungkus konten di dalam kartu putih tebal ber-shadow (`box-shadow`), menampilkan badge kategori ganda, lead/excerpt tebal, waktu baca, avatar inisial redaksi dengan teks divisi, tombol ganda "Kembali ke Daftar Publikasi" dan "Konsultasi Kemitraan", serta seksi kartu terkait yang terpisah dari palet latar netral.
- **Kondisi Baru:**
  - **Single Page Detail Berita Identik G2 (Urutan Struktural Atas ke Bawah):**
    1. *Breadcrumb unboxed:* Jalur navigasi satu baris sejajar kolom artikel dengan pemisah chevron CSS (`Beranda > Berita > [Judul Artikel]`).
    2. *Gambar Sampul Utama:* Gambar selebar kolom artikel dengan sudut membulat token (`var(--r-2xl)`), rasio aspek proporsional terkunci (bebas layout shift), tanpa kotak pembungkus gelap.
    3. *Tanggal Publikasi:* Teks tanggal berukuran kecil dengan warna netral teredam (`var(--color-text-muted)`).
    4. *H1 Judul Artikel:* Tipografi tegas dengan kontras tinggi (`var(--color-text-navy)`).
    5. *Atribusi Redaksi:* Teks atribusi editorial bersih: `"Oleh Redaksi PT Euodoo"` (ID) / `"By PT Euodoo Editorial Team"` (EN) tanpa avatar bulat dan tanpa sub-judul divisi.
    6. *Badan Konten Artikel:* Teks editorial format HTML polos langsung di atas latar kanvas halaman (tanpa pembungkus kartu, tanpa garis tepi/border, tanpa box shadow).
    7. *Garis Pemisah:* Garis horizontal halus (`1px solid var(--color-border)`).
    8. *Seksi Bagikan:* Label `"Bagikan:"` / `"Share :"` diikuti 4 tombol aksi sirkular (WhatsApp, Facebook, X, Salin Tautan) dengan palet monokrom/hijau token Euodoo.
    9. *Seksi "Baca Berita Lainnya":* Kontainer artikel rekomendasi yang lebih lebar dengan latar abu-abu muda token (`var(--bg-subtle)` / `var(--color-surface-container-low)`), memuat grid kartu berita terkait (maksimal 3 artikel terbaru, mengecualikan artikel yang sedang dibuka, disembunyikan otomatis bila kosong).
  - Seluruh elemen G1 yang tidak ada di G2 dihapus dari tampilan publik. Field database dan form CMS admin tidak diubah/dihapus.
  - **Komponen Kartu Berita Bersama Identik G4:**
    - Satu komponen terpadu untuk grid listing `/news` dan seksi "Baca Berita Lainnya" pada `/news/:slug`.
    - Komposisi kartu: Media gambar sudut membulat (`var(--r-xl)`) rasio tetap 16:9, teks tanggal kecil abu-abu, judul artikel tebal (line-clamp maksimal 3 baris), dan tautan aksi teks hijau `"Baca Selengkapnya"` / `"Read More"`.

---

#### Fitur Baru FR-24: Headline Slider Halaman Listing Berita (Mengacu G3 & Mobile Reference)
- Halaman utama berita (`/news`) menampilkan seksi artikel unggulan (headline) dengan tata letak asimetris 2 kolom di desktop (mengacu G3) dan tumpukan vertikal berpusat kontrol di mobile (mengacu gambar mobile Azis):
  - **Desktop (1440x900):** Ketinggian dibatasi maksimal ~setengah tinggi viewport (~420px - 450px). Sisi kiri media visual gambar ber-radius membulat (`var(--r-2xl)`), sisi kanan tanggal terbit, judul headline tebal, ringkasan/excerpt singkat (2-3 baris), dan tautan `"Baca Selengkapnya →"`. Indikator garis di kiri bawah dan tombol panah sirkular di kanan bawah.
  - **Mobile (<768px):** Judul seksi `"News"`, gambar rounded 16:9, tanggal terbit, judul headline, ringkasan teks, tautan `"Baca Selengkapnya →"`, indikator garis di tengah (*centered*), dan tombol navigasi panah sirkular berpusat di tengah bawah (*centered arrow buttons*).
- Perilaku data headline:
  - Menggunakan kolom database yang sudah tersedia (`is_headline = 1`).
  - Headline tunggal (=1): Tampil statis tanpa kontrol navigasi dan tanpa indikator garis.
  - Headline jamak (>1): Berfungsi sebagai slider autoplay terkendali (berpindah otomatis per 6 detik, jeda saat hover/fokus, mati saat `prefers-reduced-motion`).
  - Navigasi ramah keyboard (`Tab`, `Enter`, `Space`, panah kiri/kanan) dan gestur usap sentuh (*touch swipe*).

---

#### Fitur Baru FR-25: Sistem Filter Tipe, Kategori, & Pencarian Berbasis Fetch API Tanpa Reload Halaman
- Tab navigasi tipe konten bergaya G4 dengan garis bawah aktif berwarna hijau token (`border-bottom: 2px solid var(--color-primary)`).
- Filter topik kategori berbentuk deretan tombol pill halus yang responsif (dapat digulir horizontal pada layar kecil).
- Interaksi pergantian tipe konten, kategori topik, dan pencarian kata kunci mengeksekusi request `fetch()` ke endpoint data berita `/news` (dengan header `Accept: application/json` atau query `ajax=1`).
- Konten grid artikel dan paginasi diperbarui secara instan di sisi klien tanpa reload penuh halaman.
- Sinkronisasi URL dua arah via History API (`window.history.pushState`), menjaga query string (`?type=...&category=...&search=...&page=...`), sehingga tautan dapat dibagikan dan navigasi browser (*Back/Forward*) bekerja semestinya.
- Fallback SSR: Tautan hyperlink nyata tetap tersedia di markup HTML untuk memastikan mesin perayap (SEO crawler) dan pengguna tanpa JavaScript tetap dapat mengakses seluruh konten berita.
- Validasi parameter di server dengan whitelist ketat untuk mencegah query injection.
- UI State Responsif: Menampilkan pesan *Empty State* yang bersih berbasis token ketika tidak ada artikel yang cocok, dilengkapi tombol reset filter.

---

### B. Delta `tech/news.md`

#### Rute, Controller, & Endpoint JSON (`controllers/public/postController.js`)
- **Penyesuaian `postController.index`:**
  - Menghapus pembatasan `limit: 1` pada headline; mengambil hingga 5 artikel headline aktif (`status: 'published'` dan `is_headline: 1`) dan mengirimkan array `headlinePosts` ke view.
  - Mendukung request data asynchronous: Jika request menyertakan header `Accept: application/json` atau query `ajax=1`, controller merespons dengan payload JSON berisi daftar artikel terfilter, info paginasi, dan status aktif.
  - Jika request standar browser tiba, controller merender halaman penuh EJS (SSR) seperti biasa.
  - Melakukan validasi whitelist terhadap query parameter (`type`, `category`, `search`, `page`).
- **Penyesuaian `postController.detail`:**
  - Memperbarui query `recentPosts`: Mengambil 3 artikel terbaru dengan status `published`, mengecualikan artikel yang sedang dibuka (`id != post.id`), dan menangani fallback image secara aman tanpa memicu request 404.

#### Komponen & Token CSS Baru (Scoped Class Prefix)
- **Aturan Isolasi Class:**
  - Prefix scoped listing: `.nwl-*` (*News Web Listing*):
    - `.nwl-headline`: Kontainer seksi headline responsif.
    - `.nwl-headline-media`: Media visual gambar headline 16:9 ber-radius token (`var(--r-2xl)`).
    - `.nwl-headline-body`: Kolom teks headline (tanggal, judul, ringkasan, tautan).
    - `.nwl-headline-ctrls`: Baris indikator garis dan kontrol panah sirkular (beradaptasi responsif desktop vs mobile).
    - `.nwl-type-tabs` & `.nwl-type-tab`: Tab tipe navigasi dengan border bawah aktif hijau.
    - `.nwl-cat-scroll` & `.nwl-cat-pill`: Baris filter topik kategori.
    - `.nwl-card`: Komponen kartu berita standar bersama.
  - Prefix scoped detail: `.nwd-*` (*News Web Detail*):
    - `.nwd-breadcrumb`: Navigasi remah roti unboxed dengan reset `list-style: none` dan separator chevron CSS `::after`.
    - `.nwd-hero-media`: Kontainer gambar utama 16:9 / rasio tetap ber-radius token (`var(--r-2xl)`).
    - `.nwd-meta-date`: Tanggal publikasi abu-abu (`var(--color-text-muted)`).
    - `.nwd-title`: Judul utama H1 artikel.
    - `.nwd-author`: Atribusi editorial teks bersih.
    - `.nwd-prose`: Area tipografi isi artikel tanpa kotak pembungkus.
    - `.nwd-share` & `.nwd-share-btn`: Baris 4 tombol bagikan sirkular.
    - `.nwd-related-sec`: Seksi kontainer lebar berlatar abu-abu muda (`var(--bg-subtle)`).
- **Pemetaan Desain Token (Bebas Nilai Hex Hardcoded):**
  - Latar Publik: `var(--bg-base)` (#ffffff) dan `var(--bg-subtle)` (#f8fafc).
  - Warna Hijau Signature: `var(--color-primary)` (#00755a), `var(--color-primary-dark)` (#00573f), `var(--color-primary-hover)` (#009476), `var(--primary-subtle)` (#e6f7f2).
  - Teks & Netral: `var(--color-text-main)`, `var(--color-text-navy)`, `var(--color-text-muted)`, `var(--color-text-variant)`.
  - Garis Pembatas: `var(--color-border)` (#e2e8f0).
  - Sudut Membulat: `var(--r-lg)` (12px), `var(--r-xl)` (16px), `var(--r-2xl)` (20px), `var(--r-pill)` (9999px).
- **Integritas Halaman Luar:**
  - Class baru `.nwd-breadcrumb` berdiri mandiri sehingga tidak mengubah tampilan breadcrumb hero di halaman About, Contact, atau Products.
  - Homepage (`views/public/index.ejs`) tetap dibekukan dan tidak disentuh sama sekali.
  - Class kartu lama `.news-card-v2` dialiaskan bersama `.nwl-card` agar pengujian otomatis pada `tests/test-modul12-public.js` tetap lulus 100%.

---

## 4. Rencana Task Implementasi (T-226 s/d T-232)

---

### [T-226] [Bug Fix] Perbaikan Breadcrumb Detail Berita & Reset List Style
- **Deskripsi:** Memperbaiki tampilan breadcrumb pada halaman `/news/:slug` agar tidak muncul sebagai daftar bernomor tegak (*"1. Beranda 2. / 3. Publikasi & Berita 4. /"*) dan pemisah slash tidak dirender sebagai `<li>` tersendiri. Mengimplementasikan `<nav aria-label="Breadcrumb">` dengan `<ol class="nwd-breadcrumb">`, reset style CSS lengkap, pemisah chevron via pseudo-element CSS (`::after`), teks item terakhir berekor elipsis satu baris jika panjang (`aria-current="page"`), serta sejajar presisi dengan kolom artikel.
- **Akar Masalah (Verifikasi Kode):** Pada `views/public/news-detail.ejs` (baris 47-53), elemen `<ol class="breadcrumbs">` diletakkan di luar kontainer `.page-hero`. Pada `public/css/components.css` (baris 4362), gaya breadcrumb hanya dideklarasikan di bawah selektor `.page-hero .breadcrumbs`. Akibat ketiadaan aturan CSS untuk `.breadcrumbs` mandiri, browser menerapkan *user-agent stylesheet* default untuk `<ol>` (`list-style-type: decimal` dan tampilan bertumpuk vertikal), dan elemen pemisah `<li aria-hidden="true">/</li>` ikut dihitung sebagai item bernomor tersendiri.
- **Acceptance Criteria:**
  - Breadcrumb tampil horizontal rapi, unboxed, tanpa nomor angka maupun bullet dari resolusi 320px hingga 1440px.
  - Karakter chevron dihasilkan melalui CSS, bukan dari elemen `<li>` terpisah di DOM.
  - Item terakhir memiliki atribut `aria-current="page"`, terpotong elipsis satu baris jika panjang tanpa merusak layout.
  - Mendukung dwibahasa ID (`"Beranda > Berita > [Judul]"`) dan EN (`"Home > News > [Title]"`) sesuai menu navigasi.
- **File Terdampak:** `views/public/news-detail.ejs`, `public/css/components.css`.
- **Skill:** `ponytail`, `antislop-code`.
- **Verifikasi:** Inspeksi visual di browser pada resolusi 320px, 768px, 1440px dalam mode ID dan EN.

---

### [T-227] [Bug Fix] Penanganan Gambar Pecah & Fallback Placeholder Kartu Artikel
- **Deskripsi:** Mengatasi masalah gambar pecah pada kartu publikasi terkait dan kartu listing berita ketika file thumbnail fisik tidak ditemukan di server atau field `cover_image` di database bernilai `null`. Menerapkan sistem placeholder netral berbasis token tanpa error 404, tanpa inline event handler (`onerror`), dan tanpa layout shift.
- **Akar Masalah (Verifikasi Kode):** Pada `views/public/news-detail.ejs` (baris 10 & 193) dan `views/public/news.ejs`, kode EJS menggunakan fallback gambar hardcoded: `cover_image || '/images/hero-factory-precision.webp'`. Di direktori server `public/images/`, berkas `hero-factory-precision.webp` TIDAK ADA (*No such file or directory*). Di database `posts`, artikel id 1 memiliki `cover_image: null`, sedangkan artikel id 3, 4, 5 berisi nilai string `'/images/hero-factory-precision.webp'`. Akibatnya browser meminta aset yang 404 dan merender ikon gambar rusak beserta teks atribut `alt`.
- **Acceptance Criteria:**
  - Tidak ada ikon gambar pecah atau teks alt mentah yang muncul di layar.
  - Artikel dengan gambar bernilai kosong, `null`, atau file hilang secara otomatis menampilkan gambar placeholder netral berbasis token (menggunakan aset netral SVG/WebP yang terpasang di `public/images/` atau kontainer netral `var(--color-surface-container)`).
  - Aspek rasio gambar terkunci (16:9) sehingga Cumulative Layout Shift (CLS) bernilai nol.
  - Kompatibel dengan Content Security Policy (CSP) tanpa atribut inline event handler `onerror`.
- **File Terdampak:** `views/public/news-detail.ejs`, `views/public/news.ejs`, `public/css/components.css`.
- **Skill:** `ponytail`, `antislop-code`.
- **Verifikasi:** Buka halaman artikel terkait di browser, periksa Network tab (tidak ada 404 gambar) dan pastikan tampilan placeholder rapi.

---

### [T-228] [Spek B.1] Restrukturisasi Layout Halaman Detail Berita Identik G2
- **Deskripsi:** Menyusun ulang markup dan tata letak halaman detail berita `/news/:slug` mengikuti hierarki editorial Chandra Asri (G2): Breadcrumb -> Gambar Sampul Utama Rounded selebar kolom artikel -> Tanggal Publikasi Abu-abu -> H1 Judul Artikel -> Atribusi `"Oleh Redaksi PT Euodoo"` / `"By PT Euodoo Editorial Team"` -> Isi Artikel Editorial Polos (tanpa kartu pembungkus, tanpa border/shadow) -> Garis Pemisah -> Baris `"Bagikan:"` dengan 4 tombol ikon sirkular token hijau (WhatsApp, Facebook, X, Salin Tautan) -> Seksi `"Baca Berita Lainnya"` berlatar abu muda token (`var(--bg-subtle)`).
- **Acceptance Criteria:**
  - Urutan tampilan vertikal identik dengan G2 pada desktop, tablet, dan ponsel.
  - Konten artikel HTML dari TinyMCE dirender rapi di dalam kelas `.nwd-prose` langsung di atas background halaman tanpa box pembungkus.
  - Seluruh elemen G1 yang tidak ada di G2 (badge pill, lead paragraph terpisah, estimasi waktu baca, avatar redaksi, tombol "Kembali", dan tombol "Konsultasi Kemitraan") dihilangkan dari tampilan publik.
  - 4 tombol Bagikan sirkular berfungsi penuh (salin tautan ke clipboard + link share medsos resmi).
  - Seksi "Baca Berita Lainnya" menggunakan latar belakang `var(--bg-subtle)`, memuat maksimal 3 kartu artikel terbaru selain artikel yang sedang dibuka (sembunyi jika kosong).
  - Teks antarmuka mendukung dwibahasa ID dan EN.
- **File Terdampak:** `views/public/news-detail.ejs`, `public/css/components.css`, `locales/id.json`, `locales/en.json`.
- **Skill:** `ponytail`, `antislop-code`.
- **Verifikasi:** Inspeksi visual lintas breakpoint dan uji fungsi tombol share serta salin tautan.

---

### [T-229] [Spek B.2] Standarisasi Komponen Kartu Berita Bersama Identik G4
- **Deskripsi:** Membangun komponen kartu berita tunggal bersama (`.nwl-card` / `.nwd-card`) yang digunakan secara konsisten pada grid listing `/news` dan seksi "Baca Berita Lainnya" pada `/news/:slug`. Mengikuti visual G4: media gambar rasio 16:9 dengan sudut membulat (`var(--r-xl)`), tanggal kecil abu-abu, judul tebal dengan pembatasan maksimal 3 baris (*line-clamp*), dan tautan aksi `"Baca Selengkapnya"` / `"Read More"` berwarna hijau brand `var(--color-primary)`.
- **Acceptance Criteria:**
  - Desain kartu pada listing `/news` dan "Baca Berita Lainnya" pada `/news/:slug` identik secara proporsi dan tipografi.
  - Gambar kartu berasio tetap 16:9 dengan `object-fit: cover` dan sudut membulat token.
  - Judul artikel menggunakan line-clamp 3 baris sehingga tinggi kartu dalam grid tetap rapi dan seimbang.
  - Tautan aksi memiliki area sentuh minimal 44x44px.
  - Grid responsif: 3 kolom pada desktop (>=1024px), 2 kolom pada tablet (640px - 1023px), 1 kolom pada mobile (<640px).
- **File Terdampak:** `views/public/news.ejs`, `views/public/news-detail.ejs`, `public/css/components.css`, `tests/test-modul12-public.js`.
- **Skill:** `ponytail`, `antislop-code`.
- **Verifikasi:** Uji visual perbandingan kartu di listing dan detail; jalankan `test-modul12-public.js` dan pastikan lulus.

---

### [T-230] [Spek B.3 / FR-24] Headline Slider Halaman Listing Berita (Mengacu G3 & Mobile Reference)
- **Deskripsi:** Mengimplementasikan seksi headline artikel utama pada `/news` mengacu pada G3 di desktop dan referensi gambar mobile Azis pada layar ponsel. Menampilkan layout 2 kolom asimetris di desktop dengan ketinggian maksimal ~setengah viewport (~420-450px). Pada mobile (<768px), menampilkan susunan vertikal: judul `"News"`, gambar 16:9 ber-radius token, tanggal terbit, judul headline, ringkasan, `"Baca Selengkapnya →"`, indikator garis di tengah, dan tombol panah sirkular di tengah bawah. Controller mengambil hingga 5 artikel headline aktif (`is_headline = 1`). Menerapkan autoplay per 6 detik dengan pause saat hover/fokus, kontrol keyboard, dan gestur swipe sentuh.
- **Acceptance Criteria:**
  - Desktop (1440x900): Ketinggian seksi headline maksimal ~420px - 450px dengan layout 2 kolom asimetris rapi.
  - Mobile (<768px): Tampilan identik persis dengan referensi gambar mobile Azis menggunakan token hijau Euodoo (indikator garis di tengah, tombol panah sirkular di tengah bawah).
  - Headline tunggal (=1): Kontrol panah dan indikator garis disembunyikan otomatis.
  - Headline jamak (>1): Autoplay bergulir setiap 6 detik, otomatis pause saat kursor hover atau menerima fokus keyboard, serta mati bila `prefers-reduced-motion` aktif.
  - Navigasi manual via tombol panah, indikator garis, keyboard panah, dan swipe sentuh berfungsi mulus.
  - Klik cepat (*rapid click*) pada kontrol panah tidak menimbulkan kesalahan status atau kedipan visual.
  - Tanpa komentar di file frontend.
- **File Terdampak:** `controllers/public/postController.js`, `views/public/news.ejs`, `public/css/components.css`, `public/js/news-slider.js` (atau script modular tanpa komentar).
- **Skill:** `ponytail`, `antislop-code`.
- **Verifikasi:** Pengujian slider dengan 1 headline dan >1 headline; uji kontrol keyboard, mouse, dan swipe; verifikasi konsol bersih dari error.

---

### [T-231] [Spek B.4 / FR-25] Filter Tipe Tab G4, Kategori, & Pencarian Berbasis Fetch API Tanpa Reload Halaman
- **Deskripsi:** Mengubah gaya tab filter tipe menjadi format underline hijau aktif mengacu pada G4. Mengimplementasikan penyaringan artikel, kategori, dan pencarian menggunakan `fetch()` API ke endpoint data berita di controller tanpa me-reload halaman. Melakukan sinkronisasi URL dua arah via History API (`window.history.pushState`), menyediakan fallback tautan reguler untuk non-JS/SEO crawler, membersihkan sisa htmx pada halaman news, dan menyediakan UI Empty State yang bersih berbasis token.
- **Acceptance Criteria:**
  - Pergantian tab tipe, pemilihan kategori, dan input pencarian mengeksekusi `fetch()` API ringan dan memperbarui DOM grid berita tanpa me-reload halaman.
  - URL browser otomatis disinkronkan via `history.pushState` (`/news?type=...&category=...&search=...&page=...`) sehingga tautan tetap dapat dibagikan dan tombol Back/Forward browser bekerja normal.
  - Fallback SSR: Pengguna tanpa JavaScript atau web crawler tetap dapat bernavigasi melalui hyperlink standar.
  - Controller mendukung respons JSON saat menerima request fetch/ajax dan memvalidasi whitelist parameter query.
  - State kosong (*Empty State*) tampil rapi berbasis token dengan tombol reset cepat ketika hasil filter nihil.
  - Tanpa komentar di frontend; pustaka atau rute yang dipakai halaman lain tidak dihapus.
- **File Terdampak:** `controllers/public/postController.js`, `views/public/news.ejs`, `public/css/components.css`, `public/js/news-filter.js` (atau modul script scoped).
- **Skill:** `ponytail`, `antislop-code`.
- **Verifikasi:** Uji interaksi filter & pencarian di browser dengan Network tab terbuka (memastikan request fetch berjalan mulus dan halaman tidak reload); uji tombol Back/Forward browser; uji fallback tanpa JavaScript.

---

### [T-232] [Verifikasi & UI Polish] Audit Responsif, Aksesibilitas, dan Regresi Publik
- **Deskripsi:** Melakukan audit komprehensif pada breakpoint 320px, 375px, 480px, 768px, 1024px, dan 1440px. Memastikan kepatuhan WCAG AA, target sentuh minimal 44px, tidak ada komentar pada kode frontend yang dibuat/diubah, tidak ada broken image, homepage dan halaman produk tetap utuh tidak mengalami regresi, serta seluruh suite pengujian otomatis (`test-modul12-public.js`) lulus 100%.
- **Acceptance Criteria:**
  - Responsivitas sempurna di seluruh breakpoint tanpa horizontal overflow (zero layout clipping).
  - Target sentuh semua tombol dan link minimal 44x44px.
  - Tidak ada sisa komentar di file EJS/CSS/JS frontend yang diubah atau dibuat.
  - Test suite `test-modul12-public.js` berjalan dan PASS 100%.
  - Homepage `/` dan halaman publik lainnya (`/about`, `/products`, `/contact`) tidak mengalami perubahan styling maupun fungsionalitas.
- **File Terdampak:** Seluruh file yang dimodifikasi pada task sebelumnya.
- **Skill:** `ponytail`, `antislop-code`.
- **Verifikasi:** Eksekusi `node tests/test-modul12-public.js` serta inspeksi manual konsol browser.

---

## 5. Dampak Ukuran Modul

- **`prd/news.md`:** Saat ini berukuran ~2.8KB (41 baris). Penambahan delta pembaruan FR-12, FR-24, dan FR-25 diperkirakan menambah ~1.5KB sehingga ukuran total menjadi sekitar **~4.3KB**, masih sangat aman di bawah batas maksimal ~8KB.
- **`tech/news.md`:** Saat ini berukuran ~5.2KB (77 baris). Penambahan rincian teknis komponen bersama, headline slider (desktop & mobile reference), dan endpoint fetch filtering diperkirakan menambah ~1.8KB sehingga ukuran total menjadi sekitar **~7.0KB**, tetap berada di bawah ambang batas ~8KB.
- **Rencana Pemecahan Sub-Modul (Kontinjensi):** Jika pada tahap *Merge Spec* atau *Implementation* ukuran `tech/news.md` mendekati batas ~8KB, spesifikasi teknis detail artikel publik akan dipecah menjadi sub-modul tersendiri `tech/news-detail.md` (mengikuti preseden arsitektur pada `tech/products.md` dan `tech/products-detail.md`), dan didaftarkan pada `.agents/INDEX.md`.

---

## 6. Rencana CLOSE (Selesai Implementasi)

Setelah seluruh task selesai diimplementasikan dan diverifikasi:
1. Menghapus penanda `[PENDING T-xxx]` di modul `prd/news.md` dan `tech/news.md`.
2. Memindahkan berkas proposal ini dari `changes/2026-10-27_revisi-news-listing-detail.md` ke direktori `archive/`.
3. Memindahkan seluruh task selesai dari `3-TASKS.md` ke berkas arsip `archive/tasks-index-full.md`.
4. Memperbarui tanggal verifikasi pada header modul `prd/news.md`, `tech/news.md`, dan tabel modul di `.agents/INDEX.md` menjadi tanggal penyelesaian.
5. Menambahkan 1 baris entri di `CHANGELOG.md`:  
   `2026-10-27 | Revisi visual listing & detail berita identik editorial G2-G4, headline slider desktop/mobile, filter in-page via fetch tanpa reload, dan fix breadcrumb/image | T-226 s/d T-232`
