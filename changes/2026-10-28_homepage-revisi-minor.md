# Proposal: Revisi Minor Beranda Publik (Homepage) PT Euodoo

**Tanggal Pengajuan:** 2026-10-28  
**Inisiator:** Agent (berdasarkan arahan Azis)  
**Status:** FINALIZED PROPOSAL (Keputusan Disetujui Azis pada 2026-10-28, Siap Eksekusi)  
**Target Modul:** `prd/public-home.md`, `tech/public-home.md`  

---

## 1. Konteks

Penyempurnaan minor pada beranda publik PT Euodoo untuk merapikan hierarki spasi header Produk Unggulan, mengeliminasi duplikasi navigasi katalog, menghaluskan batas latar seksi Why Choose Us tanpa tepi keras, serta mengoptimalkan komposisi visual dan keterbacaan icon pada viewport mobile (320px–768px) tanpa mengubah desktop.

---

## 2. Delta Spesifikasi per Modul (Hanya Modul `public-home`)

> **Catatan:** Nilai warna tidak menggunakan kode hex literal melainkan merujuk token desain resmi (`tokens.css`) sesuai pedoman arsitektur PT Euodoo.

### A. Modul PRD (`prd/public-home.md`)

#### 1. Seksi 4 Panel Kategori Manufaktur Primer (`.sec-products`, `.hcat-*`)
- **Kondisi Lama:**
  - Header seksi memuat judul dan deskripsi yang letaknya saling menempel rapat, disertai tombol sekunder di pojok kanan atas (*"Lihat Seluruh Katalog →"*), menduplikasi tombol utama *"Jelajahi Seluruh Katalog Produk →"* di bagian bawah grid.
- **Kondisi Baru (Pilihan Azis: Opsi A):**
  - Header seksi menampilkan judul dan deskripsi dengan pemisahan spasi vertikal proporsional (*breathing space*) antara `.prod-title` dan `.prod-subtitle`.
  - Tombol kanan dieliminasi sepenuhnya untuk menghindari redundansi CTA. Navigasi menuju katalog produk dipusatkan secara tunggal pada tombol bawah seksi (*"Jelajahi Seluruh Katalog Produk →"*).

#### 2. Seksi Why Choose Us (`.sec-why-us`, `.wcu-*`)
- **Kondisi Lama:**
  - Di semua resolusi layar (desktop dan mobile), kartu visual memuat *floating card* berlabel *"Better by design."* dan chip label *"MATERIAL · ALAM · MASA DEPAN"*. Pada viewport mobile, elemen ini menumpuk di atas ilustrasi botani utama dan menutupi sebagian besar grafis daun.
- **Kondisi Baru (Pilihan Azis: Opsi C):**
  - Khusus pada viewport mobile (`< 768px`), elemen *floating card* ditiadakan (`display: none;`) dan chip label *"MATERIAL · ALAM · MASA DEPAN"* (`.wcu-art-label`) dihapus/disembunyikan dari kartu visual mobile sehingga canvas ilustrasi daun botani SVG tampil 100% bersih dan utuh tanpa elemen penutup apa pun.
  - Tampilan desktop Why Choose Us dibekukan (tetap mempertahankan floating card, chip label, dan animasi floating).

#### 3. Transisi Latar Belakang Antar-Seksi (Estetika & Token Latar)
- **Kondisi Lama:**
  - Batas antar-seksi Produk Unggulan (`var(--bg-subtle)`), Why Choose Us (gradasi hijau botani), dan Sertifikasi (`var(--bg-subtle)`) memiliki batas tegas (*hard edge*) karena pseudo-elemen pembatas saat ini memudar ke warna putih dasar (`var(--bg-base)`), bukan ke warna seksi tetangganya.
- **Kondisi Baru (Pilihan Azis: Opsi B):**
  - Transisi halus diterapkan pada kedua batas seksi Why Choose Us:
    1. Batas atas: peralihan dari abu-muda (`var(--bg-subtle)`) menuju rona hijau atas Why Choose Us.
    2. Batas bawah: peralihan dari rona hijau bawah Why Choose Us kembali ke abu-muda (`var(--bg-subtle)`).
  - Keduanya menggunakan gradasi lembut berbasis token semantik baru tanpa tepi patah atau garis batas kaku.

#### 4. Seksi Strip Marquee Merek Terdaftar (`.brand-strip-*`)
- **Kondisi Lama:**
  - Logo merek pada mobile dibatasi `height: clamp(56px, 11vw, 75px)` dengan kontainer `110px`, sehingga logo seperti *"PB"* dan *"ANUGERAH MULIA"* tampak kecil di tengah ruang kosong yang lebar.
- **Kondisi Baru (Pilihan Azis: Opsi B):**
  - Ukuran tampilan logo pada viewport mobile diperbesar sedikit secara proporsional (`height: clamp(70px, 13vw, 88px)`) agar detail logo dan nama merek terbaca jelas sesuai referensi gambar yang dilampirkan, dengan target sentuh aman dan bebas overflow horizontal pada lebar minimum 320px.

---

### B. Modul Tech Spec (`tech/public-home.md`)

#### 1. Komponen Header Produk Unggulan (`.prod-header`, `.prod-title`, `.prod-subtitle`)
- **Kondisi Lama:**
  - `.prod-header` memiliki tata letak flex horizontal dengan tombol `<a class="btn btn-primary">` di sisi kanan.
  - `.prod-title` memiliki `margin: 0;` dan `.prod-subtitle` memiliki `margin: 0;`, menyebabkan teks menempel tanpa pemisah.
- **Kondisi Baru:**
  - Markup tombol `<a href="/products" class="btn btn-primary">` dihapus dari `.prod-header` di `views/public/index.ejs`.
  - `.prod-title` diberikan margin bawah adaptif menggunakan token spasi `--space-sm` (8px) hingga `--space-md` (16px) untuk keterbacaan optimal di desktop dan mobile.
  - CSS rule yang menjadi tidak terpakai terkait tombol header dibersihkan secara rapi.

#### 2. Komponen Why Choose Us Mobile (`.wcu-float-card`, `.wcu-art-label`, `.wcu-artbox`, `.wcu-art`)
- **Kondisi Lama:**
  - `.wcu-float-card` dirender dengan posisi absolut di atas `.wcu-artbox` pada seluruh ukuran layar.
  - `.wcu-art-label` selalu tampil absolut di pojok kiri atas canvas.
- **Kondisi Baru:**
  - Pada media query mobile (`@media (max-width: 768px)`):
    - `.wcu-float-card { display: none; }`
    - `.wcu-art-label { display: none; }` (sesuai Opsi C)
  - Ilustrasi SVG daun (`.wcu-art`) diposisikan terpusat rapi di dalam `.wcu-artbox` tanpa elemen yang menutupi grafis daun.

#### 3. Token & Transisi Gradasi (`tokens.css`, `components.css`)
- **Kondisi Lama:**
  - `.sec-products::after` dan `.sec-evidence::before` menggunakan gradasi keras berbasis `#ffffff`.
- **Kondisi Baru:**
  - Menambahkan token turunan transisi semantik pada `tokens.css`:
    - `--trans-subtle-to-wcu`: gradasi linier dari `var(--bg-subtle)` ke rona hijau atas seksi Why Choose Us.
    - `--trans-wcu-to-subtle`: gradasi linier dari rona hijau bawah seksi Why Choose Us ke `var(--bg-subtle)`.
  - Menggantikan deklarasi gradasi lokal pada `.sec-products::after` dan batas seksi Why Choose Us menggunakan token transisi tersebut.

#### 4. Keterbacaan Logo Marquee Mobile (`.brand-strip-logo`, `.brand-strip-item`)
- **Kondisi Lama:**
  - Media query `@media (max-width: 767.98px)` menetapkan `.brand-strip-logo { height: clamp(56px, 11vw, 75px); max-width: 140px; }` dan `.brand-strip-item { min-width: 110px; }`.
- **Kondisi Baru:**
  - Ditingkatkan ke ukuran proporsional:
    - `.brand-strip-logo { height: clamp(70px, 13vw, 88px); max-width: 170px; }`
    - `.brand-strip-item { min-width: clamp(130px, 20vw, 160px); }`
  - Memastikan padding pelindung tetap aman dan tidak memicu overflow horizontal pada layar sempit 320px.

---

## 3. Keputusan Terbuka (Hasil Konfirmasi Azis pada 2026-10-28)

Semua keputusan terbuka telah ditetapkan secara resmi oleh Azis:

1. **Pertanyaan 1 (Spasi Judul Header Produk Unggulan):**  
   - **Pilihan Azis:** **Opsi A** (Jarak antara judul `.prod-title` dan deskripsi `.prod-subtitle` diperbesar menggunakan token spasi).
2. **Pertanyaan 2 (Lingkup Batas Gradasi Background):**  
   - **Pilihan Azis:** **Opsi B** (Diterapkan di kedua batas: batas atas abu-muda &rarr; hijau dan batas bawah hijau &rarr; abu-muda).
3. **Pertanyaan 3 (Perlakuan Chip Label Why Choose Us Mobile):**  
   - **Pilihan Azis:** **Opsi C** (Chip label *"MATERIAL · ALAM · MASA DEPAN"* dihapus/disembunyikan khusus di mobile agar area ilustrasi SVG daun botani 100% bersih).
4. **Pertanyaan 4 (Ukuran Icon/Logo di Mobile):**  
   - **Pilihan Azis:** **Opsi B** (Logo di marquee Merek Paten Terdaftar agak dibesarkan sedikit agar lebih jelas, merujuk tangkapan layar referensi).

---

## 4. Rencana Task Implementasi (Mulai Nomor Aktif T-233)

Penomoran task melanjutkan status aktif dari `.agents/3-TASKS.md` (terakhir T-232 selesai).

```
T-233 (Header Produk) ──┐
T-234 (Gradasi Latar) ──┼──> T-237 (Verifikasi Lintas Viewport, i18n & Regresi)
T-235 (WCU Mobile)   ──┤
T-236 (Logo Marquee) ──┘
```

---

### Task T-233: Penyesuaian Spasi Header & Eliminasi Tombol Redundan Produk Unggulan
- **Deskripsi:** Merapikan tata letak `.prod-header` pada seksi Produk Unggulan Manufaktur dengan memberikan margin pemisah vertikal proporsional antara judul `.prod-title` dan subjudul `.prod-subtitle` (Opsi A), serta menghapus tombol kanan *"Lihat Seluruh Katalog →"* dari markup dan CSS terkait karena navigasi utama katalog telah diakomodasi tombol bawah.
- **Acceptance Criteria:**
  - [ ] Jarak antara `.prod-title` dan `.prod-subtitle` bertambah proporsional (menggunakan token spasi `--space-sm`/`--space-md`, tanpa teks menempel) di resolusi desktop dan mobile.
  - [ ] Markup tombol kanan `<a href="/products" class="btn btn-primary">` di dalam `.prod-header` dihapus bersih dari `views/public/index.ejs`.
  - [ ] Tombol bawah *"Jelajahi Seluruh Katalog Produk →"* (`.btn-see-more`) tetap utuh dan berfungsi normal mengarahkan ke `/products`.
  - [ ] Struktur `.prod-header` tetap rapi, seimbang, dan tidak menghasilkan pergeseran layout (*layout shift*).
- **File Terdampak:**
  - `views/public/index.ejs`
  - `public/css/components.css`
- **Skill:** `polish`
- **Verifikasi:**
  - Inspeksi visual desktop dan mobile (`320px`, `375px`, `768px`, `1024px`, `1440px`).
  - Uji klik tombol bawah menuju `/products`.

---

### Task T-234: Penerapan Token Transisi Gradasi Halus Latar Seksi Why Choose Us
- **Deskripsi:** Mengganti batas latar belakang kaku (*hard edge*) pada peralihan seksi Produk Unggulan (`var(--bg-subtle)`), seksi Why Choose Us (hijau lembut), dan seksi Sertifikasi (`var(--bg-subtle)`) dengan transisi gradasi halus di kedua batas (Opsi B) berbasis token semantik baru tanpa nilai hex keras di CSS komponen.
- **Acceptance Criteria:**
  - [ ] Token gradasi semantik terdaftar resmi di `public/css/tokens.css`: `--trans-subtle-to-wcu` dan `--trans-wcu-to-subtle`.
  - [ ] Pseudo-elemen pemisah di atas seksi Why Choose Us menyatu mulus tanpa garis putih atau tepi patah.
  - [ ] Pseudo-elemen pemisah di bawah seksi Why Choose Us (menuju seksi Sertifikasi) menyatu mulus tanpa patahan visual.
  - [ ] Tidak ada nilai hex baru yang di-hardcode langsung pada berkas komponen CSS.
- **File Terdampak:**
  - `public/css/tokens.css`
  - `public/css/components.css`
- **Skill:** `polish`
- **Verifikasi:**
  - Inspeksi kontras dan kehalusan gradasi di resolusi 1440px dan 375px.
  - Pemeriksaan kompatibilitas tema tanpa deviasi palet warna hijau/abu-muda.

---

### Task T-235: Optimasi Layout Visual Why Choose Us Mobile, Pelepasan Floating Card & Chip
- **Deskripsi:** Merestrukturisasi tampilan kolom visual `.wcu-artbox` pada seksi Why Choose Us khusus untuk viewport mobile (`< 768px`) dengan menyembunyikan *floating card* *"Better by design."* dan menyembunyikan chip label *"MATERIAL · ALAM · MASA DEPAN"* (Opsi C), sehingga ilustrasi daun botani SVG tampil 100% bersih, terpusat, dan utuh tanpa elemen yang menutupi.
- **Acceptance Criteria:**
  - [ ] Elemen `.wcu-float-card` tidak tampil di viewport mobile (`< 768px`).
  - [ ] Elemen `.wcu-art-label` tidak tampil di viewport mobile (`< 768px`).
  - [ ] Tampilan desktop Why Choose Us tetap 100% identik dengan kondisi saat ini (floating card, chip label, dan animasi tetap aktif di desktop).
  - [ ] Ilustrasi daun botani (`.wcu-art`) pada mobile tampil utuh, berada di tengah visual box, dan tidak terpotong tepi canvas.
- **File Terdampak:**
  - `public/css/components.css`
  - `views/public/index.ejs`
- **Skill:** `adapt`
- **Verifikasi:**
  - Uji tampilan pada viewport 320px, 375px, 480px, dan 768px memastikan grafis daun tampak 100% utuh tanpa penutup.
  - Pastikan tampilan desktop 1024px dan 1440px tidak mengalami regresi sama sekali.

---

### Task T-236: Penskalaan Ukuran Logo Marquee Merek pada Viewport Mobile
- **Deskripsi:** Memperbesar ukuran logo merek pada marquee strip Merek Paten Terdaftar khusus pada viewport mobile (Opsi B) agar detail grafis dan nama merek (misal "PB", "ANUGERAH MULIA") tampil jelas dan terbaca sesuai referensi visual, dengan target sentuh aman dan bebas overflow horizontal pada 320px.
- **Acceptance Criteria:**
  - [ ] Logo pada marquee strip merek terdaftar (`.brand-strip-logo`) memiliki dimensi lebih jelas di mobile (`height: clamp(70px, 13vw, 88px)` dan `min-width: clamp(130px, 20vw, 160px)`).
  - [ ] Logo tidak pecah/buram dan tidak menabrak batas padding marquee.
  - [ ] Tidak terjadi *horizontal scroll leak* pada seluruh lebar viewport mobile mulai 320px.
- **File Terdampak:**
  - `public/css/components.css`
- **Skill:** `adapt`
- **Verifikasi:**
  - Pengujian marquee dan horizontal scroll pada resolusi 320px.
  - Verifikasi ketajaman visual logo pada layar mobile.

---

### Task T-237: Verifikasi Lintas Viewport, Validasi Dwibahasa (ID & EN), dan Uji Regresi
- **Deskripsi:** Melakukan pengujian holistik dan regresi visual pada seluruh halaman beranda dari resolusi 320px hingga 1440px dalam Bahasa Indonesia (`id`) dan Bahasa Inggris (`en`), memastikan tidak ada error console JavaScript dan tidak merusak seksi beranda lainnya.
- **Acceptance Criteria:**
  - [ ] Tampilan beranda terverifikasi rapi pada resolusi 320px, 375px, 480px, 768px, 1024px, dan 1440px.
  - [ ] Switch bahasa `id` dan `en` berfungsi mulus tanpa ada teks yang hilang atau key mati.
  - [ ] Tidak ada error console baru pada browser runtime.
  - [ ] Seluruh seksi di luar target perubahan (Hero, Intro, Certifications, News, Footer) tetap utuh dan beku.
- **File Terdampak:**
  - Seluruh berkas yang disentuh pada T-233 s/d T-236.
- **Skill:** `polish`, `adapt`
- **Verifikasi:**
  - Click-through verification untuk link produk, modal preview merek, dan formulir.
  - Inspeksi console log bebas dari pesan error CSP/JavaScript.

---

## 5. Dampak Ukuran Modul Spesifikasi

- **Ukuran Saat Ini:**
  - `prd/public-home.md`: ~3.5 KB (74 baris)
  - `tech/public-home.md`: ~3.8 KB (76 baris)
- **Estimasi Penambahan:**
  - Penambahan teks delta spesifikasi pada masing-masing berkas diperkirakan sekitar ~1.0 KB.
- **Evaluasi Batas 8KB:**
  - Total ukuran masing-masing modul setelah di-merge diperkirakan tetap berada di kisaran ~4.5 KB – ~4.8 KB, berada jauh di bawah batas maksimum dokumen modular (~8 KB).
- **Kesimpulan:** **Tidak diperlukan pemecahan sub-modul baru.** Modul tetap dipertahankan tunggal.

---

## 6. Rencana Penutupan Perubahan (Tahap CLOSE)

Saat seluruh task selesai diimplementasikan pada tahap CLOSE nanti:
1. **Pembaruan Stempel Tanggal:**
   - Memperbarui header `Terakhir diverifikasi: 2026-10-28` pada:
     - `prd/public-home.md`
     - `tech/public-home.md`
   - Memperbarui kolom *Verifikasi* pada tabel modul **Public Home** di `.agents/INDEX.md` menjadi `2026-10-28`.
2. **Penghapusan Penanda Task:**
   - Menghapus penanda `[PENDING T-233 ... T-237]` di modul spesifikasi PRD dan Tech.
3. **Pencatatan Riwayat (CHANGELOG):**
   - Menambahkan 1 baris entri pada `.agents/CHANGELOG.md`:
     `2026-10-28 | Revisi minor homepage: perapian header produk, transisi gradasi, layout Why Choose Us & logo marquee mobile | T-233 s/d T-237`
4. **Pengarsipan Dokumen:**
   - Memindahkan berkas proposal ini dari `changes/2026-10-28_homepage-revisi-minor.md` ke direktori `archive/`.
   - Mengarsipkan task yang tuntas dari `3-TASKS.md` ke `archive/tasks-index-full.md`.
