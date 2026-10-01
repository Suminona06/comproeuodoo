---
target: views/admin/dashboard.ejs
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/home/itpc/Euodoo/views/admin/dashboard.ejs"
target_fingerprint: "sha256:ab24ed770644c2b5f3c7d145be250016605f061fc1033a4f0d04c081a6a04248"
target_path: /home/itpc/Euodoo/views/admin/dashboard.ejs
timestamp: 2026-09-30T06-02-59Z
slug: views-admin-dashboard-ejs
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Status MySQL statis teks hardcoded; badge leads di sidebar tidak menampilkan jumlah unread/pending; filter tabel lokal tidak menampilkan count hasil. |
| 2 | Match System / Real World | 3 | Istilah operasional manufaktur tepat (RFQ, Kapabilitas Mesin), namun tautan `wa.me/` gagal untuk nomor lokal `08...` karena tidak konversi ke format `628...`. |
| 3 | User Control and Freedom | 3 | Drawer mobile memiliki backdrop & tombol Esc, filter pill bisa direset ke 'Semua', namun live search input tidak memiliki tombol reset (×). |
| 4 | Consistency and Standards | 3 | Tombol '+ Tambah Produk' redundan di header (primer) dan quick actions (sekunder); variasi panah aksi tidak konsisten (`→`, `↗`). |
| 5 | Error Prevention | 3 | Konfirmasi hapus ada di `admin.js`, namun 'Ekspor CSV' di header tidak memiliki filter rentang tanggal dan langsung mengunduh semua data. |
| 6 | Recognition Rather Than Recall | 2 | Tombol 'Kelola →' mengarahkan ke daftar umum `/admin/leads`, bukan ke detail lead spesifik atau modal edit, memaksa admin mengingat dan mencari ulang data. |
| 7 | Flexibility and Efficiency | 2 | Tidak ada shortcut keyboard (misal `/` untuk fokus cari, `n` untuk produk baru); tidak ada bulk action untuk triage leads langsung dari dashboard. |
| 8 | Aesthetic and Minimalist Design | 3 | Palet korporat rapi, namun bar 'Pintasan Tindakan Cepat' memicu redundansi visual, dan 4 kartu metrik memiliki bobot visual identik meski urgensi operasionalnya berbeda. |
| 9 | Error Recovery | 3 | Alert flash message terintegrasi dengan ikon jelas; empty state tabel informatif ketika filter/search tidak menemukan hasil. |
| 10 | Help and Documentation | 1 | Tidak ada dokumentasi terpasang, tooltip penjelasan status lead (Baru/Diproses/Selesai), maupun panduan alur kerja bagi staf admin baru. |
| **Total** | | **25/40** | **Acceptable** |

---

#### Design Specificity Verdict

- **LLM assessment**: Struktur dashboard CMS mengadopsi layout tipikal template dashboard korporat (4 metric cards + quick actions + tabel recent items). Meskipun warna telah diselaraskan dengan palet Pacific Corporate (Deep Navy & Accent Blue), karakteristik bisnis inti PT. EUODOO sebagai pabrik kantong plastik B2B belum terasa menonjol pada pengalaman operasionalnya. Dashboard memperlakukan metrik konten statis (Hero Banner, Artikel) setara dengan metrik bernilai tinggi seperti Permintaan Penawaran (RFQ Leads).
- **Deterministic scan**:
  - `views/admin/dashboard.ejs`: 0 antipattern terdeteksi (bersih).
  - `views/partials/admin-header.ejs`: 1 peringatan (`overused-font`: Plus Jakarta Sans). *Catatan evaluasi: Ini merupakan false positive karena Plus Jakarta Sans adalah komitmen brand yang dipin dalam PRODUCT.md.*

---

#### Overall Impression
Dashboard admin saat ini sudah fungsional, bersih, dan memiliki fondasi teknis yang layak (responsif, ada client-side filter dan live search). Namun, secara operasional dashboard ini masih terasa pasif dan datar: penanganan inquiry leads baru tidak memiliki urgensi visual, navigasi tindakan dari tabel terputus dari konteks, dan bar pintasan cepat memicu redundansi visual yang menambah beban kognitif.

---

#### What's Working
1. **Sidebar Shell & Navigasi Terstruktur**: Pengelompokan menu (Ikhtisar Utama, Katalog & Konten, Pengaturan) sangat logis dan intuitif, lengkap dengan drawer mobile yang mendukung keyboard Esc.
2. **Interaktivitas Instan pada Tabel**: Fitur filter status instan (pill filter) dan live search tanpa reload halaman memberikan kenyamanan navigasi cepat bagi admin.
3. **Empty States yang Informatif**: Baris pesan `#tableFilterEmptyRow` memberikan kejelasan saat tidak ada hasil pencarian, mencegah kebingungan antarmuka.

---

#### Priority Issues

- **[P1] Tindakan 'Kelola →' Terputus dari Data Spesifik**
  - **Why it matters**: Admin mengklik "Kelola →" pada baris RFQ tertentu dengan harapan dapat meninjau detail pesan atau mengubah statusnya, tetapi tautan hanya membawanya ke `/admin/leads` (daftar umum). Admin harus mengingat nama pengirim dan mencarinya lagi dari awal.
  - **Fix**: Ubah tautan ke `/admin/leads?id=<%= lead.id %>` atau `/admin/leads#lead-<%= lead.id %>`, atau sediakan quick status updater / modal preview langsung di baris tabel.
  - **Suggested command**: `$impeccable shape views/admin/dashboard.ejs`

- **[P1] Filter & Search Lokal Hanya Menjangkau 5 Data Terbatas**
  - **Why it matters**: Filter pill dan search input beroperasi secara client-side hanya pada 5 baris `recentLeads`. Jika admin memilih filter "Selesai" dan tidak ada di 5 teratas, muncul pesan kosong seolah tidak ada RFQ selesai sama sekali di sistem.
  - **Fix**: Tambahkan label penjelas jangkauan (*"Menyaring 5 RFQ Terbaru"*), atau ubah search/filter agar mengarahkan query server ke `/admin/leads?status=...&q=...`.
  - **Suggested command**: `$impeccable clarify views/admin/dashboard.ejs`

- **[P2] Format Tautan WhatsApp Tidak Kompatibel dengan Nomor Lokal Indonesia (`08...`)**
  - **Why it matters**: Tautan `https://wa.me/<%= lead.phone.replace(/[^0-9]/g, '') %>` menghasilkan URL seperti `wa.me/0812...`. WhatsApp API mewajibkan kode negara (contoh `628...`). Mengklik tautan tersebut memunculkan halaman error nomor tidak valid dari WhatsApp.
  - **Fix**: Format nomor sebelum membuat tautan: jika berawalan `0`, ganti menjadi `62` (misal `.replace(/[^0-9]/g, '').replace(/^0/, '62')`).
  - **Suggested command**: `$impeccable harden views/admin/dashboard.ejs`

- **[P2] Hirarki Visual Metrik Homogen & Redundansi Pintasan Cepat**
  - **Why it matters**: Kartu metrik RFQ Baru (kritis/urgent) disajikan dengan ukuran dan bobot yang sama persis dengan Banner Hero (konfigurasi jarang). Selain itu, tombol `+ Tambah Produk` muncul dua kali (di header halaman dan di bar quick actions).
  - **Fix**: Beri aksen penekanan visual khusus pada kartu RFQ Baru (misal status alert badge atau highlight warna primer), dan kurasi bar quick actions agar hanya memuat aksi operasional yang paling sering digunakan tanpa duplikasi.
  - **Suggested command**: `$impeccable layout views/admin/dashboard.ejs`

- **[P2] Kontras Warna Header Grup Navigasi Sidebar di Bawah Standar WCAG AA**
  - **Why it matters**: Kelas `.nav-group-title` menggunakan warna `#64748b` di atas background `#0a192f` dengan rasio kontras ~3.8:1 (minimum WCAG AA untuk teks kecil adalah 4.5:1).
  - **Fix**: Ubah warna teks grup navigasi ke `#94a3b8` (rasio kontras > 5.5:1).
  - **Suggested command**: `$impeccable polish views/partials/admin-header.ejs`

---

#### Persona Red Flags

- **Alex (Power User / Head of Sales & CMS Admin)**:
  - *Red flag*: Alur kerja terhambat karena tidak bisa langsung mengubah status RFQ dari dashboard; tombol "Kelola" membuang Alex ke halaman `/admin/leads` tanpa fokus baris.
  - *Red flag*: Tidak tersedianya shortcut keyboard (seperti `/` untuk cari lead, `n` untuk produk baru).
  - *Red flag*: Duplikasi tombol "+ Tambah Produk" di dua lokasi berdekatan mengindikasikan antarmuka belum dirapikan secara efisien.

- **Jordan (First-Timer / Staff Admin Operasional Baru)**:
  - *Red flag*: Terjebak oleh live search pada 5 data teratas; saat mencari RFQ klien lama dan tidak muncul, Jordan mengira data tersebut hilang atau belum masuk.
  - *Red flag*: Tombol "Ekspor CSV" di header tidak mencantumkan apa yang diekspor (leads, produk, atau log), menciptakan keraguan sebelum mengklik.
  - *Red flag*: Tidak ada tooltip atau bantuan yang menjelaskan alur status "Baru" → "Diproses" → "Selesai".

- **Sam (Accessibility-Dependent User / Navigasi Keyboard & Screen Reader)**:
  - *Red flag*: Filter pill status tidak memiliki atribut `aria-pressed="true/false"` atau `role="tab"`, sehingga pembaca layar tidak mengetahui pill mana yang sedang aktif.
  - *Red flag*: Indikator status koneksi `status-pulse-dot` hanya mengandalkan visual warna hijau tanpa penanda teks ARIA status live.
  - *Red flag*: Teks sub-kategori sidebar (`.nav-group-title`) redup dan sulit dibaca oleh pengguna dengan keterbatasan penglihatan kontras rendah.

---

#### Minor Observations
- Teks status header `MySQL Terhubung` bersifat statis hardcoded, bukan hasil pemeriksaan koneksi pool database aktual.
- Variasi ikon panah tidak konsisten (`&rarr;` horizontal, `&nearr;` serong ke atas).
- Nilai `lead.type` tidak memiliki fallback jika bernilai kosong/null, yang dapat menghasilkan badge kosong.

---

#### Questions to Consider
- "Apakah admin perlu bisa mengubah status RFQ (Baru -> Diproses -> Selesai) langsung dari baris tabel dashboard tanpa berpindah halaman?"
- "Apakah kartu metrik RFQ Baru harus diposisikan sebagai 'Hero Card' dengan sorotan warna khusus untuk mencerminkan urgensi bisnis B2B?"
- "Apakah bar Quick Actions sebaiknya diintegrasikan lebih ringkas ke dalam header halaman untuk menghemat ruang vertikal?"
