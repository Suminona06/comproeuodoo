Status: ACTIVE | Terakhir diverifikasi: 2026-11-17 | Kode: controllers/admin/settingController.js, services/settingService.js, services/settingMediaService.js, services/settingFooterService.js, models/settingModel.js, views/admin/settings/

# Tech Spec: Modul Pengaturan Situs (Site Settings)

## 1. Arsitektur & Komponen
Modul Pengaturan Situs bertindak sebagai penyimpan terpusat pasangan kunci-nilai (*key-value registry*) yang dimuat ke dalam memori aplikasi (`res.locals.settings`) melalui `settingsMiddleware.js` untuk digunakan di seluruh view publik dan admin.

---

## 2. Rute & Controller

| Method | Path | Controller / Handler | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/admin/settings` | `settingController.index` | `requireAuth`, `roleMiddleware(['superadmin'])` | Tinjauan form pengaturan CMS |
| `POST` | `/admin/settings` | `settingController.update` | `requireAuth`, `roleMiddleware(['superadmin'])`, `uploadMedia.fields(...)` | Update nilai setting & upload aset |

---

## 3. Skema Data Terkait

### Tabel `settings`
*File Migrasi:* `database/migrations/001_create_initial_schema.sql`, `009_revisi_footer_pengaturan_v1.sql`, `010_revisi_kontak_footer_v1.sql`, `011_revisi_footer_wa_filter_v1.sql`, `019_footer_dynamic_content_v1.sql`, `021_update_company_name_euodoo_plastic.sql`

| Kolom | Tipe | Nullable | Default | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `setting_key` | `VARCHAR(100)` | NO | - | Primary Key (identifikator unik) |
| `setting_value` | `TEXT` | YES | NULL | Nilai konfigurasi / teks / JSON |

---

## 4. Registri Kunci Pengaturan Aktif (Setting Keys Registry)

### A. Identitas & Branding
- `company_name`: Nama resmi korporat (`PT Euodoo Plastic`, migrasi `021` & `snapshot.json`).
- `company_tagline_id`, `company_tagline_en`: Slogan resmi korporat.
- `site_favicon`: Path berkas utama ikon browser persegi (simbol logo saja tanpa teks), disertai kunci ukuran turunan `site_favicon_16`, `site_favicon_32`, `site_favicon_180`, `site_favicon_192`, dan `site_favicon_512` di tabel `settings` (tanpa migrasi DDL baru).
- `site_logo_header`: Path berkas logo header navigasi atas.
- `site_logo_footer`: Path berkas logo footer berkontras tinggi.

### B. Alamat & Kontak Dual Lokasi Resmi
- **Head Office Jakarta:** `office_name_id`, `office_name_en`, `office_address`, `office_phone`, `office_fax`, `office_email`, `office_card_visible` (`'1'` atau `'0'`).
- **Factory Bandung:** `factory_name_id`, `factory_name_en`, `factory_address`, `factory_phone`, `factory_fax`, `factory_email`, `factory_working_hours_id`, `factory_working_hours_en`, `factory_card_visible` (`'1'` atau `'0'`).
- **Peta Google Maps:** `google_maps_embed`, `contact_maps_embed_url`.

### C. Media Sosial & Visibilitas
- `social_facebook_url`, `social_facebook_visible` (`'1'` atau `'0'`).
- `social_instagram_url`, `social_instagram_visible` (`'1'` atau `'0'`).
- `social_linkedin_url`, `social_linkedin_visible` (`'1'` atau `'0'`).
- `social_youtube_url`, `social_youtube_visible` (`'1'` atau `'0'`).

### D. Layanan WhatsApp
- `whatsapp_number`: Nomor telepon resmi (mis. `+628123456789`).
- `whatsapp_formatted_number`: Nomor format numerik bersih (mis. `628123456789`).
- `whatsapp_numbers_json`: Format JSON array multi-nomor rolling (`[{"number":"...","formatted":"...","label":"...","percentage":...}]`).
- `whatsapp_default_message`, `whatsapp_default_message_en`: Teks pembuka chat otomatis.
- `whatsapp_button_theme`: Variasi styling tema tombol mengambang.

### E. SEO Fallback Global
- `meta_title_id`, `meta_title_en`: Judul fallback global berawalan `PT Euodoo Plastic`.
- `meta_description_id`, `meta_description_en`: Deskripsi fallback global (`<head>` saja; terpisah dari `footer_desc_*`).

### F. Konten Footer Publik
- `footer_desc_id`, `footer_desc_en`, `footer_nav_links_json`: Dikelola via kartu CMS footer pada [tech/settings-footer.md](settings-footer.md).

---

## 5. Middleware Pemuat Pengaturan (`settingsMiddleware.js`)
- Middleware mengeksekusi `settingModel.getAllAsMap()` saat permintaan masuk dan menginjeksinya ke `res.locals.settings` (fallback default `company_name` adalah `'PT Euodoo Plastic'`).
- Menggunakan mekanisme caching internal sederhana (atau query cepat terindeks PK) sehingga seluruh template EJS dapat mengakses nilai pengaturan secara langsung tanpa query berulang di controller masing-masing halaman.

---

## 6. Penanganan Controller & Service (`settingController` & `setting*Service.js`) `[PENDING T-364]`
- **Modularisasi 3 Service:** `settingController.js` hanya memanggil `services/settingService.js` (`getSettingsMap`, `updateSettings`) tanpa akses langsung ke `settingModel` / `clearSettingsCache()`. Domain dipecah ke `settingService.js` (orkestrator, teks/kontak, WA, sosmed + re-export penuh kompatibel `settingsMiddleware.js` & test), `settingMediaService.js` (logo & favicon), dan `settingFooterService.js` (footer; [tech/settings-footer.md](settings-footer.md)), masing-masing `<= 300` baris dan fungsi `<= 40` baris.
- **Error Redirect Aman:** Error validasi/domain (`ValidationError`) menampilkan pesan spesifik di `?error=...`; error sistem/DB memakai pesan generik aman (detail dicatat via `logger.error`).
- **Toggle Visibilitas:** `office_card_visible` dan `factory_card_visible` dipaksa ke `'1'` atau `'0'`.
- **Validasi JSON Multi-Nomor WhatsApp:**
  1. Parsing aman `whatsapp_numbers_json`; tiap baris wajib berisi `number` (9–16 digit), `label` (trim & strip HTML, maks 50 char), dan `percentage` (integer 1–100).
  2. Akumulasi $\sum \text{percentage} === 100$; jika tidak, tolak penyimpanan. Bila kosong, nilai legacy `whatsapp_number` dipertahankan.
- **Generator Favicon (`generateFaviconSet`):** Dikelola `settingMediaService.js` ([tech/settings-assets.md](settings-assets.md): PNG 16/32/180/192/512 & `/favicon.ico`).
- **Cache Invalidation:** `settingService.js` memanggil `clearSettingsCache()` tepat setelah `settingModel.updateMany()` sukses.

---

## 7. Arsitektur View Admin Settings Modular & Token (.stg-*)
- **Orkestrator Halaman Ramping:** `views/admin/settings/index.ejs` bertindak sebagai template ramping (<50 baris) yang mengorkestrasikan partial per kartu section.
- **Daftar Partial Modular (`views/admin/settings/partials/`):**
  1. `visual-identity-card.ejs`: Favicon, logo header navbar, dan logo footer berkontras tinggi (panjang <= 100 baris).
  2. `corporate-identity-card.ejs`: Nama perusahaan (fallback default `PT Euodoo Plastic`), tagline, email, dan telepon (panjang <= 100 baris).
  3. `dual-location-card.ejs`: Alamat dual lokasi (Kantor Jakarta & Pabrik Bandung) serta embed Google Maps dengan placeholder aman (panjang <= 100 baris).
  4. `whatsapp-service-card.ejs`: Nomor resmi, tema tombol floating, salam pembuka, dan repeater rotasi multi-nomor (panjang <= 100 baris).
  5. `social-media-card.ejs`: Akun LinkedIn, Instagram, Facebook, dan YouTube serta toggle visibilitas (panjang <= 100 baris).
  6. `footer-content-card.ejs`: Deskripsi footer dwibahasa (`<= 350` char) dan repeater 0–4 menu kanan footer (spesifikasi detail pada [tech/settings-footer.md](settings-footer.md)).
- **Isolasi Class & Token:**
  - Seluruh penataan tata letak khusus settings menggunakan class berprefix unik `.stg-*` yang diisolasi pada `public/css/admin.css` (tanpa mengubah class bersama `.form-card`, `.form-group`, `.form-row-2`).
  - Dilarang keras menggunakan style inline dan warna hex mentah; seluruh styling merujuk ke token desain CSS resmi (`var(--bg-subtle)`, `var(--color-border)`, `var(--color-primary-dark)`, `var(--surface-dark-deep)`, `var(--color-leaf)`).
  - State preview media picker dikendalikan melalui class status semantik (`.is-empty`, `.has-preview`) tanpa inline style.
- **Kebersihan Markup:** Zero komentar HTML frontend; seluruh placeholder input di-escape secara aman.
