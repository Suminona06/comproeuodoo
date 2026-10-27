Status: ACTIVE | Terakhir diverifikasi: 2026-10-21 | Kode: views/public/contact.ejs, controllers/public/contactController.js, views/partials/footer.ejs

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
*File Migrasi:* `009_revisi_footer_pengaturan_v1.sql`, `010_revisi_kontak_footer_v1.sql`
- Head Office: `office_name_*`, `office_address`, `office_phone`, `office_fax`, `office_email`.
- Factory: `factory_name_*`, `factory_address`, `factory_phone`, `factory_fax`, `factory_email`, `factory_working_hours_*`.
- Maps: `contact_maps_embed_url` / `google_maps_embed`.
- Social Media: `social_facebook_url`, `social_facebook_visible`, `social_instagram_url`, `social_instagram_visible`, `social_linkedin_url`, `social_linkedin_visible`, `social_youtube_url`, `social_youtube_visible`.
- WhatsApp: `whatsapp_number`, `whatsapp_default_message`, `whatsapp_default_message_en`, `whatsapp_formatted_number`.
- Global CTA: `global_cta_title_*`, `global_cta_subtitle_*`, `global_cta_btn1_*`, `global_cta_btn2_*`, `global_cta_pages_json`, `global_cta_is_active`.

---

## 4. Komponen Antarmuka & Prefix CSS
- **Formulir RFQ:** `.cf-section`, `.cf-form-wrap`, `.cf-form`, `.cf-form-row`, `.cf-form-group`, `.cf-label`, `.cf-label-required`, `.cf-input`, `.cf-select`, `.cf-textarea`, `.cf-btn-submit`, `.cf-alert`, `.cf-alert-success`, `.cf-alert-error`.
- **Kartu Lokasi & Peta:** `.cf-office-card`, `.cf-office-header`, `.cf-office-icon`, `.cf-office-badge`, `.cf-office-name`, `.cf-office-addr`, `.cf-office-detail`, `.cf-maps-wrap`, `.cf-maps-iframe`.
- **Footer:** `.site-footer`, `.footer-grid`, `.footer-col`, `.footer-contact-item`, `.footer-social-wrap`, `.footer-social-link`.
- **Floating Button WhatsApp:** `.wa-floating-btn`, `.wa-icon-svg`.

---

## 5. Keamanan & Rate Limiting
- **Rate Limiting:** `middleware/rateLimiter.js` (`leadLimiter`) membatasi maksimal 10 submisi per IP per interval 15 menit.
- **CSRF & Sanitasi:** Formulir memverifikasi token CSRF dan melakukan `trim()` serta sanitasi karakter input sebelum menyimpan ke tabel `inquiries`.
- **Notifikasi Email Asinkron:** Menggunakan `utils/mailer.js` untuk mengirimkan ringkasan data RFQ ke email sales secara asinkron tanpa memblokir respons HTTP ke pengguna.
