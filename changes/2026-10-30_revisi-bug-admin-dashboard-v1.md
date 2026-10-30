# Proposal Perubahan: revisi-bug-admin-dashboard-v1

Tanggal: 2026-10-30  
Status: PROPOSE (Tahap 1 WORKFLOW.md — Diperbarui Sesuai Jawaban Azis)  
Acuan Modul: `prd/admin-cms.md`, `tech/admin-cms.md`, `prd/media-library.md`, `tech/media-library.md`, `prd/products.md`, `tech/products.md`, `prd/public-home.md`, `tech/public-home.md`  

---

## 1. Konteks

Proposal perbaikan 3 bug operasional CMS admin (integrasi TinyMCE Media Library, search produk, dan preview foto create product) serta 2 peningkatan spesifikasi (navigasi keyboard arrow keys tabel ukuran dan penghapusan fallback hardcoded beranda agar patuh antislop R-17/R-38).

---

## 2. Delta Spesifikasi per Modul

### A. Modul Admin CMS & Users (`prd/admin-cms.md` & `tech/admin-cms.md`)

#### PRD (`prd/admin-cms.md`)
- **Kondisi Lama (FR-26 butir 4 & 6):**
  - Butir 4 hanya menyebut integrasi TinyMCE pada field `#description_id` dan `#description_en` tanpa mensyaratkan integrasi pemilih berkas Media Library pada dialog insert image.
  - Butir 6 mendefinisikan builder tabel ukuran dinamis dengan tombol tambah/hapus kolom dan baris serta reorder tanpa spesifikasi navigasi keyboard tombol panah.
- **Kondisi Baru (FR-26 diperbarui):**
  - Butir 4: Editor TinyMCE pada seluruh form CMS (artikel `#content_id/#content_en` dan produk `#description_id/#description_en`) wajib menyediakan callback pemilih berkas (`file_picker_callback`) yang terhubung langsung ke Universal Media Picker modal (`openMediaPicker({ type: 'image' })`).
  - Butir 6: Builder tabel ukuran dinamis wajib mendukung navigasi keyboard tombol panah (ArrowUp, ArrowDown, ArrowLeft, ArrowRight) antar sel input secara 2 dimensi, serta tombol Enter pada baris terakhir untuk menambah baris baru secara otomatis.

#### Tech Spec (`tech/admin-cms.md`)
- **Kondisi Lama (Bagian 5 butir 1):**
  - Konfigurasi TinyMCE di `public/js/admin-editor.js` hanya menyertakan `images_upload_handler` untuk drag/paste file tanpa `file_picker_callback`.
  - Inisialisasi builder tabel ukuran di `public/js/admin-size-table.js` hanya mengikat event `input` untuk serialisasi data JSON.
  - Tabel produk admin (`views/admin/products/index.ejs`) tidak menyertakan atribut `data-status` pada baris `<tr>`, sehingga selector `public/js/admin.js` L86 menghasilkan NodeList kosong.
- **Kondisi Baru (Bagian 5 butir 1 diperbarui — diselaraskan dengan Keputusan 1, 2, 3):**
  - Penambahan `file_picker_callback` pada konfigurasi TinyMCE yang memanggil `window.openMediaPicker` dan menyuplai URL gambar serta atribut alt terpilih.
  - Penambahan keyboard event listener delegasi pada container `#dynamicSizeEditor` di `public/js/admin-size-table.js` untuk navigasi tombol panah 4 arah antar sel `.prod-size-cell`, serta aksi Enter di baris terakhir untuk append baris baru.
  - Penambahan atribut `data-status="<%= p.status %>"` pada elemen `<tr>` tabel produk di `views/admin/products/index.ejs` dan penyempurnaan selector filter di `public/js/admin.js` untuk live search client-side instan (tanpa reload).

---

### B. Modul Media Library (`prd/media-library.md` & `tech/media-library.md`)

#### PRD (`prd/media-library.md`)
- **Kondisi Lama (FR-19 & Universal Media Picker Modal):**
  - Universal Media Picker Modal dapat dipanggil dari formulir modul lain untuk memilih gambar tunggal atau ganda.
- **Kondisi Baru:**
  - Tetap dipertahankan (tanpa perubahan kebutuhan fungsional inti). Menegaskan bahwa state pratinjau wajib sinkron terhadap status class visibilitas elemen container form pemanggil (termasuk penanganan elemen tersembunyi ber-class `.hidden`).

#### Tech Spec (`tech/media-library.md`)
- **Kondisi Lama (Bagian 6 butir 1 & 2):**
  - Fungsi `confirmSelection` di `public/js/media-picker.js` L293-306 hanya memanipulasi `img.style.display = 'block'` tanpa menghapus class `.hidden`.
- **Kondisi Baru (Bagian 6 butir 1 diperbarui):**
  - Fungsi `confirmSelection` di `public/js/media-picker.js` diperbarui agar secara eksplisit menghapus class `.hidden` dari elemen `img` (`img.classList.remove('hidden')`), menyembunyikan placeholder kosong (`emptyPlaceholder.classList.add('hidden')`), dan menampilkan tombol clear (`clearBtn.classList.remove('hidden')`).
  - Event listener tombol hapus (`.btn-clear-media`) diperbarui agar menambahkan kembali class `.hidden` ke elemen `img` dan tombol clear, serta menghapus class `.hidden` dari placeholder kosong.

---

### C. Modul Produk & Katalog Manufaktur (`prd/products.md` & `tech/products.md`)

#### PRD (`prd/products.md`)
- **Kondisi Lama (FR-29):**
  - Menetapkan struktur builder tabel ukuran dinamis dengan batas 1-8 kolom dan 0-30 baris, tombol reorder, dan modal salin struktur, dengan aksesibilitas berfokus pada tombol aksi.
- **Kondisi Baru (FR-29 diperbarui — diselaraskan dengan Keputusan 2 & 3):**
  - Penambahan aturan aksesibilitas keyboard: Seluruh sel input data (`.prod-size-cell`) pada builder tabel ukuran wajib dapat dijelajahi menggunakan tombol panah (ArrowUp, ArrowDown, ArrowLeft, ArrowRight) tanpa memerlukan klik mouse atau hanya bergantung pada tombol Tab.
  - Penambahan shortcut produktivitas: Menekan tombol Enter pada sel baris terakhir otomatis menambahkan 1 baris baru (hingga batas 30 baris) dan memindahkan fokus ke sel kolom pertama pada baris baru tersebut.

#### Tech Spec (`tech/products.md`)
- **Kondisi Lama (Bagian 2 & 4):**
  - Mendokumentasikan routing CMS produk dan validasi server-side `parseDynamicSizeTable`.
- **Kondisi Baru:**
  - Penambahan dokumentasi spesifikasi interaksi antarmuka builder tabel ukuran di `public/js/admin-size-table.js` untuk penanganan navigasi keyboard sel 2D dan shortcut Enter tambah baris.

---

### D. Modul Beranda Publik (`prd/public-home.md` & `tech/public-home.md`)

#### PRD (`prd/public-home.md`)
- **Kondisi Lama (FR-05, FR-10, Why Choose Us, FR-17, Latest News Highlights):**
  - Sistem memiliki nilai teks dan objek fallback default yang tampil jika konten CMS dikosongkan oleh admin (misal banner placeholder di hero, fallback title kategori, narasi default Why Choose Us, fallback title merek terdaftar, dan kartu berita placeholder bertanggal statis).
- **Kondisi Baru (FR-05 & FR-10 diperbarui — diselaraskan dengan Keputusan 4 & 5):**
  - Hero Banner: Mempertahankan safety net fallback banner default pada hero slider agar halaman beranda publik tidak tampil bolong jika belum ada slide banner yang diaktifkan di CMS (Keputusan 4: Opsi B).
  - Seksi Produk (4 Panel Kategori), Why Choose Us, dan Merek Terdaftar: Seluruh teks fallback statis hardcoded dihapus total. Jika data CMS kosong/falsy atau dinonaktifkan, seksi terkait tidak dirender ke antarmuka publik (zero-render).
  - Seksi Berita Terkini (News): Dua kartu placeholder dummy bertanggal statis dihapus total sesuai kepatuhan antislop R-17/R-38. Jika artikel kosong (`latestPosts.length === 0`), judul seksi berita tetap dirender dan kartu digantikan dengan pesan empty-state ramah dwibahasa (Keputusan 5: Opsi B).

#### Tech Spec (`tech/public-home.md`)
- **Kondisi Lama (Bagian 4 Komponen Antarmuka):**
  - Template `views/public/index.ejs` mendefinisikan objek `displayBanners` berisi 1 banner hardcoded jika `activeBanners` kosong (L10-24).
  - Judul seksi kategori memakai fallback string `'Featured Manufacturing Products'` / `'Produk Unggulan Manufaktur'` (L196-201).
  - Seksi Why Choose Us memiliki 13 variabel fallback string teks editorial (L254-266).
  - Judul seksi merek memiliki fallback `'Registered Trademarks'` / `'Merek Paten & Terdaftar'` (L411-412).
  - Seksi berita memiliki 2 kartu placeholder dengan tanggal "25 SEP 2026" dan "18 SEP 2026" jika `latestPosts` kosong (L561-576).
- **Kondisi Baru (Bagian 4 diperbarui — diselaraskan dengan Keputusan 4 & 5):**
  - Hero Banner: Objek fallback banner di L10-24 dipertahankan sebagai safety net (Keputusan 4).
  - Seksi Produk: Fallback teks hardcoded dihapus; jika data judul CMS kosong atau `catsToDisplay.length === 0`, blok header/seksi ditangani secara kondisional.
  - Seksi Why Choose Us: Dibungkus kondisional ketat; jika data field teks utama kosong atau `is_active` bernilai `0`, seksi tidak dirender ke DOM.
  - Seksi Merek Terdaftar: Jika `marqueeBrands.length === 0`, seluruh seksi `.sec-brands` tidak dirender.
  - Seksi Berita: Kartu dummy bertanggal statis di L561-576 dihapus. Jika `latestPosts.length === 0`, render pesan empty-state berkelas `.news-empty-state` dengan teks: "Belum ada artikel terbaru" (ID) / "No recent articles available" (EN) menggunakan token warna teks `var(--color-text-muted)` (Keputusan 5).

---

## 3. Keputusan Terpilih (Hasil Konfirmasi Azis)

Berikut rangkuman pilihan keputusan yang telah dikonfirmasi oleh Azis dan diintegrasikan ke dalam proposal ini:

1. **[A2 — Search Produk Admin]: Opsi A**
   - Menggunakan **Client-side live search saja** dengan memperbaiki atribut `data-status` pada baris tabel dan selector JS. Sangat instan, cepat, dan tanpa beban query server untuk katalog saat ini (< 50 produk).
2. **[B1 — Navigasi Arrow Key: Cakupan]: Opsi A**
   - Navigasi tombol panah **hanya berlaku untuk dynamic size table** (`.prod-size-cell`) karena berbentuk matriks 2D (baris x kolom). Input varian ukuran tetap menggunakan navigasi standar Tab / Shift+Tab.
3. **[B1 — Navigasi Arrow Key: Tombol Enter]: Opsi A**
   - Menekan **Enter pada baris terakhir otomatis menambah 1 baris baru** dan memindahkan fokus ke sel kolom pertama baris baru (maksimal 30 baris), meningkatkan kecepatan entri data teknis produk.
4. **[B2 — Hapus Fallback Homepage: Hero Banner]: Opsi B**
   - **Hero banner tetap mempertahankan safety net fallback** agar beranda tidak buka "bolong" di posisi paling atas jika database banner kosong.
5. **[B2 — Hapus Fallback Homepage: Seksi News]: Opsi B**
   - Kartu berita placeholder statis dihapus, **header seksi News tetap tampil dengan pesan empty state ramah** ("Belum ada artikel terbaru" / "No recent articles available") saat `latestPosts` kosong.

---

## 4. Rencana Task (Mulai T-245)

### T-245: Fix Integrasi TinyMCE Image Dialog dengan Universal Media Picker
- **Jenis:** Bug Fix (tanpa perubahan spek)
- **Akar Masalah Dugaan:** `public/js/admin-editor.js` L85-182 telah mengonfigurasi `images_upload_handler` untuk drag/paste berkas (POST ke `/admin/posts/upload-image`), namun tidak mendefinisikan opsi `file_picker_callback`. Akibatnya, TinyMCE tidak memunculkan tombol telusuri (browse) di samping input URL pada dialog "Insert/Edit Image", dan editor tidak terhubung dengan `window.openMediaPicker` dari `public/js/media-picker.js`.
- **Deskripsi:** Tambahkan konfigurasi `file_picker_callback` pada inisialisasi TinyMCE di `public/js/admin-editor.js` yang membuka `window.openMediaPicker({ type: 'image' })` saat tombol browse ditekan, serta mengembalikan URL gambar dan deskripsi alternatif ke dialog TinyMCE.
- **Acceptance Criteria:**
  - [ ] Opsi `file_picker_callback` terpasang pada `tinymce.init` di `public/js/admin-editor.js`.
  - [ ] Menekan tombol browse di dialog "Insert/Edit Image" TinyMCE membuka modal Universal Media Picker dengan filter gambar aktif.
  - [ ] Memilih gambar dari pustaka media dan menekan konfirmasi mengisi URL gambar (`selected.file_url`) dan alt text ke dialog TinyMCE.
  - [ ] Berfungsi pada form artikel (`#content_id`, `#content_en`) dan form produk (`#description_id`, `#description_en`).
  - [ ] Tanpa script inline, bebas error CSP Helmet, dan tanpa error pada console browser.
- **File Terdampak:**
  - `public/js/admin-editor.js`
- **Skill:** `debugging-and-error-recovery`, `antislop-code`
- **Verifikasi:**
  - Buka `/admin/posts/create` dan `/admin/products/create`.
  - Klik ikon "Insert/Edit Image" pada toolbar TinyMCE, klik tombol browse di samping input URL, pilih gambar dari Media Library, konfirmasi pilihan, pastikan URL terisi dan gambar berhasil disisipkan ke editor.

---

### T-246: Fix Live Search Produk pada Tabel Admin
*(diperbarui sesuai jawaban 1)*
- **Jenis:** Bug Fix (tanpa perubahan spek)
- **Akar Masalah Dugaan:** `public/js/admin.js` L86 menyeleksi baris menggunakan `.data-table tbody tr[data-status], .admin-table tbody tr[data-status]`. Pada `views/admin/products/index.ejs` L65, tag `<tr>` tidak menyertakan atribut `data-status`. Hal ini menyebabkan variabel `tableRows` menghasilkan `NodeList(0)`, sehingga fungsi `filterRows()` tidak mengeksekusi penyaringan baris produk saat user mengetik di `#liveSearchInput`.
- **Deskripsi:** Perbaiki live search client-side instan dengan menambahkan atribut `data-status="<%= p.status %>"` pada setiap elemen `<tr>` di `views/admin/products/index.ejs`, dan perbaiki logika selector di `public/js/admin.js` agar mencakup baris tabel secara andal tanpa reload halaman. Sesuai Jawaban 1 (Opsi A), backend search query dan form GET tidak diubah.
- **Acceptance Criteria:**
  - [ ] Elemen `<tr>` di `views/admin/products/index.ejs` memiliki atribut `data-status="<%= p.status %>"`.
  - [ ] Selector baris tabel di `public/js/admin.js` mencakup seluruh baris data pada `.data-table tbody tr`.
  - [ ] Mengetik nama produk atau slug pada `#liveSearchInput` menyaring baris secara instan (case-insensitive) di sisi klien tanpa reload halaman.
  - [ ] Baris yang tidak cocok disembunyikan (`display: none`), baris yang cocok ditampilkan kembali.
  - [ ] Integrasi filter status tab dan live search berjalan selaras tanpa memicu konflik tampilan.
- **File Terdampak:**
  - `views/admin/products/index.ejs`
  - `public/js/admin.js`
- **Skill:** `debugging-and-error-recovery`, `antislop-code`
- **Verifikasi:**
  - Buka `/admin/products`.
  - Ketik potongan kata kunci nama produk (misal "HDPE", "Sampah", dsb.) pada input pencarian, amati pemfilteran baris tabel seketika tanpa request network baru.
  - Kosongkan input dan pastikan seluruh baris kembali tampil normal.

---

### T-247: Fix Pratinjau Foto Produk Utama saat Create Product (Sinkronisasi Class Hidden)
- **Jenis:** Bug Fix (tanpa perubahan spek)
- **Akar Masalah Dugaan:** `public/js/media-picker.js` L293-306 dalam fungsi `confirmSelection` hanya mengatur `img.style.display = 'block'`, namun tidak menghapus class `.hidden` dari elemen `<img>`. Di `views/admin/products/create.ejs` L100, elemen `<img>` memiliki class `.hidden` saat form create dibuka karena `image_url` masih kosong. Rule CSS `.hidden { display: none !important; }` mengalahkan inline style `display: block`. Begitu pula tombol clear `#btn-clear-media` dan placeholder kosong `.media-picker-empty` membutuhkan sinkronisasi class `.hidden`.
- **Deskripsi:** Perbaiki fungsi `confirmSelection` dan event listener clear di `public/js/media-picker.js` agar memanipulasi class `.hidden` secara konsisten via `classList.remove('hidden')` dan `classList.add('hidden')` bersamaan dengan pengaturan display style.
- **Acceptance Criteria:**
  - [ ] Pada `confirmSelection` di `public/js/media-picker.js`:
    - `img.classList.remove('hidden')` dan `img.style.display = 'block'`.
    - `emptyPlaceholder.classList.add('hidden')` dan `emptyPlaceholder.style.display = 'none'`.
    - `clearBtn.classList.remove('hidden')` dan `clearBtn.style.display = 'inline-flex'`.
  - [ ] Pada handler `.btn-clear-media`:
    - `img.classList.add('hidden')` dan `img.style.display = 'none'`.
    - `emptyPlaceholder.classList.remove('hidden')` dan `emptyPlaceholder.style.display = 'flex'`.
    - `clearBtn.classList.add('hidden')` dan `clearBtn.style.display = 'none'`.
  - [ ] Pratinjau foto langsung muncul saat foto pertama kali dipilih di form `/admin/products/create`.
  - [ ] Kompatibilitas mundur terjaga penuh untuk pemanggil picker di form lain (Edit Product, Banner, Settings, dll.).
- **File Terdampak:**
  - `public/js/media-picker.js`
- **Skill:** `debugging-and-error-recovery`, `antislop-human`
- **Verifikasi:**
  - Buka `/admin/products/create`.
  - Klik "Pilih dari Media Library" pada seksi Foto Utama, pilih gambar, klik konfirmasi.
  - Pastikan gambar langsung tampil di kotak pratinjau tanpa latar abu-abu blank.
  - Klik "Hapus", pastikan kotak kembali menampilkan placeholder teks dan ikon kosong.

---

### T-248: Implementasi Navigasi Tombol Panah (Arrow Keys) pada Builder Tabel Ukuran Produk
*(diperbarui sesuai jawaban 2 & 3)*
- **Jenis:** Perubahan Spesifikasi / Fitur Baru
- **Deskripsi:** Tambahkan dukungan navigasi keyboard menggunakan tombol panah (ArrowUp, ArrowDown, ArrowLeft, ArrowRight) antar sel input data (`.prod-size-cell`) pada dynamic size table builder di form create dan edit produk CMS. Sesuai Jawaban 2 (Opsi A), cakupan dibatasi khusus pada tabel ukuran (tidak pada varian). Sesuai Jawaban 3 (Opsi A), menekan tombol Enter pada baris terakhir otomatis menyisipkan 1 baris baru.
- **Acceptance Criteria:**
  - [ ] Event listener `keydown` terpasang pada kontainer tabel ukuran `#dynamicSizeEditor` di `public/js/admin-size-table.js`.
  - [ ] Navigasi tombol panah berlaku khusus untuk sel input `.prod-size-cell` pada `#dynamicSizeEditor`.
  - [ ] Menekan `ArrowLeft`: memindahkan fokus ke sel kolom sebelumnya pada baris yang sama.
  - [ ] Menekan `ArrowRight`: memindahkan fokus ke sel kolom berikutnya pada baris yang sama.
  - [ ] Menekan `ArrowUp`: memindahkan fokus ke sel baris sebelumnya pada kolom yang sama (atau ke input label kolom jika di baris pertama).
  - [ ] Menekan `ArrowDown`: memindahkan fokus ke sel baris berikutnya pada kolom yang sama.
  - [ ] Menekan `Enter` pada sel baris terakhir: otomatis menambahkan 1 baris baru (jika baris < 30), menyinkronkan hidden input JSON, dan memindahkan fokus ke sel kolom pertama pada baris baru tersebut.
  - [ ] Menekan `Enter` pada sel bukan baris terakhir: memindahkan fokus ke sel baris di bawahnya pada kolom yang sama.
  - [ ] Navigasi keyboard Tab / Shift+Tab bawaan browser tetap berfungsi normal.
  - [ ] Tanpa handler inline, 100% patuh CSP Helmet dan antislop R-32 (Keyboard Accessibility).
- **File Terdampak:**
  - `public/js/admin-size-table.js`
- **Skill:** `frontend-ui-engineering`, `antislop-human`
- **Verifikasi:**
  - Buka `/admin/products/create`.
  - Masukkan data pada beberapa sel di tabel ukuran, gunakan tombol panah untuk berpindah ke atas, bawah, kiri, dan kanan.
  - Pada baris terakhir, tekan Enter dan pastikan 1 baris baru otomatis terbentuk dan fokus berpindah ke kolom pertama baris baru.
  - Pastikan batas maksimal 30 baris tetap dihormati dan data tersimpan rapi ke input JSON.

---

### T-249: Eliminasi Fallback Konten Hardcoded pada Halaman Beranda Publik
*(diperbarui sesuai jawaban 4 & 5)*
- **Jenis:** Perubahan Spesifikasi / Fitur Baru
- **Deskripsi:** Hapus seluruh konten fallback statis yang di-hardcode pada `views/public/index.ejs`. Sesuai Jawaban 4 (Opsi B), hero banner tetap mempertahankan safety net fallback agar tidak kosong. Sesuai Jawaban 5 (Opsi B), seksi News tetap merender judul seksi namun kartu placeholder statis digantikan dengan pesan empty-state ramah. Seksi Products, Why Choose Us, dan Brand Strip dibersihkan dari fallback hardcoded (zero-render jika CMS kosong).
- **Acceptance Criteria:**
  - [ ] Hero Banner: Objek fallback banner default di `views/public/index.ejs` L10-24 DIPERTAHANKAN sebagai safety net beranda (Keputusan 4).
  - [ ] Seksi Produk: Fallback teks hardcoded judul dan subtitle kategori di L196-201 dihapus. Jika judul kosong atau kategori kosong, render ditangani secara kondisional.
  - [ ] Seksi Why Choose Us: 13 variabel fallback string di L254-266 dihapus total. Jika data WCU di CMS kosong atau `is_active` bernilai `0`, seksi Why Choose Us tidak dirender sama sekali.
  - [ ] Seksi Brand Strip: Fallback string judul merek terdaftar di L411-412 dihapus. Jika `marqueeBrands.length === 0`, seksi merek tidak dirender.
  - [ ] Seksi Berita (News): Kartu placeholder statis dengan tanggal palsu "25 SEP 2026" dan "18 SEP 2026" di L561-576 dihapus total (Keputusan 5). Jika `latestPosts.length === 0`, tampilkan pesan empty-state ramah dwibahasa: `<div class="news-empty-state"><p><%= currentLang === 'en' ? 'No recent articles available at this time.' : 'Belum ada artikel berita terbaru saat ini.' %></p></div>`.
  - [ ] Homepage dibekukan KECUALI seksi-seksi yang mengalami pembersihan fallback ini.
  - [ ] Styling empty-state seksi berita scoped dan menggunakan token desain (`var(--color-text-muted)`, tanpa hardcode hex).
  - [ ] Tampilan halaman beranda tetap responsif dan estetis pada breakpoint 320px hingga desktop tanpa celah/jarak visual janggal.
- **File Terdampak:**
  - `views/public/index.ejs`
- **Skill:** `frontend-ui-engineering`, `antislop-layoutmobile`, `antislop-ui`
- **Verifikasi:**
  - Uji halaman beranda publik `/` dalam kondisi data normal (semua seksi terisi).
  - Uji halaman beranda saat data berita kosong di database: pastikan kartu placeholder statis tanggal 25 SEP 2026 hilang dan digantikan oleh pesan empty state yang rapi.
  - Uji saat data WCU dinonaktifkan di CMS: pastikan seksi Why Choose Us tidak dirender.
  - Uji saat data banner kosong di CMS: pastikan hero banner fallback safety net tetap tayang normal.
  - Uji responsiveness pada viewport 320px, 375px, 768px, 1024px, dan desktop.

---

## 5. Dampak Ukuran Modul

Pemeriksaan ukuran berkas modul aktif sebelum perubahan:
- `prd/admin-cms.md`: ~4.5 KB (85 baris)
- `tech/admin-cms.md`: ~4.8 KB (82 baris)
- `prd/media-library.md`: ~2.7 KB (53 baris)
- `tech/media-library.md`: ~4.2 KB (79 baris)
- `prd/products.md`: ~5.1 KB (72 baris)
- `tech/products.md`: ~5.7 KB (95 baris)
- `prd/public-home.md`: ~5.5 KB (84 baris)
- `tech/public-home.md`: ~5.3 KB (81 baris)

**Analisis:**  
Seluruh berkas modul saat ini berada di bawah batas ~8KB (masing-masing < 6KB). Penambahan delta klausul baru pada tahap implementasi/merge diperkirakan hanya menambah sekitar 150 - 350 bytes per berkas terkait, sehingga seluruh modul dipastikan tetap aman di bawah ~8KB. Tidak ada modul yang perlu dipecah menjadi sub-modul pada revisi ini.

---

## 6. Rencana CLOSE

Ketika seluruh task (T-245 s/d T-249) selesai diimplementasikan dan diverifikasi:
1. **Pembaruan Tanggal Verifikasi Modul (ke 2026-10-30):**
   - `prd/admin-cms.md` dan `tech/admin-cms.md`
   - `prd/media-library.md` dan `tech/media-library.md`
   - `prd/products.md` dan `tech/products.md`
   - `prd/public-home.md` dan `tech/public-home.md`
   - `.agents/INDEX.md` (memperbarui stempel tanggal verifikasi pada tabel ringkasan)
2. **Arsip & Pembersihan Task:**
   - Hapus penanda `[PENDING T-xxx]` dari modul spek.
   - Pindahkan berkas proposal ini dari `changes/` ke `archive/`.
   - Pindahkan task T-245 s/d T-249 dari `.agents/3-TASKS.md` ke `archive/tasks-index-full.md`.
3. **Entri `CHANGELOG.md`:**
   - Tambahkan 1 baris entri:
     `2026-10-30 | Perbaikan 3 bug admin CMS & fitur arrow key nav tabel ukuran serta eliminasi fallback beranda | T-245 s/d T-249`
