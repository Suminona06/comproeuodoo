# PRD: Website Company Profile PT Euodoo

- **Versi:** 1.0
- **Tech Stack:** Express.js + MySQL
- **Design Reference:** `Design/DESIGN.md` (Pacific Corporate & Energy)
- **Bahasa:** Indonesia dan Inggris

---

## BAGIAN 1: Visi & Tujuan Produk

### Visi Produk
Menjadi wajah digital resmi PT Euodoo yang meyakinkan bagi klien B2B dan mitra industri, dengan menyajikan produk, kapabilitas, dan kredibilitas perusahaan dalam satu situs yang cepat, mudah diperbarui tim internal, dan siap melayani pengunjung Indonesia maupun internasional.

### Tujuan Utama
1. Menyediakan satu sumber informasi resmi perusahaan (profil, produk, layanan, sertifikasi, kontak) - indikator: seluruh halaman inti tayang dan 100% informasi kontak/produk terkelola dari CMS.
2. Menghasilkan lead B2B terukur - indikator: setiap pengajuan penawaran tercatat di database dengan status yang bisa dipantau tim sales.
3. Menjangkau mitra internasional - indikator: konten utama tersedia dalam Bahasa Indonesia dan Inggris.
4. Menjaga kecepatan dan keandalan akses - indikator: halaman termuat di bawah 2 detik pada koneksi 4G dan API merespons di bawah 500ms.
5. Memudahkan tim non-teknis memperbarui konten - indikator: perubahan berita/produk/banner dapat dipublikasikan tanpa deploy ulang.

### Value Proposition
- Konten dwibahasa (ID/EN) sejak versi pertama, bukan terjemahan tambahan di kemudian hari.
- Desain corporate-industrial premium mengikuti design system "Pacific Corporate & Energy", sehingga tampil beda dari template company profile generik.
- Admin panel ringan berbasis Express.js + MySQL, tim internal dapat mengelola berita, produk, banner, dan lead sendiri.

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

## BAGIAN 3: User Stories

### Modul 1: Kunjungan Publik & Navigasi
- Sebagai pengunjung, saya ingin melihat profil perusahaan di halaman beranda, agar cepat menilai apakah PT Euodoo cocok sebagai pemasok.
- Sebagai pengunjung, saya ingin berpindah antar halaman lewat navigasi yang jelas, agar menemukan informasi tanpa tersesat.
- Sebagai pengunjung internasional, saya ingin mengganti bahasa ke Inggris, agar memahami konten sesuai preferensi saya.
- Sebagai pengunjung, saya ingin membuka situs dari ponsel dengan nyaman, agar bisa menelusuri saat di lapangan.

### Modul 2: Produk & Kapabilitas
- Sebagai manajer pengadaan, saya ingin melihat daftar produk beserta material dan spesifikasinya, agar bisa mencocokkan dengan kebutuhan produksi.
- Sebagai manajer pengadaan, saya ingin melihat kapabilitas pabrik dan mesin, agar yakin PT Euodoo sanggup memenuhi volume saya.
- Sebagai mitra distributor, saya ingin melihat lini produk per kategori, agar menilai kecocokan portofolio distribusi.
- Sebagai pengunjung, saya ingin melihat galeri fasilitas dan proses produksi, agar menilai kredibilitas manufaktur.

### Modul 3: Lead & Kontak
- Sebagai manajer pengadaan, saya ingin mengisi formulir permintaan penawaran, agar bisa memulai proses pengadaan.
- Sebagai mitra distributor, saya ingin mengirim pengajuan kemitraan, agar tim PT Euodoo bisa menindaklanjuti.
- Sebagai pengunjung, saya ingin menghubungi perusahaan lewat WhatsApp, telepon, atau email yang tertera, agar bisa bertanya langsung.
- Sebagai pengunjung, saya ingin menekan tombol WhatsApp mengambang di halaman mana pun, agar bisa langsung bertanya tanpa mencari halaman kontak.

### Modul 4: Autentikasi Admin
- Sebagai admin, saya ingin login dengan email dan password, agar bisa mengakses panel pengelolaan.
- Sebagai admin, saya ingin mengganti password, agar akun tetap aman.
- Sebagai admin, saya ingin keluar dari sesi, agar akses di perangkat bersama tidak disalahgunakan.

### Modul 5: Manajemen Konten (CMS)
- Sebagai admin, saya ingin menambah, mengubah, dan menghapus data produk, agar katalog selalu akurat.
- Sebagai admin, saya ingin mengelola artikel berita dan publikasi, agar situs tetap aktif dan relevan.
- Sebagai admin, saya ingin menambah dan mengubah banner hero, baik berupa gambar maupun video, agar tampilan depan bisa mengikuti kampanye atau produk unggulan terbaru.
- Sebagai admin, saya ingin mengatur urutan dan status banner (aktif atau nonaktif), agar hanya banner yang relevan tampil di hero card.
- Sebagai admin, saya ingin mengubah nomor WhatsApp di pengaturan, agar floating button menuju nomor yang benar.
- Sebagai admin, saya ingin melihat daftar lead yang masuk beserta statusnya, agar tidak ada permintaan yang terlewat.

---

## BAGIAN 4: Functional Requirements

### Modul 1: Autentikasi Admin

**FR-01: Login Admin**
- **Input:** Email, password.
- **Proses:** Cek kredensial terhadap tabel `users`, verifikasi hash password (bcrypt), buat sesi JWT.
- **Output:** Token sesi, redirect ke dashboard admin.
- **Aturan:** 5 kali gagal berturut-turut diblokir 15 menit. Sesi kedaluwarsa 24 jam.

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

### Modul 2: Halaman Publik & Navigasi

**FR-04: Render Halaman Publik**
- **Input:** Permintaan URL halaman (beranda, produk, tentang, kontak).
- **Proses:** Ambil konten dari MySQL, render via template engine Express.
- **Output:** Halaman HTML lengkap.
- **Aturan:** Halaman tidak ada mengembalikan 404 dengan halaman kustom.

**FR-05: Pilih Bahasa**
- **Input:** Pilihan bahasa (ID/EN).
- **Proses:** Simpan preferensi bahasa di cookie, muat konten sesuai kolom bahasa.
- **Output:** Halaman dengan konten bahasa terpilih.
- **Aturan:** Bahasa default Indonesia. Konten yang belum diterjemahkan menampilkan versi Indonesia dengan label.

### Modul 3: Produk & Kapabilitas

**FR-06: Daftar Produk**
- **Input:** Filter kategori (opsional).
- **Proses:** Query tabel `products` dengan kondisi status aktif.
- **Output:** Grid produk dengan nama, gambar utama, dan kategori.
- **Aturan:** Produk nonaktif tidak tampil di halaman publik.

**FR-07: Detail Produk**
- **Input:** Slug produk.
- **Proses:** Ambil data produk, spesifikasi, material, dan galeri gambar.
- **Output:** Halaman detail dengan tombol minta penawaran.
- **Aturan:** Slug unik. Detail menyertakan tombol yang mengisi otomatis nama produk di form penawaran.

**FR-08: Kapabilitas & Fasilitas**
- **Input:** Permintaan halaman kapabilitas.
- **Proses:** Ambil data mesin, kapasitas, dan tahapan produksi.
- **Output:** Halaman kapabilitas dengan daftar mesin dan foto fasilitas.
- **Aturan:** Data dikelola lewat CMS (lihat FR-15).

### Modul 4: Banner Hero & Media

**FR-09: Tampil Banner Hero**
- **Input:** Permintaan halaman beranda.
- **Proses:** Ambil banner aktif diurutkan sesuai `sort_order`.
- **Output:** Hero card menampilkan gambar atau video yang sedang aktif.
- **Aturan:** Hanya banner berstatus aktif yang tampil. Video harus punya poster image sebagai fallback.

**FR-10: Kelola Banner (Gambar & Video)**
- **Input:** File gambar (JPG, PNG, WebP) atau video (MP4, WebM), judul, link opsional.
- **Proses:** Validasi tipe dan ukuran file, simpan file ke folder upload, catat metadata ke tabel `banners`.
- **Output:** Banner baru masuk daftar dan tampil di hero bila aktif.
- **Aturan:** Gambar maksimal 5MB, video maksimal 30MB. Tipe file divalidasi dari MIME type, bukan hanya ekstensi. Hanya admin bisa mengakses menu ini.

**FR-11: Atur Urutan & Status Banner**
- **Input:** Nilai urutan dan status aktif/nonaktif.
- **Proses:** Update kolom `sort_order` dan `is_active` pada tabel `banners`.
- **Output:** Perubahan urutan dan status langsung berlaku di beranda.
- **Aturan:** Minimal satu banner aktif agar hero tidak kosong.

### Modul 5: Lead & Kontak

**FR-12: Form Permintaan Penawaran**
- **Input:** Nama, perusahaan, email, telepon, produk yang diminati, jumlah, pesan.
- **Proses:** Validasi field wajib, simpan ke tabel `leads` dengan status `baru`.
- **Output:** Pesan konfirmasi di halaman dan notifikasi email ke tim sales.
- **Aturan:** Email harus valid. Proteksi anti-spam (honeypot atau rate limit per IP).

**FR-13: Form Pengajuan Kemitraan**
- **Input:** Nama, perusahaan, email, telepon, jenis kemitraan, pesan.
- **Proses:** Simpan ke tabel `leads` dengan tipe `partnership`.
- **Output:** Konfirmasi dan notifikasi ke tim terkait.
- **Aturan:** Field wajib sama dengan FR-12, tipe lead dibedakan.

**FR-14: Channel Kontak Langsung**
- **Input:** Klik pada WhatsApp, telepon, atau email.
- **Proses:** Buka tautan `wa.me`, `tel:`, atau `mailto:`.
- **Output:** Aplikasi eksternal terbuka sesuai aksi.
- **Aturan:** Nomor dan alamat diambil dari pengaturan situs yang dikelola admin.

**FR-19: Floating Button WhatsApp**
- **Input:** Nomor WhatsApp dari pengaturan situs.
- **Proses:** Render tombol mengambang di sudut kanan bawah pada semua halaman publik, tautan memakai format `wa.me/<nomor>` dengan pesan awal opsional.
- **Output:** Tombol WhatsApp tetap terlihat saat halaman digulir.
- **Aturan:** Nomor diambil dari tabel `settings` (`whatsapp_number`), sehingga admin dapat mengubahnya tanpa deploy. Tombol disembunyikan otomatis jika nomor belum diisi. Tombol tidak menutupi elemen interaktif lain terutama di layar ponsel.

### Modul 6: Manajemen Konten

**FR-15: CRUD Produk & Kapabilitas**
- **Input:** Data produk (nama, kategori, material, spesifikasi, gambar), data mesin.
- **Proses:** Validasi, simpan atau update ke tabel terkait.
- **Output:** Daftar produk dan kapabilitas diperbarui.
- **Aturan:** Slug dibuat otomatis dari nama dan dijaga unik.

**FR-16: CRUD Berita & Publikasi**
- **Input:** Judul, isi, gambar sampul, tanggal terbit, status.
- **Proses:** Simpan ke tabel `posts`, bisa disimpan sebagai draf.
- **Output:** Artikel tampil di halaman berita sesuai status.
- **Aturan:** Draf tidak tampil di publik. Isi mendukung rich text dasar.

**FR-17: Kelola Lead**
- **Input:** Daftar lead dengan filter tipe dan status.
- **Proses:** Admin mengubah status (baru, diproses, selesai, ditolak) dan menambah catatan.
- **Output:** Daftar lead dengan status terbaru, bisa diekspor CSV.
- **Aturan:** Riwayat perubahan status tersimpan.

**FR-18: Pengaturan Situs**
- **Input:** Nama perusahaan, alamat, telepon, nomor WhatsApp, email, tautan sosial media, teks footer, pesan awal WhatsApp (opsional).
- **Proses:** Simpan ke tabel `settings` sebagai key-value, validasi format nomor WhatsApp (kode negara, digit).
- **Output:** Perubahan langsung berlaku di seluruh halaman publik, termasuk floating button WhatsApp.
- **Aturan:** Hanya admin yang bisa mengubah. Nomor WhatsApp divalidasi sebelum disimpan.

---

## BAGIAN 5: Non-Functional Requirements

### Performa
- Waktu muat halaman < 2 detik pada koneksi 4G untuk halaman beranda dan produk.
- Respons API < 500ms untuk endpoint data (produk, berita, lead).
- Gambar dioptimasi otomatis (resize dan kompresi) saat upload.
- Video hero dimuat dengan `preload="metadata"` dan poster image agar halaman tidak terblokir.
- Mendukung minimal 500 pengunjung bersamaan tanpa degradasi berarti.

### Keamanan
- Password admin di-hash dengan bcrypt.
- HTTPS wajib di produksi, redirect otomatis dari HTTP.
- Sesi JWT kedaluwarsa dalam 24 jam dan divalidasi di setiap endpoint admin.
- Validasi dan sanitasi semua input form untuk mencegah SQL injection dan XSS.
- Query memakai prepared statement, bukan string concatenation.
- Upload file divalidasi dari MIME type dan ukuran, disimpan di luar direktori publik atau diakses lewat route terproteksi.
- Rate limit pada endpoint login dan form lead untuk mencegah spam.
- CSRF token pada form admin.
- Role-based access control: hanya admin terautentikasi yang bisa mengakses dashboard.

### Skalabilitas
- Arsitektur Express.js tanpa state, siap dijalankan di belakang load balancer.
- Session token stateless agar bisa scale horizontal.
- Index database pada kolom yang sering di-query (slug, status, kategori, tanggal).
- Struktur tabel dirancang untuk pertumbuhan konten tanpa migrasi besar.

### Usability
- Responsif penuh mengikuti 12/8/4 kolom sesuai design system: desktop, tablet, mobile.
- Bahasa Indonesia dan Inggris.
- Kontras teks memenuhi WCAG AA (rasio minimal 4.5:1 untuk teks normal).
- Navigasi bisa diakses lewat keyboard dengan indikator fokus yang jelas.
- Tombol dan kontrol utama punya target sentuh minimal 44px.
- Setiap halaman data punya kondisi kosong, loading, dan error.

### SEO & Aksesibilitas
- Setiap halaman punya meta title, meta description, dan Open Graph tag.
- URL bersih berbasis slug.
- `sitemap.xml` dan `robots.txt` otomatis.
- Struktur heading berurutan (H1 tunggal per halaman).
- Atribut `alt` wajib pada gambar.

### Maintainability & Operasional
- Kode terstruktur modular: routes, controllers, models, views terpisah.
- Konfigurasi (kredensial DB, secret JWT) dibaca dari environment variable, tidak ditulis di kode.
- Migrasi database versi terkontrol.
- Backup database otomatis harian.
- Kompatibel dengan Node.js LTS dan versi MySQL 8.

### Reliability
- Error handling global menampilkan halaman error tanpa membocorkan detail internal.
- Logging aktivitas admin dan error server untuk audit.
- Ketersediaan target 99.5% per bulan.

---

## BAGIAN 6: Out of Scope & Dependensi

### Out of Scope (Tidak Dikerjakan di V1)
- E-commerce dan keranjang belanja: ditunda ke v2.
- Customer portal dan login pelanggan: ditunda ke v2.
- Pembuatan penawaran (quotation) otomatis dan PDF: ditunda ke v2.
- Integrasi ERP atau sistem inventory internal: ditunda ke v2.
- Payment gateway: ditunda ke v2.
- Live chat selain floating WhatsApp: ditunda ke v2.
- Multi-currency dan kalkulator harga: ditunda ke v2.
- Komentar publik pada artikel: ditunda ke v2.
- Dashboard analitik lanjutan: v1 hanya memakai alat analitik pihak ketiga.
- Manajemen multi-peran dengan hak akses granular: v1 hanya peran admin tunggal.

### Dependensi
- Express.js - framework web dan routing.
- MySQL 8 - database utama.
- mysql2 - driver koneksi database.
- EJS (atau template engine sejenis) - render halaman server-side.
- multer - upload gambar dan video banner.
- sharp - resize dan kompresi gambar saat upload.
- bcrypt - hash password admin.
- jsonwebtoken - sesi admin.
- helmet, express-rate-limit, dan CSRF middleware - keamanan.
- nodemailer - notifikasi email lead.
- dotenv - konfigurasi environment.
- Design system `Design/DESIGN.md` (Pacific Corporate & Energy) - acuan warna, tipografi, spacing, dan komponen untuk semua halaman.

### Infrastruktur
- VPS atau hosting Node.js.
- Domain resmi PT Euodoo.
- Sertifikat SSL/TLS.
- Penyimpanan file untuk aset upload (lokal atau object storage).
- Layanan SMTP untuk email notifikasi.

### Asumsi
- Pengunjung punya koneksi internet yang stabil.
- Tim PT Euodoo menyediakan materi asli: profil perusahaan, data produk, spesifikasi, foto fasilitas, logo, dan video banner.
- Nomor WhatsApp resmi dan email sales tersedia untuk diisi admin.
- Konten diterjemahkan ke Inggris oleh tim PT Euodoo atau penerjemah.
- Admin punya akses browser modern dan pemahaman dasar penggunaan CMS.
