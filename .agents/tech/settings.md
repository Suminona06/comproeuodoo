Status: ACTIVE | Terakhir diverifikasi: 2026-10-21 | Kode: controllers/admin/settingController.js, models/settingModel.js, views/admin/settings/

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
*File Migrasi:* `database/migrations/001_create_initial_schema.sql`, `009_revisi_footer_pengaturan_v1.sql`, `010_revisi_kontak_footer_v1.sql`, `011_revisi_footer_wa_filter_v1.sql [PENDING T-238]`

| Kolom | Tipe | Nullable | Default | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `setting_key` | `VARCHAR(100)` | NO | - | Primary Key (identifikator unik) |
| `setting_value` | `TEXT` | YES | NULL | Nilai konfigurasi / teks / JSON |

---

## 4. Registri Kunci Pengaturan Aktif (Setting Keys Registry)

### A. Identitas & Branding
- `company_name`: Nama resmi korporat (`PT. EUODOO`).
- `company_tagline_id`, `company_tagline_en`: Slogan resmi korporat.
- `site_favicon`: Path berkas WebP/ICO ikon browser.
- `site_logo_header`: Path berkas logo header navigasi atas.
- `site_logo_footer`: Path berkas logo footer berkontras tinggi.

### B. Alamat & Kontak Dual Lokasi Resmi
- **Head Office Jakarta:** `office_name_id`, `office_name_en`, `office_address`, `office_phone`, `office_fax`, `office_email`, `office_card_visible` [PENDING T-238] (`'1'` atau `'0'`).
- **Factory Bandung:** `factory_name_id`, `factory_name_en`, `factory_address`, `factory_phone`, `factory_fax`, `factory_email`, `factory_working_hours_id`, `factory_working_hours_en`, `factory_card_visible` [PENDING T-238] (`'1'` atau `'0'`).
- **Peta Google Maps:** `google_maps_embed`, `contact_maps_embed_url`.

### C. Media Sosial & Visibilitas
- `social_facebook_url`, `social_facebook_visible` (`'1'` atau `'0'`).
- `social_instagram_url`, `social_instagram_visible` (`'1'` atau `'0'`).
- `social_linkedin_url`, `social_linkedin_visible` (`'1'` atau `'0'`).
- `social_youtube_url`, `social_youtube_visible` (`'1'` atau `'0'`).

### D. Layanan WhatsApp
- `whatsapp_number`: Nomor telepon resmi (mis. `+628123456789`).
- `whatsapp_formatted_number`: Nomor format numerik bersih (mis. `628123456789`).
- `whatsapp_numbers_json` [PENDING T-238]: Format JSON array multi-nomor rolling (`[{"number":"...","formatted":"...","label":"...","percentage":...}]`).
- `whatsapp_default_message`, `whatsapp_default_message_en`: Teks pembuka chat otomatis.
- `whatsapp_button_theme`: Variasi styling tema tombol mengambang.

### E. SEO Fallback Global
- `meta_title_id`, `meta_title_en`: Judul fallback global.
- `meta_description_id`, `meta_description_en`: Deskripsi fallback global.

---

## 5. Middleware Pemuat Pengaturan (`settingsMiddleware.js`)
- Middleware mengeksekusi `settingModel.getAllAsMap()` saat permintaan masuk dan menginjeksinya ke `res.locals.settings`.
- Menggunakan mekanisme caching internal sederhana (atau query cepat terindeks PK) sehingga seluruh template EJS dapat mengakses nilai pengaturan secara langsung tanpa query berulang di controller masing-masing halaman.

---

## 6. Penanganan Controller & Validasi Server-Side (`settingController.update`) [PENDING T-239]
- **Validasi Toggle Switch Visibilitas:** Nilai `office_card_visible` dan `factory_card_visible` dipaksa ke format biner string `'1'` atau `'0'`.
- **Validasi Skema JSON Multi-Nomor WhatsApp:**
  1. Parsing aman payload JSON `whatsapp_numbers_json`.
  2. Setiap baris wajib memiliki `number` (hanya karakter angka dan simbol plus dengan panjang 9-16 digit), `label` (string internal yang ditrim dan disanitasi dari tag HTML, maks 50 karakter), dan `percentage` (integer 1-100).
  3. Validasi akumulasi matematis: $\sum \text{percentage} === 100$. Jika tidak sama dengan 100, lempar error validasi dan batalkan penyimpanan.
  4. Fallback transparan: Jika payload tidak disertakan / kosong, nilai legacy `whatsapp_number` tetap dipertahankan.
- **Cache Invalidation:** Memanggil `clearSettingsCache()` untuk membersihkan memory cache segera setelah update berhasil dieksekusi.
