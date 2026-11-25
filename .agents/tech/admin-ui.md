Status: ACTIVE | Terakhir diverifikasi: 2026-11-11 | Kode: public/css/tokens.css, public/css/admin/tokens.css, public/css/admin/buttons.css, public/css/admin/forms-inputs.css, public/css/admin/pagination.css, public/js/admin-form-validation.js, public/js/admin.js, public/js/pagination.js, views/partials/pagination.ejs

# Tech Spec: Standar Komponen UI, Tombol, Paginasi & Validasi Form Admin (Admin UI)

## 1. Ruang Lingkup & Isolasi Class
Sub-modul ini mendefinisikan arsitektur teknis komponen tombol terpadu (`.adm-btn-*`), tampilan slug ringkas (`.adm-slug-text`), modul validasi formulir sisi klien (`public/js/admin-form-validation.js`), standarisasi dialog SweetAlert2, serta komponen paginasi bersama Varian 1 (`.pgn-*`) di panel Admin CMS tanpa mengubah class tombol publik (`.btn-*`) maupun paginasi berita (`.pagination-bar`). Spesifikasi dropdown kustom (`.eu-dd-*`) didelegasikan ke [tech/admin-ui-dropdown.md](admin-ui-dropdown.md), dan peta arsitektur CSS modular admin (`public/css/admin/*.css`, urutan cascade, isolasi token, dan kontrak pemuatan EJS) didelegasikan ke [tech/admin-ui-css.md](admin-ui-css.md) `[PENDING T-416..T-430]`.

---

## 2. Arsitektur Komponen Tombol Admin (`.adm-btn-*`)

### A. Token Desain (`public/css/admin/tokens.css`) `[PENDING T-416]`
- `--color-leaf-soft`: token warna dasar hijau lembut daun untuk tombol utama admin.
- `--adm-btn-primary-bg`: `var(--color-leaf-soft)`, `--adm-btn-primary-hover-bg`, `--adm-btn-primary-border`, `--adm-btn-primary-hover-border`, dan `--adm-btn-primary-text` (`var(--text-main)`).

### B. Struktur Class & Varian (`public/css/admin/buttons.css`) `[PENDING T-415, T-417]`
- **Base (`.adm-btn`):** `inline-flex`, `align-items: center`, `justify-content: center`, `gap: 6px`, `padding: 6px 14px`, `font-size: 12px`, `font-weight: 600`, `border-radius: var(--r-md)`, `box-shadow: var(--shadow-xs)`, `white-space: nowrap`, transisi berbasis `var(--ease)`.
- **Varian 1 - Primary (`.adm-btn-primary`):** Latar `var(--adm-btn-primary-bg)`, border `var(--adm-btn-primary-border)`, teks & ikon `var(--adm-btn-primary-text)` (WCAG AAA).
- **Varian 2 - Secondary (`.adm-btn-secondary`):** Latar `var(--bg-surface)`, border `var(--border-main)`, teks & ikon `var(--primary)`; hover memakai `var(--primary-subtle)`, `var(--primary-border)`, `var(--primary-hover)`.
- **Varian 3 - Neutral (`.adm-btn-neutral`):** Latar `var(--bg-surface)`, border `var(--border-main)`, teks & ikon `var(--text-secondary)`; hover memakai `var(--bg-subtle)`, `var(--text-main)` *(alias `.adm-btn-ghost` dihapus `[PENDING T-415]`)*.
- **Varian 4 - Danger (`.adm-btn-danger`):** Latar `var(--st-ditolak-bg)`, border `var(--st-ditolak-border)`, teks & ikon `var(--st-ditolak-text)` dengan state hover berbasis token `--danger-hover-*`.
- **Modifier Ukuran & State:** `.adm-btn-sm`, `.adm-btn-block`, `.is-loading` / `:disabled`, dan `min-height: 44px` pada `@media (max-width: 768px)` *(modifier `.adm-btn-lg` dan `.adm-btn-spinner` dihapus `[PENDING T-415]`)*.

### C. Animasi Mikro & Ikon SVG Kiri
- Setiap `.adm-btn` memuat tepat 1 ikon `<svg class="adm-btn-icon" aria-hidden="true">` (`14px x 14px`, `stroke-width="2"`).
- Efek hover di dalam `@media (hover: hover)` menggunakan `transform: translateY(-1px)` serta rotasi/translasi/skala ikon kontekstual, dan dinonaktifkan pada `@media (prefers-reduced-motion: reduce)`.

---

## 3. Standar Tampilan Slug Admin (`.adm-slug-text`)
- Di tabel daftar Produk, Artikel Berita, Merek, dan Kategori (`public/css/admin/forms-inputs.css` `[PENDING T-419]`), sub-baris slug dirender sebagai **1 baris slug tunggal** `<div class="adm-slug-text" title="<%= item.slug %>"><%= item.slug %></div>` (`font-family: var(--font-mono)`, `font-size: 11.5px`, `color: var(--text-muted)`, `max-width: clamp(140px, 28vw, 320px)`, `text-overflow: ellipsis`, `white-space: nowrap`) tanpa `&bull;`, tanpa judul EN, dan tanpa prefix `slug:`.

---

## 4. Modul Validasi Formulir Terpusat (`public/js/admin-form-validation.js`)
1. **Inisialisasi & Siklus Validasi:** Mengatur `novalidate` pada seluruh `<form>` admin; memvalidasi field standar dan komponen kustom (TinyMCE, Media Picker, `.eu-dd`, repeater WhatsApp, tabel ukuran) saat Submit, lalu memvalidasi secara *live* (`input`/`change`) pada field yang memiliki `data-had-error="true"`.
2. **Error Inline & Auto-Open Tab:** Menampilkan `<div class="adm-field-error" role="alert">` dengan token `var(--color-error)`, membuka panel tab tersembunyi bila diperlukan, melakukan smooth scroll ke field error pertama, dan mengunci tombol submit dengan `.is-loading` saat valid.

---

## 5. Dialog SweetAlert2 Bertema & Kepatuhan CSP
- Menggantikan `alert()` dan `confirm()` native dengan `window.showAdminAlert` dan `window.showAdminConfirm` di `public/js/admin.js` (`confirmButton: 'adm-btn adm-btn-danger'`, `cancelButton: 'adm-btn adm-btn-neutral'`), dengan gaya modal di `public/css/admin/modals-overlays.css` `[PENDING T-417]`.
- Seluruh interaksi menggunakan event delegation di script eksternal tanpa handler inline HTML.

---

## 6. Komponen Paginasi Bersama Varian 1 (`.pgn-*`)
1. **Berkas Komponen Bersama:**
   - Partial EJS: `views/partials/pagination.ejs` (menerima `pagination: { page, perPage, totalRows, totalPages, baseUrl, queryParams }`).
   - Modul Klien: `public/js/pagination.js` (`AbortController`, `history.pushState`/`popstate`, validasi input halaman, `aria-live="polite"`).
   - Kamus Lokalisasi: Kunci `pagination.*` (`page`, `of`, `rows_per_page`, `previous`, `next`, `first_page`, `last_page`, `go_to_page`) di `locales/id.json` dan `locales/en.json`.
2. **Anatomi & Styling Identik Varian 1 (`public/css/admin/pagination.css` `[PENDING T-422]`):**
   - `.pgn-bar`: kontainer flex (`justify-content: space-between`, `gap: 16px`, `padding: 10px 16px`, `background: var(--bg-surface)`, `border: 1px solid var(--border-main)`, `border-radius: var(--r-xl)`).
   - `.pgn-left`: `.pgn-page-jump` (`.pgn-page-input` `38x34px` + `of <totalPages>`), `.pgn-divider` (`1x18px`), `.pgn-per-page` (`<select class="pgn-per-page-select">` native ter-style tinggi `34px`).
   - `.pgn-nav`: tombol `.pgn-btn` (`<<`, `<`, `>`, `>>`) & nomor `.pgn-num` kotak `34x34px`; halaman aktif `.pgn-num.is-active` (`[aria-current="page"]`) memakai `var(--bg-subtle)` & `var(--text-main)`; `.pgn-ellipsis` untuk elipsis `1 2 3 ... 8 9 10`.
3. **State Interaksi, 1 Halaman, & Responsif Mobile:**
   - Hover dalam `@media (hover: hover)` memakai `var(--primary-subtle)`, `var(--primary-border)`, `var(--primary-hover)`; focus-visible memakai `outline: 2px solid var(--primary)`.
   - State 1 halaman (`totalPages <= 1`): `.pgn-bar` tetap tampil dengan tombol chevron `disabled`; mobile (`<= 768px`) menumpuk 2 baris dengan format ringkas (`<< < 2 / 10 > >>`) dan target sentuh `>= 44x44px`.
4. **Varian Publik Bersama (`.pgn-bar--public`):**
   - Partial `views/partials/pagination.ejs` mendukung `variant: 'public'` pada `/news` (`public/js/news-filter.js`): menyembunyikan `.pgn-left`, memusatkan `.pgn-nav` dengan tautan `<a href="...">` SSR nyata, menampilkan nomor elipsis desktop & format ringkas mobile, tetap tampil `disabled` saat `totalPages <= 1`, dan memakai `t('pagination.*')` dwibahasa.
