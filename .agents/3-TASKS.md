# TASKS: Website Company Profile PT Euodoo

## Ringkasan Status Task

- **Task Aktif Terbuka:** 6 Task (T-307 s/d T-312)
- **Total Task Selesai:** 306 Task (T-01 s/d T-306)
- **Arsip Task Lengkap:** Seluruh riwayat dan detail task historis disimpan di [archive/tasks-index-full.md](archive/tasks-index-full.md).
- **Aturan Penomoran Task Baru:** Setiap penambahan task implementasi baru WAJIB melanjutkan penomoran mulai dari **T-313**.

---

## Task Aktif / Terbuka (Open Tasks)

### Task T-307: Penambahan Token Warna Latar `--bg-soft-green` & Gradasi Transisi Halus
- **Status:** `[x] DONE`
- **Modul Spesifikasi:** `2-TECH-SPEC.md`, `Design/DESIGN.md`, `public/css/tokens.css`
- **Skill:** `Impeccable polish`
- **File Terdampak:** `public/css/tokens.css`, `Design/DESIGN.md`, `tests/test-t307-soft-green-tokens.js`
- **Acceptance Criteria:**
  - [x] Token `--bg-soft-green` (`#f3f6f3`), `--color-bg-soft-green`, `--trans-soft-green-to-subtle`, `--trans-subtle-to-soft-green`, dan `--color-text-muted-on-soft` (`#475569`) terdefinisi di `:root` pada `public/css/tokens.css` dan terdokumentasi di `Design/DESIGN.md` khusus cakupan halaman About & News.
  - [x] Token global `--bg-base` (`#ffffff`) dan `--bg-subtle` (`#f8fafc`) tidak berubah nilainya sehingga Homepage (`views/public/index.ejs`) dan halaman publik lain tetap identik 100%.
  - [x] Rasio kontras WCAG AA seluruh pasangan teks utama (`16.40:1`), teks varian (`8.55:1`), teks muted terkalibrasi (`6.96:1`), dan teks primary (`5.22:1`) di atas `--bg-soft-green` lulus `>= 4.5:1`.
- **Verifikasi:**
  - [x] Pemeriksaan formula kontras WCAG 2.1, `npm run lint` & `npm run lint:views` hijau (0 error), serta verifikasi computed token via Playwright di `tests/test-t307-soft-green-tokens.js` (4/4 lulus).

###  
- **Status:** `[x] DONE`
- **Modul Spesifikasi:** `prd/public-about.md` (`FR-26`), `tech/public-about.md`
- **Skill:** `Impeccable polish`, `antislop-code`
- **File Terdampak:** `views/public/about.ejs`, `public/css/components.css`, `public/js/main.js`, `locales/id.json`, `locales/en.json`, `tests/test-t308-about-backgrounds.js`
- **Acceptance Criteria:**
  - [x] Section pertama setelah hero (`.sec-story#sejarah`) memakai `var(--bg-soft-green)`, `.sec-vm#visi-misi` memakai `var(--bg-subtle)`, `.abt-tkt-section#core-values` mempertahankan latar foto + scrim yang menyatu di tepi (dengan fallback `var(--bg-soft-green)` bila tanpa foto), dan `.sec-gallery#galeri` memakai `var(--bg-subtle)`.
  - [x] Hero (`.page-hero`), CTA pra-footer (`.sec-cta`), dan Footer (`.site-footer`) tetap mempertahankan latar gambar/hijau gelapnya dan tidak ikut diselang-seling.
  - [x] Transisi antar-section menggunakan gradasi tepi pendek setinggi `48px` pada mobile (`< 768px`) dan `80px` pada desktop (`>= 768px`) melalui pseudo-element tanpa membentuk garis batas keras.
  - [x] Kartu statistik (`.story-stat`) dan kartu Visi & Misi (`.vm-card`) tetap memiliki batas yang jelas (`border: 1px solid var(--color-border)` dan `box-shadow: var(--shadow-level-1)`).
  - [x] Seluruh inline style pada `views/public/about.ejs` dipindahkan ke class CSS `.abt-*` tanpa mengubah perilaku galeri bento, lightbox, timeline, maupun accordion T-I-C-K-E-T.
- **Verifikasi:**
  - [x] `npm run lint:views` dan `npm run lint:i18n` hijau (0 error); pengujian Playwright di `tests/test-t308-about-backgrounds.js` (320px, 375px, 480px, 768px, 1024px, 1440px) memvalidasi warna latar tiap section, kartu kontras, transisi tepi 80px/48px, dan bebas horizontal overflow (6/6 lulus).

### Task T-309: Pemecahan Section Halaman News, Latar Selang-Seling, & Pembersihan Inline Style/Script (`views/public/news.ejs`)
- **Status:** `[ ] OPEN`
- **Modul Spesifikasi:** `prd/news.md` (`FR-12`, `FR-26`), `tech/news.md`
- **Skill:** `Impeccable polish`, `antislop-code`
- **File Terdampak:** `views/public/news.ejs`, `views/partials/news/headline-section.ejs`, `views/partials/news/filter-bar.ejs`, `public/css/components.css`, `public/js/news-filter.js`
- **Acceptance Criteria:**
  - [ ] `views/public/news.ejs` memiliki dua `<section>` konten di bawah `.page-hero`: `.nwl-sec-headline` (`var(--bg-soft-green)`) dan `.nwl-sec-directory` (`var(--bg-subtle)`) dengan gradasi tepi pendek (`48px` mobile, `80px` desktop) tanpa garis keras.
  - [ ] Section headline (`.nwl-sec-headline`) tetap tampil dan tidak disembunyikan oleh perubahan filter/tab direktori di bawahnya.
  - [ ] Tidak ada atribut `style="..."` statis maupun `<script>` inline di `views/public/news.ejs` dan partial turunannya (`<= 100` baris per partial); seluruh teks memakai `t('...')` di `locales/id.json` & `locales/en.json`.
  - [ ] Kartu berita (`.nwl-card`) tetap kontras dengan permukaan putih (`var(--color-surface)`), border token (`var(--color-border)`), dan shadow halus (`var(--shadow-level-1)`) di atas kedua latar.
- **Verifikasi:**
  - [ ] `npm run lint` dan `npm run lint:views` zero error; pengujian Playwright pada `/news` memverifikasi dua `<section>` terpisah beserta latar dan transisinya.

### Task T-310: Judul Section Headline Dinamis Mengikuti Jenis Artikel pada Slide Headline Aktif
- **Status:** `[ ] OPEN`
- **Modul Spesifikasi:** `prd/news.md` (`FR-24`, `FR-29`), `tech/news.md`
- **Skill:** `Impeccable polish`, `antislop-code`
- **File Terdampak:** `views/partials/news/headline-section.ejs`, `public/js/news-filter.js`, `locales/id.json`, `locales/en.json`
- **Acceptance Criteria:**
  - [ ] Kunci kamus baru untuk ke-3 jenis publikasi (`news.headline_title_berita`: `"Berita"` / `"News"`, `news.headline_title_pers`: `"Siaran Pers"` / `"Press Releases"`, `news.headline_title_blog`: `"Blog"` / `"Blog"`, beserta pasangan `news.headline_aria_berita`, `news.headline_aria_pers`, `news.headline_aria_blog`) tersedia simetris di `locales/id.json` dan `locales/en.json`; tidak ada judul `"Semua Publikasi"` pada `.nwl-headline-sec-title`.
  - [ ] Setiap elemen `.nwl-slide` memiliki atribut `data-post-type="<%= hPost.type %>"` (`berita`, `pers`, atau `blog`), dan container `#nwlHeadlineSlider` memuat atribut data terjemahan ketiga jenis tersebut.
  - [ ] Saat render SSR awal, `.nwl-headline-sec-title` dan `aria-label` `#nwlHeadlineSec` langsung merender label sesuai `headlinePosts[0].type` dalam bahasa aktif (ID/EN).
  - [ ] Setiap kali slide headline berganti (via tombol prev/next slider, dot indikator, swipe sentuh, atau autoplay), `.nwl-headline-sec-title` dan `aria-label` `#nwlHeadlineSec` otomatis berubah mengikuti `data-post-type` slide yang baru aktif, sedangkan perubahan tab filter/kategori/pencarian pada direktori di bawahnya tidak mengubah isi maupun judul slider headline.
- **Verifikasi:**
  - [ ] Pengujian otomatis Playwright: memicu perpindahan slide pada `#nwlHeadlineSlider` dan memverifikasi teks `.nwl-headline-sec-title` serta `aria-label` berubah sesuai `data-post-type` slide aktif dalam bahasa ID dan EN, serta tetap tidak terpengaruh saat tab filter di bawahnya diklik; `npm run lint` dan `npm run lint:i18n` hijau.

### Task T-311: Adaptasi Filter Kategori Geser Horizontal di Mobile (`.nwl-cat-pills`)
- **Status:** `[ ] OPEN`
- **Modul Spesifikasi:** `prd/news.md` (`FR-27`), `tech/news.md`
- **Skill:** `Impeccable adapt`
- **File Terdampak:** `public/css/components.css`, `public/js/news-filter.js`, `views/partials/news/filter-bar.ejs`
- **Acceptance Criteria:**
  - [ ] Pada viewport `< 768px` (termasuk 320px dan 375px), `.nwl-cat-pills` tampil dalam 1 baris horizontal tanpa membungkus ke baris baru (`flex-wrap: nowrap`), bebas scrollbar kasar (`scrollbar-width: none`), dan tidak memicu horizontal overflow pada `body`.
  - [ ] Terdapat petunjuk visual halus di tepi kanan/kiri saat daftar pill melampaui lebar kontainer sehingga pengguna tahu baris dapat digeser.
  - [ ] Pill kategori yang sedang `.active` otomatis terlihat di layar (`scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })` dengan penghormatan `prefers-reduced-motion`) saat halaman dimuat dan saat kategori dipilih.
  - [ ] Setiap `.nwl-cat-pill` memiliki tinggi minimal `44px`, jarak antar-pill yang aman, serta outline `:focus-visible` yang tidak terpotong oleh container scroll.
  - [ ] Form pencarian (`.nwl-search-form`) berada tepat di bawah baris pill kategori pada mobile dengan lebar 100% dan tinggi input/tombol minimal `44px`.
- **Verifikasi:**
  - [ ] Pengujian Playwright pada viewport 320px, 375px, 480px, 768px, 1024px, dan 1440px untuk memastikan semua pill berada dalam 1 baris di mobile (`scrollWidth > clientWidth` tanpa wrap, tinggi `>= 44px`) serta uji fokus keyboard `Tab` / `Shift+Tab`.

### Task T-312: Unifikasi Komponen Paginasi Bersama (`.pgn-*`), Tampilan Mobile Sesuai Referensi, & Verifikasi Playwright End-to-End
- **Status:** `[ ] OPEN`
- **Modul Spesifikasi:** `prd/news.md` (`FR-28`), `tech/news.md`, `tech/admin-ui.md`
- **Skill:** `Impeccable adapt`, `Impeccable polish`
- **File Terdampak:** `views/partials/pagination.ejs`, `views/public/news.ejs`, `controllers/public/postController.js`, `public/js/news-filter.js`, `public/css/components.css`, `locales/id.json`, `locales/en.json`
- **Acceptance Criteria:**
  - [ ] `views/partials/pagination.ejs` menjadi komponen tunggal bersama: pada `variant: 'admin'` mempertahankan `.pgn-left` (`Page jump` + `Rows per page`), sedangkan pada `variant: 'public'` merender bar paginasi terpusat dengan tautan `<a href="/news?...">` nyata untuk SSR/SEO dan menghapus class lama `.pagination-bar` / `.pagination-item` dari `public/css/components.css`.
  - [ ] Batas artikel per halaman pada `controllers/public/postController.js` tetap `limit = 9`, dan bar paginasi `.pgn-bar` **tetap ditampilkan** meskipun `totalPages === 1` (selama `posts.length > 0`) dengan tombol navigasi berstatus `disabled` seperti `tech/admin-ui.md`.
  - [ ] Desktop (`>= 768px`): menampilkan kontrol navigasi (`«`, `‹`), deret nomor halaman dengan elipsis (`...`), dan kontrol navigasi (`›`, `»`).
  - [ ] Mobile (`< 768px`): deret nomor halaman (`.pgn-pages`) disembunyikan; hanya menampilkan 4 tombol ikon persegi membulat (`[ « ]` Halaman Pertama, `[ ‹ ]` Halaman Sebelumnya, `[ › ]` Halaman Berikutnya, `[ » ]` Halaman Terakhir) berukuran minimal `44x44px` yang mengapit indikator ringkas `1 / 2` (`currentPage / totalPages`, `.pgn-mobile-info`) tepat di tengah, sesuai gambar referensi Azis.
  - [ ] Seluruh atribut `aria-label` pada `<nav>` dan ke-4 tombol navigasi (`«`, `‹`, `›`, `»`) menggunakan kunci kamus `t('pagination.*')` dalam dua bahasa (ID & EN), serta halaman aktif memiliki `aria-current="page"`.
  - [ ] Klik paginasi atau filter memperbarui grid artikel via Fetch API (`news-filter.js`), mereset ke halaman 1 saat filter/pencarian berubah, menyinkronkan URL browser (`?type=...&category=...&search=...&page=...`), menjaga canonical URL tetap akurat, dan tidak merusak paginasi di halaman-halaman tabel Admin CMS.
  - [ ] Regresi nol pada halaman About, News, Detail Artikel, Tabel Admin CMS, dan Homepage (320px, 375px, 480px, 768px, 1024px, 1440px, ID & EN, zero console error, `npm run lint` dan `npm run lint:views` hijau).
- **Verifikasi:**
  - [ ] Menjalankan `npm run lint`, `npm run lint:views`, `npm run lint:i18n`, serta **pengujian otomatis Playwright** pada seluruh breakpoint (`320px`, `375px`, `480px`, `768px`, `1024px`, `1440px`) dan bahasa (`ID` & `EN`).
