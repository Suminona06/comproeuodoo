Status: ACTIVE | Terakhir diverifikasi: 2026-10-30 | Kode: views/public/contact.ejs, controllers/public/contactController.js, views/partials/footer.ejs

# Tech Spec: Modul Kontak, Footer & WhatsApp (Contact, Footer & WhatsApp)

## 1. Arsitektur & Komponen
Modul ini menangani penerimaan prospek B2B melalui formulir RFQ, pencatatan ke tabel `inquiries`, pengiriman notifikasi email via Nodemailer, penyajian data dual lokasi, footer global, dan floating WhatsApp.

---

## 2. Rute & Controller

| Method | Path | Controller / Handler | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/contact` | `contactController.index` | `seoMiddleware`, `i18nMiddleware` | Render halaman Kontak & RFQ |
| `POST` | `/contact` | `contactController.submit` | `leadLimiter`, `csrfMiddleware` | Proses submisi formulir RFQ |
| `POST` | `/leads` | `contactController.submit` | `leadLimiter`, `csrfMiddleware` | Endpoint alias kompatibilitas formulir |
| `GET` | `/admin/contact` | `contactCmsController.index` | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | CMS konten teks halaman kontak |
| `POST` | `/admin/contact` | `contactCmsController.update`| `requireAuth`, `roleMiddleware` | Update teks hero kontak |

---

## 3. Skema Data Terkait

### A. Tabel `inquiries`
*File Migrasi:* `database/migrations/001_create_initial_schema.sql`, `003_upgrade_v2_schema.sql`

| Kolom | Tipe | Nullable | Default | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Inc | Primary Key |
| `type` | `ENUM('inquiry','partnership','general')` | YES | `'inquiry'` | Kategori permintaan B2B |
| `name` | `VARCHAR(100)` | NO | - | Nama lengkap pengirim |
| `company` | `VARCHAR(100)` | YES | NULL | Nama instansi / perusahaan |
| `email` | `VARCHAR(100)` | NO | - | Alamat email bisnis |
| `phone` | `VARCHAR(30)` | NO | - | Nomor telepon / WhatsApp |
| `product_id` | `INT` | YES | NULL | Foreign Key ke `products.id` |
| `quantity` | `VARCHAR(100)` | YES | NULL | Estimasi volume kebutuhan |
| `message` | `TEXT` | YES | NULL | Rincian pesan & spesifikasi |
| `source` | `ENUM('contact_form','wa_product')` | YES | `'contact_form'` | Kanal asal prospek |
| `status` | `ENUM('baru','dibaca','ditindaklanjuti','ditolak')` | YES | `'baru'` | Status penanganan tim sales |
| `admin_notes` | `TEXT` | YES | NULL | Catatan internal sales |
| `ip_address` | `VARCHAR(45)` | YES | NULL | IP pengirim untuk audit log |
| `created_at` | `TIMESTAMP` | YES | Current Time | Waktu submisi |

### B. Kunci Pengaturan Kontak & Footer (`settings`)
*File Migrasi:* `009_revisi_footer_pengaturan_v1.sql`, `010_revisi_kontak_footer_v1.sql`, `011_revisi_footer_wa_filter_v1.sql`
- Head Office: `office_name_*`, `office_address`, `office_phone`, `office_fax`, `office_email`, `office_card_visible` (`'1'`/`'0'`).
- Factory: `factory_name_*`, `factory_address`, `factory_phone`, `factory_fax`, `factory_email`, `factory_working_hours_*`, `factory_card_visible` (`'1'`/`'0'`).
- Maps: `contact_maps_embed_url` / `google_maps_embed`.
- Social Media: `social_facebook_url`, `social_facebook_visible`, `social_instagram_url`, `social_instagram_visible`, `social_linkedin_url`, `social_linkedin_visible`, `social_youtube_url`, `social_youtube_visible`.
- WhatsApp: `whatsapp_number`, `whatsapp_default_message`, `whatsapp_default_message_en`, `whatsapp_formatted_number`, `whatsapp_numbers_json` (JSON array: `number`, `formatted`, `label`, `percentage`).
- Global CTA: `global_cta_title_*`, `global_cta_subtitle_*`, `global_cta_btn1_*`, `global_cta_btn2_*`, `global_cta_pages_json`, `global_cta_is_active`.

---

## 4. Komponen Antarmuka & Prefix CSS
- **Formulir RFQ:** `.cf-section`, `.cf-form-wrap`, `.cf-form`, `.cf-form-row`, `.cf-form-group`, `.cf-label`, `.cf-label-required`, `.cf-input`, `.cf-select`, `.cf-textarea`, `.cf-btn-submit`, `.cf-alert`, `.cf-alert-success`, `.cf-alert-error`.
- **Kartu Lokasi & Peta:** `.cf-office-card`, `.cf-office-header`, `.cf-office-icon`, `.cf-office-badge`, `.cf-office-name`, `.cf-office-addr`, `.cf-office-detail`, `.cf-maps-wrap`, `.cf-maps-iframe`.
- **Footer:** `.site-footer`, `.footer-grid`, `.footer-col`, `.ft-offices`, `.ft-office-card`, `.footer-contact-item`, `.footer-social-wrap`, `.footer-social-link`.
- **Floating Button WhatsApp:** `.wa-float-container`, `.wa-float-btn`, `.wa-icon`, `.wa-tooltip`.
- **Hero Scrim Sub-Page:** `.page-hero-scrim` (multi-layer directional gradient transparan selaras dengan home slide 2).

---

## 5. Keamanan & Rate Limiting
- **Rate Limiting:** `middleware/rateLimiter.js` (`leadLimiter`) membatasi maksimal 10 submisi per IP per interval 15 menit.
- **CSRF & Sanitasi:** Formulir memverifikasi token CSRF dan melakukan `trim()` serta sanitasi karakter input sebelum menyimpan ke tabel `inquiries`.
- **Notifikasi Email Asinkron:** Menggunakan `utils/mailer.js` untuk mengirimkan ringkasan data RFQ ke email sales secara asinkron tanpa memblokir respons HTTP ke pengguna.

---

## 6. Logika Fungsional Khusus

### A. Algoritma Rolling WhatsApp Berbobot di Server (SSR)
1. Server mengecek `settings.whatsapp_numbers_json`.
2. Jika string JSON valid dan $\sum percentage === 100$:
   - Bangkitkan nilai acak integer $R \in [1, 100]$.
   - Cari nomor dengan rentang akumulasi persentase $\ge R$.
   - Cetak nomor aktif ke elemen `<a href="https://wa.me/<nomor>?text=...">`. Nomor lainnya tidak dicetak ke HTML publik.
3. Fallback: Jika data JSON kosong atau tidak valid, baca setting tunggal legacy `whatsapp_formatted_number` atau `whatsapp_number`.

### B. Standardisasi Filter Hero Banner Sub-Page
- Aturan visual `.page-hero-scrim` pada `views/public/products.ejs`, `views/public/news.ejs`, `views/public/contact.ejs`, dan `views/public/about.ejs` menerapkan gradasi terkalibrasi multi-stop mengikuti pola `.hero-slide-image .hero-grad` beranda.
- Gambar latar belakang fasilitas pabrik terlihat jernih dan nyata, aksen hijau brand (`var(--color-primary-dark)` / `var(--color-primary)`) berbaur secara lembut, dan seluruh teks judul, subjudul, serta remah roti (*breadcrumb*) memenuhi batas rasio kontras aksesibilitas WCAG AA (minimal 4.5:1 untuk teks normal dan 3.0:1 untuk teks tebal/besar).
