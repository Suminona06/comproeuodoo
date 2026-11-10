Status: ACTIVE | Terakhir diverifikasi: 2026-11-03 | Kode: public/css/tokens.css, public/css/admin.css, public/js/admin-form-validation.js, public/js/admin.js, public/js/pagination.js, views/partials/pagination.ejs

# Tech Spec: Standar Komponen UI, Tombol, Paginasi & Validasi Form Admin (Admin UI)

## 1. Ruang Lingkup & Isolasi Class
Sub-modul ini mendefinisikan arsitektur teknis komponen tombol terpadu (`.adm-btn-*`), tampilan slug ringkas (`.adm-slug-text`), modul validasi formulir sisi klien (`public/js/admin-form-validation.js`), standarisasi dialog SweetAlert2, serta komponen paginasi bersama Varian 1 (`.pgn-*`) di panel Admin CMS tanpa mengubah class tombol publik (`.btn-*`) maupun paginasi berita (`.pagination-bar`). Spesifikasi dropdown kustom (`.eu-dd-*`) didelegasikan ke [tech/admin-ui-dropdown.md](admin-ui-dropdown.md).

---

## 2. Arsitektur Komponen Tombol Admin (`.adm-btn-*`)

### A. Token Desain (`public/css/tokens.css` & `public/css/admin.css`)
- `--color-leaf-soft`: token warna dasar hijau lembut daun untuk tombol utama admin.
- `--adm-btn-primary-bg`: `var(--color-leaf-soft)`
- `--adm-btn-primary-hover-bg`: gradasi hover hijau lembut daun yang lebih tegas.
- `--adm-btn-primary-border`: border hijau pendamping (`var(--primary-border)` / `var(--primary)`).
- `--adm-btn-primary-text`: `var(--surface-dark-deep)` (`var(--text-main)`).

### B. Struktur Class & Varian (`public/css/admin.css`)
- **Base (`.adm-btn`):** `display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 14px; font-size: 12px; font-weight: 600; line-height: 1.4; border-radius: var(--r-md); box-shadow: var(--shadow-xs); cursor: pointer; text-decoration: none; white-space: nowrap; transition: transform var(--ease), opacity var(--ease), background-color var(--ease), border-color var(--ease), color var(--ease), box-shadow var(--ease);`
- **Varian 1 - Primary (`.adm-btn-primary`):** Latar `var(--adm-btn-primary-bg)`, border `1px solid var(--adm-btn-primary-border)`, teks & ikon `var(--adm-btn-primary-text)` (Lulus WCAG AAA).
- **Varian 2 - Secondary (`.adm-btn-secondary`):** Latar `var(--bg-surface)`, border `1px solid var(--border-main)`, teks & ikon `var(--primary)`; saat hover latar `var(--primary-subtle)`, border `var(--primary-border)`, teks `var(--primary-hover)`.
- **Varian 3 - Neutral / Ghost (`.adm-btn-neutral` / `.adm-btn-ghost`):** Latar `var(--bg-surface)`, border `1px solid var(--border-main)`, teks & ikon `var(--text-secondary)`; saat hover latar `var(--bg-subtle)`, teks `var(--text-main)`.
- **Varian 4 - Danger (`.adm-btn-danger`):** Latar `var(--st-ditolak-bg)`, border `1px solid var(--st-ditolak-border)`, teks & ikon `var(--st-ditolak-text)`.
- **Modifier Ukuran & State:** `.adm-btn-sm`, `.adm-btn-block`, `.is-loading` / `:disabled`, dan `min-height: 44px` pada `@media (max-width: 768px)`.

### C. Animasi Mikro & Ikon SVG Kiri
- Setiap `.adm-btn` memuat tepat 1 ikon `<svg class="adm-btn-icon" aria-hidden="true">` (`14px x 14px`, `stroke-width="2"`).
- Efek hover di dalam `@media (hover: hover)` menggunakan `transform: translateY(-1px)` serta rotasi/translasi/skala ikon kontekstual, dan dinonaktifkan pada `@media (prefers-reduced-motion: reduce)`.

---

## 3. Standar Tampilan Slug Admin (`.adm-slug-text`)
- Di tabel daftar Produk, Artikel Berita, Merek, dan Kategori, sub-baris slug dirender sebagai **1 baris slug tunggal** `<div class="adm-slug-text" title="<%= item.slug %>"><%= item.slug %></div>` (`font-family: var(--font-mono); font-size: 11.5px; color: var(--text-muted); max-width: clamp(140px, 28vw, 320px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;`) tanpa `&bull;`, tanpa judul EN, dan tanpa prefix `slug:`.

---

## 4. Modul Validasi Formulir Terpusat (`public/js/admin-form-validation.js`)
1. **Inisialisasi & Siklus Validasi:** Mengatur `novalidate` pada seluruh `<form>` admin; memvalidasi field standar dan komponen kustom (TinyMCE, Media Picker, `.eu-dd`, repeater WhatsApp, tabel ukuran) saat Submit, lalu memvalidasi secara *live* (`input`/`change`) pada field yang memiliki `data-had-error="true"`.
2. **Error Inline & Auto-Open Tab:** Menampilkan `<div class="adm-field-error" role="alert">` dengan token `var(--color-error)`, membuka panel tab tersembunyi bila diperlukan, melakukan smooth scroll ke field error pertama, dan mengunci tombol submit dengan `.is-loading` saat valid.

---

## 5. Dialog SweetAlert2 Bertema & Kepatuhan CSP
- Menggantikan `alert()` dan `confirm()` native dengan `window.showAdminAlert` dan `window.showAdminConfirm` di `public/js/admin.js` (`confirmButton: 'adm-btn adm-btn-danger'`, `cancelButton: 'adm-btn adm-btn-neutral'`).
- Seluruh interaksi menggunakan event delegation di script eksternal tanpa handler inline HTML.

---

## 6. Komponen Paginasi Bersama Varian 1 (`.pgn-*`)
1. **Berkas Komponen Bersama:**
   - Partial EJS: `views/partials/pagination.ejs` (menerima `pagination: { page, perPage, totalRows, totalPages, baseUrl, queryParams }`).
   - Modul Klien: `public/js/pagination.js` (menangani navigasi tanpa reload, `AbortController` pembatal request lama saat klik beruntun, sinkronisasi `history.pushState` & listener `popstate`, validasi input halaman, fokus & pengumuman `aria-live="polite"`).
   - Kamus Lokalisasi: Kunci `pagination.*` (`page`, `of`, `rows_per_page`, `previous`, `next`, `first_page`, `last_page`, `go_to_page`) di `locales/id.json` dan `locales/en.json`.
2. **Anatomi & Styling Identik Varian 1 (`public/css/admin.css`):**
   - `.pgn-bar`: `display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 16px; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--r-xl, 12px);` (tanpa kartu abu-abu pembungkus luar).
   - `.pgn-left`:
     - `.pgn-page-jump`: label `Page` + `<input type="text" inputmode="numeric" class="pgn-page-input">` (`width: 38px; height: 34px; border: 1px solid var(--border-main); border-radius: var(--r-md, 8px); text-align: center; font-weight: 600; color: var(--text-main); background: var(--bg-surface)`) + teks `of <totalPages>`.
     - `.pgn-divider`: pemisah vertikal `width: 1px; height: 18px; background: var(--border-main)`.
     - `.pgn-per-page`: label `Rows per page` + `<select class="pgn-per-page-select">` native ter-style (`height: 34px; padding: 0 28px 0 10px; border: 1px solid var(--border-main); border-radius: var(--r-md, 8px); font-weight: 600; color: var(--text-main); background-color: var(--bg-surface)` dengan ikon chevron SVG).
   - `.pgn-nav` (Sisi Kanan):
     - `.pgn-btn` (`.pgn-btn--first` `<<`, `.pgn-btn--prev` `<`, `.pgn-btn--next` `>`, `.pgn-btn--last` `>>`): tombol kotak `34x34px`, `border: 1px solid var(--border-main)`, `border-radius: var(--r-md, 8px)`, `background: var(--bg-surface)`, `color: var(--text-secondary)`.
     - `.pgn-num`: nomor halaman `34x34px`, `border-radius: var(--r-md, 8px)`, `background: transparent`, `color: var(--text-secondary)`, `font-weight: 500`.
     - `.pgn-num.is-active` (`[aria-current="page"]`): latar abu muda netral `var(--bg-subtle)`, `color: var(--text-main)`, `font-weight: 700`.
     - `.pgn-ellipsis`: indikator `...` untuk deret halaman panjang (`1 2 3 ... 8 9 10`).
3. **State Interaksi, 1 Halaman, & Responsif Mobile:**
   - Hover di dalam `@media (hover: hover)`: `.pgn-btn:not(:disabled):hover` dan `.pgn-num:not(.is-active):hover` memakai `background: var(--primary-subtle); border-color: var(--primary-border); color: var(--primary-hover)`.
   - Focus-visible: `outline: 2px solid var(--primary); outline-offset: 2px`.
   - State 1 Halaman (`totalPages <= 1`): `.pgn-bar` tetap tampil utuh dengan keempat tombol chevron berstatus `disabled` (`opacity: 0.45; cursor: not-allowed`).
   - Mobile (`@media (max-width: 768px)`): `.pgn-bar` ditumpuk 2 baris, deret nomor halaman diringkas (`<< < 2 / 10 > >>`), dan target sentuh seluruh kontrol minimal `44x44px`.
