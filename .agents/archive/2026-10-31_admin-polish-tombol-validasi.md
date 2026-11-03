# Proposal Perubahan Spesifikasi: Polish Dashboard Admin (Tombol, Slug, Validasi Form, Favicon)

- **Tanggal Proposal**: 2026-10-31
- **Status**: APPROVED & MERGED TO SPEC (Tahap 3: MERGE KE SPEC - Terdaftar sebagai T-255 s/d T-261)
- **Modul Terdampak**: `prd/admin-cms.md`, `tech/admin-cms.md` (usulan sub-modul baru `tech/admin-ui.md`), `prd/settings.md`, `tech/settings.md` (serta perbaikan bug tampilan pada `products` & `news` tanpa perubahan spek redirect 301).

---

## 1. Konteks (Maksimal 3 Baris)
Menyeragamkan komponen tombol di seluruh Dashboard Admin agar mengikuti standar visual tombol editor tabel ukuran produk (garis tipis, teks hijau token, ikon SVG kiri, label pendek ID/EN, dan animasi mikro), serta mengganti tooltip validasi bawaan browser dan dialog native (`alert`/`confirm`) dengan sistem validasi inline dan dialog bertema. Sekaligus memperbaiki dua bug visual: tampilan slug yang berantakan di Produk/Berita (pengulangan kata bahasa Inggris dan bullet) serta proporsi favicon yang terlihat gepeng di tab browser. Perubahan ini khusus untuk panel Admin (homepage publik tetap dibekukan), kecuali perbaikan proporsi favicon yang berlaku di layout publik dan admin.

---

## 2. Delta Spesifikasi per Modul (Kondisi Lama -> Kondisi Baru)

> **Catatan Penomoran FR pada `prd/admin-cms.md`**: Saat ini `prd/admin-cms.md` telah memiliki **FR-13** s/d **FR-16** dan **FR-22** s/d **FR-28** (FR-24 s/d FR-28 sudah terpakai untuk Manajemen Konten Beranda, Galeri Tentang Kami, Why Choose Us, dan Media Library). Oleh karena itu, standar UI baru dicatat sebagai **FR-29 (Komponen Tombol Admin Terpadu)** dan **FR-30 (Validasi Formulir & Dialog Admin Bertema)** agar tidak menimpa nomor FR yang sudah aktif.

### 2.1. Modul `.agents/prd/admin-cms.md`

| Bagian / Fitur | Kondisi Lama | Kondisi Baru |
| :--- | :--- | :--- |
| **FR-29: Komponen Tombol Admin Terpadu (Baru)** | Belum ada spesifikasi standar komponen tombol admin; halaman admin mencampur `.btn-primary` (hijau solid tanpa ikon dengan label panjang seperti "Perbarui Produk"), `.btn-secondary` (outline abu-abu polos), `.btn-outline`, `.btn-ghost`, dan `.btn-add-row` (khusus tabel ukuran). | Seluruh tombol di panel Admin wajib menggunakan komponen tombol admin terpadu berprefix unik `.adm-btn` (mengacu pada gaya tombol editor tabel ukuran produk): tinggi, radius (`var(--r-md)`), padding, jarak ikon, focus ring (`var(--focus-ring)`), state disabled, dan state loading saat submit seragam; target sentuh minimal `44px` pada layar mobile; ikon SVG inline di sisi kiri selaras makna; label ringkas yang telah disetujui dalam Bahasa Indonesia (ID) dan Inggris (EN) dengan `aria-label` deskriptif bila label visual pendek. Mendukung 4 varian terkunci:<br>1. `primary` (Simpan/aksi komit utama): latar solid hijau lembut daun dari token (`var(--adm-btn-primary-bg)` / `var(--color-leaf-soft)`), teks & ikon gelap kontras tinggi (`var(--surface-dark-deep)` / `var(--text-main)`), border tipis (`var(--adm-btn-primary-border)`).<br>2. `secondary` (aksi umum/tambah/salin/ekspor): outline tipis persis seperti tombol tabel ukuran (`var(--bg-surface)`, border `var(--border-main)`, teks `var(--primary)`).<br>3. `neutral`/`ghost` (batal/kembali/reset): abu-abu netral (`var(--bg-surface)`, border `var(--border-main)`, teks `var(--text-secondary)`).<br>4. `danger` (hapus di halaman, tabel, dan modal konfirmasi): latar `var(--st-ditolak-bg)`, border `var(--st-ditolak-border)`, teks `var(--st-ditolak-text)`. |
| **FR-30: Standar Validasi Formulir & Dialog Admin Bertema (Baru)** | Validasi form admin di sisi klien masih mengandalkan tooltip bawaan browser (`required` native dengan pesan bahasa OS browser seperti *"Please fill out this field."*) serta sebagian validasi JS menggunakan `alert()` / `confirm()` native. | Seluruh form di panel Admin wajib menggunakan atribut `novalidate` dan divalidasi oleh modul JS terpusat tanpa handler inline yang membaca atribut HTML (`required`, `maxlength`, `pattern`, `type`, `min`, `max`) serta kontrol kustom (TinyMCE, Media Picker, select, dan editor tabel ukuran). Validasi berjalan saat tombol **Submit** ditekan, lalu berjalan secara *live* (`input`/`change`) per field setelah field tersebut pernah mengalami error. Error ditampilkan inline di bawah field menggunakan warna token error (`var(--color-error)`, `var(--color-error-bg)`), ikon peringatan kecil, border merah token, `aria-invalid="true"`, dan `aria-describedby`, disertai auto-scroll/fokus ke field error pertama (termasuk membuka tab/panel tersembunyi secara otomatis). Pesan validasi mendukung ID dan EN, selaras dengan tampilan error validasi server-side. Seluruh panggilan `alert()` dan `confirm()` native di admin diganti dengan modal SweetAlert2 bertema (menggunakan varian tombol `.adm-btn-danger` untuk konfirmasi hapus). |

### 2.2. Modul `.agents/tech/admin-cms.md` (dan Usulan Sub-Modul `.agents/tech/admin-ui.md`)

| Bagian / Komponen | Kondisi Lama | Kondisi Baru |
| :--- | :--- | :--- |
| **Arsitektur Class Tombol Admin (`.adm-btn-*`)** | Admin memakai class `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-outline`, `.btn-sm` yang namanya beririsan dengan `public/css/components.css` (halaman publik), serta `.btn-add-row` yang hanya di-scope ke `.size-table-editor-card`. | Memisahkan komponen tombol admin ke prefix mandiri `.adm-btn` (`public/css/admin.css`) agar tidak merusak `.btn-secondary` di halaman publik:<br>- `.adm-btn` (base: `display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; font-size: 12px; font-weight: 600; border-radius: var(--r-md); box-shadow: var(--shadow-xs); transition: transform var(--ease), opacity var(--ease), background-color var(--ease), border-color var(--ease), color var(--ease), box-shadow var(--ease);`).<br>- `.adm-btn-primary`: latar `var(--adm-btn-primary-bg)` (`var(--color-leaf-soft)`), border `1px solid var(--adm-btn-primary-border)`, teks & ikon `var(--surface-dark-deep)` (`var(--text-main)`), hover latar `var(--adm-btn-primary-hover-bg)` dengan `transform: translateY(-1px)`.<br>- `.adm-btn-secondary` (acuan `.btn-add-row`): latar `var(--bg-surface)`, border `1px solid var(--border-main)`, teks `var(--primary)`, hover latar `var(--primary-subtle)`, border `var(--primary-border)`, teks `var(--primary-hover)`, `transform: translateY(-1px)`.<br>- `.adm-btn-neutral` / `.adm-btn-ghost`: latar `var(--bg-surface)`, border `1px solid var(--border-main)`, teks `var(--text-secondary)`, hover latar `var(--bg-subtle)`, teks `var(--text-main)`.<br>- `.adm-btn-danger`: latar `var(--st-ditolak-bg)`, border `1px solid var(--st-ditolak-border)`, teks `var(--st-ditolak-text)`, hover latar dan border merah bahaya dengan teks kontras.<br>- Modifier ukuran: `.adm-btn-sm` (aksi baris tabel) dan `.adm-btn-block` (lebar penuh). |
| **Animasi Mikro Tombol Admin** | Animasi hanya ada pada `.btn-add-row` (`transform: translateY(-1px)` pada tombol dan `transform: rotate(90deg)` pada SVG ikon tambah), belum dibungkus `@media (hover: hover)` secara menyeluruh untuk semua tombol. | Menerapkan animasi mikro berbasis `transform` dan `opacity` dari tombol tabel ukuran ke seluruh varian `.adm-btn`: efek hover (`transform: translateY(-1px)` pada tombol dan transisi `transform` kontekstual pada `<svg>`: rotasi `90deg` untuk ikon plus, translasi `-2px` untuk panah kembali, skala/translasi halus untuk ikon simpan/unduh/hapus) dibungkus dalam `@media (hover: hover)`, efek tekan `:active` (`transform: translateY(0)`), dan dinonaktifkan sepenuhnya pada `@media (prefers-reduced-motion: reduce)`. |
| **Kontras Warna & Aksesibilitas Tombol** | Sebagian tombol seperti `.btn-secondary` menggunakan teks `var(--text-secondary)` di atas `var(--bg-surface)` tanpa hierarki warna brand, sedangkan tombol tabel menggunakan ukuran kompak tanpa jaminan `min-height: 44px` di mobile. | Seluruh kombinasi warna tombol wajib memenuhi rasio kontras minimum WCAG AA (`>= 4.5:1` untuk teks normal):<br>- **Primary (`var(--adm-btn-primary-bg)` / `var(--color-leaf-soft)`)**: Teks gelap `var(--surface-dark-deep)` / `var(--text-main)` di atas latar hijau lembut daun memiliki rasio kontras **13.91:1 s/d 14.15:1** (Lulus WCAG AAA); dengan teks `var(--primary-hover)` memiliki rasio **6.39:1** (Lulus WCAG AA).<br>- **Secondary (Acuan)**: Teks `var(--primary)` di atas `var(--bg-surface)` = **5.66:1** (Lulus AA); saat hover teks `var(--primary-hover)` di atas `var(--primary-subtle)` = **7.59:1** (Lulus AAA).<br>- **Neutral/Ghost**: Teks `var(--text-secondary)` di atas `var(--bg-surface)` = **10.36:1** (Lulus AAA).<br>- **Danger**: Teks `var(--st-ditolak-text)` di atas `var(--st-ditolak-bg)` = **7.02:1** (Lulus AAA).<br>Pada viewport mobile (`<= 768px`), seluruh `.adm-btn` memiliki target sentuh `min-height: 44px`. |
| **Modul Validasi Form Terpusat (`public/js/admin-form-validation.js`)** | Tidak ada modul validasi form terpusat; handler validasi tersebar (sebagian inline seperti `onchange="toggleBannerSource(...)"`, `onchange="this.form.submit()"`, `onclick="openAdminModal(...)"`, dan `alert()` di `admin-settings.js`, `dashboard.ejs`, `inquiries/index.ejs`). | Modul baru `public/js/admin-form-validation.js` menginisialisasi seluruh `<form>` admin dengan `novalidate`, membaca atribut validasi HTML (`required`, `maxlength`, `minlength`, `pattern`, `type="email"`, `type="url"`, `type="number"`, `min`, `max`, batas karakter sesuai skema kolom database) dan `data-validate-*` untuk komponen kustom (TinyMCE editor via `tinymce.get(id).getContent({ format: 'text' })`, Media Picker hidden input `.media-picker-component input[type="hidden"][required]`, repeater WhatsApp, dan editor tabel ukuran JSON). Validasi dipicu saat `submit`, lalu aktif secara *live* (`input`/`change`) pada field yang sudah pernah error. Merender elemen `.adm-field-error` dengan ikon SVG dan teks `var(--color-error)` dalam bahasa aktif (`ID`/`EN`), membuka `.about-tab-pane` / `.settings-tab-pane` jika field yang gagal berada di tab tersembunyi, mengunci tombol submit dengan state `.is-loading` saat validasi lulus untuk mencegah double-submit, dan mengganti seluruh `alert()`/`confirm()` native dengan helper `window.showAdminAlert()` / `window.showAdminConfirm()` berbasis SweetAlert2 (dengan tombol konfirmasi hapus memakai `.adm-btn-danger`). |

### 2.3. Modul `.agents/prd/settings.md` & `.agents/tech/settings.md`

| Modul | Kondisi Lama | Kondisi Baru |
| :--- | :--- | :--- |
| **`prd/settings.md` (FR-22: Pengaturan Identitas Visual, Kontak & Peta)** | Admin dapat memilih/mengunggah Logo dan Favicon situs di Pengaturan Situs, namun spesifikasi belum memisahkan aturan visual simbol favicon persegi dari logo horizontal maupun penanganan fallback otomatisnya. | Pengaturan Situs menyediakan kolom unggah/pilih khusus **Favicon Situs** (berbentuk persegi `1:1`, menggunakan **simbol logo saja tanpa teks** agar tajam di ukuran kecil) yang terpisah dari Logo Utama, dengan fallback otomatis ke Logo Utama jika Favicon khusus belum diatur. Sistem wajib mempertahankan proporsi asli simbol (`fit: 'contain'`, latar transparan, padding seimbang) tanpa distorsi/gepeng, serta menghasilkan paket ukuran ikon standar (`16x16`, `32x32`, `180x180` Apple Touch Icon, dan `192x192`/`512x512` PNG) untuk halaman publik maupun dashboard admin. |
| **`tech/settings.md` (Pipeline Pemrosesan Favicon & Tag `<link rel="icon">`)** | 1. Di `views/admin/settings/index.ejs`, field `site_favicon` menggunakan Media Picker biasa yang menunjuk ke berkas gambar di Media Library (yang diproses oleh `processAndSaveImage` dengan `fit: 'inside'` mengikuti rasio asli gambar, mis. logo persegi panjang).<br>2. Di `middleware/uploadMiddleware.js` (`saveSettingUpload`), file PNG/SVG/ICO disimpan mentah tanpa normalisasi kanvas persegi, dan fallback WebP menggunakan `fit: 'inside'`.<br>3. Di `views/partials/head.ejs` dan `views/partials/admin-header.ejs`, hanya ada satu tag `<link rel="icon" href="...">` tanpa atribut `sizes` dan tanpa `apple-touch-icon` (serta belum ada di `views/admin/login.ejs` dan `views/admin/403.ejs`). | 1. Menyediakan pipeline generator multi-ukuran favicon (`generateFaviconSet`) berbasis Sharp di `middleware/uploadMiddleware.js` yang memproses sumber gambar dari `site_favicon` (atau fallback ke `site_logo` bila `site_favicon` kosong) menggunakan `fit: 'contain'`, latar transparan (`background: { r: 0, g: 0, b: 0, alpha: 0 }`), dan padding seimbang sehingga simbol selalu ditempatkan proporsional di tengah kanvas persegi `16x16`, `32x32`, `180x180`, `192x192`, dan `512x512` PNG di `public/uploads/settings/`.<br>2. Menyimpan path hasil generate pada key `site_favicon` (serta metadata ukuran turunan atau konvensi penamaan deterministik `-16x16.png`, `-32x32.png`, `-180x180.png`, `-192x192.png`, `-512x512.png` di tabel `settings` tanpa memerlukan migrasi skema tabel baru).<br>3. Menyertakan tag `<link rel="icon" type="image/png" sizes="32x32">`, `<link rel="icon" type="image/png" sizes="16x16">`, `<link rel="apple-touch-icon" sizes="180x180">`, dan `<link rel="icon" type="image/png" sizes="192x192">` secara konsisten di `views/partials/head.ejs`, `views/partials/admin-header.ejs`, `views/admin/login.ejs`, dan `views/admin/403.ejs`. |

### 2.4. Temuan Bug Tanpa Perubahan Spek Redirect 301 (Bagian A1 & A2)

#### A1. Bug Tampilan Slug di Produk Katalog & Artikel Berita (Diperbarui Sesuai Keputusan Q3: Opsi C, 1 Baris Slug Tanpa Bullet & Tanpa Judul EN)
- **Akar Masalah Dugaan**:
  1. Pada daftar Produk Admin (`views/admin/products/index.ejs` baris 77), sub-baris di bawah judul produk merender nama bahasa Inggris diikuti bullet dan kode slug: `<div class="td-client-sub"><%= p.name_en || '-' %> &bull; <code><%= p.slug %></code></div>`. Karena `slug` dihasilkan dari judul produk, teks judul bahasa Inggris dan `slug` terlihat mengulang kata yang sama disertai ikon bullet (`&bull;`).
  2. Pada daftar Artikel Berita Admin (`views/admin/posts/index.ejs` baris 60), sub-baris merender pola serupa: `<div class="td-client-sub"><%= post.title_en || '-' %> &bull; <code><%= post.slug %></code></div>`.
  3. Pada daftar Merek Admin (`views/admin/brands/index.ejs` baris 81), tertulis `<div class="td-client-sub">slug: <%= brand.slug %></div>` dengan awalan teks `slug:`.
  4. Pada form tambah/edit Artikel Berita (`views/admin/posts/create.ejs` baris 81-86 dan `views/admin/posts/edit.ejs` baris 88-93), input `#slug` menggunakan inline style (`style="display: flex; align-items: stretch;"`) dengan prefix statis `/news/`. Sementara pada form edit Produk (`views/admin/products/edit.ejs`), informasi slug kanonik produk belum ditampilkan.
  5. Pada halaman publik (`views/public/products.ejs`, `views/public/product-detail.ejs`, `views/public/news.ejs`, `views/public/news-detail.ejs`), hasil audit mengonfirmasi bahwa `slug` hanya dipakai di dalam atribut `href` tautan dan tidak dirender sebagai teks mentah di layar publik.
  6. Catatan Skema Database: Tabel `products` dan `posts` masing-masing memiliki satu kolom `slug` tunggal (`VARCHAR(191)`), dengan histori perubahan tercatat di `slug_redirects` untuk redirect 301 otomatis. Perilaku pembuatan slug dan redirect 301 di `tech/products.md` serta `tech/news.md` **tidak diubah**.
- **Kondisi Lama -> Kondisi Baru per Lokasi (Terkunci Sesuai Q3)**:

| Lokasi File | Kondisi Lama | Kondisi Baru |
| :--- | :--- | :--- |
| `views/admin/products/index.ejs` (Baris 76-78) | `<div class="td-client-title"><%= p.name_id %></div>`<br>`<div class="td-client-sub"><%= p.name_en || '-' %> &bull; <code><%= p.slug %></code></div>` | Menampilkan judul utama dan **1 baris slug tunggal saja** di bawahnya (`<div class="adm-slug-text" title="<%= p.slug %>"><%= p.slug %></div>`), **tanpa `&bull;` dan tanpa `p.name_en`**. Menggunakan font monospace kecil (`var(--font-mono)`), warna `var(--text-muted)`, `text-overflow: ellipsis`, `overflow: hidden`, `white-space: nowrap`, dan responsif dari `320px` hingga desktop. |
| `views/admin/posts/index.ejs` (Baris 59-61) | `<div class="td-client-title"><%= post.title_id %></div>`<br>`<div class="td-client-sub"><%= post.title_en || '-' %> &bull; <code><%= post.slug %></code></div>` | Menampilkan judul artikel dan **1 baris slug tunggal saja** di bawahnya (`<div class="adm-slug-text" title="<%= post.slug %>"><%= post.slug %></div>`), **tanpa `&bull;` dan tanpa `post.title_en`**. |
| `views/admin/brands/index.ejs` (Baris 80-81) | `<div class="td-client-sub">slug: <%= brand.slug %></div>` | Menampilkan **1 baris slug tunggal saja** menggunakan `.adm-slug-text` tanpa awalan kata `slug:`. |
| `views/admin/product-categories/index.ejs` & `views/admin/post-categories/index.ejs` | `<td><code><%= cat.slug %></code></td>` tanpa batas ellipsis pada layar sempit. | Menerapkan class `.adm-slug-text` pada sel slug agar tipografi monospace/muted dan pemotongan ellipsis seragam di seluruh tabel admin. |
| `views/admin/products/edit.ejs` & `views/admin/posts/{create,edit}.ejs` | `products/edit.ejs` belum menampilkan slug kanonik; `posts/{create,edit}.ejs` merender input `#slug` dengan inline style. | Pada `products/edit.ejs` ditampilkan baris info slug kanonik satu baris (`.adm-slug-box` read-only dengan ellipsis); pada `posts/{create,edit}.ejs` input `#slug` menggunakan class `.adm-slug-input-group` di `public/css/admin.css` tanpa inline style. |

#### A2. Bug Favicon Gepeng di Tab Browser (Diperbarui Sesuai Keputusan Q6: Opsi B dengan Fallback Opsi A, Simbol Logo Saja Tanpa Teks)
- **Akar Masalah Dugaan**:
  1. Pada `views/admin/settings/index.ejs` (baris 20-36), pengaturan `site_favicon` menggunakan komponen Media Picker (`<input type="hidden" name="site_favicon">`). Ketika admin memilih gambar logo utama PT Euodoo dari Media Library (yang berdimensi horizontal/persegi panjang karena menyertakan teks nama perusahaan, dan diproses oleh `processAndSaveImage` di `middleware/uploadMiddleware.js` baris 75 dengan `fit: 'inside'` tanpa kanvas persegi), URL gambar horizontal tersebut langsung dipasang ke `<link rel="icon" href="<%= settings.site_favicon %>">`.
  2. Browser merender `<link rel="icon">` ke dalam kotak tab berukuran `16x16` atau `32x32` piksel (rasio `1:1`), sehingga gambar horizontal dipaksa menyempit secara horizontal dan terlihat gepeng/terdistorsi.
  3. Selain itu, di `middleware/uploadMiddleware.js` (`saveSettingUpload`, baris 184-211), file PNG/SVG/ICO disimpan mentah tanpa resize `fit: 'contain'` ke kanvas persegi.

---

## 3. Audit Lengkap Tombol Admin & Daftar Label Pendek Terkunci (Disetujui Sesuai Keputusan Q1, Q2, Q4, Q7)

Berdasarkan pemeriksaan kode pada `public/css/components.css`, class `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`, dan `.btn-ghost` dipakai secara aktif di halaman publik. Oleh karena itu, seluruh tombol di area Admin dimigrasikan ke class baru berprefix `.adm-btn` (`public/css/admin.css`) agar halaman publik sama sekali tidak terdampak.

Berikut tabel pemetaan tombol admin yang telah **disetujui pada Q4** beserta varian final sesuai **Q1, Q2, dan Q7**:

| No | Halaman / Lokasi File | Label Lama (ID) | Label Baru Terkunci (ID) | Label Baru Terkunci (EN) | Varian `.adm-btn-*` | Ikon SVG (Kiri) | `aria-label` (Untuk Aksesibilitas) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `products/index.ejs` (Header) | `Tambah Produk Baru` | `Tambah` | `Add` | `primary` | `plus` | `Tambah produk baru` / `Add new product` |
| 2 | `products/{create,edit}.ejs` (Header) | `&larr; Kembali ke Katalog` | `Kembali` | `Back` | `neutral` (Q2: Opsi A) | `arrow-left` | `Kembali ke daftar produk` / `Back to product list` |
| 3 | `products/create.ejs` (Footer Form) | `Simpan Produk` | `Simpan` | `Save` | `primary` (Q1: Opsi A, `--adm-btn-primary-bg`) | `check` / `save` | `Simpan produk` / `Save product` |
| 4 | `products/edit.ejs` (Footer Form) | `Perbarui Produk` | `Simpan` | `Save` | `primary` (Q1: Opsi A, `--adm-btn-primary-bg`) | `check` / `save` | `Simpan perubahan produk` / `Save product changes` |
| 5 | `products/{create,edit}.ejs` (Footer Form) | `Batal` | `Batal` | `Cancel` | `neutral` (Q2: Opsi A) | `x-close` | `Batalkan perubahan` / `Cancel changes` |
| 6 | `products/{create,edit}.ejs` (Editor Tabel Ukuran) | `Salin Kolom`, `Tambah Kolom`, `Tambah Baris` | `Salin Kolom`, `Tambah Kolom`, `Tambah Baris` *(Acuan)* | `Copy Column`, `Add Column`, `Add Row` | `secondary` *(Acuan)* | `copy`, `plus`, `plus` | Sesuai label |
| 7 | `product-categories/index.ejs` | `Tambah Kategori` | `Tambah` | `Add` | `primary` | `plus` | `Tambah kategori produk` / `Add product category` |
| 8 | `product-categories/{create,edit}.ejs` | `&larr; Kembali ke Daftar` | `Kembali` | `Back` | `neutral` | `arrow-left` | `Kembali ke daftar kategori` / `Back to category list` |
| 9 | `product-categories/{create,edit}.ejs` | `Simpan Kategori` / `Perbarui Kategori` | `Simpan` | `Save` | `primary` | `check` / `save` | `Simpan kategori` / `Save category` |
| 10 | `posts/index.ejs` (Header) | `Tulis Artikel Baru` | `Tambah` | `Add` | `primary` | `plus` | `Tulis artikel berita baru` / `Write new article` |
| 11 | `posts/{create,edit}.ejs` (Header) | `&larr; Kembali ke Daftar` | `Kembali` | `Back` | `neutral` | `arrow-left` | `Kembali ke daftar artikel` / `Back to article list` |
| 12 | `posts/{create,edit}.ejs` (Footer Form) | `Simpan Artikel` / `Perbarui Artikel` | `Simpan` | `Save` | `primary` | `check` / `save` | `Simpan artikel` / `Save article` |
| 13 | `post-categories/index.ejs` (Header) | `Tambah Kategori` | `Tambah` | `Add` | `primary` | `plus` | `Tambah kategori berita` / `Add news category` |
| 14 | `post-categories/{create,edit}.ejs` | `&larr; Kembali` | `Kembali` | `Back` | `neutral` | `arrow-left` | `Kembali ke daftar kategori berita` / `Back to news categories` |
| 15 | `post-categories/{create,edit}.ejs` | `Simpan Kategori` / `Simpan Perubahan` | `Simpan` | `Save` | `primary` | `check` / `save` | `Simpan kategori berita` / `Save news category` |
| 16 | `inquiries/index.ejs` (Header) | `Ekspor CSV` | `Ekspor` | `Export` | `secondary` | `download` | `Ekspor data inquiry ke CSV` / `Export inquiries to CSV` |
| 17 | `inquiries/detail.ejs` (Header) | `Kembali ke Daftar Inquiry` | `Kembali` | `Back` | `neutral` | `arrow-left` | `Kembali ke daftar inquiry` / `Back to inquiry list` |
| 18 | `inquiries/detail.ejs` (Catatan/Balas) | `Simpan Catatan`, `Balas via Email`, `Hubungi via WhatsApp`, `Hapus Inquiry Ini` | `Simpan`, `Email`, `WhatsApp`, `Hapus` | `Save`, `Email`, `WhatsApp`, `Delete` | `primary`, `secondary`, `secondary`, `danger` (Q7) | `check`, `mail`, `message-circle`, `trash` | Deskriptif sesuai aksi |
| 19 | `dashboard.ejs` (Modal Inquiry) | `Tutup`, `Simpan Catatan` | `Batal`, `Simpan` | `Cancel`, `Save` | `neutral`, `primary` | `x-close`, `check` | `Tutup dialog`, `Simpan catatan inquiry` |
| 20 | `banners/index.ejs`, `banners/{create,edit}.ejs` | `Tambah Banner`, `&larr; Kembali ke Daftar`, `Simpan Banner` / `Simpan Perubahan` | `Tambah`, `Kembali`, `Simpan` | `Add`, `Back`, `Save` | `primary`, `neutral`, `primary` | `plus`, `arrow-left`, `check` | Deskriptif sesuai aksi |
| 21 | `hero-banners/index.ejs` | `Lihat Halaman`, `Simpan Banner <Halaman>` | `Pratinjau`, `Simpan` | `Preview`, `Save` | `secondary`, `primary` | `external-link`, `check` | `Lihat halaman publik`, `Simpan hero banner` |
| 22 | `brands/index.ejs`, `brands/{create,edit}.ejs` | `Tambah Merek`, `Simpan Judul Section`, `&larr; Kembali ke Daftar`, `Simpan Merek Baru` / `Simpan Perubahan` | `Tambah`, `Simpan`, `Kembali`, `Simpan` | `Add`, `Save`, `Back`, `Save` | `primary`, `primary`, `neutral`, `primary` | `plus`, `check`, `arrow-left`, `check` | Deskriptif sesuai aksi |
| 23 | `capabilities/index.ejs` | `Simpan Kapabilitas` | `Simpan` | `Save` | `primary` | `check` | `Simpan kapabilitas mesin` / `Save machine capability` |
| 24 | `about/index.ejs` | `Pratinjau Publik`, `Tambah Statistik`, `Tambah Milestone`, `Tambah Slide Galeri`, `Simpan Perubahan`, `Simpan Slide`, `Simpan Statistik`, `Simpan Milestone` | `Pratinjau`, `Tambah`, `Tambah`, `Tambah`, `Simpan`, `Simpan`, `Simpan`, `Simpan` | `Preview`, `Add`, `Add`, `Add`, `Save`, `Save`, `Save`, `Save` | `secondary`, `secondary`, `secondary`, `secondary`, `primary` | `external-link`, `plus`, `check` | Deskriptif sesuai konteks seksi |
| 25 | `home-content/index.ejs` | `Pratinjau Beranda`, `Simpan Perubahan` | `Pratinjau`, `Simpan` | `Preview`, `Save` | `secondary`, `primary` | `external-link`, `check` | `Pratinjau beranda publik`, `Simpan konten beranda` |
| 26 | `contact/index.ejs` | `Lihat Halaman Publik`, `Buka Pengaturan`, `Simpan Konten Kontak` | `Pratinjau`, `Pengaturan`, `Simpan` | `Preview`, `Settings`, `Save` | `secondary`, `secondary`, `primary` | `external-link`, `sliders`, `check` | Deskriptif sesuai aksi |
| 27 | `settings/index.ejs` | `Tambah Nomor WhatsApp`, `Reset Perubahan`, `Simpan Semua Pengaturan` | `Tambah Nomor`, `Reset`, `Simpan` | `Add Number`, `Reset`, `Save` | `secondary`, `neutral`, `primary` | `plus`, `rotate-ccw`, `check` | Deskriptif sesuai aksi |
| 28 | `media/index.ejs` & `media-picker-modal.ejs` | `Tautan YouTube`, `Unggah Berkas`, `Unggah Sekarang`, `Simpan Tautan YouTube`, `Pilih dari Media Library`, `Pilih Gambar`, `Pilih Poster`, `Pilih Foto Visi/Misi`, `Pilih Logo`, `Hapus`, `Salin URL`, `Gunakan Media Terpilih` | `YouTube`, `Unggah`, `Unggah`, `Simpan`, `Pilih Media`, `Hapus`, `Salin`, `Pilih` | `YouTube`, `Upload`, `Upload`, `Save`, `Select Media`, `Remove`, `Copy`, `Select` | `secondary`, `primary`, `primary`, `primary`, `secondary`, `danger` (Q7), `secondary`, `primary` | `video`, `upload`, `upload`, `check`, `image`, `trash`, `copy`, `check` | Deskriptif sesuai target media |
| 29 | `users/index.ejs`, `users/{create,edit}.ejs` | `Tambah Pengguna Baru`, `&larr; Kembali ke Daftar`, `Buat Akun Pengguna`, `Simpan Perubahan` | `Tambah`, `Kembali`, `Simpan`, `Simpan` | `Add`, `Back`, `Save`, `Save` | `primary`, `neutral`, `primary`, `primary` | `plus`, `arrow-left`, `check`, `check` | Deskriptif sesuai aksi |
| 30 | `login.ejs`, `change-password.ejs`, `403.ejs` | `Masuk ke Dashboard`, `Simpan Password Baru`, `Kembali ke Dashboard` | `Masuk`, `Simpan`, `Kembali` | `Sign In`, `Save`, `Back` | `primary`, `primary`, `neutral` | `log-in`, `check`, `arrow-left` | Deskriptif sesuai aksi |
| 31 | Seluruh Tabel Admin (`.btn-action-*`) & SweetAlert2 Konfirmasi Hapus | `Edit`, `Detail`, `Hapus`, `Ya, Hapus` | `Edit`, `Detail`, `Hapus`, `Hapus` | `Edit`, `Details`, `Delete`, `Delete` | `secondary` (sm), `secondary` (sm), `danger` (sm, Q7) | `edit`, `eye`, `trash`, `trash` | Deskriptif sesuai baris data |

---

## 4. Keputusan Terkunci Azis (Q1 s/d Q7)

Seluruh pertanyaan terbuka telah dijawab dan dikunci sebagai berikut:

1. **Q1 - Tombol Simpan Utama -> TERKUNCI: Opsi A dengan Token Hijau Lembut Daun (`--color-leaf-soft` / `--adm-btn-primary-bg`)**:
   - Menggunakan gaya `primary` solid dengan ikon di kiri, ukuran, radius, dan animasi mikro yang sama dengan acuan tombol tabel ukuran, namun warna latarnya bukan hijau primary gelap melainkan **hijau lembut daun (`#D1ECB9`)** yang didaftarkan sebagai token resmi `--color-leaf-soft` / `--adm-btn-primary-bg` di `Design/DESIGN.md`, `public/css/tokens.css`, dan `public/css/admin.css`.
   - Agar memenuhi standar kontras WCAG AA/AAA di atas latar `#D1ECB9`, warna teks dan ikon tombol `primary` menggunakan token gelap `var(--surface-dark-deep)` / `var(--text-main)` (rasio kontras **13.91:1 s/d 14.15:1 - Lulus WCAG AAA**), dengan border tipis `var(--adm-btn-primary-border)` dan state hover `var(--adm-btn-primary-hover-bg)`.
2. **Q2 - Tombol Batal / Kembali -> TERKUNCI: Opsi A**:
   - Menggunakan varian `neutral`/`ghost` abu-abu (`var(--text-secondary)`, latar `var(--bg-surface)`, border `var(--border-main)`) dengan ikon panah kiri (`arrow-left`) atau silang (`x-close`) di sisi kiri.
3. **Q3 - Lokasi Slug yang Diperbaiki & Bahasa Slug -> TERKUNCI: Opsi C, 1 Baris Slug Saja Tanpa Bullet & Tanpa Judul EN**:
   - Diperbaiki di daftar admin (`products/index.ejs`, `posts/index.ejs`, `brands/index.ejs`, `product-categories/index.ejs`, `post-categories/index.ejs`) dan form tambah/edit (`products/edit.ejs`, `posts/create.ejs`, `posts/edit.ejs`), serta diverifikasi pada halaman publik.
   - Hanya menampilkan **1 baris slug tunggal saja** tanpa bullet (`&bull;`), tanpa judul bahasa Inggris (`name_en`/`title_en`), dan tanpa prefix teks `slug:`.
4. **Q4 - Daftar Label Pendek (ID & EN) -> TERKUNCI: Disetujui**:
   - Seluruh pemendekan label tombol beserta terjemahan ID/EN dan `aria-label` pada tabel Bagian 3 disetujui sepenuhnya.
5. **Q5 - Kapan Validasi Form Berjalan -> TERKUNCI: Opsi A**:
   - Validasi dijalankan saat tombol **Submit** ditekan; setelah suatu field pernah mengalami error, validasi berjalan secara *live* (`input`/`change`) pada field tersebut agar pesan error langsung hilang begitu diperbaiki.
6. **Q6 - Sumber Favicon & Bentuk Visual -> TERKUNCI: Opsi B (dengan Fallback ke Opsi A), Simbol Logo Saja Tanpa Teks**:
   - Menyediakan kolom unggah/pilih khusus Favicon di Pengaturan Situs (dioptimalkan persegi `1:1`, menggunakan **simbol logo saja tanpa teks**), dengan fallback otomatis ke logo situs (`fit: 'contain'` + padding transparan) bila favicon khusus kosong.
7. **Q7 - Tombol Hapus (Varian Danger) -> TERKUNCI: Standarkan Sekarang**:
   - Seluruh tombol Hapus di tabel admin, Media Library/Media Picker, detail inquiry, dan tombol konfirmasi hapus di dalam modal SweetAlert2 distandarkan sekarang menggunakan varian `.adm-btn-danger`.

---

## 5. Rencana Task (Mulai T-255)

Seluruh pekerjaan dipecah secara vertikal menjadi 7 task terukur (`T-255` s/d `T-261`) yang telah disesuaikan dengan jawaban Q1 s/d Q7:

### T-255: Perbaikan Tampilan Slug di Admin Katalog Produk, Artikel Berita & Merek (Bug A1) *(diperbarui sesuai jawaban Q3)*
- **Ukuran**: S
- **Skill Terkait**: `polish`, `adapt`
- **Akar Masalah Dugaan**: Template `views/admin/products/index.ejs` (baris 77) dan `views/admin/posts/index.ejs` (baris 60) menggabungkan `name_en`/`title_en` dengan `&bull; <code>slug</code>` di dalam `.td-client-sub`, sehingga kata bahasa Inggris terulang bersama slug dan ikon bullet. Di `brands/index.ejs` (baris 81) terdapat prefix `slug: `, di `posts/{create,edit}.ejs` input `#slug` masih memakai inline style, dan di `products/edit.ejs` belum ada tampilan slug kanonik produk.
- **Deskripsi**: Membersihkan render slug pada tabel daftar Produk, Artikel Berita, Merek, dan Kategori serta pada form tambah/edit produk dan artikel (sesuai jawaban Q3: Opsi C, 1 baris saja tanpa bullet dan tanpa judul EN). Menggunakan class `.adm-slug-text` (untuk tabel daftar) dan `.adm-slug-input-group` / `.adm-slug-box` (untuk form) dengan tipografi monospace/muted berbasis token (`var(--font-mono)`, `var(--text-muted)`), `max-width` responsif, dan `text-overflow: ellipsis`. Tidak ada migrasi skema database; kolom `slug` (`VARCHAR(191)`) dan perilaku redirect 301 (`slug_redirects`) tetap utuh.
- **File Terdampak**:
  - `public/css/admin.css` (penambahan class `.adm-slug-text`, `.adm-slug-box`, dan `.adm-slug-input-group`)
  - `views/admin/products/index.ejs`
  - `views/admin/products/edit.ejs`
  - `views/admin/posts/index.ejs`
  - `views/admin/posts/create.ejs`, `views/admin/posts/edit.ejs`
  - `views/admin/brands/index.ejs`
  - `views/admin/product-categories/index.ejs`, `views/admin/post-categories/index.ejs`
- **Acceptance Criteria (AC)**:
  1. Pada daftar Produk (`products/index.ejs`), Artikel Berita (`posts/index.ejs`), dan Merek (`brands/index.ejs`), hanya tampil **1 baris slug tunggal** di bawah judul utama, tanpa bullet (`&bull;`), tanpa judul bahasa Inggris (`name_en`/`title_en`), dan tanpa prefix `slug:`.
  2. Pada form edit Produk (`products/edit.ejs`) tampil informasi slug kanonik satu baris (`.adm-slug-box`), dan pada form tambah/edit Artikel Berita (`posts/{create,edit}.ejs`) field `#slug` (`maxlength="191"`) tampil rapi menggunakan class `.adm-slug-input-group` tanpa inline style.
  3. Teks slug yang panjang otomatis terpotong dengan `text-overflow: ellipsis` (dilengkapi atribut `title` berisi slug penuh) tanpa merusak layout tabel dari viewport `320px` sampai desktop.
  4. Mekanisme pembuatan slug otomatis dan redirect 301 (`slug_redirects`) tetap berjalan tanpa perubahan.
- **Verifikasi**:
  - Uji tampilan `/admin/products`, `/admin/products/:id/edit`, `/admin/posts`, `/admin/posts/create`, `/admin/posts/:id/edit`, `/admin/brands`, `/admin/product-categories`, dan `/admin/post-categories` pada lebar `320px`, `768px`, dan `1440px`.

### T-256: Perbaikan Proporsi & Generator Multi-Ukuran Favicon di Pengaturan Situs serta Layout Publik/Admin (Bug A2) *(diperbarui sesuai jawaban Q6)*
- **Ukuran**: M
- **Skill Terkait**: `polish`
- **Akar Masalah Dugaan**: Pengaturan `site_favicon` mengambil URL aset dari Media Library yang di-resize dengan `fit: 'inside'` (mempertahankan rasio persegi panjang logo perusahaan yang memuat teks), lalu dirender langsung pada `<link rel="icon">` tunggal tanpa kanvas persegi `1:1`, sehingga browser memaksa gambar horizontal masuk ke kotak `16x16`/`32x32` dan membuatnya gepeng.
- **Deskripsi**: Memperbaiki pengelolaan dan pemrosesan favicon sesuai jawaban Q6 (Opsi B dengan fallback ke Opsi A, menggunakan simbol logo saja tanpa teks):
  1. Memperjelas kolom unggah/pilih khusus **Favicon Situs (Simbol Logo Persegi 1:1 Tanpa Teks)** di `views/admin/settings/index.ejs` terpisah dari Logo Utama, disertai opsi unggah langsung atau pilih dari Media Library dan pratinjau persegi `1:1`.
  2. Menambahkan fungsi generator `generateFaviconSet(sourcePath)` di `middleware/uploadMiddleware.js` menggunakan Sharp `fit: 'contain'`, latar transparan (`background: { r: 0, g: 0, b: 0, alpha: 0 }`), dan padding seimbang untuk menghasilkan paket PNG persegi (`16x16`, `32x32`, `180x180` apple-touch-icon, `192x192`, dan `512x512`) di `public/uploads/settings/`.
  3. Di `controllers/admin/settingController.js`, jika `site_favicon` diisi/diunggah, jalankan `generateFaviconSet` dari aset favicon tersebut; jika `site_favicon` dikosongkan, jalankan fallback otomatis dari `site_logo` (atau simbol logo default). Key disimpan di tabel `settings` (`setting_key`: `site_favicon`, `site_favicon_16`, `site_favicon_32`, `site_favicon_180`, `site_favicon_192`, `site_favicon_512` menggunakan struktur key-value `settings` yang sudah ada, **tanpa migrasi tabel baru**).
  4. Memperbarui tag `<link rel="icon">` dan `<link rel="apple-touch-icon">` lengkap dengan atribut `sizes` di seluruh layout publik dan admin.
- **File Terdampak**:
  - `middleware/uploadMiddleware.js`
  - `controllers/admin/settingController.js`
  - `views/admin/settings/index.ejs`
  - `views/partials/head.ejs`
  - `views/partials/admin-header.ejs`
  - `views/admin/login.ejs`
  - `views/admin/403.ejs`
- **Acceptance Criteria (AC)**:
  1. Pengaturan Situs memiliki input khusus Favicon (dengan petunjuk jelas: simbol logo persegi `1:1` tanpa teks) dan fallback otomatis ke logo situs bila favicon khusus kosong.
  2. Setiap penyimpanan favicon men-generate paket ikon persegi (`16x16`, `32x32`, `180x180`, `192x192`, `512x512`) menggunakan Sharp `fit: 'contain'` dengan latar transparan dan padding seimbang sehingga proporsi simbol asli tidak pernah gepeng.
  3. Tag `<link rel="icon" type="image/png" sizes="32x32">`, `<link rel="icon" type="image/png" sizes="16x16">`, `<link rel="apple-touch-icon" sizes="180x180">`, dan `<link rel="icon" type="image/png" sizes="192x192">` terpasang di `head.ejs` (publik), `admin-header.ejs`, `login.ejs`, dan `403.ejs`.
  4. Favicon tampil proporsional dan tajam di tab Chrome maupun Firefox pada mode terang dan gelap, baik di halaman publik maupun admin.
- **Verifikasi**:
  - Uji penyimpanan favicon khusus (simbol saja) dan uji fallback saat favicon dikosongkan di `/admin/settings`.
  - Periksa dimensi piksel aktual file hasil generate (`16x16`, `32x32`, `180x180`, `192x192`, `512x512`) dan tampilan tab browser di halaman publik serta admin.

### T-257: Fondasi CSS & Standarisasi Komponen Tombol Admin Terpadu `.adm-btn-*` beserta Animasi & Kontras WCAG AA *(diperbarui sesuai jawaban Q1, Q2, Q7)*
- **Ukuran**: M
- **Skill Terkait**: `polish`, `animate`, `adapt`
- **Deskripsi**: Mendaftarkan token warna tombol utama admin `--color-leaf-soft: #d1ecb9` (beserta token turunan `--adm-btn-primary-bg`, `--adm-btn-primary-hover-bg`, `--adm-btn-primary-border`, `--adm-btn-primary-text`) di `Design/DESIGN.md`, `public/css/tokens.css`, dan `public/css/admin.css` sesuai jawaban Q1, lalu membangun sistem komponen tombol admin terpadu berprefix `.adm-btn` di `public/css/admin.css` yang mengadopsi anatomi visual dan animasi `.btn-add-row` (editor tabel ukuran produk) tanpa menyentuh `.btn-secondary` milik halaman publik:
  - `.adm-btn-primary` (Q1: Opsi A dengan latar `var(--adm-btn-primary-bg)` `#D1ECB9`, teks & ikon gelap `var(--surface-dark-deep)` / `var(--text-main)` dengan kontras **13.91:1 s/d 14.15:1 AAA**, border tipis `var(--adm-btn-primary-border)`).
  - `.adm-btn-secondary` (Acuan tabel ukuran: latar `var(--bg-surface)`, border tipis `1px solid var(--border-main)`, teks & ikon hijau `var(--primary)` dengan kontras **5.66:1 AA**, hover `var(--primary-subtle)` dengan teks `var(--primary-hover)` **7.59:1 AAA**).
  - `.adm-btn-neutral` / `.adm-btn-ghost` (Q2: Opsi A, latar `var(--bg-surface)`, border `1px solid var(--border-main)`, teks & ikon abu-abu `var(--text-secondary)` dengan kontras **10.36:1 AAA**).
  - `.adm-btn-danger` (Q7: Standarkan sekarang, latar `var(--st-ditolak-bg)`, border `1px solid var(--st-ditolak-border)`, teks & ikon `var(--st-ditolak-text)` dengan kontras **7.02:1 AAA**).
  - Mendukung ukuran standar, `.adm-btn-sm` (untuk aksi tabel), `.adm-btn-block`, state `.is-loading` (spinner SVG), focus ring berbasis token, dan target sentuh `min-height: 44px` di layar mobile (`<= 768px`).
- **File Terdampak**:
  - `Design/DESIGN.md` (dokumentasi token `--color-leaf-soft` / `--adm-btn-primary-bg` dan komponen `.adm-btn-*`)
  - `public/css/tokens.css`
  - `public/css/admin.css`
- **Acceptance Criteria (AC)**:
  1. Tombol `.adm-btn-primary` menggunakan latar hijau lembut daun `var(--adm-btn-primary-bg)` (`#D1ECB9`) dengan teks/ikon gelap `var(--surface-dark-deep)` / `var(--text-main)` (rasio kontras **>= 13.9:1**, Lulus WCAG AAA).
  2. Tombol `.adm-btn-secondary` (teks `var(--primary)` di atas `var(--bg-surface)` = **5.66:1**), `.adm-btn-neutral` (**10.36:1**), dan `.adm-btn-danger` (**7.02:1**) seluruhnya memakai token resmi tanpa warna biru dan lulus WCAG AA.
  3. Animasi mikro hanya menggunakan properti `transform` dan `opacity`, dibungkus `@media (hover: hover)` untuk hover, memiliki state `:active` untuk layar sentuh, dan dinonaktifkan pada `@media (prefers-reduced-motion: reduce)`.
  4. Target sentuh memiliki tinggi minimal `44px` pada mobile (`<= 768px`).
  5. Class `.btn-secondary` di `public/css/components.css` untuk halaman publik tetap utuh 100%.
- **Verifikasi**:
  - Verifikasi rasio kontras WCAG AA/AAA pada keempat varian, uji state `:hover`, `:active`, `:focus-visible`, `:disabled`, `.is-loading`, dan simulasi `prefers-reduced-motion: reduce`.

### T-258: Migrasi Seluruh Tombol Halaman Admin, Modal, Tabel & Pemendekan Label ID/EN ke `.adm-btn-*` *(diperbarui sesuai jawaban Q1, Q2, Q4, Q7)*
- **Ukuran**: M
- **Skill Terkait**: `polish`, `adapt`
- **Deskripsi**: Mengganti seluruh pemakaian tombol lama (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-ghost`, `.btn-action-*`, `.btn-add-row`) di seluruh view EJS admin dan script pembentuk tombol dinamis (`admin-size-table.js`, `admin-settings.js`, `media-picker.js`) ke `.adm-btn-*` sesuai pemetaan varian Q1 (`primary` `#D1ECB9`), Q2 (`neutral` abu-abu), dan Q7 (`danger` merah). Memasang set ikon SVG inline yang seragam di sisi kiri serta menerapkan daftar label pendek dwibahasa ID/EN dan `aria-label` yang telah disetujui pada Q4.
- **File Terdampak**:
  - Seluruh view di `views/admin/**/*.ejs` (26 berkas view admin)
  - `views/partials/media-picker-modal.ejs`
  - `public/js/admin-size-table.js`
  - `public/js/admin-settings.js`
  - `public/js/media-picker.js`
- **Acceptance Criteria (AC)**:
  1. Tidak ada lagi tombol di area admin yang menggunakan `.btn-secondary` lama atau tombol tanpa ikon standar.
  2. Seluruh tombol Simpan memakai `.adm-btn-primary` (`#D1ECB9` via token), tombol Batal/Kembali/Reset memakai `.adm-btn-neutral`, tombol aksi umum/tambah baris/ekspor/pratinjau memakai `.adm-btn-secondary`, dan tombol Hapus memakai `.adm-btn-danger`.
  3. Seluruh label tombol di halaman, tabel, dan modal admin menggunakan label pendek ID/EN sesuai tabel Q4 dengan `aria-label` deskriptif.
- **Verifikasi**:
  - Pemeriksaan menyeluruh di seluruh `views/admin/` dan `public/js/admin*.js` memastikan nol pemakaian `.btn-secondary` lama di admin.
  - Uji tampilan tombol dalam bahasa ID dan EN di seluruh menu admin.

### T-259: Modul Validasi Formulir Admin Terpusat, Pesan Dwibahasa ID/EN, Auto-Open Tab & Integrasi Kontrol Kustom *(diperbarui sesuai jawaban Q5)*
- **Ukuran**: M
- **Skill Terkait**: `polish`, `adapt`
- **Deskripsi**: Membangun modul `public/js/admin-form-validation.js` dan menambahkan `novalidate` serta kelengkapan atribut batas karakter (`maxlength` sesuai skema kolom database: mis. `191` untuk judul/slug/nama produk & artikel, `100` untuk teks CTA banner, `500` untuk URL CTA, `150` untuk judul seksi merek) pada seluruh form admin untuk menggantikan tooltip validasi bawaan browser. Sesuai jawaban Q5 (Opsi A), validasi dijalankan saat tombol **Submit** ditekan, lalu berjalan secara *live* (`input`/`change`) per field setelah field tersebut pernah mengalami error. Mencakup validasi kontrol kustom (TinyMCE, Media Picker, select, repeater WhatsApp, dan editor tabel ukuran), membuka tab tersembunyi secara otomatis jika terdapat field error di dalamnya, memfokuskan & menggulir ke field error pertama, menampilkan error server-side dengan gaya yang sama, serta mengaktifkan loading state tombol submit untuk mencegah kirim ganda.
- **File Terdampak**:
  - `public/js/admin-form-validation.js` (baru)
  - `public/css/admin.css` (styling `.adm-field-error`, `.form-input.is-invalid`, `.form-select.is-invalid`, `.form-textarea.is-invalid`, `.media-picker-component.is-invalid`, `.tox-tinymce.is-invalid`)
  - `views/partials/admin-footer.ejs` & `views/admin/login.ejs`
  - Seluruh view form di `views/admin/**/*.ejs`
- **Acceptance Criteria (AC)**:
  1. Tidak ada lagi tooltip validasi bawaan browser (*"Please fill out this field."*) di seluruh form admin.
  2. Validasi berjalan tepat saat **Submit** ditekan, dan setelah suatu field berstatus error, perubahan nilai (`input`/`change`) pada field tersebut langsung memvalidasi ulang dan menghilangkan error seketika saat valid (Q5: Opsi A).
  3. Error tampil inline di bawah field dengan warna `var(--color-error)`, ikon kecil, border field merah dari token, `aria-invalid="true"`, dan `aria-describedby` yang terhubung ke ID elemen pesan error dalam bahasa ID dan EN.
  4. Jika field error berada di dalam tab yang sedang tertutup (`about/index.ejs`, `home-content/index.ejs`, `settings/index.ejs`), tab tersebut otomatis terbuka lalu halaman menggulir dan fokus ke field error pertama.
  5. Mencakup validasi TinyMCE, Media Picker, select, repeater WhatsApp, dan editor tabel ukuran, serta merender error dari server-side dengan gaya visual yang sama.
  6. Tombol submit masuk ke state `.is-loading` (`disabled`) saat form valid dikirim guna mencegah pengiriman ganda.
- **Verifikasi**:
  - Uji submit kosong dan perbaikan *live* per field pada form produk, artikel, kategori, banner, merek, kapabilitas, tentang kami (lintas tab), beranda (lintas tab), kontak, pengaturan, pengguna, media, login, dan ubah password dengan keyboard dan screen reader.

### T-260: Penggantian Seluruh Native `alert()`/`confirm()` dengan SweetAlert2 Bertema & Pembersihan Inline Handler Admin *(diperbarui sesuai jawaban Q7)*
- **Ukuran**: M
- **Skill Terkait**: `polish`
- **Deskripsi**: Mengaudit dan mengganti seluruh pemanggilan `alert()` dan `confirm()` native di script dan view admin (`public/js/admin-settings.js`, `public/js/admin-size-table.js`, `public/js/media-picker.js`, `public/js/admin.js`, `views/admin/dashboard.ejs`, `views/admin/inquiries/index.ejs`) menjadi dialog SweetAlert2 bertema token Euodoo. Sesuai jawaban Q7, seluruh tombol konfirmasi hapus di dalam popup SweetAlert2 wajib menggunakan komponen `.adm-btn .adm-btn-danger` (dengan ikon tempat sampah) dan tombol batal menggunakan `.adm-btn .adm-btn-neutral` (`buttonsStyling: false`). Sekaligus memindahkan event handler inline (`onclick`, `onchange`, `onsubmit`, `oninput`, `onerror`) pada view admin ke event listener terpusat yang patuh CSP tanpa inline handler baru.
- **File Terdampak**:
  - `public/js/admin.js`
  - `public/js/admin-settings.js`
  - `public/js/admin-size-table.js`
  - `public/js/media-picker.js`
  - `views/admin/dashboard.ejs`
  - `views/admin/inquiries/index.ejs`, `views/admin/inquiries/detail.ejs`
  - `views/admin/products/index.ejs`
  - `views/admin/posts/create.ejs`, `views/admin/posts/edit.ejs`
  - `views/admin/banners/create.ejs`, `views/admin/banners/edit.ejs`
  - `views/admin/media/index.ejs`
  - `views/admin/about/index.ejs`
- **Acceptance Criteria (AC)**:
  1. Nol pemanggilan `alert()` atau `confirm()` native di seluruh kode admin.
  2. Seluruh dialog konfirmasi hapus menggunakan SweetAlert2 bertema dengan tombol konfirmasi `.adm-btn .adm-btn-danger` dan tombol batal `.adm-btn .adm-btn-neutral` (Q7).
  3. Tidak ada lagi penambahan atau ketergantungan pada inline style maupun inline event handler (`onclick`, `onchange`, `onsubmit`, `oninput`) di template admin; sepenuhnya kompatibel dengan kebijakan CSP.
- **Verifikasi**:
  - Pemeriksaan kode memastikan tidak ada `alert(` atau `confirm(` di `public/js/admin*.js`, `public/js/media-picker.js`, dan `views/admin/`.
  - Uji dialog konfirmasi hapus pada tabel produk, artikel, kategori, banner, merek, kapabilitas, media, pengguna, baris/kolom tabel ukuran, dan nomor WhatsApp pengaturan.

### T-261: UI Polish, Adaptasi Mobile (320px-Desktop, Zoom 100/125/150%, Tinggi 600-768px) & Pengujian Regresi Menyeluruh (Bagian C) *(diperbarui sesuai jawaban Q1 s/d Q7)*
- **Ukuran**: S
- **Skill Terkait**: `polish`, `adapt`, `animate`
- **Deskripsi**: Melakukan pengecekan akhir konsistensi visual tombol `.adm-btn-*` (termasuk varian `primary` `#D1ECB9`, `secondary`, `neutral`, `danger`), tampilan slug satu baris, favicon simbol logo persegi, serta validasi form di seluruh menu admin pada level zoom `100%`, `125%`, dan `150%`, tinggi layar pendek `600px`-`768px` (memastikan bagian body modal dapat di-scroll dan footer modal berisi tombol Batal/Simpan selalu terlihat dan tidak terpotong), serta lebar viewport `320px` hingga desktop.
- **File Terdampak**:
  - `public/css/admin.css` (penyesuaian `max-height` dan `overflow-y: auto` pada `.admin-modal-card` / `.admin-modal-body` / `.media-picker-modal` untuk layar tinggi `600px`-`768px`)
- **Acceptance Criteria (AC)**:
  1. Pada tinggi layar `600px`-`768px` dan zoom `100%`/`125%`/`150%`, footer modal (`Batal` / `Simpan`) dan sticky action bar tetap terlihat serta dapat diakses tanpa terpotong viewport.
  2. Seluruh fungsi CRUD dan aksi admin (simpan, batal, tambah, hapus, ekspor CSV, unggah media, filter/reset) berjalan lancar dengan token CSRF tetap utuh.
  3. Responsif penuh dari `320px` sampai desktop dalam bahasa ID dan EN, favicon tampil proporsional di publik & admin, serta nol error pada console browser.
- **Verifikasi**:
  - Uji lintas menu admin pada viewport `320x600`, `768x600`, `1024x768`, dan `1440x900` dengan zoom `100%`, `125%`, `150%`.

---

## 6. Dampak Ukuran Modul & Usulan Pemecahan Sub-Modul

Sesuai aturan pada `AGENTS.md`, batas ukuran setiap berkas modul spesifikasi adalah maksimal **~8KB** dan `.agents/INDEX.md` maksimal **60 baris**:

| Berkas Modul | Ukuran Saat Ini | Estimasi Ukuran Setelah Merge | Status terhadap Batas ~8KB | Tindakan yang Diusulkan |
| :--- | :--- | :--- | :--- | :--- |
| `.agents/prd/admin-cms.md` | **4.9 KB** (85 baris) | ~6.4 KB (~105 baris) | Aman di bawah 8 KB | Tetap dalam satu berkas `prd/admin-cms.md` (menambahkan FR-29 & FR-30). |
| `.agents/prd/settings.md` | **4.0 KB** (43 baris) | ~4.5 KB (~48 baris) | Aman di bawah 8 KB | Tetap dalam satu berkas `prd/settings.md` (memperbarui detail FR-22). |
| `.agents/tech/settings.md` | **3.8 KB** (77 baris) | ~4.8 KB (~95 baris) | Aman di bawah 8 KB | Tetap dalam satu berkas `tech/settings.md`. |
| `.agents/tech/admin-cms.md` | **5.6 KB** (82 baris) | **~9.2 KB** (>135 baris) bila digabung | **Melewati batas ~8 KB** | **Pecah sub-modul baru `.agents/tech/admin-ui.md`** (~3.8 KB) khusus untuk spesifikasi teknis Standar Komponen UI Admin (`.adm-btn-*`, matriks varian/ikon/kontras, animasi mikro, modul validasi form terpusat `admin-form-validation.js`, dan dialog SweetAlert2). Berkas `tech/admin-cms.md` tetap ~5.7 KB dan merujuk ke `tech/admin-ui.md`. |
| `.agents/INDEX.md` | **55 baris** | **56 baris** (tambah 1 baris `tech/admin-ui.md`) | Aman di bawah 60 baris | Tambahkan 1 baris referensi `tech/admin-ui.md` pada tabel Peta Modul di Tahap 2 (MERGE). |

---

## 7. Rencana CLOSE (Tahap 4)

Saat seluruh task (`T-255` s/d `T-261`) selesai diimplementasikan dan diverifikasi pada Tahap 3:
1. **Pembaruan Tanggal Verifikasi (`Terakhir diverifikasi: 2026-10-31`)**:
   - `.agents/prd/admin-cms.md`
   - `.agents/tech/admin-cms.md`
   - `.agents/tech/admin-ui.md` (sub-modul baru)
   - `.agents/prd/settings.md`
   - `.agents/tech/settings.md`
   - `.agents/INDEX.md` (kolom *Terakhir Diverifikasi* untuk modul terkait)
2. **Penutupan Task di `.agents/3-TASKS.md`**:
   - Mengubah status `T-255` s/d `T-261` menjadi `[x]` dan memindahkannya ke `.agents/archive/TASKS-HISTORY.md` bila daftar task selesai telah melampaui ambang 20 item.
3. **Pengarsipan Proposal**:
   - Memindahkan `.agents/changes/2026-10-31_admin-polish-tombol-validasi.md` ke `.agents/archive/changes/2026-10-31_admin-polish-tombol-validasi.md`.
4. **Entri `.agents/CHANGELOG.md` (1 Baris)**:
   - `- 2026-10-31: Standarisasi komponen tombol (.adm-btn-*) & validasi formulir/dialog bertema di Dashboard Admin, perbaikan tampilan slug produk/berita, serta perbaikan proporsi multi-ukuran favicon (T-255 s/d T-261) -> prd/admin-cms.md, tech/admin-cms.md, tech/admin-ui.md, prd/settings.md, tech/settings.md`
