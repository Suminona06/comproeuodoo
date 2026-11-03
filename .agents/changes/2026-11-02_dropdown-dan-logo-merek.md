# PROPOSAL: Komponen Dropdown Terpadu (.eu-dd-*) & Penskalaan Logo Merek Homepage

- **Tanggal Pengajuan:** 2026-11-02
- **Status:** PROPOSE - DIPERBARUI SESUAI KEPUTUSAN AZIS (Tahap 1 - WORKFLOW.md)
- **Rencana Nomor Task:** T-262 s/d T-268 (Melanjutkan dari T-261)

---

## 1. Konteks (Maksimal 3 Baris)

Proposal standarisasi komponen dropdown terpadu berprefix `.eu-dd-*` dengan 3 varian (*outlined*, *filled*, *elevated*), label mengambang, navigasi keyboard WAI-ARIA penuh, dan integrasi modul validasi form admin T-259.
Mencakup penyesuaian penskalaan dimensi logo portofolio pada section Merek Kami beranda (`.brand-strip-*`) menjadi 2x di desktop dan ~1.5x di mobile dengan pengurangan gap proporsional agar ritme antar-logo lebih rapat, padat, dan bebas layout shift.
Seluruh nilai visual dipetakan seidentik mungkin ke 2 gambar referensi dengan warna fokus/terpilih dari token hijau resmi (`public/css/tokens.css` dan `Design/DESIGN.md`) tanpa nilai hex kaku.

---

## 2. Delta Spesifikasi per Modul

### A. Modul PRD: `prd/admin-cms.md`

#### [Kondisi Lama]
- Admin form dan tabel menggunakan elemen `<select>` native dengan class `.form-select`, `.form-input`, atau `.status-select` yang mengandalkan rendering menu bawaan browser/OS.
- Validasi form membaca kontrol kustom TinyMCE, Media Picker, dan tabel ukuran produk, namun belum memiliki kontrak komponen listbox kustom terintegrasi.
- Belum ada standarisasi varian visual dropdown antara field input form biasa dengan toolbar filter tabel admin.

#### [Kondisi Baru] &rarr; Tambah Fitur Baru FR-24
```markdown
### FR-24: Komponen Dropdown Kustom Terpadu Multi-Varian (.eu-dd-*) (Disetujui Azis)
- Seluruh elemen pemilihan opsi di antarmuka Admin (form tambah/edit, modal salin struktur kolom tabel ukuran, filter toolbar, dan status baris tabel) serta halaman publik terkait menggunakan komponen dropdown kustom terstandarisasi `.eu-dd`:
  1. Tiga Varian Resmi Berbasis Token (Seidentik Gambar Referensi 2):
     - Outlined (.eu-dd--outlined): Border abu tipis (var(--color-outline-variant)), latar putih (var(--bg-base)), teks (var(--color-text-main)), radius membulat (var(--radius-lg)). Digunakan untuk seluruh field form admin dan form kontak publik. Pada form standar, label statis tetap berada di atas field; pada bar filter atau standalone, mendukung label mengambang yang memotong border atas (seperti Gambar 1).
     - Filled (.eu-dd--filled): Latar abu muda netral (var(--color-surface-container)), tanpa border luar, sudut membulat (var(--radius-lg)). Digunakan untuk toolbar filter cepat tabel admin dan status baris tabel.
     - Elevated (.eu-dd--elevated): Latar putih (var(--bg-base)), tanpa border, bayangan lembut (var(--shadow-level-1) / var(--shadow-level-2)), radius membulat (var(--radius-lg)), menampilkan format "Prefix: **Nilai Tebal**" (mis. "Urutkan: **Terpopuler**" atau "Kategori: **Semua Kategori**"). Digunakan untuk bar filter katalog publik dan opsi toolbar menonjol.
  2. Anatomi Komponen Seidentik Referensi (Gambar 1 & Gambar 2):
     - Trigger Box: Tinggi standar 52-56px (target sentuh mobile minimal 44px), padding horizontal proporsional, placeholder teks redup (var(--color-text-muted)).
     - Caret Indikator: Ikon segitiga padat abu gelap (var(--color-text-muted) / var(--color-text-main)) di sisi kanan, bertransisi rotasi halus 180 derajat ke atas saat panel terbuka (transform: rotate(180deg)).
     - Menu Panel: Latar putih (var(--bg-base)), radius (var(--radius-lg)), bayangan melayang (var(--shadow-level-2)), jarak vertikal ~8px (var(--space-sm)) di bawah trigger, lebar 100% mengikuti trigger, z-index (var(--z-dropdown)).
     - Slot Ikon / Skeleton Kiri: Slot lingkaran di sisi kiri teks item yang berfungsi ganda: sebagai indikator skeleton shimmer saat memuat data opsi asinkron (seperti Gambar 1) dan sebagai slot logo/ikon/thumbnail opsional bila opsi memuat metadata visual (jika tidak ada ikon, teks merapat rapi ke kiri).
     - Kotak Pencarian Otomatis: Panel otomatis menyediakan kotak input pencarian (search box) di bagian atas jika jumlah opsi > 10 item.
  3. Matriks State Lengkap:
     - Default: Border netral atau latar sesuai varian, teks tajam kontras WCAG AAA.
     - Hover: Border/latar menggelap halus via var(--color-primary-hover) atau var(--color-outline).
     - Focus-Visible: Ring fokus hijau token resmi (var(--focus-ring): 0 0 0 3px rgba(0, 117, 90, 0.25)). Dilarang memakai warna biru atau abu bawaan browser.
     - Open: Caret berputar 180 derajat ke atas, panel muncul dengan transisi transform dan opacity.
     - Item Active / Keyboard Highlight: Latar var(--bg-subtle), teks var(--color-text-main).
     - Item Selected: Latar hijau lembut var(--primary-subtle), teks hijau tegas var(--color-primary-dark) dengan indikator centang visual (SVG checkmark).
     - Disabled: Opacity 0.55, cursor not-allowed, pointer-events none.
     - Error: Border dan outline var(--color-error), pesan error inline di bawah trigger sesuai standar T-259.
     - Loading: Skeleton baris lingkaran + batang abu netral beranimasi shimmer.
     - Empty: Pesan empty-state dwibahasa ("Tidak ada opsi" / "No options available").
  4. Aksesibilitas & Kontrak WAI-ARIA:
     - Mengikuti pola WAI-ARIA 1.2 Combobox / Listbox Pattern: role="combobox", aria-haspopup="listbox", aria-expanded="true|false", aria-controls="listbox-id", aria-activedescendant="option-id".
     - Panel listbox memiliki role="listbox", setiap opsi memiliki role="option" dan aria-selected="true|false".
     - Navigasi Keyboard Lengkap: Enter / Space membuka/menutup dan memilih item, ArrowDown / ArrowUp menavigasi opsi aktif, Home / End melompat ke opsi pertama/terakhir, Escape menutup panel dan mengembalikan fokus ke trigger, Tab menutup panel dan memindahkan fokus ke elemen form berikutnya, type-ahead jump mencari opsi berdasarkan huruf pertama yang diketik.
     - Kontrol Viewport & Flip: Jika ruang bawah layar kurang dari tinggi panel (default max-height 260px-280px), panel otomatis membalik (*flip*) ke atas trigger (.eu-dd-panel--top).
     - Tampilan Mobile (<= 480px): Panel dropdown melayang biasa seperti desktop dengan pembatasan max-height 240px dan scroll vertikal halus.
     - Isolasi Boundary: Panel tidak terpotong oleh overflow-x/overflow-y container tabel atau modal kartu admin.
     - Satu Dropdown Terbuka: Membuka satu dropdown otomatis menutup dropdown lain yang sedang aktif di dokumen. Klik di luar (*click outside*) menutup panel.
  5. Sinkronisasi Native <select>:
     - Elemen <select> native tetap dipertahankan di dalam markup sebagai kontrol sumber data (fallback non-JS dan submit FormData standar).
     - Sinkronisasi dwiarah: Pemilihan opsi kustom memperbarui select.value dan memicu event dispatchEvent(new Event('change', { bubbles: true })).
     - Terintegrasi penuh dengan modul admin-form-validation.js (T-259) untuk penandaan class .is-invalid, aria-invalid="true", auto-open tab tersembunyi, dan auto-scroll/fokus ke trigger error pertama.
```

---

### B. Modul PRD: `prd/public-home.md`

#### [Kondisi Lama]
- FR-17: Strip Marquee Merek Terdaftar (.brand-strip-*) menampilkan logo berukuran mobile `clamp(70px, 13vw, 88px)` dan desktop `clamp(84px, 8.5vw, 115px)` dengan gap `clamp(3rem, 5vw, 5.5rem)`.
- Pada layar desktop lebar, logo tampak relatif kecil dengan jarak renggang antar-logo yang membuat kesan visual kurang padat dan legalitas merek kurang dominan.

#### [Kondisi Baru]
- Perbarui FR-17:
```markdown
### FR-17: Registered Brands Marquee Strip (.brand-strip-*) (Revisi Proporsi 2x & Harmonisasi Spasi - Disetujui Azis)
- Menampilkan portofolio merek dagang resmi perusahaan dalam format strip horizontal kontinu (continuous marquee) dengan dimensi logo ditingkatkan 2x di desktop dan ~1.5x di mobile untuk visibilitas brand authority optimal:
  1. Dimensi Logo Desktop Baru (2x): Tinggi logo berukuran clamp(168px, 16vw, 220px) dengan batas max-width ditingkatkan menjadi 440px (naik 2x dari batas 220px sebelumnya), mempertahankan object-fit: contain murni bebas layout shift (CLS = 0).
  2. Dimensi Logo Mobile Baru (~1.5x): Tinggi logo pada viewport mobile (<= 768px, 480px, 320px) disesuaikan menjadi clamp(90px, 20vw, 120px) dengan max-width 240px dan min-width item clamp(150px, 32vw, 190px). Memastikan pada layar ponsel kecil 320px-375px setidaknya 2 logo terlihat sekaligus secara harmonis tanpa mendominasi seluruh tinggi layar dan bebas dari horizontal scroll (overflow-x: hidden aman).
  3. Penyesuaian Gap Antar-Logo: Variabel --brand-gap dikurangi proporsional menjadi clamp(1.5rem, 3.5vw, 3rem) (24px s/d 48px) sehingga jarak antar-logo menjadi rapat, padat, berbobot, dan mewah tanpa tampak renggang kosong.
  4. Kalibrasi Kecepatan Marquee: Durasi animasi @keyframes brandStripScroll dikalibrasi proporsional dari 32s menjadi 48s agar kecepatan jelajah linier per piksel tetap konstan (~45-55px/detik) dan nyaman dibaca.
  5. Fitur Bawaan Tetap Utuh: Efek pause on hover/focus, modal zoom preview resolusi tinggi (#brandPreviewModal), dan fallback aksesibilitas prefers-reduced-motion (statis flex-wrap rapi) tetap 100% berfungsi normal.
```

---

### C. Modul Tech Spec: `tech/admin-ui.md` & Usulan Sub-modul `tech/admin-ui-dropdown.md`

#### [Kondisi Lama]
- `tech/admin-ui.md` mencakup tombol `.adm-btn-*`, slug `.adm-slug-text`, validasi form `admin-form-validation.js`, dan dialog SweetAlert2.
- Ukuran berkas saat ini: **7.6 KB**. Jika spesifikasi teknis dropdown kustom dimasukkan ke dalam berkas ini, ukuran berkas akan melampaui batas ~8 KB yang diatur dalam AGENTS.md.

#### [Kondisi Baru]
- Buat sub-modul teknis baru: `.agents/tech/admin-ui-dropdown.md` (~4-5 KB) yang didedikasikan untuk komponen dropdown kustom terpadu.
- Perbarui `.agents/INDEX.md` dengan menambahkan 1 baris entri tabel modul (jumlah baris tetap 32, jauh di bawah batas maksimal 60 baris).
- Di `tech/admin-ui.md`, cantumkan tautan referensi ke `tech/admin-ui-dropdown.md`.

#### [Rincian Arsitektur Teknis Sub-modul `tech/admin-ui-dropdown.md`]
```markdown
# Tech Spec: Komponen Dropdown Kustom Terpadu (Admin & Public)

## 1. Arsitektur Komponen (.eu-dd-*)
Komponen dropdown kustom membungkus elemen <select> asli tanpa merusak fungsionalitas formulir standar:

<div class="eu-dd eu-dd--outlined" data-dropdown-id="category_id">
  <!-- Native Hidden Select -->
  <select id="category_id" name="category_id" class="eu-dd-native sr-only" tabindex="-1" aria-hidden="true">
    <option value="">Pilih Kategori</option>
    <option value="1">Rigid Packaging</option>
  </select>

  <!-- Trigger Box -->
  <button type="button" class="eu-dd-trigger" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="eu-dd-list-category_id">
    <!-- Floating Label (hanya varian filter bar atau field tanpa label terpisah) -->
    <span class="eu-dd-floating-label">Kategori</span>
    <span class="eu-dd-value">Pilih Kategori</span>
    <span class="eu-dd-caret" aria-hidden="true">
      <svg viewBox="0 0 10 6" class="eu-dd-caret-icon"><polygon points="0,0 10,0 5,6"/></svg>
    </span>
  </button>

  <!-- Dropdown Menu Panel -->
  <div id="eu-dd-list-category_id" class="eu-dd-panel" role="listbox" aria-label="Kategori" tabindex="-1">
    <!-- Optional Search Box (Otomatis jika opsi > 10) -->
    <div class="eu-dd-search-wrap">
      <input type="text" class="eu-dd-search-input" placeholder="Cari opsi..." aria-label="Cari opsi">
    </div>
    <!-- Option List -->
    <div class="eu-dd-options" role="presentation">
      <div class="eu-dd-item is-selected" role="option" aria-selected="true" data-value="1" id="opt-1">
        <span class="eu-dd-item-media eu-dd-skeleton-circle"></span>
        <span class="eu-dd-item-text">Rigid Packaging</span>
        <span class="eu-dd-check-icon" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 8 6 12 13 4"/></svg>
        </span>
      </div>
    </div>
  </div>
</div>
```

#### [Pemetaan Token Desain Tanpa Hex]
- **Latar Trigger & Panel:** `var(--bg-base, #ffffff)` untuk outlined/elevated; `var(--color-surface-container, #f1f5f9)` untuk filled.
- **Border Outlined:** `1px solid var(--color-outline-variant, #c2c6d5)` (hover: `var(--color-outline, #737784)`).
- **Bayangan Panel:** `var(--shadow-level-2)` (0 10px 15px -3px rgba(7, 31, 23, 0.08)).
- **Bayangan Varian Elevated:** `var(--shadow-level-1)` (0 1px 3px rgba(7, 31, 23, 0.06)).
- **Focus Ring:** `var(--focus-ring)` (`0 0 0 3px rgba(0, 117, 90, 0.25)`).
- **Item Hover:** `var(--bg-subtle, #f8fafc)`.
- **Item Terpilih (Selected):** Latar `var(--primary-subtle, #e6f7f2)`, teks `var(--color-primary-dark, #00573f)`.
- **Caret Icon:** Segitiga padat warna `var(--color-text-muted, #64748b)` (saat fokus/terpilih: `var(--color-text-main, #0f172a)`).
- **Error Border & Message:** `var(--color-error, #ba1a1a)`, latar pesan `var(--color-error-bg, #ffdad6)`.
- **Z-Index Panel:** `var(--z-dropdown, 1010)`.
- **Radius:** `var(--radius-lg, 8px)`.
- **Usulan Token Turunan Baru untuk Ditinjau:**
  - `--eu-dd-height: 52px;`
  - `--eu-dd-height-sm: 36px;` (varian tabel row/toolbar compact)
  - `--eu-dd-caret-size: 8px;`
  - `--eu-dd-panel-max-height: 260px;`

---

### D. Modul Tech Spec: `tech/public-home.md`

#### [Kondisi Lama]
- Seksi 4 (Strip Marquee Merek):
  - `.brand-strip-logo`: `height: clamp(84px, 8.5vw, 115px); max-width: 220px;`
  - `.brand-strip-item`: `min-width: clamp(170px, 15vw, 230px);`
  - `--brand-gap`: `clamp(3rem, 5vw, 5.5rem);`
  - Durasi animasi: `32s linear infinite`.
  - Mobile (`< 767.98px`): `height: clamp(70px, 13vw, 88px); max-width: 170px;`, item `min-width: clamp(130px, 20vw, 160px);`.

#### [Kondisi Baru]
- Perbarui Seksi 4 (Strip Marquee Merek):
  - `.brand-strip-logo`: `height: clamp(168px, 16vw, 220px); max-width: 440px;` (desktop 2x).
  - `.brand-strip-item`: `min-width: clamp(260px, 24vw, 360px);` (menyesuaikan batas bounding logo yang lebih besar).
  - `--brand-gap`: `clamp(1.5rem, 3.5vw, 3rem);` (spasi antar-logo dirapatkan proporsional agar padat dan ritmis).
  - Durasi animasi: Disesuaikan dari 32s menjadi `48s linear infinite` agar kecepatan gerak linier horizontal tetap stabil dan nyaman dibaca.
  - Mobile (`< 767.98px`): `.brand-strip-logo` berukuran `height: clamp(90px, 20vw, 120px); max-width: 240px;` dan `.brand-strip-item` berukuran `min-width: clamp(150px, 32vw, 190px);` (~1.5x proporsional).

---

### E. Modul Terkait yang Dirujuk (TIDAK Diedit)

1. **`tech/products.md` (Bagian Sort/Filter Select):**
   - Halaman katalog produk di `views/public/products.ejs` memiliki dropdown urutan `<select id="plp-sort-select" class="plp-sort-select">`.
   - Modul ini tidak diubah; komponen baru `.eu-dd` varian `elevated` dipasang membungkus `#plp-sort-select` dengan format "Urutkan: **Terpopuler**", mempertahankan event listener `change` pada `public/js/products.js`.
2. **`tech/contact-footer.md` (Bagian Select Form Kontak `.cf-select`):**
   - Halaman kontak di `views/public/contact.ejs` memiliki dua field dropdown: `#product_id` dan `#inquiry_type` dengan class `.cf-select`.
   - Modul ini tidak diubah; komponen baru `.eu-dd` varian `outlined` dipasang membungkus `.cf-select`, menjaga validasi form kontak, token CSRF, dan Cloudflare Turnstile tetap bekerja 100% tanpa gangguan.

---

## 3. Audit Menyeluruh Semua `<select>` & Dropdown di Proyek

Berikut adalah hasil audit lengkap seluruh elemen `<select>` dan kontrol pemilihan di seluruh codebase:

| No | File Path | Field / Elemen ID/Name | Varian Terpilih | Jumlah Opsi | Butuh Cari? | Keterangan / Peran |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `views/admin/inquiries/index.ejs` | `.inquiry-status-select` (baris tabel) | Filled (sm) | 4 opsi | Tidak | Status inquiry langsung di tabel admin (baru, dibaca, ditindaklanjuti, ditolak). |
| 2 | `views/admin/inquiries/detail.ejs` | `#status` | Outlined | 4 opsi | Tidak | Ubah status inquiry pada halaman detail. |
| 3 | `views/admin/users/create.ejs` | `#role` | Outlined | 3 opsi | Tidak | Pilihan peran pengguna baru (superadmin, admin, editor). |
| 4 | `views/admin/users/edit.ejs` | `#role` | Outlined | 3 opsi | Tidak | Edit peran pengguna. |
| 5 | `views/admin/dashboard.ejs` | `.inquiry-status-select` (5 recent) | Filled (sm) | 4 opsi | Tidak | Status inquiry pada widget tabel ringkasan dashboard. |
| 6 | `views/admin/posts/create.ejs` | `#type` | Outlined | 2 opsi | Tidak | Tipe postingan (Artikel / Berita). |
| 7 | `views/admin/posts/create.ejs` | `#category_id` | Outlined | Dinamis (1-20+) | Ya (>10) | Kategori postingan berita/artikel. |
| 8 | `views/admin/posts/create.ejs` | `#status` | Outlined | 3 opsi | Tidak | Status postingan (draft, published, archived). |
| 9 | `views/admin/posts/edit.ejs` | `#type` | Outlined | 2 opsi | Tidak | Tipe postingan. |
| 10 | `views/admin/posts/edit.ejs` | `#category_id` | Outlined | Dinamis (1-20+) | Ya (>10) | Kategori postingan. |
| 11 | `views/admin/posts/edit.ejs` | `#status` | Outlined | 3 opsi | Tidak | Status postingan. |
| 12 | `views/admin/post-categories/create.ejs` | `#type` | Outlined | 2 opsi | Tidak | Tipe kategori postingan. |
| 13 | `views/admin/post-categories/edit.ejs` | `#type` | Outlined | 2 opsi | Tidak | Tipe kategori postingan. |
| 14 | `views/admin/home-content/index.ejs` | `#wcu_chip_icon` | Outlined | ~5 opsi | Tidak | Pilihan ikon chip Why Choose Us. |
| 15 | `views/admin/home-content/index.ejs` | `#home_cat_[0-3]_id` | Outlined | Dinamis (kategori) | Ya (>10) | 4 dropdown penentu kategori panel beranda. |
| 16 | `views/admin/settings/index.ejs` | `#whatsapp_button_theme` | Outlined | 3 opsi | Tidak | Tema tombol floating WhatsApp. |
| 17 | `views/admin/hero-banners/index.ejs` | `overlay_opacity` | Outlined (sm) | 6 opsi | Tidak | Pengaturan opasitas overlay slider banner. |
| 18 | `views/admin/banners/create.ejs` | `#media_type` | Outlined | 3 opsi | Tidak | Tipe media slide (image, video, youtube). |
| 19 | `views/admin/banners/edit.ejs` | `#media_type` | Outlined | 3 opsi | Tidak | Tipe media slide. |
| 20 | `views/admin/leads/index.ejs` | Filter Toolbar: `status` | Filled | 5 opsi | Tidak | Filter status pada toolbar leads. |
| 21 | `views/admin/leads/index.ejs` | Filter Toolbar: `type` | Filled | 4 opsi | Tidak | Filter tipe inquiry pada toolbar leads. |
| 22 | `views/admin/leads/index.ejs` | Row Action: `status` | Filled (sm) | 4 opsi | Tidak | Status per baris pada tabel leads. |
| 23 | `views/admin/products/index.ejs` | Toolbar: `category` | Elevated | Dinamis (1-15+) | Ya (>10) | Filter kategori produk pada toolbar katalog admin. |
| 24 | `views/admin/products/create.ejs` | `#category_id` | Outlined | Dinamis (1-15+) | Ya (>10) | Pemilihan kategori produk di form tambah. |
| 25 | `views/admin/products/create.ejs` | `#status` | Outlined | 2 opsi | Tidak | Status aktifasi produk (Aktif / Nonaktif). |
| 26 | `views/admin/products/create.ejs` | `#selectCopyProduct` (modal) | Outlined | Dinamis (produk) | Ya (>10) | Modal salin struktur kolom tabel ukuran. |
| 27 | `views/admin/products/edit.ejs` | `#category_id` | Outlined | Dinamis (1-15+) | Ya (>10) | Pemilihan kategori produk di form edit. |
| 28 | `views/admin/products/edit.ejs` | `#status` | Outlined | 2 opsi | Tidak | Status produk di form edit. |
| 29 | `views/admin/products/edit.ejs` | `#selectCopyProduct` (modal) | Outlined | Dinamis (produk) | Ya (>10) | Modal salin struktur kolom tabel ukuran. |
| 30 | `views/public/products.ejs` | `#plp-sort-select` (toolbar) | Elevated | 4 opsi | Tidak | Dropdown pengurutan katalog publik (Urutkan: **Nilai**). |
| 31 | `views/public/contact.ejs` | `#product_id` | Outlined | Dinamis (produk) | Ya (>10) | Pemilihan produk terkait pada form RFQ kontak. |
| 32 | `views/public/contact.ejs` | `#inquiry_type` | Outlined | 3 opsi | Tidak | Jenis permintaan B2B pada formulir kontak. |

---

## 4. Analisis & Verifikasi Logo Merek Section Homepage (.brand-strip-*)

### A. Dimensi Saat Ini per Breakpoint
1. **Desktop (> 768px):**
   - Tinggi Logo: `clamp(84px, 8.5vw, 115px)`
   - Max Width Logo: `220px`
   - Min Width Item: `clamp(170px, 15vw, 230px)`
   - Gap: `clamp(3rem, 5vw, 5.5rem)` (48px s/d 88px)
   - Padding Logo Box: `12px 18px`
   - Animasi Marquee: `32s linear infinite`
2. **Tablet & Mobile (768px):**
   - Tinggi Logo: `clamp(70px, 13vw, 88px)`
   - Max Width Logo: `170px`
   - Min Width Item: `clamp(130px, 20vw, 160px)`
   - Gap: `clamp(3rem, 5vw, 5.5rem)` (~48px)
   - Padding Logo Box: `10px 14px`
3. **Ponsel Sedang (480px):**
   - Tinggi Logo: `70px` (clamped min)
   - Min Width Item: `130px` (clamped min)
   - Gap: `48px`
4. **Ponsel Kecil (320px):**
   - Tinggi Logo: `70px`
   - Min Width Item: `130px`
   - Gap: `48px`

### B. Nilai Baru Terpilih (Desktop 2x & Mobile ~1.5x)
- **Tinggi Logo Desktop Baru (2x):** `clamp(168px, 16vw, 220px)`.
- **Max Width Logo Desktop Baru:** `440px`.
- **Min Width Item Desktop Baru:** `clamp(260px, 24vw, 360px)`.
- **Tinggi Logo Mobile Baru (~1.5x):** `clamp(90px, 20vw, 120px)`.
- **Max Width Logo Mobile Baru:** `240px`.
- **Min Width Item Mobile Baru:** `clamp(150px, 32vw, 190px)`.
- **Gap Antar-Logo Disesuaikan:** Diturunkan menjadi `clamp(1.5rem, 3.5vw, 3rem)` (24px s/d 48px). Marquee tampak penuh, padat, berbobot, dan tidak lagi terlihat renggang kosong.
- **Durasi Animasi Marquee:** Disesuaikan menjadi `48s` (dari 32s) agar kecepatan geser linier per piksel tetap konstan dan nyaman dibaca.

### C. Laporan Audit Resolusi File Logo Asli (Hasil Sharp / WebP)
1. `Anugerah Mulia` (`media-1791607376472-98297797.webp`): **1173 x 1089 px** (47.2 KB) &rarr; **Sangat Tajam**.
2. `Karunia Mulia` (`media-1791776055715-361349155.webp`): **1364 x 1096 px** (23.9 KB) &rarr; **Sangat Tajam**.
3. `Berkah Mulia` (`media-1791776030719-684030405.webp`): **442 x 443 px** (17.9 KB) &rarr; **Tajam & Aman** (2.0x di atas display 220px pada layar Retina 2x).
4. `Pucuk Kehidupan` (`media-1791776086064-317198948.webp`): **1600 x 1600 px** (60.5 KB) &rarr; **Sangat Tajam**.
5. `PB` (`media-1791776120815-661257821.webp`): **1024 x 1024 px** (11.4 KB) &rarr; **Sangat Tajam**.

*Kesimpulan Resolusi:* Seluruh 5 logo merek aktif memiliki resolusi aman (442px hingga 1600px). Bebas buram saat diperbesar 2x di desktop. Tidak perlu upload ulang.

---

## 5. Keputusan Terpilih & Terkunci oleh Azis

Seluruh 10 keputusan telah dijawab dan dikunci secara definitif oleh Azis:

1. **Cakupan "Semua Page":** **Opsi b** &rarr; Admin CMS + Semua halaman publik yang memiliki dropdown (filter urutan katalog di `views/public/products.ejs` dan form kontak di `views/public/contact.ejs`).
2. **Teknik Implementasi Dropdown:** **Opsi b** &rarr; Listbox kustom berbasis WAI-ARIA di atas `<select>` asli (hidden), menjamin tampilan 100% identik dengan Gambar 1 & Gambar 2.
3. **Tampilan Mobile pada Resolusi <= 480px:** **Opsi a** &rarr; Panel dropdown biasa mengambang seperti desktop dengan pembatasan `max-height: 240px` dan scroll vertikal halus.
4. **Pemetaan Varian Desain:** **Opsi a** &rarr; Varian *Outlined* untuk seluruh field form, *Elevated* untuk bar filter/urutkan (pola "Prefix: **Nilai Tebal**"), dan *Filled* untuk filter toolbar / status tabel admin.
5. **Label Mengambang (Floating Label ala Gambar 1):** **Opsi b** &rarr; Hanya dipakai pada varian filter bar atau saat field tidak memiliki label luar; form admin tetap menggunakan label statis di atas field agar konsisten dengan input teks yang ada.
6. **Lingkaran di Sisi Kiri Item (Gambar 1):** **Opsi c** &rarr; Keduanya (skeleton shimmer saat loading asinkron; saat siap, merender ikon/thumbnail jika ada data, atau merapat rapi jika tanpa ikon).
7. **Kotak Pencarian di Dalam Panel Dropdown:** **Opsi b** &rarr; Otomatis muncul kotak pencarian di bagian atas panel jika jumlah opsi > 10.
8. **Skema Warna State:** **Opsi a** &rarr; State fokus dan terpilih menggunakan palet hijau token resmi Euodoo (`var(--focus-ring)`, `var(--primary-subtle)`, `var(--color-primary-dark)`), sisanya netral abu token resmi. Lulus uji kontras WCAG AA (>= 4.5:1).
9. **Ukuran Logo Merek di Layar Mobile:** **Opsi b** &rarr; Diperbesar moderat ~1.4x s/d 1.5x (`clamp(90px, 20vw, 120px)`) agar pada viewport 320px-375px setidaknya 2 logo terlihat sekaligus secara proporsional.
10. **Gap Antar-Logo Merek:** **Opsi b** &rarr; Gap dikurangi proporsional menjadi `clamp(1.5rem, 3.5vw, 3rem)` (24px s/d 48px) agar ritme marquee rapat, padat, dan mewah.

---

## 6. Rencana Task Implementasi Mulai T-262

Rencana task implementasi terstruktur secara vertikal dan bertahap:

### Task T-262: Fondasi Komponen Dropdown Terpadu (.eu-dd-*) & Arsitektur WAI-ARIA *(diperbarui sesuai jawaban Q2, Q4, Q5, Q8)*
- **Ukuran:** M | **Skill Terkait:** `polish`, `adapt`
- **Deskripsi:** Membangun modul CSS terisolasi `.eu-dd-*` di `public/css/admin.css` dan `public/css/components.css` yang mencakup 3 varian (*outlined*, *filled*, *elevated*), label mengambang (pada filter/standalone), trigger box, caret SVG padat rotasi 180°, panel popup berbayangan lembut, dan slot skeleton/ikon seidentik Gambar 1 dan Gambar 2.
- **Acceptance Criteria:**
  1. Komponen `.eu-dd` mendukung modifier varian `.eu-dd--outlined` (border abu tipis, latar putih), `.eu-dd--filled` (latar abu muda tanpa border), dan `.eu-dd--elevated` (latar putih + bayangan lembut). *(sesuai Q4)*
  2. Dimensi trigger berukuran tinggi 52-56px dengan target sentuh mobile minimal 44px.
  3. Menggunakan 100% token resmi (`var(--bg-base)`, `var(--color-surface-container)`, `var(--color-outline-variant)`, `var(--shadow-level-2)`, dll.) tanpa nilai hex hardcoded. *(sesuai Q8)*
  4. Caret indikator berbentuk segitiga padat abu gelap (`var(--color-text-muted)`), berputar halus 180° saat terbuka.
  5. Atribut ARIA (`role="combobox"`, `role="listbox"`, `role="option"`, `aria-expanded`, `aria-activedescendant`) tersusun sesuai spesifikasi WAI-ARIA 1.2. *(sesuai Q2)*
- **File Terdampak:** `public/css/tokens.css`, `public/css/admin.css`, `public/css/components.css`.
- **Verifikasi:** Inspeksi visual DOM dan validasi markup ARIA via browser accessibility tree.

### Task T-263: Interaktivitas Keyboard, Type-ahead, Flip Viewport, Auto-Search & Integrasi Validasi T-259 *(diperbarui sesuai jawaban Q2, Q3, Q7)*
- **Ukuran:** M | **Skill Terkait:** `polish`, `adapt`
- **Deskripsi:** Mengembangkan controller JavaScript terpusat `public/js/admin-dropdown.js` untuk mengelola event buka/tutup, navigasi keyboard lengkap (Arrow, Enter, Space, Escape, Tab, Home, End, type-ahead), flip panel vertikal saat ruang bawah sempit, kotak pencarian otomatis jika opsi > 10, pembatasan max-height pada mobile <=480px, klik di luar, serta integrasi dengan `admin-form-validation.js` (T-259).
- **Acceptance Criteria:**
  1. Dropdown dapat dibuka, dinavigasi, dan dipilih sepenuhnya hanya menggunakan keyboard.
  2. Kotak pencarian otomatis dirender di bagian atas panel jika opsi > 10 item. *(sesuai Q7)*
  3. Pada viewport mobile <= 480px, panel tampil mengambang biasa dengan `max-height: 240px` dan scroll vertikal. *(sesuai Q3)*
  4. Saat ruang bawah layar kurang dari tinggi panel, class `.eu-dd-panel--top` otomatis diaktifkan (flip ke atas).
  5. Membuka satu dropdown otomatis menutup dropdown lainnya di dokumen; klik di luar menutup panel.
  6. Pemilihan opsi kustom memperbarui elemen `<select>` native dan memicu event `change`. *(sesuai Q2)*
  7. State error validasi form admin menampilkan border merah token, pesan inline, dan trigger dapat difokuskan otomatis saat form submit gagal (integrasi T-259).
- **File Terdampak:** `public/js/admin-dropdown.js`, `public/js/admin-form-validation.js`, `views/admin/layout.ejs`.
- **Verifikasi:** Uji navigasi keyboard manual (Tab/Panah/Enter/Esc), simulasi opsi > 10 dengan pencarian, dan submit form kosong.

### Task T-264: Animasi Mikro, State Lengkap & Variasi Skeleton/Ikon *(diperbarui sesuai jawaban Q2, Q6, Q8)*
- **Ukuran:** S | **Skill Terkait:** `animate`, `polish`
- **Deskripsi:** Menyempurnakan transisi mikro panel (hanya menggunakan properti `transform` dan `opacity`), rotasi caret 180 derajat, state shimmer skeleton loading (lingkaran + baris abu seidentik Gambar 1), slot ikon/thumbnail opsional saat data tersedia, skema warna hijau token untuk fokus dan terpilih, serta fallback instan pada `prefers-reduced-motion: reduce`.
- **Acceptance Criteria:**
  1. Panel muncul dan menghilang dengan transisi halus `opacity` dan `transform: translateY()`.
  2. Caret berputar halus 180 derajat saat status `aria-expanded="true"`.
  3. Slot lingkaran kiri berfungsi ganda: skeleton shimmer saat loading (identik Gambar 1), dan slot ikon/thumbnail saat data ada; jika tanpa ikon, teks merapat rapi ke kiri. *(sesuai Q6)*
  4. State fokus menggunakan focus ring hijau token (`var(--focus-ring)`: `0 0 0 3px rgba(0, 117, 90, 0.25)`), item terpilih menggunakan latar hijau lembut `var(--primary-subtle)` dan teks hijau `var(--color-primary-dark)`. *(sesuai Q8)*
  5. Efek hover dibungkus dalam `@media (hover: hover)`.
  6. Pada preferensi `prefers-reduced-motion: reduce`, transisi dan animasi berjalan instan tanpa motion.
- **File Terdampak:** `public/css/admin.css`, `public/css/components.css`.
- **Verifikasi:** Pemeriksaan DevTools rendering tab dengan emulasi prefers-reduced-motion dan visual matching dengan Gambar 1.

### Task T-265: Migrasi Dropdown Admin CMS (Form Tambah/Edit, Toolbar Table & Modal) *(diperbarui sesuai jawaban Q1, Q4, Q5, Q7)*
- **Ukuran:** M | **Skill Terkait:** `polish`, `adapt`
- **Deskripsi:** Menerapkan komponen `.eu-dd` pada 29 titik dropdown di area Admin CMS: form produk (`views/admin/products/{create,edit}.ejs`), form artikel/berita (`views/admin/posts/{create,edit}.ejs`), modal salin struktur kolom tabel ukuran, banner media type, dan filter toolbar katalog/leads sesuai pemetaan varian.
- **Acceptance Criteria:**
  1. Seluruh `<select>` pada form admin termigrasi ke `.eu-dd` varian `outlined` dengan label statis di atas. *(sesuai Q4, Q5)*
  2. Toolbar filter leads dan status tabel admin menggunakan varian `filled`. *(sesuai Q4)*
  3. Toolbar kategori produk admin menggunakan varian `elevated`. *(sesuai Q4)*
  4. Modal salin tabel ukuran produk (`#selectCopyProduct`) bekerja normal dan mendukung pencarian produk otomatis (opsi > 10). *(sesuai Q7)*
  5. Filter toolbar tabel admin dengan `data-auto-submit="true"` tetap otomatis mengirim form saat opsi dipilih.
  6. Kompatibel dengan tingkat zoom admin 100%, 125%, 150% pada resolusi 1366x768 hingga 1920x1080.
- **File Terdampak:** `views/admin/products/create.ejs`, `views/admin/products/edit.ejs`, `views/admin/posts/create.ejs`, `views/admin/posts/edit.ejs`, `views/admin/banners/create.ejs`, `views/admin/banners/edit.ejs`, `views/admin/products/index.ejs`, `views/admin/leads/index.ejs`, `views/admin/inquiries/index.ejs`.
- **Verifikasi:** Simpan data produk, salin kolom ukuran, dan uji filter tabel admin.

### Task T-266: Migrasi Dropdown Halaman Publik: Filter Urutan PLP & Form Kontak RFQ *(diperbarui sesuai jawaban Q1, Q4)*
- **Ukuran:** S | **Skill Terkait:** `polish`, `adapt`
- **Deskripsi:** Mengintegrasikan komponen `.eu-dd` varian `elevated` pada dropdown urutan katalog produk (`views/public/products.ejs`) dan varian `outlined` pada form kontak RFQ (`views/public/contact.ejs`) sesuai cakupan semua page.
- **Acceptance Criteria:**
  1. Dropdown urutan produk menampilkan format "Urutkan: **Terpopuler**" (dwibahasa ID: "Urutkan:", EN: "Sort by:") varian `elevated` seidentik Gambar 2 dan memicu AJAX update katalog secara seketika melalui `public/js/products.js`. *(sesuai Q1, Q4)*
  2. Dropdown produk dan tipe inquiry di form kontak menerapkan varian `outlined` dan terhubung rapi dengan validasi client-side, CSRF token, dan Cloudflare Turnstile tanpa konflik. *(sesuai Q1, Q4)*
  3. Aksesibilitas keyboard dan mobile drawer filter katalog tetap berfungsi 100%.
- **File Terdampak:** `views/public/products.ejs`, `public/js/products.js`, `views/public/contact.ejs`, `public/js/contact.js`.
- **Verifikasi:** Uji pengurutan katalog produk publik via AJAX dan simulasi pengiriman form kontak RFQ.

### Task T-267: Penskalaan 2x & Harmonisasi Spasi Marquee Section Merek Kami Homepage *(diperbarui sesuai jawaban Q9, Q10)*
- **Ukuran:** S | **Skill Terkait:** `polish`, `adapt`, `animate`
- **Deskripsi:** Menyesuaikan ukuran logo merek pada `.brand-strip-*` menjadi 2x di desktop (`clamp(168px, 16vw, 220px)`), ~1.5x di mobile (`clamp(90px, 20vw, 120px)`), merapatkan spasi `--brand-gap` menjadi `clamp(1.5rem, 3.5vw, 3rem)`, dan mengkalibrasi durasi animasi marquee dari 32s ke 48s agar kecepatan linier per piksel konstan.
- **Acceptance Criteria:**
  1. Logo merek di desktop tampil 2x lebih besar (`clamp(168px, 16vw, 220px)`), tampak proporsional, tajam, dan tidak buram.
  2. Logo merek di mobile tampil ~1.5x (`clamp(90px, 20vw, 120px)`), setidaknya 2 logo terlihat sekaligus pada viewport 320px-375px. *(sesuai Q9)*
  3. Jarak antar-logo seimbang dan rapat via `--brand-gap: clamp(1.5rem, 3.5vw, 3rem)`. *(sesuai Q10)*
  4. Durasi animasi marquee dikalibrasi menjadi 48s, pergerakan linier halus dan stabil.
  5. Pada viewport mobile 320px, 375px, 480px, dan 768px tidak terjadi horizontal scrollbar (overflow-x bebas bocor).
  6. Modal lightbox zoom preview (`#brandPreviewModal`) dan `prefers-reduced-motion` tetap berfungsi normal.
- **File Terdampak:** `public/css/components.css`.
- **Verifikasi:** Pengujian visual pada resolusi 320px, 375px, 480px, 768px, 1024px, 1440px.

### Task T-268: Pengujian Komprehensif Lintas Browser, Zoom Admin, dan Audit Kontras WCAG AA *(diperbarui sesuai jawaban Q1, Q8)*
- **Ukuran:** M | **Skill Terkait:** `polish`
- **Deskripsi:** Melakukan regresi pengujian menyeluruh pada seluruh form admin dan halaman publik ber-dropdown, marquee beranda, navigasi keyboard-only, emulasi pembaca layar, pengujian zoom antarmuka admin 100%, 125%, 150%, dan verifikasi rasio kontras WCAG AA/AAA.
- **Acceptance Criteria:**
  1. Nol error console pada browser saat membuka, menutup, memfilter, atau mengirimkan form ber-dropdown di admin maupun publik. *(sesuai Q1)*
  2. Seluruh pasangan teks dan latar pada komponen `.eu-dd` memenuhi ambang batas kontras WCAG AA (>= 4.5:1 untuk teks biasa, >= 3:1 untuk non-teks). *(sesuai Q8)*
  3. Tidak ada regresi pada fungsionalitas CRUD admin dan form kontak RFQ.
- **File Terdampak:** Berkas tes / skrip verifikasi.
- **Verifikasi:** Pemeriksaan laporan audit headless / browser console dan accessibility evaluation.

---

## 7. Dampak Ukuran Modul & Struktur Dokumentasi

1. **Kondisi Ukuran Saat Ini:**
   - `.agents/tech/admin-ui.md`: **7.6 KB** (sangat mendekati batas ~8 KB).
   - `.agents/INDEX.md`: **31 baris** (batas maksimal 60 baris).
2. **Strategi Pemisahan Sub-Modul:**
   - Dibuat sub-modul teknis baru: `.agents/tech/admin-ui-dropdown.md` (~4-5 KB) pada Tahap 3 (MERGE KE SPEC).
   - Sub-modul ini secara khusus mencatat struktur CSS `.eu-dd-*`, spesifikasi WAI-ARIA combobox, matriks state, dan algoritma viewport flip.
   - Di `tech/admin-ui.md` hanya ditambahkan ringkasan 3-4 baris dengan rujukan ke sub-modul baru tersebut, menjaga ukuran `tech/admin-ui.md` tetap di bawah 7.8 KB.
3. **Pembaruan Peta Dokumen `.agents/INDEX.md`:**
   - Menambahkan 1 baris pada tabel seksi 2 untuk modul dropdown:
     `| **Admin UI Dropdown Component** | ACTIVE | 2026-11-02 | [prd/admin-cms.md](prd/admin-cms.md) | [tech/admin-ui-dropdown.md](tech/admin-ui-dropdown.md) | public/css/admin.css, public/js/admin-dropdown.js |`
   - Total baris `INDEX.md` menjadi **32 baris**, 100% aman di bawah batas 60 baris.

---

## 8. Rencana CLOSE (Tahap 5 WORKFLOW.md)

Saat implementasi selesai dan diverifikasi:
1. **Modul Spesifikasi yang Diperbarui Tanggal Verifikasinya:**
   - `.agents/prd/admin-cms.md` (FR-24 diintegrasikan permanen, penanda `[PENDING T-xxx]` dihapus).
   - `.agents/tech/admin-ui.md` & `.agents/tech/admin-ui-dropdown.md` (status ACTIVE, verifikasi 2026-11-02).
   - `.agents/prd/public-home.md` & `.agents/tech/public-home.md` (FR-17 diperbarui permanen).
   - `.agents/INDEX.md` (tanggal verifikasi diperbarui).
2. **Pengarsipan Dokumen:**
   - Berkas proposal ini dipindahkan dari `changes/2026-11-02_dropdown-dan-logo-merek.md` ke `archive/`.
   - Task T-262 s/d T-268 yang telah dicentang dipindahkan dari `3-TASKS.md` ke `archive/tasks-index-full.md`.
3. **Entri `CHANGELOG.md`:**
   - Ditambahkan 1 baris entri:
     `2026-11-02 | feat(ui): standarisasi komponen dropdown kustom terpadu .eu-dd-* (WAI-ARIA) & penskalaan 2x logo portofolio merek beranda | T-262 - T-268`
