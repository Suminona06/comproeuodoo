# PRD: Website Company Profile PT Euodoo

- **Versi:** 2.0
- **Tech Stack:** Express.js + MySQL
- **Design Reference:** `Design/DESIGN.md` (Pacific Corporate & Energy)
- **Bahasa:** Indonesia dan Inggris (Dwibahasa)

---

## BAGIAN 1: Visi & Tujuan Produk

### Visi Produk
Menjadi wajah digital resmi PT Euodoo yang meyakinkan bagi klien B2B dan mitra industri, dengan menyajikan produk, kapabilitas, dan kredibilitas perusahaan dalam satu situs yang cepat, mudah diperbarui tim internal, dan siap melayani pengunjung Indonesia maupun internasional.

### Tujuan Utama
1. Menyediakan satu sumber informasi resmi perusahaan (profil, produk, merek terdaftar, berita, kontak) — indikator: seluruh halaman inti tayang dan 100% konten terkelola dari CMS.
2. Menghasilkan lead B2B terukur — indikator: setiap inquiry tercatat di database dengan status yang bisa dipantau dan diekspor tim sales.
3. Menjangkau mitra internasional — indikator: konten utama tersedia dalam Bahasa Indonesia dan Inggris dengan switch langsung di navbar.
4. Menjaga kecepatan dan keandalan akses — indikator: halaman termuat di bawah 2 detik pada koneksi 4G, target Lighthouse ≥ 90.
5. Memudahkan tim non-teknis memperbarui konten — indikator: perubahan berita/produk/banner/halaman dapat dipublikasikan tanpa deploy ulang.

### Value Proposition
- Konten dwibahasa (ID/EN) sejak versi pertama, bukan terjemahan tambahan di kemudian hari.
- Desain corporate-industrial premium mengikuti design system "Pacific Corporate & Energy".
- Admin panel ringan berbasis Express.js + MySQL, tim internal mengelola seluruh konten sendiri.
- SEO terkelola per halaman dan per artikel: meta title, meta description, slug, OG image, canonical, robots, JSON-LD.

---

## BAGIAN 2: User Persona

### Persona 1: Rian, Manajer Pengadaan di Perusahaan Consumer Goods
- **Usia/Pekerjaan:** 38 tahun, Manajer Pengadaan di perusahaan FMCG yang butuh komponen dan kemasan plastik.
- **Level Teknis:** Menengah (nyaman dengan web, spreadsheet, dan email bisnis).
- **Tujuan:** Menemukan produsen plastik yang bisa memenuhi spesifikasi material, toleransi cetak, dan volume produksi, lalu meminta penawaran.
- **Pain Points:** Katalog lama tidak mencantumkan kapasitas mesin, jenis material, atau standar mutu. Sulit menilai apakah pabrik sanggup memenuhi volume dan tenggat produksi.
- **Motivasi:** Ingin mengunci pemasok yang konsisten secara kualitas dan mutu, dengan respons cepat saat meminta penawaran atau sampel.

### Persona 2: Sari, Mitra Distributor dan Reseller Produk Plastik
- **Usia/Pekerjaan:** 45 tahun, Direktur Operasional distributor produk plastik untuk pasar regional.
- **Level Teknis:** Pemula hingga menengah (mengandalkan tim untuk hal teknis).
- **Tujuan:** Menilai apakah PT Euodoo layak menjadi principal, memahami lini produk dan kapasitas pasokan, lalu menjajaki kerja sama distribusi.
- **Pain Points:** Sulit menilai kapasitas pabrik dan rekam jejak dari materi pemasaran yang minim. Tidak ada channel resmi untuk mengajukan kemitraan atau reseller.
- **Motivasi:** Ingin bermitra dengan produsen yang transparan soal kapasitas, jaminan pasokan, dan dukungan purna jual.

Catatan: nama dan detail persona di atas bersifat ilustratif untuk perancangan. Profil pelanggan sebenarnya perlu dikonfirmasi tim PT Euodoo.

---

## BAGIAN 3: Arsitektur Halaman

### 3.1 Elemen Global

**Header (Navbar)**
- Logo PT Euodoo
- Menu: Homepage, About Us, Produk, News, Kontak
- Switch bahasa EN/ID
- CTA utama (Minta Penawaran)

**Footer**
- Alamat kantor pusat
- Alamat pabrik
- Embed Google Maps
- Menu navigasi (mirror navbar)
- CTA kontak (telepon, email, WhatsApp)
- Copyright dan legal

**Floating Button WhatsApp**
- Tampil di semua halaman publik, posisi kanan bawah
- Tema visual mengikuti design system situs
- Nomor diambil dari pengaturan situs (tabel `settings`)
- Pesan otomatis bisa dikonfigurasi admin
- Disembunyikan otomatis jika nomor belum diisi
- Tidak menutupi elemen interaktif lain di layar ponsel

### 3.2 Halaman Publik

#### 1. Homepage
Urutan section dari atas ke bawah:
1. **Hero Slider** - gambar atau video, tinggi 90vh, caption teks di kiri dengan 1 tombol CTA
2. **Company Intro** - pengenalan singkat perusahaan
3. **Produk Unggulan (4 Kategori Primer)** - [DIPERBARUI per 2026-10-19: 4 panel kategori primer vertikal selebar kontainer tanpa jarak (0 gap), menggantikan layout bento grid 2x2 produk lama; deep link ke katalog produk per kategori]
4. **Why Choose Us / Kenapa Memilih Kami** - [DIPERBARUI per 2026-10-19: layout editorial asimetris 2-kolom dengan callout solid dan kartu artbox ilustrasi SVG ramah lingkungan statis, menggantikan layout 3 kartu pilar lama]
5. **Our Brands** - showcase merek-merek terdaftar milik perusahaan
6. **News Terbaru** - 3 artikel berita terbaru
7. **CTA Kontak** - ajakan menghubungi perusahaan

#### 2. Tentang Kami (About Us)
Urutan section:
1. **Hero** — banner visual dengan judul halaman
2. **Penjelasan Perusahaan** — narasi profil dan sejarah
3. **Visi & Misi** — pernyataan visi dan misi perusahaan
4. **Core Values** — nilai-nilai inti yang dipegang perusahaan
5. **Ajakan Kerja Sama** — CTA untuk kemitraan atau pengadaan

#### 3. Produk
**Halaman Katalog:**
1. **Hero** — banner visual
2. **Grid Produk** — tampilan semua produk dengan:
   - Filter kategori
   - Pencarian (search)
   - Card produk (nama, gambar, kategori)

**Halaman Detail Produk:**
- Galeri foto produk (multiple images)
- Data varian produk
- Spesifikasi teknis dan material
- **Harga TIDAK ditampilkan**
- Tombol "Minta Penawaran" → membuka `wa.me` dengan pesan otomatis berisi nama produk + URL halaman

#### 4. News
Urutan section:
1. **Headline Slider** — 3 berita utama dalam slider
2. **3 Tab Konten:**
   - **Tab Berita** — filter kategori, 9 item per halaman + pagination
   - **Tab Siaran Pers** — search, daftar siaran pers
   - **Tab Blog** — filter kategori, 9 item per halaman + pagination

#### 5. Kontak
Layout dua kolom:
- **Kiri:** Form kontak (nama, perusahaan, email, telepon, pesan)
- **Kanan:** Informasi alamat kantor + pabrik, embed Google Maps

---

## BAGIAN 4: User Stories

### Modul 1: Kunjungan Publik & Navigasi
- Sebagai pengunjung, saya ingin melihat profil perusahaan di halaman beranda, agar cepat menilai apakah PT Euodoo cocok sebagai pemasok.
- Sebagai pengunjung, saya ingin berpindah antar halaman lewat navigasi yang jelas (Homepage, About Us, Produk, News, Kontak), agar menemukan informasi tanpa tersesat.
- Sebagai pengunjung internasional, saya ingin mengganti bahasa ke Inggris via switch di navbar, agar memahami konten sesuai preferensi saya.
- Sebagai pengunjung, saya ingin membuka situs dari ponsel dengan nyaman (hamburger menu, CTA tidak mentok), agar bisa menelusuri saat di lapangan.
- Sebagai pengunjung, saya ingin melihat merek-merek terdaftar milik PT Euodoo di beranda, agar mengetahui portofolio brand perusahaan.

### Modul 2: Produk & Katalog
- Sebagai manajer pengadaan, saya ingin melihat daftar produk dengan filter kategori dan pencarian, agar bisa mencocokkan dengan kebutuhan produksi.
- Sebagai manajer pengadaan, saya ingin melihat detail spesifikasi, varian, dan galeri foto produk, agar yakin produk memenuhi standar.
- Sebagai manajer pengadaan, saya ingin menekan tombol "Minta Penawaran" yang langsung membuka WhatsApp dengan pesan berisi nama produk dan URL, agar proses permintaan cepat.
- Sebagai mitra distributor, saya ingin melihat lini produk per kategori, agar menilai kecocokan portofolio distribusi.

### Modul 3: News & Konten
- Sebagai pengunjung, saya ingin membaca berita, siaran pers, dan blog perusahaan di halaman News, agar mengetahui aktivitas dan perkembangan PT Euodoo.
- Sebagai pengunjung, saya ingin memfilter berita berdasarkan kategori dan menelusuri halaman per halaman (9 per halaman), agar tidak kewalahan informasi.
- Sebagai pengunjung, saya ingin mencari siaran pers tertentu, agar langsung menemukan rilis yang saya butuhkan.

### Modul 4: Lead & Kontak
- Sebagai manajer pengadaan, saya ingin mengisi formulir kontak untuk meminta penawaran, agar bisa memulai proses pengadaan.
- Sebagai pengunjung, saya ingin menghubungi perusahaan lewat floating button WhatsApp di halaman mana pun, agar bisa langsung bertanya tanpa mencari halaman kontak.
- Sebagai pengunjung, saya ingin melihat alamat kantor dan pabrik beserta peta di halaman kontak, agar mengetahui lokasi perusahaan.

### Modul 5: Autentikasi Admin
- Sebagai admin, saya ingin login dengan email dan password, agar bisa mengakses panel pengelolaan.
- Sebagai admin, saya ingin sesi JWT yang kedaluwarsa setelah 1 jam, agar keamanan akses terjaga.
- Sebagai admin, saya ingin mengganti password, agar akun tetap aman.

### Modul 6: Manajemen Konten (CMS)
- Sebagai admin, saya ingin mengelola banner/slider hero beranda, agar tampilan depan mengikuti kampanye terbaru.
- Sebagai admin, saya ingin mengelola halaman statis (About Us), agar konten profil perusahaan selalu akurat.
- Sebagai admin, saya ingin mengelola produk (kategori, varian, spesifikasi, galeri), agar katalog online selalu lengkap.
- Sebagai admin, saya ingin mengelola artikel news (berita, siaran pers, blog, kategori), agar situs tetap aktif dan relevan.
- Sebagai admin, saya ingin mengelola data Brands (merek terdaftar), agar showcase merek selalu terbaru.
- Sebagai admin, saya ingin mengelola media library (upload, lihat, hapus), agar aset gambar/video terorganisir.
- Sebagai admin, saya ingin melihat daftar inquiry masuk, mengubah status, dan mengekspor ke CSV, agar tidak ada permintaan yang terlewat.
- Sebagai admin, saya ingin mengatur pengaturan situs (nomor WA, alamat, kontak, tema floating button), agar informasi publik selalu benar.
- Sebagai superadmin, saya ingin mengelola user admin lain dan mengatur role, agar akses CMS terkontrol.

### Modul 7: SEO Terkelola
- Sebagai admin, saya ingin mengisi meta title, meta description, slug, OG image, canonical, robots index/noindex, dan JSON-LD di setiap artikel dan produk, agar SEO teroptimasi.
- Sebagai admin, saya ingin sitemap.xml dan robots.txt tergenerate otomatis, agar crawler mesin pencari dapat mengindeks seluruh halaman.

---

## BAGIAN 5: Functional Requirements

### Modul 1: Autentikasi & Otorisasi Admin

**FR-01: Login Admin**
- **Input:** Email, password.
- **Proses:** Cek kredensial terhadap tabel `users`, verifikasi hash password (bcrypt), buat sesi JWT.
- **Output:** Token sesi (JWT), redirect ke dashboard admin.
- **Aturan:** 5 kali gagal berturut-turut diblokir 15 menit. JWT kedaluwarsa 1 jam.

**FR-02: Logout Admin**
- **Input:** Permintaan logout dari admin yang login.
- **Proses:** Hapus token sesi di sisi klien dan catat waktu logout.
- **Output:** Redirect ke halaman login.
- **Aturan:** Endpoint logout butuh token valid.

**FR-03: Ganti Password**
- **Input:** Password lama, password baru, konfirmasi.
- **Proses:** Verifikasi password lama, hash password baru, simpan ke DB.
- **Output:** Notifikasi berhasil, password lama tidak berlaku lagi.
- **Aturan:** Password baru minimal 8 karakter.

**FR-04: Role-Based Access Control**
- **Input:** Role user (`superadmin`, `admin`, `editor`).
- **Proses:** Middleware memeriksa role pada setiap request ke rute admin yang terproteksi.
- **Output:** Akses diberikan atau ditolak sesuai hak role.
- **Aturan:**
  - **Superadmin:** akses penuh ke semua modul, termasuk manajemen users dan pengaturan situs.
  - **Admin:** akses penuh ke semua konten (produk, artikel, banner, brands, media, inquiry) dan export data.
  - **Editor:** kelola artikel (berita, siaran pers, blog) saja, tanpa akses users dan settings.

### Modul 2: Halaman Publik & Navigasi

**FR-05: Render Halaman Publik**
- **Input:** Permintaan URL halaman (beranda, produk, tentang, kontak, news).
- **Proses:** Ambil konten dari MySQL, render via EJS template engine.
- **Output:** Halaman HTML lengkap dengan SEO meta tags.
- **Aturan:** Halaman tidak ada mengembalikan 404 dengan halaman kustom.

**FR-06: Pilih Bahasa**
- **Input:** Pilihan bahasa (ID/EN) via switch di navbar.
- **Proses:** Simpan preferensi bahasa di cookie, muat konten sesuai kolom bahasa.
- **Output:** Halaman dengan konten bahasa terpilih.
- **Aturan:** Bahasa default Indonesia. Konten yang belum diterjemahkan menampilkan versi Indonesia dengan label. Tag hreflang otomatis di-generate.

### Modul 3: Produk & Katalog

**FR-07: Daftar Produk dengan Filter & Search**
- **Input:** Filter kategori (opsional), keyword pencarian (opsional).
- **Proses:** Query tabel `products` dengan kondisi status published dan filter aktif.
- **Output:** Grid produk dengan nama, gambar utama, dan kategori.
- **Aturan:** Produk draft/archived tidak tampil di halaman publik.

**FR-08: Detail Produk**
- **Input:** Slug produk.
- **Proses:** Ambil data produk, varian, spesifikasi, dan galeri gambar.
- **Output:** Halaman detail tanpa harga, dengan tombol "Minta Penawaran" → membuka `wa.me/<nomor>` dengan pesan otomatis: nama produk + URL halaman.
- **Aturan:** Slug unik. Harga tidak ditampilkan di mana pun.

**FR-09: Export Produk ke CSV**
- **Input:** Permintaan export dari admin (role admin atau superadmin).
- **Proses:** Query seluruh produk, format ke CSV.
- **Output:** File CSV yang diunduh browser.
- **Aturan:** Hanya role admin dan superadmin yang dapat mengekspor.

### Modul 4: Banner Hero & Media

**FR-10: Tampil Banner Hero Slider**
- **Input:** Permintaan halaman beranda.
- **Proses:** Ambil banner aktif diurutkan sesuai `sort_order`.
- **Output:** Hero slider 90vh menampilkan gambar atau video dengan caption di kiri dan 1 CTA.
- **Aturan:** Hanya banner berstatus aktif yang tampil. Video harus punya poster image sebagai fallback.

**FR-11: Kelola Banner (Gambar & Video)**
- **Input:** File gambar (JPG, PNG, WebP) atau video (MP4, WebM), judul, link opsional.
- **Proses:** Validasi tipe dan ukuran file, simpan ke storage (local atau S3/CDN sesuai config), catat metadata ke tabel `banners`.
- **Output:** Banner baru masuk daftar dan tampil di hero bila aktif.
- **Aturan:** Gambar maksimal 5MB, video maksimal 30MB. Validasi MIME type, bukan hanya ekstensi.

### Modul 5: News (Berita, Siaran Pers, Blog)

**FR-12: Tampil Halaman News**
- **Input:** Permintaan halaman News dengan pilihan tab (Berita, Siaran Pers, Blog).
- **Proses:** Query artikel berdasarkan tipe, status published, filter kategori (berita/blog), atau search (pers).
- **Output:** Headline slider (3 berita utama) + 3 tab konten, 9 item per halaman dengan pagination.
- **Aturan:** Hanya artikel published yang tampil. Berita dan Blog memiliki filter kategori. Siaran Pers memiliki search.

**FR-13: CRUD Artikel (Berita, Siaran Pers, Blog)**
- **Input:** Judul, isi, gambar sampul, tipe (berita/pers/blog), kategori, status.
- **Proses:** Simpan ke tabel `posts`, bisa disimpan sebagai draft, scheduled, atau langsung published.
- **Output:** Artikel tampil di halaman news sesuai status dan tanggal.
- **Aturan:** Draft tidak tampil di publik. Scheduled dipublikasikan otomatis sesuai tanggal. Rich text dasar.

### Modul 6: Lead & Kontak

**FR-14: Form Kontak**
- **Input:** Nama, perusahaan, email, telepon, pesan.
- **Proses:** Validasi field wajib, simpan ke tabel `inquiries` dengan status `baru`.
- **Output:** Pesan konfirmasi di halaman dan notifikasi email ke tim sales.
- **Aturan:** Email harus valid. Proteksi anti-spam (honeypot + rate limit per IP). Inquiry juga dikirim ke email.

**FR-15: Floating Button WhatsApp**
- **Input:** Nomor WhatsApp dari tabel `settings`.
- **Proses:** Render tombol mengambang di sudut kanan bawah pada semua halaman publik, tautan format `wa.me/<nomor>` dengan pesan awal opsional.
- **Output:** Tombol WhatsApp tetap terlihat saat halaman digulir, tema mengikuti design system situs.
- **Aturan:** Nomor diambil dari `settings` (`whatsapp_number`). Tombol disembunyikan otomatis jika nomor belum diisi. Tidak menutupi elemen interaktif lain di layar ponsel.

**FR-16: Kelola Inquiry (CMS)**
- **Input:** Daftar inquiry dengan filter status.
- **Proses:** Admin melihat list + detail, mengubah status (`baru` → `dibaca` → `ditindaklanjuti`).
- **Output:** Daftar inquiry dengan status terbaru, bisa diekspor CSV.
- **Aturan:** Riwayat perubahan status tersimpan. Hanya role admin dan superadmin.

### Modul 7: Brands (Diperbarui v4; Format Kartu [DEPRECATED per 2026-10-20])

**FR-17: Tampil Our Brands**
- **Status Tampilan:** *[DEPRECATED / USANG per 2026-10-20]* Format kartu logo dengan nama di bawah dipensiunkan, digantikan oleh Strip Marquee (.brand-strip-*) pada Bab 16 dengan fitur modal zoom preview dipertahankan aktif.
- **Input:** Permintaan halaman beranda (section brands).
- **Proses:** Query tabel `brands` yang aktif (`is_active = 1`), urutkan sesuai `sort_order`.
- **Output:** Strip marquee logo kontinu minimalis bersih tanpa bingkai kartu dan tanpa teks nama di bawah logo.
- **Aturan:**
  1. Hanya brand aktif yang tampil di beranda publik.
  2. Logo diperbesar seragam (`object-fit: contain`) dalam strip kontinu dengan ujung memudar (gradient mask).
  3. Nama merek tidak tampil visual di bawah logo, tetapi wajib disematkan pada atribut `alt` dan `aria-label` untuk aksesibilitas WCAG AA.
  4. Animasi transform otomatis jeda saat hover/fokus, dengan fallback statis tertata pada preferensi reduced motion.

**FR-18: CRUD Brands (CMS)**
- **Input:** Nama brand, logo (unggah langsung atau pilih dari Media Library), nomor urut tampil, status aktif (serta deskripsi dwibahasa untuk arsip data/katalog).
- **Proses:** Simpan dan perbarui data ke tabel `brands`. Berkas logo dikompresi ke WebP saat upload atau ditautkan langsung dari Media Library picker.
- **Output:** Brand tampil di beranda sesuai urutan dan status aktif.
- **Aturan:** Logo terkompresi WebP. Validasi nama wajib diisi. Dampak kolom deskripsi pada form admin dan tabel database dijelaskan pada Tech Spec v4.

### Modul 8: Media Library

**FR-19: Kelola Media**
- **Input:** File gambar atau video.
- **Proses:** Upload ke storage driver (local filesystem atau S3/CDN, dikonfigurasi via `.env`). Gambar otomatis dikonversi ke WebP saat upload. YouTube embed didukung via URL.
- **Output:** Media tersimpan di library, tersedia untuk dipakai di produk, artikel, banner, atau halaman.
- **Aturan:** Driver storage bisa diganti via konfigurasi tanpa ubah kode. Lazy loading untuk semua gambar.

### Modul 9: SEO Terkelola

**FR-20: SEO Fields per Konten**
- **Input:** Meta title, meta description, slug, OG image, canonical URL, robots (index/noindex), JSON-LD schema.
- **Proses:** Admin mengisi field SEO di form artikel, produk, dan halaman. Jika kosong, sistem generate otomatis dari judul dan deskripsi konten.
- **Output:** Meta tags dan structured data terrender di `<head>` setiap halaman.
- **Aturan:** Slug unik. JSON-LD mengikuti schema.org (Product, Article, Organization).

**FR-21: Sitemap & Robots Otomatis**
- **Input:** Seluruh halaman publik, produk published, dan artikel published.
- **Proses:** Generate `sitemap.xml` dan `robots.txt` secara otomatis setiap ada perubahan konten.
- **Output:** File sitemap.xml dan robots.txt yang up-to-date di root domain.
- **Aturan:** Halaman dengan robots `noindex` tidak dimasukkan ke sitemap. Hreflang tags untuk ID/EN.

### Modul 10: Pengaturan Situs & Users

**FR-22: Pengaturan Situs**
- **Input:** Nama perusahaan, alamat kantor, alamat pabrik, telepon, nomor WhatsApp, email, pesan awal WhatsApp, tautan sosial media, konfigurasi tema floating button.
- **Proses:** Simpan ke tabel `settings` sebagai key-value, validasi format nomor WhatsApp.
- **Output:** Perubahan langsung berlaku di seluruh halaman publik.
- **Aturan:** Hanya superadmin yang bisa mengubah settings.

**FR-23: Manajemen Users**
- **Input:** Data user (nama, email, password, role).
- **Proses:** CRUD user admin dengan assignment role.
- **Output:** User baru bisa login sesuai hak akses role-nya.
- **Aturan:** Hanya superadmin. Minimal 1 superadmin harus ada. Password di-hash bcrypt.

### Modul 11: CMS Sidebar Structure

Menu sidebar admin (urutan):
1. **Dashboard** — jumlah artikel/berita/pers published, jumlah inquiry, jumlah produk, shortcut menu, status sistem
2. **Banner/Slider** — kelola hero carousel
3. **Halaman** — kelola halaman statis (About Us, dll)
4. **Produk** — kategori, varian, spesifikasi, galeri
5. **News** — berita, siaran pers, blog, kategori
6. **Brands** — merek terdaftar perusahaan
7. **Inquiry** — list + detail + status + export CSV
8. **Media** — media library (upload, browse, delete)
9. **Pengaturan Situs** — kontak, alamat, WhatsApp, floating button config
10. **Users** — manajemen user dan role (superadmin only)

---

## BAGIAN 6: Non-Functional Requirements

### Performa
- Waktu muat halaman < 2 detik pada koneksi 4G.
- Respons API < 500ms untuk endpoint data.
- Gambar otomatis dikonversi ke WebP saat upload.
- Lazy loading untuk semua gambar.
- Video hero dimuat dengan `preload="metadata"` dan poster image.
- Target Lighthouse ≥ 90 (Performance, SEO, Accessibility, Best Practices).
- Mendukung minimal 500 pengunjung bersamaan.

### Keamanan
- Password admin di-hash dengan bcrypt.
- HTTPS wajib di produksi, redirect otomatis dari HTTP.
- JWT kedaluwarsa dalam 1 jam dan divalidasi di setiap endpoint admin.
- Validasi dan sanitasi semua input form untuk mencegah SQL injection dan XSS.
- Query memakai prepared statement.
- Upload file divalidasi dari MIME type dan ukuran.
- Rate limit pada endpoint login dan form inquiry.
- CSRF token pada form admin.
- Role-based access control: superadmin, admin, editor.

### SEO & Aksesibilitas
- Setiap halaman punya meta title, meta description, OG tags, dan JSON-LD.
- URL bersih berbasis slug.
- `sitemap.xml` dan `robots.txt` otomatis, hreflang ID/EN.
- Struktur heading berurutan (H1 tunggal per halaman).
- Atribut `alt` wajib pada gambar.
- Kontras teks WCAG AA (rasio minimal 4.5:1).
- Target sentuh minimal 44px.

### Status Konten
- **Artikel (berita, siaran pers, blog):** `draft` → `scheduled` → `published`
- **Produk:** `draft` → `published` → `archived`
- **Banner:** `active` / `inactive`
- **Brand:** `active` / `inactive`

### Media
- Upload: local filesystem atau S3/CDN (driver storage bisa diganti via konfigurasi `.env`)
- YouTube embed didukung via URL
- Gambar otomatis dikonversi ke WebP saat upload
- Lazy loading pada semua gambar

### Skalabilitas
- Arsitektur Express.js stateless, siap di belakang load balancer.
- Session token stateless (JWT).
- Index database pada kolom yang sering di-query (slug, status, kategori, tanggal).

### Usability
- Responsif penuh: desktop, tablet, mobile.
- Bahasa Indonesia dan Inggris.
- Navigasi bisa diakses lewat keyboard.
- Setiap halaman data punya kondisi kosong, loading, dan error.

### Maintainability
- Kode modular: routes, controllers, models, views terpisah.
- Konfigurasi dari environment variable.
- Migrasi database versi terkontrol.
- Backup database otomatis harian.

---

## BAGIAN 7: Out of Scope & Dependensi

### Out of Scope (Tidak Dikerjakan di V1)
- E-commerce dan keranjang belanja — ditunda ke v2.
- Customer portal dan login pelanggan — ditunda ke v2.
- Pembuatan quotation otomatis dan PDF — ditunda ke v2.
- Integrasi ERP atau sistem inventory — ditunda ke v2.
- Payment gateway — ditunda ke v2.
- Live chat selain floating WhatsApp — ditunda ke v2.
- Multi-currency dan kalkulator harga — ditunda ke v2.
- Komentar publik pada artikel — ditunda ke v2.
- Dashboard analitik lanjutan — v1 hanya memakai alat analitik pihak ketiga.
- Halaman karir/recruitment — ditunda ke v2.
- Multi-tenant / multi-company — ditunda ke v2.

### Dependensi
- Express.js — framework web dan routing.
- MySQL 8 — database utama.
- mysql2 — driver koneksi database.
- EJS — template engine server-side rendering.
- multer — upload gambar dan video.
- sharp — resize dan konversi WebP saat upload.
- bcryptjs — hash password admin.
- jsonwebtoken — sesi admin (JWT, 1 jam expiry).
- helmet, express-rate-limit, dan CSRF middleware — keamanan.
- nodemailer — notifikasi email inquiry.
- @aws-sdk/client-s3 (opsional) — driver upload ke S3/CDN.
- dotenv — konfigurasi environment.
- Design system `Design/DESIGN.md` (Pacific Corporate & Energy) — acuan desain.

### Infrastruktur
- VPS atau hosting Node.js (Jagoanhosting cPanel).
- Domain resmi PT Euodoo.
- Sertifikat SSL/TLS.
- Penyimpanan file (lokal atau S3/CDN).
- Layanan SMTP untuk email notifikasi.

### Asumsi
- Pengunjung punya koneksi internet yang stabil.
- Tim PT Euodoo menyediakan materi asli: profil perusahaan, data produk, spesifikasi, foto, logo, dan video.
- Nomor WhatsApp resmi dan email sales tersedia.
- Konten diterjemahkan ke Inggris oleh tim PT Euodoo atau penerjemah.
- Admin punya akses browser modern.
- Status inquiry: `baru` → `dibaca` → `ditindaklanjuti`.
- Status produk: `draft` → `published` → `archived`.
- Role editor hanya bisa mengelola artikel, tanpa akses users dan settings.

---

## BAGIAN 8: Revisi Admin v1 (Fitur Baru)

Bagian ini mendokumentasikan spesifikasi kebutuhan untuk pembaruan fitur baru pada Admin Panel CMS dan Antarmuka Publik (Item 3 s/d 8).

### 8.1 Menu CMS Halaman Kontak / Inquiry (Item 3)
- **Deskripsi:** Menu dedicated pada CMS Admin untuk mengelola seluruh konten dan teks pada halaman publik `/contact`, mencakup alamat kantor/pabrik, email, hotline telepon, jam kerja, link peta embed, serta teks pengantar form inquiry secara bilingual (ID & EN).
- **Acceptance Criteria:**
  - Admin (Superadmin & Admin) dapat mengakses menu CMS Kontak di `/admin/contact`.
  - Terdapat input formulir dwibahasa untuk alamat, jam operasional kerja, judul form inquiry, dan subjudul/deskripsi form inquiry.
  - Terdapat input untuk email kontak resmi, nomor telepon, dan URL embed Google Maps.
  - Perubahan yang disimpan langsung ter-render pada halaman publik `/contact` sesuai bahasa aktif (`?lang=id` atau `?lang=en`).
  - Memiliki fallback default yang aman jika salah satu data belum diisi di database.

### 8.2 Pengaturan Situs: Upload Favicon (Item 4)
- **Deskripsi:** Fitur upload berkas favicon kustom pada CMS Pengaturan Situs (`/admin/settings`) dengan pratinjau langsung dan pembaruan otomatis pada seluruh tag `<link rel="icon">` di antarmuka publik maupun admin.
- **Acceptance Criteria:**
  - Form Pengaturan Situs memiliki input berkas upload favicon (format `.ico`, `.png`, `.svg` maksimal 2MB).
  - Berkas favicon tersimpan pada direktori penyimpanan publik (`/uploads/settings/`).
  - Tag `<link rel="icon">` pada `views/partials/header.ejs` dan `views/partials/admin-header.ejs` memuat favicon hasil upload.
  - Tersedia fallback ke favicon default (`/favicon.ico`) jika belum ada favicon yang diunggah.

### 8.3 Pengaturan Situs: Upload Logo Header & Logo Footer Terpisah (Item 5)
- **Deskripsi:** Pemisahan pengaturan logo situs pada CMS Pengaturan Situs menjadi dua entitas mandiri: Logo Header (latar terang/transparan) dan Logo Footer (kontras latar gelap/navy), masing-masing dengan fallback logo default.
- **Acceptance Criteria:**
  - Form Pengaturan Situs menyediakan 2 field upload terpisah: `Logo Header` dan `Logo Footer`.
  - Admin dapat mengunggah berkas gambar WebP/PNG/SVG untuk masing-masing logo dengan pratinjau thumbnail.
  - Navbar publik menggunakan `site_logo_header`, dan footer publik menggunakan `site_logo_footer`.
  - Jika salah satu atau kedua logo kosong, sistem otomatis menggunakan logo fallback default (`/images/brands/brand-euodoo.webp`).

### 8.4 Artikel: Custom URL (Slug) Editable & Redirect 301 (Item 6)
- **Deskripsi:** Fasilitas pengeditan URL slug pada form artikel/berita (`/admin/posts`), dilengkapi generator otomatis berbasis judul, validasi ketat format URL-friendly, pengecekan keunikan, serta sistem pencatatan redirect 301 untuk slug lama.
- **Acceptance Criteria:**
  - Form tambah artikel meng-generate slug otomatis dari `title_id` secara real-time, dan user dapat mengeditnya secara manual.
  - Form edit artikel menampilkan slug yang sedang aktif dan memperbolehkan perubahan slug.
  - Validasi karakter hanya mengizinkan huruf kecil, angka, dan tanda hubung (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
  - Slug wajib unik di tabel `posts` (kecuali untuk ID artikel itu sendiri saat update).
  - Ketika slug artikel diubah, sistem mencatat riwayat pemetaan `old_slug` ke `new_slug` di tabel `slug_redirects`.
  - Akses publik ke URL lama `/news/:oldSlug` otomatis dialihkan dengan status HTTP 301 (Permanent Redirect) ke `/news/:newSlug`.

### 8.5 Form Inquiry: Proteksi Cloudflare Turnstile (Item 7)
- **Deskripsi:** Pengamanan formulir pengiriman inquiry/RFQ dari serangan spam dan bot otomatis menggunakan Cloudflare Turnstile CAPTCHA yang ramah privasi dan nir-interupsi pengguna.
- **Acceptance Criteria:**
  - Client-side render widget Cloudflare Turnstile pada form `/contact` dan modal inquiry dengan site key dari environment publik (`TURNSTILE_SITE_KEY`).
  - Backend Express memverifikasi token `cf-turnstile-response` ke endpoint resmi Cloudflare (`https://challenges.cloudflare.com/turnstile/v0/siteverify`) sebelum menyimpan inquiry ke database.
  - Secret key (`TURNSTILE_SECRET_KEY`) hanya tersimpan aman di server `.env` dan tidak pernah terekspos ke klien.
  - Request inquiry dengan token kosong, tidak valid, atau kedaluwarsa ditolak dengan HTTP 400 dan pesan error bilingual (ID/EN) tanpa menyimpan data apa pun ke database.
  - Widget Turnstile di sisi browser otomatis di-reset (`turnstile.reset()`) jika pengiriman formulir gagal validasi.
  - Rate limiting per IP tetap aktif melindungi endpoint pengiriman inquiry dari flooding.
  - Lingkungan pengujian lokal/dev mendukung Cloudflare test keys (`1x00000000000000000000AA` dan secret `1x0000000000000000000000000000000AA`).

### 8.6 Hero Banner Per Halaman Publik (Item 8)
- **Deskripsi:** Menu CMS untuk mengelola gambar latar dan konten teks hero banner secara spesifik pada 4 halaman publik utama: Tentang Kami (`/about`), Berita (`/news`), Produk (`/products`), dan Kontak (`/contact`).
- **Acceptance Criteria:**
  - Tersedia antarmuka CMS di `/admin/hero-banners` untuk mengatur 4 halaman: `about`, `news`, `products`, `contact`.
  - Masing-masing halaman dapat dikonfigurasi: gambar banner (upload WebP), judul hero (ID & EN), subjudul/caption (ID & EN), tingkat kegelapan overlay (0.0 s/d 1.0), serta tombol CTA opsional (label teks ID/EN dan URL tujuan).
  - Pengaturan per halaman langsung ditampilkan pada hero section halaman publik yang bersangkutan.
  - Jika data hero banner untuk halaman tertentu belum dikonfigurasi/kosong, halaman publik menggunakan konten banner bawaan (default template).

---

## BAGIAN 9: Revisi Admin v2 (Editor Artikel TinyMCE - Item B1)

### 9.1 Editor Isi Artikel: Integrasi TinyMCE Rich Text Editor
- **Deskripsi:** Mengganti input textarea konvensional pada form penulisan dan pengeditan artikel berita (`/admin/posts/create` & `/admin/posts/:id/edit`) dengan editor WYSIWYG modern **TinyMCE**. Editor ini memberikan pengalaman penulisan kaya format (formatting, headings, link, gambar, tabel, kode sumber) bagi tim editorial tanpa merusak tata letak publik atau membuka celah keamanan XSS.

- **Keputusan Lisensi & Self-Host vs Cloud:**
  - **Pilihan Arsitektur: Self-Hosted (npm package `tinymce`).**
  - **Alasan Pemilihan:**
    1. *Kemandirian Sistem & Keandalan:* Tidak bergantung pada ketersediaan CDN cloud pihak ketiga (`cdn.tiny.cloud`) atau koneksi internet eksternal saat proses editing.
    2. *Bebas Batasan Kuota & Biaya:* TinyMCE Cloud free-tier membatasi kuota pemuatan editor hingga 1.000 editor loads/bulan dan menampilkan watermark. Pilihan self-host 100% bebas dari limitasi ini.
    3. *Kepatuhan Keamanan & CSP:* Menghindari keharusan membuka domain eksternal pada Content Security Policy (CSP) aplikasi, sehingga selaras dengan standar hardening perbankan/korporat.
    4. *Lisensi Terbuka:* TinyMCE Community Edition didistribusikan di bawah lisensi open source GNU LGPL v2.1, yang legal digunakan secara komersial dalam aplikasi internal perusahaan tanpa kewajiban membuka source code proprietary aplikasi.

- **Kesesuaian Tema & Desain (Konsisten dengan DESIGN.md):**
  - Mengadopsi tema *Pacific Corporate & Energy* yang tertuang pada `Design/DESIGN.md`.
  - Antarmuka editor menggunakan skin bersih minimalis dengan sentuhan aksen liquid glass tipis:
    - Typography area penulisan: `Plus Jakarta Sans`, font size 15px, line-height 1.6, warna teks utama `#0F172A`.
    - Border dan container: Border halus `#E2E8F0`, latar kanvas `#FFFFFF`, latar toolbar `#F8FAFC`.
    - Aksen fokus dan tombol aktif: Primary `#00755A` dan hover `#009476` (Rebrand Palet Hijau v1).

- **Toolbar Ringkas & Fungsional:**
  - Tombol-tombol yang disediakan dibatasi pada elemen esensial artikel korporat guna menjaga kerapian dokumen:
    - Tingkat Judul: Paragraph, Heading 2 (`<h2>`), Heading 3 (`<h3>`), Heading 4 (`<h4>`).
    - Penekanan Teks: Bold, Italic, Underline.
    - Daftar: Bulleted List (`<ul>`), Numbered List (`<ol>`).
    - Sisipan Konten: Tautan (`<a>`), Gambar (`<img>`), Tabel (`<table>`).
    - Utilitas Teknis: Kode Sumber (`<code>` & view HTML source), Undo, Redo.

- **Mekanisme Upload Gambar Otomatis (Konversi WebP):**
  - Menggunakan plugin `image` dengan integrasi `images_upload_handler` kustom.
  - Saat editor menyisipkan atau meng-drag gambar ke dalam editor, berkas dikirimkan via AJAX ke endpoint backend internal (`POST /admin/posts/upload-image?_csrf=...`).
  - Backend memvalidasi MIME-type gambar, mengonversi otomatis ke format **WebP** terkompresi (lebar maksimum 1600px, kualitas 82) menggunakan Sharp, lalu menyimpan berkas ke `public/uploads/posts/`.
  - Editor menerima URL gambar WebP lokal dan langsung menyematkannya ke dalam dokumen.

- **Sanitasi HTML Server-Side & Keamanan (Anti-XSS):**
  - Karena artikel publik di-render dengan tag HTML unescaped (`<%- postContent %>`), backend wajib memvalidasi dan membersihkan HTML sebelum disimpan ke database menggunakan library sanitasi terpercaya (`sanitize-html`).
  - Allowlist tag hanya mengizinkan tag semantik yang aman: `h2`, `h3`, `h4`, `p`, `strong`, `em`, `u`, `s`, `ul`, `ol`, `li`, `blockquote`, `a`, `img`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `code`, `pre`, `hr`, `br`.
  - Seluruh script executable (`<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`, inline handler `onerror=`, `onclick=`) otomatis dihapus tuntas.
  - Semua tag `<a>` eksternal otomatis disematkan `rel="noopener noreferrer"`.

- **Penyimpanan Konten & Backward Compatibility Artikel Lama:**
  - Konten tersimpan di kolom `content_id` dan `content_en` tabel `posts` (tipe `LONGTEXT`). Tidak memerlukan alter table skema database.
  - Artikel lama yang sebelumnya dibuat dalam bentuk string polos atau baris teks sederhana tetap terbaca utuh dan dirender sempurna baik di dalam TinyMCE maupun di halaman publik `/news/:slug`.

- **Acceptance Criteria PRD:**
  1. Editor TinyMCE termuat secara mandiri (self-host) pada textarea `content_id` dan `content_en` di halaman create dan edit artikel.
  2. Tampilan toolbar dan kanvas penulisan konsisten dengan palet desain admin dan font Plus Jakarta Sans.
  3. Fitur formatting teks, heading, list, dan tabel bekerja responsif.
  4. Penyisipan gambar mengunggah berkas ke backend dan menyimpannya sebagai berkas WebP lokal.
  5. Seluruh input HTML dibersihkan dari tag berbahaya (XSS-safe) sebelum tersimpan ke database.
  6. Artikel lama tetap tampil rapi tanpa kerusakan tampilan di halaman publik.

---

## BAGIAN 10: Revisi Home & Admin v3 (Fitur Baru Kelompok B)

### 10.1 Integrasi Media Library Terpadu (Universal Media Picker Modal di Semua Form)
- **Deskripsi:** Menghubungkan Media Library terpusat ke seluruh form admin yang membutuhkan input aset visual (gambar dan video). Menggantikan input file konvensional (`<input type="file">`) dengan komponen modal picker interaktif yang memungkinkan admin memilih aset yang sudah ada atau mengunggah berkas baru langsung di dalam picker tanpa berpindah halaman.
- **Komponen Picker Reusable:**
  - Antarmuka field input terstandarisasi: Thumbnail pratinjau, nama/URL berkas terpilih, tombol "Pilih dari Media Library", dan tombol "Hapus".
  - Modal picker universal dengan tab navigasi tipe aset (Semua, Gambar, Video, YouTube, Dokumen), bilah pencarian real-time, dan tab "Unggah Baru".
- **Penyimpanan Referensi (URL vs ID):**
  - Menggunakan format **URL String** (mis. `/uploads/media/...` atau URL terstandarisasi).
  - *Rasional:* Menjaga kompatibilitas 100% dengan skema database yang sudah berjalan dan template EJS publik tanpa migrasi destruktif foreign key di 8 tabel terpisah.
- **Daftar Field Terdampak di Admin:**
  1. Banner Homepage: `file_url` dan `poster_url` (Tabel `banners`)
  2. Hero Banner 4 Halaman: `image_url` (Tabel `page_hero_banners`)
  3. Dokumentasi Pabrik CMS Tentang Kami: `about_image_url` (Tabel `settings`)
  4. Pengaturan Logo & Favicon: `site_logo_header`, `site_logo_footer`, `site_favicon` (Tabel `settings`)
  5. Katalog Produk: `image_url` (Tabel `products`)
  6. Merek Terdaftar: `logo_url` (Tabel `brands`)
  7. Cover Artikel Berita: `cover_image` (Tabel `posts`)
  8. Kapabilitas Mesin: `image_url` (Tabel `capabilities`)
- **Penanganan Aset yang Sedang Digunakan Saat Dihapus (Dependency Check - Pilihan B: Soft Warning dengan Opsi Force Delete):**
  - Backend memvalidasi relasi pemakaian aset di seluruh tabel terkait sebelum mengizinkan proses delete di Media Library.
  - Jika aset sedang aktif digunakan, sistem menampilkan dialog peringatan (warning) yang merinci daftar entitas pengguna aset tersebut beserta opsi:
    1. "Batal": Membatalkan penghapusan aset.
    2. "Tetap Hapus (Paksa Hapus)": Melanjutkan penghapusan aset dari database dan penyimpanan berkas fisik meskipun sedang digunakan.
- **Acceptance Criteria PRD:**
  1. Seluruh 8 modul form admin memiliki akses ke modal picker Media Library (menggantikan file input konvensional secara penuh).
  2. Modal picker mendukung pemilihan media eksisting dan upload media baru secara in-situ via AJAX.
  3. Pratinjau aset terpilih muncul seketika di formulir input.
  4. Peringatan dependensi aktif saat penghapusan aset di Media Library dengan dialog rincian pemakaian dan opsi Force Delete.

### 10.2 Banner Video Homepage Multi-Sumber (Media Library, Upload Berkas, & YouTube Embed)
- **Deskripsi:** Memperluas jenis media hero banner slider pada homepage agar dapat memutar video latar belakang dari 3 sumber: aset internal Media Library, berkas video lokal yang diunggah (MP4/WebM), atau tautan video streaming YouTube resmi.
- **Spesifikasi & Alur Ekstraksi YouTube:**
  - Form admin banner menyediakan opsi sumber: "Gambar", "Berkas Video (Upload/Media Library)", "Video YouTube".
  - Regex universal mengekstrak 11 karakter ID video dari beragam format URL YouTube (`watch?v=`, `youtu.be/`, `embed/`, `shorts/`).
  - Database menyimpan penanda `media_type = 'youtube'` dan ID video 11 karakter.
- **Penyematan youtube-nocookie di Homepage:**
  - Menggunakan domain ramah privasi `https://www.youtube-nocookie.com/embed/{VIDEO_ID}`.
  - Parameter otomatis: `autoplay=1&mute=1&loop=1&playlist={VIDEO_ID}&controls=0&showinfo=0&rel=0&playsinline=1&enablejsapi=1`.
  - Kontainer video dilengkapi lapisan overlay `.hero-grad` untuk menjamin keterbacaan tipografi teks judul di atas video.
- **Perilaku di Layar Ponsel & Poster Fallback:**
  - Wajib menyertakan gambar poster fallback (`poster_url`) yang tampil halus saat video sedang memuat atau saat browser seluler menahan autoplay guna menghemat kuota pengguna.
- **Pembaruan Kebijakan CSP (Content Security Policy):**
  - Kebijakan Helmet CSP pada direktif `frameSrc` diperbarui untuk mengizinkan `'https://www.youtube-nocookie.com'`.
- **Acceptance Criteria PRD:**
  1. Form admin banner mendukung pilihan sumber video YouTube dengan validasi tautan instan.
  2. Homepage me-render video latar belakang YouTube secara otomatis (autoplay muted loop) tanpa kontrol player.
  3. Frame YouTube diizinkan oleh CSP tanpa error console.
  4. Gambar poster fallback tampil anggun di perangkat seluler.

### 10.3 Sistem Notifikasi & Dialog Konfirmasi Modern Admin (SweetAlert2 Self-Hosted)
- **Deskripsi:** Mengganti alert dan dialog konfirmasi kaku bawaan browser (`alert()` dan `confirm()`) serta menyempurnakan pesan flash server di CMS admin dengan sistem notifikasi berbasis SweetAlert2 yang di-self-host secara lokal, selaras dengan prinsip desain *Pacific Corporate & Energy* pada `Design/DESIGN.md`.
- **Cakupan & Fungsionalitas:**
  1. *Toast Notifikasi:* Notifikasi mengambang otomatis (auto-dismiss 3.5 detik) di sudut kanan atas untuk feedback sukses, error, atau info.
  2. *Dialog Konfirmasi Hapus Data:* Dialog modal elegan dengan tombol bahaya warna merah `#DC2626` ("Ya, Hapus Data") dan tombol batal netral `#0D2040` ("Batal"), menggantikan `onsubmit="return confirm('...')"` pada seluruh tabel data.
  3. *Integrasi Flash Alert Server:* Parameter query `?success=...` dan `?error=...` otomatis memicu toast animasi halus saat halaman dimuat.
- **Kemandirian Sistem & Kepatuhan CSP:**
  - Library di-self-host melalui paket npm `sweetalert2` dan disajikan dari direktori lokal aplikasi (`public/vendor/sweetalert2/`), bebas dari CDN eksternal dan aman di bawah aturan CSP.
- **Acceptance Criteria PRD:**
  1. SweetAlert2 terpasang secara self-hosted dan terintegrasi di seluruh panel admin.
  2. Seluruh dialog konfirmasi hapus (10 tabel admin) beralih ke modal konfirmasi modern.
  3. Pesan flash server tampil sebagai toast non-blocking yang bersih.
  4. Desain dialog dan toast serasi dengan tipografi Plus Jakarta Sans dan palet warna korporat.

### 10.4 Sistem Latar Belakang Dual-Token Publik (#FFFFFF & #F8FAFC)
- **Deskripsi:** Menyelaraskan seluruh tampilan halaman publik menggunakan sistem warna latar belakang dual-token eksklusif (`#FFFFFF` dan `#F8FAFC`) dengan ritme selang-seling terstruktur serta mengeliminasi total rona lavender/ungu `#FAF8FF` demi citra manufaktur B2B yang bersih, modern, dan profesional.

---

## BAGIAN 11: CMS Konten Homepage v1 (Fitur Baru Kelompok B)

### 11.1 Fondasi Struktur Data, Migrasi Database, & Seed Default Identik
- **Latar Belakang & Masalah:**
  - Saat ini, 4 section krusial pada halaman publik beranda masih berstatus *hardcoded* statis di dalam template EJS (`views/public/index.ejs`), yaitu:
    1. Section Intro di bawah banner (`.sec-intro` / `#intro`)
    2. Section 3 Pilar Keunggulan (`.sec-pillars` / `#pilar`)
    3. Section Sertifikasi Mutu (`.sec-evidence` / `#sertifikasi`)
    4. Section Banner Ajakan Bertindak CTA (`.sec-cta` / `#kontak`)
  - Hal ini menyebabkan tim internal non-teknis tidak dapat memperbarui narasi korporat, pilar keunggulan, daftar sertifikasi terkini, atau informasi CTA tanpa meminta intervensi pengembang untuk mengubah kode sumber dan melakukan deploy ulang.
- **Tujuan Kebutuhan Produk:**
  - Seluruh konten 4 section tersebut harus 100% dapat dikelola secara mandiri oleh tim admin melalui panel CMS.
  - **Prinsip Zero Visual Regression:** Saat pertama kali dimigrasi dan diterapkan, tampilan publik publik **TIDAK BOLEH BERUBAH SEDIKITPUN** dan **TIDAK BOLEH KOSONG**. Seluruh teks, nomor kontak, tautan, dan urutan kartu harus persis sama dengan kondisi saat ini.
- **Arsitektur Data & Fleksibilitas Bilingual:**
  - Seluruh field teks wajib mendukung dwibahasa: Bahasa Indonesia (`_id`) dan Bahasa Inggris (`_en`).
  - Mendukung pengaturan urutan tampil (`sort_order`) dan sakelar aktif/nonaktif (`is_active`).
  - Format penyimpanan mengevaluasi dua pendekatan arsitektur:
    1. *Tabel Khusus Dedicated:* Tabel relasional khusus di MySQL (mis. `home_contents`, `home_pillars`, `home_certifications`).
    2. *Pola Kunci Pengaturan JSON di Tabel `settings`:* Memanfaatkan tabel `settings` eksisting yang sudah terbukti stabil untuk konfigurasi global dan array terstruktur (seperti `about_values_json` dan `about_certifications_json`).
- **Mekanisme Fallback Runtime Aman:**
  - Sistem wajib memiliki layer fallback berlapis di tingkat model backend (`homeContentModel.js`). Jika database dalam kondisi belum terisi data, salah satu field bernilai `NULL`/kosong, atau parsing JSON mengalami kendala, sistem secara anggun menyajikan nilai default bawaan pabrik (*factory defaults*) yang identik dengan teks statis saat ini, tanpa memicu error 500 atau kekosongan elemen di sisi pengunjung.

### 11.2 Section Intro di Bawah Banner (Company Intro)
- **Kebutuhan Konten Dinamis:**
  - *Eyebrow / Sub-kicker:* Label kategori kecil di atas judul (mis. "TENTANG PT EUODOO" / "ABOUT PT EUODOO"), opsional.
  - *Judul Utama (H2):* Judul narasi pengenalan pabrik dwibahasa (maks. 255 karakter).
  - *Paragraf Narasi:* Terbagi menjadi Paragraf 1 (sejarah & fasilitas) dan Paragraf 2 (kapabilitas teknologi & komitmen ramah lingkungan) dalam format dwibahasa ID/EN (masing-masing maks. 2.000 karakter).
  - *Gambar Fasilitas Opsional:* Integrasi dengan Universal Media Picker untuk memilih foto pabrik/mesin.
  - *Toggle Status Aktif:* Memungkinkan admin menyembunyikan section ini bila diperlukan.
- **Perilaku Tampilan Publik:**
  - Jika gambar fasilitas tidak dipilih/kosong: Tampilan mempertahankan layout teks 2-kolom eksisting (`.intro-layout`) yang rapi, elegan, dan seimbang.
  - Jika gambar fasilitas dipilih: Layout beradaptasi secara anggun menyajikan split media-teks proporsional tanpa merusak ritme vertikal.

### 11.3 Section 3 Pilar Keunggulan Kami (Three Pillars) [DEPRECATED / USANG per 2026-10-19]
> **Catatan Status Spesifikasi (2026-10-19):**
> Spesifikasi section 3 pilar kartu ini telah **DIPENSIUNKAN / USANG** per rilis Homepage Major Update v1 dan digantikan sepenuhnya oleh **Section Why Choose Us / Kenapa Memilih Kami** (lihat Bagian 15.2). Dokumentasi di bawah ini dipertahankan sebagai catatan riwayat arsitektur (arsip) dan tidak boleh dihapus diam-diam.

- **Kebutuhan Konten Dinamis (Arsip):**
  - *Header Section:* Judul (`title_id`, `title_en`) dan subjudul pengantar (`subtitle_id`, `subtitle_en`).
  - *Item Pilar Keunggulan:* Setiap pilar memiliki:
    1. *Ikon Visual:* Pilihan ikon preset SVG semantik yang terkurasi (Teknologi/Mesin Pabrik, Standar Mutu/Presisi, Ramah Lingkungan OXIUM, Keandalan/Sertifikasi).
    2. *Judul Pilar:* Nama pilar dwibahasa (maks. 100 karakter).
    3. *Deskripsi Narasi:* Penjelasan detail komitmen operasional dwibahasa (maks. 500 karakter).
    4. *Urutan Tampil:* Nomor urut 1, 2, 3 untuk mengatur posisi kartu.
    5. *Status Aktif:* Toggle visibilitas kartu.
- **Karakteristik Desain & Aksesibilitas (Arsip):**
  - Mempertahankan kartu interaktif beraksesibilitas penuh (keyboard `tabindex="0"`, `role="region"`, `aria-label`).
  - Mengunci efek visual dan performa animasi kartu pilar GPU hover/active dari revisi v5 (pseudo-element `::after`, `@media (hover: hover)` anti-sticky touch ponsel, dan `@media (prefers-reduced-motion: reduce)`).

### 11.4 Section Sertifikasi Mutu & Komitmen Lingkungan (Quality & Eco-Evidence)
- **Kebutuhan Konten Dinamis:**
  - *Header Section:* Judul section (`title_id`, `title_en`) dan deskripsi pengantar komitmen regulasi (`body_id`, `body_en`).
  - *Tombol Tindakan (CTA):* Teks tombol dwibahasa (mis. "Pelajari Detail Sertifikasi" / "Learn More About Certifications") dan URL tujuan tautan (default: `/about#sertifikasi`), beserta opsi menyembunyikan tombol.
  - *Daftar Sertifikasi:* Koleksi sertifikasi resmi dengan atribut:
    1. *Nama Sertifikasi:* (mis. "SNI 7188.7:2011", "OXIUM® Technology", "InSWA Eco Label", "Virgin Food-Grade Contact").
    2. *Keterangan Standar:* Penjelasan singkat kepatuhan standar dalam format dwibahasa (maks. 255 karakter).
    3. *Logo / Aset Gambar:* Pilihan logo resmi melalui Universal Media Picker. Jika logo tidak diunggah, antarmuka otomatis menggunakan fallback ikon centang hijau/biru (`&#10003;` `.cert-chk`).
    4. *Urutan Tampil & Status Aktif:* Pengendalian urutan dan toggle aktif.
- **Relasi dengan Tab "Sertifikasi & Lingkungan" CMS Tentang Kami:**
  - Memastikan pemisahan domain yang sehat (*decoupled*): Homepage menyajikan ikhtisar pembuktian mutu ringkas yang berorientasi konversi B2B (4 bukti sertifikasi cepat), sedangkan halaman Tentang Kami menyajikan dokumen legal korporat komprehensif (penerbit, badge, nomor registrasi). Pemisahan data mencegah perubahan pada profil perusahaan merusak tata letak ringkas beranda.

### 11.5 Section CTA Global Sebelum Footer (Global Pre-Footer Banner)
- **Kebutuhan Konten Dinamis:**
  - *Heading Utama:* Ajakan kemitraan korporat dwibahasa (maks. 255 karakter).
  - *Subjudul / Narasi:* Penjelasan nilai konsultasi teknis dwibahasa (maks. 500 karakter).
  - *Tombol Tindakan Utama (RFQ / Kontak):* Judul tombol ID/EN, subteks ID/EN, dan URL tujuan (default: `/contact`).
  - *Tombol Tindakan Sekunder (WhatsApp / Fast Response):* Judul tombol ID/EN, subteks ID/EN, dan URL tujuan (opsional kustom, dengan fallback otomatis ke `settings.whatsapp_url`).
  - *Toggle Global Active:* Sakelar master untuk mengaktifkan atau menonaktifkan banner CTA di seluruh situs.
- **Penyajian Global & Kendali Visibilitas Halaman (Keputusan Terkunci Opsi 4B):**
  - Section CTA disajikan melalui **Satu Partial Global Tunggal** (`views/partials/cta-global.ejs`) yang disematkan langsung di layout utama sebelum footer.
  - *Kendali Visibilitas Dinamis di Admin:* Admin diberikan opsi checkbox untuk menyalakan/mematikan CTA pada masing-masing dari 9 halaman publik: Beranda, Tentang Kami, Katalog Produk, Detail Produk, Kapabilitas, Berita, Detail Berita, Kontak, dan 404.
  - *Konfigurasi Default Awal:* Tercentang (aktif) untuk seluruh halaman publik KECUALI Halaman Kontak (`/contact`) dan Halaman Error 404 (default unchecked). Admin dapat mencentang kembali kapan saja jika menginginkan CTA tampil di halaman kontak.

### 11.6 Menu Admin Baru "Konten Homepage" & Keamanan
- **Struktur Antarmuka Pengguna Admin:**
  - Menu baru disematkan pada sidebar admin di kelompok `KONTEN & MEDIA` dengan label "Konten Homepage".
  - Mengadopsi navigasi berbasis 4 tab interaktif:
    - Tab 1: **Intro Homepage**
    - Tab 2: **Pilar Keunggulan** (3 pilar tetap dengan dropdown preset icon SVG)
    - Tab 3: **Sertifikasi Mutu** (terpisah mandiri dari Tentang Kami)
    - Tab 4: **CTA Global Pre-Footer** (termasuk checkbox visibilitas 9 halaman)
  - Seluruh tab disimpan dalam satu formulir atomik dengan tombol "Simpan Perubahan" pada bar aksi sticky di bagian bawah.
- **Keamanan & Standar Teknis:**
  - *Otorisasi:* Dibatasi hanya untuk peran `superadmin` dan `admin`.
  - *CSRF Protection:* Dilindungi token CSRF pada header dan input hidden form.
  - *Sanitasi Server-Side & XSS Prevention:* Seluruh input string dibersihkan dari karakter berbahaya dan tag executable sebelum disimpan.
  - *Escaping EJS Publik:* Output pada template publik wajib menggunakan escape tag standar (`<%= %>`).
  - *Batas Panjang Karakter:* Divalidasi di frontend (atribut `maxlength`) dan backend (validasi skema payload).

### 11.7 Acceptance Criteria PRD
1. Tersedia menu admin "Konten Homepage" dengan antarmuka 4 tab interaktif yang responsif dan konsisten dengan tema CMS.
2. Seluruh teks, gambar, ikon, tombol, dan status visibilitas pada 4 section homepage dapat diubah dari panel admin tanpa menyentuh kode.
3. Seed migrasi database menghasilkan tampilan beranda publik yang 100% identik dengan tampilan saat ini (zero regression visual).
4. Section CTA tampil terpadu di halaman publik via partial terpusat dan visibilitasnya dapat diatur per halaman via checkbox di panel admin (default aktif selain `/contact` dan `/404`).
5. Universal Media Picker berfungsi mulus pada input gambar Intro dan logo Sertifikasi.
6. Pembaruan konten langsung terlihat di publik setelah tombol simpan ditekan (invalidation cache bekerja seketika).

---

## BAGIAN 12: Revisi Halaman Tentang Kami & Gallery v1 (Fitur Baru Kelompok B)

### 12.1 Penghapusan Section Lokasi Operasional dari Halaman About (Database Utuh)
- **Deskripsi:** Section "Fasilitas Operasional & Pabrik" (`#facilities`) dihapus dari halaman publik `/about` dan form lokasi dihapus dari CMS Tentang Kami. Sesuai keputusan Opsi A, data alamat/telepon resmi perusahaan (`factory_address`, `office_address`, `about_factory_address`, dsb.) **TIDAK DIHAPUS** dari database tabel `settings` karena datanya aktif digunakan oleh footer global (`views/partials/footer.ejs`) dan halaman Kontak (`views/public/contact.ejs`). Pengelolaan data alamat tetap terpusat di CMS Pengaturan Situs.
- **Acceptance Criteria:**
  1. Section Lokasi Operasional tidak tampil di halaman publik `/about`.
  2. Form lokasi tidak tampil di CMS admin `/admin/about`.
  3. Data alamat di database tetap utuh dan tampil di footer, halaman Kontak, dan CMS Pengaturan Situs tanpa regresi.

### 12.2 Section Gallery Mosaik Bento pada Halaman About (Menggantikan Gallery Slider v1)
- **Deskripsi:** Section Gallery menggantikan posisi Lokasi Operasional. Format **grid mosaik bento berhalaman** mengikuti video referensi `Unlocking the Power of the Perfect Grid.webm`, disesuaikan gaya Euodoo (bersih, modern, profesional, palet hijau brand `#00755A`/`#00573F` + netral dual-token):
  - **Header:** label kicker (garis + teks uppercase), judul H2, paragraf deskripsi.
  - **Grid mosaik 6 tile per halaman** dengan ukuran berbeda: 1 tile tall (span 2 baris, ~2:3), 2 tile wide (span 2 kolom, ~16:9), 3 tile standard (~4:3). Posisi tile ditentukan otomatis oleh urutan (`sort_order`), bukan dipilih di admin.
  - **Caption overlay:** teks kecil di kiri bawah tile di atas gradien halus (`linear-gradient(transparent 40%, rgba(10,25,47,0.65))`). Pill kategori (uppercase, 11px) + judul slide (15px, weight 600).
    *Revisi v3 (B1):* Jika kategori, judul, dan subjudul kosong, tile tampil sebagai gambar penuh bersih tanpa elemen overlay `.abt-gal-cap`, tanpa gradien gelap, dan tanpa chip kosong.
  - **Paginasi:** di bawah grid. Penghitung `01 / 03` (`tabular-nums`) dan tombol panah prev/next. Tersembunyi jika ≤ 1 halaman.
  - **Transisi antar halaman:** tile dianimasikan dengan Anime.js v3 (`anime.timeline({...})`), hanya memanipulasi properti transform, opacity, dan clip-path. Stagger simetris searah navigasi (arah cermin antara Next dan Prev), pre-decode gambar sebelum mulai, dan tombol dikunci selama transisi.
  - **Hover tile:** zoom tipis (`scale(1.04)`, `400ms ease`), caption lebih jelas (gradien lebih gelap jika ada caption). Dibungkus `@media (hover: hover)`. Feedback `:active` untuk sentuh (`scale(0.98)`). Pada tile tanpa teks, hover hanya melakukan zoom gambar tanpa memunculkan gradien kosong.
  - **Keyboard/focus:** tile focusable (`tabindex="0"`), outline `2px solid var(--sky)`, ArrowLeft/ArrowRight navigasi halaman.
  - **Pola halaman terakhir (sisa 1-5 tile):** layout disesuaikan dengan tinggi container tetap (CLS 0): 5 tile (baris bawah kanan kosong), 4 tile (baris bawah disembunyikan), 3 tile (2 baris, kanan bawah kosong), 2 tile (setengah lebar masing-masing), 1 tile (gambar tidak membesar mengisi seluruh grid secara agresif).
  - **prefers-reduced-motion:** stagger/scale dihilangkan, pergantian halaman instan. Hover zoom mati.
  - **Mobile (≤768px):** grid sederhana 2 kolom sama lebar, semua tile ukuran sama. 4 tile per halaman. Swipe sentuh (threshold 50px). Caption font lebih kecil (13px judul, 10px kategori).
  - **Data dinamis & Aturan Wajib (Revisi v3 - B1):**
    - HANYA gambar (`image_url`) yang wajib diisi.
    - Kategori/tag (`category_id/en`), judul (`title_id/en`), dan subjudul (`subtitle_id/en`) bersifat OPSIONAL (nullable di database).
    - Tampilan tile tanpa teks: gambar tampil utuh bersih tanpa gradien hitam atau elemen caption kosong.
    - Aksesibilitas & SEO: tag `<img>` dan tile `aria-label` memiliki fallback otomatis berpenomoran urut jika judul/kategori kosong (`"Fasilitas Manufaktur & Operasional PT Euodoo (Foto 01)"` untuk ID dan `"PT Euodoo Manufacturing & Operations Facility (Photo 01)"` untuk EN).
  - **Seed data awal:** seed lama (7 slide dari `public/images/`) tetap berlaku.
  - **Edge cases:** 0 slide = section tersembunyi; 1 slide = gambar proporsional tanpa paginasi. Maks 20 slide, gambar maks 5MB.
  - **Keputusan Terkunci User (Revisi v3 - 2026-10-14):**
    - **Keputusan 1 - Opsi 1A (Terkunci):** Halaman terakhir dengan sisa tile (termasuk 1 tile) mengadopsi *Fixed Bento Slot*. Tile sisa menempati ukuran slot standar di sudut kiri atas, sementara sisa grid dibiarkan kosong alami dengan container galeri mempertahankan tinggi tetap (fixed height / min-height terkunci) demi CLS = 0 mutlak dan kestabilan transisi.
    - **Keputusan 2 - Opsi 2A (Terkunci):** Transisi Anime.js v3 mengadopsi *Shutter Curtain Wipe Simetris* via `clip-path: inset(...)`, `opacity: [0, 1]`, dan `scale: [0.96, 1]` dengan arah gelombang stagger cermin (Next: kiri-ke-kanan; Prev: kanan-ke-kiri).
    - **Keputusan 3 - Opsi 3A (Terkunci):** Aksesibilitas slide tanpa teks menggunakan *Fallback Berpenomoran Urut* dinamis (`"Fasilitas Manufaktur & Operasional PT Euodoo (Foto 01)"` / `"PT Euodoo Manufacturing & Operations Facility (Photo 01)"`).
    - **Mobile Grid 4 Tile (Terkunci):** Mobile (< 768px) menampilkan 4 tile per halaman (grid 2 kolom x 2 baris) dan mendukung *Horizontal Touch Swipe* (gesture swipe kiri/kanan threshold 50px).
- **Acceptance Criteria:**
  1. Gallery mosaik bento berfungsi: 6 tile per halaman (desktop) dan 4 tile (mobile), pola ukuran berbeda (tall/wide/standard) menggunakan prefix terisolasi `.abt-gal-*`.
  2. Slide hanya mewajibkan gambar; judul, kategori, dan subjudul opsional.
  3. Slide tanpa teks tampil sebagai foto bersih penuh tanpa gradien overlay atau chip kosong.
  4. Tag `<img>` dan tile memiliki fallback `alt` / `aria-label` berpenomoran urut yang unik saat teks kosong (Opsi 3A).
  5. Paginasi `01 / 03` dan tombol panah berfungsi, transisi bebas loncatan (CLS 0 via Fixed Bento Slot Opsi 1A) dan halus 60fps via Shutter Curtain Wipe Anime.js v3 (Opsi 2A).
  6. Data dari database, seed data 7 slide tetap berfungsi.
  7. Responsif 320px sampai desktop. Dwibahasa ID/EN.
  8. Mobile 2 kolom, swipe sentuh.
  9. `prefers-reduced-motion` menghentikan animasi.
  10. Hover tile zoom + caption lebih jelas jika ada. Focus visible.


### 12.3 Redesain Section Sejarah (Timeline + Statistik)
- **Deskripsi:** Section Sejarah disamakan dengan `prototype-about-v1.html` (`#sejarah`), KECUALI palet background: pakai `#F8FAFC` / `#FFFFFF` (dual-token dari DESIGN.md v5), bukan `#FAF8FF`. Struktur:
  - **Kolom kiri sticky:** kicker label, judul H2, paragraf, 4 kotak statistik angka + label (grid 2x2).
  - **Kolom kanan timeline:** label tahun, judul, deskripsi. Daftar dinamis dari database.
  - **Pemetaan field lama:** `history_title_id/en` ke judul kolom kiri; `history_id/en` ke paragraf kolom kiri.
  - **Statistik dan timeline:** daftar yang bisa ditambah, dihapus, dan diurutkan dari admin (dwibahasa ID/EN).
- **Acceptance Criteria:**
  1. Layout 2 kolom identik prototype dengan palet `#F8FAFC` / `#FFFFFF`.
  2. Statistik dan timeline dari database, bisa CRUD dari admin.
  3. Dwibahasa. Responsif.

### 12.4 Visi & Misi dengan Foto
- **Deskripsi:** Layout Visi & Misi mengikuti SCREENSHOT user (bukan prototype). Card style dari prototype (`--r-xl` border radius, border, hover effect). Layout:
  - **Visi:** card teks di kiri + gambar di kanan.
  - **Misi:** gambar di kiri + card teks di kanan.
  - Tambah field gambar `vision_image_url` dan `mission_image_url` (media library picker).
  - **Mobile:** tersusun vertikal, gambar di atas teks, tanpa overflow.
  - **Gambar kosong:** card tampil penuh tanpa slot gambar.
- **Acceptance Criteria:**
  1. Layout 2 kolom visi/misi sesuai screenshot, style card dari prototype.
  2. Gambar dari media library.
  3. Responsif dan fallback saat gambar kosong.

### 12.5 UI Polish Hero Publik (Shared Style)
- **Deskripsi:** Hero 4 halaman publik (About, Berita, Kontak, Produk): teks label kicker kecil di atas judul dan breadcrumb aktif berwarna `#ffffff` bold (bukan biru). Implementasi lewat class CSS bersama di `components.css`.
- **Acceptance Criteria:**
  1. Kicker label tampil di atas judul hero pada 4 halaman.
  2. Breadcrumb aktif `#ffffff` bold.
  3. Tidak ada inline style breadcrumb.

### 12.6 Penghapusan CTA Hero Halaman About
- **Deskripsi:** Tombol CTA dihapus dari hero halaman About publik. Field CTA di CMS hero banner tetap ada sebagai fitur opsional untuk halaman lain.
- **Acceptance Criteria:**
  1. Tidak ada CTA button di hero `/about`.
  2. CTA hero halaman lain dan field CMS tidak terpengaruh.

### 12.7 CMS Admin Tentang Kami: Perubahan Tab & Editor Baru
- **Deskripsi:** Perubahan pada CMS admin `/admin/about`:
  1. Hapus tab/section lokasi dari tab Sejarah.
  2. Tab Gallery: editor header section + CRUD slide (gambar media library, tag opsional, judul opsional, subjudul opsional, urutan, aktif).
     - *Revisi v3 (B1):* Form Tambah/Edit Slide hanya mewajibkan gambar (`image_url`). Judul, kategori, dan subjudul bersifat opsional. Tanda (*) pada judul dihapus.
     - *Standarisasi Istilah:* Seluruh label kata usang "Slider" diganti menjadi "Galeri" (mis. "Tampilkan di Galeri Publik", "Angka lebih kecil tampil lebih awal pada galeri").
     - *Modal Flex dvh:* Modal Tambah/Edit Slide dan modal lainnya menggunakan struktur flex dengan header tetap, footer tombol Batal/Simpan selalu terlihat (sticky), dan body yang bisa di-scroll secara independen berbasis unit `dvh` agar form selalu bisa disimpan pada zoom 100%, 125%, 150%, dan tinggi layar 600-768px.
  3. Tab Sejarah: menjadi editor header + editor statistik + editor timeline (daftar yang bisa ditambah/dihapus/diurutkan, dwibahasa).
  4. Tab Visi & Misi: tambah input foto Visi dan Misi (media library picker).
  Gunakan komponen tab, liquid glass card, dan picker yang sudah ada.
- **Acceptance Criteria:**
  1. Tab Gallery, Sejarah (stats + timeline), dan Visi Misi (foto) berfungsi penuh.
  2. CRUD dengan validasi: hanya gambar yang wajib pada slide galeri.
  3. Modal slide galeri tidak terpotong, tombol Simpan selalu terlihat di zoom 100%-150% dan layar pendek.
  4. Label admin menggunakan istilah "Galeri", bukan "Slider".
  5. CRUD dengan CSRF, SweetAlert2, dan simpan satu klik semua tab.

### 12.8 Acceptance Criteria PRD Keseluruhan
1. Section Lokasi Operasional tidak tampil di publik About dan CMS.
2. Gallery bento berfungsi lengkap dengan data dinamis dari database, beranimasi mulus via Anime.js v3, dan bebas layout shift (CLS 0).
3. Slide hanya mewajibkan gambar; judul, kategori, dan subjudul opsional. Tile tanpa teks tampil bersih tanpa gradien.
4. Section Sejarah dengan timeline + statistik berfungsi dengan data dinamis.
5. Visi & Misi menampilkan foto dari media library.
6. Hero 4 halaman publik memiliki kicker label dan breadcrumb aktif putih.
7. CTA hero About dihapus.
8. CMS admin Tentang Kami memiliki tab Gallery dan editor statistik/timeline dengan modal responsif header/footer terkunci.
9. Homepage dan halaman publik lainnya terisolasi aman dari kolisi CSS galeri Tentang Kami.
10. Checklist regresi: semua fungsi CMS admin lain dan halaman publik berjalan normal.
11. Responsif 320px sampai desktop, dwibahasa ID/EN, aksesibel (WCAG AA, keyboard, prefers-reduced-motion).

---

## BAGIAN 13: Revisi Footer & Pengaturan Situs v1 (Fitur Baru Kelompok B)

### Keputusan Terkunci User (2026-10-15)
- **Keputusan 1 - Opsi 1A (Terkunci):** Sentralisasi Master di Pengaturan Situs (`/admin/settings`). Menu CMS Kontak (`/admin/contact`) difokuskan untuk formulir RFQ dan jam kerja dengan kotak informasi/tautan langsung ke Pengaturan Situs.
- **Keputusan 2 - Opsi 2A (Terkunci):** Kolom Google Maps tetap 1 untuk fasilitas utama Pabrik Manufaktur Bandung (`google_maps_embed`).
- **Keputusan 3 - Opsi 3A (Terkunci):** Desain Monokrom Murni / Putih Solid (`#FFFFFF`) untuk seluruh teks footer, label lokasi, dan titik penanda `.ft-office-dot` (100% Zero Blue).
- **Keputusan 4 - Opsi 4B (Terkunci):** Standarisasi Prefix Seragam Kunci Media Sosial di database (`social_<platform>_url` dan `social_<platform>_visible`) dengan fallback mapping di middleware.

### 13.1 Sumber Data Tunggal Alamat & Kontak Dual Lokasi (Jakarta & Bandung)
- **Latar Belakang & Masalah:**
  Saat ini, data alamat fisik dan nomor telepon untuk Kantor Jakarta dan Pabrik Bandung terpecah dan berulang (*redundant*) di beberapa tempat:
  1. Halaman Publik Kontak (`views/public/contact.ejs`) meng-hardcode alamat Jakarta ("Karindra Building...") dan nomor telepon Jakarta ("+6221-53668626"), sedangkan alamat Bandung membaca kunci `contact_address_id` / `factory_address`.
  2. Footer publik (`views/partials/footer.ejs`) membaca `office_address` dan `factory_address`, namun nomor telepon pabrik Bandung di-hardcode `(022) 6012519` tanpa ada field di database.
  3. Terjadi inkonsistensi penamaan label lokasi antara CMS Pengaturan Situs ("Alamat Kantor Pemasaran (Jakarta Barat)"), Footer ("Kantor Pusat Jakarta" / "Head Office (Jakarta)"), dan Halaman Kontak ("Kantor Pusat & Sales" / "Jakarta Pusat").
  4. Menu CMS Kontak (`/admin/contact`) dan Pengaturan Situs (`/admin/settings`) masing-masing mengelola field alamat secara terpisah.
- **Spesifikasi Solusi Single Source of Truth:**
  1. **Sentralisasi Data Master di Pengaturan Situs (`/admin/settings`):**
     - Seluruh data alamat fisik, nama label lokasi, dan nomor telepon kedua fasilitas operasional (Kantor Jakarta dan Pabrik Bandung) dikelola terpusat dari satu tempat: CMS Pengaturan Situs.
     - Footer publik DAN Halaman Kontak publik (`/contact`) membaca dari sumber data kunci yang sama di tabel `settings`. Tidak diperbolehkan ada lagi string alamat, nomor telepon, atau fax hardcode di file view EJS.
     - Pengguna admin dapat mengubah alamat, nomor telepon, maupun label saat terjadi relokasi fisik kantor atau pabrik, dan perubahan otomatis terrefleksi di seluruh halaman website.
  2. **Struktur Data per Lokasi:**
     - **Lokasi 1 (Kantor Jakarta):**
       - Label Lokasi (ID): `"Kantor Pusat (Jakarta)"` (dapat diubah admin).
       - Label Lokasi (EN): `"Head Office (Jakarta)"` (dapat diubah admin).
       - Alamat Lengkap: Alamat gedung/jalan, kota, kode pos.
       - Nomor Telepon: Format tampilan resmi (misal: `(021) 5366-0000`), dirender otomatis sebagai tautan `tel:02153660000` di frontend.
       - Email: Email korespondensi utama.
       - Nomor Fax (opsional/informasi).
     - **Lokasi 2 (Pabrik Manufaktur Bandung):**
       - Label Lokasi (ID): `"Pabrik Manufaktur (Bandung)"` (dapat diubah admin).
       - Label Lokasi (EN): `"Manufacturing Plant (Bandung)"` (dapat diubah admin).
       - Alamat Lengkap: Alamat fasilitas produksi, kawasan industri, kota, kode pos.
       - Nomor Telepon: Nomor telepon pabrik / hotline, dirender otomatis sebagai tautan `tel:...`.
       - Jam Operasional (Bilingual): Jam kerja resmi (Senin-Jumat, Sabtu).
  3. **Standardisasi Label Lokasi:**
     - Menghapus variasi label ambigu *"Kantor Pemasaran (Jakarta Barat)"*, *"Jakarta Pusat"*, *"Pabrik Produksi Bandung"*, dan *"Bandung, Jawa Barat"*.
     - Seluruh antarmuka menggunakan pasangan label standar dwibahasa:
       - ID: **Kantor Pusat (Jakarta)** | EN: **Head Office (Jakarta)**
       - ID: **Pabrik Manufaktur (Bandung)** | EN: **Manufacturing Plant (Bandung)**
  4. **Parser Cerdas, Validasi & Keamanan Google Maps:**
     - Input admin pada kolom Google Maps mendukung 2 tipe format:
       - Format A: Kode embed HTML iframe utuh (`<iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>`).
       - Format B: URL murni `src` (`https://www.google.com/maps/embed?pb=...`).
     - **Ekstraksi & Sanitasi Server-Side:** Sistem secara otomatis mendeteksi jika input berupa tag HTML, lalu mengekstrak HANYA nilai atribut `src`.
     - **Validasi Domain Ketat:** Sistem memvalidasi bahwa URL harus diawali dengan protokol aman `https://` dan berasal dari domain resmi Google Maps (`google.com/maps/embed` atau `maps.google.com`). Input yang mengandung tag `<script>`, atribut jahat `onload`/`onerror`, atau domain asing ditolak demi mencegah celah keamanan Stored XSS.
     - **Penyimpanan Database:** Database HANYA menyimpan string URL bersih (bukan tag HTML mentah).
     - **Penyematan Frontend:** Iframe dirender di view publik dengan atribut performa dan keamanan: `loading="lazy"`, `referrerpolicy="no-referrer-when-downgrade"`, `allowfullscreen=""`, `sandbox="allow-scripts allow-same-origin allow-popups"`, dan `title` aksesibel.
  5. **Dampak Satu Peta vs Dua Lokasi:**
     - Pada skema saat ini, hanya tersedia satu kolom Google Maps yang disematkan pada Halaman Kontak untuk Pabrik Bandung.
     - Untuk mendukung fleksibilitas masa depan jika admin ingin menampilkan peta Kantor Jakarta dan Pabrik Bandung sekaligus, disajikan opsi penambahan kolom peta kedua di Pengaturan Situs atau mempertahankan peta utama untuk fasilitas pabrik manufaktur.

---

### 13.2 Visibilitas & Toggle Media Sosial Dinamis
- **Latar Belakang & Masalah:**
  Saat ini, footer merender tautan media sosial secara kaku. Jika salah satu akun medsos belum dimiliki perusahaan, footer tetap menampilkan ikonnya dan mengarahkan ke halaman domain utama (`https://facebook.com`) melalui string fallback hardcode. Selain itu, ikon YouTube tidak pernah dirender di footer meskipun kolomnya ada di admin.
- **Spesifikasi Solusi:**
  1. **Kontrol Visibilitas Mandiri (Show/Hide Toggle):**
     - Setiap platform media sosial (LinkedIn, Instagram, Facebook, dan YouTube) memiliki switch/toggle visibilitas independen di Pengaturan Situs:
       - `social_linkedin_visible` (1 = Tampilkan, 0 = Sembunyikan)
       - `social_instagram_visible` (1 = Tampilkan, 0 = Sembunyikan)
       - `social_facebook_visible` (1 = Tampilkan, 0 = Sembunyikan)
       - `social_youtube_visible` (1 = Tampilkan, 0 = Sembunyikan)
  2. **Aturan Rendering Bersyarat (Conditional Rendering):**
     - Tombol ikon media sosial HANYA dirender di footer jika:
       `Toggle bernilai Aktif (1)` **DAN** `URL terisi (tidak kosong)` **DAN** `URL berawalan https://`.
     - Jika toggle bernilai 0 (nonaktif), ikon TIDAK dirender meskipun kolom URL terisi di database.
     - Hapus seluruh URL default hardcode di footer EJS. Tidak ada lagi fallback diam-diam ke `'https://facebook.com'` atau domain generic lainnya.
  3. **Penambahan Ikon YouTube:**
     - Menambahkan markup SVG resmi YouTube berstandar industri (viewBox 0 0 24 24) ke dalam kelompok tombol `.social-btn` di footer publik.
  4. **Keamanan & Aksesibilitas (WCAG AA & rel):**
     - Setiap tautan media sosial wajib memiliki atribut:
       - `target="_blank"`
       - `rel="noopener noreferrer"`
       - `aria-label` deskriptif spesifik (misal: `"LinkedIn Resmi PT Euodoo"`, `"YouTube Channel Resmi PT Euodoo"` / dwibahasa).
  5. **Penanganan Baris Sosial Kosong (Zero Socials Graceful Degradation):**
     - Jika seluruh toggle media sosial dimatikan atau seluruh URL kosong, baris kontainer `.social-row` tidak dirender sama sekali dari HTML DOM.
     - Kontainer `.ft-bottom` secara otomatis menyesuaikan tata letak teks hak cipta dan tautan legalitas agar tetap proporsional dan tidak menyisakan ruang kosong atau gap canggung.

---

### 13.3 Acceptance Criteria PRD (Kelompok B)
1. **Single Source of Truth Alamat & Kontak:**
   - Perubahan alamat, telepon, atau label nama lokasi di Pengaturan Situs otomatis ter-update serentak di footer semua halaman dan Halaman Kontak (`/contact`).
   - Tidak ada duplikasi data atau teks alamat/telepon hardcode di view publik.
   - Nomor telepon kantor dan pabrik dirender sebagai tautan `tel:` yang dapat ditekan langsung pada perangkat seluler.
2. **Parser & Validasi Google Maps:**
   - Pengguna dapat memasukkan kode embed `<iframe...>` lengkap atau URL langsung pada admin, dan sistem otomatis mengekstrak URL `src`.
   - Hanya URL dengan domain resmi `google.com/maps/embed` yang diterima; skrip berbahaya atau domain pihak ketiga ditolak.
   - Database hanya menyimpan string URL bersih; frontend merender iframe dengan `loading="lazy"` dan sandbox aman.
3. **Visibilitas Media Sosial:**
   - Tersedia toggle tampilkan/sembunyikan untuk LinkedIn, Instagram, Facebook, dan YouTube di Pengaturan Situs.
   - Ikon hanya muncul jika toggle aktif dan URL `https://` valid.
   - Ikon YouTube tampil dengan proporsi tajam saat diaktifkan.
   - Seluruh fallback URL hardcode di footer EJS dihapus total.
   - Jika semua media sosial nonaktif, baris `.social-row` ditiadakan tanpa merusak estetika footer bottom.
   - Semua tautan eksternal memiliki atribut `rel="noopener noreferrer"` dan `aria-label` aksesibel.

---

## BAGIAN 14: Revisi Kontak & Footer v1 (Kelompok B: Perubahan Spesifikasi)

### 14.1 Penghapusan Kartu "Direct WhatsApp Consultation" pada Halaman Kontak Publik
- **Latar Belakang & Masalah:**
  Pada halaman Kontak publik (`/contact`), terdapat kartu promosi bernuansa navy gradient ("Konsultasi WhatsApp Langsung" / "Direct WhatsApp Consultation") yang menempati ruang vertikal signifikan di kolom informasi kontak. Kartu ini dinilai redundan dan mengalihkan fokus pengguna B2B dari formulir RFQ utama serta kartu informasi kantor/pabrik resmi.
- **Audit Dependensi Antar-Modul:**
  - Field `whatsapp_number` dan `whatsapp_message` pada tabel `settings` dan panel Pengaturan Situs (`/admin/settings`) **TIDAK DIHAPUS**.
  - Nilai nomor WhatsApp ini aktif digunakan secara luas oleh:
    1. Tombol WhatsApp Mengambang global (`views/partials/whatsapp-btn.ejs`) di seluruh halaman publik.
    2. Tombol "Minta Penawaran Cepat" pada halaman detail katalog produk (`views/public/product-detail.ejs`).
    3. Tombol sekunder WhatsApp pada CTA Global Pre-Footer (`views/partials/cta-global.ejs`).
- **Spesifikasi Solusi:**
  1. Menghapus markup HTML kartu "Direct WhatsApp Consultation" (elemen kartu `.office-info-card` navy gradient baris 328-354) secara permanen dari template `views/public/contact.ejs`.
  2. Mengeliminasi styling CSS mati yang eksklusif hanya melayani kartu tersebut (mis. `.wa-pulse-indicator`, `.wa-pulse-ring`, `.wa-pulse-dot` jika ada di `public/css/components.css`).
  3. Memastikan tidak ada field CMS di `/admin/contact` yang menjadi dead code akibat penghapusan ini (berdasarkan audit kode, kartu ini hanya mengonsumsi setting global `settings.whatsapp_number`, tidak memiliki field khusus di CMS Kontak).

---

### 14.2 Fax dan Email Dual Lokasi (Pengaturan Situs, Footer, dan Halaman Kontak)
- **Latar Belakang & Masalah:**
  Melanjutkan arsitektur *Single Source of Truth* alamat dan kontak (T-142), saat ini Pengaturan Situs baru mengakomodasi field `office_fax` untuk Kantor Jakarta, sedangkan Pabrik Bandung belum memiliki field fax (`factory_fax`). Selain itu, alamat email lokasi kantor Jakarta dan pabrik Bandung belum dapat dikelola secara independen (`office_email` dan `factory_email`), sehingga halaman kontak dan footer masih mengandalkan fallback `company_email` global.
- **Spesifikasi Solusi:**
  1. **Dual Lokasi Master Data di Pengaturan Situs (`/admin/settings`):**
     - Lokasi 1 (Kantor Pusat / Jakarta):
       - Menyediakan input `office_fax` (sudah ada di DB).
       - Menambahkan input baru `office_email` (default: `'info@euodoo.com'`).
     - Lokasi 2 (Pabrik Manufaktur / Bandung):
       - Menambahkan input baru `factory_fax` (default kosong).
       - Menambahkan input baru `factory_email` (default kosong).
  2. **Konsumsi Single Source of Truth:**
     - Partial Footer (`views/partials/footer.ejs`) dan Halaman Kontak publik (`views/public/contact.ejs`) mengonsumsi data identik langsung dari `res.locals.settings`.
  3. **Aturan Tampilan Kondisional (Zero Empty Rows):**
     - Baris fax dan email HANYA dirender jika nilai kolom terkait terisi (tidak null, tidak string kosong setelah di-trim).
     - Jika field fax atau email kosong, baris tersebut tidak dirender sama sekali dari HTML (tidak menyisakan label kosong atau baris melompong).
  4. **Penanganan Fallback Email:**
     - Untuk Kantor Jakarta: jika `office_email` tidak terisi, sistem dapat melakukan fallback aman ke `company_email` korporat.
     - Untuk Pabrik Bandung: jika `factory_email` kosong, baris email pabrik tidak dirender sama sekali (tidak melakukan fallback ke email kantor pusat agar tidak membingungkan mitra logistik/pabrik).
  5. **Integritas Format Teks vs Protokol Tautan:**
     - Karakter tampilan nomor telepon dan fax (misal: `+6221–53668626` atau `(021) 5366-8626`) **ditampilkan apa adanya** persis sesuai input admin. Dilarang melakukan manipulasi/pengubahan string tampilan secara otomatis.
     - Pembersihan karakter non-angka murni (`cleanTel()`) HANYA diimplementasikan pada atribut tautan protokol `href="tel:..."` guna memastikan kompatibilitas dialer perangkat seluler.
  6. **Validasi & Sanitasi Keamanan Server-Side:**
     - Input email divalidasi dengan format regex email standar, di-trim, dan di-escape.
     - Input fax/telepon dibatasi hanya menerima karakter aman: angka `0-9`, spasi, `+`, `-`, `(`, `)`. Karakter berbahaya atau skrip ditolak pada layer controller.
     - Href `mailto:` dan `tel:` disanitasi ketat dari skema `javascript:` atau karakter liar pembobol atribut HTML.

---

### 14.3 Arsitektur & Spesifikasi Komponen Form Kontak (Keamanan, Aksesibilitas & Kualitas)
- **Latar Belakang & Masalah:**
  Formulir Kontak publik (`/contact`) merupakan pintu gerbang utama konversi RFQ (Request for Quotation) B2B. Implementasi saat ini masih memuat puluhan atribut inline `style=""`, pesan error berbahasa Indonesia yang di-hardcode, belum menerapkan batasan ketat panjang karakter pada seluruh field, serta belum menyertakan state interaksi form yang mulus (hover, focus, disabled loading).
- **Spesifikasi Solusi:**
  1. **Isolasi CSS & Eliminasi Inline Style:**
     - Seluruh styling komponen form kontak diwajibkan menggunakan class CSS terisolasi dengan prefix `.cf-*` (Contact Form) sesuai *Aturan Isolasi CSS* di `DESIGN.md`.
     - Atribut inline `style=""` pada view `views/public/contact.ejs` dihilangkan sepenuhnya (toleransi 0 temuan, kecuali satu-satunya style tersembunyi honeypot `display:none!important`).
  2. **Validasi Server-Side Komprehensif:**
     - **Whitelist Tipe Permintaan:** Field `type` wajib salah satu dari `inquiry` (Permintaan Penawaran), `partnership` (Kemitraan), atau `general` (Pertanyaan Umum).
     - **Validasi Produk Terpilih:** Field `product_id` (opsional) divalidasi berupa integer positif yang valid jika disertakan.
     - **Batas Panjang Karakter (Length Boundaries):**
       - Nama Lengkap (`name`): Maksimal 100 karakter.
       - Nama Perusahaan (`company`): Maksimal 150 karakter.
       - Alamat Email (`email`): Maksimal 100 karakter, format email valid.
       - Nomor Telepon/WhatsApp (`phone`): Minimal 7, maksimal 30 karakter, karakter valid.
       - Estimasi Kebutuhan (`quantity`): Maksimal 100 karakter.
       - Pesan Kebutuhan (`message`): Maksimal 3000 karakter.
     - **Sanitasi String:** Seluruh input string di-trim dari spasi berlebih di awal/akhir.
  3. **Integritas CSRF & Proteksi Bot Cloudflare Turnstile:**
     - Token CSRF dan verifikasi Turnstile server-side dipertahankan sebagai garda pertahanan utama anti-spam.
  4. **Pencegahan Kebocoran Informasi (Secure Generic Errors):**
     - Pesan kegagalan input atau error internal tidak boleh mengekspos rincian database, nama tabel, query SQL, atau stack trace. Pesan kesalahan disajikan dalam teks bilingual yang informatif dan ramah pengguna.
  5. **Kompatibilitas CSP (Content Security Policy):**
     - Bebas dari inline event handler (`onclick`, `onsubmit`, `onchange`). Seluruh interaktivitas tombol kirim (pencegahan submit ganda, state loading) ditangani via event listener eksternal.

---

### 14.4 Acceptance Criteria PRD (Kelompok B)
1. **Penghapusan Kartu WhatsApp Kontak:**
   - Kartu "Direct WhatsApp Consultation" tidak lagi tampil di halaman `/contact` publik.
   - Tombol mengambang WhatsApp di sudut kanan bawah tetap tampil dan berfungsi di semua halaman.
   - Field `whatsapp_number` dan `whatsapp_message` tetap tersedia dan dapat diedit di `/admin/settings`.
2. **Dual Lokasi Fax & Email:**
   - Admin dapat mengisi dan memperbarui `office_email`, `factory_fax`, dan `factory_email` pada menu Pengaturan Situs.
   - Nilai tersimpan tampil secara harmonis di kartu Kantor Jakarta dan Pabrik Bandung pada halaman Kontak publik serta di footer seluruh halaman.
   - Baris fax/email yang tidak diisi tidak memunculkan baris kosong di publik.
   - Format teks nomor telepon/fax di footer tampil apa adanya sesuai input admin tanpa perubahan otomatis.
   - Karakter berbahaya atau skrip injeksi pada input email dan fax ditolak server-side.
3. **Standar Komponen Form Kontak:**
   - Formulir kontak bersih dari inline style (hanya menyisakan honeypot `display:none!important`).
   - Seluruh field form kontak memiliki validasi server-side ketat (panjang karakter, format, whitelist tipe).
   - Upaya submit dengan karakter berbahaya atau payload melebihi batas menghasilkan response error bilingual yang aman tanpa membocorkan rincian database.
   - Tombol submit beralih ke state loading dan mendisable input untuk mencegah submit ganda.

---

## BAGIAN 15: Homepage Major Update v1 (Kelompok B - 2026-10-19)

### 15.1 Section 4 Panel Kategori Primer ("Produk Unggulan")
- **Tujuan Produk & Latar Belakang:**
  - Mengubah paradigma penjelajahan beranda dari 4 kartu produk acak menjadi 4 panel vertikal kategori primer industri.
  - Memudahkan pengunjung B2B (manajer pengadaan dan distributor) langsung melompat ke katalog spesifik sesuai jenis kebutuhan kemasan plastik mereka.
- **Karakteristik & Persyaratan Fungsional:**
  - *Judul Section:* Tetap mempertahankan judul resmi "Produk Unggulan" (`.prod-title`) guna menjaga konsistensi identitas merek dan SEO.
  - *Tampilan Panel:* 4 panel vertikal selebar kontainer tanpa jarak (0 gap), tinggi proporsional, gambar cover latar belakang, overlay gradien gelap di bawah, nama kategori bold putih, dan jumlah produk terbit di kiri bawah.
  - *Pemilihan 4 Kategori Primer:* Dikelola melalui admin CMS atau diambil dari urutan teratas (`sort_order` / flag primer) kategori produk aktif.
  - *Sumber Gambar:* Memanfaatkan aset gambar yang sudah ada atau dipilih melalui Universal Media Picker admin.
  - *Perhitungan Jumlah Produk:* Dihitung secara otomatis di backend hanya dari produk yang berstatus aktif dan terbit (`status = 'published'`).
  - *Penanganan Kategori Kurang dari 4:* Grid secara fleksibel membagi lebar panel secara proporsional atau fallback menampilkan kategori umum agar panel tetap seimbang.
  - *Interaksi Deep Link:* Klik pada panel langsung membuka halaman `/products?category=:slug` dengan filter kategori aktif terpilih.
  - *Penanganan Kategori Tanpa Produk:* Halaman produk menampilkan komponen state kosong yang ramah dengan tombol reset filter ke seluruh katalog.
  - *Adaptasi Mobile:* Di layar smartphone, layout beralih rapi ke scroll snap horizontal atau susunan panel proporsional yang nyaman disentuh.

### 15.2 Section Why Choose Us / Kenapa Memilih Kami
- **Tujuan Produk & Latar Belakang:**
  - Menggantikan layout 3 kartu pilar lama yang monoton menjadi layout editorial asimetris modern yang menonjolkan inovasi aditif OXIUM dan tanggung jawab lingkungan PT Euodoo.
- **Karakteristik & Persyaratan Fungsional:**
  - *Komposisi Layout:* Identik referensi visual dan file `public/Why Choose Us — OXIUM.html`:
    - Eyebrow bertitik hijau daun.
    - Judul dengan aksen tanda tanya hijau.
    - Chip kicker berikon dan berlatar lembut.
    - Headline dengan frasa yang disorot highlight.
    - Paragraf utama dengan penekanan kata kunci tebal.
    - Blok callout bergaris kiri hijau solid (lead tebal + teks penjelasan).
    - Catatan kecil komitmen mutu di bagian bawah.
    - Sisi kanan: kartu artbox bergradien hijau segar dengan label melayang kiri atas, ilustrasi SVG alam statis, dan floating card berbayang di kanan bawah.
  - *Ketiadaan Accordion:* TANPA tombol "Tutup detail"/"Sembunyikan detail" dan TANPA accordion; seluruh isi selalu tampil penuh secara terbuka.
  - *Status Aset SVG:* SVG merupakan aset grafis statis di template/partial kode (bukan file unggahan dinamis admin).
  - *Kebijakan Teks Seed & Perlindungan Copywriting:*
    - Dilarang membawa kalimat catatan internal redaksi ("Untuk publikasi, lengkapi klaim teknis ... laporan pengujian").
    - Seluruh klaim lingkungan teknis (seperti "100% terdegradasi menjadi biomassa dan air", "tanpa menyisakan mikroplastik", "standar resmi SNI") ditandai sebagai teks yang harus mendapatkan persetujuan eksplisit user.

### 15.3 Admin CMS Konten Homepage
- **Pembaruan Tab Admin:**
  - Tab 2 "Pilar Keunggulan" diubah label dan strukturnya menjadi "Kenapa Memilih Kami".
  - Seluruh elemen teks Why Choose Us dapat diedit bilingual (ID/EN): eyebrow, judul, chip (ikon + label), headline, frasa highlight, paragraf, lead & bodi callout, catatan kecil, label melayang artbox, dan teks floating card.
  - Tersedia form konfigurasi 4 Kategori Homepage: judul section (ID/EN) dan picker gambar tiap panel dari Media Library.
- **Keamanan Pemformatan Teks:**
  - Rancang mekanisme penanda format yang aman (seperti delimiter markdown sederhana) yang di-parse di server-side dan output-nya di-escape secara ketat untuk mencegah injeksi tag HTML mentah (anti-XSS).

### 15.4 Pensiun Fitur Produk Unggulan (Featured) di Admin & Migrasi Database
- Fitur checkbox "Jadikan Produk Unggulan" pada katalog produk admin dipensiunkan karena fungsinya telah digantikan secara penuh oleh kategori primer beranda.
- **Persetujuan Resmi User (Keputusan Terkunci 4 - Opsi B):** Mengadopsi Hard Deprecation dengan menghapus kolom `is_featured` dari tabel `products` melalui file migrasi SQL DDL resmi (`database/migrations/011_drop_product_is_featured.sql`) dan membersihkan seluruh dependensinya di model, controller, dan antarmuka admin.

### 15.5 Acceptance Criteria PRD (Homepage Major Update v1)
1. Section "Produk Unggulan" beranda berhasil bertransformasi menjadi 4 panel kategori vertikal tanpa jarak dengan tautan deep link ke katalog produk.
2. Section "Keunggulan Kami" berhasil digantikan oleh layout Why Choose Us lengkap dengan kartu artbox SVG statis dan seluruh konten tampil terbuka tanpa accordion.
3. Seluruh teks Why Choose Us dan gambar panel kategori dapat dikonfigurasi melalui panel admin CMS secara bilingual (ID/EN).
4. Tidak ada kalimat catatan internal editor yang masuk ke teks publik, dan seluruh klaim lingkungan telah disetujui user.
5. Halaman katalog `/products?category=:slug` mengenali deep link dengan filter aktif dan menyediakan penanganan state kosong yang informatif.
6. Seluruh section lain di homepage tetap 100% identik dan bebas regresi visual.

---

## 16. Revisi Homepage: CTA Hero + Merek v1 (2026-10-20)

### 16.1 Fitur Dual Button Hero CTA (Tombol Utama & Tombol Kedua per Slide)
- **Tujuan Produk & Latar Belakang:**
  - Mengatasi bug di mana tombol hero saat ini hanya mengarah ke `/contact` karena URL kosong di database dan fallback template.
  - Memberikan fleksibilitas penuh bagi admin untuk mengatur hingga dua tombol aksi per slide banner: Tombol Utama (*Primary CTA*) dan Tombol Kedua (*Secondary CTA*).
  - Menghilangkan tombol kedua statis hardcoded (`/about` "Lihat Detail") dan menggantikannya dengan konfigurasi dinamis berbasis database per slide.
- **Karakteristik & Persyaratan Fungsional:**
  - *Konfigurasi Lengkap per Slide:* Setiap slide banner memiliki input mandiri untuk:
    - Tombol Utama: Teks ID (`cta_text_id`), Teks EN (`cta_text_en`), URL Tujuan (`cta_url`).
    - Tombol Kedua: Teks ID (`cta_secondary_text_id`), Teks EN (`cta_secondary_text_en`), URL Tujuan (`cta_secondary_url`).
  - *Fleksibilitas URL:* URL tujuan dapat mengarah ke path internal (misal `/products`, `/contact`, `#why-us`, `#merek`) atau tautan eksternal (misal `https://wa.me/...`, `https://...`).
  - *Validasi & Keamanan Ketat:*
    - Hanya mengizinkan URL yang diawali protokol `http://` atau `https://`, atau path internal yang diawali `/` atau `#`.
    - Menolak keras skema protokol berbahaya: `javascript:`, `data:`, `vbscript:`, serta protocol-relative URL `//`.
    - Batas panjang: teks tombol maksimal 100 karakter, URL tujuan maksimal 500 karakter.
  - *Keamanan Link Eksternal:*
    - URL eksternal (diawali `http://` atau `https://`) secara otomatis dirender dengan atribut `target="_blank" rel="noopener noreferrer"` untuk keamanan dan kenyamanan browsing pengguna.
    - URL internal dirender tanpa `target="_blank"` untuk transisi halaman standar.
  - *Kondisional Rendering:*
    - Tombol hanya dirender jika teks tombol memiliki nilai tidak kosong. Jika teks tombol dikosongkan oleh admin, tombol tersebut tidak dirender di DOM publik.
  - *Backward Compatibility & Fallback URL (Keputusan Terkunci 4 - Opsi B):*
    - Field URL tombol utama bersifat opsional di admin. Jika dikosongkan (atau banner lama yang belum memiliki URL tujuan), sistem secara bawaan otomatis fallback mengarah ke `/contact` dengan teks tombol yang dikonfigurasi.
  - *Tata Letak Mobile Stack Vertikal (Keputusan Terkunci 3 - Opsi A):*
    - Pada viewport mobile (< 640px), kontainer tombol hero menggunakan susunan vertikal selebar kontainer (100% width) dengan tinggi sentuh minimum 44px untuk memenuhi standar aksesibilitas WCAG AA touch target.

### 16.2 Section Merek Sederhana (Strip Marquee Kontinu Minimalis)
- **Tujuan Produk & Latar Belakang:**
  - Menyederhanakan section merek mengikuti referensi visual gambar 1: menghilangkan kesan kartu yang terlalu ramai, menghilangkan tombol zoom preview yang tidak relevan untuk B2B, dan menghadirkan strip logo yang bersih, elegan, dan profesional.
- **Karakteristik & Persyaratan Fungsional:**
  - *Judul Dinamis dari Menu Admin Merek Terdaftar (Keputusan Terkunci 1 - Opsi B):*
    - Menggantikan label kecil lama, judul panjang, dan paragraf deskripsi menjadi judul terpusat yang dapat diatur langsung melalui menu Admin Merek Terdaftar (`/admin/brands`).
    - Disimpan pada tabel `settings` (`home_brand_title_id` dan `home_brand_title_en`) dengan nilai bawaan "Merek Paten & Terdaftar" (ID) dan "Registered Trademarks" (EN).
  - *Pemberantasan Elemen Mengganggu:*
    - Paragraf deskripsi copywriting 3 dekade dihapus sepenuhnya.
    - Teks nama merek di bawah logo dihapus dari tampilan visual.
    - Ikon zoom hint dan modal popup lightbox zoom TETAP DIPERTAHANKAN aktif pada logo strip marquee untuk kenyamanan interaksi preview visual pengunjung.
  - *Visual Strip Marquee Minimalis & Duplikasi Track (Keputusan Terkunci 2 - Opsi A):*
    - Logo ditampilkan langsung di atas latar belakang bersih tanpa bingkai kartu (card-less) dan tanpa bayangan tebal.
    - Ukuran logo seragam dengan `object-fit: contain` proporsional.
    - Jika jumlah merek aktif kurang dari 8 item, array merek diduplikasi otomatis secara berulang (minimal 8 s/d 12 item) di level server/template agar putaran loop kontinu berjalan mulus tanpa ruang kosong terputus di monitor lebar (1920px+).
    - Animasi berjalan kontinu secara horizontal dengan efek memudar (gradient mask) di tepi kiri dan kanan.
    - Animasi otomatis jeda (*pause*) saat kursor mouse melayang di atas strip atau saat elemen difokuskan melalui keyboard.
  - *Aksesibilitas & Reduced Motion (WCAG AA):*
    - Nama merek wajib disematkan pada atribut `alt` dan `aria-label` logo sehingga pembaca layar tetap mengenali merek dengan tepat.
    - Track duplikat diberi atribut `aria-hidden="true"`.
    - Pada sistem dengan `prefers-reduced-motion: reduce`, animasi bergerak otomatis dimatikan dan digantikan oleh susunan logo statis yang tertata rapi.

### 16.3 Acceptance Criteria PRD (Revisi Homepage: CTA Hero + Merek v1)
1. Form admin CMS Banner Hero memiliki grup input terpisah untuk Tombol Utama dan Tombol Kedua dengan teks dwibahasa (ID/EN) dan URL tujuan yang tervalidasi.
2. Link tombol hero publik merender URL tujuan dinamis sesuai input admin dan tidak lagi terjebak fallback `/contact` bila URL valid telah disetel; jika URL dikosongkan, fallback ke `/contact` bekerja mulus.
3. Link eksternal pada tombol hero otomatis membuka tab baru dengan atribut `rel="noopener noreferrer"`.
4. Tombol yang teksnya dikosongkan di admin tidak dirender di DOM halaman publik.
5. Pada mobile (< 640px), tombol hero tertata rapi dalam susunan stack vertikal 100% width dengan touch target nyaman.
6. Menu Admin Merek Terdaftar (`/admin/brands`) menyediakan form pengaturan judul section beranda dwibahasa (ID/EN).
7. Section merek publik tampil bersih tanpa kartu dan tanpa nama teks di bawah logo, melainkan strip marquee logo kontinu yang elegan dengan judul terpusat dinamis dari pengaturan admin serta fitur modal zoom preview yang tetap aktif saat logo diklik.
8. Track marquee berputar mulus tanpa jeda kosong bahkan saat jumlah merek aktif < 8 berkat duplikasi array otomatis di SSR.
9. Ujung kiri dan kanan strip marquee memiliki efek memudar halus via CSS mask dan jeda saat hover/focus.
10. Seluruh kode mati kartu merek lama dan key i18n usang dibersihkan dengan tetap menjaga modal zoom preview dan handler JS berjalan lancar tanpa error console.
11. Seluruh section lain di homepage tetap 100% utuh dan bebas regresi visual.



