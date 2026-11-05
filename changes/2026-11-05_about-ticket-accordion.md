# Proposal Perubahan: Redesain Interactive Expanding Accordion Budaya Kerja T-I-C-K-E-T Halaman Tentang Kami & Penyesuaian CMS Admin

**Tanggal Pengajuan:** 2026-11-05  
**Status Tahap:** TAHAP 1: PROPOSE (Revisi Final Berdasarkan Keputusan Terkunci Azis — Menunggu Persetujuan Final untuk Tahap 2: APPROVE)  
**Dokumen Terdampak:** `prd/public-about.md`, `tech/public-about.md`  
**Rencana Penomoran Task:** `T-294` s/d `T-300` (Melanjutkan urutan aktif `3-TASKS.md`)  
**Skill Acuan:** `impeccable` (polish/adapt/animate), `antislop-human`, `antislop-layoutmobile`, `antislop-code`  

---

## 1. Konteks

Section Budaya Kerja di halaman Tentang Kami (`/about#core-values`) saat ini masih berupa grid statis 6 kartu dengan inline styles `style=""` dan kode hex warna langsung yang melanggar `tech/conventions.md`. Proposal ini merekonstruksi section tersebut menjadi *Interactive Expanding Accordion* desktop yang mereplikasi secara presisi gambar referensi desain (6 panel bernuansa industrial dengan glow hijau, tipografi vertikal, dan indikator dots) serta *Vertical Accordion* di mobile (< 768px) sesuai pola `ticket-accordion-mobile-redesign.html`. Pembaruan ini sekaligus mengintegrasikan aset gambar latar section, gambar per kartu, dan ikon SVG garis whitelist ke dalam CMS Admin (`tab-ticket`), mempertahankan kompatibilitas penuh data lama tanpa reload atau kerusakan skema.

---

## 2. Delta Spesifikasi per Modul

### A. Delta `prd/public-about.md`

#### Perubahan FR-05 Butir 3: Nilai-Nilai Inti Budaya Perusahaan
- **Kondisi Lama:**
  - FR-05 butir 3 mencatat: *"Nilai-Nilai Inti Budaya Perusahaan (Akronim TIKET: Takut Tuhan, Integritas, Keterbukaan, Empati, Tanggung Jawab)"* yang keliru mencatat 5 nilai lama.
  - Tampilan publik berupa grid kartu statis sederhana tanpa interaksi mikro, tanpa media visual foto pendukung, dan tanpa ikon pilar.
- **Kondisi Baru (Diselaraskan dengan Keputusan 1, 4, 5, 6, 7):**
  - FR-05 butir 3 diperbarui menjadi: *"Nilai-Nilai Inti Budaya Perusahaan: 6 Pilar Budaya Kerja Interaktif (Default T-I-C-K-E-T: Takut Tuhan, Integritas, Komunikasi, Kasih, Luar Biasa, Taat)"*. Huruf dan konten masing-masing dari 6 pilar dapat disunting fleksibel di CMS, dan judul akronim otomatis merangkai huruf pilar tersebut.
  - Komponen publik desktop mengadopsi **Interactive Expanding Accordion**:
    - Latar section memadukan foto lanskap pabrik nyata (dikelola via CMS) dengan lapisan scrim overlay gradien token resmi (`var(--bg-overlay-dark)` / `var(--color-primary-dark)`) untuk menjamin kontras WCAG AA pada teks header dan dots.
    - Header berpusat: Pill outline `Budaya Kerja` (editable ID/EN di admin) diapit garis horizontal aksen tipis, judul akronim besar berjarak renggang (dirangkai otomatis dari huruf 6 pilar aktif, mis. `T - I - C - K - E - T`), dan subjudul filosofis (editable ID/EN di admin).
    - 6 panel kartu vertikal berdampingan dengan foto latar operasional pabrik/tim, overlay gradien hijau gelap semi-transparan, border tipis, ikon garis stroke seragam, huruf pilar, dan nama pilar orientasi vertikal.
    - Status load awal: **Panel ke-3 (Pilar "C" - Komunikasi) aktif secara default** saat halaman pertama kali dimuat, persis seperti gambar desain referensi.
    - Interaksi pemicu buka panel: **Hanya melalui klik mouse dan fokus keyboard** (tanpa aksi hover), menjaga stabilitas antarmuka (*calm UI*).
    - Panel aktif melebar (rasio ~2.5x hingga 3x panel tertutup) menampilkan highlight border hijau menyala (*soft outer glow*), judul pilar, dan deskripsi penjelasan 2-3 baris di atas lapisan gradien gelap.
    - **Tanpa tombol "Pelajari Lebih Lanjut"** dan **tanpa kicker** (elemen ini dihapus permanen).
    - Indikator dots terpusat di bawah accordion: 1 pill aktif memanjang + 5 dot bulat inaktif (berfungsi ganda sebagai kontrol navigasi interaktif).
  - Komponen publik mobile (< 768px) mengadopsi **Vertical Expanding Accordion**:
    - 6 baris kartu horizontal bertumpuk rapat dengan target sentuh tinggi minimal 44px (tinggi kartu ~70px-76px).
    - Baris aktif melebar ke bawah menampilkan judul, deskripsi pilar, serta glow hijau halus tanpa menimbulkan horizontal scrollbar (zero overflow di 320px).
  - Aksesibilitas: Semantik `role="tablist"` / `role="tab"` / `role="tabpanel"`, atribut `aria-expanded` & `aria-controls`, navigasi keyboard panah (`ArrowLeft`/`ArrowRight` di desktop, `ArrowUp`/`ArrowDown` di mobile, `Enter`/`Space`), serta kepatuhan kontras teks WCAG AA (>= 4.5:1).

---

### B. Delta `tech/public-about.md`

#### 1. Perubahan Seksi Komponen Antarmuka & Prefix CSS
- **Kondisi Lama:**
  - Nilai inti perusahaan menggunakan class `.sec-values`, `.value-card.pillar-card`, `.value-letter`, dengan inline style `style="display: grid; ..."` dan warna hex mentah `#e6f7f2`, `#a3e0d0`, `#071f17`, `#424753`.
- **Kondisi Baru (Diselaraskan dengan Keputusan 6, 9):**
  - Isolasi total menggunakan prefix unik ber-scope: `.abt-tkt-*`.
  - Ekstraksi markup ke partial modular: `views/partials/about/ticket-accordion.ejs` (di bawah batas 100 baris).
  - Breakpoint mobile vertikal: `@media (max-width: 768px)` konsisten dengan breakpoint global modul PT Euodoo lainnya.
  - Penghapusan seluruh inline `style="..."` dan warna hex langsung; seluruh pewarnaan wajib merujuk ke token CSS resmi:
    - Latar section & scrim: `var(--surface-dark-deep)`, `var(--primary-dark)`, `var(--bg-overlay-dark)`.
    - Border aktif & glow: `var(--primary)`, `var(--color-primary-light)`, `var(--shadow-glow-primary)`.
    - Tipografi: `var(--color-on-primary)` (putih), `var(--text-main)`, `var(--text-secondary)`, `var(--font-heading)`.
  - Class legacy `.sec-values`, `.value-card`, `.pillar-card` dibersihkan dari `views/public/about.ejs`.

#### 2. Skema Data & Kontrak Kunci Pengaturan `settings`
- **Kunci Pengaturan Baru di Tabel `settings`:**
  - `about_values_bg_image`: Path foto suasana pabrik untuk latar belakang section (VARCHAR 500).
  - `about_values_pill_id`: Teks pill header bahasa Indonesia (default: `"Budaya Kerja"`).
  - `about_values_pill_en`: Teks pill header bahasa Inggris (default: `"Corporate Culture"`).
  - `about_values_subtitle_id`: Subjudul section bahasa Indonesia (default: `"Nilai-nilai yang membentuk langkah kami menuju masa depan yang lebih baik"`).
  - `about_values_subtitle_en`: Subjudul section bahasa Inggris (default: `"The foundational values shaping our steps toward a better future"`).
- **Struktur JSON `about_values_json`:**
  ```json
  [
    {
      "letter": "T",
      "title_id": "Takut Tuhan",
      "title_en": "Fear of God",
      "desc_id": "Menjadikan nilai ketuhanan sebagai landasan dalam berpikir, mengambil keputusan, dan bekerja dengan penuh tanggung jawab.",
      "desc_en": "Making spiritual values the foundation in thinking, decision making, and responsible work.",
      "image_url": "/images/hero-factory.jpg",
      "icon_key": "praying-hands",
      "sort_order": 1
    }
  ]
  ```
- **Strategi Migrasi & Backward Compatibility (Non-Destruktif):**
  - Pada `models/aboutModel.js`: Fungsi `getAboutData()` melakukan normalisasi otomatis saat membaca `about_values_json`. Jika item lama belum memiliki `image_url`, sistem menyematkan fallback foto pabrik lokal (`/images/hero-factory-precision.webp`, dll.). Jika belum memiliki `icon_key`, sistem memetakan default sesuai index/huruf. Jika `sort_order` kosong, menggunakan urutan default 1 s/d 6.
  - Jumlah panel tetap tepat 6 item, namun field `letter` dapat diubah oleh admin (1 karakter per pilar).
  - Pada `controllers/admin/aboutController.js`: Validasi ketat sisi server:
    - `icon_key`: Wajib terdaftar di whitelist resmi server (`praying-hands`, `shield-check`, `chat-dots`, `heart`, `star`, `handshake`).
    - `letter`: Wajib 1 karakter string (A-Z / alfabet kapital), required.
    - `image_url` dan `about_values_bg_image`: Wajib path URL lokal valid (mis. diawali `/uploads/media/` atau `/images/`), maksimal 500 karakter.
    - Batas panjang: `title_id` / `title_en` maksimal 50 karakter; `desc_id` / `desc_en` maksimal 250 karakter; `about_values_pill_*` maksimal 50 karakter; `about_values_subtitle_*` maksimal 150 karakter.

#### 3. Whitelist Aset Ikon Garis (Stroke SVG Identik Gambar Referensi)
- Disediakan 6 file SVG parsial atau modul dictionary SVG server-side yang presisi identik dengan gambar desain referensi:
  1. `praying-hands`: Dua telapak tangan menyatu memohon/berdoa (Takut Tuhan).
  2. `shield-check`: Perisai pelindung dengan tanda centang di tengah (Integritas).
  3. `chat-dots`: Balon obrolan dialog dengan deretan 3 titik horizontal (Komunikasi).
  4. `heart`: Bentuk garis hati/cinta outline (Kasih).
  5. `star`: Bintang bersudut lima outline (Luar Biasa).
  6. `handshake`: Dua tangan berjabat erat outline (Taat).
- Spesifikasi teknis SVG: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.8"`, `stroke-linecap="round"`, `stroke-linejoin="round"`. Tanpa inline CSS dan tanpa skrip.

#### 4. Engine Animasi & Interaksi Klien (`public/js/ticket-accordion.js`)
- Menggunakan Anime.js v3 (`window.anime`):
  - Mekanisme pemicu: **Hanya event `click` dan `keydown`** (`Enter`, `Space`, `ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown`). Event `mouseenter` dan `mousemove` tidak mengaktifkan panel.
  - State awal saat load: Panel indeks ke-2 (pilar ke-3 "C") otomatis aktif dengan class `.is-active` / `aria-expanded="true"`.
  - Mekanisme pelebaran: Animasi proxy `flex-grow` (1 ke 3) via Anime.js timeline berkoordinasi dengan transisi `opacity` dan `translateY` teks deskripsi panel aktif.
  - Pembatalan interaksi cepat (`anime.remove()`): Menghindari stutter/jitter saat pengguna mengklik panel secara bertubi-tubi.
  - Image Pre-decode: Eksekusi `img.decode()` sebelum trigger animasi untuk menjamin zero CLS dan zero flickering.
  - Kepatuhan `prefers-reduced-motion`: Transisi instan berbasis toggle kelas CSS tanpa animasi durasi Anime.js.

#### 5. Penyesuaian Antarmuka Admin CMS (`views/admin/about/partials/tab-nilai.ejs`)
- Field konfigurasi header section: input pill ID/EN, input subjudul ID/EN, dan media picker untuk foto latar section (`about_values_bg_image`).
- Form 6 kartu pilar: input huruf (1 karakter), judul ID/EN, deskripsi ID/EN, media picker foto kartu, dan dropdown kustom admin (`.eu-dd-*`) dengan pratinjau langsung SVG untuk 6 pilihan icon whitelist.
- Validasi formulir terpusat terhubung ke `public/js/admin-form-validation.js`.

---

## 3. Tabel Komparasi: Gambar Desain vs File HTML Prototype

| No | Elemen Antarmuka | Versi Gambar Desain (Sumber Utama) | Versi HTML Prototype (`ticket-accordion-mobile-redesign.html`) | Keputusan Terkunci yang Dipakai | Alasan / Catatan Kepatuhan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Header Eyebrow / Pill** | Pill berbingkai outline halus `Budaya Kerja` diapit garis horizontal kiri dan kanan. | Teks `.eyebrow` biasa dengan garis pseudo `:before` dan `:after` tanpa pill outline. | **Versi Gambar (Editable Admin)** | Mengikuti visual gambar; teks pill dapat disunting ID/EN di admin CMS (Keputusan 7). |
| 2 | **Judul Utama Section** | Huruf besar renggang tebal `T - I - C - K - E - T` berwarna hijau tua hutan brand. | `<h1>T-I-C-K-E-T</h1>` dengan warna hex mentah `#0b4038`. | **Versi Gambar (Dinamis dari Huruf)** | Otomatis dirangkai dari huruf masing-masing 6 pilar aktif dengan token `var(--color-primary-dark)` (Keputusan 4). |
| 3 | **Subjudul Section** | Teks satu baris elegan di bawah judul: *"Nilai-nilai yang membentuk langkah kami menuju masa depan yang lebih baik"*. | Paragraf `<p class="lead">` dengan font clamp dan margin standar. | **Versi Gambar (Editable Admin)** | Teks satu baris terpusat menggunakan token `var(--color-text-secondary)`; editable ID/EN di admin CMS (Keputusan 7). |
| 4 | **Latar Section** | Foto lanskap suasana luar pabrik & fasilitas asri dengan pepohonan dan daun di foreground. | Gradien radial abstrak CSS + garis grid mesh buatan di atas warna `#f4f8f6`. | **Versi Gambar + Overlay Token (Editable Admin)** | Foto latar pabrik nyata dikelola via CMS + scrim overlay gradien token agar kontras teks header lolos WCAG AA (Keputusan 6). |
| 5 | **Panel Tertutup (Inactive)** | Kartu vertikal sudut membulat lebar, overlay gelap kehijauan, ikon garis putih di atas, huruf besar putih, nama pilar vertikal diapit 2 garis tipis, dan strip kapsul di dasar. | Panel flex dengan `border-radius: 15px`, background `#183d38`, nama vertikal tanpa garis pemisah atas-bawah. | **Versi Gambar** | Sudut membulat `var(--r-xl)`, garis vertikal aksen tipis di atas dan bawah teks nama pilar. |
| 6 | **Panel Aktif (Active)** | Melebar ~2.5x - 3x, border hijau terang dengan glow lembut, ikon + huruf + nama vertikal tetap di kiri atas, judul + deskripsi 2-3 baris di bawah pada gradien gelap semi-transparan. | Panel dengan `.panel-copy` di dasar, namun nama vertikal disembunyikan (`opacity: 0`), dan memiliki kicker + tombol learn. | **Versi Gambar** | Ikon, huruf, dan nama vertikal tetap tampil di kiri atas panel aktif; posisi elemen persis gambar. |
| 7 | **Panel Aktif Default Saat Load** | Panel ke-3 (huruf "C" - Komunikasi) terbuka dan aktif. | Panel ke-3 aktif via kelas HTML awal. | **Versi Gambar (Panel ke-3 Aktif)** | Panel ke-3 otomatis aktif secara default saat halaman dimuat (Keputusan 5). |
| 8 | **Pemicu Interaksi Buka Panel** | Konsep desain statis (menampilkan panel terbuka). | Membuka saat hover (`mouseenter`), klik, dan fokus keyboard. | **Klik & Fokus Saja (Tanpa Hover)** | Hanya terbuka saat diklik atau menerima fokus keyboard, menjaga kestabilan antarmuka desktop (Keputusan 2). |
| 9 | **Tombol "Pelajari Lebih Lanjut"** | Terdapat tombol pill *"Pelajari Lebih Lanjut >"*. | Terdapat tombol link `.learn` (*"Nilai dalam tindakan →"*). | **DIHAPUS TOTAL** | Sesuai instruksi wajib pengguna: Tombol ini wajib ditiadakan. |
| 10 | **Kicker Panel Aktif** | Tidak ada kicker di atas judul deskripsi panel aktif. | Terdapat teks kicker kecil (mis. *"C · Bergerak bersama"*). | **DIHAPUS TOTAL** | Sesuai instruksi wajib pengguna: Kicker ditiadakan agar komposisi bersih. |
| 11 | **Teks Catatan Kaki (.note)** | Tidak ada teks catatan kaki. | Terdapat teks `.note`: *"Pilih setiap panel untuk menjelajahi..."*. | **DIHAPUS TOTAL** | Sesuai instruksi: Dihapus total untuk mencegah clutter. |
| 12 | **Aset Ikon Pilar** | 6 ikon garis stroke seragam: (1) Berdoa, (2) Perisai Centang, (3) Balon Chat Titik, (4) Hati, (5) Bintang, (6) Jabat Tangan. | Simbol unicode teks (`◇`, `◎`, `♡`, `✧`, `⌁`), hanya 1 ikon SVG pada huruf T pertama. | **Versi Gambar (Identik Referensi)** | 6 SVG garis outline presisi identik dengan gambar, seragam stroke 1.8px, dipilih via dropdown admin (Keputusan 8). |
| 13 | **Sumber & Pemuatan Foto** | Foto nyata operasional dan fasilitas tim PT Euodoo. | Foto Unsplash eksternal dimuat via inline style `--photo:url(...)`. | **Versi Gambar (Lokal Media Library)** | Foto lokal dimuat via tag `<img>` semantik dengan `object-fit: cover` demi kepatuhan CSP (tanpa inline `url()`). |
| 14 | **Pewarnaan & Lembar Gaya** | Nuansa hijau signature Euodoo, border glow neon lembut. | Warna hex langsung `#00755A`, `#00a77c`, `#183d38`, `#65dcb2`. | **Token Desain Euodoo** | 100% menggunakan token CSS resmi dari `tokens.css`. Dilarang kode hex mentah. |
| 15 | **Indikator Dots** | 6 dots di bawah panel: 1 pill aktif memanjang hijau + 5 dot bulat kecil abu-abu. | `<nav class="dots">` dengan 1 dot pill aktif lebar 28px + 5 dot bulat 7px. | **Versi Gambar & HTML** | Diadopsi dengan markup tombol interaktif aksesibel ber-`aria-label` dwibahasa. |
| 16 | **Layout Mobile (< 768px)** | *Tidak tersedia di gambar desain (gambar hanya menampilkan desktop).* | Susunan kartu vertikal bertumpuk (~70px-76px), kartu aktif membuka ke bawah (~310px-325px). | **Versi HTML (@media max-width 768px)** | Diadopsi penuh untuk mobile (< 768px) dengan breakpoint konsisten proyek Euodoo (Keputusan 9). |
| 17 | **Engine Transisi & Animasi** | Konsep visual statis. | Menggunakan CSS flex transition murni (`transition: flex .75s`). | **Anime.js v3 Timeline (flex-grow)** | Transisi `flex-grow` (1 ke 3) dan teks diorkestrasi via Anime.js v3 dengan pembatalan instan (Keputusan 3). |

---

## 4. Keputusan Terkunci / Disepakati bersama Azis

Seluruh 10 keputusan terbuka telah dijawab dan dikunci secara definitif oleh Azis pada 2026-11-05:

1. **Daftar Nilai Resmi: Opsi A (6 Nilai T-I-C-K-E-T).**
   - PRD `prd/public-about.md` FR-05 butir 3 yang sebelumnya keliru mencatat 5 nilai lama akan diperbarui menjadi 6 nilai resmi (Takut Tuhan, Integritas, Komunikasi, Kasih, Luar Biasa, Taat).
2. **Pemicu Buka Panel di Desktop: Opsi B (Klik & Fokus Saja).**
   - Panel hanya membuka saat diklik kursor mouse atau menerima fokus navigasi keyboard (`Enter`/`Space`). Event hover mouse tidak memicu pergantian panel, menjamin kestabilan tampilan (*calm UI*).
3. **Teknik Pelebaran Panel dengan Anime.js: Opsi A (Animasi `flex-grow`).**
   - Menggunakan Anime.js v3 timeline untuk menganimasikan proxy nilai `flex-grow` (1 ke 3) yang disinkronkan dengan transisi `opacity` dan pergeseran `translateY` teks deskripsi panel aktif.
4. **Jumlah & Fleksibilitas Nilai: Opsi A Terbuka (Tepat 6 Nilai, Huruf & Konten Bebas Diubah).**
   - Jumlah pilar tetap tepat 6 kartu/panel, namun huruf (field `letter` 1 karakter) dan seluruh kontennya dapat disunting secara bebas di CMS admin (tidak di-hardcode ke kata TICKET). Judul section otomatis merangkai huruf-huruf pilar tersebut.
5. **Panel Aktif Awal Saat Halaman Dimuat: Opsi B (Panel ke-3 "C" - Komunikasi).**
   - Saat halaman pertama kali dimuat, panel ke-3 (indeks 2) otomatis menjadi panel aktif, mereplikasi komposisi simetris mock up gambar desain asli.
6. **Latar Belakang Section: Opsi A (Foto Suasana Pabrik + Overlay Token).**
   - Latar section menggunakan foto suasana lanskap pabrik yang dapat diatur di Admin CMS melalui Media Library (`about_values_bg_image`) dengan lapisan scrim gradien token resmi Euodoo agar teks header dan dots tetap memenuhi kontras WCAG AA.
7. **Header Section: Opsi B (Pill & Subjudul Editable ID/EN di Admin CMS).**
   - Teks pill outline `Budaya Kerja` dan subjudul dapat diedit penuh dalam dwibahasa ID/EN di Admin CMS (disimpan di `settings`). Judul akronim utama otomatis dirangkai dari huruf masing-masing 6 pilar aktif.
8. **Pemilihan Ikon Pilar: Opsi A (Whitelist Dropdown Admin + Ikon Identik Referensi).**
   - Admin memilih ikon dari dropdown whitelist di CMS dengan live preview visual. Aset SVG dibuat 100% presisi identik dengan gambar referensi desain (tangan berdoa, perisai centang, balon obrolan 3 titik, hati, bintang, jabat tangan) menggunakan pustaka SVG stroke standar.
9. **Breakpoint Pergantian ke Vertical Accordion: Opsi B (`768px`).**
   - Menggunakan `@media (max-width: 768px)` untuk peralihan ke tata letak Vertical Accordion mobile, konsisten dengan seluruh standar breakpoint modul website PT Euodoo.
10. **Penyimpanan Struktur Data di Basis Data: Opsi A (Tetap di `settings.about_values_json`).**
    - Seluruh data 6 pilar tersimpan dalam kolom `settings.about_values_json` dengan struktur JSON baru yang diperkaya, dilengkapi normalizer di `models/aboutModel.js` untuk menjamin backward compatibility penuh tanpa migrasi DDL tabel baru.

---

## 5. Rencana Task Implementasi (Mulai T-294 s/d T-300)

### Task T-294: Persiapan Whitelist Ikon SVG Identik Desain & Normalizer Data Model
*(Diperbarui sesuai jawaban Keputusan 1, 4, 8, 10)*
- **Deskripsi:** Menyiapkan 6 aset SVG garis stroke seragam yang presisi identik dengan gambar desain (`praying-hands`, `shield-check`, `chat-dots`, `heart`, `star`, `handshake`) sebagai partial server-side / helper dictionary, serta memperbarui defaults dan parser fallback `about_values_json` pada `models/aboutModel.js` agar data lama tetap valid dan aman dengan dukungan huruf pilar dinamis.
- **Acceptance Criteria:**
  - 6 SVG garis outline tersimpan rapi tanpa inline style/handler dan tanpa warna hex mentah (`stroke="currentColor"`, `viewBox="0 0 24 24"`), 100% identik dengan motif pada gambar referensi.
  - `aboutModel.js` memuat defaults lengkap 6 pilar dengan properti `letter`, `title_id`, `title_en`, `desc_id`, `desc_en`, `image_url`, `icon_key`, dan `sort_order`.
  - Fungsi `aboutModel.getAboutData()` melakukan fallback graceful jika ada properti yang belum didefinisikan pada data database lama, serta membaca pengaturan baru `about_values_bg_image`, `about_values_pill_*`, dan `about_values_subtitle_*`.
- **File Terdampak:** `views/partials/icons/ticket/*.ejs` (atau helper icon dictionary), `models/aboutModel.js`.
- **Skill:** `antislop-code`, `ponytail`.
- **Verifikasi:** Unit test pemanggilan `aboutModel.getAboutData()` mengembalikan 6 pilar lengkap dengan fallback aman dan key header/latar baru.

### Task T-295: Penyesuaian Antarmuka Admin CMS Tab Nilai Budaya & Validasi Controller
*(Diperbarui sesuai jawaban Keputusan 4, 6, 7, 8, 10)*
- **Deskripsi:** Memperbarui form `views/admin/about/partials/tab-nilai.ejs` untuk mendukung pengelolaan foto latar section, input pill dan subjudul dwibahasa ID/EN, serta 6 kartu pilar yang memuat input huruf fleksibel (1 karakter), judul ID/EN, deskripsi ID/EN, foto latar kartu via Universal Media Picker, dan dropdown kustom admin (`.eu-dd-*`) dengan pratinjau SVG untuk 6 pilihan icon whitelist. Memperbarui `aboutController.update` dengan validasi server-side ketat.
- **Acceptance Criteria:**
  - Tab 3 ("Nilai Budaya") menampilkan form konfigurasi header seksi (pill ID/EN, subjudul ID/EN, foto latar seksi).
  - 6 kartu pilar dapat disunting hurufnya (input `maxlength="1"`, auto-uppercase), judul, deskripsi, foto kartu, dan ikonnya.
  - Media picker bekerja mulus untuk memilih foto dari media library lokal tanpa inline style.
  - Dropdown ikon menampilkan preview SVG dari whitelist 6 ikon resmi identik gambar.
  - Controller memvalidasi whitelist `icon_key`, URL lokal media library, dan batas panjang karakter (huruf 1 char, judul max 50, deskripsi max 250, pill max 50, subjudul max 150).
  - Penyimpanan data berhasil memperbarui `about_values_json` dan pengaturan baru tanpa menghapus field lain.
- **File Terdampak:** `views/admin/about/partials/tab-nilai.ejs`, `controllers/admin/aboutController.js`, `public/css/admin.css`.
- **Skill:** `antislop-code`, `code-review-and-quality`.
- **Verifikasi:** Uji submit form admin, cek integritas JSON di tabel settings, dan verifikasi validasi tolak input di luar whitelist.

### Task T-296: Pembersihan Legacy Inline Styles & Implementasi Markup Accordion Publik
*(Diperbarui sesuai jawaban Keputusan 1, 4, 5, 6, 7)*
- **Deskripsi:** Membersihkan seluruh inline `style="..."` dan hex code dari section `#core-values` di `views/public/about.ejs`, mengekstrak komponen ke partial modular `views/partials/about/ticket-accordion.ejs`, mengintegrasikan latar foto seksi dengan overlay gradien token, merangkai judul akronim otomatis dari huruf 6 pilar aktif, dan menetapkan panel ke-3 aktif secara default saat render SSR.
- **Acceptance Criteria:**
  - Zero inline style dan zero hex color di section pilar budaya kerja.
  - Partial berukuran <= 100 baris sesuai konvensi modularitas EJS.
  - Judul section otomatis dirangkai dari gabungan `letter` ke-6 pilar aktif (mis. `T - I - C - K - E - T`).
  - Panel ke-3 (indeks 2) otomatis dirender dengan status aktif (`is-active`, `aria-expanded="true"`).
  - Markup semantik menggunakan `role="tablist"`, `role="tab"`, `role="tabpanel"`, serta `aria-controls`.
  - Tombol "Pelajari Lebih Lanjut", kicker, dan teks note ditiadakan sepenuhnya.
  - Foto dimuat menggunakan elemen `<img>` semantik dengan `loading="lazy"` (atau eager untuk panel awal) dan class `.abt-tkt-img` (`object-fit: cover`).
  - Kamus bahasa `locales/id.json` dan `locales/en.json` disinkronkan untuk seluruh teks statis.
- **File Terdampak:** `views/public/about.ejs`, `views/partials/about/ticket-accordion.ejs`, `locales/id.json`, `locales/en.json`.
- **Skill:** `impeccable` (polish), `antislop-human`, `antislop-code`.
- **Verifikasi:** `npm run lint:views` dan `npm run lint:i18n` lulus hijau tanpa peringatan pada berkas terkait.

### Task T-297: Penataan Styling Desktop & Mobile Accordion Berbasis Token Desain
*(Diperbarui sesuai jawaban Keputusan 6, 9)*
- **Deskripsi:** Mengimplementasikan styling CSS lengkap untuk `.abt-tkt-*` di `public/css/components.css`: latar section dengan foto pabrik + scrim overlay gradien token, tata letak desktop 6 panel berdampingan dengan border glow lembut, tipografi vertikal diapit garis aksen tipis, styling panel aktif, indikator dots di bawah, serta tata letak mobile bertumpuk vertikal pada breakpoint konsisten `@media (max-width: 768px)` dengan target sentuh min 44px.
- **Acceptance Criteria:**
  - Seluruh warna, radius sudut, shadow, dan spasi merujuk 100% ke token CSS (`tokens.css`).
  - Latar section memadukan foto dan scrim overlay token dengan rasio kontras teks header >= 4.5:1 (WCAG AA).
  - Status fokus keyboard (`:focus-visible`) tampak jelas dan kontras.
  - Tampilan mobile pada `@media (max-width: 768px)` bertumpuk vertikal rapi, panel aktif membuka ke bawah tanpa overflow scrollbar di 320px.
  - Seluruh teks putih di atas overlay foto memenuhi kontras WCAG AA (>= 4.5:1 untuk teks body, >= 3:1 untuk teks besar).
- **File Terdampak:** `public/css/components.css`.
- **Skill:** `antislop-layoutmobile`, `antislop-human`, `impeccable` (adapt).
- **Verifikasi:** Uji inspeksi DOM dan verifikasi visual responsif pada 320px, 375px, 768px, 1024px, 1440px.

### Task T-298: Orkestrasi Animasi Anime.js v3 & Logika Interaksi Klien (Klik & Fokus Saja)
*(Diperbarui sesuai jawaban Keputusan 2, 3, 5)*
- **Deskripsi:** Membangun skrip eksternal `public/js/ticket-accordion.js` untuk mengelola interaksi klik mouse dan navigasi keyboard saja (tanpa hover), sinkronisasi dots, inisialisasi panel ke-3 aktif saat load, animasi pelebaran `flex-grow` (1 ke 3) via Anime.js v3, pembatalan animasi berjalan saat klik cepat, pre-decode gambar, serta penanganan `prefers-reduced-motion`.
- **Acceptance Criteria:**
  - Pemicu interaksi hanya event `click` dan `keydown` (`Enter`, `Space`, `ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown`). Event hover kursor mouse tidak memicu perpindahan panel.
  - State awal saat load mengaktifkan panel ke-3 (indeks 2) secara mulus.
  - Transisi pelebaran panel mengorkestrasikan proxy `flex-grow` (1 ke 3) dan kemunculan teks secara halus via Anime.js v3 (`anime({})`).
  - Animasi berjalan dibatalkan seketika (`anime.remove()`) saat pengguna mengklik panel lain secara cepat untuk mencegah glitch layout.
  - Pada `prefers-reduced-motion: reduce`, transisi berlangsung instan tanpa animasi interpolasi JS.
  - Zero CLS: Tinggi kontainer accordion tetap stabil (510px di desktop) tanpa pergeseran elemen sekitarnya.
- **File Terdampak:** `public/js/ticket-accordion.js`, `views/public/about.ejs`.
- **Skill:** `impeccable` (animate), `antislop-code`.
- **Verifikasi:** Uji interaksi klik cepat mouse dan navigasi keyboard di browser; verifikasi ketiadaan error console JavaScript.

### Task T-299: Uji Regresi, Audit Aksesibilitas WCAG & Gerbang Kualitas Lint
*(Diperbarui sesuai jawaban Keputusan 1, 7, 8, 9, 10)*
- **Deskripsi:** Menjalankan pengujian regresi komprehensif pada halaman Tentang Kami dan panel admin CMS, melakukan audit rasio kontras teks menggunakan `antislop-human` contrast-checker (terutama teks header di atas foto latar ber-scrim), memverifikasi ketiadaan error console, dan memastikan kepatuhan penuh terhadap gerbang linting.
- **Acceptance Criteria:**
  - Section lain di `/about` (Galeri Bento + Lightbox PhotoSwipe, Statistik, Timeline, Visi Misi) tetap berfungsi normal tanpa regresi.
  - Tab admin lain di CMS Tentang Kami tetap dapat disimpan dengan normal.
  - `npm run lint` menghasilkan 0 error.
  - `npm run lint:views` menghasilkan 0 error pada seluruh file yang disentuh.
  - Seluruh teks dwibahasa (ID dan EN) tampil benar saat pergantian bahasa.
- **File Terdampak:** Test suite automatisasi / Playwright QA script.
- **Skill:** `antislop-human`, `code-review-and-quality`.
- **Verifikasi:** Eksekusi skrip verifikasi otomatis dan bukti visual Playwright sebelum vs sesudah.

### Task T-300: Verifikasi Komparasi Screenshot 1440px vs Desain Asli & Finalisasi Dokumentasi
*(Diperbarui sesuai jawaban Keputusan 1 s/d 10)*
- **Deskripsi:** Mengambil screenshot tampilan desktop pada viewport 1440px dengan panel ke-3 terbuka, membandingkan secara berdampingan dengan gambar referensi desain asli, mendokumentasikan setiap selisih visual mikro yang tersisa, serta mempersiapkan artefak untuk tahap Close.
- **Acceptance Criteria:**
  - Screenshot 1440px desktop mereplikasi proporsi, kontur, glow hijau, dan tipografi gambar desain secara presisi dengan panel ke-3 terbuka.
  - Tabel deviasi visual (jika ada selisih mikro) didokumentasikan secara transparan.
  - Seluruh kriteria penerimaan siap diverifikasi oleh Azis.
- **File Terdampak:** Dokumentasi QA & artifact screenshot.
- **Skill:** `impeccable` (polish).
- **Verifikasi:** Laporan komparasi visual berdampingan siap disajikan.

---

## 6. Dampak Ukuran Modul Spesifikasi

- Ukuran file spesifikasi saat ini:
  - `prd/public-about.md`: ~5.4 KB (Maksimal target ~8 KB)
  - `tech/public-about.md`: ~5.4 KB (Maksimal target ~8 KB)
- **Analisis:** Jika seluruh rincian arsitektur teknis Interactive Expanding Accordion (kontrak SVG, event lifecycle anime.js, dan struktur skema JSON baru) dituliskan secara penuh ke dalam `tech/public-about.md`, ukuran file tersebut diperkirakan akan membengkak menjadi ~9.2 KB (melewati batas baku ~8 KB).
- **Usulan Pemecahan:**
  - Memecah sub-modul teknis baru: `tech/public-about-ticket.md` (khusus mendokumentasikan komponen `.abt-tkt-*`, lifecycle anime.js, kontrak SVG whitelist, dan penyesuaian tab admin ticket).
  - `tech/public-about.md` cukup memuat ringkasan delegasi 1 paragraf yang merujuk ke `tech/public-about-ticket.md`.
  - Mendaftarkan sub-modul baru tersebut pada `.agents/INDEX.md` saat tahap Merge ke Spec.

---

## 7. Rencana CLOSE (Tahap 5: CLOSE)

Setelah seluruh implementasi dan pengujian disetujui:
1. **Pembaruan Tanggal Verifikasi Modul:**
   - Memperbarui tanggal verifikasi pada `prd/public-about.md` menjadi `2026-11-05` (termasuk pembaruan FR-05 butir 3 dari 5 nilai ke 6 nilai pilar fleksibel).
   - Memperbarui tanggal verifikasi pada `tech/public-about.md` (dan `tech/public-about-ticket.md`) menjadi `2026-11-05`.
   - Memperbarui tabel modul pada `.agents/INDEX.md`.
2. **Entri CHANGELOG.md:**
   - Menambahkan 1 baris entri ringkas:  
     `2026-11-05 | Redesain Interactive Expanding Accordion Budaya Kerja T-I-C-K-E-T halaman Tentang Kami & penyesuaian CMS Admin | T-294 s/d T-300`
3. **Nasib File Prototype HTML:**
   - Berkas prototype sementara `public/ticket-accordion-mobile-redesign.html` dihapus dari direktori publik agar tidak meninggalkan dead code / aset eksperimental di server produksi.
4. **Pengarsipan Dokumen:**
   - Memindahkan berkas proposal ini dari `changes/2026-11-05_about-ticket-accordion.md` ke `archive/2026-11-05_about-ticket-accordion.md`.
   - Memindahkan daftar task selesai `T-294` s/d `T-300` dari `3-TASKS.md` ke `archive/tasks-index-full.md`.
