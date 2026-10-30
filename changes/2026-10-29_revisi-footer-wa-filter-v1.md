# Proposal Perubahan: Revisi Footer, WhatsApp Rolling Persentase & Filter Hero Banner (v1)

**Tanggal Pengajuan:** 2026-10-29  
**Status Tahap:** TAHAP 3: MERGE KE SPEC (Task T-238 s/d T-244 Terdaftar di 3-TASKS.md, Menunggu Perintah Tahap 4: IMPLEMENT)  
**Dokumen Terdampak:** `prd/contact-footer.md`, `tech/contact-footer.md`, `prd/settings.md`, `tech/settings.md`  
**Penomoran Task Resmi:** `T-238` s/d `T-244` (Melanjutkan urutan aktif `3-TASKS.md`)  
**Skill Acuan:** `planning-and-task-breakdown`, `ponytail`, `impeccable`, `antislop-layoutmobile`, `security-and-hardening`  

---

## 1. Konteks

Penyempurnaan modul Pengaturan Situs, Kontak, dan Footer melalui fitur kendali visibilitas kartu alamat kantor dan pabrik, implementasi tombol WhatsApp multi-nomor rolling berbasis persentase distribusi, serta standardisasi filter/overlay hero banner sub-page agar jernih dan konsisten dengan slide gambar beranda.

---

## 2. Keputusan Terkunci Azis (Tahap 1 -> Tahap 2)

Seluruh 6 keputusan terbuka telah dijawab dan dikunci secara definitif oleh Azis pada 2026-10-29:

1. **Penyimpanan Multi-Nomor WA (Keputusan 1): Opsi A (Setting Key JSON Tunggal).**
   - Disimpan pada satu setting key baru `whatsapp_numbers_json` di tabel `settings`.
   - Menghindari pembuatan tabel relasional baru yang berlebihan (YAGNI), memanfaatkan caching bawaan memori aplikasi (`res.locals.settings`), dan konsisten dengan penyimpanan `global_cta_pages_json`.
2. **Pemilihan Nomor Rolling (Keputusan 2): Opsi A (Server-Side SSR).**
   - Pemilihan nomor dilakukan di sisi server saat template EJS dirender.
   - Menjamin keamanan privasi kontak: hanya nomor yang terpilih yang dirender ke atribut `href` HTML publik; daftar nomor lain beserta persentasenya tidak pernah terekspos di sumber kode (*source view*) browser publik. Tautan berfungsi instan tanpa bergantung pada eksekusi JavaScript klien.
3. **Kompatibilitas Pengaturan Lama WA (Keputusan 3): Opsi A (Fallback Transparan).**
   - Sistem membaca `whatsapp_numbers_json` terlebih dahulu. Jika JSON kosong, belum disetel, atau tidak valid, sistem secara otomatis dan transparan membaca setting tunggal legacy (`whatsapp_formatted_number` atau `whatsapp_number`). Menjamin nol downtime komunikasi prospek B2B.
4. **Label Nomor WA di Admin (Keputusan 4): Opsi A (Satu Label Internal Admin).**
   - Label nomor (misal "Sales Retail", "CS Industri") hanya berupa satu teks pengenal internal di CMS admin, tidak perlu dwibahasa, dan tidak ditampilkan pada antarmuka publik. Tooltip publik tetap menggunakan teks standar dwibahasa (*"Chat WhatsApp"* / *"Chat on WhatsApp"*).
5. **Cakupan Perubahan Filter/Overlay Hero (Keputusan 5): Opsi B (Semua Sub-Page Termasuk About).**
   - Standar filter overlay jernih mengacu Home Slide 2 diterapkan ke seluruh sub-page publik: **Products**, **News**, **Contact**, dan **About (Tentang Kami)**. Menjamin konsistensi visual identitas korporat di seluruh situs.
6. **UI Checkbox Show/Hide di Admin (Keputusan 6): Opsi B (Toggle Switch Kustom).**
   - Menggunakan komponen toggle switch kustom bergaya switch slider yang identik dengan toggle visibilitas media sosial yang sudah ada pada halaman Pengaturan Situs (`/admin/settings`).

---

## 3. Delta Spesifikasi Per Modul (Kondisi Lama -> Kondisi Baru)

### A. Modul PRD: Kontak, Footer & WhatsApp (`prd/contact-footer.md`)

#### [Delta FR-14] Halaman Kontak Publik & Formulir RFQ (`/contact`)
- **Kondisi Lama:**
  Dua kartu alamat fisik (*Head Office Jakarta* dan *Factory Bandung*) selalu dirender secara permanen di kolom kanan halaman kontak publik tanpa opsi kendali tampilan dari CMS admin.
- **Kondisi Baru:**
  Kartu *Head Office Jakarta* dan *Factory Bandung* dirender secara kondisional berdasarkan konfigurasi visibilitas `office_card_visible` dan `factory_card_visible`. Apabila salah satu kartu disembunyikan, kartu lainnya mengisi ruang dengan rapi. Apabila kedua kartu disembunyikan (`'0'`), area kontainer kartu tidak dirender sama sekali dan kolom kanan hanya menyajikan sematan Google Maps resmi secara presisi tanpa celah kosong (*empty wrapper*) atau pergeseran tata letak (*layout shift*).

#### [Delta FR-15] Floating Button WhatsApp & Pengaturan WA Global
- **Kondisi Lama:**
  Floating WhatsApp button hanya mengarah ke satu nomor statis tunggal (`whatsapp_number` / `whatsapp_formatted_number`).
- **Kondisi Baru:**
  Floating WhatsApp button mendukung sistem multi-nomor rolling dengan distribusi probabilitas berbobot (*weighted distribution*) berbasis persentase total 100% yang dieksekusi di sisi server (SSR). Pesan pembuka otomatis dwibahasa (`whatsapp_default_message` dan `whatsapp_default_message_en`) tetap tersinkronisasi utuh ke nomor mana pun yang terpilih secara acak. Apabila konfigurasi multi-nomor belum diisi, sistem secara otomatis fallback ke konfigurasi nomor tunggal legacy untuk menjamin *backward compatibility*.

#### [Fitur Baru] FR-24: Kendali Visibilitas Kartu Alamat Dual Lokasi di Publik
- Pengunjung situs hanya melihat kartu alamat fisik yang diaktifkan oleh Superadmin pada CMS Pengaturan Situs:
  1. `office_card_visible = '1'`: Merender kartu Head Office Jakarta pada footer (`views/partials/footer.ejs`) dan halaman kontak (`views/public/contact.ejs`).
  2. `factory_card_visible = '1'`: Merender kartu Factory Bandung pada footer dan halaman kontak.
- Di sisi footer, jika kedua kartu disembunyikan, kontainer pembungkus `.ft-offices` disembunyikan sepenuhnya sehingga kolom deskripsi perusahaan dan navigasi tautan footer tetap sejajar proporsional.

#### [Fitur Baru] FR-25: Distribusi Rolling Floating WhatsApp Multi-Nomor Berbasis Persentase (Server-Side)
- Sistem menyediakan kemampuan pembagian beban konversi prospek B2B ke beberapa nomor representative sales/CS secara proporsional.
- Setiap nomor memiliki bobot persentase integer (1-100%). Total akumulasi persentase seluruh nomor aktif wajib berjumlah tepat 100%.
- Pemilihan nomor dilakukan secara berbobot (*weighted random algorithm*) pada saat rendering server-side setiap kali halaman dimuat, menghasilkan URL direct chat resmi `https://wa.me/<nomor_terpilih>?text=<encoded_pesan_dwibahasa>`. Nomor lain tidak dibocorkan ke DOM publik.

#### [Fitur Baru] FR-26: Standardisasi Filter/Overlay Hero Banner Sub-Page Mengacu Slide Gambar Beranda
- Tampilan filter overlay gelap pekat pada hero banner sub-page (**Products**, **News**, **Contact**, dan **About**) diselaraskan secara visual dengan estetika hero banner beranda slide ke-2 (slide gambar pabrik).
- Gambar latar belakang fasilitas pabrik terlihat jernih dan nyata, aksen hijau brand (`var(--color-primary-dark)` / `var(--color-primary)`) berbaur secara lembut, dan seluruh teks judul, subjudul, serta remah roti (*breadcrumb*) memenuhi batas rasio kontras aksesibilitas WCAG AA (minimal 4.5:1 untuk teks normal dan 3.0:1 untuk teks tebal/besar).

---

### B. Modul Tech Spec: Kontak, Footer & WhatsApp (`tech/contact-footer.md`)

#### 1. Skema Kunci Pengaturan Baru di Tabel `settings`
- Penambahan kunci registri pengaturan:
  - `office_card_visible`: `'1'` (tampil, default) atau `'0'` (sembunyi).
  - `factory_card_visible`: `'1'` (tampil, default) atau `'0'` (sembunyi).
  - `whatsapp_numbers_json`: Teks JSON berisi array daftar nomor rolling, format:
    ```json
    [
      { "number": "6281234567890", "formatted": "6281234567890", "label": "Sales Retail", "percentage": 40 },
      { "number": "6289876543210", "formatted": "6289876543210", "label": "Sales Industri", "percentage": 60 }
    ]
    ```

#### 2. Logika Distribusi Berbobot di Sisi Server (Server-Side SSR Weighted Rolling)
- Saat me-render komponen `views/partials/whatsapp-btn.ejs`:
  1. Periksa `settings.whatsapp_numbers_json`. Jika valid dan berisi daftar nomor dengan total persentase 100%, jalankan algoritma seleksi di server:
     - Bangkitkan angka acak $R \in [1, 100]$.
     - Lakukan iterasi kumulatif terhadap array bobot persentase. Elemen pertama yang rentang kumulatifnya $\ge R$ dipilih sebagai nomor aktif tunggal.
     - Hanya nomor aktif ini yang dicetak ke tag `<a href="https://wa.me/...">`. Daftar nomor lain tidak disertakan di HTML.
  2. Fallback: Jika `whatsapp_numbers_json` kosong, korup, atau tidak berjumlah 100%, sistem menggunakan `settings.whatsapp_formatted_number` atau `settings.whatsapp_number`.

#### 3. Penyelarasan Desain Token & Isolasi Komponen CSS
- **Footer:** Kontainer `.ft-offices` menggunakan pembungkus bersih tanpa sisa margin/padding negatif saat kosong. Kartu `.ft-office-card` mempertahankan token warna `var(--surface-dark-deep)`, teks `var(--color-text-main)`, dan aksen status `var(--color-primary)`.
- **Kontak:** Kolom kanan `views/public/contact.ejs` merender `.cf-office-card` secara kondisional. Iframe peta `.cf-maps-wrap` tetap responsif tanpa distorsi aspek rasio.
- **Hero Banner Overlay Sub-Page (Products, News, Contact, About):**
  - Mengganti scrim gelap pekat solid pada `.page-hero-scrim` dengan gradasi terkalibrasi multi-stop mengikuti pola `.hero-slide-image .hero-grad`:
    - Top protection ramp: gradasi vertikal halus untuk keterbacaan navbar transparan (`linear-gradient(180deg, ...)`).
    - Reading zone ramp: gradasi diagonal 105 derajat dari area teks gelap berangsur ke aksen hijau emerald lembut (`var(--color-primary-dark)` transparan) dan transparansi jernih di sisi kanan sehingga foto mesin pabrik terekspos jelas.
    - Grounding ramp bawah: gradasi vertikal lembut tipis pada area dasar kontainer.
  - Bebas nilai hex mentah (*zero hardcoded hex*), seluruh tingkat opasitas dan warna merujuk ke token desain CSS.

---

### C. Modul PRD: Pengaturan Situs (`prd/settings.md`)

#### [Delta FR-22] Pengelolaan Pengaturan Global di CMS
- **Kelompok 2 (Kontak & Alamat Dual Lokasi Resmi):**
  - Ditambahkan kendali toggle switch kustom bergaya slider identik dengan toggle media sosial:
    - Toggle switch "Tampilkan Kartu Alamat Kantor Jakarta di Footer & Kontak".
    - Toggle switch "Tampilkan Kartu Alamat Pabrik Bandung di Footer & Kontak".
  - Status tersimpan langsung ke setting `office_card_visible` dan `factory_card_visible`.
- **Kelompok 4 (Pengaturan Layanan WhatsApp):**
  - Ditambahkan antarmuka pengelola multi-nomor dinamis (*Dynamic Repeater*) di samping pengaturan pesan default:
    - Input nomor WhatsApp (format internasional diawali `62` atau `08`).
    - Input label pengenal tunggal internal admin (misal "Sales Retail", "Hotline Industri").
    - Input persentase alokasi beban (integer 1-100).
    - Tombol tambah baris nomor dan hapus baris nomor.
    - Indikator live kalkulasi total persentase dengan peringatan visual jika total belum mencapai 100%.

---

### D. Modul Tech Spec: Pengaturan Situs (`tech/settings.md`)

#### 1. Registri Kunci Pengaturan Aktif (Registry Updates)
- Bagian B (Alamat & Kontak Dual Lokasi Resmi): Ditambahkan `office_card_visible` dan `factory_card_visible`.
- Bagian D (Layanan WhatsApp): Ditambahkan `whatsapp_numbers_json`. Kunci lama `whatsapp_number` dan `whatsapp_formatted_number` tetap dipertahankan sebagai fallback kompatibilitas.

#### 2. Penanganan Controller & Validasi Server-Side (`controllers/admin/settingController.js`)
- Parsing dan sanitasi field `office_card_visible` dan `factory_card_visible`: memastikan hanya bernilai `'1'` atau `'0'`.
- Parsing dan sanitasi data `whatsapp_numbers_json`:
  - Validasi struktur array dan keberadaan field wajib (`number`, `label`, `percentage`).
  - Normalisasi nomor: membersihkan karakter non-numerik, memvalidasi panjang digit (min 9, maks 16 karakter).
  - Sanitasi teks label internal: `trim()` dan pencegahan XSS.
  - Validasi matematis: total akumulasi seluruh bobot persentase wajib tepat 100. Jika total $\ne 100$, server melempar error validasi dan membatalkan transaksi update.
- Invalidation cache pengaturan aplikasi melalui `clearSettingsCache()`.

---

## 4. Rencana Task Implementasi Resmi (Mulai T-238)

---

### [T-238] [Database & Skema] Migrasi Skema Pengaturan Visibilitas Alamat, Registri WhatsApp JSON, dan Default Seed Overlay Opacity *(diperbarui sesuai jawaban Keputusan 1, 3, & 5)*
- **Deskripsi:** Membuat berkas migrasi SQL `database/migrations/011_revisi_footer_wa_filter_v1.sql` yang mendaftarkan default setting keys baru (`office_card_visible = '1'`, `factory_card_visible = '1'`, `whatsapp_numbers_json = '[]'`) ke tabel `settings`. Memperbarui nilai default seed kolom `overlay_opacity` pada tabel `page_hero_banners` untuk 4 halaman publik (`'about'`, `'products'`, `'news'`, `'contact'`) agar selaras dengan densitas overlay ringan beranda (nilai rekomendasi terkalibrasi: 0.35 - 0.40). Memastikan script migrasi idempotent menggunakan klausa `INSERT IGNORE` atau `ON DUPLICATE KEY UPDATE` tanpa mengubah data live produksi di luar default baru.
- **Acceptance Criteria:**
  - File migrasi `011_revisi_footer_wa_filter_v1.sql` berhasil dieksekusi tanpa error syntax.
  - Setting keys `office_card_visible` dan `factory_card_visible` tercatat dengan nilai default `'1'`.
  - Setting key `whatsapp_numbers_json` terdaftar sebagai string JSON valid di tabel `settings`.
  - Seed default `overlay_opacity` pada `page_hero_banners` untuk 4 halaman (`about`, `products`, `news`, `contact`) terdefinisi pada nilai terkalibrasi ringan (0.35 - 0.40).
- **File Terdampak:** `database/migrations/011_revisi_footer_wa_filter_v1.sql`.
- **Skill:** `ponytail`.
- **Verifikasi:** Eksekusi migrasi di lingkungan database, query tabel `settings` dan `page_hero_banners` untuk memastikan data terdaftar presisi.

---

### [T-239] [Backend & Validasi] Implementasi Controller Admin CMS Settings & Validasi Ketat Server-Side *(diperbarui sesuai jawaban Keputusan 1, 3, 4, & 6)*
- **Deskripsi:** Memperbarui `controllers/admin/settingController.js` pada method `update()` untuk menangani penyimpanan `office_card_visible`, `factory_card_visible`, dan `whatsapp_numbers_json`. Menerapkan validasi ketat server-side: memastikan toggle switch visibilitas hanya bernilai `'1'` atau `'0'`, melakukan parsing JSON data multi-nomor WhatsApp (validasi format nomor numerik `/^[0-9+]{9,16}$/`, sanitasi teks label internal maksimal 50 karakter tanpa multi-bahasa, serta persentase integer 1-100), dan validasi matematis wajib: total persentase seluruh nomor aktif harus tepat berjumlah 100%. Melempar error informatif jika persentase kurang atau lebih dari 100%. Mempertahankan fallback transparan ke `whatsapp_number` lama jika data JSON kosong. Mengosongkan cache memory via `clearSettingsCache()`.
- **Acceptance Criteria:**
  - Nilai toggle switch `office_card_visible` dan `factory_card_visible` tersimpan akurat ke database saat disubmit dari form admin.
  - Data multi-nomor WhatsApp tervalidasi dengan aman; submisi dengan total persentase $\ne 100\%$ otomatis ditolak oleh server dengan pesan error yang ramah.
  - Submisi dengan nomor kosong atau karakter ilegal otomatis ditolak.
  - Proteksi CSRF, sanitasi input, dan cache invalidation bekerja sempurna.
- **File Terdampak:** `controllers/admin/settingController.js`.
- **Skill:** `security-and-hardening`, `ponytail`.
- **Verifikasi:** Uji pengiriman data via form admin dengan skenario: total persentase 90% (wajib gagal), 110% (wajib gagal), tepat 100% (berhasil), dan karakter nomor tidak valid (wajib gagal).

---

### [T-240] [Admin UI & UX] Implementasi Formulir Pengaturan Show/Hide Alamat & Dynamic Repeater WhatsApp Multi-Nomor *(diperbarui sesuai jawaban Keputusan 1, 4, & 6)*
- **Deskripsi:** Memperbarui tampilan CMS admin `views/admin/settings/index.ejs`. Di kelompok "Kontak & Alamat Dual Lokasi Resmi", tambahkan toggle switch kustom (slider switch) untuk Kartu Kantor Jakarta dan Kartu Pabrik Bandung dengan styling berbasis token yang identik dengan toggle media sosial yang ada. Di kelompok "Pengaturan Layanan WhatsApp", tambahkan komponen interaktif dinamis (*Dynamic Repeater*) untuk menambah, mengedit, dan menghapus baris nomor WhatsApp (kolom: Nomor Telepon, Label Internal Admin, Persentase Bobot %). Sediakan kalkulator akumulasi persentase *real-time* berbasis vanilla JS murni (kompatibel CSP tanpa inline onclick), badge status berwarna hijau jika total = 100% dan merah/kuning jika total $\ne 100\%$, serta pencegahan submit sisi klien jika persentase belum seimbang.
- **Acceptance Criteria:**
  - Tampilan toggle switch show/hide alamat rapi, mudah dipahami, konsisten dengan gaya toggle media sosial, dan responsif dari ponsel hingga desktop.
  - Admin dapat menambah baris nomor baru, menghapus baris nomor yang ada, serta mengedit nilai nomor, label internal, dan persentase.
  - Indikator total persentase berubah secara *real-time* saat pengguna mengetik angka persentase.
  - Bebas dari atribut inline JavaScript (`onclick`, `onchange`) untuk menjamin kepatuhan penuh terhadap Content Security Policy (CSP).
  - Menggunakan token desain admin yang konsisten tanpa warna hex mentah.
- **File Terdampak:** `views/admin/settings/index.ejs`, `public/js/admin-settings.js` (atau modul JS admin terkait).
- **Skill:** `frontend-ui-engineering`, `impeccable`.
- **Verifikasi:** Uji interaksi penambahan, penghapusan, dan pengetikan baris nomor pada browser desktop dan mobile; verifikasi konsol browser bersih dari peringatan CSP.

---

### [T-241] [Publik UI & Layout] Implementasi Logika Show/Hide Kartu Alamat di Footer Global dan Halaman Kontak *(diperbarui sesuai jawaban Keputusan 6)*
- **Deskripsi:** Memperbarui `views/partials/footer.ejs` dan `views/public/contact.ejs` untuk memeriksa status `office_card_visible` dan `factory_card_visible`. Di footer, bungkus masing-masing kartu `.ft-office-card` dengan kondisi if. Jika kedua kartu dinonaktifkan (`'0'`), kontainer pembungkus `.ft-offices` tidak dirender ke DOM untuk mencegah celah kosong atau pergeseran tata letak. Di halaman `/contact`, render kartu Jakarta dan Bandung secara kondisional di kolom kanan; jika kedua kartu dinonaktifkan, sematan Google Maps `.cf-maps-wrap` tetap tampil elegan dan menempati kolom dengan proporsional tanpa kekosongan visual yang janggal.
- **Acceptance Criteria:**
  - Saat `office_card_visible = '0'`, kartu Jakarta hilang dari footer dan halaman kontak.
  - Saat `factory_card_visible = '0'`, kartu Bandung hilang dari footer dan halaman kontak.
  - Saat kedua kartu disembunyikan, tidak ada elemen pembungkus kosong (*ghost container*) atau celah margin/padding aneh di footer maupun kontak.
  - Tidak ada layout shift (CLS tetap aman) pada resolusi 320px, 768px, 1024px, hingga 1440px dalam mode Bahasa Indonesia maupun Bahasa Inggris.
- **File Terdampak:** `views/partials/footer.ejs`, `views/public/contact.ejs`, `public/css/components.css`.
- **Skill:** `antislop-layoutmobile`, `impeccable`.
- **Verifikasi:** Ubah pengaturan toggle di admin menjadi (1, 1), (1, 0), (0, 1), dan (0, 0); periksa tampilan footer dan halaman kontak di browser pada setiap kombinasi konfigurasi.

---

### [T-242] [Publik Interaksi & Algoritma] Implementasi Server-Side Weighted Rolling WhatsApp Multi-Nomor *(diperbarui sesuai jawaban Keputusan 1, 2, 3, & 4)*
- **Deskripsi:** Memperbarui komponen `views/partials/whatsapp-btn.ejs` untuk menerapkan pemilihan nomor berbobot (*weighted random rolling*) berbasis data `whatsapp_numbers_json` langsung di sisi server (SSR). Saat halaman dimuat, server membangkitkan angka acak 1-100 dan memilih 1 nomor yang sesuai dengan distribusi kumulatif persentase. Tautan direct chat dibentuk menggunakan format resmi `https://wa.me/<nomor_terpilih>?text=<pesan_dwibahasa_terenkripsi>`. Hanya nomor yang terpilih yang dirender ke atribut `href` HTML; nomor lain tidak dibocorkan ke DOM browser. Tetap mempertahankan pesan pembuka resmi yang sudah ada (`whatsapp_default_message` / `_en`). Tooltip publik tetap menggunakan teks standar (*"Chat WhatsApp"* / *"Chat on WhatsApp"*). Jika data multi-nomor belum tersedia, sistem transparan melakukan fallback ke nomor tunggal `whatsapp_formatted_number` atau `whatsapp_number`.
- **Acceptance Criteria:**
  - Tombol floating WhatsApp di seluruh halaman publik mengarah ke nomor yang dipilih secara berbobot sesuai distribusi persentase di sisi server.
  - Tidak ada daftar nomor lain yang terekspos di markup HTML publik (*source view*).
  - Dalam sampel pengujian muat ulang halaman berulang, frekuensi kemunculan nomor mendekati rasio persentase yang ditentukan (misal 40% vs 60%).
  - Pesan pembuka otomatis dwibahasa (ID/EN) tetap terpasang dengan enkripsi URI yang benar di seluruh nomor rolling.
  - Fallback ke nomor lama bekerja 100% jika pengaturan multi-nomor dikosongkan.
  - Desain, animasi hover, posisi fixed, dan aksesibilitas keyboard tombol floating WA tetap utuh.
- **File Terdampak:** `views/partials/whatsapp-btn.ejs`.
- **Skill:** `ponytail`, `frontend-ui-engineering`.
- **Verifikasi:** Lakukan pengujian simulasi permintaan berulang (misal 50-100 reload) untuk memverifikasi distribusi probabilitas kedua nomor, serta inspeksi elemen DOM untuk memastikan hanya 1 nomor aktif yang ada di markup HTML.

---

### [T-243] [Desain & Visual Tokens] Penyelarasan Filter / Overlay Hero Banner Sub-Page Menyerupai Home Slide 2 Termasuk About *(diperbarui sesuai jawaban Keputusan 5)*
- **Deskripsi:** Memperbarui aturan CSS overlay hero banner sub-page pada `public/css/components.css` (`.page-hero-scrim`) dan seluruh template sub-page view terkait (**`views/public/products.ejs`**, **`views/public/news.ejs`**, **`views/public/contact.ejs`**, dan **`views/public/about.ejs`**). Menghapus gradasi solid hitam pekat yang menutupi gambar latar belakang dan menggantinya dengan layered directional gradient transparan yang mengadopsi estetika `.hero-slide-image .hero-grad` pada beranda:
  1. Gradasi atas (top ramp) halus untuk perlindungan kontras bilah navigasi.
  2. Gradasi diagonal 105 derajat berbasis token `var(--color-primary-dark)` dan `var(--color-primary)` dengan opasitas seimbang yang mempertahankan keterbacaan teks putih di sisi kiri, sekaligus mengekspos kejernihan foto mesin pabrik di sisi tengah dan kanan.
  3. Gradasi dasar (bottom grounding) tipis dan halus.
  Memastikan nilai perhitungan variabel `--hero-scrim-mid` dan `--hero-scrim-edge` terkalibrasi ringan dan seluruh teks judul, subjudul, dan remah roti memenuhi standar kontras WCAG AA (minimal 4.5:1).
- **Acceptance Criteria:**
  - Hero banner pada halaman Products, News, Contact, dan About memiliki tampilan visual yang jernih, foto pabrik terekspos jelas dan elegan menyerupai referensi gambar slide ke-2 beranda.
  - Aksen hijau korporat Euodoo tetap terasa kuat dan berpadu harmonis dengan gambar latar belakang.
  - Seluruh teks putih pada hero banner di ke-4 halaman terbukti lulus rasio kontras WCAG AA terhadap latar belakang.
  - Tidak mengubah kode atau visual pada homepage yang telah dibekukan.
- **File Terdampak:** `public/css/components.css`, `views/public/products.ejs`, `views/public/news.ejs`, `views/public/contact.ejs`, `views/public/about.ejs`.
- **Skill:** `impeccable`.
- **Verifikasi:** Inspeksi visual perbandingan berdampingan (*side-by-side*) antara home slide 2 dengan hero banner ke-4 sub-page di browser desktop dan ponsel; jalankan uji audit kontras WCAG.

---

### [T-244] [QA & Audit Aksesibilitas] Verifikasi Regresi Menyeluruh, Audit Kontras WCAG AA, & Validasi Lintas Perangkat *(diperbarui sesuai jawaban Keputusan 1 s/d 6)*
- **Deskripsi:** Melakukan pengujian regresi komprehensif pada seluruh alur fitur yang terdampak: pengujian toggle switch show/hide alamat di admin dan dampaknya pada footer serta kontak, pengujian penambahan/penghapusan/validasi 100% multi-nomor WA di admin, pengujian distribusi rolling WA server-side di sisi publik, serta verifikasi tampilan visual hero banner pada 4 sub-page (Products, News, Contact, About). Memastikan pengujian mencakup resolusi ponsel 320px, tablet 768px, laptop 1024px, dan desktop 1440px dalam mode Bahasa Indonesia (`id`) dan Bahasa Inggris (`en`). Memastikan nol error di konsol browser, tidak ada kebocoran gaya, dan fungsi formulir RFQ kontak serta tombol CTA lainnya tetap beroperasi 100% normal.
- **Acceptance Criteria:**
  - Seluruh skenario pengujian fungsional dan visual lulus tanpa cacat.
  - Teks hero banner pada seluruh 4 sub-page memenuhi rasio kontras WCAG AA.
  - Tidak ada error JavaScript atau peringatan CSP di konsol browser.
  - Tampilan responsif mulus dari 320px hingga desktop tanpa horizontal scrollbar yang tidak diinginkan.
  - Mode dwibahasa ID dan EN tersaji dengan translasi yang lengkap dan tepat.
- **File Terdampak:** Seluruh file yang diubah pada T-238 s/d T-243.
- **Skill:** `test-engineer`, `code-review-and-quality`.
- **Verifikasi:** Laporan checklist verifikasi lintas viewport dan bahasa disertakan lengkap sebelum pengajuan penutupan task.

---

## 5. Dampak Ukuran Modul Spesifikasi

Berdasarkan aturan batas ukuran berkas modul (~8 KB per berkas) pada `.agents/WORKFLOW.md`, berikut adalah audit ukuran berkas spesifikasi saat ini dan estimasi pasca-merge delta:

| Berkas Modul Spek | Ukuran Saat Ini | Estimasi Tambahan Delta | Estimasi Pasca-Merge | Status Ambang Batas (~8 KB) | Rekomendasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `prd/contact-footer.md` | 3.96 KB | +1.30 KB | ~5.26 KB | **AMAN** (Di bawah 8 KB) | Pertahankan modul tunggal utuh |
| `tech/contact-footer.md` | 4.59 KB | +1.50 KB | ~6.09 KB | **AMAN** (Di bawah 8 KB) | Pertahankan modul tunggal utuh |
| `prd/settings.md` | 3.03 KB | +1.10 KB | ~4.13 KB | **AMAN** (Di bawah 8 KB) | Pertahankan modul tunggal utuh |
| `tech/settings.md` | 3.40 KB | +1.30 KB | ~4.70 KB | **AMAN** (Di bawah 8 KB) | Pertahankan modul tunggal utuh |

**Kesimpulan:** Seluruh berkas spesifikasi berada dalam rentang aman (maksimal ~6.09 KB dari ambang batas 8 KB). Tidak diperlukan pemecahan sub-modul baru pada revisi ini.

---

## 6. Rencana Tahap CLOSE (Sesi Implementasi)

Setelah seluruh task T-238 s/d T-244 tuntas diimplementasikan dan diverifikasi oleh Azis:

1. **Pembaruan Tanggal Verifikasi Modul:**
   - `prd/contact-footer.md` diperbarui stempel tanggalnya menjadi `2026-10-29`.
   - `tech/contact-footer.md` diperbarui stempel tanggalnya menjadi `2026-10-29`.
   - `prd/settings.md` diperbarui stempel tanggalnya menjadi `2026-10-29`.
   - `tech/settings.md` diperbarui stempel tanggalnya menjadi `2026-10-29`.
   - Kolom verifikasi baris `Contact, Footer & WA` dan `Site Settings` pada `.agents/INDEX.md` diperbarui menjadi `2026-10-29`.
2. **Penghapusan Penanda Pending:**
   - Seluruh tag `[PENDING T-238 s/d T-244]` pada modul `prd/` dan `tech/` dihapus bersih.
3. **Arsip Berkas Perubahan:**
   - Memindahkan berkas proposal ini dari `changes/2026-10-29_revisi-footer-wa-filter-v1.md` ke `.agents/archive/2026-10-29_revisi-footer-wa-filter-v1.md`.
4. **Pembaruan Task Tracker:**
   - Memindahkan daftar task selesai T-238 s/d T-244 dari `.agents/3-TASKS.md` ke `.agents/archive/tasks-index-full.md`.
5. **Pencatatan Riwayat CHANGELOG.md:**
   - Menambahkan 1 baris entri ringkas resmi pada `.agents/CHANGELOG.md`:
     `2026-10-29 | Fitur show/hide alamat dual lokasi, floating WA multi-nomor rolling persentase, dan penyelarasan overlay hero sub-page | T-238-T-244`
