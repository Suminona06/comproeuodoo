Status: ACTIVE | Terakhir diverifikasi: 2026-11-03 | Kode: routes/adminRoutes.js, controllers/admin/, views/admin/

# PRD: Modul Admin & CMS (Admin CMS & Users)

## 1. Ringkasan & Ruang Lingkup
Modul Admin CMS mengelola panel kendali konten, manajemen pengguna, kontrol akses berbasis peran (RBAC), tinjauan metrik ringkasan pada dashboard, serta pengelolaan prospek masuk (inquiries/RFQ).

---

## 2. Functional Requirements

### FR-01: Autentikasi Login Admin
- Akses melalui antarmuka khusus di `/admin/login`.
- Input kredensial: Email dan Password.
- Mekanisme session berbasis JWT yang disimpan di Cookie HttpOnly aman.
- Proteksi brute-force login: pembatasan percobaan gagal maksimal 5 kali dalam 15 menit. Jika terlampaui, akun terkunci sementara (`locked_until`).

### FR-02: Logout Admin
- Mengakhiri sesi pengguna secara aman melalui POST atau GET `/admin/logout`.
- Menghapus cookie JWT dan mengarahkan kembali ke halaman login.

### FR-03: Ganti Password Pengguna
- Pengguna yang telah diautentikasi dapat memperbarui kata sandi mandiri di `/admin/change-password`.
- Validasi kata sandi saat ini dan penegakan kekuatan kata sandi baru (minimal 8 karakter).

### FR-04: Role-Based Access Control (RBAC)
- Tiga tingkatan peran pengguna:
  1. **Superadmin:** Hak akses penuh ke seluruh menu sistem, termasuk Pengaturan Situs, Manajemen Pengguna, dan Penghapusan Data Media.
  2. **Admin:** Hak akses operasional mengelola Banner, Merek, Produk, Kategori, Berita, Kapabilitas, Konten Beranda, Tentang Kami, Kontak, dan Inquiries. Tidak dapat mengelola Pengguna atau Pengaturan Global.
  3. **Editor:** Hak akses terbatas hanya untuk mengelola Artikel Berita, Kategori Berita, dan mengunggah ke Media Library.

### FR-16: Pengelolaan Inquiries / Permintaan Penawaran RFQ
- Tinjauan seluruh formulir masuk di `/admin/inquiries` (dengan alias `/admin/leads`).
- Filter status data: Semua, Baru (`baru`), Sudah Dibaca (`dibaca`), Ditindaklanjuti (`ditindaklanjuti`), Ditolak (`ditolak`).
- Modal/Halaman rincian pesan untuk memeriksa spesifikasi kebutuhan produk mitra.
- Kolom catatan internal admin (`admin_notes`) untuk mencatat tindak lanjut tim sales.
- Fitur Ekspor Data ke berkas `.csv` melalui `/admin/inquiries/export`.

### FR-23: Manajemen Pengguna (Superadmin Only)
- Pembuatan akun baru (`/admin/users/create`), daftar pengguna (`/admin/users`), pengeditan peran, dan penonaktifan/penghapusan akun.
- Pencegahan penghapusan akun diri sendiri yang sedang login.

### FR-24: Komponen Dropdown Kustom Terpadu Multi-Varian (.eu-dd-*)
- Seluruh elemen pemilihan opsi di antarmuka Admin (form tambah/edit, modal salin struktur kolom tabel ukuran, filter toolbar, dan status baris tabel) serta halaman publik terkait menggunakan komponen dropdown kustom terstandarisasi `.eu-dd`:
  1. **Tiga Varian Resmi Berbasis Token (Seidentik Gambar Referensi):**
     - Outlined (`.eu-dd--outlined`): Border abu tipis (`var(--color-outline-variant)`), latar putih (`var(--bg-base)`), teks (`var(--color-text-main)`), radius membulat (`var(--radius-lg)`). Digunakan untuk seluruh field form admin dan form kontak publik. Pada form standar, label statis tetap berada di atas field; pada bar filter atau standalone, mendukung label mengambang yang memotong border atas.
     - Filled (`.eu-dd--filled`): Latar abu muda netral (`var(--color-surface-container)`), tanpa border luar, sudut membulat (`var(--radius-lg)`). Digunakan untuk toolbar filter cepat tabel admin dan status baris tabel.
     - Elevated (`.eu-dd--elevated`): Latar putih (`var(--bg-base)`), tanpa border, bayangan lembut (`var(--shadow-level-1)` / `var(--shadow-level-2)`), radius membulat (`var(--radius-lg)`), menampilkan format "Prefix: **Nilai Tebal**" (mis. "Urutkan: **Terpopuler**" atau "Kategori: **Semua Kategori**"). Digunakan untuk bar filter katalog publik dan opsi toolbar menonjol.
  2. **Anatomi Komponen Seidentik Referensi:**
     - Trigger Box: Tinggi standar 52-56px (target sentuh mobile minimal 44px), padding horizontal proporsional, placeholder teks redup (`var(--color-text-muted)`).
     - Caret Indikator: Ikon segitiga padat abu gelap (`var(--color-text-muted)` / `var(--color-text-main)`) di sisi kanan, bertransisi rotasi halus 180 derajat ke atas saat panel terbuka (`transform: rotate(180deg)`).
     - Menu Panel: Latar putih (`var(--bg-base)`), radius (`var(--radius-lg)`), bayangan melayang (`var(--shadow-level-2)`), jarak vertikal ~8px (`var(--space-sm)`) di bawah trigger, lebar 100% mengikuti trigger, z-index (`var(--z-dropdown)`).
     - Slot Ikon / Skeleton Kiri: Slot lingkaran di sisi kiri teks item yang berfungsi ganda: sebagai indikator skeleton shimmer saat memuat data opsi asinkron dan sebagai slot logo/ikon/thumbnail opsional bila opsi memuat metadata visual (jika tidak ada ikon, teks merapat rapi ke kiri).
     - Kotak Pencarian Otomatis: Panel otomatis menyediakan kotak input pencarian di bagian atas jika jumlah opsi > 10 item.
  3. **Matriks State Lengkap:**
     - Default: Border netral atau latar sesuai varian, teks tajam kontras WCAG AAA.
     - Hover: Border/latar menggelap halus via `var(--color-primary-hover)` atau `var(--color-outline)`.
     - Focus-Visible: Ring fokus hijau token resmi (`var(--focus-ring): 0 0 0 3px rgba(0, 117, 90, 0.25)`). Dilarang memakai warna biru atau abu bawaan browser.
     - Open: Caret berputar 180 derajat ke atas, panel muncul dengan transisi transform dan opacity.
     - Item Active / Keyboard Highlight: Latar `var(--bg-subtle)`, teks `var(--color-text-main)`.
     - Item Selected: Latar hijau lembut `var(--primary-subtle)`, teks hijau tegas `var(--color-primary-dark)` dengan indikator centang visual (SVG checkmark).
     - Disabled: Opacity 0.55, cursor not-allowed, pointer-events none.
     - Error: Border dan outline `var(--color-error)`, pesan error inline di bawah trigger sesuai standar T-259.
     - Loading: Skeleton baris lingkaran + batang abu netral beranimasi shimmer.
     - Empty: Pesan empty-state dwibahasa ("Tidak ada opsi" / "No options available").
  4. **Aksesibilitas & Kontrak WAI-ARIA:**
     - Mengikuti pola WAI-ARIA 1.2 Combobox / Listbox Pattern: `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded="true|false"`, `aria-controls="listbox-id"`, `aria-activedescendant="option-id"`.
     - Panel listbox memiliki `role="listbox"`, setiap opsi memiliki `role="option"` dan `aria-selected="true|false"`.
     - Navigasi Keyboard Lengkap: Enter / Space membuka/menutup dan memilih item, ArrowDown / ArrowUp menavigasi opsi aktif, Home / End melompat ke opsi pertama/terakhir, Escape menutup panel dan mengembalikan fokus ke trigger, Tab menutup panel dan memindahkan fokus ke elemen form berikutnya, type-ahead jump mencari opsi berdasarkan huruf pertama yang diketik.
     - Kontrol Viewport & Flip: Jika ruang bawah layar kurang dari tinggi panel (default max-height 260px-280px), panel otomatis membalik (*flip*) ke atas trigger (`.eu-dd-panel--top`).
     - Tampilan Mobile (<= 480px): Panel dropdown melayang biasa seperti desktop dengan pembatasan max-height 240px dan scroll vertikal halus.
     - Isolasi Boundary: Panel tidak terpotong oleh overflow-x/overflow-y container tabel atau modal kartu admin.
     - Satu Dropdown Terbuka: Membuka satu dropdown otomatis menutup dropdown lain yang sedang aktif di dokumen. Klik di luar (*click outside*) menutup panel.
  5. **Sinkronisasi Native `<select>`:**
     - Elemen `<select>` native tetap dipertahankan di dalam markup sebagai kontrol sumber data (fallback non-JS dan submit FormData standar).
     - Sinkronisasi dwiarah: Pemilihan opsi kustom memperbarui `select.value` dan memicu event `dispatchEvent(new Event('change', { bubbles: true }))`.
     - Terintegrasi penuh dengan modul `admin-form-validation.js` (T-259) untuk penandaan class `.is-invalid`, `aria-invalid="true"`, auto-open tab tersembunyi, dan auto-scroll/fokus ke trigger error pertama.

### Dashboard CMS Terpadu (`/admin/dashboard`)
- Menampilkan ringkasan metrik statistik operasional:
  - Jumlah Inquiry Baru yang belum dibaca.
  - Total Produk Aktif dalam katalog.
  - Jumlah Artikel Berita terpublikasi.
  - Tabel 5 Inquiry terbaru untuk penanganan cepat tim sales.

### FR-26: Formulir Produk Admin Terpadu & Field Dinamis
- Pembaruan formulir tambah (`/admin/products/create`) dan ubah (`/admin/products/:id/edit`) dengan komponen terstruktur:
  1. **Thumbnail Utama:** Satu gambar pilihan via Universal Media Picker modal.
  2. **Galeri Foto Produk (Gallery Multi-Picker):** Membuka media picker dalam mode multi-select untuk memilih banyak gambar sekaligus. Dilengkapi tombol panah geser untuk mengatur urutan dan tombol silang (×) untuk menghapus. Disimpan sebagai array JSON string URL (`gallery_images`).
  3. **Deskripsi Singkat (Short Description ID & EN):** Textarea dwibahasa maksimal 200 karakter dilengkapi indikator penghitung karakter real-time (*character counter*).
  4. **Deskripsi Lengkap (Full Description ID & EN):** Integrasi editor teks kaya TinyMCE untuk penulisan deskripsi lengkap berformat.
  5. **Variasi Ukuran Produk (Variant Pills):** Baris dinamis dengan tombol "Tambah Ukuran" (tepat 1 ikon) dan tombol hapus baris (×). Disimpan sebagai array JSON of strings (`variants`).
  6. **Tabel Ukuran Dinamis Per Produk (Size Table):** Builder tabel ukuran dinamis dengan tombol "Tambah Kolom", "Tambah Baris" (tepat 1 ikon), modal "Salin Struktur Kolom dari Produk Lain" (hanya menampilkan produk dengan tabel ukuran), reorder kolom/baris, batas 1–8 kolom, 0–30 baris, label maks 40 char, sel maks 80 char, konfirmasi SweetAlert2 saat menghapus kolom/baris berisi teks, serta navigasi keyboard tombol panah (ArrowUp, ArrowDown, ArrowLeft, ArrowRight) antar sel input dan tombol Enter pada baris terakhir untuk menambah baris baru otomatis. Disimpan sebagai objek JSON `{ columns, rows }`.
  7. **Eliminasi Field Legacy:** Kolom "Ringkasan Karakteristik Material" dan card "Tabel Spesifikasi Teknis Parameter" dieliminasi total dari formulir.
  8. **Kepatuhan Tampilan Form Admin:** Header form tetap (*sticky*), area isi form dapat digulir (*scrollable body*), tombol aksi Simpan/Batal selalu terlihat di layar pada tingkat zoom 100%, 125%, 150% dan ketinggian layar 600–768px.

### FR-27: Validasi Server-Side Data Produk & Whitelist
- Validasi ketat pada endpoint simpan/update produk:
  1. `short_description_id` dan `short_description_en`: string maksimal 200 karakter.
  2. `variants`: array of strings yang disanitasi dari tag berbahaya.
  3. `size_table`: objek JSON valid `{ columns, rows }` di mana setiap kunci sel diverifikasi terhadap whitelist ID kolom produk bersangkutan (`col_xxxx`). Seluruh label kolom dan nilai sel disanitasi bebas tag HTML dan dipangkas spasi (trim).
  4. `gallery_images`: array of strings URL yang valid.
  5. `cta_text_id` dan `cta_text_en`: string maksimal 50 karakter, disanitasi bebas dari tag HTML berbahaya.

### FR-28: Kustomisasi Teks Tombol CTA Produk
- Form create dan edit produk CMS menyediakan input teks dwibahasa untuk kustomisasi tombol aksi CTA halaman detail produk publik:
  1. **Teks Tombol CTA ID (`cta_text_id`):** Label tombol aksi utama bahasa Indonesia (maks 50 karakter). Bersifat opsional, fallback ke default "Minta Penawaran via WhatsApp".
  2. **Teks Tombol CTA EN (`cta_text_en`):** Label tombol aksi utama bahasa Inggris (maks 50 karakter). Bersifat opsional, fallback ke default "Request Quote via WhatsApp".
  3. **Integrasi Kontak WhatsApp:** Tombol CTA tetap mengarah ke WhatsApp menggunakan nomor telepon resmi yang dikelola terpusat di Pengaturan Situs (`settings.whatsapp_number`).

### FR-29: Komponen Tombol Admin Terpadu & Format Slug Ringkas
- Seluruh tombol di panel Admin wajib menggunakan komponen tombol admin terpadu berprefix unik `.adm-btn` (mengacu pada gaya tombol editor tabel ukuran produk) agar terisolasi dari tombol halaman publik:
  1. **Anatomi & Aksesibilitas Seragam:** Tinggi, radius (`var(--r-md)`), padding, jarak ikon, focus ring (`var(--focus-ring)`), state `disabled`, dan state loading (`.is-loading`) saat submit seragam; target sentuh minimal `44px` pada layar mobile (`<= 768px`); ikon SVG inline di sisi kiri selaras makna; label ringkas dwibahasa (ID dan EN) yang telah dikunci disertai `aria-label` deskriptif.
  2. **Empat Varian Resmi Berbasis Token:**
     - `primary` (Simpan/aksi komit utama): latar solid hijau lembut daun dari token (`var(--adm-btn-primary-bg)` / `var(--color-leaf-soft)`), teks & ikon gelap kontras tinggi (`var(--surface-dark-deep)` / `var(--text-main)`, rasio kontras WCAG AAA), border tipis (`var(--adm-btn-primary-border)`).
     - `secondary` (aksi umum/tambah baris/salin/ekspor/pratinjau): outline tipis seperti tombol tabel ukuran (`var(--bg-surface)`, border `var(--border-main)`, teks & ikon `var(--primary)`).
     - `neutral`/`ghost` (batal/kembali/reset): abu-abu netral (`var(--bg-surface)`, border `var(--border-main)`, teks & ikon `var(--text-secondary)`).
     - `danger` (hapus di halaman, tabel, Media Library/Picker, dan modal konfirmasi): latar `var(--st-ditolak-bg)`, border `var(--st-ditolak-border)`, teks & ikon `var(--st-ditolak-text)`.
  3. **Animasi Mikro:** Hanya menggunakan properti `transform` dan `opacity`, efek hover dibungkus `@media (hover: hover)`, state `:active` untuk layar sentuh, dan dinonaktifkan pada `@media (prefers-reduced-motion: reduce)`.
  4. **Format Tampilan Slug Ringkas:** Tampilan slug pada tabel daftar admin (Produk, Artikel Berita, Merek, Kategori) serta pratinjau/input di form tambah/edit hanya merender **1 baris slug tunggal** dengan tipografi monospace kecil (`var(--font-mono)`), warna `var(--text-muted)`, dan pemotongan `text-overflow: ellipsis` tanpa bullet (`&bull;`), tanpa pengulangan judul bahasa Inggris (`name_en`/`title_en`), dan tanpa prefix teks `slug:`. Perilaku pembuatan slug otomatis dan redirect 301 tetap dipertahankan.

### FR-30: Standar Validasi Formulir & Dialog Admin Bertema
- Seluruh form di panel Admin wajib menggunakan atribut `novalidate` dan divalidasi oleh modul JS terpusat tanpa handler inline untuk menggantikan tooltip validasi bawaan browser:
  1. **Validasi Berbasis Atribut Markup & Kontrol Kustom:** Membaca atribut HTML (`required`, `maxlength`, `minlength`, `pattern`, `type`, `min`, `max`) serta memvalidasi komponen kustom (TinyMCE, Media Picker, `select`, repeater WhatsApp, dan editor tabel ukuran).
  2. **Siklus Pemicu Validasi:** Validasi dijalankan saat tombol **Submit** ditekan, lalu berjalan secara *live* (`input`/`change`) per field setelah field tersebut pernah mengalami error agar pesan dan border merah langsung hilang begitu diperbaiki.
  3. **Tampilan Error Inline & Navigasi Tab Otomatis:** Error ditampilkan di bawah field menggunakan warna token error (`var(--color-error)`, `var(--color-error-bg)`), ikon peringatan kecil, border merah token, `aria-invalid="true"`, dan `aria-describedby` dalam bahasa aktif (ID/EN), selaras dengan error validasi server-side. Jika field error berada di dalam tab/panel yang tersembunyi, tab tersebut otomatis dibuka lalu halaman menggulir dan memfokuskan ke field error pertama.
  4. **Dialog SweetAlert2 Bertema (Pengganti `alert`/`confirm` Native):** Seluruh pemanggilan `alert()` dan `confirm()` native di area admin diganti dengan modal SweetAlert2 bertema token Euodoo, menggunakan tombol `.adm-btn-danger` untuk konfirmasi hapus dan `.adm-btn-neutral` untuk batal.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Komponen Dropdown Terpadu `.eu-dd-*` (3 Varian & WAI-ARIA)** | Menyeragamkan antarmuka pemilihan opsi admin dan publik dengan listbox kustom seidentik referensi desain berbasis token hijau Euodoo. | 2026-11-02 |
| **Komponen Tombol Admin Terpadu `.adm-btn-*`** | Menyeragamkan hierarki aksi admin (primary hijau lembut daun `--color-leaf-soft` berteks gelap kontras AAA, secondary hijau outline, neutral abu, danger merah) tanpa merusak class `.btn-*` halaman publik. | 2026-11-02 |
| **Validasi Form Submit + Live Pasca-Error & SweetAlert2** | Menggantikan tooltip validasi bawaan browser dan `alert`/`confirm` native dengan umpan balik bertema dwibahasa ID/EN yang aksesibel. | 2026-11-02 |
| **Tampilan Slug Admin 1 Baris Tanpa Bullet & Tanpa Judul EN** | Menghilangkan duplikasi visual antara judul bahasa Inggris dan kode slug di tabel daftar serta form admin. | 2026-11-02 |
| **Pengurutan Galeri via Tombol Panah** | Menghindari dependensi drag-and-drop eksternal, 100% aman CSP, dan ramah aksesibilitas. | 2026-10-23 |
| **Validasi Whitelist Kolom JSON Produk** | Mencegah injeksi payload data tak terduga pada kolom varian dan tabel ukuran produk. | 2026-10-23 |
| **Pemisahan Peran 3 Tingkat (Superadmin/Admin/Editor)** | Mencegah staf konten mengubah pengaturan sensitif dan memastikan privasi data kontak prospek terjaga. | 2026-10-05 |
| **Tabel Resmi Tunggal `inquiries`** | Memusatkan pencatatan seluruh saluran formulir RFQ ke satu tabel database terstruktur. | 2026-10-06 |
| **Cookie Session HttpOnly & SameSite Lax** | Melindungi kredensial sesi admin dari pencurian skrip jahat (anti-XSS). | 2026-09-29 |
