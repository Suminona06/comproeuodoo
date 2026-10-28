# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 5 Task (T-233 s/d T-237)
- **Total Task Selesai:** 232 Task (T-01 s/d T-232)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-238**.

---

## Task Aktif / Terbuka (Open Tasks)

### T-233: Penyesuaian Spasi Header & Eliminasi Tombol Redundan Produk Unggulan
- **Deskripsi:** Merapikan tata letak `.prod-header` pada seksi Produk Unggulan Manufaktur dengan memberikan margin pemisah vertikal proporsional antara judul `.prod-title` dan subjudul `.prod-subtitle` (Opsi A), serta menghapus tombol kanan *"Lihat Seluruh Katalog →"* dari markup dan CSS terkait karena navigasi utama katalog telah diakomodasi tombol bawah.
- **Acceptance Criteria:**
  - [ ] Jarak antara `.prod-title` dan `.prod-subtitle` bertambah proporsional (menggunakan token spasi `--space-sm`/`--space-md`, tanpa teks menempel) di resolusi desktop dan mobile.
  - [ ] Markup tombol kanan `<a href="/products" class="btn btn-primary">` di dalam `.prod-header` dihapus bersih dari `views/public/index.ejs`.
  - [ ] Tombol bawah *"Jelajahi Seluruh Katalog Produk →"* (`.btn-see-more`) tetap utuh dan berfungsi normal mengarahkan ke `/products`.
  - [ ] Struktur `.prod-header` tetap rapi, seimbang, dan tidak menghasilkan pergeseran layout (*layout shift*).
- **File Terdampak:** `views/public/index.ejs`, `public/css/components.css`
- **Skill:** polish
- **Verifikasi:** Manual inspect pada 320px, 375px, 768px, 1024px, 1440px; klik navigasi `/products`.

### T-234: Penerapan Token Transisi Gradasi Halus Latar Seksi Why Choose Us
- **Deskripsi:** Mengganti batas latar belakang kaku (*hard edge*) pada peralihan seksi Produk Unggulan (`var(--bg-subtle)`), seksi Why Choose Us (hijau lembut), dan seksi Sertifikasi (`var(--bg-subtle)`) dengan transisi gradasi halus di kedua batas (Opsi B) berbasis token semantik baru tanpa nilai hex keras di CSS komponen.
- **Acceptance Criteria:**
  - [ ] Token gradasi semantik terdaftar resmi di `public/css/tokens.css`: `--trans-subtle-to-wcu` dan `--trans-wcu-to-subtle`.
  - [ ] Pseudo-elemen pemisah di atas seksi Why Choose Us menyatu mulus tanpa garis putih atau tepi patah.
  - [ ] Pseudo-elemen pemisah di bawah seksi Why Choose Us (menuju seksi Sertifikasi) menyatu mulus tanpa patahan visual.
  - [ ] Tidak ada nilai hex baru yang di-hardcode langsung pada berkas komponen CSS.
- **File Terdampak:** `public/css/tokens.css`, `public/css/components.css`
- **Skill:** polish
- **Verifikasi:** Inspeksi visual batas atas dan batas bawah Why Choose Us pada 1440px dan 375px.

### T-235: Optimasi Layout Visual Why Choose Us Mobile, Pelepasan Floating Card & Chip
- **Deskripsi:** Merestrukturisasi tampilan kolom visual `.wcu-artbox` pada seksi Why Choose Us khusus untuk viewport mobile (`< 768px`) dengan menyembunyikan *floating card* *"Better by design."* dan menyembunyikan chip label *"MATERIAL · ALAM · MASA DEPAN"* (Opsi C), sehingga ilustrasi daun botani SVG tampil 100% bersih, terpusat, dan utuh tanpa elemen yang menutupi.
- **Acceptance Criteria:**
  - [ ] Elemen `.wcu-float-card` tidak tampil di viewport mobile (`< 768px`).
  - [ ] Elemen `.wcu-art-label` tidak tampil di viewport mobile (`< 768px`).
  - [ ] Tampilan desktop Why Choose Us tetap 100% identik dengan kondisi saat ini (floating card, chip label, dan animasi tetap aktif di desktop).
  - [ ] Ilustrasi daun botani (`.wcu-art`) pada mobile tampil utuh, berada di tengah visual box, dan tidak terpotong tepi canvas.
- **File Terdampak:** `public/css/components.css`, `views/public/index.ejs`
- **Skill:** adapt
- **Verifikasi:** Uji viewport 320px, 375px, 480px, 768px (daun bersih 100%) dan desktop 1024px, 1440px (tidak ada regresi).

### T-236: Penskalaan Ukuran Logo Marquee Merek pada Viewport Mobile
- **Deskripsi:** Memperbesar ukuran logo merek pada marquee strip Merek Paten Terdaftar khusus pada viewport mobile (Opsi B) agar detail grafis dan nama merek (misal "PB", "ANUGERAH MULIA") tampil jelas dan terbaca sesuai referensi visual, dengan target sentuh aman dan bebas overflow horizontal pada 320px.
- **Acceptance Criteria:**
  - [ ] Logo pada marquee strip merek terdaftar (`.brand-strip-logo`) memiliki dimensi lebih jelas di mobile (`height: clamp(70px, 13vw, 88px)` dan `min-width: clamp(130px, 20vw, 160px)`).
  - [ ] Logo tidak pecah/buram dan tidak menabrak batas padding marquee.
  - [ ] Tidak terjadi *horizontal scroll leak* pada seluruh lebar viewport mobile mulai 320px.
- **File Terdampak:** `public/css/components.css`
- **Skill:** adapt
- **Verifikasi:** Inspeksi visual marquee dan horizontal scroll test di 320px.

### T-237: Verifikasi Lintas Viewport, Validasi Dwibahasa (ID & EN), dan Uji Regresi
- **Deskripsi:** Melakukan pengujian holistik dan regresi visual pada seluruh halaman beranda dari resolusi 320px hingga 1440px dalam Bahasa Indonesia (`id`) dan Bahasa Inggris (`en`), memastikan tidak ada error console JavaScript dan tidak merusak seksi beranda lainnya.
- **Acceptance Criteria:**
  - [ ] Tampilan beranda terverifikasi rapi pada resolusi 320px, 375px, 480px, 768px, 1024px, dan 1440px.
  - [ ] Switch bahasa `id` dan `en` berfungsi mulus tanpa ada teks yang hilang atau key mati.
  - [ ] Tidak ada error console baru pada browser runtime.
  - [ ] Seluruh seksi di luar target perubahan (Hero, Intro, Certifications, News, Footer) tetap utuh dan beku.
- **File Terdampak:** Seluruh berkas yang disentuh pada T-233 s/d T-236.
- **Skill:** polish, adapt
- **Verifikasi:** Click-through test & console log check di browser runtime.

