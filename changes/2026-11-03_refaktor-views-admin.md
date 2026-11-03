# PROPOSAL PERUBAHAN: Refaktor Massal View Admin (Hapus Hardcode CSS, Script Inline & Komentar)

Tanggal: 2026-11-03  
Penulis: Antigravity (AI Pair Programmer)  
Target File Dokumen: `changes/2026-11-03_refaktor-views-admin.md`  
Status: TAHAP 2: APPROVED (Keputusan Terkunci oleh Azis, Menunggu Penentuan Urutan Batch & Perintah Tahap 3: MERGE KE SPEC)  

---

## 1. Konteks
Proposal ini merencanakan refaktor arsitektur massal untuk seluruh view antarmuka admin (37 berkas tersisa) agar mematuhi standar mutu `tech/conventions.md`: eliminasi total atribut `style="..."` inline, warna hex mentah, tag `<script>` inline, dan komentar tak perlu tanpa mengubah visual maupun fungsionalitas backend. Eksekusi dibagi dalam 16 batch modular berbasis modul dengan gerbang verifikasi multi-tahap (lint views, visual Playwright, fungsionalitas CRUD, dan uji non-regresi publik).

---

## 2. Inventaris View Admin (Hasil Audit Read-Only)

Pemeriksaan dilakukan secara otomatis menggunakan skrip audit terhadap seluruh 44 berkas template admin (`views/admin/**`, partial khusus admin, dan shell layout admin):

### A. Tabel Metrik & Pelanggaran per Berkas

| No | Berkas View Admin | Halaman / Modul | Baris | Style | Hex | Script | Handler | Komentar | Total | Status |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | `views/admin/403.ejs` | Error 403 | 63 | 12 | 6 | 0 | 0 | 1 | 19 | Perlu Refaktor |
| 2 | `views/admin/about/index.ejs` | Tentang Kami (About) | 960 | 178 | 5 | 0 | 0 | 30 | 213 | Perlu Refaktor |
| 3 | `views/admin/banners/create.ejs` | Banner Slider (Hero) | 242 | 21 | 1 | 1 | 0 | 5 | 28 | Perlu Refaktor |
| 4 | `views/admin/banners/edit.ejs` | Banner Slider (Hero) | 257 | 30 | 1 | 1 | 0 | 5 | 37 | Perlu Refaktor |
| 5 | `views/admin/banners/index.ejs` | Banner Slider (Hero) | 109 | 14 | 5 | 0 | 0 | 0 | 19 | Perlu Refaktor |
| 6 | `views/admin/brands/create.ejs` | Merek Klien (Brands) | 76 | 5 | 0 | 0 | 0 | 0 | 5 | Perlu Refaktor |
| 7 | `views/admin/brands/edit.ejs` | Merek Klien (Brands) | 76 | 5 | 0 | 0 | 0 | 0 | 5 | Perlu Refaktor |
| 8 | `views/admin/brands/index.ejs` | Merek Klien (Brands) | 132 | 19 | 1 | 0 | 0 | 1 | 21 | Perlu Refaktor |
| 9 | `views/admin/capabilities/index.ejs` | Kapabilitas Manufaktur | 163 | 16 | 0 | 0 | 0 | 2 | 18 | Perlu Refaktor |
| 10 | `views/admin/change-password.ejs` | Ganti Password | 52 | 2 | 0 | 0 | 0 | 0 | 2 | Perlu Refaktor |
| 11 | `views/admin/contact/index.ejs` | Kontak & Jam Kerja | 98 | 9 | 5 | 0 | 0 | 3 | 17 | Perlu Refaktor |
| 12 | `views/admin/dashboard.ejs` | Dashboard | 317 | 18 | 1 | 1 | 0 | 3 | 23 | Perlu Refaktor |
| 13 | `views/admin/hero-banners/index.ejs` | Banner Sub-Halaman | 158 | 19 | 11 | 0 | 0 | 5 | 35 | Perlu Refaktor |
| 14 | `views/admin/home-content/index.ejs` | Konten Beranda | 681 | 131 | 22 | 0 | 0 | 15 | 168 | Perlu Refaktor |
| 15 | `views/admin/inquiries/detail.ejs` | Pesan Masuk (Detail) | 115 | 20 | 0 | 0 | 0 | 2 | 22 | Perlu Refaktor |
| 16 | `views/admin/inquiries/index.ejs` | Pesan Masuk (Daftar) | 320 | 20 | 1 | 1 | 0 | 2 | 24 | Perlu Refaktor |
| 17 | `views/admin/leads/index.ejs` | WhatsApp Leads | 150 | 20 | 4 | 0 | 0 | 2 | 26 | Perlu Refaktor |
| 18 | `views/admin/login.ejs` | Login Admin | 104 | 13 | 0 | 1 | 0 | 0 | 14 | Perlu Refaktor |
| 19 | `views/admin/media/index.ejs` | Media Library | 263 | 17 | 3 | 1 | 0 | 3 | 24 | Perlu Refaktor |
| 20 | `views/admin/post-categories/create.ejs` | Kategori Artikel | 58 | 1 | 0 | 0 | 0 | 0 | 1 | Perlu Refaktor |
| 21 | `views/admin/post-categories/edit.ejs` | Kategori Artikel | 58 | 1 | 0 | 0 | 0 | 0 | 1 | Perlu Refaktor |
| 22 | `views/admin/post-categories/index.ejs` | Kategori Artikel | 96 | 8 | 0 | 0 | 0 | 0 | 8 | Perlu Refaktor |
| 23 | `views/admin/posts/create.ejs` | Artikel Berita (Buat) | 205 | 7 | 0 | 1 | 0 | 3 | 11 | Perlu Refaktor |
| 24 | `views/admin/posts/edit.ejs` | Artikel Berita (Edit) | 191 | 8 | 0 | 1 | 0 | 3 | 12 | Perlu Refaktor |
| 25 | `views/admin/posts/index.ejs` | Artikel Berita (Daftar) | 127 | 15 | 2 | 0 | 0 | 0 | 17 | Perlu Refaktor |
| 26 | `views/admin/product-categories/create.ejs` | Kategori Produk | 57 | 1 | 0 | 0 | 0 | 0 | 1 | Perlu Refaktor |
| 27 | `views/admin/product-categories/edit.ejs` | Kategori Produk | 57 | 1 | 0 | 0 | 0 | 0 | 1 | Perlu Refaktor |
| 28 | `views/admin/product-categories/index.ejs` | Kategori Produk | 97 | 10 | 0 | 0 | 0 | 0 | 10 | Perlu Refaktor |
| 29 | `views/admin/products/create.ejs` | Katalog Produk (Buat) | 432 | 0 | 0 | 1 | 0 | 0 | 1 | Perlu Refaktor |
| 30 | `views/admin/products/edit.ejs` | Katalog Produk (Edit) | 484 | 0 | 0 | 1 | 0 | 0 | 1 | Perlu Refaktor |
| 31 | `views/admin/products/index.ejs` | Katalog Produk (Daftar) | 119 | 12 | 1 | 0 | 0 | 1 | 14 | Perlu Refaktor |
| 32 | `views/admin/settings/index.ejs` | Pengaturan Situs | 23 | 0 | 0 | 0 | 0 | 0 | 0 | **BERSIH (Pilot)** |
| 33 | `views/admin/settings/partials/corporate-identity-card.ejs` | Pengaturan Situs | 27 | 0 | 0 | 0 | 0 | 0 | 0 | **BERSIH (Pilot)** |
| 34 | `views/admin/settings/partials/dual-location-card.ejs` | Pengaturan Situs | 119 | 0 | 0 | 0 | 0 | 0 | 0 | **BERSIH (Pilot)** |
| 35 | `views/admin/settings/partials/social-media-card.ejs` | Pengaturan Situs | 60 | 0 | 0 | 0 | 0 | 0 | 0 | **BERSIH (Pilot)** |
| 36 | `views/admin/settings/partials/sticky-actions.ejs` | Pengaturan Situs | 20 | 0 | 0 | 0 | 0 | 0 | 0 | **BERSIH (Pilot)** |
| 37 | `views/admin/settings/partials/visual-identity-card.ejs` | Pengaturan Situs | 78 | 0 | 0 | 0 | 0 | 0 | 0 | **BERSIH (Pilot)** |
| 38 | `views/admin/settings/partials/whatsapp-service-card.ejs` | Pengaturan Situs | 74 | 0 | 0 | 0 | 0 | 0 | 0 | **BERSIH (Pilot)** |
| 39 | `views/admin/users/create.ejs` | Manajemen Pengguna | 70 | 3 | 1 | 0 | 0 | 0 | 4 | Perlu Refaktor |
| 40 | `views/admin/users/edit.ejs` | Manajemen Pengguna | 61 | 1 | 0 | 0 | 0 | 0 | 1 | Perlu Refaktor |
| 41 | `views/admin/users/index.ejs` | Manajemen Pengguna | 110 | 6 | 0 | 0 | 0 | 0 | 6 | Perlu Refaktor |
| 42 | `views/partials/admin-footer.ejs` | Admin Shell Partials | 22 | 0 | 0 | 0 | 0 | 3 | 3 | Perlu Refaktor |
| 43 | `views/partials/admin-header.ejs` | Admin Shell Partials | 312 | 2 | 1 | 1 | 0 | 14 | 18 | Perlu Refaktor |
| 44 | `views/partials/media-picker-modal.ejs` | Admin Universal Modal | 106 | 28 | 17 | 0 | 0 | 9 | 54 | Perlu Refaktor |
| - | **TOTAL (44 Berkas)** | - | **7.399** | **673** | **88** | **11** | **0** | **112** | **884** | **37 Perlu Refaktor** |

*Catatan Shell Layout:* Berkas `views/layouts/admin.ejs` (3 baris) hanya memuat tag wrapper `<%- body %>` dan bersih dari pelanggaran (0 pelanggaran).

### B. Daftar Partial Bersama Admin dan Publik (Hanya Dicatat)
Berdasarkan pemindaian rekursif pada seluruh direktori `views/`:
- **Temuan:** **TIDAK ADA partial yang dipakai bersama antara view admin dan view publik.**
- Seluruh partial admin (`views/partials/admin-header.ejs`, `views/partials/admin-footer.ejs`, `views/partials/media-picker-modal.ejs`) hanya di-include oleh halaman admin.
- Seluruh partial publik (`header.ejs`, `navbar.ejs`, `footer.ejs`, `cta-global.ejs`, `whatsapp-btn.ejs`, `news-card.ejs`, `product-card-fragment.ejs`) hanya di-include oleh halaman publik.
- Dengan demikian, cakupan refaktor ini **100% terisolasi** di ranah admin tanpa risiko menyentuh partial publik.

### C. Daftar Kasus Style Dinamis dari Data / Database
Ditemukan **15 kasus** pemanggilan inline style yang memuat tag EJS dinamis. Seluruhnya adalah logika visibilitas komponen pemilih media (*Media Picker preview toggling*):

| No | File : Baris | Cuplikan Kode | Rekomendasi Solusi Sesuai Konvensi |
| :---: | :--- | :--- | :--- |
| 1 | `views/admin/home-content/index.ejs:103` | `style="<%= homeContent.intro.image_url ? 'display: block;' : 'display: none;' %>"` | Ganti ke class semantik status: `<img class="adm-home-preview-img <%= homeContent.intro.image_url ? 'adm-d-block' : 'adm-d-none' %>">` |
| 2 | `views/admin/home-content/index.ejs:104` | `style="<%= homeContent.intro.image_url ? 'display: none;' : '' %>"` | Ganti ke class semantik: `<div class="media-picker-empty <%= homeContent.intro.image_url ? 'adm-d-none' : '' %>">` |
| 3 | `views/admin/home-content/index.ejs:114` | `style="<%= homeContent.intro.image_url ? '' : 'display: none;' %>"` | Ganti ke class semantik: `<button class="adm-btn adm-btn-danger btn-clear-media <%= homeContent.intro.image_url ? '' : 'adm-d-none' %>">` |
| 4 | `views/admin/home-content/index.ejs:352` | `style="<%= catItem.image_url ? 'display: block;' : 'display: none;' %>"` | Ganti ke class semantik: `<img class="adm-home-cat-img <%= catItem.image_url ? 'adm-d-block' : 'adm-d-none' %>">` |
| 5 | `views/admin/home-content/index.ejs:353` | `style="<%= catItem.image_url ? 'display: none;' : '' %>"` | Ganti ke class semantik: `<div class="media-picker-empty <%= catItem.image_url ? 'adm-d-none' : '' %>">` |
| 6 | `views/admin/home-content/index.ejs:363` | `style="<%= catItem.image_url ? '' : 'display: none;' %>"` | Ganti ke class semantik: `<button class="adm-btn btn-clear-media <%= catItem.image_url ? '' : 'adm-d-none' %>">` |
| 7 | `views/admin/home-content/index.ejs:489` | `style="<%= item.logo_url ? 'display: block;' : 'display: none;' %>"` | Ganti ke class semantik: `<img class="adm-home-cert-img <%= item.logo_url ? 'adm-d-block' : 'adm-d-none' %>">` |
| 8 | `views/admin/home-content/index.ejs:490` | `style="<%= item.logo_url ? 'display: none;' : '' %>"` | Ganti ke class semantik: `<div class="media-picker-empty <%= item.logo_url ? 'adm-d-none' : '' %>">` |
| 9 | `views/admin/home-content/index.ejs:499` | `style="<%= item.logo_url ? '' : 'display: none;' %>"` | Ganti ke class semantik: `<button class="adm-btn btn-clear-media <%= item.logo_url ? '' : 'adm-d-none' %>">` |
| 10 | `views/admin/posts/create.ejs:97` | `style="<%= typeof formData !== 'undefined' && formData?.image_url ? 'display: block;' : 'display: none;' %>"` | Ganti ke class semantik: `<img class="adm-post-img <%= (typeof formData !== 'undefined' && formData?.image_url) ? 'adm-d-block' : 'adm-d-none' %>">` |
| 11 | `views/admin/posts/create.ejs:98` | `style="<%= typeof formData !== 'undefined' && formData?.image_url ? 'display: none;' : '' %>"` | Ganti ke class semantik: `<div class="media-picker-empty <%= (typeof formData !== 'undefined' && formData?.image_url) ? 'adm-d-none' : '' %>">` |
| 12 | `views/admin/posts/create.ejs:108` | `style="<%= typeof formData !== 'undefined' && formData?.image_url ? '' : 'display: none;' %>"` | Ganti ke class semantik: `<button class="adm-btn btn-clear-media <%= (typeof formData !== 'undefined' && formData?.image_url) ? '' : 'adm-d-none' %>">` |
| 13 | `views/admin/posts/edit.ejs:104` | `style="<%= post.display_image ? 'display: block;' : 'display: none;' %>"` | Ganti ke class semantik: `<img class="adm-post-img <%= post.display_image ? 'adm-d-block' : 'adm-d-none' %>">` |
| 14 | `views/admin/posts/edit.ejs:105` | `style="<%= post.display_image ? 'display: none;' : '' %>"` | Ganti ke class semantik: `<div class="media-picker-empty <%= post.display_image ? 'adm-d-none' : '' %>">` |
| 15 | `views/admin/posts/edit.ejs:115` | `style="<%= post.display_image ? '' : 'display: none;' %>"` | Ganti ke class semantik: `<button class="adm-btn btn-clear-media <%= post.display_image ? '' : 'adm-d-none' %>">` |

### D. Audit Nilai Hex Warna Lama & Pemetaan Token

#### 1. Nilai Hex yang Sudah Memiliki Padanan Resmi di `tokens.css`:
- `#00755a` &rarr; `var(--color-primary)` (Brand Primary)
- `#00906e` &rarr; `var(--color-primary-bright)` / `var(--color-accent)`
- `#071f17` &rarr; `var(--surface-dark-deep)` / `var(--adm-btn-primary-text)`
- `#0b281e` &rarr; `var(--surface-dark-surface)`
- `#0f172a` &rarr; `var(--color-text-main)` (Teks Utama)
- `#334155` &rarr; `var(--color-info)` / `var(--status-info)`
- `#424753` &rarr; `var(--color-text-variant)`
- `#64748b` &rarr; `var(--color-text-muted)` (Teks Redup)
- `#cbd5e1` &rarr; `var(--color-surface-container-highest)` / `var(--color-info-border)`
- `#e2e8f0` &rarr; `var(--color-border)` / `var(--color-surface-dim)`
- `#f1f5f9` &rarr; `var(--color-surface-container)` (Container Latar)
- `#f8fafc` &rarr; `var(--bg-subtle)` / `var(--color-workspace-bg)`
- `#ffffff` / `#fff` &rarr; `var(--bg-base)` / `var(--color-surface-container-lowest)`

#### 2. Nilai Hex yang Belum Memiliki Padanan Resmi di `tokens.css` (Diajukan sebagai USULAN TOKEN):
Pemeriksaan kode menghasilkan **9 nilai hex** di view admin yang belum terdaftar di `public/css/tokens.css`. Sesuai instruksi, agent **dilarang menambah token diam-diam** atau mengganti warna dengan yang "mirip", sehingga dikumpulkan di sini untuk ditinjau oleh Azis:

| No | Nilai Hex | Modul / Lokasi Berkas | Konteks Penggunaan | Usulan Token Baru / Opsi Pemetaan |
| :---: | :---: | :--- | :--- | :--- |
| 1 | `#dc2626` | `403.ejs:46`, `media/index.ejs:56, 189` | Ikon error / bahaya 403 & indikator video merah | `--color-danger: #dc2626;` (atau petakan ke token resmi `--color-error: #ba1a1a;`) |
| 2 | `#fee2e2` | `403.ejs:46` | Latar lingkaran ikon peringatan 403 | `--color-danger-subtle: #fee2e2;` (atau petakan ke token resmi `--color-error-bg: #ffdad6;`) |
| 3 | `#fca5a5` | `403.ejs:39` | Tautan keluar (logout) pada bar atas 403 | `--color-danger-muted: #fca5a5;` (atau gunakan CSS scoped `.err403-logout-link`) |
| 4 | `#10b981` | `about/index.ejs:692`, `contact/index.ejs:79`, `home-content/index.ejs:662` | Titik indikator hijau status aktif / online | `--color-status-live: #10b981;` (atau petakan ke `--color-leaf: #7cbe38;` / `--color-success: #15803d;`) |
| 5 | `#16a34a` | `leads/index.ejs:90` | Tautan nomor obrolan WhatsApp | Petakan ke token resmi `--color-eco-green: #15803d;` atau `--color-leaf: #7cbe38;` |
| 6 | `#475569` | `banners/index.ejs:63`, `hero-banners/index.ejs:40`, `leads/index.ejs:101`, `media-picker-modal.ejs:52` | Teks sub-label abu-abu gelap & badge rute | Petakan ke token resmi `--color-text-variant: #424753;` atau `--color-text-muted: #64748b;` |
| 7 | `#94a3b8` | `media-picker-modal.ejs:34, 50` | Ikon pencarian & teks kondisi kosong modal | Petakan ke token resmi `--color-text-muted: #64748b;` atau `--color-outline: #737784;` |
| 8 | `#b45309` | `media/index.ejs:66`, `posts/index.ejs:87` | Teks status terjadwal / peringatan kuning-cokelat | Petakan ke token resmi `--color-warning: #f59e0b;` |
| 9 | `#fafbfc` | `brands/index.ejs:72`, `dashboard.ejs:166`, `inquiries/index.ejs:176`, `posts/index.ejs:53`, `products/index.ejs:67`, `users/create.ejs:47` | Latar kartu ringkasan & thumbnail kotak | Petakan ke token resmi `--color-workspace-bg: #f8fafc;` (selisih kontras 0.05% mata telanjang) |

---

## 3. Definisi Komentar (Higiene Sesuai `antislop-code`)

### A. Komentar yang WAJIB DIHAPUS:
- Seluruh komentar HTML `<!-- ... -->` (total 112 baris di view admin).
- Seluruh komentar EJS `<%# ... %>` jika ditemukan.
- Sesuai prinsip *antislop-code*:
  - **Decorative Separators:** Banner komentar bergaris pemisah seperti `<!-- TAB PANE 1: SEJARAH -->`, `<!-- Card 1: ... -->`.
  - **Workflow Narration:** Komentar alur seperti `<!-- 1. Key Metrics Cards -->`, `<!-- Sticky Actions Bar -->`.
  - **Restating the Obvious:** Komentar yang menduplikasi elemen markup langsung di bawahnya seperti `<!-- Gambar Slide via Media Library Picker -->` tepat sebelum form-group media picker.
  - **Closing Echo:** Komentar penutup tag seperti `</div> <!-- End .app-content -->` di `admin-footer.ejs`.

### B. Komentar yang DIPERTAHANKAN:
- Direktif fungsional mesin: komentar kondisional IE bila ada (`<!--[if ...]>`) atau direktif linter seperti `/* eslint-disable */` / `<!-- prettier-ignore -->` (saat ini 0 temuan di view admin).

### C. Komentar pada Berkas CSS dan JS Admin:
- Bergantung pada keputusan Azis atas **Pertanyaan Wajib 1**:
  - Jika memilih **Opsi A (Rekomendasi)**: Berkas CSS/JS lama tidak dibersihkan komentarnya agar diff tetap kecil dan fokus.
  - Jika memilih **Opsi B**: Komentar tak berguna pada CSS/JS admin dibersihkan mengikuti panduan `antislop-code`.

---

## 4. Strategi Batch & Gerbang Kualitas (Quality Gates)

### A. Prinsip Pembagian Batch
1. **Modul Berurutan dari Kecil ke Besar:** Modul sederhana dengan jumlah baris dan pelanggaran sedikit dikerjakan terlebih dahulu untuk memvalidasi pola, diikuti modul yang lebih kompleks.
2. **Batas Ukuran:** Maksimal ~5 berkas atau 1 halaman modular per batch.
3. **Satu Commit per Batch:** Setiap batch membentuk 1 commit git atomik mandiri dengan format commit: `refactor(admin): refaktor view <nama-modul> (T-xxx)`.

### B. 5 Gerbang Kualitas per Batch (Wajib Hijau Sebelum Commit)
Sebelum suatu batch dinyatakan selesai, wajib melewati 5 gerbang tanpa kecuali:
1. **Gerbang Lint Views:** Jalankan `npm run lint:views -- --strict <path-berkas-batch>` &rarr; **0 error dan 0 warning** pada seluruh berkas yang disentuh di batch tersebut.
2. **Gerbang Lint Global:** Jalankan `npm run lint` &rarr; **Hijau (0 error)**.
3. **Gerbang Unit & Backend Test:** Jalankan `npm run test:storage && npm run test:security && npm run test:cms` &rarr; **100% PASS**.
4. **Gerbang Perbandingan Visual Playwright:**
   - Jalankan uji tangkapan layar Playwright *sebelum* vs *sesudah* pada resolusi admin:
     - Mobile: `375x812`
     - Tablet: `768x1024`
     - Desktop Laptop: `1280x800`
     - Desktop Full: `1440x900`
   - Agent **DILARANG KERAS** mengklaim tampilan "identik" tanpa bukti tangkapan layar dan diff piksel. Hal yang tidak dapat diverifikasi secara otomatis wajib dilaporkan ke user.
5. **Gerbang Fungsionalitas & Konsol Browser:**
   - Seluruh aksi form pada halaman batch (simpan data, upload media picker, hapus item, validasi error inline, verifikasi CSRF token, reset button) berfungsi normal.
   - Tidak ada error atau peringatan merah pada konsol JavaScript browser (`console.error`).

### C. Penegakan Baseline Strict Linter
Setelah batch berhasil melewati kelima gerbang, path modul tersebut didaftarkan ke `DEFAULT_STRICT_PATHS` pada `scripts/lint-views.js`. Pelanggaran baru pada modul tersebut di masa depan akan langsung menghentikan build sebagai *blocking error*.

---

## 5. Protokol Penanganan Bila Gerbang Gagal
1. Jika salah satu dari kelima gerbang di atas gagal, agent **WAJIB LANGSUNG BERHENTI**.
2. Lakukan *revert* hanya pada berkas batch tersebut (`git checkout -- <file-batch>`), tanpa menyentuh batch yang sudah lulus sebelumnya.
3. **DILARANG KERAS** menjalankan `git reset --hard` atau mengubah data di basis data.
4. Laporkan akar penyebab kegagalan (*Root Cause Analysis*) secara transparan kepada user dan tunggu instruksi perbaikan. Jangan pernah melompat ke batch berikutnya saat batch aktif masih merah.

---

## 6. Standar Penanganan CSS & Skrip Eksternal

1. **Prefix Class Unik per Komponen:** Seluruh atribut `style="..."` inline diekstraksi ke class CSS baru yang ditempatkan pada `public/css/admin.css` dengan prefix terisolasi:
   - Error 403: `.err403-*`
   - Login: `.adm-login-*`
   - Ganti Password: `.chpwd-*`
   - Kategori Produk: `.adm-pcat-*`
   - Kategori Artikel: `.adm-postcat-*`
   - Manajemen Pengguna: `.adm-usr-*`
   - Merek Klien: `.adm-brd-*`
   - Kapabilitas Manufaktur: `.adm-cap-*`
   - Kontak & Jam Kerja: `.adm-ctc-*`
   - Banner Sub-Halaman: `.adm-hbn-*`
   - WhatsApp Leads: `.adm-leads-*`
   - Pesan Masuk (Inquiries): `.adm-inq-*`
   - Dashboard Admin: `.adm-dash-*`
   - Admin Shell & Partials: `.adm-shell-*`, `.adm-picker-*`
   - Media Library: `.adm-media-*`
   - Hero Banner Slider: `.adm-banner-*`
   - Artikel Berita: `.adm-post-*`
   - Katalog Produk: `.adm-prod-*`
   - Konten Beranda: `.adm-home-*`
   - Tentang Kami: `.adm-abt-*`
2. **Class Bersama Tidak Berubah:** Class bersama sistem seperti `.form-card`, `.form-group`, `.form-row-2`, `.adm-btn-*`, `.eu-dd-*` tidak boleh dimodifikasi strukturnya.
3. **Spasi & Dimensi Komponen:** Nilai spasi atau dimensi hardcode (mis. `padding: 10px 12px`, `width: 54px`, `height: 38px`) diekstraksi menjadi class komponen dengan nilai statis terukur di `public/css/admin.css` tanpa menambah token spasi baru di `tokens.css`.
4. **Ekstraksi Skrip Inline ke JS Eksternal:** Seluruh 11 tag `<script>` inline diekstraksi ke berkas JavaScript eksternal di `public/js/` (misalnya `admin-banners.js`, `admin-inquiries.js`, `admin-posts.js`, dsb.).
5. **Data Transfer Server ke Client:** Penyerahan data JSON dari server ke client (seperti `dashboardInquiries` dan `inquiriesData`) dilakukan via `<script id="inquiries-data" type="application/json"><%- JSON.stringify(...) %></script>` atau atribut `data-*`, bersih dari eksekusi inline script, serta patuh CSP ketat.

---

## 7. Rencana Task Implementasi (Mulai T-277 s/d T-293)

Penomoran task melanjutkan nomor aktif di `3-TASKS.md` (mulai **T-277**):

### 1. T-277: Batch 1 - Refaktor View Auth & Error (403, Login, Change Password)
- **Deskripsi:** Refaktor berkas `views/admin/403.ejs`, `views/admin/login.ejs`, dan `views/admin/change-password.ejs`.
- **Target Pelanggaran:** 35 temuan (27 style, 6 hex, 1 script, 1 komentar).
- **Aksi Teknis:** Ekstraksi style ke `.err403-*`, `.adm-login-*`, `.chpwd-*`. Pindahkan inline error handler logo di login ke `public/js/admin-login.js`. Eliminasi komentar HTML.
- **Skill:** `antislop-code`
- **Acceptance Criteria:** `lint:views` 0 error/warning pada 3 berkas, layout halaman login/403/ganti-password identik visual Playwright, fungsionalitas login dan ganti password berjalan mulus.

### 2. T-278: Batch 2 - Refaktor View Kategori Produk (Product Categories)
- **Deskripsi:** Refaktor modul `views/admin/product-categories/` (`index.ejs`, `create.ejs`, `edit.ejs`).
- **Target Pelanggaran:** 12 temuan (12 style, 0 hex, 0 script, 0 komentar).
- **Aksi Teknis:** Ekstraksi style ke `.adm-pcat-*`. Pertahankan integrasi dropdown `.eu-dd-*` dan tombol `.adm-btn-*`.
- **Skill:** `antislop-code`
- **Acceptance Criteria:** `lint:views` 0 error/warning, CRUD kategori produk normal, tampilan tabel dan modal/form identik.

### 3. T-279: Batch 3 - Refaktor View Kategori Artikel (Post Categories)
- **Deskripsi:** Refaktor modul `views/admin/post-categories/` (`index.ejs`, `create.ejs`, `edit.ejs`).
- **Target Pelanggaran:** 10 temuan (10 style, 0 hex, 0 script, 0 komentar).
- **Aksi Teknis:** Ekstraksi style ke `.adm-postcat-*`.
- **Skill:** `antislop-code`
- **Acceptance Criteria:** `lint:views` 0 error/warning, form create/edit dan tabel daftar kategori artikel berjalan normal.

### 4. T-280: Batch 4 - Refaktor View Manajemen Pengguna (Users)
- **Deskripsi:** Refaktor modul `views/admin/users/` (`index.ejs`, `create.ejs`, `edit.ejs`).
- **Target Pelanggaran:** 11 temuan (10 style, 1 hex, 0 script, 0 komentar).
- **Aksi Teknis:** Ekstraksi style ke `.adm-usr-*`. Ganti hex box warning `#fafbfc` ke token.
- **Skill:** `antislop-code`
- **Acceptance Criteria:** `lint:views` 0 error/warning, RBAC dan manajemen role user berjalan normal, tampilan identik.

### 5. T-281: Batch 5 - Refaktor View Merek Klien (Brands)
- **Deskripsi:** Refaktor modul `views/admin/brands/` (`index.ejs`, `create.ejs`, `edit.ejs`).
- **Target Pelanggaran:** 31 temuan (29 style, 1 hex, 0 script, 1 komentar).
- **Aksi Teknis:** Ekstraksi style ke `.adm-brd-*`. Pindahkan thumbnail container `#fafbfc` ke class CSS. Hapus komentar HTML.
- **Skill:** `antislop-code`
- **Acceptance Criteria:** `lint:views` 0 error/warning, upload logo merek dan drag/toggle status aktif berfungsi normal.

### 6. T-282: Batch 6 - Refaktor View Kapabilitas Manufaktur & Kontak
- **Deskripsi:** Refaktor berkas `views/admin/capabilities/index.ejs` dan `views/admin/contact/index.ejs`.
- **Target Pelanggaran:** 35 temuan (25 style, 5 hex, 0 script, 5 komentar).
- **Aksi Teknis:** Ekstraksi style ke `.adm-cap-*` dan `.adm-ctc-*`. Ganti indikator hijau `#10b981` dan hex kontak ke token. Hapus komentar pembagi seksi.
- **Skill:** `antislop-code`
- **Acceptance Criteria:** `lint:views` 0 error/warning, simpan jam operasional dan kapabilitas pabrik berjalan normal.

### 7. T-283: Batch 7 - Refaktor View Hero Banners & WhatsApp Leads
- **Deskripsi:** Refaktor berkas `views/admin/hero-banners/index.ejs` dan `views/admin/leads/index.ejs`.
- **Target Pelanggaran:** 61 temuan (39 style, 15 hex, 0 script, 7 komentar).
- **Aksi Teknis:** Ekstraksi style ke `.adm-hbn-*` dan `.adm-leads-*`. Ganti warna teks rute dan tautan WA `#16a34a` ke token. Hapus komentar HTML.
- **Skill:** `antislop-code`
- **Acceptance Criteria:** `lint:views` 0 error/warning, mockup hero banner dan export/filter leads WA berfungsi normal.

### 8. T-284: Batch 8 - Refaktor View Pesan Masuk (Inquiries)
- **Deskripsi:** Refaktor modul `views/admin/inquiries/` (`index.ejs` dan `detail.ejs`).
- **Target Pelanggaran:** 46 temuan (40 style, 1 hex, 1 script, 4 komentar).
- **Aksi Teknis:** Ekstraksi style ke `.adm-inq-*`. Pindahkan inline script modal quick review ke `public/js/admin-inquiries.js` dengan data transfer via JSON block aman.
- **Skill:** `antislop-code`
- **Acceptance Criteria:** `lint:views` 0 error/warning, status follow up pesan dan modal detail berfungsi normal tanpa console error.

### 9. T-285: Batch 9 - Refaktor View Dashboard Admin
- **Deskripsi:** Refaktor berkas `views/admin/dashboard.ejs`.
- **Target Pelanggaran:** 23 temuan (18 style, 1 hex, 1 script, 3 komentar).
- **Aksi Teknis:** Ekstraksi style metrik dan tabel ke `.adm-dash-*`. Pindahkan script slide-over inquiry ke `public/js/admin-dashboard.js`. Hapus komentar pembagi kartu.
- **Skill:** `antislop-code`
- **Acceptance Criteria:** `lint:views` 0 error/warning, metrik kartu dan slide-over inquiry di dashboard berfungsi lancar.

### 10. T-286: Batch 10 - Refaktor View Admin Shell & Universal Partials
- **Deskripsi:** Refaktor berkas `views/partials/admin-header.ejs`, `views/partials/admin-footer.ejs`, dan `views/partials/media-picker-modal.ejs`.
- **Target Pelanggaran:** 75 temuan (30 style, 18 hex, 1 script, 26 komentar).
- **Aksi Teknis:** Ekstraksi style shell ke `.adm-shell-*` dan modal picker ke `.adm-picker-*`. Pindahkan script init sidebar di head ke file eksternal `public/js/admin-header-init.js`. Hapus seluruh komentar HTML.
- **Skill:** `antislop-code`
- **Acceptance Criteria:** `lint:views` 0 error/warning, collapse/expand sidebar tidak mengalami flash (FOUC), universal media picker modal tetap terbuka dan berfungsi di seluruh halaman admin.

### 11. T-287: Batch 11 - Refaktor View Media Library
- **Deskripsi:** Refaktor berkas `views/admin/media/index.ejs`.
- **Target Pelanggaran:** 24 temuan (17 style, 3 hex, 1 script, 3 komentar).
- **Aksi Teknis:** Ekstraksi style ke `.adm-media-*`. Pindahkan fungsi preview YouTube ke `public/js/admin-media.js`. Hapus komentar modal.
- **Skill:** `antislop-code`
- **Acceptance Criteria:** `lint:views` 0 error/warning, upload gambar/video dan input YouTube link berfungsi normal.

### 12. T-288: Batch 12 - Refaktor View Hero Banner Slider (Banners)
- **Deskripsi:** Refaktor modul `views/admin/banners/` (`index.ejs`, `create.ejs`, `edit.ejs`).
- **Target Pelanggaran:** 84 temuan (65 style, 7 hex, 2 script, 10 komentar).
- **Aksi Teknis:** Ekstraksi style ke `.adm-banner-*`. Pindahkan logika switch sumber banner (upload vs library vs youtube) ke `public/js/admin-banners.js`. Hapus komentar HTML.
- **Skill:** `antislop-code`
- **Acceptance Criteria:** `lint:views` 0 error/warning, fungsionalitas banner hero (slider, dual CTA, switch media) berjalan normal.

### 13. T-289: Batch 13 - Refaktor View Artikel Berita & Blog (Posts)
- **Deskripsi:** Refaktor modul `views/admin/posts/` (`index.ejs`, `create.ejs`, `edit.ejs`).
- **Target Pelanggaran:** 40 temuan (30 style, 2 hex, 2 script, 6 komentar).
- **Aksi Teknis:** Ekstraksi style ke `.adm-post-*`. Pindahkan fungsi toggle scheduled row ke `public/js/admin-posts.js`. Konversi preview cover image dari inline style ke class semantik. Hapus komentar HTML.
- **Skill:** `antislop-code`
- **Acceptance Criteria:** `lint:views` 0 error/warning, integrasi TinyMCE editor, publish/draft/schedule artikel berfungsi normal.

### 14. T-290: Batch 14 - Refaktor & Modularisasi View Katalog Produk (Products)
- **Deskripsi:** Refaktor dan modularisasi `views/admin/products/` (`index.ejs`, `create.ejs`, `edit.ejs`).
- **Target Pelanggaran:** 16 temuan (12 style, 1 hex, 2 script, 1 komentar), ditambah pemecahan berkas form raksasa (>400 baris) menjadi partials per tab/card sesuai konvensi.
- **Aksi Teknis:** Ekstraksi karakter counter ke `public/js/admin-products.js`. Pecah form create/edit menjadi partial modular (`views/admin/products/partials/basic-info.ejs`, `gallery.ejs`, `size-table.ejs`, `seo.ejs`). Ekstraksi style galeri dan tabel ukuran.
- **Skill:** `antislop-code`
- **Acceptance Criteria:** `lint:views` 0 error/warning, ukuran berkas partial <=100 baris, builder tabel ukuran dan upload galeri produk berfungsi tanpa kendala.

### 15. T-291: Batch 15 - Refaktor & Modularisasi View Konten Beranda (Home Content)
- **Deskripsi:** Refaktor dan modularisasi berkas `views/admin/home-content/index.ejs` (681 baris).
- **Target Pelanggaran:** 168 temuan (131 style, 22 hex, 0 script, 15 komentar).
- **Aksi Teknis:** Pecah template besar menjadi partials per tab pane (`views/admin/home-content/partials/tab-intro.ejs`, `tab-wcu.ejs`, `tab-categories.ejs`, `tab-certifications.ejs`, `tab-cta.ejs`, `sticky-actions.ejs`). Ekstraksi seluruh inline style ke `.adm-home-*`. Konversi 9 kasus style dinamis media picker ke class semantik. Hapus komentar HTML.
- **Skill:** `antislop-code`
- **Acceptance Criteria:** `lint:views` 0 error/warning, seluruh 5 tab pane beranda tersimpan dengan baik, pratinjau media berfungsi normal.

### 16. T-292: Batch 16 - Refaktor & Modularisasi View Tentang Kami (About)
- **Deskripsi:** Refaktor dan modularisasi berkas `views/admin/about/index.ejs` (960 baris).
- **Target Pelanggaran:** 213 temuan (178 style, 5 hex, 0 script, 30 komentar).
- **Aksi Teknis:** Pecah template besar menjadi partials per tab pane dan per modal (`views/admin/about/partials/tab-sejarah.ejs`, `tab-visi-misi.ejs`, `tab-nilai.ejs`, `tab-sertifikasi.ejs`, `tab-galeri.ejs`, `modal-galeri.ejs`, `modal-statistik.ejs`, `modal-timeline.ejs`). Ekstraksi seluruh inline style ke `.adm-abt-*`. Hapus 30 komentar HTML.
- **Skill:** `antislop-code`
- **Acceptance Criteria:** `lint:views` 0 error/warning, pengelolaan linimasa, statistik, dan slide galeri fasilitas tentang kami berfungsi normal.

### 17. T-293: Batch 17 - Enforce 100% Strict Lint Views & QA Regresi Publik Menyeluruh
- **Deskripsi:** Perluasan konfigurasi `scripts/lint-views.js` hingga mencakup seluruh `views/admin/` dan `views/partials/admin-*` dalam `DEFAULT_STRICT_PATHS`.
- **Aksi Teknis:** Jalankan full check `npm run lint` dan `npm run lint:views`. Target pencapaian: **0 error dan 0 warning di seluruh views admin**. Lakukan uji regresi penuh pada halaman publik dan backend test suites.
- **Skill:** `antislop-code`
- **Acceptance Criteria:** Lint views hijau 100% pada ranah admin, tidak ada regresi visual pada halaman publik, laporan audit akhir siap.

---

## 8. Verifikasi Non-Regresi Halaman Publik

Meskipun cakupan refaktor ini 100% berada di ranah admin, untuk menjamin keamanan penuh pada pengalaman pengunjung publik:
1. **Audit Halaman Publik:** Setelah seluruh batch admin selesai, lakukan pengambilan tangkapan layar komparasi dan verifikasi DOM pada:
   - Halaman Beranda (`views/public/index.ejs` &rarr; `/`)
   - Halaman Tentang Kami (`views/public/about.ejs` &rarr; `/about`)
   - Halaman Katalog Produk (`views/public/products.ejs` &rarr; `/products`)
   - Halaman Kontak (`views/public/contact.ejs` &rarr; `/contact`)
2. **Uji Test Suite Publik:** Jalankan skrip test publik yang ada (`test-modul12-public.js` atau unit test terkait) untuk memastikan SSR, routing dwibahasa (ID/EN), meta tag SEO, dan floating WhatsApp button publik tidak terpengaruh sedikit pun.

---

## 9. Rencana Penutupan (CLOSE Plan)

Setelah seluruh task T-277 s/d T-293 tuntas:
1. **Pembaruan Stempel Verifikasi di `.agents/INDEX.md`:**
   - Modul `Admin CMS & Users`: perbarui verifikasi ke tanggal penyelesaian.
   - Modul `Admin UI, Buttons & Validation`: perbarui verifikasi.
   - Modul `Media Library`: perbarui verifikasi.
   - Modul `Site Settings`: perbarui verifikasi.
2. **Pembaruan Spesifikasi Teknis:**
   - Jika ada usulan token baru yang disetujui atau pengecualian pola baru, catat di `.agents/tech/conventions.md`.
3. **Pencatatan CHANGELOG:**
   - Tambahkan entri baru pada `.agents/CHANGELOG.md`:
     `YYYY-MM-DD | Refaktor massal view admin 16 modul, pembersihan total inline style, hex, inline script, dan komentar tak perlu sesuai tech/conventions.md | T-277..T-293`
4. **Pengarsipan Dokumen:**
   - Pindahkan berkas `changes/2026-11-03_refaktor-views-admin.md` ke `.agents/archive/2026-11-03_refaktor-views-admin.md`.

---

## 10. Keputusan Terkunci oleh Azis (TAHAP 2: APPROVED)

Berikut keputusan resmi Azis atas 3 pertanyaan wajib:

1. **Keputusan 1: Opsi B (Cakupan Diperluas ke CSS & JS Admin)**
   - Selain membersihkan view `.ejs`, refaktor pada batch terkait **sekaligus membersihkan komentar tak perlu dan kode hex lama** yang disentuh di dalam `public/css/admin.css` serta berkas `public/js/admin-*.js` yang bersangkutan.
   - Tetap mematuhi aturan: class bersama (`.form-card`, `.form-group`, dll.) tidak diubah, dan hex diganti ke token CSS yang sah.

2. **Keputusan 2: Opsi A (Status Semantik CSS Murni untuk Media Picker)**
   - Seluruh 15 kasus style dinamis yang mengendalikan visibilitas pratinjau media picker diubah menjadi **class status semantik** (seperti `.adm-d-none` / `.adm-d-block` atau status `.is-empty` / `.has-preview`) yang dikendalikan CSS murni, mengikuti pola percontohan `views/admin/settings/partials/visual-identity-card.ejs`.
   - Tidak ada inline style dinamis yang disisakan.

3. **Keputusan 3: Opsi B (Alur Eksekusi Berhenti per Batch & Penentuan Batch oleh Azis)**
   - Alur eksekusi **berhenti dan menunggu persetujuan manual Azis pada setiap pergantian batch**.
   - Penentuan mengenai berapa batch yang akan dikerjakan terlebih dahulu atau urutan batch pertama akan **ditentukan secara langsung oleh Azis**.


