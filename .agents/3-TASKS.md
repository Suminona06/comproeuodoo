# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 4 Task (T-246 s/d T-249)
- **Total Task Selesai:** 245 Task (T-01 s/d T-245)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-250**.

---

## Task Aktif / Terbuka (Open Tasks)

### T-245: Fix Integrasi TinyMCE Image Dialog dengan Universal Media Picker

- **Status:** Done
- **Prioritas:** High
- **Modul:** Admin CMS & Users / Media Library
- **Tanggal:** 2026-10-30
- **Dependensi:** Tidak ada
- **Deskripsi:**
  Tambahkan konfigurasi `file_picker_callback` pada inisialisasi TinyMCE di `public/js/admin-editor.js` yang membuka `window.openMediaPicker({ type: 'image' })` saat tombol browse ditekan di dialog "Insert/Edit Image", serta mengembalikan URL gambar dan deskripsi alternatif ke dialog TinyMCE.
- **Akar Masalah Dugaan:**
  `public/js/admin-editor.js` L85-182 telah mengonfigurasi `images_upload_handler` untuk drag/paste berkas (POST ke `/admin/posts/upload-image`), namun tidak mendefinisikan opsi `file_picker_callback`. Akibatnya, TinyMCE tidak memunculkan tombol telusuri (browse) di samping input URL pada dialog "Insert/Edit Image", dan editor tidak terhubung dengan `window.openMediaPicker` dari `public/js/media-picker.js`.
- **Acceptance Criteria:**
  - [x] Opsi `file_picker_callback` terpasang pada `tinymce.init` di `public/js/admin-editor.js`.
  - [x] Menekan tombol browse di dialog "Insert/Edit Image" TinyMCE membuka modal Universal Media Picker dengan filter gambar aktif.
  - [x] Memilih gambar dari pustaka media dan menekan konfirmasi mengisi URL gambar (`selected.file_url`) dan alt text ke dialog TinyMCE.
  - [x] Berfungsi pada form artikel (`#content_id`, `#content_en`) dan form produk (`#description_id`, `#description_en`).
  - [x] Tanpa script inline, bebas error CSP Helmet, dan tanpa error pada console browser.
- **File Terdampak:**
  - `public/js/admin-editor.js`
  - `public/css/admin.css`
- **Skill:** `debugging-and-error-recovery`, `antislop-code`
- **Verifikasi:**
  - Buka `/admin/posts/create` dan `/admin/products/create`.
  - Klik ikon "Insert/Edit Image" pada toolbar TinyMCE, klik tombol browse di samping input URL, pilih gambar dari Media Library, konfirmasi pilihan, pastikan URL terisi dan gambar berhasil disisipkan ke editor.

---

### T-246: Fix Live Search Produk pada Tabel Admin

- **Status:** Open (Todo)
- **Prioritas:** High
- **Modul:** Products Catalog / Admin CMS
- **Tanggal:** 2026-10-30
- **Dependensi:** Tidak ada
- **Deskripsi:**
  Perbaiki live search client-side instan dengan menambahkan atribut `data-status="<%= p.status %>"` pada setiap elemen `<tr>` di `views/admin/products/index.ejs`, dan perbaiki logika selector di `public/js/admin.js` agar mencakup baris tabel secara andal tanpa reload halaman. Sesuai Keputusan 1 (Opsi A), backend search query dan form GET tidak diubah.
- **Akar Masalah Dugaan:**
  `public/js/admin.js` L86 menyeleksi baris menggunakan `.data-table tbody tr[data-status], .admin-table tbody tr[data-status]`. Pada `views/admin/products/index.ejs` L65, tag `<tr>` tidak menyertakan atribut `data-status`. Hal ini menyebabkan variabel `tableRows` menghasilkan `NodeList(0)`, sehingga fungsi `filterRows()` tidak mengeksekusi penyaringan baris produk saat user mengetik di `#liveSearchInput`.
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

- **Status:** Open (Todo)
- **Prioritas:** High
- **Modul:** Admin CMS & Users / Media Library
- **Tanggal:** 2026-10-30
- **Dependensi:** Tidak ada
- **Deskripsi:**
  Perbaiki fungsi `confirmSelection` dan event listener clear di `public/js/media-picker.js` agar memanipulasi class `.hidden` secara konsisten via `classList.remove('hidden')` dan `classList.add('hidden')` bersamaan dengan pengaturan display style.
- **Akar Masalah Dugaan:**
  `public/js/media-picker.js` L293-306 dalam fungsi `confirmSelection` hanya mengatur `img.style.display = 'block'`, namun tidak menghapus class `.hidden` dari elemen `<img>`. Di `views/admin/products/create.ejs` L100, elemen `<img>` memiliki class `.hidden` saat form create dibuka karena `image_url` masih kosong. Rule CSS `.hidden { display: none !important; }` mengalahkan inline style `display: block`. Begitu pula tombol clear `#btn-clear-media` dan placeholder kosong `.media-picker-empty` membutuhkan sinkronisasi class `.hidden`.
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

- **Status:** Open (Todo)
- **Prioritas:** Medium
- **Modul:** Products Catalog / Admin CMS
- **Tanggal:** 2026-10-30
- **Dependensi:** Tidak ada
- **Deskripsi:**
  Tambahkan dukungan navigasi keyboard menggunakan tombol panah (ArrowUp, ArrowDown, ArrowLeft, ArrowRight) antar sel input data (`.prod-size-cell`) pada dynamic size table builder di form create dan edit produk CMS. Sesuai Keputusan 2 (Opsi A), cakupan dibatasi khusus pada tabel ukuran (tidak pada varian). Sesuai Keputusan 3 (Opsi A), menekan tombol Enter pada baris terakhir otomatis menyisipkan 1 baris baru.
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

- **Status:** Open (Todo)
- **Prioritas:** Medium
- **Modul:** Public Home
- **Tanggal:** 2026-10-30
- **Dependensi:** Tidak ada
- **Deskripsi:**
  Hapus seluruh konten fallback statis yang di-hardcode pada `views/public/index.ejs`. Sesuai Keputusan 4 (Opsi B), hero banner tetap mempertahankan safety net fallback agar tidak kosong. Sesuai Keputusan 5 (Opsi B), seksi News tetap merender judul seksi namun kartu placeholder statis digantikan dengan pesan empty-state ramah. Seksi Products, Why Choose Us, dan Brand Strip dibersihkan dari fallback hardcoded (zero-render jika CMS kosong).
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
