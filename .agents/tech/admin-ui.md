Status: ACTIVE | Terakhir diverifikasi: 2026-11-03 | Kode: public/css/tokens.css, public/css/admin.css, public/js/admin-form-validation.js, public/js/admin.js, views/admin/

# Tech Spec: Standar Komponen UI, Tombol & Validasi Form Admin (Admin UI)

## 1. Ruang Lingkup & Isolasi Class
Sub-modul ini mendefinisikan arsitektur teknis komponen tombol terpadu (`.adm-btn-*`), tampilan slug ringkas (`.adm-slug-text`), modul validasi formulir sisi klien (`public/js/admin-form-validation.js`), serta standarisasi dialog SweetAlert2 di seluruh panel Admin CMS tanpa menyentuh atau mengubah class tombol publik (`.btn`, `.btn-primary`, `.btn-secondary`) di `public/css/components.css`.
Spesifikasi teknis komponen dropdown kustom terpadu (`.eu-dd-*`) didelegasikan ke sub-modul terpisah [tech/admin-ui-dropdown.md](admin-ui-dropdown.md).

---

## 2. Arsitektur Komponen Tombol Admin (`.adm-btn-*`)

### A. Token Desain Baru (`public/css/tokens.css` & `public/css/admin.css`)
- `--color-leaf-soft`: token warna dasar hijau lembut daun untuk tombol utama admin.
- `--adm-btn-primary-bg`: `var(--color-leaf-soft)`
- `--adm-btn-primary-hover-bg`: gradasi hover hijau lembut daun yang lebih tegas.
- `--adm-btn-primary-border`: border hijau pendamping (`var(--primary-border)` / `var(--primary)`).
- `--adm-btn-primary-text`: `var(--surface-dark-deep)` (`var(--text-main)`).

### B. Struktur Class & Varian (`public/css/admin.css`)
- **Base (`.adm-btn`):** `display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 14px; font-size: 12px; font-weight: 600; line-height: 1.4; border-radius: var(--r-md); box-shadow: var(--shadow-xs); cursor: pointer; text-decoration: none; white-space: nowrap; transition: transform var(--ease), opacity var(--ease), background-color var(--ease), border-color var(--ease), color var(--ease), box-shadow var(--ease);`
- **Varian 1 - Primary (`.adm-btn-primary`):** Latar `var(--adm-btn-primary-bg)`, border `1px solid var(--adm-btn-primary-border)`, teks & ikon `var(--adm-btn-primary-text)`. Rasio kontras **13.91:1 s/d 14.15:1** (Lulus WCAG AAA).
- **Varian 2 - Secondary (`.adm-btn-secondary`, Acuan Tabel Ukuran):** Latar `var(--bg-surface)`, border `1px solid var(--border-main)`, teks & ikon `var(--primary)` (kontras **5.66:1** Lulus WCAG AA); saat hover latar `var(--primary-subtle)`, border `var(--primary-border)`, teks `var(--primary-hover)` (kontras **7.59:1** Lulus WCAG AAA).
- **Varian 3 - Neutral / Ghost (`.adm-btn-neutral` / `.adm-btn-ghost`):** Latar `var(--bg-surface)`, border `1px solid var(--border-main)`, teks & ikon `var(--text-secondary)` (kontras **10.36:1** Lulus WCAG AAA); saat hover latar `var(--bg-subtle)`, teks `var(--text-main)`.
- **Varian 4 - Danger (`.adm-btn-danger`):** Latar `var(--st-ditolak-bg)`, border `1px solid var(--st-ditolak-border)`, teks & ikon `var(--st-ditolak-text)` (kontras **7.02:1** Lulus WCAG AAA).
- **Modifier Ukuran & State:**
  - `.adm-btn-sm`: ukuran kompak untuk aksi baris tabel (`padding: 5px 10px; font-size: 11.5px;`).
  - `.adm-btn-block`: lebar penuh (`width: 100%;`).
  - `.is-loading` / `:disabled`: `opacity: 0.65; pointer-events: none;` dengan indikator spinner SVG saat form dikirim.
  - Pada viewport mobile (`@media (max-width: 768px)`), seluruh `.adm-btn` wajib memiliki `min-height: 44px`.

### C. Animasi Mikro & Ikon SVG Kiri
- Setiap `.adm-btn` memuat tepat 1 ikon `<svg class="adm-btn-icon" aria-hidden="true">` berukuran `14px x 14px` (`stroke-width="2"`) di sisi kiri label.
- Efek hover dibungkus di dalam `@media (hover: hover)`:
  - Tombol bergerak halus `transform: translateY(-1px)`.
  - Ikon SVG memiliki transisi `transform` kontekstual: rotasi `rotate(90deg)` untuk ikon tambah (`plus`), translasi `translateX(-2px)` untuk panah kembali (`arrow-left`), dan skala halus `scale(1.08)` untuk ikon simpan/unduh/hapus.
- Pada interaksi sentuh (`:active`), tombol kembali ke `transform: translateY(0)`.
- Pada `@media (prefers-reduced-motion: reduce)`, seluruh transisi `transform` dinonaktifkan (`transition: none; transform: none !important;`).

---

## 3. Standar Tampilan Slug Admin (`.adm-slug-text`)
- Di tabel daftar Produk (`views/admin/products/index.ejs`), Artikel Berita (`views/admin/posts/index.ejs`), Merek (`views/admin/brands/index.ejs`), dan Kategori (`product-categories/index.ejs`, `post-categories/index.ejs`), sub-baris slug dirender sebagai **1 baris slug tunggal** menggunakan `<div class="adm-slug-text" title="<%= item.slug %>"><%= item.slug %></div>` tanpa karakter `&bull;`, tanpa judul bahasa Inggris (`name_en` / `title_en`), dan tanpa awalan kata `slug:`.
- Di form edit Produk (`views/admin/products/edit.ejs`), slug kanonik ditampilkan satu baris menggunakan `.adm-slug-box` read-only; di form tambah/edit Artikel Berita (`views/admin/posts/{create,edit}.ejs`), grup input `#slug` (`maxlength="191"`) menggunakan class `.adm-slug-input-group` tanpa inline style.
- Definisi `.adm-slug-text`: `font-family: var(--font-mono); font-size: 11.5px; color: var(--text-muted); max-width: clamp(140px, 28vw, 320px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;`.

---

## 4. Modul Validasi Formulir Terpusat (`public/js/admin-form-validation.js`)
1. **Inisialisasi:** Mengatur atribut `novalidate` pada seluruh `<form>` di area admin dan mendaftarkan listener `submit` terpusat.
2. **Siklus Validasi (Mode Submit + Live Pasca-Error):**
   - Saat tombol Submit ditekan, modul memeriksa seluruh field standar (`required`, `maxlength`, `minlength`, `pattern`, `type="email"`, `type="url"`, `type="number"`, `min`, `max`) dan kontrol kustom (`TinyMCE` via `tinymce.get(id).getContent({ format: 'text' }).trim()`, `.media-picker-component input[type="hidden"][required]`, repeater WhatsApp `total === 100%`, tabel ukuran produk, serta dropdown kustom `.eu-dd`).
   - Field yang gagal diberi penanda `data-had-error="true"`, class `.is-invalid`, atribut `aria-invalid="true"`, dan `aria-describedby` yang menunjuk ke elemen `<div class="adm-field-error" role="alert">` berisi ikon SVG peringatan kecil dan pesan sesuai bahasa aktif (`document.documentElement.lang` / `ID` atau `EN`).
   - Begitu sebuah field memiliki `data-had-error="true"`, listener `input` dan `change` pada field tersebut langsung memvalidasi ulang secara *live* dan menghapus state error seketika saat nilai sudah valid.
3. **Auto-Open Tab & Auto-Scroll:** Jika field error pertama berada di dalam panel tab yang tersembunyi (`.about-tab-pane`, `.settings-tab-pane`, atau panel tab admin lainnya), modul otomatis mengaktifkan tombol tab terkait sebelum memanggil `scrollIntoView({ behavior: 'smooth', block: 'center' })` dan `.focus()`.
4. **Pencegahan Kirim Ganda:** Saat seluruh field valid, tombol submit dikunci dengan class `.is-loading` dan `disabled = true`.

---

## 5. Dialog SweetAlert2 Bertema & Kepatuhan CSP
- Seluruh pemanggilan `alert()` dan `confirm()` native di script maupun template admin diganti dengan helper `window.showAdminAlert(options)` dan `window.showAdminConfirm(options)` di `public/js/admin.js` berbasis SweetAlert2 (`buttonsStyling: false`).
- Konfirmasi hapus wajib menggunakan `customClass: { confirmButton: 'adm-btn adm-btn-danger', cancelButton: 'adm-btn adm-btn-neutral' }`.
- Seluruh event handler inline (`onclick`, `onchange`, `onsubmit`, `oninput`, `onerror`) pada template admin dipindahkan ke event delegation di script eksternal agar 100% patuh terhadap Content Security Policy (CSP).
- Modal admin (`.admin-modal-card`, `.media-picker-modal`) menggunakan `max-height: calc(100vh - 32px)` dengan body scrollable (`overflow-y: auto`) dan footer sticky agar tombol `Batal`/`Simpan` selalu terlihat pada ketinggian layar `600px`-`768px` dan tingkat zoom `100%`/`125%`/`150%`.

